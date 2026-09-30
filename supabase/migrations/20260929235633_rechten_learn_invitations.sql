-- Reuse platform presence/invitations for cooperative groups; codes remain a fallback.
alter table axioma_private.game_invitations drop constraint game_invitations_game_check;
alter table axioma_private.game_invitations add constraint game_invitations_game_check
 check(game in ('rechten-zeeslag','rechten-duo','rechten-learn'));
alter table axioma_private.game_invitations add column learn_room_id uuid references axioma_private.rechten_learn_rooms(id) on delete cascade;
alter table axioma_private.game_invitations add constraint learn_invitation_room check((game='rechten-learn')=(learn_room_id is not null));
create index game_invitations_learn_room on axioma_private.game_invitations(learn_room_id) where learn_room_id is not null;
create unique index learn_invitation_pending_recipient on axioma_private.game_invitations(learn_room_id,recipient_id) where game='rechten-learn' and status='pending';

create function axioma_private.rechten_learn_busy(p_user uuid,p_except uuid default null) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from axioma_private.rechten_learn_members m join axioma_private.rechten_learn_rooms r on r.id=m.room_id
 where m.user_id=p_user and r.id is distinct from p_except and r.expires_at>now()
 and r.data->>'phase' not in('finished','paused') and not(coalesce(r.data->'left','[]'::jsonb)?p_user::text));
$$;
create function axioma_private.rechten_learn_eligible(p_user uuid,p_skill text) returns boolean
language sql stable security definer set search_path='' as $$
 select p_skill in('point_plot','delta') or (p_skill='graph_from_equation' and (
 'grenspas'=any(axioma_private.rechten_finished_worlds(p_user)) or exists(
 select 1 from public.axioma_game_progress g,jsonb_each(coalesce(g.state->'rechtenV2'->'missions','{}')) m
 where g.user_id=p_user and g.game_id='rechten-trainer' and m.value->>'world'='formulewerf')));
$$;
create function axioma_private.rechten_learn_invitation_cleanup() returns void
language plpgsql security definer set search_path='' as $$
begin
 update axioma_private.game_invitations i set status=case when i.expires_at<=clock_timestamp() then 'expired' else 'cancelled' end,updated_at=clock_timestamp()
 from axioma_private.rechten_learn_rooms r where i.learn_room_id=r.id and i.status='pending' and (
 i.expires_at<=clock_timestamp() or r.expires_at<=clock_timestamp() or r.data->>'phase'<>'lobby'
 or coalesce(r.data->'left','[]'::jsonb)?i.sender_id::text
 or not exists(select 1 from public.axioma_profiles s join public.axioma_profiles t on t.class_code=s.class_code where s.user_id=i.sender_id and t.user_id=i.recipient_id and s.class_code=r.class_code)
 or not axioma_private.rechten_learn_eligible(i.recipient_id,r.data->>'skill'));
 update axioma_private.game_invitations i set status='finished',updated_at=clock_timestamp()
 from axioma_private.rechten_learn_rooms r where i.learn_room_id=r.id and i.status='accepted' and (
 r.expires_at<=clock_timestamp() or r.data->>'phase' in('finished','paused')
 or coalesce(r.data->'left','[]'::jsonb)?i.sender_id::text or coalesce(r.data->'left','[]'::jsonb)?i.recipient_id::text);
end $$;
revoke all on function axioma_private.rechten_learn_busy(uuid,uuid),axioma_private.rechten_learn_eligible(uuid,text),axioma_private.rechten_learn_invitation_cleanup() from public,anon,authenticated;

alter function axioma_private.rechten_learn_worker(text,jsonb) rename to rechten_learn_worker_v1;
revoke all on function axioma_private.rechten_learn_worker_v1(text,jsonb) from public,anon,authenticated,service_role;
-- Completed or explicitly left groups no longer consume a creator's active-room limit.
do $$declare definition text;begin
 select pg_get_functiondef('axioma_private.rechten_learn_worker_v1(text,jsonb)'::regprocedure) into definition;
 definition:=replace(definition,'owner_id=uid and expires_at>clock_timestamp()', 'owner_id=uid and expires_at>clock_timestamp() and data->>''phase'' not in(''finished'',''paused'') and not(coalesce(data->''left'',''[]''::jsonb)?uid::text)');
 execute definition;
