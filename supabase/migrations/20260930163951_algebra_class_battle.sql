-- Reuse the class session lifecycle; keep Algebra rooms and trusted grading separate.
alter table axioma_private.vector_class_rooms drop constraint vector_class_rooms_game_check;
alter table axioma_private.vector_class_rooms add constraint vector_class_rooms_game_check check(game in('vectoren','rechten','wortelbouw','algebra'));
do $migration$ declare source text; begin
 select pg_get_functiondef('axioma_private.vector_class_legacy(text,jsonb)'::regprocedure) into source;
 if position('when ''wortelbouw'' then' in source)=0 then raise exception 'Onverwachte klasbattle-versie';end if;
 source:=replace(source,'''vectoren'',''rechten'',''wortelbouw''','''vectoren'',''rechten'',''wortelbouw'',''algebra''');
 source:=replace(source,'jsonb_array_length(p_data->''deck'') not in (5,10)','(jsonb_array_length(p_data->''deck'') not in (5,10) and not(game_name=''algebra'' and jsonb_array_length(p_data->''deck'')=20))');
 source:=replace(source,'when ''wortelbouw'' then','when ''algebra'' then coalesce(spec->>''skill'','''') in (''A1'',''A2'',''A3'',''A4'',''B1'',''B2'',''B3'',''B4'',''B5'',''C1'',''C2'',''D1'',''D2'',''D3'',''E1'',''E2'',''E3'') when ''wortelbouw'' then');
 execute source;
 select pg_get_functiondef('axioma_private.vector_class(text,jsonb)'::regprocedure) into source;
 source:=replace(source,'game_id in (''rechten'',''vectoren'')','game_id in (''rechten'',''vectoren'',''algebra'')');
 source:=replace(source,'game_id=''vectoren'' and p_action=''end_round''','game_id in (''vectoren'',''algebra'') and p_action=''end_round''');
 source:=replace(source,'r.game<>''vectoren''','r.game<>game_id');
 source:=replace(source,'result:=axioma_private.vector_class_legacy(p_action,p_data);','if game_id=''algebra'' and p_action=''create'' then p_data:=p_data||jsonb_build_object(''server_grading'',true);end if;'||chr(10)||' result:=axioma_private.vector_class_legacy(p_action,p_data);');
 execute source;
 select pg_get_functiondef('axioma_private.vector_class_worker(text,jsonb)'::regprocedure) into source;
 source:=replace(source,'axioma_private.vector_class_worker','axioma_private.algebra_class_worker');
 source:=replace(source,'r.game<>''vectoren''','r.game<>''algebra''');
 execute source;
end $migration$;
revoke all on function axioma_private.algebra_class_worker(text,jsonb) from public,anon,authenticated;
grant execute on function axioma_private.algebra_class_worker(text,jsonb) to service_role;
create function public.axioma_algebra_class_worker(p_action text,p_data jsonb) returns jsonb
language sql security invoker set search_path='' as $$select axioma_private.algebra_class_worker(p_action,p_data)$$;
revoke all on function public.axioma_algebra_class_worker(text,jsonb) from public,anon,authenticated;
grant execute on function public.axioma_algebra_class_worker(text,jsonb) to service_role;
