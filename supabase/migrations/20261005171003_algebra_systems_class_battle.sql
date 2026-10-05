-- Add simple unique systems to the existing Algebra class provider.
-- Room IDs, participant ownership, deadlines, retries and trusted grades stay intact.
begin;
alter table axioma_private.vector_class_rooms drop constraint vector_class_rooms_seconds_check;
alter table axioma_private.vector_class_rooms add constraint vector_class_rooms_seconds_check
 check(seconds in (30,60,90,120) or (game='algebra' and seconds=180));

do $migration$
declare source text; previous text;
begin
 select pg_get_functiondef('axioma_private.vector_class_legacy(text,jsonb)'::regprocedure) into source;
 previous:=$source$when 'algebra' then coalesce(spec->>'skill','') in ('A1','A2','A3','A4','B1','B2','B3','B4','B5','C1','C2','D1','D2','D3','E1','E2','E3')$source$;
 if position(previous in source)=0 then raise exception 'Onverwachte Algebra klasbattle-versie';end if;
 source:=replace(source,previous,replace(previous,'''E3'')','''E3'',''S1'')'));
 previous:=$source$jsonb_array_length(p_data->'deck') not in (5,10)$source$;
 if position(previous in source)=0 then raise exception 'Onverwachte rondecontrole';end if;
 source:=replace(source,previous,$source$(jsonb_array_length(p_data->'deck') not in (5,10) and not(game_name='algebra' and jsonb_array_length(p_data->'deck')=3))$source$);
 source:=replace(source,$source$raise exception 'Kies 5 of 10 rondes.';$source$,$source$raise exception '%',case when game_name='algebra' then 'Kies 3, 5, 10 of 20 rondes.' else 'Kies 5 of 10 rondes.' end;$source$);
 previous:=$source$if (p_data->>'seconds')::integer not in (30,60,90,120) or p_data->>'seconds' is null$source$;
 if position(previous in source)=0 then raise exception 'Onverwachte rondetijdcontrole';end if;
 source:=replace(source,previous,$source$if ((p_data->>'seconds')::integer not in (30,60,90,120) and not(game_name='algebra' and (p_data->>'seconds')::integer=180)) or p_data->>'seconds' is null$source$);
 previous:=$source$then raise exception 'Ongeldige vraag.'; end if;$source$;
 if position(previous in source)=0 then raise exception 'Onverwachte opgavecontrole';end if;
 source:=replace(source,previous,$source$then raise exception 'Ongeldige vraag.'; end if;
    if game_name='algebra' and (jsonb_typeof(spec->'seed') is distinct from 'number' or jsonb_typeof(spec->'variant') is distinct from 'number' or (spec->>'seed')::numeric>4294967295) then
     raise exception 'Ongeldige algebra-opgave.';
    end if;$source$);
 previous:=$source$if jsonb_typeof(p_data->'answer') is distinct from 'object' or octet_length((p_data->'answer')::text)>16000 then raise exception 'Ongeldig antwoord.'; end if;$source$;
 if position(previous in source)=0 then raise exception 'Onverwachte antwoordcontrole';end if;
 source:=replace(source,previous,previous||$source$
   if game_name='algebra' and r.deck->r.round->>'skill'='S1' and not coalesce((p_data->>'skipped')::boolean,false) then
    if jsonb_typeof(p_data->'answer'->'x') is distinct from 'string' or jsonb_typeof(p_data->'answer'->'y') is distinct from 'string'
     or length(p_data->'answer'->>'x')>40 or length(p_data->'answer'->>'y')>40 then
     raise exception 'Vul x en y in als getal of breuk.';
    end if;
   end if;$source$);
 execute source;
end $migration$;
-- The replaced private function retains the existing revoked privileges.
-- No new public data, grade endpoint or table access is introduced.
commit;
