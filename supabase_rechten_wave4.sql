-- Deployment script, based on the inspected production RPC (2026-09-22).
-- Apply before publishing Wave 4 (includes Waves 1–3). Not applied by the browser or by this branch.
-- Keeps account authorization and revision checks; prevents v700/v701/v702/v703 downgrade writes.
CREATE OR REPLACE FUNCTION public.axioma_save_progress(p_state jsonb, p_revision bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid := auth.uid(); existing public.axioma_progress%rowtype; result public.axioma_progress%rowtype;
  k text; number_key text; skill jsonb;
begin
  if uid is null or not exists(select 1 from public.axioma_profiles where user_id=uid) then
    raise exception 'Leerlingaccount vereist.' using errcode='42501';
  end if;
  if p_revision is null or p_revision<0 or p_state is null or jsonb_typeof(p_state)<>'object'
    or octet_length(p_state::text)>262144 or coalesce(p_state->>'version','') not in ('700','701','702','703','704')
    or jsonb_typeof(p_state->'skills') is distinct from 'object'
    or jsonb_typeof(p_state->'session') is distinct from 'object'
    or jsonb_typeof(p_state->'review') is distinct from 'array'
    or jsonb_typeof(p_state->'telemetry') is distinct from 'array' then
    raise exception 'Ongeldige voortgang.' using errcode='22023';
  end if;
  if jsonb_array_length(p_state->'telemetry')>360 or jsonb_array_length(p_state->'review')>1000 then
    raise exception 'Te veel voortgangsgegevens.' using errcode='22023';
  end if;
  foreach number_key in array array['xp','total','correct','streak','routeStep'] loop
    if jsonb_typeof(p_state->number_key) is distinct from 'number'
      or (p_state->>number_key)::numeric<0 or (p_state->>number_key)::numeric>1000000000
      or trunc((p_state->>number_key)::numeric)<>(p_state->>number_key)::numeric then
      raise exception 'Ongeldige teller.' using errcode='22023';
    end if;
  end loop;
  if (p_state->>'correct')::numeric>(p_state->>'total')::numeric then
    raise exception 'Ongeldige antwoorden.' using errcode='22023';
  end if;
  foreach k in array array['delta','slope','point','intercept','ab','fx','table','zeroRead','zero','sign','signchart'] loop
    skill:=p_state->'skills'->k;
    if jsonb_typeof(skill) is distinct from 'object' or jsonb_typeof(skill->'strength') is distinct from 'number'
      or (skill->>'strength')::numeric<0 or (skill->>'strength')::numeric>1 then
      raise exception 'Ongeldige vaardigheid.' using errcode='22023';
    end if;
  end loop;
  if p_state->>'version' in ('701','702','703','704') then
    foreach k in array array['slope_from_two_points','line_behavior','special_lines','intercept_from_point','equation_from_point_slope','equation_from_two_points'] loop
      skill:=p_state->'skills'->k;
      if jsonb_typeof(skill) is distinct from 'object' or jsonb_typeof(skill->'strength') is distinct from 'number'
        or (skill->>'strength')::numeric<0 or (skill->>'strength')::numeric>1 then
        raise exception 'Ongeldige nieuwe vaardigheid.' using errcode='22023';
      end if;
    end loop;
  end if;
  if p_state->>'version' in ('702','703','704') then
    foreach k in array array['point_plot','equation_from_ab','graph_from_equation'] loop
      skill:=p_state->'skills'->k;
      if jsonb_typeof(skill) is distinct from 'object' or jsonb_typeof(skill->'strength') is distinct from 'number'
        or (skill->>'strength')::numeric<0 or (skill->>'strength')::numeric>1 then
        raise exception 'Ongeldige constructievaardigheid.' using errcode='22023';
      end if;
    end loop;
  end if;
  if p_state->>'version' in ('703','704') then
    foreach k in array array['rewrite_linear_equation','input_from_output','point_on_line'] loop
      skill:=p_state->'skills'->k;
      if jsonb_typeof(skill) is distinct from 'object' or jsonb_typeof(skill->'strength') is distinct from 'number'
        or (skill->>'strength')::numeric<0 or (skill->>'strength')::numeric>1 then
        raise exception 'Ongeldige algebravaardigheid.' using errcode='22023';
      end if;
    end loop;
  end if;
  if p_state->>'version'='704' then
    foreach k in array array['graph_from_table','equation_from_graph','equation_from_table','equation_from_context'] loop
      skill:=p_state->'skills'->k;
      if jsonb_typeof(skill) is distinct from 'object' or jsonb_typeof(skill->'strength') is distinct from 'number'
        or (skill->>'strength')::numeric<0 or (skill->>'strength')::numeric>1 then
        raise exception 'Ongeldige transfervaardigheid.' using errcode='22023';
      end if;
    end loop;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text,0));
  select * into existing from public.axioma_progress where user_id=uid for update;
  -- Check under the existing per-account lock, including force-push with a fresh revision.
  if existing.state->>'version' in ('701','702','703','704') and (existing.state->>'version')::int>(p_state->>'version')::int then
    raise exception 'Werk de Rechtentrainer bij: deze voortgang gebruikt een nieuwere versie.' using errcode='22023';
  end if;
  if coalesce(existing.revision,0)<>p_revision then
    return jsonb_build_object('status','conflict','revision',existing.revision,'state',existing.state,'updated_at',existing.updated_at);
  end if;
  insert into public.axioma_progress(user_id,state,revision,updated_at) values(uid,p_state,1,clock_timestamp())
    on conflict(user_id) do update set state=excluded.state,revision=axioma_progress.revision+1,updated_at=excluded.updated_at
    returning * into result;
  return jsonb_build_object('status','saved','revision',result.revision,'updated_at',result.updated_at);
end;
$function$
;
revoke all on function public.axioma_save_progress(jsonb,bigint) from public, anon;
grant execute on function public.axioma_save_progress(jsonb,bigint) to authenticated;

