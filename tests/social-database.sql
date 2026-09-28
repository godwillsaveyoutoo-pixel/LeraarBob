-- Run inside a transaction, then ROLLBACK. Synthetic users never persist.
do $$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid();
  ta uuid := gen_random_uuid(); tb uuid := gen_random_uuid(); tc uuid := gen_random_uuid();
  invitation uuid; payload jsonb; denied boolean;
begin
  insert into auth.users(id,raw_user_meta_data) values
    (a,'{"alias":"social_test_a","class_code":"3TMW"}'::jsonb),
    (b,'{"alias":"social_test_b","class_code":"3TMW"}'::jsonb),
    (c,'{"alias":"social_test_c","class_code":"3TMW"}'::jsonb);
  perform set_config('request.jwt.claim.sub',a::text,true);
  perform public.axioma_social('sync',ta);
  perform public.axioma_social('sync',gen_random_uuid());
  perform set_config('request.jwt.claim.sub',b::text,true);
  payload := public.axioma_social('sync',tb);
  if (select count(*) from jsonb_array_elements(payload->'players') p where p->>'id'=a::text) <> 1 then
    raise exception 'FAIL: multiple tabs must count once'; end if;
  perform set_config('request.jwt.claim.sub',a::text,true);
  denied := false;
  begin perform public.axioma_social('invite',ta,a); exception when others then denied:=true; end;
  if not denied then raise exception 'FAIL: self invite'; end if;
  payload := public.axioma_social('invite',ta,b); invitation := (payload->>'id')::uuid;
  denied := false;
  begin perform public.axioma_social('invite',ta,b); exception when others then denied:=true; end;
  if not denied then raise exception 'FAIL: duplicate invite'; end if;
  denied := false;
  begin perform public.axioma_social('accept',ta,null,invitation); exception when others then denied:=true; end;
  if not denied then raise exception 'FAIL: sender cannot accept own invite'; end if;
  perform set_config('request.jwt.claim.sub',c::text,true);
  payload := public.axioma_social('sync',tc);
  if jsonb_array_length(payload->'invitations') <> 0 then raise exception 'FAIL: invitation privacy'; end if;
  denied := false;
  begin perform public.axioma_social('accept',tc,null,invitation); exception when others then denied:=true; end;
  if not denied then raise exception 'FAIL: third party accept'; end if;
  perform set_config('request.jwt.claim.sub',b::text,true);
  perform public.axioma_social('decline',tb,null,invitation);
  perform set_config('request.jwt.claim.sub',a::text,true);
  payload := public.axioma_social('invite',ta,b); invitation := (payload->>'id')::uuid;
  perform set_config('request.jwt.claim.sub',b::text,true);
  perform public.axioma_social('accept',tb,null,invitation);
  perform public.axioma_social('join',tb,null,invitation);
  if not axioma_private.can_join_naval('axioma:rechten-zeeslag:match:'||invitation::text) then
    raise exception 'FAIL: participant must access match'; end if;
  denied := false;
  begin perform public.axioma_social('join',gen_random_uuid(),null,invitation); exception when others then denied:=true; end;
  if not denied then raise exception 'FAIL: match already belongs to another tab'; end if;
  perform set_config('request.jwt.claim.sub',c::text,true);
  if axioma_private.can_join_naval('axioma:rechten-zeeslag:match:'||invitation::text) then
    raise exception 'FAIL: third party match access'; end if;
  denied := false;
  begin perform public.axioma_social('invite',tc,b); exception when others then denied:=true; end;
  if not denied then raise exception 'FAIL: busy player invited'; end if;
  perform set_config('request.jwt.claim.sub',a::text,true);
  perform public.axioma_social('finish',ta,null,invitation);
  payload := public.axioma_social('invite',ta,b); invitation := (payload->>'id')::uuid;
  update axioma_private.game_invitations set expires_at=now()-interval '1 second' where id=invitation;
  payload := public.axioma_social('sync',ta);
  if not exists(select 1 from jsonb_array_elements(payload->'invitations') i where i->>'id'=invitation::text and i->>'status'='expired') then
    raise exception 'FAIL: expiry'; end if;
  perform set_config('request.jwt.claim.sub',b::text,true);
  perform public.axioma_social('offline',tb);
  perform set_config('request.jwt.claim.sub',a::text,true);
  denied := false;
  begin perform public.axioma_social('invite',ta,b); exception when others then denied:=true; end;
  if not denied then raise exception 'FAIL: offline invite'; end if;
  perform set_config('request.jwt.claim.sub','',true);
  denied := false;
  begin perform public.axioma_social('sync',ta); exception when others then denied:=true; end;
  if not denied then raise exception 'FAIL: unauthenticated access'; end if;
  if has_function_privilege('anon','public.axioma_social(text,uuid,uuid,uuid,uuid)','EXECUTE') then raise exception 'FAIL: anon RPC'; end if;
  if has_table_privilege('authenticated','axioma_private.game_invitations','SELECT') then raise exception 'FAIL: raw table access'; end if;
end;
$$;
