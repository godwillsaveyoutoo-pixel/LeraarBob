-- Synthetic test data. Always surround with BEGIN / ROLLBACK.
do $$
declare
 a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); c uuid:=gen_random_uuid();
 ta uuid:=gen_random_uuid(); tb uuid:=gen_random_uuid(); tc uuid:=gen_random_uuid();
 sid uuid; eid uuid; nid uuid:=gen_random_uuid(); payload jsonb; denied boolean; v integer; answer numeric;
begin
 insert into auth.users(id,raw_user_meta_data) values
 (a,'{"alias":"clay_test_a","class_code":"3TMW"}'),
 (b,'{"alias":"clay_test_b","class_code":"3TMW"}'),
 (c,'{"alias":"clay_test_c","class_code":"3TMW"}');
 perform set_config('request.jwt.claim.sub',a::text,true);
 perform public.axioma_social('sync',ta);
 payload:=public.axioma_clay('create',ta);sid:=(payload->'current'->>'id')::uuid;
 denied:=false;
 begin perform public.axioma_clay('start',ta,sid);exception when others then denied:=true;end;
 if not denied then raise exception 'FAIL: cannot start alone';end if;
 perform set_config('request.jwt.claim.sub',b::text,true);
 perform public.axioma_social('sync',tb);
 perform public.axioma_clay('join',tb,sid);
 denied:=false;
 begin perform public.axioma_clay('start',tb,sid);exception when others then denied:=true;end;
 if not denied then raise exception 'FAIL: only host can start';end if;
 denied:=false;
 begin perform public.axioma_social('invite',tb,a);exception when others then denied:=true;end;
 if not denied then raise exception 'FAIL: group and naval overlap';end if;
 perform set_config('request.jwt.claim.sub',c::text,true);
 payload:=public.axioma_clay('sync',tc,sid);
 if payload->'current'<>'null'::jsonb or jsonb_array_length(payload->'members')<>0 then raise exception 'FAIL: private participant data';end if;
 perform public.axioma_clay('join',tc,sid);
 perform set_config('request.jwt.claim.sub',a::text,true);
 payload:=public.axioma_clay('start',ta,sid);
 if payload->'current'->>'status'<>'running' then raise exception 'FAIL: start';end if;
 denied:=false;
 begin perform public.axioma_clay('answer',ta,sid,5,1,gen_random_uuid(),0);exception when others then denied:=true;end;
 if not denied then raise exception 'FAIL: answering during countdown';end if;
 update axioma_private.clay_sessions set starts_at=clock_timestamp()-interval '10 seconds' where id=sid;
 update axioma_private.clay_members set next_at=clock_timestamp()-interval '100 milliseconds' where session_id=sid;
 eid:=gen_random_uuid();payload:=public.axioma_clay('answer',ta,sid,5,1,eid,0);
 if (payload->'member'->>'streak')::int<>1 then raise exception 'FAIL: first correct answer';end if;
 payload:=public.axioma_clay('answer',ta,sid,5,1,eid,0);
 if (payload->'member'->>'version')::int<>1 then raise exception 'FAIL: duplicate counts twice';end if;
 update axioma_private.clay_members set next_at=clock_timestamp()-interval '100 milliseconds' where session_id=sid and user_id=a;
 payload:=public.axioma_clay('answer',ta,sid,5,2,gen_random_uuid(),1);
 if (payload->'member'->>'streak')::int<>0 or (payload->'member'->>'misses')::int<>1 then raise exception 'FAIL: a mistake must reset entire series';end if;
 update axioma_private.clay_members set next_at=clock_timestamp()-interval '6 seconds' where session_id=sid and user_id=a;
 payload:=public.axioma_clay('answer',ta,sid,5,1,gen_random_uuid(),2);
 if (payload->'member'->>'streak')::int<>0 or (payload->'member'->>'misses')::int<>2 then raise exception 'FAIL: timeout counts as miss';end if;
 denied:=false;
 begin perform public.axioma_clay('answer',ta,sid,5,1,gen_random_uuid(),0);exception when others then denied:=true;end;
 if not denied then raise exception 'FAIL: stale version';end if;
 denied:=false;
 begin perform public.axioma_clay('answer',tc,sid,5,1,gen_random_uuid(),3);exception when others then denied:=true;end;
 if not denied then raise exception 'FAIL: other tab';end if;
 v:=3;
 foreach answer in array array[1,-1,2,-0.5,0.5,-2,0]::numeric[] loop
   update axioma_private.clay_members set next_at=clock_timestamp()-interval '100 milliseconds' where session_id=sid and user_id=a;
   eid:=gen_random_uuid();payload:=public.axioma_clay('answer',ta,sid,5,answer,eid,v);v:=v+1;
 end loop;
 if payload->'current'->>'winner_id'<>a::text or payload->'current'->>'status'<>'finished' then raise exception 'FAIL: first flawless series wins';end if;
 payload:=public.axioma_clay('answer',ta,sid,5,0,eid,v-1);
 if (payload->'member'->>'version')::int<>10 then raise exception 'FAIL: winner retry';end if;
 perform set_config('request.jwt.claim.sub',b::text,true);
 denied:=false;
 begin perform public.axioma_clay('answer',tb,sid,5,1,gen_random_uuid(),0);exception when others then denied:=true;end;
 if not denied then raise exception 'FAIL: second winner';end if;
 payload:=public.axioma_clay('ranking',tb,null,5);
 if not exists(select 1 from jsonb_array_elements(payload->'ranking') r where r->>'user_id'=a::text and r->>'wins'='1') then raise exception 'FAIL: winner appears immediately in ranking';end if;
 payload:=public.axioma_clay('ranking',tb,null,3);
 if exists(select 1 from jsonb_array_elements(payload->'ranking') r where r->>'user_id'=a::text) then raise exception 'FAIL: tempo rankings separated';end if;
 -- Zeeslag: no five-match threshold.
 insert into public.axioma_multiplayer_matches(id,game_id,player1_id,player2_id,created_by,status,winner_id,completed_at)
 values(nid,'rechten-zeeslag',a,b,a,'completed',a,now());
 payload:=public.axioma_naval_ranking();
 if not exists(select 1 from jsonb_array_elements(payload) r where r->>'user_id'=a::text and r->>'played'='1' and r->>'won'='1') then raise exception 'FAIL: naval ranking first win';end if;
 if has_function_privilege('anon','public.axioma_clay(text,uuid,uuid,integer,numeric,uuid,integer)','EXECUTE') then raise exception 'FAIL: anonymous group access';end if;
 if has_table_privilege('authenticated','axioma_private.clay_members','UPDATE') then raise exception 'FAIL: direct score manipulation';end if;
end;
$$;
