-- Platformbrede onlinelijst en duurzame Zeeslag-uitnodigingen.
-- Alleen gecontroleerde RPC's hebben toegang tot deze privégegevens.
create table axioma_private.online_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  tab_id uuid not null,
  seen_at timestamptz not null default now(),
  match_id uuid,
  primary key (user_id, tab_id)
);
create index online_sessions_seen on axioma_private.online_sessions(seen_at);
alter table axioma_private.online_sessions enable row level security;
create policy online_sessions_rpc_only on axioma_private.online_sessions
  for all to authenticated using (false) with check (false);

create table axioma_private.game_invitations (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  sender_tab uuid not null,
  recipient_tab uuid,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','cancelled','expired','finished')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '90 seconds',
  updated_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index game_invitations_sender on axioma_private.game_invitations(sender_id, updated_at desc);
create index game_invitations_recipient on axioma_private.game_invitations(recipient_id, updated_at desc);
alter table axioma_private.game_invitations enable row level security;
create policy game_invitations_rpc_only on axioma_private.game_invitations
  for all to authenticated using (false) with check (false);
revoke all on axioma_private.online_sessions, axioma_private.game_invitations from public, anon, authenticated;

-- This private definer owns the state transitions; callers cannot supply an
-- identity or alias. The public API below is an invoker-only wrapper.
create function axioma_private.social(
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
revoke all on function axioma_private.social(text,uuid,uuid,uuid,uuid) from public, anon;
grant usage on schema axioma_private to authenticated;
grant execute on function axioma_private.social(text,uuid,uuid,uuid,uuid) to authenticated;

create function public.axioma_social(
  p_action text, p_tab_id uuid, p_target_id uuid default null,
  p_invite_id uuid default null, p_match_id uuid default null
) returns jsonb language sql security invoker set search_path = '' as $$
  select axioma_private.social(p_action,p_tab_id,p_target_id,p_invite_id,p_match_id);
$$;
revoke all on function public.axioma_social(text,uuid,uuid,uuid,uuid) from public, anon;
grant execute on function public.axioma_social(text,uuid,uuid,uuid,uuid) to authenticated;

create function axioma_private.can_join_naval(p_topic text)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from axioma_private.game_invitations i
    where p_topic = 'axioma:rechten-zeeslag:match:' || i.id::text
      and i.status = 'accepted' and (select auth.uid()) in (i.sender_id,i.recipient_id)
  );
$$;
revoke all on function axioma_private.can_join_naval(text) from public, anon;
grant execute on function axioma_private.can_join_naval(text) to authenticated;
create policy naval_participants_read on realtime.messages for select to authenticated
  using (axioma_private.can_join_naval((select realtime.topic())));
create policy naval_participants_write on realtime.messages for insert to authenticated
  with check (axioma_private.can_join_naval((select realtime.topic())));

insert into public.axioma_games(id,title,theme,game_type,progress_type,teacher_visible,active,sort_order,metadata)
values ('rechten-zeeslag','Rechten Zeeslag','Functies','game','score',false,true,45,
  '{"href":"games/rechten/zeeslag/","players":2}'::jsonb)
on conflict (id) do update set title=excluded.title, metadata=excluded.metadata, active=true, updated_at=now();
