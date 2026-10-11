-- Versioned teacher assignments. Game practice saves remain separate.
create table axioma_private.os_tasks (
 id uuid primary key, teacher_id uuid not null references auth.users(id),
 title text not null check(length(title) between 1 and 120),
 instructions text not null default '' check(length(instructions)<=3000),
 parts jsonb not null, engine_version integer not null default 1 check(engine_version=1), status text not null default 'draft' check(status in ('draft','published','closed')),
 revision integer not null default 0, created_at timestamptz not null default now(), published_at timestamptz
);
create index os_tasks_teacher on axioma_private.os_tasks(teacher_id,created_at desc);
create table axioma_private.os_task_work (
 task_id uuid references axioma_private.os_tasks(id), user_id uuid references auth.users(id),
 alias text not null, class_code text, status text not null default 'working' check(status in ('working','submitted','reviewed')),
 parts jsonb not null default '{}', grades jsonb, feedback text, revision integer not null default 0,
 submitted_at timestamptz, reviewed_at timestamptz, primary key(task_id,user_id)
);
create index os_task_work_student on axioma_private.os_task_work(user_id,task_id);
alter table axioma_private.os_tasks enable row level security;
alter table axioma_private.os_task_work enable row level security;
revoke all on axioma_private.os_tasks,axioma_private.os_task_work from public,anon,authenticated;

