-- OS modes add scope and invitations without changing the existing question engine.
alter table axioma_private.clay_sessions add column os_mode text check(os_mode in ('online','group','classroom'));
alter table axioma_private.clay_sessions add column os_class text;
alter table axioma_private.clay_sessions add column os_targets uuid[] not null default '{}';
create function axioma_private.clay_os_membership() returns trigger language plpgsql security definer set search_path='' as $$
declare s axioma_private.clay_sessions%rowtype;
begin
 select * into s from axioma_private.clay_sessions where id=new.session_id for update;
 if s.os_mode='classroom' and new.user_id=s.host_id then
  if tg_op='UPDATE' and new.version<>old.version then raise exception 'De leerkracht volgt de klas en schiet niet mee.';end if;
  new.participated:=false;
 end if;
 if s.os_mode is null or new.left_at is not null or new.user_id=s.host_id then return new;end if;
 if not exists(select 1 from public.axioma_profiles p where p.user_id=new.user_id and p.class_code=s.os_class) or (cardinality(s.os_targets)>0 and not new.user_id=any(s.os_targets)) then raise exception 'Deze uitnodiging is niet voor jou.';end if;
 if s.os_mode='online' and exists(select 1 from axioma_private.clay_members m where m.session_id=s.id and m.user_id not in (s.host_id,new.user_id) and m.left_at is null) then raise exception 'Dit duel heeft al twee spelers.';end if;
 return new;
end;$$;
revoke all on function axioma_private.clay_os_membership() from public,anon,authenticated;
create trigger clay_os_membership before insert or update of left_at,tab_id,version,participated on axioma_private.clay_members for each row execute function axioma_private.clay_os_membership();
create table axioma_private.clay_rewards (
 session_id uuid references axioma_private.clay_sessions(id),user_id uuid references auth.users(id),class_code text,
 xp integer not null check(xp>=0),winner boolean not null,created_at timestamptz default now(),primary key(session_id,user_id)
);
alter table axioma_private.clay_rewards enable row level security;
revoke all on axioma_private.clay_rewards from public,anon,authenticated;
create index clay_rewards_user on axioma_private.clay_rewards(user_id);
create index clay_sessions_os_class on axioma_private.clay_sessions(os_class,created_at desc) where os_mode is not null;
create index clay_rewards_class on axioma_private.clay_rewards(class_code,user_id);
create function axioma_private.clay_reward() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.os_mode is not null and new.status='finished' and old.status<>'finished' then
  insert into axioma_private.clay_rewards(session_id,user_id,class_code,xp,winner)
  select new.id,m.user_id,coalesce(new.os_class,p.class_code),10+case when m.user_id=new.winner_id then 10 else 0 end,m.user_id=new.winner_id
  from axioma_private.clay_members m join public.axioma_profiles p on p.user_id=m.user_id
  where m.session_id=new.id and m.participated and m.version>0 and not exists(select 1 from axioma_private.teachers t where t.user_id=m.user_id)
  on conflict do nothing;
 end if;return new;
