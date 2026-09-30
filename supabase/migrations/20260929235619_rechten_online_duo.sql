-- Same released curriculum as area-maps.js. Preview nodes never block access.
create function axioma_private.rechten_finished_worlds(p_uid uuid) returns text[]
language sql stable security definer set search_path='' as $$
 with state as (select coalesce((select state->'rechtenV2' from public.axioma_game_progress where user_id=p_uid and game_id='rechten-trainer'),'{}'::jsonb) s),
 nodes as (select * from jsonb_to_recordset('[{"world":"hellingrug","skill":"delta","phase":"hill-dy","last":5},{"world":"hellingrug","skill":"slope","phase":"hill-rate","last":5},{"world":"hellingrug","skill":"slope_from_two_points","phase":"hill-calculate","last":5},{"world":"hellingrug","skill":"line_behavior","phase":"line-behavior","last":8},{"world":"hellingrug","skill":"special_lines","phase":"line-special","last":5},{"world":"grenspas","skill":"zeroRead","phase":"grens-zero","last":5},{"world":"grenspas","skill":"zero","phase":"grens-zero","last":5},{"world":"grenspas","skill":"positive","phase":"grens-inequality","last":5},{"world":"grenspas","skill":"negative","phase":"grens-inequality","last":5},{"world":"grenspas","skill":"signchart","phase":"grens-chart","last":5},{"world":"formulewerf","skill":"equation_from_ab","phase":"formula-build","last":5},{"world":"formulewerf","skill":"graph_from_equation","phase":"formula-plot","last":5},{"world":"formulewerf","skill":"equation_from_graph","phase":"formula-read","last":5},{"world":"formulewerf","skill":"rewrite_linear_equation","phase":"formula-rewrite","last":5},{"world":"formulewerf","skill":"intercept_from_point","phase":"derive-intercept","last":5},{"world":"formulewerf","skill":"equation_from_point_slope","phase":"derive-formula","last":5},{"world":"formulewerf","skill":"equation_from_two_points","phase":"derive-formula","last":5},{"world":"formulewerf","skill":"equation_from_table","phase":"derive-formula","last":5},{"world":"signaalstad","skill":"graph_from_table","phase":"formula-plot","last":5}]'::jsonb) as n(world text,skill text,phase text,last integer)),
 done as (select world,bool_and(coalesce(s#>>array['missions',skill,'completed'],'false')='true' or exists(
  select 1 from jsonb_array_elements(coalesce(s->'events','[]')) e where e->>'correct'='true'
   and e->>'taskId' like 'rechten-v2:'||world||':'||skill||':%'
   and e->>'taskId' ~ (':'||last||':run[0-9]+$') and e->>'attemptId' like phase||':%')) complete
 from state cross join nodes group by world)
 select coalesce(array_agg(world order by world) filter(where complete),'{}') from done;
$$;
revoke all on function axioma_private.rechten_finished_worlds(uuid) from public,anon,authenticated;
-- Reuse platform invitations and presence; keep private answers behind RPCs.
alter table axioma_private.game_invitations add column game text not null default 'rechten-zeeslag'
  check (game in ('rechten-zeeslag','rechten-duo'));
create table axioma_private.rechten_duels (
 id uuid primary key references axioma_private.game_invitations(id) on delete cascade,
 world text not null check(world in ('hellingrug','grenspas','formulewerf','signaalstad')),
 phase text not null default 'invite' check (phase in ('invite','waiting','countdown','playing','resolving','round_result','finished')),
 pool jsonb not null default '[]', round integer not null default 0,
 task jsonb, ready_a boolean not null default false, ready_b boolean not null default false,
 score_a integer not null default 0, score_b integer not null default 0,
 started_at timestamptz, deadline timestamptz, result_at timestamptz,
 seen_a timestamptz, seen_b timestamptz, winner uuid, reason text,
 expires_at timestamptz not null default now()+interval '2 hours'
);
create table axioma_private.rechten_duel_answers (
 match_id uuid not null references axioma_private.rechten_duels(id) on delete cascade,
 round integer not null, user_id uuid not null references auth.users(id) on delete cascade,
 answer jsonb not null, received_at timestamptz not null, correct boolean,
 primary key(match_id,round,user_id)
);
alter table axioma_private.rechten_duels enable row level security;
alter table axioma_private.rechten_duel_answers enable row level security;
revoke all on axioma_private.rechten_duels,axioma_private.rechten_duel_answers from public,anon,authenticated;

