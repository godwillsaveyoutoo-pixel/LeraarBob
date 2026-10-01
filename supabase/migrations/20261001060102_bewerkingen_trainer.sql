-- Extend the existing class lifecycle; trusted grades remain isolated per game.
begin;
alter table axioma_private.vector_class_rooms drop constraint vector_class_rooms_game_check;
alter table axioma_private.vector_class_rooms add constraint vector_class_rooms_game_check
 check(game in ('vectoren','rechten','wortelbouw','algebra','bewerkingen'));
do $migration$ declare source text; begin
 select pg_get_functiondef('axioma_private.vector_class_legacy(text,jsonb)'::regprocedure) into source;
 if position('when ''algebra'' then' in source)=0 then raise exception 'Algebra klasbattle-migratie ontbreekt';end if;
 source:=replace(source,'''vectoren'',''rechten'',''wortelbouw'',''algebra''','''vectoren'',''rechten'',''wortelbouw'',''algebra'',''bewerkingen''');
 source:=replace(source,'game_name=''algebra'' and jsonb_array_length(p_data->''deck'')=20','game_name in (''algebra'',''bewerkingen'') and jsonb_array_length(p_data->''deck'')=20');
 source:=replace(source,'when ''algebra'' then','when ''bewerkingen'' then coalesce(spec->>''skill'','''') in (''power-power'',''power-product'',''power-quotient'',''power-monomial'',''power-negative'',''power-mixed'',''scientific'',''square-factor'',''root-product'',''root-quotient'',''root-fraction'',''root-power'',''root-simplify'',''root-letters'',''root-sum'',''root-sum-mixed'') when ''algebra'' then');
 execute source;
 select pg_get_functiondef('axioma_private.vector_class(text,jsonb)'::regprocedure) into source;
 if position('game_id in (''rechten'',''vectoren'',''algebra'')' in source)=0 then raise exception 'Onverwachte klasbattle-versie';end if;
 source:=replace(source,'game_id in (''rechten'',''vectoren'',''algebra'')','game_id in (''rechten'',''vectoren'',''algebra'',''bewerkingen'')');
 source:=replace(source,'game_id in (''vectoren'',''algebra'')','game_id in (''vectoren'',''algebra'',''bewerkingen'')');
 source:=replace(source,'game_id=''algebra'' and p_action=''create''','game_id in (''algebra'',''bewerkingen'') and p_action=''create''');
 execute source;
 select pg_get_functiondef('axioma_private.vector_class_worker(text,jsonb)'::regprocedure) into source;
 source:=replace(source,'axioma_private.vector_class_worker','axioma_private.bewerkingen_class_worker');
 source:=replace(source,'r.game<>''vectoren''','r.game<>''bewerkingen''');
 execute source;
end $migration$;
revoke all on function axioma_private.bewerkingen_class_worker(text,jsonb) from public,anon,authenticated;
grant execute on function axioma_private.bewerkingen_class_worker(text,jsonb) to service_role;
create function public.axioma_bewerkingen_class_worker(p_action text,p_data jsonb) returns jsonb
 language sql security invoker set search_path='' as $$select axioma_private.bewerkingen_class_worker(p_action,p_data)$$;
revoke all on function public.axioma_bewerkingen_class_worker(text,jsonb) from public,anon,authenticated;
grant execute on function public.axioma_bewerkingen_class_worker(text,jsonb) to service_role;
insert into public.axioma_games
 (id,title,theme,game_type,progress_type,teacher_visible,active,sort_order,metadata,updated_at)
values ('bewerkingen-trainer','Bewerkingentrainer','Algebra','train','levels',true,true,68,
 '{"href":"games/bewerkingen-trainer/","unit_singular":"vraagvorm","unit_plural":"vraagvormen","progress_total":16}'::jsonb,now())
on conflict (id) do update set title=excluded.title,theme=excluded.theme,game_type=excluded.game_type,
 progress_type=excluded.progress_type,teacher_visible=excluded.teacher_visible,active=excluded.active,
 sort_order=excluded.sort_order,metadata=coalesce(public.axioma_games.metadata,'{}'::jsonb)||excluded.metadata,updated_at=now();
commit;
