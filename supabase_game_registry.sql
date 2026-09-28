insert into public.axioma_games
  (id,title,theme,game_type,progress_type,teacher_visible,active,sort_order,metadata,updated_at)
values
  ('pythagoras','Pythagoras','Meetkunde','game','levels',true,true,60,'{"href":"games/pythagoras.html","unit_singular":"level","unit_plural":"levels"}'::jsonb,now()),
  ('stelsels','Stelsels','Algebra','game','levels',true,true,70,'{"href":"games/stelsels.html","unit_singular":"oefening","unit_plural":"oefeningen"}'::jsonb,now()),
  ('algebra-smederij','Algebra Smederij','Algebra','game','levels',true,true,80,'{"href":"games/algebra-smederij.html","unit_singular":"challenge","unit_plural":"challenges"}'::jsonb,now()),
  ('taartenwinkel','Taartenwinkel','Breuken','game','levels',true,true,90,'{"href":"games/taartenwinkel.html","unit_singular":"dienst","unit_plural":"diensten"}'::jsonb,now()),
  ('kubusbouw','Kubusbouw','Ruimtelijk inzicht','game','levels',true,true,100,'{"href":"games/kubusbouw.html","unit_singular":"level","unit_plural":"levels"}'::jsonb,now()),
  ('verfwinkel','Verfwinkel','Verhoudingen','game','levels',true,true,110,'{"href":"games/verfwinkel.html","unit_singular":"level","unit_plural":"levels"}'::jsonb,now()),
  ('data-check','Data Check','Statistiek','game','levels',true,true,120,'{"href":"games/data-check.html","unit_singular":"dossier","unit_plural":"dossiers"}'::jsonb,now()),
  ('signal-lab','Signal Lab','Functies','game','levels',true,true,130,'{"href":"games/signal-lab.html","unit_singular":"proef","unit_plural":"proeven"}'::jsonb,now()),
  ('gravity-maze','Gravity Maze','Logica','game','levels',true,true,140,'{"href":"games/gravity/","unit_singular":"kamer","unit_plural":"kamers"}'::jsonb,now())
on conflict (id) do update set
  title=excluded.title,
  theme=excluded.theme,
  game_type=excluded.game_type,
  progress_type=excluded.progress_type,
  teacher_visible=excluded.teacher_visible,
  active=excluded.active,
  sort_order=excluded.sort_order,
  metadata=excluded.metadata,
  updated_at=now();