end $$;
create function axioma_private.rechten_learn_worker(p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=(p_data->>'user_id')::uuid;tid uuid:=(p_data->>'tab_id')::uuid;target uuid:=(p_data->>'target')::uuid;
 iid uuid:=(p_data->>'invite')::uuid;rid uuid:=(p_data->>'id')::uuid;
 p public.axioma_profiles%rowtype;r axioma_private.rechten_learn_rooms%rowtype;inv axioma_private.game_invitations%rowtype;
 board jsonb;peers jsonb:='[]';invites jsonb:='[]';host_id uuid;occupied integer;reserved integer;was_member boolean;
begin
 select * into p from public.axioma_profiles where user_id=uid;
 if p.user_id is null or exists(select 1 from axioma_private.teachers where user_id=uid) then raise exception 'Meld je aan met je leerlingaccount.';end if;
 if coalesce(p.class_code,'')='' then raise exception 'Je account is nog niet aan een klas gekoppeld.';end if;
 if p_action not in('create','join','read','commit','invite','accept','decline','cancel') then raise exception 'Onbekende actie.';end if;
 -- Same reservation lock as other games. Normal board reads/drafts use only room locks.
 if p_action in('create','join','invite','accept','decline','cancel') then perform pg_advisory_xact_lock(78192026);end if;
 perform axioma_private.rechten_learn_invitation_cleanup();
 if tid is not null then
  insert into axioma_private.online_sessions(user_id,tab_id) values(uid,tid)
  on conflict(user_id,tab_id) do update set seen_at=clock_timestamp();
 end if;
 if p_action in('accept','decline','cancel') then
  select * into inv from axioma_private.game_invitations where id=iid and game='rechten-learn' and uid in(sender_id,recipient_id);
  if inv.id is null then raise exception 'Uitnodiging niet gevonden.';end if;
  rid:=inv.learn_room_id;
  if p_action='cancel' and uid<>inv.sender_id or p_action in('accept','decline') and uid<>inv.recipient_id then raise exception 'Deze uitnodiging is niet voor jou.';end if;
  if p_action in('decline','cancel') then
   if inv.status='pending' then update axioma_private.game_invitations set status=case when p_action='decline' then 'declined' else 'cancelled' end,updated_at=clock_timestamp() where id=inv.id;end if;
   return jsonb_build_object('invitation',inv.id,'status',(select status from axioma_private.game_invitations where id=inv.id));
  end if;
  if inv.status not in('pending','accepted') then raise exception 'Deze uitnodiging is verlopen of afgesloten.';end if;
 end if;
 if p_action='join' then
  select id into rid from axioma_private.rechten_learn_rooms where code=upper(trim(p_data->>'code'));
  if rid is null then raise exception 'Deze code bestaat niet of is verlopen.';end if;
 end if;
 if p_action<>'create' then
  select * into r from axioma_private.rechten_learn_rooms where id=rid for update;
  if r.id is null or r.expires_at<=clock_timestamp() then raise exception 'Deze groep bestaat niet meer. Je kunt een nieuw groepje maken.';end if;
  if r.class_code<>p.class_code then raise exception 'Doe mee met leerlingen uit je eigen klas.';end if;
 end if;
 if p_action='create' then rid:=null;end if;
 if p_action in('create','join','accept') then
  if axioma_private.rechten_learn_busy(uid,rid) then raise exception 'Je zit al in een ander groepje. Verlaat dat eerst.';end if;
  if exists(select 1 from axioma_private.game_invitations where uid in(sender_id,recipient_id) and status in('pending','accepted')
    and (game<>'rechten-learn' or learn_room_id is distinct from rid)) then raise exception 'Je hebt al een andere uitnodiging of battle. Beantwoord die eerst.';end if;
  if exists(select 1 from axioma_private.clay_members where user_id=uid and left_at is null and seen_at>clock_timestamp()-interval '75 seconds') then raise exception 'Verlaat eerst je groepsrace.';end if;
 end if;
 if p_action in('join','accept') then
  was_member:=exists(select 1 from axioma_private.rechten_learn_members where room_id=rid and user_id=uid) and not(coalesce(r.data->'left','[]'::jsonb)?uid::text);
  if not was_member then
   if r.data->>'phase'<>'lobby' then raise exception 'Dit groepje is al gestart. Maak een nieuw groepje of leer alleen verder.';end if;
   if p_action='accept' and not exists(select 1 from axioma_private.online_sessions where user_id=inv.sender_id and seen_at>clock_timestamp()-interval '75 seconds') then raise exception 'De uitnodiger is even offline. Probeer opnieuw wanneer die terug is.';end if;
   select count(*) into occupied from axioma_private.rechten_learn_members where room_id=rid and not(coalesce(r.data->'left','[]'::jsonb)?user_id::text);
   select count(*) into reserved from axioma_private.game_invitations where learn_room_id=rid and status='pending' and recipient_id<>uid;
   if occupied+reserved>=r.capacity then raise exception 'Dit groepje is vol. Maak een ander groepje of leer alleen verder.';end if;
   if not axioma_private.rechten_learn_eligible(uid,r.data->>'skill') then raise exception 'Open eerst Formulewerf in je eigen leerroute.';end if;
   insert into axioma_private.rechten_learn_members(room_id,user_id,alias) values(rid,uid,p.alias) on conflict(room_id,user_id) do update set seen_at=clock_timestamp();
   update axioma_private.rechten_learn_rooms set version=version+1,data=jsonb_set(data,'{left}',coalesce(data->'left','[]'::jsonb)-uid::text) where id=rid;
  end if;
  update axioma_private.game_invitations set status='accepted',recipient_tab=coalesce(tid,recipient_tab),updated_at=clock_timestamp()
   where learn_room_id=rid and recipient_id=uid and status='pending';
  board:=axioma_private.rechten_learn_worker_v1('read',p_data||jsonb_build_object('id',rid));
 elsif p_action='invite' then
  select user_id into host_id from axioma_private.rechten_learn_members where room_id=rid and not(coalesce(r.data->'left','[]'::jsonb)?user_id::text) order by joined_at,user_id limit 1;
  if uid is distinct from host_id or r.data->>'phase'<>'lobby' then raise exception 'Alleen de maker kan in de wachtkamer uitnodigen.';end if;
  if tid is null or target is null or target=uid then raise exception 'Kies een andere klasgenoot.';end if;
  if not exists(select 1 from public.axioma_profiles where user_id=target and class_code=p.class_code) or exists(select 1 from axioma_private.teachers where user_id=target) then raise exception 'Kies een leerling uit je eigen klas.';end if;
  if not axioma_private.rechten_learn_eligible(target,r.data->>'skill') then raise exception 'Deze klasgenoot moet eerst Formulewerf openen.';end if;
  if not exists(select 1 from axioma_private.online_sessions where user_id=target and seen_at>clock_timestamp()-interval '75 seconds') then raise exception 'Deze klasgenoot is niet meer online.';end if;
  select * into inv from axioma_private.game_invitations where learn_room_id=rid and recipient_id=target and status='pending';
  if inv.id is not null then return jsonb_build_object('invitation',inv.id,'status','pending');end if;
  if exists(select 1 from axioma_private.rechten_learn_members where room_id=rid and user_id=target and not(coalesce(r.data->'left','[]'::jsonb)?target::text)) then raise exception 'Deze klasgenoot zit al in je groepje.';end if;
  if axioma_private.rechten_learn_busy(target,rid) or exists(select 1 from axioma_private.game_invitations where target in(sender_id,recipient_id) and status in('pending','accepted'))
   or exists(select 1 from axioma_private.clay_members where user_id=target and left_at is null and seen_at>clock_timestamp()-interval '75 seconds') then raise exception 'Deze klasgenoot is al bezet.';end if;
  select count(*) into occupied from axioma_private.rechten_learn_members where room_id=rid and not(coalesce(r.data->'left','[]'::jsonb)?user_id::text);
  select count(*) into reserved from axioma_private.game_invitations where learn_room_id=rid and status='pending';
  if occupied+reserved>=r.capacity then raise exception 'Alle plaatsen zijn bezet of gereserveerd. Trek eerst een uitnodiging in.';end if;
  if (select count(*) from axioma_private.game_invitations where sender_id=uid and created_at>clock_timestamp()-interval '1 minute')>=5 then raise exception 'Wacht even met opnieuw uitnodigen.';end if;
  insert into axioma_private.game_invitations(sender_id,recipient_id,sender_tab,game,learn_room_id) values(uid,target,tid,'rechten-learn',rid) returning * into inv;
  return jsonb_build_object('invitation',inv.id,'status',inv.status);
 else
  board:=axioma_private.rechten_learn_worker_v1(p_action,p_data);
 end if;
 rid:=(board->>'id')::uuid;
 select * into r from axioma_private.rechten_learn_rooms where id=rid;
 perform axioma_private.rechten_learn_invitation_cleanup();
 update axioma_private.game_invitations set updated_at=clock_timestamp() where learn_room_id=rid and status='accepted';
 select user_id into host_id from axioma_private.rechten_learn_members where room_id=rid and not(coalesce(r.data->'left','[]'::jsonb)?user_id::text) order by joined_at,user_id limit 1;
 if r.data->>'phase'='lobby' and uid=host_id then
  select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'recipient_id',i.recipient_id,'alias',q.alias,'status',i.status) order by i.created_at),'[]') into invites
   from axioma_private.game_invitations i join public.axioma_profiles q on q.user_id=i.recipient_id where i.learn_room_id=rid
   and (i.status='pending' or i.updated_at>clock_timestamp()-interval '5 minutes');
  select coalesce(jsonb_agg(jsonb_build_object('id',q.user_id,'alias',q.alias) order by q.alias),'[]') into peers
   from public.axioma_profiles q where q.class_code=p.class_code and q.user_id<>uid
   and not exists(select 1 from axioma_private.teachers where user_id=q.user_id)
   and axioma_private.rechten_learn_eligible(q.user_id,r.data->>'skill') and not axioma_private.rechten_learn_busy(q.user_id)
   and exists(select 1 from axioma_private.online_sessions where user_id=q.user_id and seen_at>clock_timestamp()-interval '75 seconds')
   and not exists(select 1 from axioma_private.game_invitations where q.user_id in(sender_id,recipient_id) and status in('pending','accepted'))
   and not exists(select 1 from axioma_private.clay_members where user_id=q.user_id and left_at is null and seen_at>clock_timestamp()-interval '75 seconds');
 end if;
 return board||jsonb_build_object('capacity',r.capacity,'peers',peers,'invitees',invites);
