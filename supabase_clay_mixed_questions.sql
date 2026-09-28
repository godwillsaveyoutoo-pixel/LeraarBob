-- Apply after supabase_clay_groups.sql; preserves all existing sessions and scores.
alter table axioma_private.clay_sessions add column if not exists question_version integer not null default 1 check(question_version in(1,2));

-- Deterministic stream: four core questions and one variation per five attempts.
-- The client uses the same integer arithmetic in axioma-clay-questions.js.
create or replace function axioma_private.clay_question_v2(p_session_id uuid,p_index integer)
returns jsonb language plpgsql immutable security invoker set search_path='' as $$
declare
 bank jsonb:='[{"n":0,"d":1},{"n":1,"d":2},{"n":-1,"d":2},{"n":1,"d":1},{"n":-1,"d":1},{"n":2,"d":1},{"n":-2,"d":1},{"n":1,"d":3},{"n":-1,"d":3},{"n":1,"d":4},{"n":-1,"d":4}]';
 seed bigint; rng bigint; core integer[]:=array[0,1,2,3,4,5,6]; candidates integer[]:=array[0,1,2,3,4,5,6]; picked integer[];
 i integer;j integer;tmp integer;special_at integer;special integer;chosen integer;candidate integer;
 block_no integer;slot integer;ordinal integer;side integer;decimal_form boolean;options jsonb;
begin
 if p_session_id is null or p_index is null or p_index<0 or p_index>1000000 then raise exception 'Ongeldige vragenreeks.';end if;
 seed:=(('x'||substr(replace(p_session_id::text,'-',''),1,8))::bit(32)::bigint)%2147483646+1;
 rng:=seed;
 for i in reverse 7..2 loop rng:=rng*48271%2147483647;j:=rng%i+1;tmp:=core[i];core[i]:=core[j];core[j]:=tmp;end loop;
 block_no:=p_index/5;slot:=p_index%5;rng:=(seed+block_no::bigint*104729)%2147483647;
 rng:=rng*48271%2147483647;special_at:=1+rng%4;
 rng:=rng*48271%2147483647;special:=7+rng%4;
 ordinal:=block_no*4+slot-case when slot>special_at then 1 else 0 end;
 chosen:=case when slot=special_at then special else core[ordinal%7+1] end;
 rng:=(seed+p_index::bigint*8191+17)%2147483647;
 rng:=rng*48271%2147483647;side:=case when rng%2=1 then 1 else -1 end;
 rng:=rng*48271%2147483647;decimal_form:=rng%4=0;
 picked:=array[chosen];
 for i in reverse 7..2 loop rng:=rng*48271%2147483647;j:=rng%i+1;tmp:=candidates[i];candidates[i]:=candidates[j];candidates[j]:=tmp;end loop;
 foreach candidate in array candidates loop
   if not exists(select 1 from unnest(picked) v where abs(degrees(atan((bank->v->>'n')::double precision/(bank->v->>'d')::double precision))-degrees(atan((bank->candidate->>'n')::double precision/(bank->candidate->>'d')::double precision)))<18) then picked:=array_append(picked,candidate);end if;
   exit when cardinality(picked)=3;
 end loop;
 for i in reverse 3..2 loop rng:=rng*48271%2147483647;j:=rng%i+1;tmp:=picked[i];picked[i]:=picked[j];picked[j]:=tmp;end loop;
 select jsonb_agg(bank->v order by ord) into options from unnest(picked) with ordinality x(v,ord);
 return (bank->chosen)||jsonb_build_object('id','mixed-'||p_index,'side',side,'decimal',decimal_form,'choices',options);
end;
$$;
revoke all on function axioma_private.clay_question_v2(uuid,integer) from public,anon,authenticated;

