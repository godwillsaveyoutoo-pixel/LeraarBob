-- Additive Learn/Battle sessions for the existing operations engine.
-- Existing progress and legacy classroom sessions remain untouched.
create table axioma_private.numbers_rooms (
 id uuid primary key default gen_random_uuid(), code text unique not null,
 owner_id uuid not null references auth.users(id), activity text not null check(activity in ('learn','battle')),
 audience text not null check(audience in ('duo','class')), phase text not null default 'lobby' check(phase in ('lobby','question','review','finished','closed')),
 deck jsonb not null, round integer not null default -1, seconds integer not null check(seconds between 30 and 600),
 started_at timestamptz, deadline timestamptz, created_at timestamptz not null default now(),
 check(jsonb_array_length(deck) between 1 and 30)
);
create table axioma_private.numbers_members (
 room_id uuid references axioma_private.numbers_rooms(id) on delete cascade,
 user_id uuid references auth.users(id), eligible integer not null default 0, left_at timestamptz,
 reviewed_round integer not null default -1, active_seconds integer not null default 0, active_days jsonb not null default '{}', last_active timestamptz,
 primary key(room_id,user_id)
);
create table axioma_private.numbers_answers (
 room_id uuid, user_id uuid, round integer not null, value text not null default '',
 attempts integer not null default 0, correct boolean not null default false, assisted boolean not null default false,
 xp integer not null default 0, points integer not null default 0, updated_at timestamptz not null default now(),
 primary key(room_id,user_id,round), foreign key(room_id,user_id) references axioma_private.numbers_members(room_id,user_id)
);
create table axioma_private.numbers_requests (
 room_id uuid, user_id uuid, round integer, request_id uuid, primary key(room_id,user_id,round,request_id)
);
create index numbers_rooms_owner on axioma_private.numbers_rooms(owner_id,created_at desc);
create index numbers_members_user on axioma_private.numbers_members(user_id,room_id);
create index numbers_answers_date on axioma_private.numbers_answers(updated_at,user_id);
alter table axioma_private.numbers_rooms enable row level security;
alter table axioma_private.numbers_members enable row level security;
alter table axioma_private.numbers_answers enable row level security;
alter table axioma_private.numbers_requests enable row level security;
-- Read existing solo evidence defensively; do not convert completed levels into XP.
create function axioma_private.numbers_solo_events(p_state jsonb)
returns table(xp integer,correct integer,questions integer,attempts integer,active_seconds integer,last_at timestamptz)
language plpgsql immutable set search_path='' as $$
declare saved jsonb; event jsonb;
begin
 begin saved:=(p_state#>>'{storage,leraarbob.bewerkingen.v1}')::jsonb;exception when others then return;end;
 if jsonb_typeof(saved->'history') is distinct from 'array' then return;end if;
 for event in select value from jsonb_array_elements(saved->'history') loop
  begin
   last_at:=(event->>'at')::timestamptz;if last_at is null then continue;end if;
   xp:=case when event->>'xp' in ('0','5','10') then (event->>'xp')::int else 0 end;
   correct:=case when event->>'correct'='true' then 1 else 0 end;questions:=1;
   attempts:=least(100,greatest(0,coalesce((event->>'attempts')::int,0)))+1;
   active_seconds:=least(3600,greatest(0,coalesce((event->>'activeSeconds')::int,0)));
   return next;
  exception when others then continue;end;
 end loop;
end;$$;
revoke all on function axioma_private.numbers_solo_events(jsonb) from public,anon,authenticated;
-- Only the identity-verifying Edge handler can call this worker. Actor never comes from its request body.
create function axioma_private.numbers_session(p_actor uuid,p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare r axioma_private.numbers_rooms; m axioma_private.numbers_members; a axioma_private.numbers_answers;
 teacher boolean; own boolean; profile_class text; v_id uuid; members jsonb; mine jsonb; rows jsonb; v_code text;
 v_from timestamptz; v_until timestamptz; v_class text; v_points integer; v_xp integer; v_new boolean; v_saved jsonb; v_entry jsonb; v_solo integer;
begin
 if p_actor is null or not exists(select 1 from auth.users where id=p_actor) then raise exception 'Meld je aan.';end if;
 select exists(select 1 from axioma_private.teachers where user_id=p_actor) into teacher;
 select class_code into profile_class from public.axioma_profiles where user_id=p_actor;
 if p_action='overview' then
  select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc),'[]') into rows from (
   select n.id,n.code,'bewerkingen'::text game,'numbers'::text provider,n.activity,n.created_at,
    case n.phase when 'review' then 'results' else n.phase end phase,
    n.phase in ('lobby','question','review') and (n.owner_id=p_actor or exists(select 1 from axioma_private.numbers_members member_row where member_row.room_id=n.id and member_row.user_id=p_actor and member_row.left_at is null)) active,
    (select count(*) from axioma_private.numbers_members member_row where member_row.room_id=n.id and member_row.left_at is null) participants,
    coalesce(s.points,0) points,coalesce(s.graded,0) graded,coalesce(s.correct,0) correct
   from axioma_private.numbers_rooms n
   left join lateral (select sum(answer_row.points) points,count(*) graded,count(*) filter(where answer_row.correct) correct from axioma_private.numbers_answers answer_row where answer_row.room_id=n.id and (answer_row.user_id=p_actor or teacher and n.owner_id=p_actor) and (answer_row.round<n.round or n.phase in ('review','finished','closed'))) s on true
   where n.owner_id=p_actor or exists(select 1 from axioma_private.numbers_members member_row where member_row.room_id=n.id and member_row.user_id=p_actor)
   order by n.created_at desc limit 40
  ) t;
  return jsonb_build_object('rooms',rows);
 end if;
 if p_action='summary' then
  select coalesce(sum(xp),0) into v_xp from axioma_private.numbers_answers where user_id=p_actor;
  v_solo:=0;
  begin
   select (state#>>'{storage,leraarbob.bewerkingen.v1}')::jsonb into v_saved from public.axioma_game_progress where user_id=p_actor and game_id='bewerkingen-trainer';
   v_solo:=greatest(0,coalesce((v_saved->>'practiceXP')::int,0));
   if jsonb_typeof(v_saved#>'{journey,topics}')='object' then
    for v_entry in select value from jsonb_each(v_saved#>'{journey,topics}') loop
     if v_entry->>'rewarded'='true' and v_entry->>'xp'='30' and
      (jsonb_array_length(coalesce(v_entry->'answers','[]'))>=3 or (v_entry->>'finished'='true' and jsonb_array_length(coalesce(v_entry->'evidence','[]'))=5)) then v_solo:=v_solo+30;end if;
    end loop;
   end if;
  exception when others then v_solo:=0;end;
  return jsonb_build_object('xp',v_solo+v_xp,'solo_xp',v_solo,'online_xp',v_xp);
 end if;
 if p_action='report' then
  v_from:=(coalesce(nullif(p_data->>'from','')::date,(now() at time zone 'Europe/Brussels')::date-30)::timestamp at time zone 'Europe/Brussels');
  v_until:=(coalesce(nullif(p_data->>'until','')::date+1,(now() at time zone 'Europe/Brussels')::date+1)::timestamp at time zone 'Europe/Brussels');
  if v_until<=v_from or v_until-v_from>interval '366 days' then raise exception 'Kies een periode van maximaal één jaar.';end if;
  v_class:=case when teacher then nullif(p_data->>'class','') else profile_class end;
  if not teacher and v_class is null then return jsonb_build_object('rows','[]'::jsonb,'teacher',false);end if;
  select coalesce(jsonb_agg(to_jsonb(t) order by t.xp desc,t.alias),'[]') into rows from (
   select p.user_id,p.alias,p.class_code,(p.user_id=p_actor) mine,
    coalesce(s.xp,0) xp,coalesce(s.points,0) points,coalesce(s.correct,0) correct,coalesce(s.questions,0) questions,
    coalesce(s.attempts,0) attempts,coalesce(s.sessions,0) sessions,s.last_at,
    case when teacher or p.user_id=p_actor then coalesce(s.active_seconds,0) else null end active_seconds
   from public.axioma_profiles p
   left join lateral (
    select sum(z.xp) xp,sum(z.points) points,sum(z.correct) correct,sum(z.questions) questions,sum(z.attempts) attempts,count(z.id) sessions,max(z.last_at) last_at,sum(z.active_seconds) active_seconds
    from (select n.id, coalesce(sum(b.xp),0) xp,coalesce(sum(b.points),0) points,count(*) filter(where b.correct) correct,
      count(b.round) questions,coalesce(sum(b.attempts),0) attempts,max(b.updated_at) last_at,max((select coalesce(sum(d.value::text::int),0) from jsonb_each(j.active_days) d where d.key::date>=(v_from at time zone 'Europe/Brussels')::date and d.key::date<(v_until at time zone 'Europe/Brussels')::date)) active_seconds
      from axioma_private.numbers_members j join axioma_private.numbers_rooms n on n.id=j.room_id
      left join axioma_private.numbers_answers b on b.room_id=j.room_id and b.user_id=j.user_id and b.updated_at>=v_from and b.updated_at<v_until
      where j.user_id=p.user_id and n.created_at<v_until and (n.created_at>=v_from or b.user_id is not null or exists(select 1 from jsonb_each(j.active_days) d where d.key::date>=(v_from at time zone 'Europe/Brussels')::date and d.key::date<(v_until at time zone 'Europe/Brussels')::date))
      group by n.id
    union all
    select null::uuid,e.xp,0,e.correct,e.questions,e.attempts,e.last_at,e.active_seconds
     from public.axioma_game_progress pg cross join lateral axioma_private.numbers_solo_events(pg.state) e
     where pg.user_id=p.user_id and pg.game_id='bewerkingen-trainer' and e.last_at>=v_from and e.last_at<v_until
    ) z
   ) s on true
   where (v_class is null and teacher or p.class_code=v_class)
    and not exists(select 1 from axioma_private.teachers tt where tt.user_id=p.user_id)
   order by coalesce(s.xp,0) desc,p.alias limit 500
  ) t;
  return jsonb_build_object('rows',rows,'teacher',teacher,'class',v_class,'from',v_from,'until',v_until);
 end if;
 if p_action='create' then
  if p_data->>'audience' not in ('duo','class') or p_data->>'activity' not in ('learn','battle') then raise exception 'Kies een werkvorm.';end if;
  if p_data->>'audience'='class' and not teacher then raise exception 'Alleen je leerkracht kan een klassessie maken.';end if;
  if (select count(*) from axioma_private.numbers_rooms where owner_id=p_actor and phase not in ('finished','closed') and created_at>now()-interval '1 day')>=10 then raise exception 'Sluit eerst een eerdere sessie.';end if;
  v_id:=gen_random_uuid();v_code:=upper(substr(replace(v_id::text,'-',''),1,8));
  insert into axioma_private.numbers_rooms(id,code,owner_id,activity,audience,deck,seconds)
   values(v_id,v_code,p_actor,p_data->>'activity',p_data->>'audience',p_data->'deck',coalesce((p_data->>'seconds')::int,180)) returning * into r;
  -- A duo host is a player; a class teacher explicitly chooses to participate.
  if r.audience='duo' or coalesce((p_data->>'participate')::boolean,false) then
   insert into axioma_private.numbers_members(room_id,user_id) values(r.id,p_actor);
  end if;
 else
  if p_action='join' then select * into r from axioma_private.numbers_rooms where code=upper(trim(p_data->>'code')) for update;
  else select * into r from axioma_private.numbers_rooms where id=(p_data->>'id')::uuid for update;end if;
  if r.id is null then raise exception 'Sessie niet gevonden. Controleer de code.';end if;
 end if;
 own:=r.owner_id=p_actor;
 select * into m from axioma_private.numbers_members where room_id=r.id and user_id=p_actor;
 if p_action='join' then
  if r.phase in ('closed','finished') then raise exception 'Deze sessie is afgerond.';end if;
  if r.created_at<now()-interval '1 day' then raise exception 'Deze sessiecode is verlopen.';end if;
  if r.audience='duo' and (m.user_id is null or m.left_at is not null) and (select count(*) from axioma_private.numbers_members where room_id=r.id and left_at is null)>=2 then raise exception 'Deze duo is al compleet.';end if;
  insert into axioma_private.numbers_members(room_id,user_id,eligible) values(r.id,p_actor,case when r.phase='question' and r.activity='battle' then r.round+1 else greatest(0,r.round) end)
   on conflict(room_id,user_id) do update set left_at=null;
  select * into m from axioma_private.numbers_members where room_id=r.id and user_id=p_actor;
 elsif not own and (m.user_id is null or m.left_at is not null) then raise exception 'Je neemt niet deel aan deze sessie.';end if;
 -- Battle deadlines are enforced on the server, including when the host disconnects.
 if r.phase='question' and r.activity='battle' and now()>=r.deadline then
  update axioma_private.numbers_rooms set phase='review' where id=r.id returning * into r;
 end if;
 if p_action in ('start','next','end','close') then
  if not own then raise exception 'Alleen de organisator bedient de sessie.';end if;
  if p_action='close' then update axioma_private.numbers_rooms set phase='closed' where id=r.id returning * into r;
  elsif p_action='end' and r.phase='question' then update axioma_private.numbers_rooms set phase='review' where id=r.id returning * into r;
  elsif (p_action='start' and r.phase='lobby') or (p_action='next' and r.phase='review') then
   if p_action='next' and r.activity='learn' and r.audience='duo' and exists(select 1 from axioma_private.numbers_members where room_id=r.id and left_at is null and reviewed_round<r.round) then raise exception 'Bespreek eerst samen de antwoorden. Beide spelers bevestigen.';end if;
   if not exists(select 1 from axioma_private.numbers_members where room_id=r.id and left_at is null) then raise exception 'Laat eerst iemand deelnemen.';end if;
   if r.audience='duo' and (select count(*) from axioma_private.numbers_members where room_id=r.id and left_at is null)<2 then raise exception 'Wacht op je tweede speler.';end if;
   update axioma_private.numbers_rooms set phase=case when round+1>=jsonb_array_length(deck) then 'finished' else 'question' end,
    round=least(round+1,jsonb_array_length(deck)-1),started_at=now(),deadline=case when activity='battle' then now()+make_interval(secs=>seconds) else null end
    where id=r.id returning * into r;
  else raise exception 'Deze actie past niet bij de huidige stap.';end if;
 elsif p_action='leave' then
  if own then update axioma_private.numbers_rooms set phase='closed' where id=r.id returning * into r;
  else update axioma_private.numbers_members set left_at=now() where room_id=r.id and user_id=p_actor;end if;
 elsif p_action='approve' then
  if r.phase<>'review' or r.activity<>'learn' or r.audience<>'duo' or m.user_id is null then raise exception 'Je kunt deze bespreking nu niet bevestigen.';end if;
  update axioma_private.numbers_members set reviewed_round=r.round where room_id=r.id and user_id=p_actor;
 elsif p_action='pulse' then
  if r.phase='question' and m.user_id is not null and m.eligible<=r.round then
   update axioma_private.numbers_members set active_seconds=active_seconds+case when last_active is null then 0 else least(15,greatest(0,extract(epoch from now()-last_active)::int)) end,active_days=jsonb_set(active_days,array[to_char(now() at time zone 'Europe/Brussels','YYYY-MM-DD')],to_jsonb(coalesce((active_days->>to_char(now() at time zone 'Europe/Brussels','YYYY-MM-DD'))::int,0)+case when last_active is null then 0 else least(15,greatest(0,extract(epoch from now()-last_active)::int)) end),true),last_active=now() where room_id=r.id and user_id=p_actor;
  end if;
 elsif p_action in ('work','answer') then
  if r.phase<>'question' or m.user_id is null or m.eligible>r.round then
   if p_action='work' then return jsonb_build_object('open',false,'id',r.id);end if;
  else
   select * into a from axioma_private.numbers_answers where room_id=r.id and user_id=p_actor and round=r.round;
   if p_action='work' then return jsonb_build_object('open',not coalesce(a.correct,false) and (r.activity='learn' or a.user_id is null),'id',r.id,'round',r.round,'spec',r.deck->r.round);end if;
   if (p_data->>'round')::int<>r.round then raise exception 'De volgende opgave is al begonnen.';end if;
   insert into axioma_private.numbers_requests values(r.id,p_actor,r.round,(p_data->>'request_id')::uuid) on conflict do nothing;
   get diagnostics v_points=row_count;v_new:=v_points=1;
   if v_new and not coalesce(a.correct,false) and (r.activity='learn' or a.user_id is null) then
    if coalesce(a.attempts,0)>=30 then raise exception 'Bespreek deze oefening met je leerkracht.';end if;
    v_xp:=case when coalesce((p_data->>'correct')::boolean,false) then case when coalesce(a.assisted,false) or coalesce((p_data->>'assisted')::boolean,false) or coalesce(a.attempts,0)>0 then 5 else 10 end else 0 end;
    v_points:=case when r.activity='battle' and v_xp>0 then 1000+greatest(0,250-floor(250*extract(epoch from now()-r.started_at)/r.seconds)::int) else 0 end;
    insert into axioma_private.numbers_answers(room_id,user_id,round,value,attempts,correct,assisted,xp,points)
     values(r.id,p_actor,r.round,left(p_data->>'value',180),1,coalesce((p_data->>'correct')::boolean,false),coalesce((p_data->>'assisted')::boolean,false),v_xp,v_points)
     on conflict(room_id,user_id,round) do update set value=excluded.value,attempts=axioma_private.numbers_answers.attempts+1,correct=excluded.correct,
      assisted=axioma_private.numbers_answers.assisted or excluded.assisted,xp=excluded.xp,points=excluded.points,updated_at=now();
   end if;
   if (r.activity='battle' or (r.activity='learn' and r.audience='duo')) and not exists(select 1 from axioma_private.numbers_members n where n.room_id=r.id and n.left_at is null and n.eligible<=r.round and not exists(select 1 from axioma_private.numbers_answers b where b.room_id=r.id and b.user_id=n.user_id and b.round=r.round and (r.activity='battle' or b.correct))) then
    update axioma_private.numbers_rooms set phase='review' where id=r.id returning * into r;
   end if;
  end if;
 elsif p_action not in ('create','join','state') then raise exception 'Onbekende sessieactie.';end if;
 select to_jsonb(b)-'room_id'-'user_id' into mine from axioma_private.numbers_answers b where b.room_id=r.id and b.user_id=p_actor and b.round=r.round;
 if r.activity='battle' and r.phase='question' and mine is not null then mine:=mine-'correct'-'xp'-'points';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',n.user_id,'alias',coalesce(p.alias,'Leerkracht'),'left',n.left_at is not null,'eligible',n.eligible,
  'reviewed',n.reviewed_round>=r.round,'answer',case when (own and teacher) or n.user_id=p_actor or (r.audience='duo' and r.activity='learn' and r.phase='review') then b.value else null end,
  'answered',b.user_id is not null,'correct',case when (own and teacher) or r.phase<>'question' then b.correct else null end,
  'attempts',case when (own and teacher) or n.user_id=p_actor then b.attempts else null end,
  'xp',case when r.phase<>'question' or n.user_id=p_actor then (select coalesce(sum(x.xp),0) from axioma_private.numbers_answers x where x.room_id=r.id and x.user_id=n.user_id and (r.activity='learn' or x.round<r.round or r.phase<>'question')) else null end,
  'points',(select coalesce(sum(x.points),0) from axioma_private.numbers_answers x where x.room_id=r.id and x.user_id=n.user_id and (x.round<r.round or r.phase<>'question'))
 ) order by p.alias),'[]') into members from axioma_private.numbers_members n left join public.axioma_profiles p on p.user_id=n.user_id
 left join axioma_private.numbers_answers b on b.room_id=n.room_id and b.user_id=n.user_id and b.round=r.round where n.room_id=r.id;
 return jsonb_build_object('id',r.id,'code',r.code,'activity',r.activity,'audience',r.audience,'phase',r.phase,'owner',own,'participant',m.user_id is not null,
  'round',r.round,'total',jsonb_array_length(r.deck),'spec',case when r.round>=0 then r.deck->r.round else null end,'deadline',r.deadline,'server_time',now(),'members',members,'mine',mine);
end;$$;
revoke all on function axioma_private.numbers_session(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function axioma_private.numbers_session(uuid,text,jsonb) to service_role;
create function public.axioma_numbers_session(p_actor uuid,p_action text,p_data jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$select axioma_private.numbers_session(p_actor,p_action,p_data)$$;
revoke all on function public.axioma_numbers_session(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.axioma_numbers_session(uuid,text,jsonb) to service_role;
