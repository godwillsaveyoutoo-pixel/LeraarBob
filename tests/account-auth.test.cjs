const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const tick=()=>new Promise(r=>setImmediate(r));
function fixture(initial={user:{id:'a'}}){
 let callback,subscriptions=0,session=initial,fail=false,teacher=false,avatarFailure=false,avatarDelay=null;const updates=[];
 const tasks=[],waiters=new Map(),queries=[];
 const client={auth:{updateUser:async payload=>{const user=session.user;updates.push(payload);if(avatarDelay)await avatarDelay;if(avatarFailure)return {error:Error('offline')};const updated={...user,user_metadata:{...user.user_metadata,...payload.data}};if(session?.user?.id===user.id)session={...session,user:updated};return {data:{user:updated}};},getSession:async()=>({data:{session}}),onAuthStateChange:fn=>{callback=fn;subscriptions++}},rpc:async()=>fail?{error:Error('offline')}:{data:teacher},from(){let id;const q={select:()=>q,eq:(_,v)=>{id=v;return q},maybeSingle:()=>{queries.push(id);if(waiters.has(id))return waiters.get(id).promise;return Promise.resolve({data:{user_id:id,alias:id,class_code:'3TMW'}})}};return q}};
 const ctx={LeraarBobAvatar:require('../shared/learner-avatar.js'),console,AXIOMA_CONFIG:{url:'https://example.supabase.co',publicKey:'public'},supabase:{createClient:()=>client},localStorage:{},setTimeout:fn=>tasks.push(fn),CustomEvent:class{constructor(type,data){this.type=type;this.detail=data.detail}},dispatchEvent:()=>{}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync('shared/axioma-auth.js','utf8'),ctx);
 return {auth:ctx.AxiomaAuth,updates,teacher:v=>teacher=v,avatarFailure:v=>avatarFailure=v,delayAvatar:p=>avatarDelay=p,queries,get subscriptions(){return subscriptions},fail:value=>fail=value,
  event(value){session=value;callback(value?'SIGNED_IN':'SIGNED_OUT',value)},
  defer(id){let resolve;const promise=new Promise(r=>resolve=r);waiters.set(id,{promise,resolve});return ()=>resolve({data:{user_id:id,alias:id,class_code:'3TMW'}})},
  async drain(){while(tasks.length)tasks.shift()();await tick()}
 };
}
test('identity invalidates before async work; delayed old profile cannot restore prior learner',async()=>{
 const f=fixture();await f.auth.ready();assert.equal((await f.auth.getAccount()).id,'a');
 const finishB=f.defer('b');f.event({user:{id:'b'}});
 await assert.rejects(f.auth.getAccount(),/opnieuw gecontroleerd/);
 await f.drain();f.event({user:{id:'c'}});await f.drain();assert.equal((await f.auth.getAccount()).id,'c');
 finishB();await tick();assert.equal((await f.auth.getAccount()).id,'c');
 f.event(null);assert.equal(await f.auth.getAccount(),null);await f.drain();assert.equal(await f.auth.getAccount(),null);
});
test('queued sign-in callback cannot undo a later logout',async()=>{
 const f=fixture();await f.auth.ready();f.event({user:{id:'b'}});f.event(null);await f.drain();
 assert.equal(await f.auth.getAccount(),null);assert(!f.queries.includes('b'));
});
test('a failed initial profile load can retry without duplicate auth subscriptions',async()=>{
 const f=fixture();f.fail(true);await assert.rejects(f.auth.ready(),/offline/);f.fail(false);
 await f.auth.ready();assert.equal((await f.auth.getAccount()).id,'a');assert.equal(f.subscriptions,1);
});

test('student and teacher avatars use account metadata while roles and profiles stay intact',async()=>{
 for(const teacher of [false,true]){
  const f=fixture({user:{id:'a',email:'teacher@example.invalid',user_metadata:{leraarbob_avatar:'owl',alias:'original'}}});f.teacher(teacher);
  await f.auth.ready();const before=await f.auth.getAccount();assert.equal(before.avatar_id,'owl');
  const saved=await f.auth.setAvatar('fox');assert.equal(saved.avatar_id,'fox');assert.equal(saved.role,teacher?'teacher':'student');assert.equal(saved.alias,before.alias);
  assert.equal(JSON.stringify(f.updates[0]),JSON.stringify({data:{leraarbob_avatar:'fox'}}));
  await f.auth.refresh();assert.equal((await f.auth.getAccount()).avatar_id,'fox');
  await f.auth.setAvatar(null);assert.equal((await f.auth.getAccount()).avatar_id,null);
 }
});
test('invalid, failed and cross-account avatar updates cannot replace the displayed identity',async()=>{
 const f=fixture();await f.auth.ready();await assert.rejects(f.auth.setAvatar('https://untrusted.invalid/photo'),/lijst/);assert.equal(f.updates.length,0);
 f.avatarFailure(true);await assert.rejects(f.auth.setAvatar('fox'),/offline/);assert.equal((await f.auth.getAccount()).avatar_id,null);f.avatarFailure(false);
 let finish;f.delayAvatar(new Promise(r=>finish=r));const pending=f.auth.setAvatar('owl');f.event({user:{id:'b'}});await f.drain();finish();await assert.rejects(pending,/gewijzigd/);assert.equal((await f.auth.getAccount()).id,'b');assert.equal((await f.auth.getAccount()).avatar_id,null);
});
test('a profile read started before saving cannot restore an older avatar',async()=>{
 const f=fixture();await f.auth.ready();const finish=f.defer('a');const refresh=f.auth.refresh();await tick();await f.auth.setAvatar('bear');finish();await refresh;assert.equal((await f.auth.getAccount()).avatar_id,'bear');
 const avatars=require('../shared/learner-avatar.js');assert.equal(Object.keys(avatars.catalog).length,24);assert.equal(avatars.valid('constructor'),false);
});
