'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite'),{JSDOM}=require('jsdom'),{IDBFactory}=require('fake-indexeddb'),{webcrypto}=require('node:crypto');
const ids={alice:'11111111-1111-1111-1111-111111111111',bob:'22222222-2222-2222-2222-222222222222'};
const input=n=>({sourceId:'rechtenwereld:hellingrug',title:'Hellingrug '+n,questionsHTML:'<p>y = '+n+'x + 2</p>',keyHTML:'<p>a = '+n+'</p>',styles:[],config:{seed:n},data:{answer:n}});
async function server(){const db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema auth;create schema axioma_private;create table auth.users(id uuid primary key);insert into auth.users values('${ids.alice}'),('${ids.bob}');create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);await db.exec(fs.readFileSync('supabase/migrations/20261011070545_os_worksheet_cloud_archive.sql','utf8'));let queue=Promise.resolve();const call=(actor,action,data,role='authenticated')=>{const task=queue.catch(()=>{}).then(()=>db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[ids[actor]||'']);await tx.exec('set local role '+role);return(await tx.query('select public.axioma_worksheet_archive($1,$2::jsonb) result',[action,JSON.stringify(data)])).rows[0].result;}));queue=task;return task;};return {db,call};}
async function device(s,initial='alice'){
 let user=initial,offline=false,paused=null;const listeners=[],dom=new JSDOM('',{url:'https://school.test/os/'}),win=dom.window;
 const auth={ready:async()=>({account:{id:ids[user]},pending:false}),getAccount:async()=>({id:ids[user]}),onChange:fn=>listeners.push(fn),client:()=>({rpc:async(_,{p_action,p_data})=>{if(offline)return {error:{message:'offline'}};if(paused)await paused;try{return {data:await s.call(user,p_action,p_data)}}catch(e){return {error:{message:e.message}}}}})};
 const library=require('../shared/worksheet-library.js')({window:win,document:win.document,indexedDB:new IDBFactory(),crypto:webcrypto,auth});await library.ready();
 return {library,close:()=>win.close(),offline:v=>offline=v,switch:async v=>{user=v;listeners.forEach(fn=>fn({account:{id:ids[user]},pending:false}));await library.ready();},hold:()=>{let resolve;paused=new Promise(r=>resolve=r);return()=>{paused=null;resolve();};}};
}
test('Cloud archive permissions, account binding, immutable snapshots and permanent deletion',async t=>{
 const s=await server();t.after(()=>s.db.close());const doc={...input(3),version:1,id:'one',createdAt:new Date().toISOString()};
 await assert.rejects(s.call('alice','save',{ownerId:ids.bob,document:doc}),/account/);
 await assert.rejects(s.call('alice','list',{ownerId:ids.alice},'anon'),/permission denied/);
 await assert.rejects(s.call(null,'list',{ownerId:ids.alice}),/Log in/);
 assert.equal((await s.call('alice','save',{ownerId:ids.alice,document:doc})).saved,true);
 await s.call('alice','save',{ownerId:ids.alice,document:doc});
 await assert.rejects(s.call('alice','save',{ownerId:ids.alice,document:{...doc,title:'Replaced'}}),/andere inhoud/);
 assert.equal((await s.call('bob','get',{ownerId:ids.bob,id:'one'})).document,null);
 assert.equal((await s.call('bob','list',{ownerId:ids.bob})).entries.length,0);
 const meta=(await s.call('alice','list',{ownerId:ids.alice})).entries[0];assert.equal(meta.questionsHTML,undefined);assert.equal(meta.keyHTML,undefined);
 assert.deepEqual((await s.call('alice','get',{ownerId:ids.alice,id:'one'})).document,doc);
 await s.call('alice','delete',{ownerId:ids.alice,id:'one'});assert.equal((await s.call('alice','list',{ownerId:ids.alice})).entries[0].deleted,true);
 await assert.rejects(s.call('alice','save',{ownerId:ids.alice,document:doc}),/verwijderd/);
 await assert.rejects(s.db.transaction(async tx=>{await tx.exec('set local role authenticated');await tx.query('select * from public.axioma_worksheet_archive');}),/permission denied/);
});
test('Archive history is bounded while existing documents remain readable and removable',async t=>{
 const s=await server();t.after(()=>s.db.close());const doc={...input(3),version:1,id:'kept',createdAt:new Date().toISOString()};
 await s.call('alice','save',{ownerId:ids.alice,document:doc});
 await s.db.query("insert into public.axioma_worksheet_archive(user_id,id,deleted_at) select $1,'deleted-'||n,now() from generate_series(1,9999) n",[ids.alice]);
 await assert.rejects(s.call('alice','delete',{ownerId:ids.alice,id:'extra'}),/archieflimiet/);
 await assert.rejects(s.call('alice','save',{ownerId:ids.alice,document:{...doc,id:'extra'}}),/archieflimiet/);
 assert.equal((await s.call('alice','save',{ownerId:ids.alice,document:doc})).saved,true);
 assert.deepEqual((await s.call('alice','get',{ownerId:ids.alice,id:'kept'})).document,doc);
 assert.equal((await s.call('alice','delete',{ownerId:ids.alice,id:'kept'})).deleted,true);
 assert.equal((await s.call('bob','save',{ownerId:ids.bob,document:doc})).saved,true,'The limit belongs only to its account');
});
test('Two isolated devices restore exact questions and key; offline additions/deletions retry and never resurrect',async t=>{
 const s=await server();t.after(()=>s.db.close());const a=await device(s),b=await device(s);t.after(()=>{a.close();b.close();});
 const saved=await a.library.save(input(7));assert.equal(saved.online,true);assert.equal((await b.library.list()).length,1);
 await s.db.query('delete from public.axioma_worksheet_archive where user_id=$1 and id=$2',[ids.alice,saved.id]);
 await a.library.sync();assert.equal((await s.call('alice','get',{ownerId:ids.alice,id:saved.id})).document.questionsHTML,input(7).questionsHTML,'A server restore cannot leave a false online cache flag');
 const restored=await b.library.get(saved.id);assert.equal(restored.questionsHTML,input(7).questionsHTML);assert.equal(restored.keyHTML,input(7).keyHTML);assert.deepEqual(restored.data,input(7).data);
 b.offline(true);assert.equal((await b.library.get(saved.id)).questionsHTML,restored.questionsHTML,'Downloaded copy works offline');
 await b.library.remove(saved.id);const pending=await b.library.save(input(9));assert.equal(pending.online,false);assert.equal((await b.library.list()).length,1);
 b.offline(false);await b.library.sync();assert.equal(b.library.syncStatus().online,true);const rows=await a.library.list();assert.deepEqual(rows.map(r=>r.id),[pending.id]);assert.equal(await a.library.get(saved.id),null);
 assert.equal((await a.library.get(pending.id)).keyHTML,input(9).keyHTML);
 await b.switch('bob');assert.equal((await b.library.list()).length,0);assert.equal(await b.library.get(pending.id),null);await b.switch('alice');assert.equal((await b.library.list()).length,1);
});
test('Account change during online request cannot attach the document to the next account',async t=>{
 const s=await server();t.after(()=>s.db.close());const a=await device(s);t.after(a.close);const release=a.hold();
 const saving=a.library.save(input(4));const rejected=assert.rejects(saving,/account/);await new Promise(r=>setTimeout(r,60));await a.switch('bob');release();await rejected;
 assert.equal((await a.library.list()).length,0);assert.equal((await s.call('bob','list',{ownerId:ids.bob})).entries.length,0);await a.switch('alice');assert.equal((await a.library.list()).length,1,'Original local owner can retry');
});
