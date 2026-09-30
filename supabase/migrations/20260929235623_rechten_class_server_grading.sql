-- Rechten class answers are checked with the native validator in the Edge worker.
-- Other games retain their existing grading contract.
alter table axioma_private.vector_class_rooms add column server_grading boolean not null default false;
alter function axioma_private.vector_class(text,jsonb) rename to vector_class_legacy;
revoke all on function axioma_private.vector_class_legacy(text,jsonb) from public,anon,authenticated;
create function axioma_private.vector_class(p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if coalesce(p_data->>'game','vectoren')='rechten' and p_action='grade' and exists(select 1 from axioma_private.vector_class_rooms where id=(p_data->>'id')::uuid and server_grading) then
  raise exception 'Rechtenwereld wordt op de server nagekeken.' using errcode='42501';
 end if;
 result:=axioma_private.vector_class_legacy(p_action,p_data);
 if p_action='create' and p_data->>'game'='rechten' and p_data->>'server_grading'='true' then
  update axioma_private.vector_class_rooms set server_grading=true where id=(result->>'id')::uuid and owner_id=auth.uid();
 end if;
 return result;
end $$;
revoke all on function axioma_private.vector_class(text,jsonb) from public,anon;
grant execute on function axioma_private.vector_class(text,jsonb) to authenticated;
-- SQL-language wrappers are explicitly recreated after the rename.
create or replace function public.axioma_game_class(p_action text,p_data jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$select axioma_private.vector_class(p_action,p_data)$$;
create or replace function public.axioma_vector_class(p_action text,p_data jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$select axioma_private.vector_class(p_action,coalesce(p_data,'{}'::jsonb)||jsonb_build_object('game','vectoren'))$$;

create function axioma_private.rechten_class_worker(p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 r axioma_private.vector_class_rooms%rowtype; uid uuid:=(p_data->>'user_id')::uuid;
 entry jsonb; submissions jsonb;
begin
 select * into r from axioma_private.vector_class_rooms where id=(p_data->>'id')::uuid for update;
 if r.id is null or r.game<>'rechten' or r.expires_at<=clock_timestamp() or uid is null
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
     points=case when (entry->>'correct')::boolean and not skipped then 1000+greatest(0,250-floor(250.0*elapsed_ms/(r.seconds*1000))::integer) else 0 end
    where room_id=r.id and round=r.round and user_id=(entry->>'user_id')::uuid and correct is null;
  end loop;
  if not exists(select 1 from axioma_private.vector_class_answers where room_id=r.id and round=r.round and correct is null) then
   update axioma_private.vector_class_rooms set phase='results' where id=r.id;
  end if;
 else raise exception 'Ongeldige beoordelingsactie.';end if;
 return '{}';
end $$;
revoke all on function axioma_private.rechten_class_worker(text,jsonb) from public,anon,authenticated;
grant usage on schema axioma_private to service_role;
grant execute on function axioma_private.rechten_class_worker(text,jsonb) to service_role;
create function public.axioma_rechten_class_worker(p_action text,p_data jsonb) returns jsonb
language sql security invoker set search_path='' as $$select axioma_private.rechten_class_worker(p_action,p_data)$$;
revoke all on function public.axioma_rechten_class_worker(text,jsonb) from public,anon,authenticated;
grant execute on function public.axioma_rechten_class_worker(text,jsonb) to service_role;