create function axioma_private.rechten_duo(p_action text,p_data jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); tid uuid:=(p_data->>'tab_id')::uuid; mid uuid:=(p_data->>'id')::uuid;
 target uuid:=(p_data->>'target')::uuid; inv axioma_private.game_invitations%rowtype;
 m axioma_private.rechten_duels%rowtype; t timestamptz; mine boolean; a jsonb; b jsonb;
 peers jsonb; invites jsonb; class text; result jsonb; chosen text; shared_worlds text[];
begin
 if uid is null or not exists(select 1 from public.axioma_profiles where user_id=uid)
 or public.axioma_is_teacher() then raise exception 'Meld je aan als leerling.'; end if;
 if p_action not in ('lobby','invite','accept','decline','cancel','state','ready','submit','next','leave') then raise exception 'Ongeldige actie.'; end if;
 if p_action in ('lobby','invite','accept','decline','cancel') then
  -- Same lock as the existing social service: crossed games/tabs cannot reserve twice.
  perform pg_advisory_xact_lock(78192026);
  update axioma_private.game_invitations i set status='cancelled',updated_at=clock_timestamp() from axioma_private.rechten_duels d where d.id=i.id and i.status='pending' and not (d.world=any(axioma_private.rechten_finished_worlds(i.sender_id)) and d.world=any(axioma_private.rechten_finished_worlds(i.recipient_id)));
  update axioma_private.game_invitations set status='expired',updated_at=clock_timestamp()
   where status='pending' and expires_at<=clock_timestamp();
  update axioma_private.game_invitations i set status='finished',updated_at=clock_timestamp()
   from axioma_private.rechten_duels d where i.id=d.id and d.expires_at<=clock_timestamp() and i.status='accepted';
 end if;
 if p_action in ('lobby','invite') then
  if tid is null then raise exception 'Tabblad ontbreekt.'; end if;
  insert into axioma_private.online_sessions(user_id,tab_id) values(uid,tid)
   on conflict(user_id,tab_id) do update set seen_at=clock_timestamp();
  select class_code into class from public.axioma_profiles where user_id=uid;
 end if;
 if p_action='invite' then
  if target is null or target=uid then raise exception 'Kies een andere leerling.'; end if;
  if class is null or class='' or not exists(select 1 from public.axioma_profiles p
   where p.user_id=target and p.class_code=class and not exists(select 1 from axioma_private.teachers where user_id=target)) then raise exception 'Kies een leerling uit je eigen klas.'; end if;
  select array_agg(w) into shared_worlds from unnest(axioma_private.rechten_finished_worlds(uid)) w where w=any(axioma_private.rechten_finished_worlds(target));
  chosen:=coalesce(p_data->>'world',shared_worlds[1]);
  if chosen is null or not coalesce(chosen=any(shared_worlds),false) then raise exception 'Rond allebei eerst deze wereld af en synchroniseer je voortgang.';end if;
  if not exists(select 1 from axioma_private.online_sessions where user_id=target and seen_at>clock_timestamp()-interval '75 seconds') then raise exception 'Deze leerling is offline.'; end if;
  if exists(select 1 from axioma_private.game_invitations where status in ('pending','accepted') and (sender_id in(uid,target) or recipient_id in(uid,target))) then raise exception 'Een van jullie is al bezet.'; end if;
  if exists(select 1 from axioma_private.clay_members where user_id in(uid,target) and left_at is null and seen_at>clock_timestamp()-interval '75 seconds') then raise exception 'Een van jullie speelt al een groepsbattle.'; end if;
  if (select count(*) from axioma_private.game_invitations where sender_id=uid and created_at>clock_timestamp()-interval '1 minute')>=5 then raise exception 'Wacht even met opnieuw uitnodigen.'; end if;
  insert into axioma_private.game_invitations(sender_id,recipient_id,sender_tab,game) values(uid,target,tid,'rechten-duo') returning id into mid;
  insert into axioma_private.rechten_duels(id,world) values(mid,chosen);
 end if;
 if p_action='lobby' then
  select coalesce(jsonb_agg(x order by x.alias),'[]') into peers from (
   select p.user_id as id,p.alias,array(select w from unnest(axioma_private.rechten_finished_worlds(uid)) w where w=any(axioma_private.rechten_finished_worlds(p.user_id))) worlds from public.axioma_profiles p where p.user_id<>uid and p.class_code=class and class<>''
   and axioma_private.rechten_finished_worlds(uid) && axioma_private.rechten_finished_worlds(p.user_id)
   and not exists(select 1 from axioma_private.teachers where user_id=p.user_id)
   and exists(select 1 from axioma_private.online_sessions where user_id=p.user_id and seen_at>clock_timestamp()-interval '75 seconds')
   and not exists(select 1 from axioma_private.game_invitations where status in ('pending','accepted') and p.user_id in(sender_id,recipient_id))
   and not exists(select 1 from axioma_private.clay_members where user_id=p.user_id and left_at is null and seen_at>clock_timestamp()-interval '75 seconds')
  ) x;
  select coalesce(jsonb_agg(x order by x.created_at),'[]') into invites from (
   select i.id,(select world from axioma_private.rechten_duels where id=i.id) world,i.status,i.sender_id,i.recipient_id,s.alias sender_alias,r.alias recipient_alias,i.created_at
   from axioma_private.game_invitations i join public.axioma_profiles s on s.user_id=i.sender_id join public.axioma_profiles r on r.user_id=i.recipient_id
   where i.game='rechten-duo' and uid in(i.sender_id,i.recipient_id) and i.status in('pending','accepted')
  ) x;
  return jsonb_build_object('worlds',to_jsonb(axioma_private.rechten_finished_worlds(uid)),'players',peers,'invitations',invites,'server_time',clock_timestamp());
 end if;
 select * into inv from axioma_private.game_invitations where id=mid and game='rechten-duo';
 if inv.id is null or uid not in(inv.sender_id,inv.recipient_id) then raise exception 'Deze battle is niet van jou.'; end if;
 select * into m from axioma_private.rechten_duels where id=mid for update;
 if p_action in ('accept','ready') or (p_action='state' and m.phase='invite') then
  if not (m.world=any(axioma_private.rechten_finished_worlds(inv.sender_id)) and m.world=any(axioma_private.rechten_finished_worlds(inv.recipient_id))) then raise exception 'Rond allebei eerst deze wereld af en synchroniseer je voortgang.';end if;
 end if;
 -- Timestamp after lock acquisition. Neither client clocks nor request order can backdate answers.
 t:=clock_timestamp();mine:=uid=inv.sender_id;
 if inv.status='pending' and inv.expires_at<=t then
  update axioma_private.game_invitations set status='expired',updated_at=t where id=mid;
  inv.status:='expired';m.phase:='finished';m.reason:='expired';
 elsif inv.status in('expired','finished') and m.phase<>'finished' then m.phase:='finished';m.reason:='expired';end if;
 if p_action='accept' then
  if uid<>inv.recipient_id or inv.status not in('pending','accepted') or (inv.status='pending' and inv.expires_at<=t) then raise exception 'Uitnodiging verlopen of al beantwoord.'; end if;
  if inv.status='pending' then
   if not exists(select 1 from public.axioma_profiles x join public.axioma_profiles y on x.class_code=y.class_code and x.class_code<>'' where x.user_id=uid and y.user_id=inv.sender_id) then raise exception 'Jullie zitten niet in dezelfde klas.';end if;
   if not exists(select 1 from axioma_private.online_sessions where user_id=inv.sender_id and seen_at>t-interval '75 seconds') then raise exception 'De uitnodiger is offline.'; end if;
   update axioma_private.game_invitations set status='accepted',recipient_tab=tid,updated_at=t where id=mid;
   m.phase:='waiting';
  end if;
 elsif p_action in('decline','cancel') then
  if inv.status<>'pending' or (p_action='decline' and mine) or (p_action='cancel' and not mine) then raise exception 'Deze uitnodiging kun je niet wijzigen.'; end if;
  update axioma_private.game_invitations set status=case when p_action='decline' then 'declined' else 'cancelled' end,updated_at=t where id=mid;
  m.phase:='finished';m.reason:=p_action;
 elsif p_action not in('invite','state') and inv.status not in('accepted','finished') then raise exception 'De uitnodiging is nog niet geaccepteerd.';
 end if;
 if m.phase not in('invite','finished') then
  if mine then m.seen_a:=t;else m.seen_b:=t;end if;
  update axioma_private.game_invitations set updated_at=t where id=mid and status='accepted';
  if t>=m.expires_at then m.phase:='finished';m.reason:='expired';end if;
 end if;
 if p_action='leave' and m.phase<>'finished' then m.phase:='finished';m.reason:='left';end if;
 if p_action='ready' and m.phase='waiting' and jsonb_array_length(m.pool)>0 then
  if mine then m.ready_a:=true;else m.ready_b:=true;end if;
 end if;
 if p_action='next' and m.phase='round_result' and (p_data->>'round')::integer=m.round then
  if mine then m.ready_a:=true;else m.ready_b:=true;end if;
 end if;
 if m.phase in('waiting','round_result') and m.ready_a and m.ready_b then
  m.round:=m.round+1;m.phase:='countdown';m.ready_a:=false;m.ready_b:=false;
  m.task:=jsonb_build_object('skill',m.pool->>floor(random()*jsonb_array_length(m.pool))::integer,'seed',floor(random()*2147483647)::integer,'variant',floor(random()*4)::integer);
  m.started_at:=t+interval '3 seconds';m.deadline:=m.started_at+interval '75 seconds';
 end if;
 if m.phase='countdown' and t>=m.started_at then m.phase:='playing';end if;
 if p_action='submit' then
  if jsonb_typeof(p_data->'round') is distinct from 'number' or (p_data->>'round')::integer<1 then raise exception 'Ronde ontbreekt.';end if;
  -- A retry of the same final submission is harmless, even after reveal.
  if not exists(select 1 from axioma_private.rechten_duel_answers where match_id=mid and round=(p_data->>'round')::integer and user_id=uid) then
   if m.phase<>'playing' or m.round<>(p_data->>'round')::integer or t>=m.deadline then raise exception 'Deze ronde accepteert geen antwoorden meer.'; end if;
   if jsonb_typeof(p_data->'answer') is distinct from 'object' or octet_length((p_data->'answer')::text)>16000 then raise exception 'Ongeldig antwoord.'; end if;
   insert into axioma_private.rechten_duel_answers values(mid,m.round,uid,p_data->'answer',t,null);
   m.deadline:=least(m.deadline,t+interval '20 seconds');
  end if;
 end if;
 if m.phase='playing' and (t>=m.deadline or (select count(*) from axioma_private.rechten_duel_answers where match_id=mid and round=m.round)=2) then m.phase:='resolving';end if;
 update axioma_private.rechten_duels set phase=m.phase,pool=m.pool,round=m.round,task=m.task,ready_a=m.ready_a,ready_b=m.ready_b,
 started_at=m.started_at,deadline=m.deadline,seen_a=m.seen_a,seen_b=m.seen_b,reason=m.reason where id=mid;
 if m.phase='finished' then update axioma_private.game_invitations set status='finished',updated_at=t where id=mid;end if;
 -- Explicit projection: never serialize an answer, before OR after reveal.
 select jsonb_build_object('confirmed',true,'correct',case when m.phase in('round_result','finished') then correct end) into a
  from axioma_private.rechten_duel_answers where match_id=mid and round=m.round and user_id=inv.sender_id;
 select jsonb_build_object('confirmed',true,'correct',case when m.phase in('round_result','finished') then correct end) into b
  from axioma_private.rechten_duel_answers where match_id=mid and round=m.round and user_id=inv.recipient_id;
 result:=jsonb_build_object('id',mid,'world',m.world,'phase',m.phase,'round',m.round,'rounds',5,'task',case when m.phase not in('waiting','invite') then m.task end,
 'pool',m.pool,'started_at',m.started_at,'deadline',m.deadline,'server_time',t,'winner',m.winner,'reason',m.reason,
 'a',jsonb_build_object('id',inv.sender_id,'alias',(select alias from public.axioma_profiles where user_id=inv.sender_id),'score',m.score_a,'confirmed',coalesce((a->>'confirmed')::boolean,false),'correct',a->'correct','ready',m.ready_a,'online',m.seen_a>t-interval '15 seconds'),
 'b',jsonb_build_object('id',inv.recipient_id,'alias',(select alias from public.axioma_profiles where user_id=inv.recipient_id),'score',m.score_b,'confirmed',coalesce((b->>'confirmed')::boolean,false),'correct',b->'correct','ready',m.ready_b,'online',m.seen_b>t-interval '15 seconds'));
 return result;
