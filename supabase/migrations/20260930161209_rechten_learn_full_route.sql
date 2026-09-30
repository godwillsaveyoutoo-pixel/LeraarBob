-- Extend cooperative learning, keeping competitive battle pools unchanged.
create function axioma_private.rechten_learn_world(p_skill text) returns text
language sql immutable set search_path='' as $$
 select n.world from jsonb_to_recordset('[{"skill":"point","world":"puntenbaai"},{"skill":"point_plot","world":"puntenbaai"},{"skill":"delta","world":"hellingrug"},{"skill":"slope","world":"hellingrug"},{"skill":"slope_from_two_points","world":"hellingrug"},{"skill":"line_behavior","world":"hellingrug"},{"skill":"special_lines","world":"hellingrug"},{"skill":"zeroRead","world":"grenspas"},{"skill":"zero","world":"grenspas"},{"skill":"positive","world":"grenspas"},{"skill":"negative","world":"grenspas"},{"skill":"signchart","world":"grenspas"},{"skill":"equation_from_ab","world":"formulewerf"},{"skill":"graph_from_equation","world":"formulewerf"},{"skill":"equation_from_graph","world":"formulewerf"},{"skill":"rewrite_linear_equation","world":"formulewerf"},{"skill":"intercept_from_point","world":"formulewerf"},{"skill":"equation_from_point_slope","world":"formulewerf"},{"skill":"equation_from_two_points","world":"formulewerf"},{"skill":"equation_from_table","world":"formulewerf"},{"skill":"graph_from_table","world":"signaalstad"}]'::jsonb) n(skill text,world text) where n.skill=p_skill;
$$;
revoke all on function axioma_private.rechten_learn_world(text) from public,anon,authenticated;
create or replace function axioma_private.rechten_learn_eligible(p_user uuid,p_skill text) returns boolean
language sql stable security definer set search_path='' as $$
 with selected as (select axioma_private.rechten_learn_world(p_skill) world),
 saved as (select coalesce((select state->'rechtenV2' from public.axioma_game_progress where user_id=p_user and game_id='rechten-trainer'),'{}'::jsonb) state)
 select coalesce(world in('puntenbaai','hellingrug') or
 (case world when 'grenspas' then 'hellingrug' when 'formulewerf' then 'grenspas' when 'signaalstad' then 'formulewerf' end)=any(axioma_private.rechten_finished_worlds(p_user)) or
 exists(select 1 from jsonb_each(coalesce(state->'missions','{}'::jsonb)) m where m.value->>'world'=world) or
 exists(select 1 from jsonb_array_elements(coalesce(state->'events','[]'::jsonb)) e where e->>'taskId' like 'rechten-v2:'||world||':%'),false)
 from selected cross join saved;
$$;
do $migration$ declare definition text; old text:='  world:=case skill when ''graph_from_equation'' then ''formulewerf'' when ''delta'' then ''hellingrug'' else ''puntenbaai'' end;
  select state->''rechtenV2'' into my_state from public.axioma_game_progress where user_id=uid and game_id=''rechten-trainer'';
  if world=''formulewerf'' and not (''grenspas''=any(axioma_private.rechten_finished_worlds(uid)))
   and not exists(select 1 from jsonb_each(coalesce(my_state->''missions'',''{}'')) m where m.value->>''world''=''formulewerf'') then raise exception ''Open eerst Formulewerf in je eigen leerroute.'';end if;
';begin
 select pg_get_functiondef('axioma_private.rechten_learn_worker_v1(text,jsonb)'::regprocedure) into definition;
 if position(old in definition)=0 then raise exception 'Samen-leren-toegang wijkt af; migratie niet toegepast.';end if;
 definition:=replace(definition,old,'  if not axioma_private.rechten_learn_eligible(uid,skill) then raise exception ''Open eerst deze wereld in je eigen leerroute en synchroniseer je voortgang.'';end if;'||chr(10));
 definition:=replace(definition,'skill not in (''point_plot'',''delta'',''graph_from_equation'')','axioma_private.rechten_learn_world(skill) is null');
 definition:=replace(definition,'''phase'',''lobby'',''round'',0','''phase'',''lobby'',''sequence'',2,''round'',0');
 execute definition;
 select pg_get_functiondef('axioma_private.rechten_learn_worker(text,jsonb)'::regprocedure) into definition;
 definition:=replace(definition,' if p_action not in(',
 ' if p_action=''catalog'' then return jsonb_build_object(''skills'',(select jsonb_agg(to_jsonb(n)||jsonb_build_object(''available'',axioma_private.rechten_learn_eligible(uid,n.skill))) from jsonb_to_recordset(''[{"skill":"point","world":"puntenbaai"},{"skill":"point_plot","world":"puntenbaai"},{"skill":"delta","world":"hellingrug"},{"skill":"slope","world":"hellingrug"},{"skill":"slope_from_two_points","world":"hellingrug"},{"skill":"line_behavior","world":"hellingrug"},{"skill":"special_lines","world":"hellingrug"},{"skill":"zeroRead","world":"grenspas"},{"skill":"zero","world":"grenspas"},{"skill":"positive","world":"grenspas"},{"skill":"negative","world":"grenspas"},{"skill":"signchart","world":"grenspas"},{"skill":"equation_from_ab","world":"formulewerf"},{"skill":"graph_from_equation","world":"formulewerf"},{"skill":"equation_from_graph","world":"formulewerf"},{"skill":"rewrite_linear_equation","world":"formulewerf"},{"skill":"intercept_from_point","world":"formulewerf"},{"skill":"equation_from_point_slope","world":"formulewerf"},{"skill":"equation_from_two_points","world":"formulewerf"},{"skill":"equation_from_table","world":"formulewerf"},{"skill":"graph_from_table","world":"signaalstad"}]''::jsonb) n(skill text,world text)));end if;'||chr(10)||' if p_action not in(');
 definition:=replace(definition,'Open eerst Formulewerf in je eigen leerroute.','Open eerst deze wereld in je eigen leerroute en synchroniseer je voortgang.');
 definition:=replace(definition,'Deze klasgenoot moet eerst Formulewerf openen.','Deze klasgenoot moet eerst deze wereld openen en de voortgang synchroniseren.');
 execute definition;
end $migration$;
