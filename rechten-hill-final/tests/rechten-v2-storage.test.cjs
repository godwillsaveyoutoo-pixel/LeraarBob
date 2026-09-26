const {test}=require('node:test'),assert=require('node:assert/strict');
const Storage=require('../games/rechten/trainer-v2/storage.js');
const Evidence=require('../games/rechten/trainer-v2/evidence-adapter.js');
const Scheduler=require('../games/rechten/trainer-v2/scheduler-adapter.js');
const Wave=require('../games/rechten/trainer/wave-core.js');
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const tick=()=>new Promise(r=>setImmediate(r));
const initial=()=>({schema:1,screen:'world',active:null,missions:{},events:[],settings:{reducedMotion:false}});
const progressState=value=>({...initial(),missions:{grenspas:{phase:value}}});
function memory(){const data=new Map(),writes=[];return {data,writes,fail:false,get length(){return data.size},key:i=>[...data.keys()][i]??null,getItem:k=>data.get(k)??null,setItem(k,v){if(this.fail)throw Error('quota');data.set(k,String(v));writes.push(k)},removeItem:k=>data.delete(k)}}
function fixture(opts={}){
 const storage=opts.storage||memory(),listeners=new Set(),writes=[],reads=[],state={account:opts.guest?null:{id:'a',role:opts.role||'student'},remote:clone(opts.remote||{state:null,revision:0}),offline:!!opts.offline,legacy:opts.legacy||null,saveGate:null,loadGate:null};
 const auth={ready:async()=>{},getAccount:async()=>clone(state.account),onChange:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},client:()=>({from(table){const filters={};const q={select(){return q},eq(k,v){filters[k]=v;return q},async maybeSingle(){reads.push({table,...filters});return {data:clone(state.legacy)}}};return q}})};
 const progress={async load(game,owner){reads.push({game,owner});if(state.loadGate)await state.loadGate;if(state.offline)throw Error('offline');return clone(state.remote)},async save(game,envelope,revision,owner){writes.push({game,envelope:clone(envelope),revision,owner});if(state.saveGate)await state.saveGate;if(state.offline)throw Error('offline');if(revision!==state.remote.revision)return {status:'conflict',...clone(state.remote)};state.remote={state:clone(envelope),revision:revision+1,updatedAt:'2026-09-25T12:00:00.000Z'};return {status:'saved',revision:revision+1,updated_at:state.remote.updatedAt}}};
 const statuses=[],make=()=>Storage.create({storage,auth,progress,initial,locks:opts.locks,project:'https://test.invalid',onChange:v=>statuses.push(v),now:()=>1790337600000});
 return {storage,auth,progress,state,writes,reads,statuses,make,switch(account){state.account=account;for(const fn of listeners)fn({account,pending:false})}};
}
function gate(){let release;const promise=new Promise(r=>release=r);return {promise,release}}

