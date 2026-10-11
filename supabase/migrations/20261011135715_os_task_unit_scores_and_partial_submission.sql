-- Keep completed work intact; freeze one point per validated item at submission.
alter table axioma_private.os_task_work add column result jsonb;

-- The same fixed eight patterns as GlasatelierCore. Evidence is checked here,
-- never a score or a count supplied by the browser.
create function axioma_private.os_task_glass_result(d jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare patterns jsonb:='{"morgenlicht":{"name":"Morgenlicht","lines":[{"type":"function","a":1,"b":0},{"type":"function","a":-1,"b":0},{"type":"function","a":0,"b":2},{"type":"vertical","x":-3}]},"kleurenpoort":{"name":"Kleurenpoort","lines":[{"type":"function","a":0.5,"b":-2},{"type":"function","a":-1,"b":3},{"type":"function","a":0,"b":1},{"type":"vertical","x":2},{"type":"function","a":1,"b":-4},{"type":"function","a":-0.5,"b":-3}]},"avondgloed":{"name":"Avondgloed","lines":[{"type":"function","a":2,"b":1},{"type":"function","a":-2,"b":-1},{"type":"function","a":0.5,"b":3},{"type":"function","a":-0.5,"b":-3},{"type":"function","a":0,"b":2},{"type":"function","a":0,"b":-2},{"type":"vertical","x":-3},{"type":"vertical","x":3}]},"zonneroos":{"name":"Zonneroos","lines":[{"type":"function","a":1,"b":0},{"type":"function","a":-1,"b":0},{"type":"function","a":1,"b":4},{"type":"function","a":-1,"b":4},{"type":"function","a":1,"b":-4},{"type":"function","a":-1,"b":-4}]},"noorderlicht":{"name":"Noorderlicht","lines":[{"type":"function","a":0.5,"b":0},{"type":"function","a":-0.5,"b":0},{"type":"function","a":0.5,"b":3},{"type":"function","a":-0.5,"b":3},{"type":"function","a":0.5,"b":-3},{"type":"function","a":-0.5,"b":-3},{"type":"vertical","x":-4},{"type":"vertical","x":4}]},"pauwenveer":{"name":"Pauwenveer","lines":[{"type":"function","a":2,"b":0},{"type":"function","a":-2,"b":0},{"type":"function","a":2,"b":4},{"type":"function","a":-2,"b":4},{"type":"function","a":2,"b":-4},{"type":"function","a":-2,"b":-4},{"type":"function","a":0,"b":2},{"type":"function","a":0,"b":-2}]},"kristaltuin":{"name":"Kristaltuin","lines":[{"type":"function","a":1,"b":2},{"type":"function","a":-1,"b":2},{"type":"function","a":1,"b":-2},{"type":"function","a":-1,"b":-2},{"type":"function","a":1,"b":5},{"type":"function","a":-1,"b":5},{"type":"function","a":1,"b":-5},{"type":"function","a":-1,"b":-5},{"type":"vertical","x":0},{"type":"function","a":0,"b":0}]},"artdeco":{"name":"Art deco","lines":[{"type":"function","a":2,"b":0},{"type":"function","a":-2,"b":0},{"type":"function","a":2,"b":4},{"type":"function","a":-2,"b":4},{"type":"function","a":2,"b":-4},{"type":"function","a":-2,"b":-4},{"type":"vertical","x":-3},{"type":"vertical","x":3}]}}'; preset jsonb; line jsonb; proof jsonb; pt jsonb;
 items jsonb:='[]'; seen jsonb:='[]'; source jsonb; valid boolean; hit boolean;
 score int:=0; maximum int:=12; n int; i int; a numeric; b numeric; x numeric; y numeric; label text;
begin
 if d->>'mode'='restore' then
  preset:=patterns->(d->>'pattern');maximum:=coalesce(jsonb_array_length(preset->'lines'),12);
  source:=d->'drafts'->(d->>'pattern');
  for line,n in select value,ordinality::int-1 from jsonb_array_elements(coalesce(preset->'lines','[]')) with ordinality loop
   valid:=false;
   if jsonb_typeof(source->'count')='number' and (source->>'count')::numeric>n then
    -- Accepted points survive undo history truncation. Old drafts also contain
    -- the two points immediately before each successful Check action.
    for proof in select value from jsonb_array_elements(coalesce(source->'history','[]') || coalesce(source->'accepted','[]')) loop
     if proof->>'count' is distinct from n::text or jsonb_typeof(proof->'points') is distinct from 'array' then continue;end if;
     if jsonb_array_length(proof->'points')<>2 or proof->'points'->0=proof->'points'->1 then continue;end if;
     hit:=true;
     for pt in select value from jsonb_array_elements(proof->'points') loop
      if jsonb_typeof(pt->'x') is distinct from 'number' or jsonb_typeof(pt->'y') is distinct from 'number' then hit:=false;exit;end if;
      x:=(pt->>'x')::numeric;y:=(pt->>'y')::numeric;
      if x<>trunc(x) or y<>trunc(y) or abs(x)>16 or abs(y)>16 or
       (line->>'type'='vertical' and abs(x-(line->>'x')::numeric)>0.00000001) or
       (line->>'type'='function' and abs(y-(line->>'a')::numeric*x-(line->>'b')::numeric)>0.00000001) then hit:=false;exit;end if;
     end loop;
     if hit then valid:=true;exit;end if;
    end loop;
   end if;
   label:=case when line->>'type'='vertical' then 'x = '||(line->>'x') else 'y = '||(line->>'a')||'x + ('||(line->>'b')||')' end;
   items:=items||jsonb_build_array(jsonb_build_object('label',label,'correct',valid));if valid then score:=score+1;end if;
  end loop;
 elsif d->>'mode'='design' then
  for line in select value from jsonb_array_elements(case when jsonb_typeof(d->'free'->'lines')='array' then d->'free'->'lines' else '[]' end) limit 12 loop
   valid:=false;label:='Ongeldige lijn';
   if line->>'type'='vertical' and jsonb_typeof(line->'x')='number' then
    x:=(line->>'x')::numeric;valid:=abs(x)<16;label:='x = '||x;
    if exists(select 1 from jsonb_array_elements(seen) s where s->>'type'='vertical' and abs((s->>'x')::numeric-x)<0.00000001) then valid:=false;end if;
   elsif line->>'type'='function' and jsonb_typeof(line->'a')='number' and jsonb_typeof(line->'b')='number' then
    a:=(line->>'a')::numeric;b:=(line->>'b')::numeric;
    valid:=abs(a)<=32 and abs(b)<=528 and b-abs(a)*16<16 and b+abs(a)*16> -16;
    label:='y = '||a||'x + ('||b||')';
    if exists(select 1 from jsonb_array_elements(seen) s where s->>'type'='function' and abs((s->>'a')::numeric-a)<0.00000001 and abs((s->>'b')::numeric-b)<0.00000001) then valid:=false;end if;
   end if;
   if valid then score:=score+1;seen:=seen||jsonb_build_array(line);end if;
   items:=items||jsonb_build_array(jsonb_build_object('label',label,'correct',valid));
  end loop;
 end if;
 return jsonb_build_object('score',score,'maximum',maximum,'items',items,'label',coalesce(preset->>'name','Eigen glasraam'));
end;$$;
revoke all on function axioma_private.os_task_glass_result(jsonb) from public,anon,authenticated;

create function axioma_private.os_task_result(config jsonb,work jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare p jsonb;v jsonb;r jsonb;items jsonb;parts jsonb:='[]';i int;j int;score int;total int:=0;maximum int:=0;
begin
 for p,i in select value,ordinality::int-1 from jsonb_array_elements(config) with ordinality loop
  v:=coalesce(work->i::text,'{}');
  if p->>'kind'='glass' then r:=axioma_private.os_task_glass_result(v->'draft');
  else
   items:='[]';score:=0;
   for j in 0..(p->>'count')::int-1 loop
    if v->'answers'->j->'correct'='true'::jsonb then score:=score+1;end if;
    items:=items||jsonb_build_array(jsonb_build_object('label',case when p->>'kind'='clay' then 'Doel ' else 'Vraag ' end||(j+1),'correct',coalesce(v->'answers'->j->'correct','false'),'answered',v->'answers'->j is not null));
   end loop;
   r:=jsonb_build_object('score',score,'maximum',(p->>'count')::int,'items',items);
  end if;
  r:=r||jsonb_build_object('kind',p->>'kind','index',i,'done',coalesce((v->>'done')::boolean,false));
  total:=total+(r->>'score')::int;maximum:=maximum+(r->>'maximum')::int;parts:=parts||jsonb_build_array(r);
 end loop;
 return jsonb_build_object('version',1,'rule','one-point-per-correct-item','total',total,'maximum',maximum,'parts',parts);
end;$$;
revoke all on function axioma_private.os_task_result(jsonb,jsonb) from public,anon,authenticated;

create or replace function axioma_private.os_task_view(t axioma_private.os_tasks,w axioma_private.os_task_work,teacher boolean) returns jsonb language plpgsql stable set search_path='' as $$
declare data jsonb:=w.parts; k text; p jsonb;
begin
 if not teacher and w.status='working' then
  for k,p in select * from jsonb_each(data) loop
   if p ? 'answers' then data:=jsonb_set(data,array[k,'answers'],coalesce((select jsonb_agg(a-'correct') from jsonb_array_elements(p->'answers') a),'[]'));end if;
  end loop;
 end if;
 return jsonb_build_object('server_time',clock_timestamp(),'task',to_jsonb(t),'work',case when w.user_id is null then null else to_jsonb(w)||jsonb_build_object('parts',data,'grades',case when teacher or w.status in ('submitted','reviewed') then w.grades else null end) end);
end;$$;
revoke all on function axioma_private.os_task_view(axioma_private.os_tasks,axioma_private.os_task_work,boolean) from public,anon,authenticated;

create or replace function axioma_private.os_tasks(action text,d jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); teacher boolean:=public.axioma_is_teacher(); t axioma_private.os_tasks%rowtype; w axioma_private.os_task_work%rowtype;
 pid integer; p jsonb; v jsonb; k text; result jsonb; n int; q jsonb; correct boolean; seedid uuid; target uuid; a jsonb; score_snapshot jsonb;
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
   if d->>'event' is not null and v->>'save_event'=d->>'event' then return axioma_private.os_task_view(t,w,false);end if;
   if w.revision is distinct from (d->>'revision')::int then raise exception 'Je werk is elders gewijzigd. Heropen vóór je bewaart.';end if;
   result:=axioma_private.os_task_glass_result(d->'draft');
   if coalesce((d->>'done')::boolean,false) and (result->>'score')::int=0 then raise exception 'Teken eerst minstens één correcte lijn.';end if;
   v:=jsonb_build_object('draft',d->'draft','done',coalesce((d->>'done')::boolean,false),'save_event',d->>'event','saved_lines',(result->>'score')::int);
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
   score_snapshot:=axioma_private.os_task_result(t.parts,w.parts);
   update axioma_private.os_task_work set status='submitted',submitted_at=clock_timestamp(),result=score_snapshot||jsonb_build_object('submitted_at',clock_timestamp()),
    grades=(select jsonb_agg(x->'score') from jsonb_array_elements(score_snapshot->'parts') x),revision=revision+1 where task_id=t.id and user_id=uid returning * into w;
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
   if w.result is not null and d->'grades'->n is distinct from w.grades->n then raise exception 'Punten volgen de correcte lijnen, doelen en vragen.';end if;
   if w.result is null and (jsonb_typeof(d->'grades'->n) is distinct from 'number' or (d->'grades'->>n)::numeric<0 or (d->'grades'->>n)::numeric>(t.parts->n->>'points')::numeric) then raise exception 'Punten buiten bereik.';end if;
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

-- Previously submitted but not yet reviewed work also receives its unit result.
-- Preserve already published legacy teacher grades; new submissions use this rule.
with scored as (
 select w.task_id,w.user_id,axioma_private.os_task_result(t.parts,w.parts)||jsonb_build_object('submitted_at',w.submitted_at) as snapshot
 from axioma_private.os_task_work w join axioma_private.os_tasks t on t.id=w.task_id
 where w.status='submitted' and w.result is null
)
update axioma_private.os_task_work w set result=s.snapshot,
 grades=(select jsonb_agg(p->'score') from jsonb_array_elements(s.snapshot->'parts') p)
from scored s where w.task_id=s.task_id and w.user_id=s.user_id;
notify pgrst,'reload schema';
