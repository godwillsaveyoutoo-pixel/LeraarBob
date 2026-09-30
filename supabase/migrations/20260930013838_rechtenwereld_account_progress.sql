-- Allow the existing Rechtenwereld adapter to sync its own namespace.
-- No progress rows, legacy XP, catalog types or access policies are rewritten.
CREATE OR REPLACE FUNCTION axioma_private.save_game_progress(p_game_id text, p_state jsonb, p_revision bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  uid uuid := auth.uid();
  existing public.axioma_game_progress%rowtype;
  result public.axioma_game_progress%rowtype;
  progress_type_value text;
begin
  if uid is null or not exists (
    select 1 from public.axioma_profiles where user_id = uid
  ) then
    raise exception 'Leerlingaccount vereist.' using errcode = '42501';
  end if;

  select progress_type into progress_type_value
  from public.axioma_games
  where id = p_game_id and active = true;

  if progress_type_value is null then
    raise exception 'Onbekend of inactief spel.' using errcode = '22023';
  end if;

  -- The legacy trainer keeps using axioma_progress. Rechtenwereld shares its
  -- catalog ID, but stores its separate versioned state in this table.
  if progress_type_value = 'none'
     or (progress_type_value = 'trainer' and p_game_id <> 'rechten-trainer') then
    raise exception 'Dit spel gebruikt geen generieke voortgangsopslag.' using errcode = '22023';
  end if;

  if p_game_id = 'rechten-trainer' and (
    jsonb_typeof(p_state->'rechtenV2') is distinct from 'object'
    or p_state #> '{rechtenV2,schema}' is distinct from '1'::jsonb
    or jsonb_typeof(p_state #> '{rechtenV2,events}') is distinct from 'array'
    or jsonb_typeof(p_state #> '{rechtenV2,missions}') is distinct from 'object'
    or jsonb_typeof(p_state #> '{rechtenV2,settings}') is distinct from 'object'
    or coalesce(p_state #>> '{rechtenV2,screen}', '') not in ('world','mission','book','profile')
  ) then
    raise exception 'Ongeldige Rechtenwereld-voortgang.' using errcode = '22023';
  end if;

  if p_revision is null or p_revision < 0 or p_state is null
     or jsonb_typeof(p_state) <> 'object'
     or octet_length(p_state::text) > 262144 then
    raise exception 'Ongeldige voortgang.' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(uid::text || ':' || p_game_id, 0)
  );

  select * into existing
  from public.axioma_game_progress
  where user_id = uid and game_id = p_game_id
  for update;

  if coalesce(existing.revision, 0) <> p_revision then
    return jsonb_build_object(
      'status','conflict',
      'revision', existing.revision,
      'state', existing.state,
      'updated_at', existing.updated_at
    );
  end if;

  insert into public.axioma_game_progress(
    user_id, game_id, state, revision, updated_at, trust_level
  )
  values(uid, p_game_id, p_state, 1, clock_timestamp(), 'client_reported')
  on conflict(user_id, game_id) do update
    set state = excluded.state,
        revision = public.axioma_game_progress.revision + 1,
        updated_at = excluded.updated_at,
        trust_level = 'client_reported'
  returning * into result;

  return jsonb_build_object(
    'status','saved',
    'revision', result.revision,
    'updated_at', result.updated_at,
    'trust_level', result.trust_level
  );
end;
$function$
;
revoke all on function axioma_private.save_game_progress(text,jsonb,bigint) from public, anon;
grant execute on function axioma_private.save_game_progress(text,jsonb,bigint) to authenticated;
