// Real Edge/SQL, synthetic users only. No live accounts or messages.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {createDB}=require('./helpers/rechten-online-db.cjs');const engine=require('../shared/multiplayer/rechten-learn-engine.cjs');
(async()=>{const {db,ids,progress}=await createDB();try{
for(const file of ['20260929235628_rechten_samen_leren.sql','20260929235633_rechten_learn_invitations.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
let serial=Promise.resolve();const as=(user,role,sql,args=[])=>{const task=serial.catch(()=>{}).then(()=>db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[ids[user]||'']);await tx.exec('set local role '+role);return (await tx.query(sql,args)).rows[0]?.result;}));serial=task;return task;};
const rpc=(action,data)=>as(null,'service_role','select public.axioma_rechten_learn_worker($1,$2) result',[action,JSON.stringify(data)]);
const {createHandler}=await import('../supabase/functions/rechten-learn/handler.js');
const handler=createHandler({url:'https://test.invalid',anonKey:'anon',serviceKey:'trusted',engine,fetcher:async(url,opts)=>{const token=opts.headers.Authorization.slice(7);if(url.endsWith('/user'))return new Response(JSON.stringify(ids[token]?{id:ids[token]}:{}),{status:ids[token]?200:401});assert.equal(token,'trusted');const a=JSON.parse(opts.body);try{return new Response(JSON.stringify(await rpc(a.p_action,a.p_data)));}catch(e){return new Response(JSON.stringify({message:e.message}),{status:400});}}});
const call=async(user,action,data={})=>{const r=await handler(new Request('https://test.invalid',{method:'POST',headers:{Authorization:'Bearer '+user},body:JSON.stringify({action,data:{tab_id:ids[user],...data}})}));const b=await r.json();if(!r.ok)throw Error(b.error);return b;};
const social=(user,action='sync',invite=null,target=null)=>as(user,'authenticated','select public.axioma_social($1,$2,$3,$4,null) result',[action,ids[user],target,invite]);
async function reset(){await db.exec('delete from axioma_private.game_invitations;delete from axioma_private.rechten_learn_rooms;delete from axioma_private.online_sessions;delete from public.axioma_game_progress;');await db.exec("update public.axioma_profiles set class_code='TEST'");for(const u of ['alex','sam','outsider'])await social(u);}
const create=(capacity=2,skill='point_plot')=>call('alex','create',{capacity,skill});
await reset();await assert.rejects(call('invalid','create',{capacity:2,skill:'point_plot'}),/aan/);await assert.rejects(call('teacher','create',{capacity:2,skill:'point_plot'}),/leerling/);
let r=await create();assert.equal(r.peers.length,2);assert.equal(r.capacity,2);
await assert.rejects(call('alex','create',{id:r.id,capacity:2,skill:'point_plot'}),/ander groepje/);
let inv=await call('alex','invite',{id:r.id,target:ids.sam});assert.equal((await call('alex','invite',{id:r.id,target:ids.sam})).invitation,inv.invitation);
await assert.rejects(call('alex','invite',{id:r.id,target:ids.outsider}),/plaatsen/);await assert.rejects(call('outsider','join',{code:r.code}),/vol/);
const notify=await social('sam');assert.equal(notify.invitations[0].game,'rechten-learn');assert.equal(notify.invitations[0].learn_room_id,r.id);
await assert.rejects(social('sam','accept',inv.invitation),/Samen leren/);
await assert.rejects(call('outsider','accept',{invite:inv.invitation,user_id:ids.sam}),/niet gevonden/);await assert.rejects(call('alex','accept',{invite:inv.invitation}),/niet voor jou/);
assert.equal((await call('sam','decline',{invite:inv.invitation})).status,'declined');assert.equal((await call('sam','decline',{invite:inv.invitation})).status,'declined');
inv=await call('alex','invite',{id:r.id,target:ids.sam});let member=await call('sam','accept',{invite:inv.invitation});assert.equal(member.id,r.id);assert.equal(member.members.length,2);
assert.equal((await call('sam','accept',{invite:inv.invitation})).members.length,2);await assert.rejects(call('sam','create',{capacity:2,skill:'delta'}),/ander groepje/);
await assert.rejects(social('outsider','invite',null,ids.sam),/leergroepje/);
console.log('PASS alias invite, social delivery, accept/decline, explicit membership, one reserved seat, retry, forged identity and cross-game occupancy');

await reset();r=await create(3);const [one,two]=await Promise.all([call('alex','invite',{id:r.id,target:ids.sam}),call('alex','invite',{id:r.id,target:ids.outsider})]);
const joined=await Promise.all([call('sam','accept',{invite:one.invitation}),call('outsider','accept',{invite:two.invitation})]);assert.equal(joined.at(-1).members.length,3);
let host=await call('alex','state',{id:r.id});host=await call('alex','start',{id:r.id,version:host.version,request:crypto.randomUUID()});assert.equal(host.phase,'idea');
await assert.rejects(call('alex','invite',{id:r.id,target:ids.sam}),/wachtkamer/);
console.log('PASS trio invitations and parallel accepts share one room; start only after joining');

await reset();r=await create();inv=await call('alex','invite',{id:r.id,target:ids.sam});await db.query("update axioma_private.online_sessions set seen_at=now()-interval '2 minutes' where user_id=$1",[ids.alex]);
await assert.rejects(call('sam','accept',{invite:inv.invitation}),/offline/);await call('alex','state',{id:r.id});member=await call('sam','accept',{invite:inv.invitation});assert.equal(member.members.length,2);
await reset();r=await create();inv=await call('alex','invite',{id:r.id,target:ids.sam});await db.query("update axioma_private.game_invitations set expires_at=now()-interval '1 second' where id=$1",[inv.invitation]);assert.equal((await social('sam')).invitations[0].status,'expired');await assert.rejects(call('sam','accept',{invite:inv.invitation}),/verlopen/);
inv=await call('alex','invite',{id:r.id,target:ids.sam});assert.equal((await call('alex','cancel',{invite:inv.invitation})).status,'cancelled');
await db.query("update public.axioma_profiles set class_code='OTHER' where user_id=$1",[ids.sam]);assert(!(await call('alex','state',{id:r.id})).peers.some(p=>p.id===ids.sam));await assert.rejects(call('alex','invite',{id:r.id,target:ids.sam}),/eigen klas/);
await db.query("update axioma_private.online_sessions set seen_at=now()-interval '2 minutes' where user_id=$1",[ids.outsider]);await assert.rejects(call('alex','invite',{id:r.id,target:ids.outsider}),/online/);
console.log('PASS offline retry, expiration, cancellation, other classes and offline peers');

await reset();r=await create(3);inv=await call('alex','invite',{id:r.id,target:ids.sam});member=await call('sam','join',{code:r.code});assert.equal(member.members.length,2);assert.equal((await social('sam')).invitations[0].status,'accepted');
let later=await call('alex','invite',{id:r.id,target:ids.outsider});host=await call('alex','state',{id:r.id});await call('alex','start',{id:r.id,version:host.version,request:crypto.randomUUID()});assert.equal((await social('outsider')).invitations[0].status,'cancelled');await assert.rejects(call('outsider','accept',{invite:later.invitation}),/verlopen/);
await reset();const all=['delta','slope','slope_from_two_points','line_behavior','special_lines','zeroRead','zero','signchart','positive','negative'];await progress('alex',all);r=await create(2,'graph_from_equation');assert.equal(r.peers.length,0);await assert.rejects(call('alex','invite',{id:r.id,target:ids.sam}),/Formulewerf/);await progress('sam',all);assert.equal((await call('alex','state',{id:r.id})).peers.length,1);
const grants=(await db.query("select has_function_privilege('authenticated','public.axioma_rechten_learn_worker(text,jsonb)','execute') rpc,has_function_privilege('service_role','axioma_private.rechten_learn_worker_v1(text,jsonb)','execute') old,has_table_privilege('authenticated','axioma_private.game_invitations','select') invites")).rows[0];assert.deepEqual(grants,{rpc:false,old:false,invites:false});
console.log('PASS code fallback, pending third cancelled on start, prerequisites and private function/table access');
}finally{await db.close();}})().catch(e=>{console.error(e);process.exitCode=1});
