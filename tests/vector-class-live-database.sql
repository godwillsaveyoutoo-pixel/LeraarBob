-- Entire test is rolled back; no synthetic account, session or answer persists.
begin;
do $$
declare
 teacher_id uuid:=gen_random_uuid(); student_id uuid:=gen_random_uuid(); other_id uuid:=gen_random_uuid(); late_id uuid:=gen_random_uuid();
 state jsonb; room uuid; code text; deck jsonb; denied boolean; score integer;
begin
 insert into auth.users(id,raw_user_meta_data) values
  (teacher_id,jsonb_build_object('alias','vct_'||substr(teacher_id::text,1,8),'class_code','3TMW')),
  (student_id,jsonb_build_object('alias','vca_'||substr(student_id::text,1,8),'class_code','3TMW')),
  (other_id,jsonb_build_object('alias','vcb_'||substr(other_id::text,1,8),'class_code','3TMW')),
  (late_id,jsonb_build_object('alias','vcl_'||substr(late_id::text,1,8),'class_code','3TMW'));
 insert into axioma_private.teachers(user_id) values(teacher_id);
 select jsonb_agg(jsonb_build_object('skill','opposite','seed',100+i,'variant',0,'level',1)) into deck from generate_series(1,5) i;
 perform set_config('request.jwt.claim.sub',teacher_id::text,true);
 state:=public.axioma_vector_class('create',jsonb_build_object('deck',deck,'seconds',60));room:=(state->>'id')::uuid;code:=state->>'code';
 if state->>'phase'<>'lobby' or jsonb_array_length(state->'members')<>0 then raise exception 'FAIL create'; end if;
 perform set_config('request.jwt.claim.sub',student_id::text,true);
 state:=public.axioma_vector_class('join',jsonb_build_object('code',code));
 state:=public.axioma_vector_class('join',jsonb_build_object('code',code));
 if jsonb_array_length(state->'members')<>1 then raise exception 'FAIL duplicate join'; end if;
 denied:=false;begin perform public.axioma_vector_class('start',jsonb_build_object('id',room));exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'FAIL student can start'; end if;
 perform set_config('request.jwt.claim.sub',other_id::text,true);perform public.axioma_vector_class('join',jsonb_build_object('code',code));
 perform set_config('request.jwt.claim.sub',teacher_id::text,true);state:=public.axioma_vector_class('start',jsonb_build_object('id',room));
 if state->>'phase'<>'question' or (state->>'round')::integer<>0 then raise exception 'FAIL start'; end if;
 perform set_config('request.jwt.claim.sub',late_id::text,true);
 state:=public.axioma_vector_class('join',jsonb_build_object('code',code));
 if not exists(select 1 from jsonb_array_elements(state->'members') m where m->>'user_id'=late_id::text and (m->>'eligible_from_round')::integer=1) then raise exception 'FAIL late eligibility'; end if;
 denied:=false;begin perform public.axioma_vector_class('submit',jsonb_build_object('id',room,'round',0,'answer','{}'::jsonb));exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'FAIL late submission allowed'; end if;
 perform set_config('request.jwt.claim.sub',student_id::text,true);
 state:=public.axioma_vector_class('submit',jsonb_build_object('id',room,'round',0,'answer','{}'::jsonb));
 state:=public.axioma_vector_class('submit',jsonb_build_object('id',room,'round',0,'answer','{"changed":true}'::jsonb));
 if state#>>'{mine,correct}' is not null or state->>'submissions' is not null then raise exception 'FAIL early answers revealed'; end if;
 perform set_config('request.jwt.claim.sub',other_id::text,true);
 state:=public.axioma_vector_class('submit',jsonb_build_object('id',room,'round',0,'answer','{}'::jsonb,'skipped',true));
 if state->>'phase'<>'grading' then raise exception 'FAIL all answered'; end if;
 perform set_config('request.jwt.claim.sub',teacher_id::text,true);
 state:=public.axioma_vector_class('state',jsonb_build_object('id',room));
 if jsonb_array_length(state->'submissions')<>2 then raise exception 'FAIL teacher answers'; end if;
 state:=public.axioma_vector_class('grade',jsonb_build_object('id',room,'round',0,'grades',jsonb_build_array(jsonb_build_object('user_id',student_id,'correct',true),jsonb_build_object('user_id',other_id,'correct',false))));
 if state->>'phase'<>'results' then raise exception 'FAIL results'; end if;
 perform set_config('request.jwt.claim.sub',student_id::text,true);
 state:=public.axioma_vector_class('state',jsonb_build_object('id',room));score:=(state#>>'{mine,points}')::integer;
 if score<500 or score>1000 or state#>>'{mine,correct}'<>'true' then raise exception 'FAIL score'; end if;
 perform set_config('request.jwt.claim.sub',teacher_id::text,true);
 state:=public.axioma_vector_class('next',jsonb_build_object('id',room));
 perform set_config('request.jwt.claim.sub',late_id::text,true);
 state:=public.axioma_vector_class('submit',jsonb_build_object('id',room,'round',1,'answer','{}'::jsonb));
 if state#>>'{mine,submitted}'<>'true' then raise exception 'FAIL late participant next round'; end if;
 if has_function_privilege('anon','public.axioma_vector_class(text,jsonb)','execute') or has_table_privilege('authenticated','axioma_private.vector_class_answers','select') then raise exception 'FAIL grants'; end if;
end;
$$;
rollback;
select 'PASS: central classroom session, teacher permissions, three students including late arrival, single submission, grading and scoring; synthetic data rolled back' as result;
