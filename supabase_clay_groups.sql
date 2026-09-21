-- Group races: seven correct answers in a row, one server-selected winner.
create table axioma_private.clay_sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  speed integer not null check (speed in (3,5,8)),
  status text not null default 'waiting' check(status in ('waiting','running','finished','cancelled')),
  created_at timestamptz not null default now(),
  starts_at timestamptz,
  ends_at timestamptz,
  winner_id uuid references auth.users(id) on delete set null,
  elapsed_ms integer
);
create index clay_sessions_open on axioma_private.clay_sessions(status,created_at);
create index clay_sessions_winners on axioma_private.clay_sessions(winner_id) where winner_id is not null;
alter table axioma_private.clay_sessions enable row level security;
create policy clay_sessions_rpc_only on axioma_private.clay_sessions
  for all to authenticated using(false) with check(false);

create table axioma_private.clay_members (
  session_id uuid not null references axioma_private.clay_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tab_id uuid not null,
  joined_at timestamptz not null default now(),
  seen_at timestamptz not null default now(),
  left_at timestamptz,
  participated boolean not null default false,
  streak integer not null default 0 check(streak between 0 and 7),
  misses integer not null default 0,
  version integer not null default 0,
  next_at timestamptz,
  last_event_id uuid,
  last_correct boolean,
  primary key(session_id,user_id)
);
create unique index clay_one_session_per_player on axioma_private.clay_members(user_id) where left_at is null;
alter table axioma_private.clay_members enable row level security;
create policy clay_members_rpc_only on axioma_private.clay_members
  for all to authenticated using(false) with check(false);
revoke all on axioma_private.clay_sessions,axioma_private.clay_members from public,anon,authenticated;

