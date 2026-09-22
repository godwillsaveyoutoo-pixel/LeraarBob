-- Run with the candidate function cloned into pg_temp.wave_save_progress.
-- The harness replaces ONLY table names with temporary fixture tables.
-- Never reads or modifies a real student's progress. Always BEGIN/ROLLBACK.
create temporary table wave_profiles(user_id uuid primary key);
create temporary table wave_progress(user_id uuid primary key,state jsonb,revision bigint,updated_at timestamptz);
do $$
declare
 uid uuid:=gen_random_uuid(); original jsonb; wave jsonb; result jsonb; denied boolean; k text;
begin
 insert into wave_profiles values(uid);
 perform set_config('request.jwt.claim.sub',uid::text,true);
 original:='{"version":700,"xp":42,"total":5,"correct":4,"streak":1,"routeStep":0,"session":{},"skills":{},"review":[],"telemetry":[]}'::jsonb;
 foreach k in array array['delta','slope','point','intercept','ab','fx','table','zeroRead','zero','sign','signchart'] loop
  original:=jsonb_set(original,array['skills',k],'{"strength":0.5,"seen":5,"correct":4}');
 end loop;
 result:=pg_temp.wave_save_progress(original,0);
 if result->>'status'<>'saved' then raise exception 'FAIL v700 initial save'; end if;
 wave:=jsonb_set(original,'{version}','701');
 foreach k in array array['slope_from_two_points','line_behavior','special_lines','intercept_from_point','equation_from_point_slope','equation_from_two_points'] loop
  wave:=jsonb_set(wave,array['skills',k],'{"strength":0,"seen":0,"correct":0}');
 end loop;
 result:=pg_temp.wave_save_progress(wave,1);
 if result->>'status'<>'saved' or result->>'revision'<>'2' then raise exception 'FAIL upgrade'; end if;
 if (select state->'xp' from wave_progress where user_id=uid)<>'42'::jsonb then raise exception 'FAIL lost XP'; end if;
 result:=pg_temp.wave_save_progress(wave,1);
 if result->>'status'<>'conflict' or result->'state'<>wave then raise exception 'FAIL revision conflict'; end if;
 denied:=false;
 begin perform pg_temp.wave_save_progress(original,2); exception when invalid_parameter_value then denied:=true; end;
 if not denied then raise exception 'FAIL stale client overwrite with current revision'; end if;
 denied:=false;
 begin perform pg_temp.wave_save_progress(wave #- '{skills,special_lines}',2); exception when invalid_parameter_value then denied:=true; end;
 if not denied then raise exception 'FAIL missing new skill'; end if;
 -- Upgrade a v701 account to v702, retaining earlier skills and counters.
 wave:=jsonb_set(wave,'{version}','702');
 foreach k in array array['point_plot','equation_from_ab','graph_from_equation'] loop
  wave:=jsonb_set(wave,array['skills',k],'{"strength":0,"seen":0,"correct":0}');
 end loop;
 result:=pg_temp.wave_save_progress(wave,2);
 if result->>'status'<>'saved' or result->>'revision'<>'3' then raise exception 'FAIL v702 upgrade'; end if;
 denied:=false;
 begin perform pg_temp.wave_save_progress(jsonb_set(wave,'{version}','701'),3); exception when invalid_parameter_value then denied:=true; end;
 if not denied then raise exception 'FAIL v701 overwrite with current revision'; end if;
 denied:=false;
 begin perform pg_temp.wave_save_progress(wave #- '{skills,point_plot}',3); exception when invalid_parameter_value then denied:=true; end;
 if not denied then raise exception 'FAIL missing point_plot'; end if;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 denied:=false;
 begin perform pg_temp.wave_save_progress(wave,2); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'FAIL missing learner authorization'; end if;
 if (select count(*) from wave_progress)<>1 then raise exception 'FAIL contaminated other account'; end if;
 if (select state from wave_progress where user_id=uid)<>wave then raise exception 'FAIL changed saved state'; end if;
end;
$$;
select 'PASS: v700, v701, v702, construction skills, counters, all skills, revisions, stale clients and account binding; temporary fixtures only' as result;
