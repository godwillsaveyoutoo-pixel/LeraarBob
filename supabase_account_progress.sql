-- Additive account binding; existing clients keep their original RPCs.
create or replace function public.axioma_save_game_progress_for_account(
  p_game_id text, p_state jsonb, p_revision bigint, p_user_id uuid
) returns jsonb language plpgsql security invoker set search_path = '' as $$
begin
  if p_user_id is null or auth.uid() is distinct from p_user_id then
    raise exception 'Leerlingaccount gewijzigd.' using errcode = '42501';
  end if;
  return public.axioma_save_game_progress(p_game_id, p_state, p_revision);
end;
$$;
revoke all on function public.axioma_save_game_progress_for_account(text,jsonb,bigint,uuid) from public, anon;
grant execute on function public.axioma_save_game_progress_for_account(text,jsonb,bigint,uuid) to authenticated;

create or replace function public.axioma_save_progress_for_account(
  p_state jsonb, p_revision bigint, p_user_id uuid
) returns jsonb language plpgsql security invoker set search_path = '' as $$
begin
  if p_user_id is null or auth.uid() is distinct from p_user_id then
    raise exception 'Leerlingaccount gewijzigd.' using errcode = '42501';
  end if;
  return public.axioma_save_progress(p_state, p_revision);
end;
$$;
revoke all on function public.axioma_save_progress_for_account(jsonb,bigint,uuid) from public, anon;
grant execute on function public.axioma_save_progress_for_account(jsonb,bigint,uuid) to authenticated;

insert into public.axioma_games
  (id,title,theme,game_type,progress_type,teacher_visible,active,sort_order,metadata,updated_at)
values ('vectoren-trainer','Vectorentrainer','Meetkunde','train','levels',true,true,65,
  '{"href":"games/vectoren/Axioma_Vectorentrainer_v0.2.html","unit_singular":"vaardigheid","unit_plural":"vaardigheden","progress_total":24}'::jsonb,now())
on conflict (id) do update set title=excluded.title,theme=excluded.theme,game_type=excluded.game_type,
  progress_type=excluded.progress_type,teacher_visible=excluded.teacher_visible,active=excluded.active,
  sort_order=excluded.sort_order,metadata=excluded.metadata,updated_at=now();