end $$;
revoke all on function axioma_private.rechten_duo(text,jsonb) from public,anon;
grant execute on function axioma_private.rechten_duo(text,jsonb) to authenticated;
create function public.axioma_rechten_duo(p_action text,p_data jsonb default '{}') returns jsonb
 language sql security invoker set search_path='' as $$select axioma_private.rechten_duo(p_action,p_data)$$;
revoke all on function public.axioma_rechten_duo(text,jsonb) from public,anon;
grant execute on function public.axioma_rechten_duo(text,jsonb) to authenticated;

-- Worker-only API. JWT is verified by the Edge Function; identity is NEVER taken from its request body.
create function axioma_private.rechten_duo_worker(p_action text,p_data jsonb) returns jsonb
 language plpgsql security definer set search_path='' as $$
declare
 m axioma_private.rechten_duels%rowtype; inv axioma_private.game_invitations%rowtype;
 mid uuid:=(p_data->>'id')::uuid; uid uuid:=(p_data->>'user_id')::uuid;
 a axioma_private.rechten_duel_answers%rowtype;b axioma_private.rechten_duel_answers%rowtype;
 ca boolean;cb boolean;win uuid;done boolean;
begin
 select * into inv from axioma_private.game_invitations where id=mid and game='rechten-duo';
 if uid is null or inv.id is null or uid not in(inv.sender_id,inv.recipient_id) then raise exception 'Niet betrokken bij deze battle.';end if;
 select * into m from axioma_private.rechten_duels where id=mid for update;
 if p_action='work' then
  if m.phase='waiting' and m.pool='[]'::jsonb then return jsonb_build_object('phase','prepare','world',m.world,
   'a',coalesce((select state->'rechtenV2' from public.axioma_game_progress where user_id=inv.sender_id and game_id='rechten-trainer'),'{}'::jsonb),
   'b',coalesce((select state->'rechtenV2' from public.axioma_game_progress where user_id=inv.recipient_id and game_id='rechten-trainer'),'{}'::jsonb));end if;
  if m.phase='resolving' then return jsonb_build_object('phase','resolve','round',m.round,'task',m.task,
   'a',(select answer from axioma_private.rechten_duel_answers where match_id=mid and round=m.round and user_id=inv.sender_id),
   'b',(select answer from axioma_private.rechten_duel_answers where match_id=mid and round=m.round and user_id=inv.recipient_id));end if;
  return '{}';
 elsif p_action='prepare' and m.phase='waiting' and m.pool='[]'::jsonb then
  if jsonb_typeof(p_data->'pool') is distinct from 'array' then raise exception 'Ongeldige inhoud.';end if;
  if jsonb_array_length(p_data->'pool')=0 then
   update axioma_private.rechten_duels set phase='finished',reason='no_common_skills' where id=mid;
   update axioma_private.game_invitations set status='finished',updated_at=clock_timestamp() where id=mid;
  else update axioma_private.rechten_duels set pool=p_data->'pool' where id=mid;end if;
 elsif p_action='resolve' and m.phase='resolving' and m.round=(p_data->>'round')::integer then
  select * into a from axioma_private.rechten_duel_answers where match_id=mid and round=m.round and user_id=inv.sender_id;
  select * into b from axioma_private.rechten_duel_answers where match_id=mid and round=m.round and user_id=inv.recipient_id;
  ca:=a.user_id is not null and coalesce((p_data->>'a')::boolean,false);cb:=b.user_id is not null and coalesce((p_data->>'b')::boolean,false);
  if ca and not cb then win:=inv.sender_id;elsif cb and not ca then win:=inv.recipient_id;
  elsif ca and cb and abs(extract(epoch from(a.received_at-b.received_at)))>0.3 then win:=case when a.received_at<b.received_at then inv.sender_id else inv.recipient_id end;end if;
  update axioma_private.rechten_duel_answers set correct=case when user_id=inv.sender_id then ca else cb end where match_id=mid and round=m.round;
  m.score_a:=m.score_a+case when win=inv.sender_id then 1 else 0 end;m.score_b:=m.score_b+case when win=inv.recipient_id then 1 else 0 end;
  done:=m.round>=5 and m.score_a<>m.score_b or m.round>=7;
  update axioma_private.rechten_duels set phase=case when done then 'finished' else 'round_result' end,
   score_a=m.score_a,score_b=m.score_b,winner=case when done then case when m.score_a>m.score_b then inv.sender_id when m.score_b>m.score_a then inv.recipient_id else null end else win end,
   ready_a=false,ready_b=false,result_at=clock_timestamp(),reason=case when done then 'completed' else null end where id=mid;
  if done then update axioma_private.game_invitations set status='finished',updated_at=clock_timestamp() where id=mid;end if;
 end if;
 return '{}';
