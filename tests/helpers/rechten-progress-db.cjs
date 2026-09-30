// Real progress RPC + migration, in an isolated Postgres instance.
const fs=require('node:fs'),path=require('node:path');
const {PGlite}=require(process.env.VECTOR_PGLITE_MODULE||'@electric-sql/pglite');
const root=path.resolve(__dirname,'../..');
const migration=()=>fs.readFileSync(path.join(root,'supabase/migrations',fs.readdirSync(path.join(root,'supabase/migrations')).find(f=>f.endsWith('_rechtenwereld_account_progress.sql'))),'utf8');
const ids={alex:'00000000-0000-0000-0000-000000000002',sam:'00000000-0000-0000-0000-000000000003',teacher:'00000000-0000-0000-0000-000000000001'};
async function createDB(){
 const db=new PGlite();await db.exec(`
 create role anon;create role authenticated;create schema auth;create schema axioma_private;
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table public.axioma_profiles(user_id uuid primary key);
 create table public.axioma_games(id text primary key,active boolean,progress_type text);
 create table public.axioma_progress(user_id uuid primary key,state jsonb,revision bigint,updated_at timestamptz);
 create table public.axioma_game_progress(user_id uuid,game_id text references public.axioma_games,state jsonb not null,revision bigint not null,updated_at timestamptz,trust_level text,primary key(user_id,game_id));
 alter table public.axioma_game_progress enable row level security;
 alter table public.axioma_progress enable row level security;
 create policy own_game_progress on public.axioma_game_progress for select to authenticated using(user_id=(select auth.uid()));
 create policy own_legacy_progress on public.axioma_progress for select to authenticated using(user_id=(select auth.uid()));
 grant usage on schema auth,axioma_private to authenticated;
 grant select on public.axioma_game_progress,public.axioma_progress to authenticated;
 `);
 await db.exec(migration());
 await db.exec(`create function public.axioma_save_game_progress(p_game_id text,p_state jsonb,p_revision bigint) returns jsonb language sql set search_path='' as $$select axioma_private.save_game_progress(p_game_id,p_state,p_revision)$$;
 revoke all on function public.axioma_save_game_progress(text,jsonb,bigint) from public,anon;
 grant execute on function public.axioma_save_game_progress(text,jsonb,bigint) to authenticated;`);
 const binding=fs.readFileSync(path.join(root,'supabase_account_progress.sql'),'utf8').split('create or replace function public.axioma_save_progress_for_account')[0];await db.exec(binding);
 await db.query('insert into public.axioma_profiles values($1),($2)',[ids.alex,ids.sam]);
 await db.exec("insert into public.axioma_games values('rechten-trainer',true,'trainer'),('vectoren-trainer',true,'levels'),('other-trainer',true,'trainer'),('untracked',true,'none'),('inactive',false,'levels')");
 let queue=Promise.resolve();
 function as(user,sql,params=[],role='authenticated'){
  const work=queue.catch(()=>{}).then(()=>db.transaction(async tx=>{
   await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[ids[user]||'']);await tx.exec('set local role '+role);return (await tx.query(sql,params)).rows;
  }));queue=work;return work;
 }
 const save=async(user,state,revision=0,game='rechten-trainer',expected=ids[user])=>(await as(user,'select public.axioma_save_game_progress_for_account($1,$2::jsonb,$3,$4) as result',[game,JSON.stringify(state),revision,expected]))[0].result;
 return {db,ids,as,save};
}
module.exports={createDB,migration,ids};