end $$;
revoke all on function axioma_private.rechten_learn_worker(text,jsonb) from public,anon,authenticated;
grant execute on function axioma_private.rechten_learn_worker(text,jsonb) to service_role;
create or replace function public.axioma_rechten_learn_worker(p_action text,p_data jsonb) returns jsonb
language sql security invoker set search_path='' as $$select axioma_private.rechten_learn_worker(p_action,p_data)$$;
revoke all on function public.axioma_rechten_learn_worker(text,jsonb) from public,anon,authenticated;
grant execute on function public.axioma_rechten_learn_worker(text,jsonb) to service_role;

-- Other modes cannot accept a cooperative invitation or recruit occupied members.
do $$declare definition text;begin
 select pg_get_functiondef('axioma_private.social(text,uuid,uuid,uuid,uuid)'::regprocedure) into definition;
 definition:=regexp_replace(definition,'begin',E'begin\n perform axioma_private.rechten_learn_invitation_cleanup();\n if p_invite_id is not null and p_action in(''accept'',''decline'',''cancel'',''join'',''finish'') and exists(select 1 from axioma_private.game_invitations where id=p_invite_id and game=''rechten-learn'') then raise exception ''Open Samen leren voor deze uitnodiging.'';end if;\n if p_action=''invite'' then perform pg_advisory_xact_lock(78192026);if axioma_private.rechten_learn_busy(auth.uid()) or axioma_private.rechten_learn_busy(p_target_id) then raise exception ''Een van jullie zit al in een leergroepje.'';end if;end if;');
 execute definition;
 select pg_get_functiondef('axioma_private.rechten_duo(text,jsonb)'::regprocedure) into definition;
 definition:=regexp_replace(definition,'begin',E'begin\n perform axioma_private.rechten_learn_invitation_cleanup();\n if p_action in(''invite'',''accept'') then perform pg_advisory_xact_lock(78192026);if axioma_private.rechten_learn_busy(auth.uid()) or (p_action=''invite'' and axioma_private.rechten_learn_busy((p_data->>''target'')::uuid)) then raise exception ''Een van jullie zit al in een leergroepje.'';end if;end if;');
 definition:=replace(definition,'and axioma_private.rechten_finished_worlds(uid) &&', 'and not axioma_private.rechten_learn_busy(p.user_id) and axioma_private.rechten_finished_worlds(uid) &&');
 execute definition;
end $$;