end;$$;
revoke all on function axioma_private.clay_reward() from public,anon,authenticated;
create trigger clay_reward after update of status on axioma_private.clay_sessions for each row execute function axioma_private.clay_reward();
create or replace function axioma_private.clay_os(
  p_action text,p_tab_id uuid,p_session_id uuid default null,p_speed integer default 5,
  p_answer numeric default null,p_event_id uuid default null,p_version integer default null,p_question_version integer default 2,p_mode text default 'group',p_targets uuid[] default null,p_class_code text default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  uid uuid := auth.uid(); current_session axioma_private.clay_sessions%rowtype;
  member axioma_private.clay_members%rowtype;
  ts timestamptz := clock_timestamp(); right_answer boolean;
  expected numeric[] := array[1,-1,2,-0.5,0.5,-2,0];
  chosen_class text; is_teacher boolean:=public.axioma_is_teacher(); peers jsonb; sessions jsonb; members jsonb; ranking jsonb; current_json jsonb; question jsonb;
begin
  if uid is null or p_tab_id is null then raise exception 'Log eerst in om in groep te spelen.'; end if;
  if not exists(select 1 from public.axioma_profiles where user_id=uid)
    and not exists(select 1 from axioma_private.teachers where user_id=uid)
    then raise exception 'Geen platformaccount gevonden.'; end if;
  chosen_class:=case when is_teacher then p_class_code else (select p.class_code from public.axioma_profiles p where p.user_id=uid) end;
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
      if p_mode not in ('online','group','classroom') or p_mode is null then raise exception 'Kies duo, groep of klas.';end if;
      if p_mode='classroom' and not is_teacher then raise exception 'Alleen de leerkracht start een klasbattle.';end if;
      if chosen_class is null or not exists(select 1 from public.axioma_profiles p where p.class_code=chosen_class) then raise exception 'Kies een klas.';end if;
      if p_mode='online' and coalesce(cardinality(p_targets),0)<>1 then raise exception 'Kies één klasgenoot voor je duel.';end if;
      if exists(select 1 from unnest(p_targets) target where target=uid or not exists(select 1 from public.axioma_profiles p where p.user_id=target and p.class_code=chosen_class)) then raise exception 'Kies leerlingen uit dezelfde klas.';end if;
      insert into axioma_private.clay_sessions(host_id,speed,question_version,os_mode,os_class,os_targets) values(uid,p_speed,p_question_version,p_mode,chosen_class,coalesce(p_targets,'{}')) returning * into current_session;
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
      update axioma_private.clay_members set next_at=ts+interval '5 seconds',participated=not (current_session.os_mode='classroom' and user_id=current_session.host_id)
        where session_id=p_session_id and left_at is null;
    elsif p_action='leave' then
      update axioma_private.clay_members set left_at=coalesce(left_at,ts) where session_id=p_session_id and user_id=uid;
      if (current_session.host_id=uid and current_session.status='waiting')
        or not exists(select 1 from axioma_private.clay_members where session_id=p_session_id and left_at is null)
        then update axioma_private.clay_sessions set status='cancelled',ends_at=ts where id=p_session_id and status in('waiting','running'); end if;
    elsif p_action='answer' then
      if current_session.os_mode='classroom' and uid=current_session.host_id then raise exception 'De leerkracht volgt de klas en schiet niet mee.';end if;
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
    select s.id,s.host_id,s.speed,s.question_version,s.os_mode,s.os_class,s.os_targets,s.created_at,coalesce(p.alias,'Leerkracht') as host_alias,
      (select count(*) from axioma_private.clay_members m where m.session_id=s.id and m.left_at is null) as player_count
    from axioma_private.clay_sessions s left join public.axioma_profiles p on p.user_id=s.host_id
    where s.status='waiting' and (s.host_id=uid or (s.os_class=(select p.class_code from public.axioma_profiles p where p.user_id=uid) and (cardinality(s.os_targets)=0 or uid=any(s.os_targets)))) and exists(select 1 from axioma_private.clay_members m
      where m.session_id=s.id and m.user_id=s.host_id and m.left_at is null and m.seen_at>ts-interval '75 seconds')
    order by s.created_at desc limit 30) x;
  if p_action='ranking' then
    select coalesce(jsonb_agg(x order by x.rank),'[]'::jsonb) into ranking from (
      select dense_rank() over(order by count(*) desc,min(s.elapsed_ms)) as rank,
        s.winner_id as user_id,coalesce(p.alias,'Leerkracht') as alias,
        count(*) as wins,min(s.elapsed_ms) as best_ms
      from axioma_private.clay_sessions s left join public.axioma_profiles p on p.user_id=s.winner_id
      where s.status='finished' and s.winner_id is not null and s.speed=p_speed and s.os_class=chosen_class
      group by s.winner_id,p.alias order by wins desc,best_ms limit 100) x;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',p.user_id,'alias',p.alias,'class_code',p.class_code) order by p.alias),'[]') into peers from public.axioma_profiles p where (is_teacher or p.class_code=chosen_class) and p.user_id<>uid and not exists(select 1 from axioma_private.teachers t where t.user_id=p.user_id);
  return jsonb_build_object('peers',peers,'sessions',sessions,'current',current_json,'member',case when member.user_id is null then null else to_jsonb(member) end,
    'members',coalesce(members,'[]'::jsonb),'ranking',ranking,'server_time',clock_timestamp());
end;
$$;
revoke all on function axioma_private.clay_os(text,uuid,uuid,integer,numeric,uuid,integer,integer,text,uuid[],text) from public,anon;
grant execute on function axioma_private.clay_os(text,uuid,uuid,integer,numeric,uuid,integer,integer,text,uuid[],text) to authenticated;
create or replace function public.axioma_clay_os(p_action text,p_tab_id uuid,p_session_id uuid default null,p_speed integer default 5,
 p_answer numeric default null,p_event_id uuid default null,p_version integer default null,p_mode text default 'group',p_targets uuid[] default null,p_class_code text default null)