test('guest reload preserves pending work; v1 readonly import has timestamp and is idempotent',async()=>{
 const f=fixture({guest:true}),old={version:704,skills:{sign:{strength:.8}},review:[{skill:'sign',kind:'repair'}],xp:713};
 const original=JSON.stringify(old);f.storage.setItem('axioma-trainer-rechten-v0700:wave4',original);
 const s=f.make();await s.start();assert.equal(s.status,'guest');assert.deepEqual(s.legacy.state,old);assert(s.legacy.importedAt);
 await s.commit(progressState('interval'));assert.equal(f.writes.length,0);const backups=f.storage.writes.filter(k=>k.includes(':legacy-backup:')).length;
 s.destroy();const reload=f.make();await reload.start();assert.equal(reload.snapshot().missions.grenspas.phase,'interval');assert.equal(f.storage.writes.filter(k=>k.includes(':legacy-backup:')).length,backups);assert.equal(f.storage.getItem('axioma-trainer-rechten-v0700:wave4'),original);
 assert(f.storage.writes.every(k=>k.startsWith('axioma:rechten:v2:')||k==='axioma-trainer-rechten-v0700:wave4'));
});
test('generic save preserves unknown fields and never writes specialized mastery',async()=>{
 const f=fixture({remote:{state:{foreign:{keep:[1,2]},completed:['old']},revision:4},legacy:{state:{skills:{ab:{strength:.7}},xp:100},revision:8}}),s=f.make();await s.start();await s.commit(progressState('symbol'));
 assert.equal(s.status,'saved');assert.equal(f.writes[0].game,'rechten-trainer');assert.equal(f.writes[0].revision,4);assert.equal(f.writes[0].owner,'a');assert.deepEqual(f.state.remote.state.foreign,{keep:[1,2]});assert.deepEqual(f.state.remote.state.completed,['old']);assert(!Object.hasOwn(f.state.remote.state,'skills'));assert.equal(s.legacy.state.xp,100);assert.equal(f.state.remote.revision,5);
});
test('guest, teacher and learner caches remain isolated with no guest import for a learner',async()=>{
 const store=memory(),guest=fixture({storage:store,guest:true}),g=guest.make();await g.start();await g.commit(progressState('guest'));
 const student=fixture({storage:store}),s=student.make();await s.start();assert.deepEqual(s.snapshot(),initial());assert.equal(s.legacy,null);await s.commit(progressState('student'));
 const teacher=fixture({storage:store,role:'teacher'}),t=teacher.make();await t.start();assert.equal(t.status,'teacher');assert.deepEqual(t.snapshot(),initial());await t.commit(progressState('teacher'));assert.equal(teacher.writes.length,0);
 assert.notEqual(g.key,s.key);assert.notEqual(s.key,t.key);
});
test('offline writes survive reload and retry through the existing revision protocol',async()=>{
 const f=fixture(),s=f.make();await s.start();f.state.offline=true;await s.commit(progressState('saved-local'));assert.equal(s.status,'offline');assert.equal(s.snapshot().missions.grenspas.phase,'saved-local');s.destroy();
 const reload=f.make();await reload.start();assert.equal(reload.status,'offline');assert.equal(reload.snapshot().missions.grenspas.phase,'saved-local');f.state.offline=false;await reload.sync();assert.equal(reload.status,'saved');assert.equal(f.state.remote.state.rechtenV2.missions.grenspas.phase,'saved-local');
});
test('edits made during an in-flight save are saved at the following revision',async()=>{
 const f=fixture(),s=f.make();await s.start();const wait=gate();f.state.saveGate=wait.promise;
 const first=s.commit(progressState('first'));await tick();const second=s.commit(progressState('second'));await tick();assert.equal(s.snapshot().missions.grenspas.phase,'second');f.state.saveGate=null;wait.release();await Promise.all([first,second]);
 assert.equal(f.state.remote.state.rechtenV2.missions.grenspas.phase,'second');assert.equal(f.state.remote.revision,2);assert.deepEqual(f.writes.map(v=>v.revision),[0,1]);
});
test('account replacement during load/save cannot populate or write a new owner cache',async()=>{
 const f=fixture(),s=f.make();await s.start();const wait=gate();f.state.saveGate=wait.promise;const save=s.commit(progressState('a-draft'));await tick();f.switch({id:'b',role:'student'});wait.release();await save;
 assert.equal(s.status,'account-change');assert.equal(s.writable,false);assert.deepEqual(s.snapshot(),initial());assert.equal(s.account,null);assert.equal(s.legacy,null);assert.equal(s.exportBackup().record,undefined);assert(f.writes.every(w=>w.owner==='a'));assert(![...f.storage.data.keys()].some(k=>k.endsWith('student:b')));
 const g=fixture(),late=gate();g.state.loadGate=late.promise;const second=g.make(),loading=second.start();await tick();g.switch({id:'b',role:'student'});late.release();await loading;assert.equal(second.status,'account-change');assert.equal(second.writable,false);
});
test('remote conflict freezes work; explicit local choice backs up both sides and preserves unrelated remote fields',async()=>{
 const f=fixture(),s=f.make();await s.start();f.state.remote={revision:1,state:{other:'remote',rechtenV2:progressState('remote')}};await s.commit(progressState('local'));
 assert.equal(s.status,'conflict');assert.equal(s.writable,false);assert.equal(f.state.remote.state.rechtenV2.missions.grenspas.phase,'remote');assert.equal(s.snapshot().missions.grenspas.phase,'local');
 await s.resolveConflict('local');assert.equal(s.status,'saved');assert.equal(f.state.remote.state.other,'remote');assert.equal(f.state.remote.state.rechtenV2.missions.grenspas.phase,'local');assert.equal(f.state.remote.revision,2);assert(f.storage.writes.some(k=>k.includes('backup:conflict-local')));assert(f.storage.writes.some(k=>k.includes('backup:conflict-other')));
});
test('explicit remote conflict choice loads remote without scoring or overwriting it',async()=>{
 const f=fixture(),s=f.make();await s.start();f.state.remote={revision:1,state:{rechtenV2:progressState('remote')}};await s.commit(progressState('local'));const writes=f.writes.length;
 await s.resolveConflict('remote');assert.equal(s.status,'saved');assert.equal(s.snapshot().missions.grenspas.phase,'remote');assert.equal(f.writes.length,writes);
});
test('stale offline tab cannot overwrite newer tab and supports explicit resolution',async()=>{
 const f=fixture({guest:true}),a=f.make();await a.start();const b=f.make();await b.start();await b.commit(progressState('b'));await a.commit(progressState('a'));
 assert.equal(a.status,'conflict');assert.equal(JSON.parse(f.storage.getItem(a.key)).state.missions.grenspas.phase,'b');await a.resolveConflict('remote');assert.equal(a.snapshot().missions.grenspas.phase,'b');assert.equal(a.status,'guest');
});
test('unknown schema and malformed cache are backed up and blocked without rewriting originals',async()=>{
 const f=fixture({guest:true}),s=f.make();await s.start();const key=s.key;s.destroy();const raw=JSON.stringify({schemaVersion:99,owner:'guest',state:{schema:99}});f.storage.setItem(key,raw);
 const unknown=f.make();await unknown.start();assert.equal(unknown.status,'schema-error');assert.equal(unknown.writable,false);assert.equal(f.storage.getItem(key),raw);assert(f.storage.writes.some(k=>k.includes('backup:invalid-schema')));
 f.storage.setItem(key,'{bad');const bad=f.make();await bad.start();assert.equal(bad.status,'schema-error');assert.equal(f.storage.getItem(key),'{bad');assert(f.storage.writes.some(k=>k.includes('backup:invalid-json')));
});
test('unknown remote v2 schema is not downgraded and storage failure blocks destructive resolution',async()=>{
 const f=fixture({remote:{revision:2,state:{rechtenV2:{schema:99}}}}),s=f.make();await s.start();assert.equal(s.status,'schema-error');assert.equal(s.writable,false);assert.equal(f.writes.length,0);
 const g=fixture(),r=g.make();await r.start();g.state.remote={revision:1,state:{rechtenV2:initial()}};await r.commit(progressState('local'));g.storage.fail=true;await r.resolveConflict('local');assert.equal(r.status,'storage-error');assert.equal(r.writable,false);assert.equal(g.state.remote.revision,1);
});
test('snapshot/export return independent copies and commit refuses a wrong schema',async()=>{
 const f=fixture({guest:true}),s=f.make();await s.start();const copy=s.snapshot();copy.missions.invented=true;assert(!s.snapshot().missions.invented);const exported=s.exportBackup();exported.record.state.missions.invented=true;assert(!s.snapshot().missions.invented);await assert.rejects(s.commit({...initial(),schema:2}),/schema/);
});
test('evidence deduplicates task/attempt and assisted or feedback-revealed work is never independent',()=>{
 const event={taskId:'t1',attemptId:'a1',skill:'sign',phase:'predict',correct:true,at:'2026-09-25'};let r=Evidence.record(initial(),event);assert(r.event.independent);assert.equal(r.event.mastery,false);assert.equal(r.state.events.length,1);r=Evidence.record(r.state,event);assert(r.duplicate);assert.equal(r.state.events.length,1);
 for(const extra of [{helpLevel:1},{supported:true},{feedbackSeen:true},{mode:'discover'},{errorKind:'interaction_error'},{errorKind:'authoring_error'}]){const x=Evidence.record(initial(),{...event,...extra,misconception:'sign.direction'});assert.equal(x.event.independent,false);assert.equal(x.event.mastery,false);if(extra.errorKind)assert.equal(x.event.misconception,null)}
 const different=Evidence.record(r.state,{...event,attemptId:'a2',phase:'transfer'});assert.equal(different.state.events.length,2);assert(!Object.hasOwn(different.state,'skills'));assert(!Object.hasOwn(different.state,'mastery'));
});
test('scheduler uses old planner on a clone, keeps 27 IDs including paused context and adds no mastery',()=>{
 assert.equal(Wave.order.length,26);assert.deepEqual(Wave.disabledSkills,['equation_from_context']);const skills=Object.fromEntries([...Wave.order,...Wave.disabledSkills].map(k=>[k,{intro:true,seen:8,strength:.8,recent:[true,true,true,true],lastSeen:0}]));
 const old={version:704,skills,review:[{id:'repair-sign',skill:'sign',kind:'repair',due:0,misses:2}],total:10,session:{answered:1},access:[...Wave.order],journey:{version:1,active:{id:'round',place:'bridge',mode:'discover',results:[]}}};const before=clone(old),rec=Scheduler.recommend(old);
 assert.equal(rec.skill,'sign');assert.equal(rec.mission,'grenspas');assert.equal(rec.kind,'repair');assert.equal(rec.scaffold,true);assert.deepEqual(old,before);assert.equal(Object.keys(old.skills).length,27);assert.equal(Scheduler.missionFor('equation_from_context'),null);assert.equal(Scheduler.recommend(null).source,'prototype');
});

