-- Run inside BEGIN/ROLLBACK. All users and progress are synthetic and discarded.
do $$
declare
 a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); result jsonb; denied boolean;
 world jsonb := '{"rechtenV2":{"schema":1,"screen":"world","active":null,"missions":{},"events":[],"settings":{},"platformXp":40,"xpLedger":{"version":1,"total":40,"awards":{}}}}';
begin
 insert into auth.users(id,raw_user_meta_data) values
  (a,jsonb_build_object('alias','xpcheck_'||substr(a::text,1,8),'class_code','3TMW')),
  (b,jsonb_build_object('alias','xpcheck_'||substr(b::text,1,8),'class_code','3TMW'));
 insert into public.axioma_progress(user_id,state,revision) values(a,'{"xp":90,"skills":{"preserve":true}}',1);
 perform set_config('request.jwt.claim.sub',a::text,true);
 execute 'set local role authenticated';
 result:=public.axioma_save_game_progress_for_account('rechten-trainer',world,0,a);
 if result->>'status' is distinct from 'saved' or result->>'revision' is distinct from '1' then raise exception 'FAIL initial save'; end if;
 if (select state->'rechtenV2'->>'platformXp' from public.axioma_game_progress where user_id=a and game_id='rechten-trainer') is distinct from '40' then raise exception 'FAIL XP read'; end if;
 result:=public.axioma_save_game_progress_for_account('rechten-trainer',world,0,a);
 if result->>'status' is distinct from 'conflict' then raise exception 'FAIL stale revision'; end if;
 result:=public.axioma_save_game_progress_for_account('rechten-trainer',world,1,a);
 if result->>'revision' is distinct from '2' then raise exception 'FAIL second save'; end if;
 denied:=false;
 begin perform public.axioma_save_game_progress_for_account('rechten-trainer','{"xp":90}',2,a); exception when invalid_parameter_value then denied:=true; end;
 if not denied then raise exception 'FAIL missing namespace accepted'; end if;
 if (select state->>'xp' from public.axioma_progress where user_id=a) is distinct from '90' then raise exception 'FAIL legacy XP changed'; end if;
 perform set_config('request.jwt.claim.sub',b::text,true);
 if exists(select 1 from public.axioma_game_progress where user_id=a) then raise exception 'FAIL other student visible'; end if;
 denied:=false;
 begin perform public.axioma_save_game_progress_for_account('rechten-trainer',world,2,a); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'FAIL other account write accepted'; end if;
 if has_function_privilege('anon','axioma_private.save_game_progress(text,jsonb,bigint)','execute') then raise exception 'FAIL anonymous grant'; end if;
 execute 'reset role';
end;
$$;