create function axioma_private.clay(
  p_action text,p_tab_id uuid,p_session_id uuid default null,p_speed integer default 5,
  p_answer numeric default null,p_event_id uuid default null,p_version integer default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  uid uuid := auth.uid(); current_session axioma_private.clay_sessions%rowtype;
  member axioma_private.clay_members%rowtype;
  ts timestamptz := clock_timestamp(); right_answer boolean;
  expected numeric[] := array[1,-1,2,-0.5,0.5,-2,0];
  sessions jsonb; members jsonb; ranking jsonb; current_json jsonb;
begin
  if uid is null or p_tab_id is null then raise exception 'Log eerst in om in groep te spelen.'; end if;
  if not exists(select 1 from public.axioma_profiles where user_id=uid)
    and not exists(select 1 from axioma_private.teachers where user_id=uid)
    then raise exception 'Geen platformaccount gevonden.'; end if;
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
      insert into axioma_private.clay_sessions(host_id,speed) values(uid,p_speed) returning * into current_session;
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
        if p_answer is not null and p_answer not in(-2,-1,-0.5,0,0.5,1,2) then raise exception 'Ongeldige richting.'; end if;
        right_answer:=coalesce(p_answer=expected[member.streak+1],false)
          and ts<=member.next_at+make_interval(secs=>current_session.speed);
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
    select s.id,s.host_id,s.speed,s.created_at,coalesce(p.alias,'Leerkracht') as host_alias,
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
revoke all on function axioma_private.clay(text,uuid,uuid,integer,numeric,uuid,integer) from public,anon;
grant execute on function axioma_private.clay(text,uuid,uuid,integer,numeric,uuid,integer) to authenticated;
create function public.axioma_clay(p_action text,p_tab_id uuid,p_session_id uuid default null,p_speed integer default 5,
  p_answer numeric default null,p_event_id uuid default null,p_version integer default null)
returns jsonb language sql security invoker set search_path='' as $$
  select axioma_private.clay(p_action,p_tab_id,p_session_id,p_speed,p_answer,p_event_id,p_version);
$$;
revoke all on function public.axioma_clay(text,uuid,uuid,integer,numeric,uuid,integer) from public,anon;
grant execute on function public.axioma_clay(text,uuid,uuid,integer,numeric,uuid,integer) to authenticated;

-- Naval rankings start with the first completed match, within the player's class.
create function axioma_private.naval_ranking() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=auth.uid(); class text; result jsonb;
begin
  if uid is null then raise exception 'Log eerst in.'; end if;
  select class_code into class from public.axioma_profiles where user_id=uid;
  select coalesce(jsonb_agg(x order by x.rank,x.alias),'[]'::jsonb) into result from (
    with results as (
      select m.player1_id as user_id,(m.winner_id=m.player1_id)::int as won from public.axioma_multiplayer_matches m where game_id='rechten-zeeslag' and status='completed'
      union all
      select m.player2_id,(m.winner_id=m.player2_id)::int from public.axioma_multiplayer_matches m where game_id='rechten-zeeslag' and status='completed'
    ), totals as (
      select p.user_id,p.alias,count(*) as played,sum(r.won) as won,count(*)-sum(r.won) as lost,
        round(100.0*sum(r.won)/count(*),1) as win_pct
      from results r join public.axioma_profiles p on p.user_id=r.user_id
      where p.class_code is not distinct from class group by p.user_id,p.alias
    ) select dense_rank() over(order by win_pct desc,won desc,played desc) as rank,*,true as qualified
      from totals order by win_pct desc,won desc,played desc limit 100
  ) x;
  return result;
end;
$$;
revoke all on function axioma_private.naval_ranking() from public,anon;
grant execute on function axioma_private.naval_ranking() to authenticated;
create function public.axioma_naval_ranking() returns jsonb language sql stable security invoker set search_path='' as $$
  select axioma_private.naval_ranking();
$$;
revoke all on function public.axioma_naval_ranking() from public,anon;
grant execute on function public.axioma_naval_ranking() to authenticated;

-- Keep naval invitations and group membership mutually exclusive.
create or replace function axioma_private.social(
  p_action text, p_tab_id uuid, p_target_id uuid default null,
  p_invite_id uuid default null, p_match_id uuid default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  inv axioma_private.game_invitations%rowtype;
  result_id uuid;
  players jsonb;
  invitations jsonb;
begin
  if uid is null or p_tab_id is null then raise exception 'Log eerst in.'; end if;
  if not exists (select 1 from public.axioma_profiles where user_id = uid)
     and not exists (select 1 from axioma_private.teachers where user_id = uid)
    then raise exception 'Geen platformaccount gevonden.'; end if;
  if p_action not in ('sync','invite','accept','decline','cancel','join','finish','offline')
    then raise exception 'Ongeldige actie.'; end if;

  -- One short transaction lock makes simultaneous/crossed invitations and
  -- acceptance from multiple tabs atomic. Sync/heartbeat never takes this lock.
  if p_action in ('invite','accept','decline','cancel','join','finish') then
    perform pg_advisory_xact_lock(78192026);
  end if;
  update axioma_private.game_invitations set status = 'expired', updated_at = now()
    where status = 'pending' and expires_at <= now();
  update axioma_private.game_invitations i set status = 'finished', updated_at = now()
    where i.status = 'accepted' and i.updated_at < now() - interval '90 seconds'
    and not exists (select 1 from axioma_private.online_sessions s
      where s.match_id = i.id and s.seen_at > now() - interval '75 seconds');
  delete from axioma_private.online_sessions where seen_at < now() - interval '1 day';

  if p_action = 'offline' then
    delete from axioma_private.online_sessions where user_id = uid and tab_id = p_tab_id;
    return '{}'::jsonb;
  end if;

  if p_action = 'invite' then
    if p_target_id is null or p_target_id = uid then raise exception 'Kies een andere speler.'; end if;
    if exists(select 1 from axioma_private.clay_members m join axioma_private.clay_sessions s on s.id=m.session_id
      where m.user_id in(uid,p_target_id) and m.left_at is null and s.status in('waiting','running'))
      then raise exception 'Jij of deze speler neemt al deel aan een groepssessie.'; end if;
    if not exists (select 1 from axioma_private.online_sessions
      where user_id = p_target_id and seen_at > now() - interval '75 seconds')
      then raise exception 'Deze speler is niet meer online.'; end if;
    if exists (select 1 from axioma_private.game_invitations
      where status in ('pending','accepted')
      and (sender_id in (uid,p_target_id) or recipient_id in (uid,p_target_id)))
      then raise exception 'Jij of de andere speler heeft al een uitnodiging of partij.'; end if;
    if (select count(*) from axioma_private.game_invitations
      where sender_id = uid and created_at > now() - interval '1 minute') >= 5
      then raise exception 'Wacht even voordat je opnieuw uitnodigt.'; end if;
    insert into axioma_private.game_invitations(sender_id,recipient_id,sender_tab)
      values (uid,p_target_id,p_tab_id) returning id into result_id;
  elsif p_action in ('accept','decline','cancel','join','finish') then
    select * into inv from axioma_private.game_invitations
      where id = p_invite_id and uid in (sender_id,recipient_id) for update;
    if inv.id is null then raise exception 'Uitnodiging niet gevonden.'; end if;
    result_id := inv.id;
    if p_action in ('accept','decline') then
      if uid <> inv.recipient_id or inv.status <> 'pending' then
        raise exception 'Deze uitnodiging is al beantwoord of verlopen.';
      end if;
      if p_action='accept' and exists(select 1 from axioma_private.clay_members m join axioma_private.clay_sessions s on s.id=m.session_id
        where m.user_id in(uid,inv.sender_id) and m.left_at is null and s.status in('waiting','running'))
        then raise exception 'Rond eerst de groepssessie af.'; end if;
      if p_action = 'accept' and not exists (select 1 from axioma_private.online_sessions
        where user_id = inv.sender_id and seen_at > now() - interval '75 seconds')
        then raise exception 'De uitnodiger is niet meer online.'; end if;
      update axioma_private.game_invitations
        set status = case when p_action = 'accept' then 'accepted' else 'declined' end,
            recipient_tab = p_tab_id, updated_at = now()
        where id = inv.id;
    elsif p_action = 'cancel' then
      if uid <> inv.sender_id or inv.status <> 'pending' then
        raise exception 'Deze uitnodiging kan niet meer worden ingetrokken.';
      end if;
      update axioma_private.game_invitations set status = 'cancelled', updated_at = now() where id = inv.id;
    elsif p_action = 'join' then
      if inv.status <> 'accepted' then raise exception 'Deze partij is niet meer beschikbaar.'; end if;
      if (uid = inv.sender_id and inv.sender_tab <> p_tab_id)
        or (uid = inv.recipient_id and inv.recipient_tab is distinct from p_tab_id)
        then raise exception 'Open deze partij in het tabblad van je uitnodiging.'; end if;
      p_match_id := inv.id;
    elsif p_action = 'finish' then
      if inv.status = 'accepted' then
        update axioma_private.game_invitations set status = 'finished', updated_at = now() where id = inv.id;
      end if;
      p_match_id := null;
    end if;
  end if;

  -- A browser can mark only its own accepted match/tab as occupied.
  if p_match_id is not null and not exists (
    select 1 from axioma_private.game_invitations i where i.id = p_match_id
    and i.status = 'accepted' and
      ((i.sender_id = uid and i.sender_tab = p_tab_id) or
       (i.recipient_id = uid and i.recipient_tab = p_tab_id)))
    then p_match_id := null; end if;
  insert into axioma_private.online_sessions(user_id,tab_id,match_id)
    values(uid,p_tab_id,p_match_id)
    on conflict(user_id,tab_id) do update set seen_at = now(), match_id = excluded.match_id;

  select coalesce(jsonb_agg(p order by p.alias), '[]'::jsonb) into players from (
    select s.user_id as id, coalesce(p.alias,'Leerkracht') as alias,
      coalesce(p.class_code,'') as class_code,
      case when exists (select 1 from axioma_private.game_invitations i
        where i.status = 'accepted' and s.user_id in (i.sender_id,i.recipient_id))
        or exists(select 1 from axioma_private.clay_members cm join axioma_private.clay_sessions cs on cs.id=cm.session_id
          where cm.user_id=s.user_id and cm.left_at is null and cs.status in('waiting','running'))
        then 'playing' else 'available' end as status
    from (select distinct user_id from axioma_private.online_sessions
      where seen_at > now() - interval '75 seconds') s
    left join public.axioma_profiles p on p.user_id = s.user_id
  ) p;
  select coalesce(jsonb_agg(x order by x.created_at desc),'[]'::jsonb) into invitations from (
    select i.*, coalesce(s.alias,'Leerkracht') as sender_alias,
      coalesce(r.alias,'Leerkracht') as recipient_alias
    from axioma_private.game_invitations i
    left join public.axioma_profiles s on s.user_id = i.sender_id
    left join public.axioma_profiles r on r.user_id = i.recipient_id
    where uid in (i.sender_id,i.recipient_id)
      and (i.status in ('pending','accepted') or i.updated_at > now() - interval '5 minutes')
    order by i.created_at desc limit 20
  ) x;
  return jsonb_build_object('players',players,'invitations',invitations,'id',result_id,'server_time',now());
end;
$$;