test('assistance and a failed committed attempt contaminate later evidence for the same task',()=>{
 const event={taskId:'helped',attemptId:'first',skill:'slope_from_two_points',phase:'predict',correct:false};
 let state=Evidence.record(initial(),{...event,helpLevel:2}).state;
 let r=Evidence.record(state,{...event,attemptId:'second',phase:'execute',correct:true});assert.equal(r.event.independent,false);
 r=Evidence.record(r.state,{...event,taskId:'fresh-variant',attemptId:'fresh',correct:true});assert.equal(r.event.independent,true);
 state=Evidence.record(initial(),event).state;r=Evidence.record(state,{...event,attemptId:'retry',correct:true});assert.equal(r.event.independent,false);
});
test('legacy pre-wave guest state is snapshotted verbatim without version upgrade',async()=>{
 const f=fixture({guest:true}),raw=JSON.stringify({version:611,skills:{delta:{seen:5}},mystery:{preserve:true}});f.storage.setItem('axioma-trainer-rechten-v0611',raw);const s=f.make();await s.start();assert.equal(s.legacy.state.version,611);assert.deepEqual(s.legacy.state.mystery,{preserve:true});assert.equal(f.storage.getItem('axioma-trainer-rechten-v0611'),raw);
});
test('a forged migration marker cannot import another account snapshot',async()=>{
 const f=fixture({guest:true}),s=f.make();await s.start();const key=s.key;s.destroy();f.storage.setItem(key+':legacy-import',JSON.stringify({schemaVersion:1,owner:'student:other',backupKey:'foreign'}));f.storage.setItem('foreign',JSON.stringify({schemaVersion:1,owner:'student:other',state:{skills:{sign:{strength:1}}}}));const reload=f.make();await reload.start();assert.equal(reload.status,'schema-error');assert.equal(reload.legacy,null);assert.equal(reload.writable,false);
});
test('cloud fetch failure on first boot does not overwrite an unknown existing remote namespace',async()=>{
 const f=fixture({offline:true,remote:{revision:7,state:{foreign:'keep',rechtenV2:progressState('existing')}}}),s=f.make();await s.start();assert.equal(s.status,'offline');await s.commit(progressState('local'));assert.equal(s.snapshot().missions.grenspas.phase,'local');f.state.offline=false;await s.sync();assert.equal(s.status,'conflict');assert.equal(f.state.remote.state.rechtenV2.missions.grenspas.phase,'existing');assert.equal(f.writes.length,0);
});
test('cross-tab Web Locks serialize a simultaneous first migration and prevent lost local writes',async()=>{
 const queues=new Map(),locks={request(key,fn){const next=(queues.get(key)||Promise.resolve()).then(fn);queues.set(key,next.catch(()=>{}));return next}};
 const f=fixture({guest:true,locks});f.storage.setItem('axioma-trainer-rechten-v0700:wave4',JSON.stringify({version:704,skills:{sign:{seen:3}}}));const a=f.make(),b=f.make();await Promise.all([a.start(),b.start()]);
 assert.equal(f.storage.writes.filter(k=>k.includes(':legacy-backup:')).length,1);assert([a,b].some(s=>s.status==='conflict'));const live=[a,b].find(s=>s.writable);assert(live);await live.commit(progressState('first'));const stale=[a,b].find(s=>!s.writable);await stale.commit(progressState('stale'));assert.equal(JSON.parse(f.storage.getItem(live.key)).state.missions.grenspas.phase,'first');
});
test('restarting one adapter after an account switch clears the previous legacy snapshot and all prior UI state',async()=>{
 const f=fixture({legacy:{state:{skills:{sign:{strength:.9}}},revision:9}}),s=f.make();await s.start();await s.commit(progressState('a'));assert.equal(s.legacy.owner,'student:a');f.switch({id:'b',role:'student'});f.state.legacy=null;f.state.remote={revision:0,state:null};await s.start();assert.equal(s.account.id,'b');assert.equal(s.legacy,null);assert.deepEqual(s.snapshot(),initial());assert(s.key.endsWith('student:b'));assert.equal(s.status,'saved');
});
test('integration uses the unchanged AxiomaProgress load/save and only its account-bound generic RPC',async()=>{
 const vm=require('node:vm'),fs=require('node:fs'),calls=[];let row={game_id:'rechten-trainer',revision:3,state:{unknown:{preserve:1}},updated_at:'2026-09-25'};
 const account={id:'synthetic-integration',role:'student'},client={from(table){const filters={};const query={select(){return query},eq(key,value){filters[key]=value;return query},async maybeSingle(){calls.push({table,filters});return {data:table==='axioma_game_progress'?clone(row):null}}};return query},async rpc(name,args){calls.push({name,args:clone(args)});assert.equal(name,'axioma_save_game_progress_for_account');assert.equal(args.p_user_id,account.id);assert.equal(args.p_game_id,'rechten-trainer');assert.equal(args.p_revision,row.revision);row={...row,state:clone(args.p_state),revision:row.revision+1};return {data:{status:'saved',revision:row.revision,updated_at:'2026-09-25T12:00:00Z'}}}};
 const auth={ready:async()=>{},getAccount:async()=>account,onChange:()=>()=>{},client:()=>client},context={window:{AxiomaAuth:auth},Blob};vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../shared/axioma-progress.js'),'utf8'),context);
 const store=Storage.create({auth,progress:context.window.AxiomaProgress,storage:memory(),project:'https://synthetic.invalid',initial});await store.start();await store.commit(progressState('symbol'));assert.equal(store.status,'saved');assert.equal(row.revision,4);assert.deepEqual(row.state.unknown,{preserve:1});assert.equal(row.state.rechtenV2.missions.grenspas.phase,'symbol');assert.equal(calls.filter(c=>c.name).length,1);assert(calls.filter(c=>c.table).every(c=>c.filters.user_id===account.id));
});
test('stale local edit is durably backed up immediately, reopens as a conflict after reload and exports for recovery',async()=>{
 const f=fixture({guest:true}),a=f.make();await a.start();const b=f.make();await b.start();await b.commit(progressState('other-tab'));await a.commit(progressState('unsaved-local-intent'));assert.equal(a.status,'conflict');
 assert.equal(JSON.parse(f.storage.getItem(a.key)).state.missions.grenspas.phase,'other-tab');const backups=a.exportBackup().recoveryBackups;assert(backups.some(b=>b.value.state?.missions.grenspas?.phase==='unsaved-local-intent'));a.destroy();b.destroy();
 const reloaded=f.make();await reloaded.start();assert.equal(reloaded.status,'conflict');assert.equal(reloaded.writable,false);assert.equal(reloaded.snapshot().missions.grenspas.phase,'unsaved-local-intent');assert(reloaded.exportBackup().recoveryBackups.some(b=>b.value.state?.missions.grenspas?.phase==='unsaved-local-intent'));assert.equal(f.writes.length,0);
 await reloaded.resolveConflict('local');assert.equal(reloaded.status,'guest');assert.equal(reloaded.snapshot().missions.grenspas.phase,'unsaved-local-intent');reloaded.destroy();const final=f.make();await final.start();assert.equal(final.status,'guest');assert.equal(final.snapshot().missions.grenspas.phase,'unsaved-local-intent');assert(final.exportBackup().recoveryBackups.some(b=>b.value.state?.missions.grenspas?.phase==='unsaved-local-intent'));
});
test('pending conflict backups are scoped by account and choosing other version retains the old intent in export',async()=>{
 const f=fixture({guest:true}),a=f.make();await a.start();const b=f.make();await b.start();await b.commit(progressState('other'));await a.commit(progressState('local'));a.destroy();b.destroy();
 const learner=fixture({storage:f.storage}),student=learner.make();await student.start();assert.equal(student.status,'saved');assert.deepEqual(student.exportBackup().recoveryBackups,[]);
 const guest=f.make();await guest.start();assert.equal(guest.status,'conflict');await guest.resolveConflict('remote');assert.equal(guest.snapshot().missions.grenspas.phase,'other');assert(guest.exportBackup().recoveryBackups.some(v=>v.value.state?.missions.grenspas?.phase==='local'));guest.destroy();const next=f.make();await next.start();assert.equal(next.status,'guest');assert.equal(next.snapshot().missions.grenspas.phase,'other');
});
test('failed immediate conflict backup reports storage error without replacing the other tab record',async()=>{
 const f=fixture({guest:true}),a=f.make();await a.start();const b=f.make();await b.start();await b.commit(progressState('other'));const before=f.storage.getItem(a.key);f.storage.fail=true;await a.commit(progressState('local'));assert.equal(a.status,'storage-error');assert.equal(a.writable,false);assert.equal(f.storage.getItem(a.key),before);assert.equal(a.exportBackup().record.state.missions.grenspas.phase,'local');
});

test('zero is a valid evidence variant and is preserved verbatim',()=>{const r=Evidence.record(initial(),{taskId:'zero-variant',attemptId:'1',skill:'sign',phase:'predict',correct:true,variant:0});assert.equal(r.event.variant,0)});
