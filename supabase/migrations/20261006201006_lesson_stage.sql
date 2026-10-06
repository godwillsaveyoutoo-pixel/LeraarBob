-- Lesson Stage extends existing Rechten classroom rooms, membership and answers.
-- Apply after 20260929235623_rechten_class_server_grading.sql.
begin;
create table if not exists axioma_private.lesson_stages (
 room_id uuid primary key references axioma_private.vector_class_rooms(id) on delete cascade,
 active_poll text, mode text not null default 'narrative'
);
create table if not exists axioma_private.lesson_polls (
 room_id uuid not null references axioma_private.lesson_stages(room_id) on delete cascade,
 id text not null, question text not null, options jsonb not null,
 anonymous boolean not null, closed boolean not null default false,
 counts jsonb not null, primary key(room_id,id)
);
-- Anonymous choices exist ONLY in aggregate counters. Receipts prevent duplicate
-- voting but contain no choice, time, sequence or answer association.
create table if not exists axioma_private.lesson_receipts (
 room_id uuid not null, poll_id text not null, user_id uuid not null,
 primary key(room_id,poll_id,user_id),
 foreign key(room_id,poll_id) references axioma_private.lesson_polls(room_id,id) on delete cascade
);
create table if not exists axioma_private.lesson_named_answers (
 room_id uuid not null, poll_id text not null, user_id uuid not null, choice integer not null,
 primary key(room_id,poll_id,user_id),
 foreign key(room_id,poll_id,user_id) references axioma_private.lesson_receipts(room_id,poll_id,user_id) on delete cascade
);
alter table axioma_private.lesson_stages enable row level security;
alter table axioma_private.lesson_polls enable row level security;
alter table axioma_private.lesson_receipts enable row level security;
alter table axioma_private.lesson_named_answers enable row level security;
revoke all on axioma_private.lesson_stages,axioma_private.lesson_polls,axioma_private.lesson_receipts,axioma_private.lesson_named_answers from public,anon,authenticated;

create or replace function axioma_private.lesson_stage(p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); r axioma_private.vector_class_rooms%rowtype; l axioma_private.lesson_stages%rowtype;
 p axioma_private.lesson_polls%rowtype; s jsonb; spec jsonb; counts jsonb; summary jsonb; named jsonb; history jsonb;
 choice integer; inserted integer; owner boolean;
