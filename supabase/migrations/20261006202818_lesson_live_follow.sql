begin;
alter table axioma_private.lesson_stages add column presentation jsonb not null default '{}', add column revision bigint not null default 0, add column active_activity uuid;
create table axioma_private.lesson_activities(
 id uuid primary key default gen_random_uuid(),room_id uuid not null references axioma_private.lesson_stages(room_id) on delete cascade,
 kind text not null check(kind='clay'),native_id uuid not null unique references axioma_private.clay_sessions(id),host_tab uuid not null,created_at timestamptz not null default now()
);
create index lesson_activities_room on axioma_private.lesson_activities(room_id);
alter table axioma_private.lesson_stages add foreign key(active_activity) references axioma_private.lesson_activities(id);
create table axioma_private.lesson_clay_attempts(
 activity_id uuid not null references axioma_private.lesson_activities(id) on delete cascade,user_id uuid not null,version integer not null,
 answer numeric,correct boolean not null,created_at timestamptz not null default clock_timestamp(),primary key(activity_id,user_id,version)
);
alter table axioma_private.lesson_activities enable row level security;
alter table axioma_private.lesson_clay_attempts enable row level security;
revoke all on axioma_private.lesson_activities,axioma_private.lesson_clay_attempts from public,anon,authenticated;
alter function axioma_private.lesson_stage(text,jsonb) rename to lesson_stage_core;
revoke all on function axioma_private.lesson_stage_core(text,jsonb) from public,anon,authenticated;
create function axioma_private.lesson_stage(p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();r axioma_private.vector_class_rooms%rowtype;l axioma_private.lesson_stages%rowtype;a axioma_private.lesson_activities%rowtype;
 c axioma_private.clay_sessions%rowtype;m axioma_private.clay_members%rowtype;result jsonb;payload jsonb;activity jsonb;clay jsonb;rows jsonb;tab uuid;ts timestamptz:=clock_timestamp();
begin
 if uid is null then raise exception 'Meld je eerst aan.' using errcode='42501';end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>20000 then raise exception 'Ongeldig verzoek.';end if;
 if p_action='history' then
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from(select v.id,v.code,v.created_at,v.phase,(select count(*) from axioma_private.vector_class_members where room_id=v.id) as participants from axioma_private.vector_class_rooms v join axioma_private.lesson_stages ls on ls.room_id=v.id where v.owner_id=uid order by v.created_at desc limit 50)x;
  return jsonb_build_object('history',rows);
 end if;
 if p_action='create' then result:=axioma_private.lesson_stage_core(p_action,p_data);p_data:=p_data||jsonb_build_object('id',result->>'room');end if;
 select * into r from axioma_private.vector_class_rooms where id=(p_data->>'id')::uuid;
 if r.id is null or (r.owner_id<>uid and not exists(select 1 from axioma_private.vector_class_members where room_id=r.id and user_id=uid)) then raise exception 'Je neemt niet deel aan deze sessie.' using errcode='42501';end if;
 select * into l from axioma_private.lesson_stages where room_id=r.id;
 if not found then raise exception 'Deze code hoort niet bij een lessessie.';end if;
 if p_action='report' then
  if r.owner_id<>uid then raise exception 'Alleen de leerkracht ziet het lesverslag.' using errcode='42501';end if;
  select coalesce(jsonb_agg(jsonb_build_object('alias',v.alias,'user_id',v.user_id,
   'polls',coalesce((select jsonb_agg(jsonb_build_object('question',p.question,'answer',p.options->n.choice)) from axioma_private.lesson_named_answers n join axioma_private.lesson_polls p on p.room_id=n.room_id and p.id=n.poll_id where n.room_id=r.id and n.user_id=v.user_id and not p.anonymous and p.closed),'[]'),
   'battle',coalesce((select jsonb_agg(jsonb_build_object('round',b.round+1,'skill',r.deck->b.round->>'skill','correct',b.correct,'answer',b.answer) order by b.round) from axioma_private.vector_class_answers b where b.room_id=r.id and b.user_id=v.user_id and (b.round<r.round or r.phase in('results','finished','closed'))),'[]'),
   'clay',coalesce((select jsonb_agg(jsonb_build_object('id',act.id,'status',cs.status,'speed',cs.speed,'attempts',cm.version,'correct',cm.version-cm.misses,'misses',cm.misses,'streak',cm.streak,'won',coalesce(cs.winner_id=v.user_id,false),'elapsed_ms',case when cs.winner_id=v.user_id then cs.elapsed_ms else null end,'shots',coalesce((select jsonb_agg(jsonb_build_object('attempt',ca.version+1,'correct',ca.correct,'answer',ca.answer) order by ca.version) from axioma_private.lesson_clay_attempts ca where ca.activity_id=act.id and ca.user_id=v.user_id),'[]')) order by act.created_at) from axioma_private.lesson_activities act join axioma_private.clay_sessions cs on cs.id=act.native_id join axioma_private.clay_members cm on cm.session_id=cs.id and cm.user_id=v.user_id where act.room_id=r.id),'[]')) order by v.alias),'[]') into rows from axioma_private.vector_class_members v where v.room_id=r.id;
  return jsonb_build_object('id',r.id,'code',r.code,'created_at',r.created_at,'members',rows);
 end if;
 if r.expires_at<=ts then raise exception 'Deze les is verlopen. Het verslag blijft beschikbaar voor de leerkracht.';end if;
 if p_action in('present','open_clay','start_clay','stop_clay') and r.owner_id<>uid then raise exception 'Alleen de leerkracht leidt de les.' using errcode='42501';end if;
 if p_action in('open_clay','start_clay','clay_join','clay_answer') and r.phase in('closed','finished') then raise exception 'Deze sessie is afgelopen.';end if;
 if p_action='present' then
  if coalesce(p_data->>'step','')!~'^[a-z0-9-]{1,80}$' or length(coalesce(p_data->>'speaker',''))>200 or length(coalesce(p_data->>'reply',''))>200 then raise exception 'Ongeldige presentatiestap.';end if;
  perform 1 from axioma_private.vector_class_rooms where id=r.id for update;
  select * into l from axioma_private.lesson_stages where room_id=r.id for update;
  payload:=jsonb_build_object('step',p_data->>'step','speaker',p_data->>'speaker','reply',p_data->>'reply','replay',p_data->>'replay','started_at',case when l.presentation->>'step'=p_data->>'step' and l.presentation->>'replay'=p_data->>'replay' then l.presentation->>'started_at' else ts::text end);
  if coalesce(p_data->>'view','narrative') not in('narrative','poll','battle') then raise exception 'Ongeldige weergave.';end if;
  update axioma_private.lesson_stages set presentation=payload,revision=revision+1,mode=case when mode='clay' then mode else coalesce(p_data->>'view','narrative') end where room_id=r.id;
 elsif p_action in('open_clay','start_clay','stop_clay','clay_join','clay_sync','clay_answer') then
  -- Consistent order with the native game: global membership lock before a clay row.
  perform pg_advisory_xact_lock(78192026);
  perform 1 from axioma_private.vector_class_rooms where id=r.id for update;
  select * into l from axioma_private.lesson_stages where room_id=r.id for update;
  select * into a from axioma_private.lesson_activities where id=l.active_activity;
  if a.id is not null then select * into c from axioma_private.clay_sessions where id=a.native_id for update;end if;
  if p_action='open_clay' then
   if r.phase in('question','grading') then raise exception 'Rond eerst de battlevraag af.';end if;
   if c.id is null or c.status not in('waiting','running') then
    tab:=gen_random_uuid();clay:=axioma_private.clay_v2('create',tab,null,coalesce((p_data->>'speed')::integer,5));
    insert into axioma_private.lesson_activities(room_id,kind,native_id,host_tab) values(r.id,'clay',(clay->'current'->>'id')::uuid,tab) returning * into a;
   end if;
   update axioma_private.lesson_stages set active_activity=a.id,mode='clay' where room_id=r.id;
  else
   if a.id is null then raise exception 'Er is nog geen kleiduifactiviteit.';end if;
   if p_action='start_clay' then
    update axioma_private.clay_members set seen_at=ts where session_id=a.native_id and user_id=uid;
    if c.status='waiting' then clay:=axioma_private.clay_v2('start',a.host_tab,a.native_id);end if;
   elsif p_action='stop_clay' then
    update axioma_private.clay_sessions set status='cancelled',ends_at=ts where id=a.native_id and status in('waiting','running');
    update axioma_private.clay_members set left_at=coalesce(left_at,ts) where session_id=a.native_id;
    update axioma_private.lesson_stages set mode='narrative' where room_id=r.id;
   else
    if r.owner_id=uid then raise exception 'De leerkracht begeleidt deze activiteit.';end if;
    tab:=(p_data->>'tab')::uuid;if tab is null then raise exception 'Tabblad ontbreekt.';end if;
    select * into m from axioma_private.clay_members where session_id=a.native_id and user_id=uid;
    if p_action='clay_join' and c.status in('waiting','running') then
     if l.mode<>'clay' then raise exception 'De leerkracht heeft de activiteit afgesloten.';end if;
     if exists(select 1 from axioma_private.clay_members cm join axioma_private.clay_sessions cs on cs.id=cm.session_id where cm.user_id=uid and cm.left_at is null and cs.status in('waiting','running') and cm.session_id<>a.native_id) then raise exception 'Verlaat eerst je andere kleiduifgroep.';end if;
     if exists(select 1 from axioma_private.game_invitations where uid in(sender_id,recipient_id) and (status='accepted' or (status='pending' and expires_at>ts))) then raise exception 'Rond eerst je andere online partij af.';end if;
     if m.user_id is null and (select count(*) from axioma_private.clay_members where session_id=a.native_id and left_at is null)>=30 then raise exception 'Deze activiteit is vol.';end if;
     insert into axioma_private.clay_members(session_id,user_id,tab_id,participated,next_at) values(a.native_id,uid,tab,c.status='running',case when c.status='running' then ts+interval '5 seconds' end)
      on conflict(session_id,user_id) do update set tab_id=excluded.tab_id,left_at=null,seen_at=ts,participated=axioma_private.clay_members.participated or excluded.participated,next_at=coalesce(axioma_private.clay_members.next_at,excluded.next_at);
    end if;
    if p_action='clay_answer' then
     if l.mode<>'clay' then raise exception 'Deze activiteit is afgesloten.';end if;
     clay:=axioma_private.clay_v2('answer',tab,a.native_id,5,(p_data->>'answer')::numeric,(p_data->>'event')::uuid,(p_data->>'version')::integer);
     if (p_data->>'version')::integer is distinct from (clay->'member'->>'version')::integer-1 then raise exception 'Dit schot hoort niet bij deze poging.';end if;
     insert into axioma_private.lesson_clay_attempts(activity_id,user_id,version,answer,correct) values(a.id,uid,(p_data->>'version')::integer,(p_data->>'answer')::numeric,(clay->'member'->>'last_correct')::boolean) on conflict do nothing;
    else clay:=axioma_private.clay_v2('sync',tab,a.native_id);end if;
    -- The iframe exposes only this linked activity, never the global lobby.
    return jsonb_build_object('clay',clay||jsonb_build_object('sessions','[]'::jsonb));
   end if;
  end if;
 elsif p_action<>'create' then result:=axioma_private.lesson_stage_core(p_action,p_data);
 end if;
 if result is null then result:=axioma_private.lesson_stage_core('state',jsonb_build_object('id',r.id));end if;
 select * into l from axioma_private.lesson_stages where room_id=r.id;
 select jsonb_build_object('id',act.id,'kind',act.kind,'native_id',cs.id,'status',cs.status,'speed',cs.speed,'winner',coalesce(pro.alias,'Leerkracht'),'members',coalesce((select jsonb_agg(jsonb_build_object('alias',v.alias,'streak',cm.streak,'misses',cm.misses,'online',cm.seen_at>ts-interval '75 seconds')) from axioma_private.clay_members cm join axioma_private.vector_class_members v on v.user_id=cm.user_id and v.room_id=r.id where cm.session_id=cs.id and cm.left_at is null),'[]')) into activity from axioma_private.lesson_activities act join axioma_private.clay_sessions cs on cs.id=act.native_id left join public.axioma_profiles pro on pro.user_id=cs.winner_id where act.id=l.active_activity;
 if r.owner_id=uid and activity->>'status'='waiting' then update axioma_private.clay_members set seen_at=ts where session_id=(activity->>'native_id')::uuid and user_id=uid;end if;
 return result||jsonb_build_object('presentation',l.presentation,'revision',l.revision,'activity',activity,'server_time',ts);
end $$;
revoke all on function axioma_private.lesson_stage(text,jsonb) from public,anon;
grant execute on function axioma_private.lesson_stage(text,jsonb) to authenticated;
-- The existing public SECURITY INVOKER facade resolves the new private implementation.
create or replace function public.axioma_lesson_stage(p_action text,p_data jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select axioma_private.lesson_stage(p_action,p_data)$$;
revoke all on function public.axioma_lesson_stage(text,jsonb) from public,anon;
grant execute on function public.axioma_lesson_stage(text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