create or replace function axioma_private.clay_v2(
  p_action text,p_tab_id uuid,p_session_id uuid default null,p_speed integer default 5,
  p_answer numeric default null,p_event_id uuid default null,p_version integer default null,p_question_version integer default 2
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  uid uuid := auth.uid(); current_session axioma_private.clay_sessions%rowtype;
  member axioma_private.clay_members%rowtype;
  ts timestamptz := clock_timestamp(); right_answer boolean;
  expected numeric[] := array[1,-1,2,-0.5,0.5,-2,0];
  sessions jsonb; members jsonb; ranking jsonb; current_json jsonb; question jsonb;
begin
  if uid is null or p_tab_id is null then raise exception 'Log eerst in om in groep te spelen.'; end if;
  if not exists(select 1 from public.axioma_profiles where user_id=uid)
    and not exists(select 1 from axioma_private.teachers where user_id=uid)
    then raise exception 'Geen platformaccount gevonden.'; end if;
  if p_question_version is null or p_question_version not in (1,2) then raise exception 'Ongeldige vragenversie.'; end if;
  if p_action is null or p_action not in ('sync','create','join','start','answer','leave','ranking')
    then raise exception 'Ongeldige groepsactie.'; end if;
  -- The same lock as invitations prevents joining a race and accepting a naval
  -- invite simultaneously. A row lock below serializes the final answers.
  if p_action in ('create','join','start','leave') then perform pg_advisory_xact_lock(78192026); end if;
  update axioma_private.clay_sessions set status='cancelled',ends_at=ts
    where status in ('waiting','running') and created_at < ts-interval '2 hours';
  update axioma_private.clay_members m set left_at=ts
    where m.left_at is null and exists(select 1 from axioma_private.clay_sessions s
      where s.id=m.session_id and s.status in ('finished','cancelled'));

  if p_action in ('create','join') then
    if exists(select 1 from axioma_private.clay_members where user_id=uid and left_at is null)
      then raise exception 'Je neemt al deel aan een groepssessie. Verlaat die eerst.'; end if;
    if exists(select 1 from axioma_private.game_invitations where uid in(sender_id,recipient_id)
      and (status='accepted' or (status='pending' and expires_at>ts)))
      then raise exception 'Rond eerst je Zeeslag-uitnodiging of partij af.'; end if;
    if p_action='create' then
      if p_speed not in(3,5,8) or p_speed is null then raise exception 'Kies een geldig tempo.'; end if;
      if (select count(*) from axioma_private.clay_sessions where host_id=uid and created_at>ts-interval '1 minute')>=5
        then raise exception 'Wacht even voor je nog een sessie opent.'; end if;
      insert into axioma_private.clay_sessions(host_id,speed,question_version) values(uid,p_speed,p_question_version) returning * into current_session;
      p_session_id:=current_session.id;
    else
      select * into current_session from axioma_private.clay_sessions where id=p_session_id for update;
      if current_session.id is null or current_session.status<>'waiting' then raise exception 'Deze sessie is al gestart of gesloten.'; end if;
      if (select count(*) from axioma_private.clay_members where session_id=p_session_id and left_at is null)>=30
        then raise exception 'Deze sessie is vol (30 spelers).'; end if;
    end if;
    insert into axioma_private.clay_members(session_id,user_id,tab_id) values(p_session_id,uid,p_tab_id)
      on conflict(session_id,user_id) do update set left_at=null,tab_id=excluded.tab_id,seen_at=ts;
  elsif p_action in ('start','answer','leave') then
    select * into current_session from axioma_private.clay_sessions where id=p_session_id for update;
    select * into member from axioma_private.clay_members where session_id=p_session_id and user_id=uid;
    if current_session.id is null or member.user_id is null or member.tab_id<>p_tab_id
      then raise exception 'Open de sessie in het tabblad waarin je deelnam.'; end if;
    if p_action='start' then
      if current_session.host_id<>uid or current_session.status<>'waiting' or member.left_at is not null
        then raise exception 'Alleen de organisator kan een wachtende sessie starten.'; end if;
      update axioma_private.clay_members set left_at=ts where session_id=p_session_id and left_at is null and seen_at<ts-interval '75 seconds';
      if (select count(*) from axioma_private.clay_members where session_id=p_session_id and left_at is null)<2
        then raise exception 'Wacht tot minstens twee spelers deelnemen.'; end if;
      update axioma_private.clay_sessions set status='running',starts_at=ts+interval '5 seconds' where id=p_session_id;
      update axioma_private.clay_members set next_at=ts+interval '5 seconds',participated=true
        where session_id=p_session_id and left_at is null;
    elsif p_action='leave' then
      update axioma_private.clay_members set left_at=coalesce(left_at,ts) where session_id=p_session_id and user_id=uid;
      if (current_session.host_id=uid and current_session.status='waiting')
        or not exists(select 1 from axioma_private.clay_members where session_id=p_session_id and left_at is null)
        then update axioma_private.clay_sessions set status='cancelled',ends_at=ts where id=p_session_id and status in('waiting','running'); end if;
    elsif p_action='answer' then
      -- Retry of a lost response does not count twice, including the winning shot.
      if p_event_id is null then raise exception 'Antwoordcode ontbreekt.'; end if;
      if member.last_event_id is distinct from p_event_id then
        if current_session.status<>'running' or member.left_at is not null then raise exception 'Deze wedstrijd is afgelopen.'; end if;
        if p_version is distinct from member.version then raise exception 'Dit doel is al verwerkt. Vernieuw de sessie.'; end if;
        if ts<member.next_at then raise exception 'Wacht op het volgende doel.'; end if;
        if current_session.question_version=2 then
          question:=axioma_private.clay_question_v2(p_session_id,member.version);
          if p_answer is not null and not exists(select 1 from jsonb_array_elements(question->'choices') c where abs(p_answer-(c->>'n')::numeric/(c->>'d')::numeric)<0.000000001) then raise exception 'Kies een van de getoonde richtingen.';end if;
          right_answer:=coalesce(abs(p_answer-(question->>'n')::numeric/(question->>'d')::numeric)<0.000000001,false);
        else
          if p_answer is not null and p_answer not in(-2,-1,-0.5,0,0.5,1,2) then raise exception 'Ongeldige richting.'; end if;
          right_answer:=coalesce(p_answer=expected[member.streak+1],false);
        end if;
        right_answer:=right_answer and ts<=member.next_at+make_interval(secs=>current_session.speed);
        update axioma_private.clay_members set streak=case when right_answer then streak+1 else 0 end,
          misses=misses+case when right_answer then 0 else 1 end,version=version+1,
          last_event_id=p_event_id,last_correct=right_answer,next_at=ts+interval '800 milliseconds',seen_at=ts
          where session_id=p_session_id and user_id=uid returning * into member;
        if member.streak=7 then
          update axioma_private.clay_sessions set status='finished',winner_id=uid,ends_at=ts,
            elapsed_ms=greatest(0,floor(extract(epoch from(ts-starts_at))*1000)::integer)
            where id=p_session_id and status='running';
        end if;
      end if;
    end if;
  end if;

  update axioma_private.clay_members set seen_at=ts where user_id=uid and tab_id=p_tab_id and left_at is null;
  if p_session_id is null then
    select m.session_id into p_session_id from axioma_private.clay_members m
      join axioma_private.clay_sessions s on s.id=m.session_id
      where m.user_id=uid and (m.left_at is null or s.ends_at>ts-interval '5 minutes')
      order by m.joined_at desc limit 1;
  end if;
  select * into member from axioma_private.clay_members where session_id=p_session_id and user_id=uid;
  if member.user_id is not null then
    select to_jsonb(s)||jsonb_build_object('host_alias',coalesce(h.alias,'Leerkracht'),'winner_alias',coalesce(w.alias,'Leerkracht'))
      into current_json from axioma_private.clay_sessions s
      left join public.axioma_profiles h on h.user_id=s.host_id
      left join public.axioma_profiles w on w.user_id=s.winner_id where s.id=p_session_id;
    select coalesce(jsonb_agg(x order by x.streak desc,x.alias),'[]'::jsonb) into members from (
      select m.user_id,coalesce(p.alias,'Leerkracht') as alias,m.streak,m.misses,m.left_at,m.participated,
        m.seen_at>ts-interval '75 seconds' as online
      from axioma_private.clay_members m left join public.axioma_profiles p on p.user_id=m.user_id
      where m.session_id=p_session_id) x;
  end if;
  select coalesce(jsonb_agg(x order by x.created_at),'[]'::jsonb) into sessions from (
    select s.id,s.host_id,s.speed,s.question_version,s.created_at,coalesce(p.alias,'Leerkracht') as host_alias,
      (select count(*) from axioma_private.clay_members m where m.session_id=s.id and m.left_at is null) as player_count
    from axioma_private.clay_sessions s left join public.axioma_profiles p on p.user_id=s.host_id
    where s.status='waiting' and exists(select 1 from axioma_private.clay_members m
      where m.session_id=s.id and m.user_id=s.host_id and m.left_at is null and m.seen_at>ts-interval '75 seconds')
    order by s.created_at desc limit 30) x;
  if p_action='ranking' then
    select coalesce(jsonb_agg(x order by x.rank),'[]'::jsonb) into ranking from (
      select dense_rank() over(order by count(*) desc,min(s.elapsed_ms)) as rank,
        s.winner_id as user_id,coalesce(p.alias,'Leerkracht') as alias,
        count(*) as wins,min(s.elapsed_ms) as best_ms
      from axioma_private.clay_sessions s left join public.axioma_profiles p on p.user_id=s.winner_id
      where s.status='finished' and s.winner_id is not null and s.speed=p_speed
      group by s.winner_id,p.alias order by wins desc,best_ms limit 100) x;
  end if;
  return jsonb_build_object('sessions',sessions,'current',current_json,'member',case when member.user_id is null then null else to_jsonb(member) end,
    'members',coalesce(members,'[]'::jsonb),'ranking',ranking,'server_time',clock_timestamp());
end;
$$;
revoke all on function axioma_private.clay_v2(text,uuid,uuid,integer,numeric,uuid,integer,integer) from public,anon;
grant execute on function axioma_private.clay_v2(text,uuid,uuid,integer,numeric,uuid,integer,integer) to authenticated;
create or replace function public.axioma_clay_v2(p_action text,p_tab_id uuid,p_session_id uuid default null,p_speed integer default 5,
 p_answer numeric default null,p_event_id uuid default null,p_version integer default null)
returns jsonb language sql security invoker set search_path='' as $$
 select axioma_private.clay_v2(p_action,p_tab_id,p_session_id,p_speed,p_answer,p_event_id,p_version,2);
$$;
revoke all on function public.axioma_clay_v2(text,uuid,uuid,integer,numeric,uuid,integer) from public,anon;
grant execute on function public.axioma_clay_v2(text,uuid,uuid,integer,numeric,uuid,integer) to authenticated;

-- Old pages can finish old races. They cannot join/grade mixed races incorrectly.
create or replace function axioma_private.clay(p_action text,p_tab_id uuid,p_session_id uuid default null,p_speed integer default 5,
 p_answer numeric default null,p_event_id uuid default null,p_version integer default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Log eerst in.';end if;
 if p_action in ('join','start','answer') and exists(select 1 from axioma_private.clay_sessions where id=p_session_id and question_version=2) then
   raise exception 'Vernieuw de pagina om met de gemengde reeks mee te doen.';
 end if;
 result:=axioma_private.clay_v2(p_action,p_tab_id,p_session_id,p_speed,p_answer,p_event_id,p_version,1);
 return jsonb_set(result,'{sessions}',coalesce((select jsonb_agg(s) from jsonb_array_elements(result->'sessions') s where s->>'question_version'='1'),'[]'::jsonb));
end;
$$;
revoke all on function axioma_private.clay(text,uuid,uuid,integer,numeric,uuid,integer) from public,anon;
grant execute on function axioma_private.clay(text,uuid,uuid,integer,numeric,uuid,integer) to authenticated;
notify pgrst,'reload schema';