begin
 if uid is null then raise exception 'Meld je eerst aan.' using errcode='42501'; end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>20000 then raise exception 'Ongeldig verzoek.'; end if;
 if p_action='create' then
  if not public.axioma_is_teacher() then raise exception 'Alleen een leerkracht kan een les starten.' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,428));
  select * into r from axioma_private.vector_class_rooms where owner_id=uid and game='rechten' and phase not in ('closed','finished') and expires_at>now() order by created_at desc limit 1 for update;
  if found then
   if not exists(select 1 from axioma_private.lesson_stages where room_id=r.id) then raise exception 'Er loopt al een Rechtenwereld-battle. Rond die eerst af in Klasbattle.'; end if;
  else
   if jsonb_typeof(p_data->'deck') is distinct from 'array' or jsonb_array_length(p_data->'deck')<>20 then raise exception 'Deze les bevat 20 vragen.'; end if;
   for spec in select value from jsonb_array_elements(p_data->'deck') loop
    if coalesce(spec->>'skill','') not in ('point','point_plot','delta','slope','line_behavior','special_lines','zeroRead','zero','signchart','positive','negative','equation_from_ab','graph_from_equation','equation_from_graph','graph_from_table') or coalesce(spec->>'seed','') !~ '^\d{1,10}$' or coalesce(spec->>'variant','') !~ '^[0-3]$' then raise exception 'Ongeldige vraag.'; end if;
   end loop;
   select jsonb_agg(value order by ord) into s from jsonb_array_elements(p_data->'deck') with ordinality as x(value,ord) where ord<=5;
   s:=axioma_private.vector_class('create',jsonb_build_object('game','rechten','deck',s,'seconds',120,'server_grading',true));
   update axioma_private.vector_class_rooms set deck=p_data->'deck',server_grading=true where id=(s->>'id')::uuid returning * into r;
   insert into axioma_private.lesson_stages(room_id) values(r.id);
  end if;
 else
  select * into r from axioma_private.vector_class_rooms where id=(p_data->>'id')::uuid for update;
 end if;
 if r.id is null or r.expires_at<=now() then raise exception 'Deze les is verlopen.'; end if;
 owner:=r.owner_id=uid;
 if not owner and not exists(select 1 from axioma_private.vector_class_members where room_id=r.id and user_id=uid) then raise exception 'Je neemt niet deel aan deze sessie.' using errcode='42501'; end if;
 select * into l from axioma_private.lesson_stages where room_id=r.id;
 if not found then raise exception 'Deze code hoort niet bij een Lesson Stage.'; end if;
 if p_action in ('open_poll','close_poll','mode','end_round') and not owner then raise exception 'Alleen de leerkracht bedient de les.' using errcode='42501'; end if;
 if p_action not in ('state','create') and r.phase in ('closed','finished') then raise exception 'Deze sessie is afgelopen.'; end if;
 if p_action='end_round' then
  if r.phase='question' then update axioma_private.vector_class_rooms set deadline=clock_timestamp() where id=r.id; end if;
 elsif p_action='open_poll' then
  if r.phase in ('question','grading') then raise exception 'Rond eerst de actieve battlevraag af.'; end if;
  if length(coalesce(p_data->>'poll','')) not between 1 and 80 or length(trim(coalesce(p_data->>'question',''))) not between 1 and 300
   or jsonb_typeof(p_data->'options') is distinct from 'array' or jsonb_array_length(p_data->'options') not between 2 and 6 then raise exception 'Geef een vraag met 2 tot 6 keuzes.'; end if;
  if exists(select 1 from jsonb_array_elements(p_data->'options') x where jsonb_typeof(x)<>'string' or length(trim(x#>>'{}')) not between 1 and 100) then raise exception 'Ongeldige keuzes.'; end if;
  select jsonb_agg(0) into counts from jsonb_array_elements(p_data->'options');
  insert into axioma_private.lesson_polls(room_id,id,question,options,anonymous,counts)
   values(r.id,p_data->>'poll',p_data->>'question',p_data->'options',coalesce((p_data->>'anonymous')::boolean,true),counts) on conflict do nothing;
  -- Revisiting a poll never reopens or resets it.
  update axioma_private.lesson_stages set active_poll=p_data->>'poll',mode='poll' where room_id=r.id returning * into l;
 elsif p_action='close_poll' then
  update axioma_private.lesson_polls set closed=true where room_id=r.id and id=l.active_poll;
 elsif p_action='mode' then
  if coalesce(p_data->>'mode','') not in ('narrative','poll','battle') then raise exception 'Ongeldige lesmodus.'; end if;
  update axioma_private.lesson_stages set mode=p_data->>'mode' where room_id=r.id returning * into l;
 elsif p_action='vote' then
  if owner then raise exception 'De leerkracht stemt niet mee.'; end if;
  select * into p from axioma_private.lesson_polls where room_id=r.id and id=l.active_poll for update;
  if p.id is null or p.id is distinct from p_data->>'poll' then raise exception 'Deze vraag is niet actief.'; end if;
  if not exists(select 1 from axioma_private.lesson_receipts where room_id=r.id and poll_id=p.id and user_id=uid) then
   if p.closed or l.mode<>'poll' then raise exception 'De stemming is gesloten.'; end if;
   choice:=(p_data->>'choice')::integer;
   if choice is null or choice<0 or choice>=jsonb_array_length(p.options) then raise exception 'Ongeldige keuze.'; end if;
   insert into axioma_private.lesson_receipts values(r.id,p.id,uid) on conflict do nothing;
   get diagnostics inserted=row_count;
   if inserted=1 then
    update axioma_private.lesson_polls v set counts=jsonb_set(v.counts,array[choice::text],to_jsonb((v.counts->>choice)::integer+1)) where v.room_id=r.id and v.id=p.id;
    if not p.anonymous then insert into axioma_private.lesson_named_answers values(r.id,p.id,uid,choice); end if;
   end if;
  end if;
 elsif p_action not in ('state','create') then raise exception 'Onbekende lesactie.';
 end if;
 select * into p from axioma_private.lesson_polls where room_id=r.id and id=l.active_poll;
 -- No interim counts or voter roster: cannot correlate a vote with a changing bar.
 if p.closed and not p.anonymous and owner then
  select jsonb_agg(jsonb_build_object('alias',m.alias,'choice',a.choice)) into named from axioma_private.lesson_named_answers a join axioma_private.vector_class_members m on m.room_id=a.room_id and m.user_id=a.user_id where a.room_id=r.id and a.poll_id=p.id;
 end if;
 select coalesce(jsonb_agg(row_to_json(x)),'[]') into summary from (
  select r.deck->n->>'skill' as skill,count(*)::integer as opportunities,
   count(a.user_id)::integer as answered,count(*) filter(where a.correct)::integer as correct
  from generate_series(0,r.round) n join axioma_private.vector_class_members m on m.room_id=r.id and m.eligible_from_round<=n
  left join axioma_private.vector_class_answers a on a.room_id=r.id and a.round=n and a.user_id=m.user_id
  where n<r.round or r.phase in ('results','finished','closed') group by r.deck->n->>'skill'
 ) x;
 select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'question',v.question,'options',v.options,'counts',v.counts,'closed',true,'anonymous',v.anonymous)),'[]') into history from axioma_private.lesson_polls v where v.room_id=r.id and v.closed;
 return jsonb_build_object('room',r.id,'mode',l.mode,'summary',summary,'history',history,'poll',case when p.id is null then null else jsonb_build_object(
  'id',p.id,'question',p.question,'options',p.options,'anonymous',p.anonymous,'closed',p.closed,
  'counts',case when p.closed then p.counts else null end,'named',named,
  'voted',exists(select 1 from axioma_private.lesson_receipts where room_id=r.id and poll_id=p.id and user_id=uid)) end);
end $$;
revoke all on function axioma_private.lesson_stage(text,jsonb) from public,anon,authenticated;
grant execute on function axioma_private.lesson_stage(text,jsonb) to authenticated;
create or replace function public.axioma_lesson_stage(p_action text,p_data jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$select axioma_private.lesson_stage(p_action,p_data)$$;
revoke all on function public.axioma_lesson_stage(text,jsonb) from public,anon,authenticated;
grant execute on function public.axioma_lesson_stage(text,jsonb) to authenticated;
commit;
