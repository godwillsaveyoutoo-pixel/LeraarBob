const {test}=require('node:test'),assert=require('node:assert/strict');
const {createDB}=require('./helpers/rechten-progress-db.cjs');
const R=require('../games/rechten/rechtenwereld/mission-runtime.js');
const XP=require('../games/rechten/rechtenwereld/xp.js');
const Storage=require('../games/rechten/rechtenwereld/storage.js');
const fs=require('node:fs'),vm=require('node:vm');
const world=()=>XP.update({...R.initial(),missions:{delta:{completion:[{taskId:'rechten-v2:hellingrug:delta:1:1',supported:false}]}}});
test('Rechtenwereld sync uses the real RPC, preserves legacy XP, enforces ownership and revisions',async()=>{
 const {db,ids,save,as}=await createDB();
 try{
  await db.query('insert into public.axioma_progress values($1,$2,4,now())',[ids.alex,JSON.stringify({xp:90,skills:{legacy:true}})]);
  const state={foreign:{preserve:true},rechtenV2:world()};
  const first=await save('alex',state);assert.equal(first.status,'saved');assert.equal(first.revision,1);assert.equal(first.trust_level,'client_reported');
  const conflict=await save('alex',{rechtenV2:R.initial()});assert.equal(conflict.status,'conflict');assert.deepEqual(conflict.state,state);
  assert.equal((await save('alex',state,1)).revision,2);
  assert.equal((await as('sam','select * from public.axioma_game_progress')).length,0);
  await assert.rejects(save('sam',state,2,'rechten-trainer',ids.alex),/Account|account/);
  await assert.rejects(save('teacher',state),/Leerlingaccount/);
  await assert.rejects(as(null,"select public.axioma_save_game_progress_for_account('rechten-trainer','{}',0,null)",[],'anon'),/permission denied/);
  assert.equal((await save('alex',{completed:['a']},0,'vectoren-trainer')).status,'saved');
  for(const id of ['other-trainer','untracked','inactive','unknown'])await assert.rejects(save('alex',state,0,id));
  for(const bad of [{},{xp:90,skills:{}},{rechtenV2:null},{rechtenV2:{}},{rechtenV2:{...world(),schema:2}},{rechtenV2:{...world(),events:{}}},{rechtenV2:{...world(),screen:'invalid'}}])await assert.rejects(save('alex',bad,2),/Rechtenwereld/);
  await assert.rejects(save('alex',state,-1),/Ongeldige voortgang/);
  await assert.rejects(save('alex',{...state,oversized:'x'.repeat(262144)},2),/Ongeldige voortgang/);
  assert.equal((await as('alex','select state from public.axioma_progress'))[0].state.xp,90);
  assert.deepEqual((await as('alex',"select state from public.axioma_game_progress where game_id='rechten-trainer'"))[0].state,state);
 }finally{await db.close()}
});
test('previously refused XP survives local reload and reaches the actual central overview through the RPC',async()=>{
 const {db,ids,save,as}=await createDB();let offline=true;
 const client={from(table){const filters={};let single=false;const q={select(){return q},eq(k,v){filters[k]=v;return q},maybeSingle(){single=true;return q},then(resolve,reject){const columns=Object.keys(filters);as('alex',`select * from public.${table} where ${columns.map((k,i)=>k+'=$'+(i+1)).join(' and ')}`,Object.values(filters)).then(rows=>resolve({data:single?rows[0]||null:rows}),reject)}};return q},async rpc(name,p){if(offline)return {error:Error('Dit spel gebruikt geen generieke voortgangsopslag.')};try{return {data:await save('alex',p.p_state,p.p_revision,p.p_game_id,p.p_user_id)}}catch(error){return {error}}}};
 const auth={ready:async()=>{},getAccount:async()=>({id:ids.alex,role:'student'}),onChange:()=>()=>{},client:()=>client};
 const context={window:{AxiomaAuth:auth},Blob};vm.runInNewContext(fs.readFileSync('shared/axioma-progress.js','utf8'),context);vm.runInNewContext(fs.readFileSync('js/catalog-progress.js','utf8'),context);
 const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
 const make=()=>Storage.create({storage,auth,progress:context.window.AxiomaProgress,initial:R.initial,project:'test'});
 try{
  const old=make();await old.start();await old.commit(world());assert.equal(old.status,'offline');old.destroy();
  offline=false;const reopened=make();await reopened.start();assert.equal(reopened.snapshot().platformXp,10);await reopened.sync();assert.equal(reopened.status,'saved');assert.equal(JSON.parse(storage.getItem(reopened.key)).dirty,false);reopened.destroy();
  const overview=await context.window.AxiomaProgress.loadOverview();
  const catalog=JSON.parse(fs.readFileSync('games.json')),total=context.window.LeraarBobCatalogProgress.aggregate(catalog,overview);
  assert.equal(total.xp,10);assert.notEqual(total.entries.find(g=>g.id==='rechtenwereld').label,'Nog niet gestart');
  const again=make();await again.start();await again.commit(XP.update(again.snapshot()));assert.equal(again.snapshot().platformXp,10);again.destroy();
 }finally{await db.close()}
});
