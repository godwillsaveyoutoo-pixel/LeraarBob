-- Register the new trainer with the existing account-scoped progress service.
-- Seventeen practiced equation forms; no invented XP conversion.
insert into public.axioma_games
 (id,title,theme,game_type,progress_type,teacher_visible,active,sort_order,metadata,updated_at)
values
 ('algebra-trainer','Algebra Trainer','Algebra','train','levels',true,true,67,
  '{"href":"games/algebra-trainer/","unit_singular":"oefenvorm","unit_plural":"oefenvormen","progress_total":17}'::jsonb,now())
on conflict (id) do update set
 title=excluded.title, theme=excluded.theme, game_type=excluded.game_type,
 progress_type=excluded.progress_type, teacher_visible=excluded.teacher_visible,
 active=excluded.active, sort_order=excluded.sort_order,
 metadata=coalesce(public.axioma_games.metadata,'{}'::jsonb)||excluded.metadata,
 updated_at=now();