returns jsonb language sql security invoker set search_path='' as $$
 select axioma_private.clay_os(p_action,p_tab_id,p_session_id,p_speed,p_answer,p_event_id,p_version,2,p_mode,p_targets,p_class_code);
$$;
revoke all on function public.axioma_clay_os(text,uuid,uuid,integer,numeric,uuid,integer,text,uuid[],text) from public,anon;
grant execute on function public.axioma_clay_os(text,uuid,uuid,integer,numeric,uuid,integer,text,uuid[],text) to authenticated;


create function axioma_private.clay_results(chosen_class text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); teacher boolean:=public.axioma_is_teacher(); c text; leaders jsonb; rooms jsonb; own_xp bigint;
begin
 if uid is null then raise exception 'Log eerst in.';end if;
 c:=case when teacher then chosen_class else (select class_code from public.axioma_profiles where user_id=uid) end;
 select coalesce(jsonb_agg(x order by x.place,x.alias),'[]') into leaders from (
 select dense_rank() over(order by sum(r.xp) desc,count(*) filter(where r.winner) desc) as place,p.user_id,p.alias,p.user_id=uid as mine,'kleiduifschieten' as game,sum(r.xp) as points,count(*) filter(where r.winner) as wins,count(*) as played
 from axioma_private.clay_rewards r join public.axioma_profiles p on p.user_id=r.user_id where r.class_code=c group by p.user_id,p.alias) x;
 select coalesce(sum(xp),0) into own_xp from axioma_private.clay_rewards where user_id=uid;
 if teacher then
  select coalesce(jsonb_agg(x order by x.created_at desc),'[]') into rooms from (
   select s.id,s.created_at,s.os_mode,s.status,s.speed,s.winner_id,
    (select jsonb_agg(jsonb_build_object('alias',p.alias,'streak',m.streak,'misses',m.misses,'answers',m.version,'xp',coalesce(r.xp,0),'winner',s.winner_id=m.user_id) order by p.alias)
     from axioma_private.clay_members m join public.axioma_profiles p on p.user_id=m.user_id left join axioma_private.clay_rewards r on r.session_id=m.session_id and r.user_id=m.user_id where m.session_id=s.id) as members
   from axioma_private.clay_sessions s where s.os_class=c order by s.created_at desc limit 50) x;
 end if;
 return jsonb_build_object('leaderboards',leaders,'results',coalesce(rooms,'[]'),'xp',own_xp);
end;$$;
revoke all on function axioma_private.clay_results(text) from public,anon;
grant execute on function axioma_private.clay_results(text) to authenticated;
create function public.axioma_clay_results(p_class_code text default null) returns jsonb language sql security invoker set search_path='' as $$select axioma_private.clay_results(p_class_code)$$;
revoke all on function public.axioma_clay_results(text) from public,anon;
grant execute on function public.axioma_clay_results(text) to authenticated;

-- Older bookmarks keep working, but all OS room actions use the same checks.
alter function axioma_private.clay_v2(text,uuid,uuid,integer,numeric,uuid,integer,integer) rename to clay_legacy_v2;
revoke all on function axioma_private.clay_legacy_v2(text,uuid,uuid,integer,numeric,uuid,integer,integer) from public,anon,authenticated;
create function axioma_private.clay_v2(p_action text,p_tab_id uuid,p_session_id uuid default null,p_speed integer default 5,
 p_answer numeric default null,p_event_id uuid default null,p_version integer default null,p_question_version integer default 2)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb; s axioma_private.clay_sessions%rowtype;
begin
 select * into s from axioma_private.clay_sessions where id=p_session_id;
 if s.os_mode is not null then
  return axioma_private.clay_os(p_action,p_tab_id,p_session_id,p_speed,p_answer,p_event_id,p_version,2,s.os_mode,null,s.os_class);
 end if;
 r:=axioma_private.clay_legacy_v2(p_action,p_tab_id,p_session_id,p_speed,p_answer,p_event_id,p_version,p_question_version);
 return jsonb_set(r,'{sessions}',coalesce((select jsonb_agg(e) from jsonb_array_elements(r->'sessions') e
 where exists(select 1 from axioma_private.clay_sessions room where room.id=(e->>'id')::uuid and room.os_mode is null)),'[]'));
end;$$;
revoke all on function axioma_private.clay_v2(text,uuid,uuid,integer,numeric,uuid,integer,integer) from public,anon;
grant execute on function axioma_private.clay_v2(text,uuid,uuid,integer,numeric,uuid,integer,integer) to authenticated;

notify pgrst,'reload schema';