create function axioma_private.os_task_config(parts jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare p jsonb;
begin
 if jsonb_typeof(parts) is distinct from 'array' or jsonb_array_length(parts) not between 1 and 12 then return false;end if;
 for p in select * from jsonb_array_elements(parts) loop
  if jsonb_typeof(p->'points') is distinct from 'number' or p->>'kind' not in ('glass','clay','rights') or p->>'kind' is null or (p->>'points')::numeric not between 1 and 100 then return false;end if;
  if length(coalesce(p->>'instructions',''))>2000 then return false;end if;
  if p->>'kind' in ('rights','clay') and (jsonb_typeof(p->'count') is distinct from 'number' or (p->>'count')::numeric<>trunc((p->>'count')::numeric) or (p->>'count')::int not between 1 and 30 or p->>'count' is null) then return false;end if;
  if p->>'kind'='clay' and ((p->>'speed')::int not in (3,5,8) or p->>'speed' is null) then return false;end if;
  if p->>'kind'='rights' and (jsonb_typeof(p->'skills') is distinct from 'array' or jsonb_array_length(p->'skills') not between 1 and 15 or exists(select 1 from jsonb_array_elements_text(p->'skills') s where s is null or s not in ('point','point_plot','delta','slope','line_behavior','special_lines','zeroRead','zero','signchart','positive','negative','equation_from_ab','graph_from_equation','equation_from_graph','graph_from_table'))) then return false;end if;
 end loop;
 return true;
 exception when others then return false;
end;$$;
revoke all on function axioma_private.os_task_config(jsonb) from public,anon,authenticated;

create function axioma_private.os_task_view(t axioma_private.os_tasks,w axioma_private.os_task_work,teacher boolean) returns jsonb language plpgsql stable set search_path='' as $$
declare data jsonb:=w.parts; k text; p jsonb;
begin
 if not teacher and w.status<>'reviewed' then
  for k,p in select * from jsonb_each(data) loop
   if p ? 'answers' then data:=jsonb_set(data,array[k,'answers'],coalesce((select jsonb_agg(a-'correct') from jsonb_array_elements(p->'answers') a),'[]'));end if;
  end loop;
 end if;
 return jsonb_build_object('server_time',clock_timestamp(),'task',to_jsonb(t),'work',case when w.user_id is null then null else to_jsonb(w)||jsonb_build_object('parts',data,'grades',case when teacher or w.status='reviewed' then w.grades else null end) end);
end;$$;
revoke all on function axioma_private.os_task_view(axioma_private.os_tasks,axioma_private.os_task_work,boolean) from public,anon,authenticated;

create function axioma_private.os_tasks(action text,d jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); teacher boolean:=public.axioma_is_teacher(); t axioma_private.os_tasks%rowtype; w axioma_private.os_task_work%rowtype;
 pid integer; p jsonb; v jsonb; k text; result jsonb; n int; q jsonb; correct boolean; seedid uuid; target uuid; a jsonb;
begin
 if uid is null or (not teacher and not exists(select 1 from public.axioma_profiles where user_id=uid)) then raise exception 'Meld je aan met je leraarBob-account.';end if;
 if d is null or jsonb_typeof(d)<>'object' or octet_length(d::text)>524288 then raise exception 'Ongeldige opdrachtgegevens.';end if;
 if action='list' then
  select coalesce(jsonb_agg(x order by x.created_at desc),'[]') into result from (
   select tt.id,tt.title,tt.status,tt.created_at,tt.parts,(select count(*) from axioma_private.os_task_work where task_id=tt.id) as assigned,
    (select count(*) from axioma_private.os_task_work where task_id=tt.id and status in ('submitted','reviewed')) as submitted,
    (select status from axioma_private.os_task_work where task_id=tt.id and user_id=uid) as work_status
   from axioma_private.os_tasks tt where (teacher and tt.teacher_id=uid) or exists(select 1 from axioma_private.os_task_work ww where ww.task_id=tt.id and ww.user_id=uid)
   order by tt.created_at desc limit 200) x;
  return jsonb_build_object('tasks',result);
 end if;
 if action='students' then
  if not teacher then raise exception 'Alleen de leerkracht kiest leerlingen.';end if;
  return jsonb_build_object('students',(select coalesce(jsonb_agg(jsonb_build_object('id',user_id,'alias',alias,'class_code',class_code) order by class_code,alias),'[]') from public.axioma_profiles));
 end if;
 if action='create' then
  if not teacher then raise exception 'Alleen de leerkracht maakt opdrachten.';end if;
  if not axioma_private.os_task_config(d->'parts') then raise exception 'Controleer de onderdelen en punten.';end if;
  if (select count(*) from axioma_private.os_tasks where teacher_id=uid)>500 then raise exception 'Je hebt het maximum aantal opdrachten bereikt.';end if;
  insert into axioma_private.os_tasks(id,teacher_id,title,instructions,parts) values((d->>'id')::uuid,uid,trim(d->>'title'),coalesce(d->>'instructions',''),d->'parts') on conflict(id) do nothing;
 end if;
 select * into t from axioma_private.os_tasks where id=(d->>'id')::uuid for update;
 if t.id is null then raise exception 'Opdracht niet gevonden.';end if;
 if teacher then
  if t.teacher_id<>uid then raise exception 'Dit is niet jouw opdracht.';end if;
 else
  select * into w from axioma_private.os_task_work where task_id=t.id and user_id=uid for update;
  if w.user_id is null then raise exception 'Deze opdracht is niet aan jou toegewezen.';end if;
 end if;
 if action in ('update','publish','close') then
  if not teacher then raise exception 'Alleen de leerkracht kan dit wijzigen.';end if;
  if action='close' then update axioma_private.os_tasks set status='closed',revision=revision+1 where id=t.id returning * into t;
  else
   if t.status<>'draft' or t.revision is distinct from (d->>'revision')::int then raise exception 'Deze versie is gewijzigd of al uitgedeeld. Open de opdracht opnieuw.';end if;
   if action='update' then
    if not axioma_private.os_task_config(d->'parts') then raise exception 'Controleer de onderdelen en punten.';end if;
    update axioma_private.os_tasks set title=trim(d->>'title'),instructions=coalesce(d->>'instructions',''),parts=d->'parts',revision=revision+1 where id=t.id returning * into t;
   else
    if jsonb_typeof(d->'students') is distinct from 'array' or jsonb_array_length(d->'students') not between 1 and 200 then raise exception 'Kies 1 tot 200 leerlingen.';end if;
    for v in select * from jsonb_array_elements(d->'students') loop
     target:=(v#>>'{}')::uuid;
     if not exists(select 1 from public.axioma_profiles where user_id=target) then raise exception 'Een leerling bestaat niet meer.';end if;
     insert into axioma_private.os_task_work(task_id,user_id,alias,class_code) select t.id,user_id,alias,class_code from public.axioma_profiles where user_id=target on conflict do nothing;
    end loop;
    update axioma_private.os_tasks set status='published',published_at=clock_timestamp(),revision=revision+1 where id=t.id returning * into t;
   end if;
  end if;
 elsif action in ('glass_save','rights_draft','clay_start','clay_answer','submit') then
  if teacher or t.status<>'published' or w.status<>'working' then
   if action='submit' and not teacher and w.status in ('submitted','reviewed') then return axioma_private.os_task_view(t,w,false);end if;
   raise exception 'Deze inzending kan niet meer worden gewijzigd.';
  end if;
  pid:=(d->>'part')::int;k:=pid::text;p:=t.parts->pid;v:=coalesce(w.parts->k,'{}');
  if action<>'submit' and (pid is null or pid<0 or pid>=jsonb_array_length(t.parts)) then raise exception 'Onbekend onderdeel.';end if;
  if action='glass_save' then
   if p->>'kind'<>'glass' or jsonb_typeof(d->'draft') is distinct from 'object' then raise exception 'Geen glasraamonderdeel.';end if;
   if w.revision is distinct from (d->>'revision')::int then raise exception 'Je werk is elders gewijzigd. Heropen vóór je bewaart.';end if;
   if coalesce((d->>'done')::boolean,false) and (d->'draft'->>'mode' is distinct from 'design' or jsonb_typeof(d->'draft'->'free'->'lines') is distinct from 'array' or jsonb_array_length(d->'draft'->'free'->'lines')=0) then raise exception 'Teken eerst je raam.';end if;
   v:=jsonb_build_object('draft',d->'draft','done',coalesce((d->>'done')::boolean,false));
  elsif action='rights_draft' then
   if p->>'kind'<>'rights' or jsonb_typeof(d->'draft') is distinct from 'object' then raise exception 'Geen geldig tussenantwoord.';end if;
   n:=jsonb_array_length(coalesce(v->'answers','[]'));
   if n is distinct from (d->>'index')::int or coalesce((v->>'done')::boolean,false) then return axioma_private.os_task_view(t,w,false);end if;
   v:=v||jsonb_build_object('answers',coalesce(v->'answers','[]'),'draft',d->'draft');
  elsif action='clay_start' then
   if p->>'kind'<>'clay' then raise exception 'Geen kleiduifonderdeel.';end if;
   if not (v ? 'started_at') then v:=jsonb_build_object('answers','[]'::jsonb,'started_at',clock_timestamp()+interval '3 seconds','next_at',clock_timestamp()+interval '3 seconds','seed_id',md5(t.id::text||':'||pid)::uuid);end if;
  elsif action='clay_answer' then
   if p->>'kind'<>'clay' or not (v ? 'started_at') then raise exception 'Start eerst je kleiduifreeks.';end if;
   n:=jsonb_array_length(v->'answers');
   if exists(select 1 from jsonb_array_elements(v->'answers') x where x->>'event'=d->>'event') then return axioma_private.os_task_view(t,w,false);end if;
   if n is distinct from (d->>'index')::int or n>=(p->>'count')::int then raise exception 'Dit schot is al verwerkt.';end if;
   if clock_timestamp()<(v->>'next_at')::timestamptz then raise exception 'Wacht op het volgende doel.';end if;
   seedid:=md5(t.id::text||':'||pid)::uuid;q:=axioma_private.clay_question_v2(seedid,n);
   if d->>'answer' is not null and not exists(select 1 from jsonb_array_elements(q->'choices') c where abs((d->>'answer')::numeric-(c->>'n')::numeric/(c->>'d')::numeric)<0.000000001) then raise exception 'Kies een getoonde richting.';end if;
   if d->>'event' is null then raise exception 'Antwoordcode ontbreekt.';end if;
   correct:=coalesce(abs((d->>'answer')::numeric-(q->>'n')::numeric/(q->>'d')::numeric)<0.000000001,false) and clock_timestamp()<=(v->>'next_at')::timestamptz+make_interval(secs=>(p->>'speed')::int);
   v:=v||jsonb_build_object('answers',(v->'answers')||jsonb_build_array(jsonb_build_object('event',d->>'event','answer',d->'answer','correct',correct,'at',clock_timestamp())),'next_at',clock_timestamp()+interval '800 milliseconds','done',n+1=(p->>'count')::int);
  elsif action='submit' then
   for n in 0..jsonb_array_length(t.parts)-1 loop
    if not coalesce((w.parts->(n::text)->>'done')::boolean,false) then raise exception 'Rond eerst elk onderdeel af.';end if;
   end loop;
   update axioma_private.os_task_work set status='submitted',submitted_at=clock_timestamp(),revision=revision+1 where task_id=t.id and user_id=uid returning * into w;
   return axioma_private.os_task_view(t,w,false);
  end if;
  update axioma_private.os_task_work set parts=jsonb_set(parts,array[k],v),revision=revision+1 where task_id=t.id and user_id=uid returning * into w;
 elsif action='review' then
  if not teacher then raise exception 'Alleen de leerkracht beoordeelt.';end if;
  select * into w from axioma_private.os_task_work where task_id=t.id and user_id=(d->>'student')::uuid for update;
  if w.status not in ('submitted','reviewed') or w.user_id is null then raise exception 'Deze leerling heeft nog niet ingediend.';end if;
  if w.revision is distinct from (d->>'revision')::int then raise exception 'De beoordeling is elders gewijzigd. Vernieuw eerst.';end if;
  if jsonb_typeof(d->'grades') is distinct from 'array' or jsonb_array_length(d->'grades')<>jsonb_array_length(t.parts) then raise exception 'Geef elk onderdeel punten.';end if;
  for n in 0..jsonb_array_length(t.parts)-1 loop
   if jsonb_typeof(d->'grades'->n) is distinct from 'number' or (d->'grades'->>n)::numeric<0 or (d->'grades'->>n)::numeric>(t.parts->n->>'points')::numeric then raise exception 'Punten buiten bereik.';end if;
  end loop;
  if length(coalesce(d->>'feedback',''))>3000 then raise exception 'Feedback is te lang.';end if;
  update axioma_private.os_task_work set status='reviewed',grades=d->'grades',feedback=coalesce(d->>'feedback',''),reviewed_at=clock_timestamp(),revision=revision+1 where task_id=t.id and user_id=w.user_id returning * into w;
 elsif action not in ('get','create') then raise exception 'Onbekende opdrachtactie.';
 end if;
 if teacher then
  select coalesce(jsonb_agg(axioma_private.os_task_view(t,x,true)->'work' order by x.class_code,x.alias),'[]') into result from axioma_private.os_task_work x where task_id=t.id;
  return jsonb_build_object('task',to_jsonb(t),'submissions',result);
 end if;
 return axioma_private.os_task_view(t,w,false);
end;$$;
revoke all on function axioma_private.os_tasks(text,jsonb) from public,anon;
grant execute on function axioma_private.os_tasks(text,jsonb) to authenticated;
create function public.axioma_os_tasks(p_action text,p_data jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select axioma_private.os_tasks(p_action,p_data)$$;
revoke all on function public.axioma_os_tasks(text,jsonb) from public,anon;
grant execute on function public.axioma_os_tasks(text,jsonb) to authenticated;

-- Only the authenticated Edge worker grades native Rechtenwereld answers.
create function public.axioma_os_task_worker(p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare t axioma_private.os_tasks%rowtype; w axioma_private.os_task_work%rowtype; uid uuid:=(p_data->>'user')::uuid;
 pid int:=(p_data->>'part')::int; n int; p jsonb; v jsonb; spec jsonb; seed int;
begin
 select * into t from axioma_private.os_tasks where id=(p_data->>'id')::uuid for update;
 select * into w from axioma_private.os_task_work where task_id=t.id and user_id=uid for update;
 if w.user_id is null or t.status<>'published' or w.status<>'working' or pid is null or pid<0 or pid>=jsonb_array_length(t.parts) then raise exception 'Geen actieve toegewezen toets.';end if;
 p:=t.parts->pid;v:=coalesce(w.parts->pid::text,jsonb_build_object('answers','[]'::jsonb));n:=jsonb_array_length(v->'answers');
 if p->>'kind'<>'rights' then raise exception 'Geen Rechtenwereldonderdeel.';end if;
 if p_action in ('work','commit') and p_data->>'event' is not null and exists(select 1 from jsonb_array_elements(v->'answers') a where a->>'event'=p_data->>'event') then return case when p_action='work' then jsonb_build_object('receipt',axioma_private.os_task_view(t,w,false)) else axioma_private.os_task_view(t,w,false) end;end if;
 if n>=(p->>'count')::int then raise exception 'Dit onderdeel is afgerond.';end if;
 seed:=abs(('x'||substr(md5(t.id::text||':'||pid||':'||n),1,7))::bit(28)::int);
 spec:=jsonb_build_object('seed',seed,'variant',n,'skill',p->'skills'->(n%jsonb_array_length(p->'skills')),'index',n,'match',t.id::text||':'||pid);
 if p_action='work' then return jsonb_build_object('spec',spec);end if;
 if p_action<>'commit' or n is distinct from (p_data->>'index')::int or p_data->>'event' is null then raise exception 'Deze vraag is al verwerkt.';end if;
 v:=jsonb_build_object('answers',(v->'answers')||jsonb_build_array(jsonb_build_object('event',p_data->>'event','spec',spec,'answer',p_data->'answer','correct',coalesce((p_data->>'correct')::boolean,false),'at',clock_timestamp())),'done',n+1=(p->>'count')::int);
 update axioma_private.os_task_work set parts=jsonb_set(parts,array[pid::text],v),revision=revision+1 where task_id=t.id and user_id=uid returning * into w;
 return axioma_private.os_task_view(t,w,false);
end;$$;
revoke all on function public.axioma_os_task_worker(text,jsonb) from public,anon,authenticated;
grant execute on function public.axioma_os_task_worker(text,jsonb) to service_role;
notify pgrst,'reload schema';
