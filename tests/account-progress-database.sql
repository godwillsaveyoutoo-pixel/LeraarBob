-- Execute inside BEGIN/ROLLBACK. Synthetic users and progress never persist.
do $$
declare
 a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); result jsonb; denied boolean;
begin
 insert into auth.users(id,raw_user_meta_data) values
  (a,jsonb_build_object('alias','check_a_'||substr(a::text,1,8),'class_code','3TMW')),
  (b,jsonb_build_object('alias','check_b_'||substr(b::text,1,8),'class_code','3TMW'));
 perform set_config('request.jwt.claim.sub',a::text,true);
 result:=public.axioma_save_game_progress_for_account('vectoren-trainer','{"completed":[],"total":24,"storage":{}}',0,a);
 if result->>'status'<>'saved' or (result->>'revision')::int<>1 then raise exception 'FAIL initial save'; end if;
 result:=public.axioma_save_game_progress_for_account('vectoren-trainer','{"completed":["coords"],"total":24}',0,a);
 if result->>'status'<>'conflict' then raise exception 'FAIL conflict'; end if;
 perform set_config('request.jwt.claim.sub',b::text,true);
 denied:=false;
 begin perform public.axioma_save_game_progress_for_account('vectoren-trainer','{}',1,a); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'FAIL account swap accepted'; end if;
 denied:=false;
 begin perform public.axioma_save_progress_for_account('{}',0,a); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'FAIL trainer account swap accepted'; end if;
 if exists(select 1 from public.axioma_game_progress where user_id=b) then raise exception 'FAIL contaminated account B'; end if;
 if has_function_privilege('anon','public.axioma_save_game_progress_for_account(text,jsonb,bigint,uuid)','execute') then raise exception 'FAIL anonymous grant'; end if;
 if not has_function_privilege('authenticated','public.axioma_save_game_progress_for_account(text,jsonb,bigint,uuid)','execute') then raise exception 'FAIL missing authenticated grant'; end if;
end;
$$;
