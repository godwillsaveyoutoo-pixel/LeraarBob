-- Personal documents are separate from game progress. No learner grades or XP.
create table if not exists public.axioma_worksheet_archive (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 100),
  document jsonb,
  deleted_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id,id),
  check (document is null or (jsonb_typeof(document)='object' and octet_length(document::text)<=16777216))
);
alter table public.axioma_worksheet_archive enable row level security;
revoke all on public.axioma_worksheet_archive from public,anon,authenticated;

create or replace function axioma_private.worksheet_archive(p_action text,p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=auth.uid();
  doc jsonb:=p_data->'document';
  wanted text:=coalesce(p_data->>'id',doc->>'id');
  old public.axioma_worksheet_archive%rowtype;
  result jsonb;
begin
  if actor is null then raise exception 'Log in om je oefenbladen online te bewaren.'; end if;
  if p_data->>'ownerId' is distinct from actor::text then raise exception 'Het account is gewijzigd. Open je oefenbladmap opnieuw.'; end if;
  if p_action='list' then
    select coalesce(jsonb_agg(jsonb_build_object('id',id,'deleted',deleted_at is not null,'updatedAt',updated_at)||case when deleted_at is null then document-'questionsHTML'-'keyHTML'-'data'-'config'-'styles' else '{}'::jsonb end order by updated_at desc),'[]'::jsonb)
      into result from public.axioma_worksheet_archive where user_id=actor;
    return jsonb_build_object('entries',result);
  end if;
  if wanted is null or length(wanted) not between 1 and 100 then raise exception 'Ongeldige reeks.'; end if;
  if p_action='get' then
    select document into result from public.axioma_worksheet_archive where user_id=actor and id=wanted and deleted_at is null;
    return jsonb_build_object('document',result);
  end if;
  if p_action not in ('save','delete') then raise exception 'Onbekende archiefactie.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text,261011));
  select * into old from public.axioma_worksheet_archive where user_id=actor and id=wanted for update;
  if old.id is null and (select count(*) from public.axioma_worksheet_archive where user_id=actor)>=10000 then
    raise exception 'Je archieflimiet is bereikt. Bestaande documenten blijven beschikbaar.';
  end if;
  if p_action='delete' then
    insert into public.axioma_worksheet_archive(user_id,id,deleted_at) values(actor,wanted,now())
      on conflict(user_id,id) do update set document=null,deleted_at=now(),updated_at=now();
    return jsonb_build_object('id',wanted,'deleted',true);
  end if;
  if old.deleted_at is not null then raise exception 'Deze reeks is op een ander toestel verwijderd. Maak een nieuwe kopie als je haar opnieuw wilt bewaren.'; end if;
  if jsonb_typeof(doc) is distinct from 'object' or doc->>'id' is distinct from wanted or doc->>'version' is distinct from '1'
    or jsonb_typeof(doc->'questionsHTML') is distinct from 'string'
    or length(coalesce(doc->>'questionsHTML',''))=0
    or jsonb_typeof(doc->'sourceId') is distinct from 'string'
    or length(coalesce(doc->>'title',''))>200
    or octet_length(doc::text)>16777216 then raise exception 'Ongeldig of te groot oefenblad.'; end if;
  if old.id is not null then
    if old.document<>doc then raise exception 'Deze bewaarde reeks heeft al een andere inhoud. Bewaar een nieuwe reeks.'; end if;
    return jsonb_build_object('id',wanted,'saved',true);
  end if;
  if (select count(*) from public.axioma_worksheet_archive where user_id=actor and deleted_at is null)>=200
    or (select coalesce(sum(octet_length(document::text)),0) from public.axioma_worksheet_archive where user_id=actor and deleted_at is null)+octet_length(doc::text)>67108864 then
    raise exception 'Je online map is vol. Download een kopie en verwijder eerst een oudere reeks.';
  end if;
  insert into public.axioma_worksheet_archive(user_id,id,document) values(actor,wanted,doc);
  return jsonb_build_object('id',wanted,'saved',true);
end;
$$;
revoke all on function axioma_private.worksheet_archive(text,jsonb) from public,anon;
grant usage on schema axioma_private to authenticated;
grant execute on function axioma_private.worksheet_archive(text,jsonb) to authenticated;

create or replace function public.axioma_worksheet_archive(p_action text,p_data jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path='' as $$
  select axioma_private.worksheet_archive(p_action,p_data);
$$;
revoke all on function public.axioma_worksheet_archive(text,jsonb) from public,anon;
grant execute on function public.axioma_worksheet_archive(text,jsonb) to authenticated;
