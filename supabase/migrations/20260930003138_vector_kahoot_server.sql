-- Add server-checked Vectormissie rounds without changing older games or scores.
create or replace function axioma_private.vector_class(p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; r axioma_private.vector_class_rooms%rowtype; game_id text:=coalesce(p_data->>'game','vectoren');
begin
 if game_id in ('rechten','vectoren') and p_action='grade' and exists(select 1 from axioma_private.vector_class_rooms where id=(p_data->>'id')::uuid and server_grading) then
  raise exception 'Deze klasbattle wordt op de server nagekeken.' using errcode='42501';
 end if;
 if game_id='vectoren' and p_action='end_round' then
  select * into r from axioma_private.vector_class_rooms where id=(p_data->>'id')::uuid for update;
  if auth.uid() is null or r.id is null or r.game<>'vectoren' or r.owner_id<>auth.uid() or r.expires_at<=clock_timestamp() then
   raise exception 'Alleen de leerkracht kan deze ronde afronden.' using errcode='42501';
  end if;
  if r.phase='question' then update axioma_private.vector_class_rooms set deadline=clock_timestamp() where id=r.id;end if;
  p_action:='state';
 end if;
 result:=axioma_private.vector_class_legacy(p_action,p_data);
 if p_action='create' and game_id in ('rechten','vectoren') and p_data->>'server_grading'='true' then
  update axioma_private.vector_class_rooms set server_grading=true where id=(result->>'id')::uuid and owner_id=auth.uid() and (game_id='rechten' or phase='lobby');
 end if;
 return result;
end $$;
revoke all on function axioma_private.vector_class(text,jsonb) from public,anon;
grant execute on function axioma_private.vector_class(text,jsonb) to authenticated;

create function axioma_private.vector_class_worker(p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 r axioma_private.vector_class_rooms%rowtype; uid uuid:=(p_data->>'user_id')::uuid;
 entry jsonb; submissions jsonb;
begin
 select * into r from axioma_private.vector_class_rooms where id=(p_data->>'id')::uuid for update;
 if r.id is null or r.game<>'vectoren' or r.expires_at<=clock_timestamp() or uid is null
 or (r.owner_id<>uid and not exists(select 1 from axioma_private.vector_class_members where room_id=r.id and user_id=uid)) then
  raise exception 'Je neemt niet deel aan deze sessie.' using errcode='42501';
 end if;
 if r.phase<>'grading' then return jsonb_build_object('phase',r.phase);end if;
 if p_action='work' then
  select coalesce(jsonb_agg(jsonb_build_object('user_id',user_id,'answer',answer,'skipped',skipped)),'[]') into submissions
   from axioma_private.vector_class_answers where room_id=r.id and round=r.round;
  return jsonb_build_object('phase','grading','round',r.round,'task',r.deck->r.round,'submissions',submissions);
 elsif p_action='resolve' and (p_data->>'round')::integer=r.round then
  if jsonb_typeof(p_data->'grades') is distinct from 'array' then raise exception 'Ongeldige beoordeling.';end if;
  for entry in select value from jsonb_array_elements(p_data->'grades') loop
   update axioma_private.vector_class_answers
    set correct=coalesce((entry->>'correct')::boolean,false) and not skipped,
     points=case when (entry->>'correct')::boolean and not skipped then case when r.server_grading then 1000+greatest(0,250-floor(250.0*elapsed_ms/(r.seconds*1000))::integer) else 500+greatest(0,500-floor(500.0*elapsed_ms/(r.seconds*1000))::integer) end else 0 end
    where room_id=r.id and round=r.round and user_id=(entry->>'user_id')::uuid and correct is null;
  end loop;
  if not exists(select 1 from axioma_private.vector_class_answers where room_id=r.id and round=r.round and correct is null) then
   update axioma_private.vector_class_rooms set phase='results' where id=r.id;
  end if;
 else raise exception 'Ongeldige beoordelingsactie.';end if;
 return '{}';
end $$;
revoke all on function axioma_private.vector_class_worker(text,jsonb) from public,anon,authenticated;
grant usage on schema axioma_private to service_role;
grant execute on function axioma_private.vector_class_worker(text,jsonb) to service_role;
create function public.axioma_vector_class_worker(p_action text,p_data jsonb) returns jsonb
language sql security invoker set search_path='' as $$select axioma_private.vector_class_worker(p_action,p_data)$$;
revoke all on function public.axioma_vector_class_worker(text,jsonb) from public,anon,authenticated;
grant execute on function public.axioma_vector_class_worker(text,jsonb) to service_role;
