-- Read-only hub: existing real class rooms and graded answers remain the source.
-- Student leaderboards are limited to their own class. No direct table grants.
create function axioma_private.class_battle_hub(p_action text default 'overview',p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); teacher boolean; class_name text; classes jsonb; rooms jsonb; stats jsonb; boards jsonb; found_game text;
begin
 if uid is null then raise exception 'Meld je eerst aan bij leraarBob.' using errcode='42501'; end if;
 teacher:=public.axioma_is_teacher();
 if not teacher and not exists(select 1 from public.axioma_profiles where user_id=uid) then raise exception 'Gebruik een leerling- of leerkrachtaccount.' using errcode='42501'; end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>2000 then raise exception 'Ongeldig verzoek.'; end if;
 if p_action='code' then
  if coalesce(p_data->>'code','') !~ '^[A-Fa-f0-9]{6}$' then raise exception 'Gebruik de sessiecode van zes tekens.'; end if;
  select game into found_game from axioma_private.vector_class_rooms where code=upper(p_data->>'code') and expires_at>now() and phase not in ('closed','finished');
  if found_game is null then raise exception 'Deze code bestaat niet of de battle is afgelopen.'; end if;
  return jsonb_build_object('game',found_game,'code',upper(p_data->>'code'));
 elsif p_action<>'overview' then raise exception 'Onbekende overzichtsactie.'; end if;
 if teacher then
  select coalesce(jsonb_agg(class_code order by class_code),'[]') into classes from (select distinct class_code from public.axioma_profiles where class_code is not null and class_code<>'') c;
  class_name:=nullif(p_data->>'class','');
  if class_name is not null and not exists(select 1 from public.axioma_profiles where class_code=class_name) then raise exception 'Onbekende klas.'; end if;
 else
  select class_code into class_name from public.axioma_profiles where user_id=uid;
  classes:=jsonb_build_array(class_name);
 end if;
 select coalesce(jsonb_agg(row_to_json(x) order by x.created_at desc),'[]') into rooms from (
  select r.id,r.game,r.phase,r.created_at,r.seconds,r.round,jsonb_array_length(r.deck) as total,r.owner_id=uid as owner,
   case when r.expires_at>now() and r.phase not in ('closed','finished') then r.code else null end as code,
   r.expires_at>now() and r.phase not in ('closed','finished') as active,
   (select count(*) from axioma_private.vector_class_members m where m.room_id=r.id) as participants,
   (select coalesce(sum(a.points),0) from axioma_private.vector_class_answers a where a.room_id=r.id and a.correct is not null and (teacher or a.user_id=uid)) as points,
   (select count(*) from axioma_private.vector_class_answers a where a.room_id=r.id and a.correct is not null and (teacher or a.user_id=uid)) as graded,
   (select count(*) from axioma_private.vector_class_answers a where a.room_id=r.id and a.correct=true and (teacher or a.user_id=uid)) as correct
  from axioma_private.vector_class_rooms r where r.owner_id=uid or exists(select 1 from axioma_private.vector_class_members m where m.room_id=r.id and m.user_id=uid)
  order by r.created_at desc limit 80
 ) x;
 -- Completed/closed battles contribute to lasting rankings; live rounds do not.
 with sessions as (
  select r.id,r.game,m.user_id from axioma_private.vector_class_rooms r join axioma_private.vector_class_members m on m.room_id=r.id
  where r.phase in ('finished','closed') and m.user_id=uid
 ), summaries as (
  select s.game,count(distinct s.id) as sessions,coalesce(sum(a.points) filter(where a.correct is not null),0) as points,
   count(a.*) filter(where a.correct is not null) as graded,count(a.*) filter(where a.correct=true) as correct
  from sessions s left join axioma_private.vector_class_answers a on a.room_id=s.id and a.user_id=s.user_id group by s.game
 ) select coalesce(jsonb_agg(row_to_json(x)),'[]') into stats from summaries x;
 with summaries as (
  select r.game,p.user_id,p.alias,count(distinct r.id) as sessions,
   coalesce(sum(a.points) filter(where a.correct is not null),0) as points,
   count(a.*) filter(where a.correct is not null) as graded,count(a.*) filter(where a.correct=true) as correct
  from axioma_private.vector_class_rooms r join axioma_private.vector_class_members m on m.room_id=r.id
  join public.axioma_profiles p on p.user_id=m.user_id
  left join axioma_private.vector_class_answers a on a.room_id=m.room_id and a.user_id=m.user_id
  where r.phase in ('finished','closed') and class_name is not null and p.class_code=class_name
  group by r.game,p.user_id,p.alias
 ), ranked as (
  select *,rank() over(partition by game order by points desc) as place from summaries
 ), visible as (
  select game,alias,sessions,points,graded,correct,place,user_id=uid as mine from ranked where place<=20 or user_id=uid
 ) select coalesce(jsonb_agg(row_to_json(x) order by x.game,x.place,x.alias),'[]') into boards from visible x;
 return jsonb_build_object('teacher',teacher,'class',class_name,'classes',classes,'rooms',rooms,'stats',stats,'leaderboards',boards,'as_of',now());
end;
$$;
revoke all on function axioma_private.class_battle_hub(text,jsonb) from public,anon;
grant execute on function axioma_private.class_battle_hub(text,jsonb) to authenticated;
create function public.axioma_class_battle_hub(p_action text default 'overview',p_data jsonb default '{}') returns jsonb
language sql security invoker set search_path='' as $$ select axioma_private.class_battle_hub(p_action,p_data); $$;
revoke all on function public.axioma_class_battle_hub(text,jsonb) from public,anon;
grant execute on function public.axioma_class_battle_hub(text,jsonb) to authenticated;
