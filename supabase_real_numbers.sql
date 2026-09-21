-- Register the trainer in the existing catalog; reuse account-bound progress and RLS.
insert into public.axioma_games
  (id,title,theme,game_type,progress_type,teacher_visible,active,sort_order,metadata,updated_at)
values ('reele-getallen-trainer','Reële getallen','Getallen','train','levels',true,true,66,
  '{"href":"games/reele-getallen/","unit_singular":"vaardigheid","unit_plural":"vaardigheden","progress_total":10}'::jsonb,now())
on conflict (id) do update set title=excluded.title,theme=excluded.theme,game_type=excluded.game_type,
  progress_type=excluded.progress_type,teacher_visible=excluded.teacher_visible,active=excluded.active,
  sort_order=excluded.sort_order,metadata=excluded.metadata,updated_at=now();
