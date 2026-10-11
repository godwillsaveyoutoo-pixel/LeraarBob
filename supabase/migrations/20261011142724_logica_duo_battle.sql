-- Reuse the invitation state machine with isolated native tasks and server grades.
-- The shared lock prevents crossed invitations and multiple reservations.
begin;
alter table axioma_private.game_invitations drop constraint game_invitations_game_check;
alter table axioma_private.game_invitations add constraint game_invitations_game_check check(game in ('rechten-zeeslag','rechten-duo','rechten-learn','logica-duo'));
-- Unlike Rechtenwereld, a battle does not require mastered solo worlds.
create function axioma_private.logica_finished_worlds(p_uid uuid) returns text[] language sql immutable set search_path='' as $$select array['signaalplein','schakelwerkplaats','testlab','spiegelkamer','afsprakenbrug','controlecentrum','mixed']::text[]$$;
revoke all on function axioma_private.logica_finished_worlds(uuid) from public,anon,authenticated;
create table axioma_private.logica_duels (
 id uuid primary key references axioma_private.game_invitations(id) on delete cascade,
 world text not null check(world in ('signaalplein','schakelwerkplaats','testlab','spiegelkamer','afsprakenbrug','controlecentrum','mixed')),
 phase text not null default 'invite' check (phase in ('invite','waiting','countdown','playing','resolving','round_result','finished')),
 pool jsonb not null default '[]', round integer not null default 0,
 task jsonb, ready_a boolean not null default false, ready_b boolean not null default false,
 score_a integer not null default 0, score_b integer not null default 0,
 started_at timestamptz, deadline timestamptz, result_at timestamptz,
 seen_a timestamptz, seen_b timestamptz, winner uuid, reason text,
 expires_at timestamptz not null default now()+interval '2 hours'
);
create table axioma_private.logica_duel_answers (
 match_id uuid not null references axioma_private.logica_duels(id) on delete cascade,
 round integer not null, user_id uuid not null references auth.users(id) on delete cascade,
 answer jsonb not null, received_at timestamptz not null, correct boolean,
 primary key(match_id,round,user_id)
);
alter table axioma_private.logica_duels enable row level security;
alter table axioma_private.logica_duel_answers enable row level security;
revoke all on axioma_private.logica_duels,axioma_private.logica_duel_answers from public,anon,authenticated;

do $migration$ declare source text; begin
 select pg_get_functiondef('axioma_private.rechten_duo(text,jsonb)'::regprocedure) into source;
 if position('pg_advisory_xact_lock(78192026)' in source)=0 or position('m.deadline' in source)=0 then raise exception 'Onverwachte uitnodigingsversie';end if;
 source:=replace(source,'axioma_private.rechten_duo','axioma_private.logica_duo');
 source:=replace(source,'axioma_private.rechten_duel','axioma_private.logica_duel');
 source:=replace(source,'axioma_private.rechten_finished_worlds','axioma_private.logica_finished_worlds');
 source:=replace(source,'''rechten-duo''','''logica-duo''');
 source:=replace(source,'m.started_at+interval ''75 seconds''','m.started_at+interval ''180 seconds''');
 -- Give truth tables their full thinking time, even after the opponent submits.
 source:=replace(source,'m.deadline:=least(m.deadline,t+interval ''20 seconds'');','');
 execute source;
 select pg_get_functiondef('axioma_private.rechten_duo_worker(text,jsonb)'::regprocedure) into source;
 source:=replace(source,'axioma_private.rechten_duo','axioma_private.logica_duo');
 source:=replace(source,'axioma_private.rechten_duel','axioma_private.logica_duel');
 source:=replace(source,'axioma_private.rechten_finished_worlds','axioma_private.logica_finished_worlds');
 source:=replace(source,'''rechten-duo''','''logica-duo''');
 source:=replace(source,'coalesce((select state->''rechtenV2'' from public.axioma_game_progress where user_id=inv.sender_id and game_id=''rechten-trainer''),''{}''::jsonb)','''{}''::jsonb');
 source:=replace(source,'coalesce((select state->''rechtenV2'' from public.axioma_game_progress where user_id=inv.recipient_id and game_id=''rechten-trainer''),''{}''::jsonb)','''{}''::jsonb');
 execute source;
 select pg_get_functiondef('axioma_private.social(text,uuid,uuid,uuid,uuid)'::regprocedure) into source;
 if position('game=''rechten-duo''' in source)=0 then raise exception 'Onverwachte sociale beveiliging';end if;
 source:=replace(source,'game=''rechten-duo''','game in (''rechten-duo'',''logica-duo'')');execute source;
end $migration$;
revoke all on function axioma_private.logica_duo(text,jsonb) from public,anon;
grant execute on function axioma_private.logica_duo(text,jsonb) to authenticated;
create function public.axioma_logica_duo(p_action text,p_data jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select axioma_private.logica_duo(p_action,p_data)$$;
revoke all on function public.axioma_logica_duo(text,jsonb) from public,anon;
grant execute on function public.axioma_logica_duo(text,jsonb) to authenticated;
revoke all on function axioma_private.logica_duo_worker(text,jsonb) from public,anon,authenticated;
grant execute on function axioma_private.logica_duo_worker(text,jsonb) to service_role;
create function public.axioma_logica_duo_worker(p_action text,p_data jsonb) returns jsonb language sql security invoker set search_path='' as $$select axioma_private.logica_duo_worker(p_action,p_data)$$;
revoke all on function public.axioma_logica_duo_worker(text,jsonb) from public,anon,authenticated;
grant execute on function public.axioma_logica_duo_worker(text,jsonb) to service_role;
commit;
