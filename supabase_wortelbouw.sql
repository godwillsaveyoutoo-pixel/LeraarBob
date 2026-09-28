-- Register Wortelbouw for the existing account-bound save API and teacher overview.
-- No schema, grants or RLS changes; existing student records are untouched.
insert into public.axioma_games
  (id,title,theme,game_type,progress_type,teacher_visible,active,sort_order,metadata,updated_at)
values ('wortelbouw','Wortelbouw','Meetkunde','game','levels',true,true,61,
  '{"href":"games/wortelbouw/","unit_singular":"opgave","unit_plural":"opgaven","progress_total":14}'::jsonb,now())
on conflict (id) do update set title=excluded.title,theme=excluded.theme,game_type=excluded.game_type,
  progress_type=excluded.progress_type,teacher_visible=excluded.teacher_visible,active=excluded.active,
  sort_order=excluded.sort_order,metadata=excluded.metadata,updated_at=now();
