-- Getallenwereld owns its fifteen completed parts and its account-bound save.
-- No copy of Bewerkingentrainer results and no invented XP conversion.
insert into public.axioma_games
 (id,title,theme,game_type,progress_type,teacher_visible,active,sort_order,metadata,updated_at)
values ('getallenwereld','Getallenwereld','Getallen','learn','levels',true,true,69,
 '{"href":"games/getallenwereld/","unit_singular":"onderdeel","unit_plural":"onderdelen","progress_total":15}'::jsonb,now())
on conflict (id) do update set title=excluded.title,theme=excluded.theme,game_type=excluded.game_type,
 progress_type=excluded.progress_type,teacher_visible=excluded.teacher_visible,active=excluded.active,
 sort_order=excluded.sort_order,metadata=coalesce(public.axioma_games.metadata,'{}'::jsonb)||excluded.metadata,updated_at=now();
