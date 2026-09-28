-- Late arrivals join the roster immediately, and play from the next full round.
-- Existing memberships retain their original eligibility.
alter table axioma_private.vector_class_members add column eligible_from_round integer not null default 0 check (eligible_from_round >= 0);

create or replace function axioma_private.vector_class(p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); r axioma_private.vector_class_rooms%rowtype; spec jsonb; entry jsonb;
 alias_name text; roster jsonb; submissions jsonb; mine jsonb; n integer; attempts integer:=0;
 stamp timestamptz; requested_id uuid; is_owner boolean; new_code text;
begin
 if uid is null then raise exception 'Meld je eerst aan.' using errcode='42501'; end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>100000 then raise exception 'Ongeldig verzoek.'; end if;
 if p_action='create' then
  if not public.axioma_is_teacher() then raise exception 'Alleen een leerkracht kan een sessie starten.' using errcode='42501'; end if;
  -- One active room per teacher, including concurrent creation requests.
  perform pg_advisory_xact_lock(hashtextextended(uid::text,428));
  select * into r from axioma_private.vector_class_rooms where owner_id=uid and phase not in ('closed','finished') and expires_at>now() order by created_at desc limit 1 for update;
  if not found then
   if jsonb_typeof(p_data->'deck') is distinct from 'array' or jsonb_array_length(p_data->'deck') not in (5,10) then raise exception 'Kies 5 of 10 rondes.'; end if;
   if (p_data->>'seconds')::integer not in (30,60,90,120) or p_data->>'seconds' is null then raise exception 'Ongeldige rondetijd.'; end if;
   for spec in select value from jsonb_array_elements(p_data->'deck') loop
    if jsonb_typeof(spec)<>'object' or coalesce(spec->>'skill','') not in ('props','equal','free','opposite','scalar','sum','headtail','commute','parallelogram','difference','figure','coords','arrow','ab','points','basis','coordadd','coordscale','coordcombo','decompose','combination','unknown','route','fourth')
     or coalesce(spec->>'seed','') !~ '^\d{1,10}$' or coalesce(spec->>'variant','') !~ '^[0-3]$' then raise exception 'Ongeldige vraag.'; end if;
   end loop;
   loop
    attempts:=attempts+1; new_code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    begin
     insert into axioma_private.vector_class_rooms(code,owner_id,deck,seconds) values(new_code,uid,p_data->'deck',(p_data->>'seconds')::integer) returning * into r; exit;
    exception when unique_violation then if attempts>=10 then raise exception 'Probeer opnieuw een sessie te maken.'; end if; end;
   end loop;
  end if;
 elsif p_action='join' then
  select alias into alias_name from public.axioma_profiles where user_id=uid;
  if not found or public.axioma_is_teacher() then raise exception 'Doe mee met een leerlingaccount.' using errcode='42501'; end if;
  select * into r from axioma_private.vector_class_rooms where code=upper(trim(p_data->>'code')) and expires_at>now() for update;
  if not found then raise exception 'Deze code bestaat niet of is verlopen.'; end if;
  if not exists(select 1 from axioma_private.vector_class_members where room_id=r.id and user_id=uid) then
   if r.phase in ('closed','finished') then raise exception 'Deze sessie is afgelopen. Vraag je leerkracht om een nieuwe code.'; end if;
   if (select count(*) from axioma_private.vector_class_members where room_id=r.id)>=100 then raise exception 'Deze sessie zit vol.'; end if;
   insert into axioma_private.vector_class_members(room_id,user_id,alias,eligible_from_round) values(r.id,uid,alias_name,r.round+1);
  end if;
 else
  requested_id:=(p_data->>'id')::uuid;
  select * into r from axioma_private.vector_class_rooms where id=requested_id for update;
  if not found or r.expires_at<=now() then raise exception 'Deze sessie is verlopen.'; end if;
 end if;
 is_owner:=r.owner_id=uid;
 if not is_owner and not exists(select 1 from axioma_private.vector_class_members where room_id=r.id and user_id=uid) then raise exception 'Je neemt niet deel aan deze sessie.' using errcode='42501'; end if;
 if p_action in ('start','next','close','grade') and not is_owner then raise exception 'Alleen de leerkracht bedient de sessie.' using errcode='42501'; end if;
 stamp:=clock_timestamp();
 if r.phase='question' and stamp>=r.deadline then r.phase:='grading'; end if;
 if p_action in ('start','next') then
  if (p_action='start' and r.phase<>'lobby') or (p_action='next' and r.phase<>'results') then raise exception 'Deze ronde kan nu niet starten.'; end if;
  if not exists(select 1 from axioma_private.vector_class_members where room_id=r.id) then raise exception 'Wacht tot minstens één leerling deelneemt.'; end if;
  if r.round+1>=jsonb_array_length(r.deck) then r.phase:='finished';
  else r.round:=r.round+1; r.phase:='question';r.started_at:=stamp;r.deadline:=stamp+make_interval(secs=>r.seconds); end if;
 elsif p_action='submit' then
  if is_owner then raise exception 'De leerkracht speelt niet mee.'; end if;
  if exists(select 1 from axioma_private.vector_class_members where room_id=r.id and user_id=uid and eligible_from_round>r.round) then raise exception 'Je speelt mee vanaf de volgende ronde.'; end if;
  if (p_data->>'round')::integer is distinct from r.round then raise exception 'Deze ronde is voorbij.'; end if;
  -- Retries are idempotent, even after the deadline.
  if not exists(select 1 from axioma_private.vector_class_answers where room_id=r.id and round=r.round and user_id=uid) then
   if r.phase<>'question' then raise exception 'De tijd is voorbij.'; end if;
   if jsonb_typeof(p_data->'answer') is distinct from 'object' or octet_length((p_data->'answer')::text)>16000 then raise exception 'Ongeldig antwoord.'; end if;
   insert into axioma_private.vector_class_answers(room_id,user_id,round,answer,skipped,elapsed_ms,received_at)
   values(r.id,uid,r.round,p_data->'answer',coalesce((p_data->>'skipped')::boolean,false),greatest(0,floor(extract(epoch from stamp-r.started_at)*1000)::integer),stamp);
  end if;
 elsif p_action='grade' then
  if r.phase not in ('grading','results') or (p_data->>'round')::integer is distinct from r.round then raise exception 'Deze ronde kan nu niet worden nagekeken.'; end if;
  if r.phase='grading' then
   if jsonb_typeof(p_data->'grades') is distinct from 'array' then raise exception 'Ongeldige beoordeling.'; end if;
   for entry in select value from jsonb_array_elements(p_data->'grades') loop
    update axioma_private.vector_class_answers set correct=(entry->>'correct')::boolean and not skipped,
      points=case when (entry->>'correct')::boolean and not skipped then 500+greatest(0,500-floor(500.0*elapsed_ms/(r.seconds*1000))::integer) else 0 end
    where room_id=r.id and round=r.round and user_id=(entry->>'user_id')::uuid and correct is null;
   end loop;
   if not exists(select 1 from axioma_private.vector_class_answers where room_id=r.id and round=r.round and correct is null) then r.phase:='results'; end if;
  end if;
 elsif p_action='close' then r.phase:='closed';
 elsif p_action='leave' then
  if is_owner or r.phase<>'lobby' then raise exception 'Verlaten kan alleen in de wachtkamer.'; end if;
  delete from axioma_private.vector_class_members where room_id=r.id and user_id=uid;return '{"left":true}'::jsonb;
 elsif p_action not in ('state','create','join') then raise exception 'Onbekende actie.';
 end if;
 if r.phase='question' and not exists(select 1 from axioma_private.vector_class_members m where m.room_id=r.id and m.eligible_from_round<=r.round and not exists(select 1 from axioma_private.vector_class_answers a where a.room_id=r.id and a.round=r.round and a.user_id=m.user_id)) then r.phase:='grading'; end if;
 update axioma_private.vector_class_rooms set phase=r.phase,round=r.round,started_at=r.started_at,deadline=r.deadline where id=r.id;
 select coalesce(jsonb_agg(row_to_json(p) order by p.points desc,p.alias,p.user_id),'[]') into roster from (
  select m.user_id,m.alias,m.eligible_from_round,coalesce(sum(a.points) filter(where a.round<r.round or r.phase in ('results','finished','closed')),0)::integer as points,
   coalesce(sum(a.points) filter(where a.round<r.round),0)::integer as previous_points,
   count(a.*) filter(where a.round=r.round)>0 as answered,
   coalesce(bool_or(a.correct) filter(where a.round=r.round and r.phase in ('results','finished','closed')),false) as correct
  from axioma_private.vector_class_members m left join axioma_private.vector_class_answers a on a.room_id=m.room_id and a.user_id=m.user_id where m.room_id=r.id group by m.user_id,m.alias,m.eligible_from_round
 ) p;
 select jsonb_build_object('submitted',true,'correct',case when r.phase in ('results','finished','closed') then a.correct else null end,'points',case when r.phase in ('results','finished','closed') then a.points else 0 end) into mine from axioma_private.vector_class_answers a where a.room_id=r.id and a.round=r.round and a.user_id=uid;
 if is_owner and r.phase='grading' then
  select coalesce(jsonb_agg(jsonb_build_object('user_id',user_id,'answer',answer,'skipped',skipped)),'[]') into submissions from axioma_private.vector_class_answers where room_id=r.id and round=r.round;
 end if;
 return jsonb_build_object('id',r.id,'code',r.code,'owner',is_owner,'phase',r.phase,'round',r.round,'total',jsonb_array_length(r.deck),'seconds',r.seconds,'deadline',r.deadline,'server_time',clock_timestamp(),'spec',case when r.round>=0 then r.deck->r.round else null end,'members',roster,'mine',mine,'submissions',submissions);
end;
$$;
revoke all on function axioma_private.vector_class(text,jsonb) from public,anon,authenticated;
grant usage on schema axioma_private to authenticated;
grant execute on function axioma_private.vector_class(text,jsonb) to authenticated;
create or replace function public.axioma_vector_class(p_action text,p_data jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$ select axioma_private.vector_class(p_action,p_data); $$;
revoke all on function public.axioma_vector_class(text,jsonb) from public,anon,authenticated;
grant execute on function public.axioma_vector_class(text,jsonb) to authenticated;
