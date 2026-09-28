-- Synthetic accounts; run only inside BEGIN / ROLLBACK.
do $$
declare
 a uuid:=gen_random_uuid();b uuid:=gen_random_uuid();ta uuid:=gen_random_uuid();tb uuid:=gen_random_uuid();
 sid uuid;payload jsonb;q jsonb;other jsonb;answer numeric;event_id uuid;denied boolean;v integer;
begin
 insert into auth.users(id,raw_user_meta_data) values(a,'{"alias":"mixed_test_a","class_code":"3TMW"}'),(b,'{"alias":"mixed_test_b","class_code":"3TMW"}');
 perform set_config('request.jwt.claim.sub',a::text,true);
 payload:=public.axioma_clay_v2('create',ta,null,8);sid:=(payload->'current'->>'id')::uuid;
 if payload->'current'->>'question_version'<>'2' then raise exception 'FAIL: new races must use mixed stream';end if;
 perform set_config('request.jwt.claim.sub',b::text,true);
 denied:=false;begin perform public.axioma_clay('join',tb,sid);exception when others then denied:=true;end;
 if not denied then raise exception 'FAIL: old client can join a mixed race';end if;
 perform public.axioma_clay_v2('join',tb,sid);
 perform set_config('request.jwt.claim.sub',a::text,true);
 perform public.axioma_clay_v2('start',ta,sid);
 update axioma_private.clay_sessions set starts_at=clock_timestamp()-interval '10 seconds' where id=sid;
 update axioma_private.clay_members set next_at=clock_timestamp()-interval '100 milliseconds' where session_id=sid;
 q:=axioma_private.clay_question_v2(sid,0);answer:=(q->>'n')::numeric/(q->>'d')::numeric;event_id:=gen_random_uuid();
 payload:=public.axioma_clay_v2('answer',ta,sid,8,answer,event_id,0);
 if payload->'member'->>'streak'<>'1' then raise exception 'FAIL: generated answer';end if;
 payload:=public.axioma_clay_v2('answer',ta,sid,8,answer,event_id,0);
 if payload->'member'->>'version'<>'1' then raise exception 'FAIL: duplicate answer';end if;
 q:=axioma_private.clay_question_v2(sid,1);
 select c into other from jsonb_array_elements(q->'choices') c where c<>jsonb_build_object('n',q->'n','d',q->'d') limit 1;
 update axioma_private.clay_members set next_at=clock_timestamp()-interval '100 milliseconds' where session_id=sid and user_id=a;
 payload:=public.axioma_clay_v2('answer',ta,sid,8,(other->>'n')::numeric/(other->>'d')::numeric,gen_random_uuid(),1);
 if payload->'member'->>'streak'<>'0' or payload->'member'->>'version'<>'2' then raise exception 'FAIL: miss resets streak but advances stream';end if;
 denied:=false;begin perform public.axioma_clay_v2('answer',tb,sid,8,0,gen_random_uuid(),2);exception when others then denied:=true;end;
 if not denied then raise exception 'FAIL: tab binding';end if;
 for v in 2..8 loop
   q:=axioma_private.clay_question_v2(sid,v);answer:=(q->>'n')::numeric/(q->>'d')::numeric;
   update axioma_private.clay_members set next_at=clock_timestamp()-interval '100 milliseconds' where session_id=sid and user_id=a;
   payload:=public.axioma_clay_v2('answer',ta,sid,8,answer,gen_random_uuid(),v);
 end loop;
 if payload->'current'->>'winner_id'<>a::text or payload->'member'->>'streak'<>'7' then raise exception 'FAIL: seven mixed answers must win';end if;
 payload:=public.axioma_clay_v2('ranking',ta,null,8);
 if not exists(select 1 from jsonb_array_elements(payload->'ranking') r where r->>'user_id'=a::text and r->>'wins'='1') then raise exception 'FAIL: mixed winner in ranking';end if;
 payload:=public.axioma_clay_v2('create',ta,null,8);
 if payload->'current'->>'id'=sid::text then raise exception 'FAIL: replay must get new seed';end if;
 if not exists(select 1 from axioma_private.clay_sessions where id=sid and winner_id=a and status='finished') then raise exception 'FAIL: replay overwrote score';end if;
 if has_function_privilege('anon','public.axioma_clay_v2(text,uuid,uuid,integer,numeric,uuid,integer)','EXECUTE') then raise exception 'FAIL: anonymous access';end if;
 if has_table_privilege('authenticated','axioma_private.clay_sessions','UPDATE') then raise exception 'FAIL: direct score/seed tampering';end if;
end;
$$;