end $$;
revoke all on function axioma_private.rechten_duo_worker(text,jsonb) from public,anon,authenticated;
grant usage on schema axioma_private to service_role;
grant execute on function axioma_private.rechten_duo_worker(text,jsonb) to service_role;
create function public.axioma_rechten_duo_worker(p_action text,p_data jsonb) returns jsonb
 language sql security invoker set search_path='' as $$select axioma_private.rechten_duo_worker(p_action,p_data)$$;
revoke all on function public.axioma_rechten_duo_worker(text,jsonb) from public,anon,authenticated;
grant execute on function public.axioma_rechten_duo_worker(text,jsonb) to service_role;

-- Preserve the installed social implementation (including later group fixes).
-- Duo accept/finish must pass through its own membership/timing checks.
do $$declare definition text;begin
 select pg_get_functiondef('axioma_private.social(text,uuid,uuid,uuid,uuid)'::regprocedure) into definition;
 definition:=replace(definition,'begin',E'begin\n  if p_invite_id is not null and p_action in (''accept'',''decline'',''cancel'',''join'',''finish'') and exists(select 1 from axioma_private.game_invitations where id=p_invite_id and game=''rechten-duo'') then raise exception ''Open Online duo battle voor deze uitnodiging.''; end if;');
 definition:=regexp_replace(definition,'begin',E'begin\n  update axioma_private.game_invitations i set status=''cancelled'',updated_at=clock_timestamp() from axioma_private.rechten_duels d where d.id=i.id and i.status=''pending'' and not (d.world=any(axioma_private.rechten_finished_worlds(i.sender_id)) and d.world=any(axioma_private.rechten_finished_worlds(i.recipient_id)));');
 execute definition;
end $$;
