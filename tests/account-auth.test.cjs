const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const tick=()=>new Promise(r=>setImmediate(r));
function fixture(initial={user:{id:'a'}}){
 let callback,subscriptions=0,session=initial,fail=false;
 const tasks=[],waiters=new Map(),queries=[];
 const client={auth:{getSession:async()=>({data:{session}}),onAuthStateChange:fn=>{callback=fn;subscriptions++}},rpc:async()=>fail?{error:Error('offline')}:{data:false},from(){let id;const q={select:()=>q,eq:(_,v)=>{id=v;return q},maybeSingle:()=>{queries.push(id);if(waiters.has(id))return waiters.get(id).promise;return Promise.resolve({data:{user_id:id,alias:id,class_code:'3TMW'}})}};return q}};
 const ctx={console,AXIOMA_CONFIG:{url:'https://example.supabase.co',publicKey:'public'},supabase:{createClient:()=>client},localStorage:{},setTimeout:fn=>tasks.push(fn),CustomEvent:class{constructor(type,data){this.type=type;this.detail=data.detail}},dispatchEvent:()=>{}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync('shared/axioma-auth.js','utf8'),ctx);
 return {auth:ctx.AxiomaAuth,queries,get subscriptions(){return subscriptions},fail:value=>fail=value,
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
