-- One read-only report contract over existing authoritative result stores.
-- Only the caller's membership and answers are returned; there is no user-id parameter.
create function axioma_private.class_battle_report(provider text, target_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); room jsonb; member jsonb; items jsonb; result jsonb;
begin
 if uid is null then raise exception 'Meld je aan om je resultaten te bekijken.'; end if;
 if provider='class' then
  if target_id is null then
   select coalesce(jsonb_agg(x order by x.created_at desc),'[]') into result from (
    select r.id,r.game,r.code,r.phase,r.created_at from axioma_private.vector_class_rooms r
    join axioma_private.vector_class_members m on m.room_id=r.id and m.user_id=uid
    where r.phase in('finished','closed') order by r.created_at desc limit 100
   ) x; return result;
  end if;
  select to_jsonb(r),to_jsonb(m) into room,member from axioma_private.vector_class_rooms r
   join axioma_private.vector_class_members m on m.room_id=r.id and m.user_id=uid
   where r.id=target_id and r.phase in('finished','closed');
  if room is null then raise exception 'Deze eigen eindresultaten zijn niet beschikbaar.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('round',n+1,'skill',d->>'skill',
   'status',case when n<coalesce((member->>'eligible_from_round')::int,0) then 'not-eligible'
    when n>(room->>'round')::int then 'not-started' when a.user_id is null or a.skipped then 'unanswered'
    when a.correct is null then 'ungraded' when a.correct then 'correct' else 'incorrect' end,
   'points',case when a.correct is not null then coalesce(a.points,0) else 0 end) order by n),'[]') into items
   from jsonb_array_elements(room->'deck') with ordinality as specs(d,ordinal)
   cross join lateral (select (ordinal-1)::int n) idx
   left join axioma_private.vector_class_answers a on a.room_id=target_id and a.user_id=uid and a.round=n;
  result:=jsonb_build_object('game',room->>'game','activity','Klasbattle','items',items);
 elsif provider='numbers' then
  if target_id is null then
   select coalesce(jsonb_agg(x order by x.created_at desc),'[]') into result from (
    select r.id,'bewerkingen'::text game,r.code,r.phase,r.created_at from axioma_private.numbers_rooms r
    join axioma_private.numbers_members m on m.room_id=r.id and m.user_id=uid
    where r.activity='battle' and r.phase in('finished','closed') order by r.created_at desc limit 100
   ) x; return result;
  end if;
  select to_jsonb(r),to_jsonb(m) into room,member from axioma_private.numbers_rooms r
   join axioma_private.numbers_members m on m.room_id=r.id and m.user_id=uid
   where r.id=target_id and r.activity='battle' and r.phase in('finished','closed');
  if room is null then raise exception 'Deze eigen eindresultaten zijn niet beschikbaar.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('round',n+1,'skill',d->>'skill',
   'status',case when n<(member->>'eligible')::int then 'not-eligible' when n>(room->>'round')::int then 'not-started'
    when a.user_id is null then 'unanswered' when a.correct then 'correct' else 'incorrect' end,
   'points',coalesce(a.points,0),'xp',coalesce(a.xp,0)) order by n),'[]') into items
   from jsonb_array_elements(room->'deck') with ordinality as specs(d,ordinal)
   cross join lateral (select (ordinal-1)::int n) idx
   left join axioma_private.numbers_answers a on a.room_id=target_id and a.user_id=uid and a.round=n;
  result:=jsonb_build_object('game','bewerkingen','activity',case when room->>'audience'='class' then 'Klasbattle' else 'Duo Battle' end,'items',items);
 elsif provider='clay' then
  if target_id is null then
   select coalesce(jsonb_agg(x order by x.created_at desc),'[]') into result from (
    select r.id,'kleiduifschieten'::text game,r.status phase,r.created_at from axioma_private.clay_sessions r
    join axioma_private.clay_members m on m.session_id=r.id and m.user_id=uid
    where r.status in('finished','cancelled') order by r.created_at desc limit 100
   ) x; return result;
  end if;
  select to_jsonb(r),to_jsonb(m) into room,member from axioma_private.clay_sessions r
   join axioma_private.clay_members m on m.session_id=r.id and m.user_id=uid
   where r.id=target_id and r.status in('finished','cancelled');
  if room is null then raise exception 'Deze eigen eindresultaten zijn niet beschikbaar.'; end if;
  result:=jsonb_build_object('game','kleiduifschieten','activity',case room->>'os_mode' when 'classroom' then 'Klasbattle' when 'online' then 'Duo Battle' else 'Groepsbattle' end,
   'items','[]'::jsonb,'correct',greatest(0,(member->>'version')::int-(member->>'misses')::int),
   'attempts',(member->>'version')::int,'misses',(member->>'misses')::int,'streak',(member->>'streak')::int,
   'winner',coalesce(room->>'winner_id'=uid::text,false),
   'xp',coalesce((select xp from axioma_private.clay_rewards where session_id=target_id and user_id=uid),0));
 else raise exception 'Onbekende battleprovider.';
 end if;
 select result||jsonb_build_object('id',target_id,'provider',provider,'alias',coalesce(member->>'alias',p.alias),
  'class',p.class_code,'created_at',room->>'created_at','code',room->>'code',
  'phase',coalesce(room->>'phase',room->>'status')) into result from public.axioma_profiles p where p.user_id=uid;
 if result is null then raise exception 'Je accountprofiel ontbreekt.'; end if;
 return result;
end $$;
revoke all on function axioma_private.class_battle_report(text,uuid) from public,anon;
grant execute on function axioma_private.class_battle_report(text,uuid) to authenticated;
create function public.axioma_class_battle_report(p_provider text,p_id uuid default null)
returns jsonb language sql security invoker set search_path='' as $$select axioma_private.class_battle_report(p_provider,p_id)$$;
revoke all on function public.axioma_class_battle_report(text,uuid) from public,anon;
grant execute on function public.axioma_class_battle_report(text,uuid) to authenticated;
