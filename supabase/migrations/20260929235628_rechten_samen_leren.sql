-- Private durable cooperative boards. All mutations pass through the authenticated Edge engine.
create table axioma_private.rechten_learn_rooms(
 id uuid primary key default gen_random_uuid(),code text not null unique,owner_id uuid not null references auth.users(id) on delete cascade,
 class_code text not null,capacity integer not null check(capacity in(2,3)),version integer not null default 0,
 data jsonb not null,expires_at timestamptz not null default now()+interval '2 hours');
create table axioma_private.rechten_learn_members(
 room_id uuid not null references axioma_private.rechten_learn_rooms(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,
 alias text not null,joined_at timestamptz not null default clock_timestamp(),seen_at timestamptz not null default clock_timestamp(),last_request uuid,
 primary key(room_id,user_id));
create index rechten_learn_members_user on axioma_private.rechten_learn_members(user_id);
create index rechten_learn_rooms_owner on axioma_private.rechten_learn_rooms(owner_id);
alter table axioma_private.rechten_learn_rooms enable row level security;
alter table axioma_private.rechten_learn_members enable row level security;
revoke all on axioma_private.rechten_learn_rooms,axioma_private.rechten_learn_members from public,anon,authenticated;
create function axioma_private.rechten_learn_worker(p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=(p_data->>'user_id')::uuid; r axioma_private.rechten_learn_rooms%rowtype;
 p public.axioma_profiles%rowtype; roster jsonb; old_request uuid; skill text; world text; my_state jsonb; attempt integer:=0;
begin
 select * into p from public.axioma_profiles where user_id=uid;
 if p.user_id is null or exists(select 1 from axioma_private.teachers where user_id=uid) then raise exception 'Meld je aan met je leerlingaccount.';end if;
 if p.class_code is null or p.class_code='' then raise exception 'Je account is nog niet aan een klas gekoppeld. Je kunt wel alleen leren.';end if;
 if p_action in('create','join') then
  perform pg_advisory_xact_lock(hashtextextended(uid::text,829));
  if p_action='create' then
   skill:=p_data->>'skill';
   if skill not in ('point_plot','delta','graph_from_equation') or skill is null then raise exception 'Kies een beschikbare oefening.';end if;
   if (p_data->>'capacity')::integer not in (2,3) or p_data->>'capacity' is null then raise exception 'Kies twee of drie leerlingen.';end if;
   if (select count(*) from axioma_private.rechten_learn_rooms where owner_id=uid and expires_at>clock_timestamp())>=5 then raise exception 'Gebruik een bestaande sessie of probeer later opnieuw.';end if;
  else
   select * into r from axioma_private.rechten_learn_rooms where code=upper(trim(p_data->>'code')) and expires_at>clock_timestamp() for update;
   if r.id is null then raise exception 'Deze code bestaat niet of is verlopen.';end if;
   if r.class_code<>p.class_code then raise exception 'Doe mee met leerlingen uit je eigen klas.';end if;
   if not exists(select 1 from axioma_private.rechten_learn_members where room_id=r.id and user_id=uid) and
    (r.data->>'phase'<>'lobby' or (select count(*) from axioma_private.rechten_learn_members where room_id=r.id)>=r.capacity) then raise exception 'Deze groep is al gestart of vol. Je kunt alleen verder leren.';end if;
   skill:=r.data->>'skill';
  end if;
  world:=case skill when 'graph_from_equation' then 'formulewerf' when 'delta' then 'hellingrug' else 'puntenbaai' end;
  select state->'rechtenV2' into my_state from public.axioma_game_progress where user_id=uid and game_id='rechten-trainer';
  if world='formulewerf' and not ('grenspas'=any(axioma_private.rechten_finished_worlds(uid)))
   and not exists(select 1 from jsonb_each(coalesce(my_state->'missions','{}')) m where m.value->>'world'='formulewerf') then raise exception 'Open eerst Formulewerf in je eigen leerroute.';end if;
  if p_action='create' then
   loop
    attempt:=attempt+1;
    begin
     insert into axioma_private.rechten_learn_rooms(code,owner_id,class_code,capacity,data)
      values(upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),uid,p.class_code,(p_data->>'capacity')::integer,
       jsonb_build_object('phase','lobby','round',0,'revision',0,'skill',skill,'seed',floor(random()*2147483647)::integer,'left','[]'::jsonb,'ideas','{}'::jsonb,'approvals','[]'::jsonb,'draft',jsonb_build_object('steps','[]'::jsonb))) returning * into r;exit;
    exception when unique_violation then if attempt>5 then raise exception 'Probeer opnieuw.';end if;end;
   end loop;
  end if;
  insert into axioma_private.rechten_learn_members(room_id,user_id,alias) values(r.id,uid,p.alias) on conflict(room_id,user_id) do nothing;
 else
  select * into r from axioma_private.rechten_learn_rooms where id=(p_data->>'id')::uuid for update;
 end if;
 if r.id is null or r.expires_at<=clock_timestamp() or not exists(select 1 from axioma_private.rechten_learn_members where room_id=r.id and user_id=uid) then raise exception 'Je neemt niet deel aan deze sessie.';end if;
 if r.class_code<>p.class_code then raise exception 'Je klas is gewijzigd. Start een nieuwe sessie.';end if;
 select last_request into old_request from axioma_private.rechten_learn_members where room_id=r.id and user_id=uid;
 if p_action='commit' and old_request is distinct from (p_data->>'request')::uuid then
  if r.version<>(p_data->>'version')::integer then return jsonb_build_object('conflict',true);end if;
  if jsonb_typeof(p_data->'data') is distinct from 'object' or octet_length((p_data->'data')::text)>100000 or p_data->>'request' is null then raise exception 'Ongeldig bord.';end if;
  update axioma_private.rechten_learn_rooms set data=p_data->'data',version=version+1 where id=r.id returning * into r;
  update axioma_private.rechten_learn_members set last_request=(p_data->>'request')::uuid where room_id=r.id and user_id=uid;
 elsif p_action not in('create','join','read','commit') then raise exception 'Onbekende actie.';end if;
 update axioma_private.rechten_learn_members set seen_at=clock_timestamp() where room_id=r.id and user_id=uid;
 select coalesce(jsonb_agg(jsonb_build_object('id',user_id,'alias',alias,'seen_at',seen_at) order by joined_at,user_id),'[]') into roster from axioma_private.rechten_learn_members where room_id=r.id;
 return jsonb_build_object('id',r.id,'code',r.code,'data',r.data,'version',r.version,'members',roster,'now',clock_timestamp(),
 'last_request',(select last_request from axioma_private.rechten_learn_members where room_id=r.id and user_id=uid));
end $$;
revoke all on function axioma_private.rechten_learn_worker(text,jsonb) from public,anon,authenticated;
grant execute on function axioma_private.rechten_learn_worker(text,jsonb) to service_role;
create function public.axioma_rechten_learn_worker(p_action text,p_data jsonb) returns jsonb
language sql security invoker set search_path='' as $$select axioma_private.rechten_learn_worker(p_action,p_data)$$;
revoke all on function public.axioma_rechten_learn_worker(text,jsonb) from public,anon,authenticated;
grant execute on function public.axioma_rechten_learn_worker(text,jsonb) to service_role;
