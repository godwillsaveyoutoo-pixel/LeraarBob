-- Additive generator negotiation. Existing room decks, answers, XP, account
-- permissions and deadlines remain governed by the unchanged v1 function.
-- Roll out this migration before the version-aware numbers-session Edge code.
alter function axioma_private.numbers_session(uuid,text,jsonb) rename to numbers_session_v1;
revoke all on function axioma_private.numbers_session_v1(uuid,text,jsonb) from public,anon,authenticated,service_role;

create function axioma_private.numbers_session(p_actor uuid,p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare r axioma_private.numbers_rooms; v_deck jsonb; v_entry jsonb; v_required integer:=1;
 v_version integer; v_supported integer:=coalesce((p_data->>'client_generator_version')::integer,1); v_result jsonb;
begin
 if p_actor is null or not exists(select 1 from auth.users where id=p_actor) then raise exception 'Meld je aan.';end if;
 if v_supported not in (1,2) then raise exception 'Vernieuw Getallenwereld om deze sessie te openen.';end if;
 if p_action='create' then
  v_deck:=p_data->'deck';
 elsif p_action='join' then
  select * into r from axioma_private.numbers_rooms where code=upper(trim(p_data->>'code')) for update;
  v_deck:=r.deck;
 elsif p_action in ('state','start','next','end','close','leave','pulse','work','answer','approve') then
  select * into r from axioma_private.numbers_rooms where id=(p_data->>'id')::uuid for update;
  -- Keep the original permission error for people outside this room. A version
  -- check must not turn into a way of inspecting another learner's activity.
  if r.owner_id=p_actor or exists(select 1 from axioma_private.numbers_members where room_id=r.id and user_id=p_actor and left_at is null) then v_deck:=r.deck;end if;
 end if;
 if v_deck is not null then
  if jsonb_typeof(v_deck)<>'array' or jsonb_array_length(v_deck) not between 1 and 30 then raise exception 'Ongeldige vragenreeks.';end if;
  for v_entry in select value from jsonb_array_elements(v_deck) loop
   v_version:=coalesce((v_entry->>'generatorVersion')::integer,1);
   if v_version not in (1,2) then raise exception 'Deze vragenreeks gebruikt een onbekende versie.';end if;
   v_required:=greatest(v_required,v_version);
  end loop;
  -- This happens before the original join insert and before answering, pacing
  -- or crediting XP. Old clients can still leave/close without rendering tasks.
  if v_required>v_supported and p_action not in ('leave','close') then raise exception 'Vernieuw Getallenwereld om deze sessie te openen.';end if;
 end if;
 v_result:=axioma_private.numbers_session_v1(p_actor,p_action,p_data);
 return v_result||jsonb_build_object('generatorVersion',v_required,'generator_versions',jsonb_build_array(1,2));
end;$$;
revoke all on function axioma_private.numbers_session(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function axioma_private.numbers_session(uuid,text,jsonb) to service_role;

-- Recreate the public delegator so a previously prepared SQL function cannot
-- keep calling the renamed v1 function through its cached object identifier.
create or replace function public.axioma_numbers_session(p_actor uuid,p_action text,p_data jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$select axioma_private.numbers_session(p_actor,p_action,p_data)$$;
revoke all on function public.axioma_numbers_session(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.axioma_numbers_session(uuid,text,jsonb) to service_role;

-- Four new guided scientific stops. Preserve the game's identity, rollout
-- flags and any other catalog metadata; stored learner progress is untouched.
insert into public.axioma_games
 (id,title,theme,game_type,progress_type,teacher_visible,active,sort_order,metadata,updated_at)
values ('getallenwereld','Getallenwereld','Getallen','learn','levels',true,true,69,
 '{"href":"games/getallenwereld/","unit_singular":"onderdeel","unit_plural":"onderdelen","progress_total":19}'::jsonb,now())
on conflict(id) do update set
 metadata=coalesce(public.axioma_games.metadata,'{}'::jsonb)||jsonb_build_object('progress_total',19),updated_at=now();
