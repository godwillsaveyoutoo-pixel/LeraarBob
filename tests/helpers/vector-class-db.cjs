const fs=require('node:fs'),path=require('node:path');
const {PGlite}=require(process.env.VECTOR_PGLITE_MODULE||'@electric-sql/pglite');
const ids={teacher:'00000000-0000-0000-0000-000000000001',alex:'00000000-0000-0000-0000-000000000002',sam:'00000000-0000-0000-0000-000000000003',outsider:'00000000-0000-0000-0000-000000000004'};
async function createDB(){
 const db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema auth;create schema axioma_private;create table auth.users(id uuid primary key);create table public.axioma_profiles(user_id uuid primary key,alias text);create table axioma_private.teachers(user_id uuid primary key);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function public.axioma_is_teacher() returns boolean language sql security definer set search_path='' as $$select exists(select 1 from axioma_private.teachers where user_id=auth.uid())$$;`);
 for(const [name,id] of Object.entries(ids)){await db.query('insert into auth.users values($1)',[id]);if(name!=='teacher')await db.query('insert into public.axioma_profiles values($1,$2)',[id,name]);}
 await db.query('insert into axioma_private.teachers values($1)',[ids.teacher]);
 const root=path.resolve(__dirname,'../../supabase/migrations'),files=fs.readdirSync(root).filter(f=>/_vector_class_.*\.sql$/.test(f)).sort();
 for(const file of files)await db.exec(fs.readFileSync(path.join(root,file),'utf8'));
 let queue=Promise.resolve();
 const rpc=(user,action,data={},functionName='axioma_vector_class')=>{const work=queue.catch(()=>{}).then(()=>db.transaction(async tx=>{
  await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[ids[user]||'']);await tx.exec('set local role authenticated');
  if(!['axioma_vector_class','axioma_game_class'].includes(functionName))throw Error('Unknown RPC');
  return (await tx.query('select public.'+functionName+'($1,$2::jsonb) as result',[action,JSON.stringify(data)])).rows[0].result;
 }));queue=work;return work;};
 return {db,rpc,ids};
}
module.exports={createDB,ids};
