/* Isolated presentation adapter over AxiomaAuth/AxiomaProgress. No v1 writes. */
(function(root,factory){const api=factory(root);if(typeof module==='object')module.exports=api;else root.RechtenV2Storage=api})(globalThis,root=>{
'use strict';
const GAME='rechten-trainer',SCHEMA=1,LEGACY='axioma-trainer-rechten-v0700';
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const ownerOf=a=>a?a.role+':'+a.id:'guest';
const plain=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const validState=v=>plain(v)&&v.schema===SCHEMA&&Array.isArray(v.events)&&plain(v.missions)&&plain(v.settings)&&['world','mission','book','profile'].includes(v.screen);
const initialState=()=>({schema:SCHEMA,screen:'world',active:null,missions:{},events:[],settings:{reducedMotion:false}});
function create(options={}){
 const storage=options.storage||root.localStorage,auth=options.auth||root.AxiomaAuth,progress=options.progress||root.AxiomaProgress;
 const now=options.now||Date.now,project=options.project??root.AXIOMA_CONFIG?.url??'offline';
 const locks=options.locks??root.navigator?.locks;
 const initial=()=>clone(typeof options.initial==='function'?options.initial():options.initial||initialState());
 let account=null,key='',record=null,legacy=null,status='loading',active=false,epoch=0,serial=0,busy=null,conflict=null,remoteKnown=false,unsubscribe=null;
 let expectedStamp=null;
 const at=()=>new Date(now()).toISOString();
 const stamp=()=>String(now())+':'+(++serial)+':'+Math.random().toString(36).slice(2);
 const snapshot=()=>clone(status==='account-change'?initial():record?.state||initial());
 const emit=next=>{status=next;options.onChange?.({status,state:snapshot(),account:status==='account-change'?null:clone(account),legacyAvailable:status!=='account-change'&&!!legacy,writable:active&&!['conflict','account-change','storage-error','schema-error'].includes(status)})};
 const lock=fn=>locks?.request?locks.request(key,fn):Promise.resolve().then(fn);
 function fresh(){return {schemaVersion:SCHEMA,owner:ownerOf(account),revision:0,edit:0,dirty:false,stamp:null,state:initial(),envelope:{},updatedAt:null}}
 function validRecord(r){return plain(r)&&r.schemaVersion===SCHEMA&&r.owner===ownerOf(account)&&Number.isInteger(r.revision)&&r.revision>=0&&Number.isInteger(r.edit)&&validState(r.state)&&plain(r.envelope)}
 function readRaw(k){try{return storage.getItem(k)}catch(e){active=false;emit('storage-error');throw e}}
 function write(k,v){try{storage.setItem(k,JSON.stringify(v));return true}catch(_){active=false;emit('storage-error');return false}}
 function writeBackup(kind,value){const backupKey=key+':backup:'+kind+':'+stamp();return write(backupKey,{schemaVersion:SCHEMA,owner:ownerOf(account),at:at(),value:clone(value)})?backupKey:null}
 function backup(kind,value){return !!writeBackup(kind,value)}
 function pendingList(){
  const raw=readRaw(key+':pending-conflicts');if(!raw)return [];
  try{const list=JSON.parse(raw);if(list.schemaVersion!==SCHEMA||list.owner!==ownerOf(account)||!Array.isArray(list.entries)||list.entries.some(k=>typeof k!=='string'||!k.startsWith(key+':backup:local-pending:')))throw Error('Ongeldige conflictindex');return list.entries}
  catch(_){active=false;emit('schema-error');return null}
 }
 function writePending(entries){return write(key+':pending-conflicts',{schemaVersion:SCHEMA,owner:ownerOf(account),entries})}
 function cacheConflict(other){
  conflict={source:'local',local:clone(record),other:clone(other)};active=false;
  const backupKey=writeBackup('local-pending',record);if(!backupKey)return false;
  conflict.backupKey=backupKey;const pending=pendingList();if(!pending||!writePending([...pending,backupKey]))return false;
  emit('conflict');return false;
 }
 function restorePending(){
  const pending=pendingList();if(!pending)return true;if(!pending.length)return false;
  try{const backupKey=pending.at(-1),saved=JSON.parse(readRaw(backupKey));if(saved?.schemaVersion!==SCHEMA||saved.owner!==ownerOf(account)||!validRecord(saved.value))throw Error('Ongeldige herstelkopie');
   const other=clone(record);record=clone(saved.value);conflict={source:'local',local:clone(record),other,backupKey};active=false;emit('conflict');return true;
  }catch(_){active=false;if(status!=='storage-error')emit('schema-error');return true}
 }
 function recoveryBackups(){
  const keys=new Set();if(typeof storage.key==='function')for(let i=0;i<storage.length;i++)keys.add(storage.key(i));
  try{for(const k of JSON.parse(storage.getItem(key+':pending-conflicts')||'{}').entries||[])keys.add(k)}catch(_){}
  return [...keys].filter(k=>typeof k==='string'&&k.startsWith(key+':backup:')).flatMap(backupKey=>{try{const saved=JSON.parse(storage.getItem(backupKey));return saved?.owner===ownerOf(account)?[{backupKey,...saved}]:[]}catch(_){return []}});
 }
 function persist(force=false){
  const raw=readRaw(key);let other=null;try{other=raw?JSON.parse(raw):null}catch(_){return cacheConflict({corrupt:raw})}
  if(!force&&(other?.stamp??null)!==expectedStamp)return cacheConflict(other);
  record.stamp=stamp();if(!write(key,record))return false;expectedStamp=record.stamp;return true;
 }
 async function sameAccount(turn){
  if(turn!==epoch)return false;
  try{if(ownerOf(await auth?.getAccount?.())!==ownerOf(account))throw Error('Account gewijzigd');return turn===epoch}
  catch(_){active=false;epoch++;emit('account-change');return false}
 }
 async function readLegacy(turn){
  const marker=readRaw(key+':legacy-import');
  if(marker){try{const m=JSON.parse(marker);if(m.schemaVersion!==SCHEMA||m.owner!==ownerOf(account)||typeof m.backupKey!=='string'||!m.backupKey.startsWith(key+':legacy-backup:'))throw Error('Ongeldige import');const saved=JSON.parse(readRaw(m.backupKey));if(saved?.schemaVersion!==SCHEMA||saved.owner!==ownerOf(account)||!plain(saved.state?.skills))throw Error('Ongeldige backup');legacy=clone(saved);return}catch(_){active=false;if(status!=='storage-error')emit('schema-error');return}}
  let state=null,source=null,revision=null,candidate=null;
  const suffixes=[':wave4',':wave3',':wave2',':wave1',''];
  const prefix=account?LEGACY+':'+project+':'+account.id:LEGACY;
  const sources=suffixes.map(suffix=>prefix+suffix);
  if(!account)sources.push(...['v0611','v0610','v069','v068','v067','v066'].map(version=>'axioma-trainer-rechten-'+version));
  if(!account||account.role==='student')for(const sourceKey of sources){
   try{const value=JSON.parse(readRaw(sourceKey)||'null');if(value){candidate=account?value:{state:value};source=sourceKey;break}}catch(_){}
  }
  if(candidate?.state){state=candidate.state;revision=candidate.revision??null}
  if(account?.role==='student'&&auth?.client){
   try{const {data,error}=await auth.client().from('axioma_progress').select('state,revision,updated_at').eq('user_id',account.id).maybeSingle();
    if(!(await sameAccount(turn)))return;if(error)throw error;
    if(!candidate?.dirty&&data?.state){state=data.state;revision=data.revision;source='axioma_progress:'+account.id}
   }catch(_){/* Read-only import may use this owner's cached legacy snapshot. */}
  }
  if(turn!==epoch||!state||!plain(state)||!plain(state.skills))return;
  const imported={schemaVersion:SCHEMA,owner:ownerOf(account),importedAt:at(),source,revision,state:clone(state)};
  const backupKey=key+':legacy-backup:'+stamp();if(!write(backupKey,imported))return;
  if(!write(key+':legacy-import',{schemaVersion:SCHEMA,owner:ownerOf(account),backupKey,importedAt:imported.importedAt}))return;
  legacy=imported;
 }
 function remoteConflict(remote){conflict={source:'remote',local:clone(record),remote:clone(remote)};active=false;emit('conflict')}
 function acceptRemote(remote){
  if(!Number.isInteger(remote?.revision)||remote.revision<0||remote.state!=null&&!plain(remote.state))throw Error('Ongeldige cloudstate');
  const envelope=clone(remote.state||{}),view=envelope.rechtenV2;
  if(view!==undefined&&!validState(view)){active=false;emit('schema-error');return false}
  if(record.dirty&&record.revision!==remote.revision){remoteConflict(remote);return false}
  record.envelope=envelope;record.revision=remote.revision;record.updatedAt=remote.updatedAt||null;
  if(!record.dirty)record.state=view?clone(view):initial();remoteKnown=true;return true;
 }
 async function start(){
  const turn=++epoch;active=false;unsubscribe?.();unsubscribe=null;account=null;record=null;legacy=null;conflict=null;remoteKnown=false;expectedStamp=null;busy=null;emit('loading');
  try{
   await auth?.ready?.();account=clone(await auth?.getAccount?.())||null;
   if(account&&!['student','teacher'].includes(account.role))throw Error('Accountrol ontbreekt');
   key='axioma:rechten:v2:'+encodeURIComponent(project)+':'+ownerOf(account);record=fresh();
   const raw=readRaw(key);let cached;try{cached=raw?JSON.parse(raw):null}catch(_){cached=null;if(!backup('invalid-json',raw))return snapshot();emit('schema-error');return snapshot()}
   if(cached){if(!validRecord(cached)){if(!backup('invalid-schema',cached))return snapshot();emit('schema-error');return snapshot()}record=cached;expectedStamp=record.stamp??null}
   else expectedStamp=null;
   unsubscribe?.();unsubscribe=auth?.onChange?.(detail=>{if(detail.pending||ownerOf(detail.account)!==ownerOf(account)){active=false;epoch++;emit('account-change')}});
   if(await lock(()=>turn!==epoch||restorePending()))return snapshot();
   if(account?.role==='student'){
    try{const remote=await progress.load(GAME,account.id);if(!(await sameAccount(turn)))return snapshot();if(!acceptRemote(remote))return snapshot()}
    catch(_){if(turn!==epoch)return snapshot();remoteKnown=false;emit('offline')}
   }else remoteKnown=true;
   await lock(()=>readLegacy(turn));if(turn!==epoch||['storage-error','schema-error'].includes(status))return snapshot();
   if(!(await sameAccount(turn)))return snapshot();active=true;
   if(!(await lock(()=>persist())))return snapshot();
   emit(account?.role==='student'?(remoteKnown?(record.dirty?'pending':'saved'):'offline'):account?'teacher':'guest');
   return snapshot();
  }catch(_){active=false;if(!['storage-error','schema-error','account-change'].includes(status))emit('error');return snapshot()}
 }
 async function sync(){
  if(busy)return busy;
  if(!active||account?.role!=='student'||!record?.dirty)return snapshot();
  const turn=epoch;
  busy=(async()=>{
   try{
    if(!(await sameAccount(turn)))return;
    if(!remoteKnown){const remote=await progress.load(GAME,account.id);if(!(await sameAccount(turn))||!acceptRemote(remote))return}
    while(active&&record.dirty){
     const edit=record.edit,state={...clone(record.envelope),rechtenV2:snapshot()},revision=record.revision,id=account.id;
     emit('saving');const result=await progress.save(GAME,state,revision,id);
     if(!(await sameAccount(turn))||!active)return;
     if(result?.status==='conflict'){remoteConflict(result);return}
     if(!Number.isInteger(result?.revision)||result.revision<=revision)throw Error('Geen geldige opslagbevestiging');
     await lock(()=>{if(!active)return;record.revision=result.revision;record.envelope=state;record.updatedAt=result.updated_at||at();record.dirty=record.edit!==edit;if(persist())emit(record.dirty?'pending':'saved')});
    }
   }catch(_){if(turn===epoch&&active)emit('offline')}
   finally{if(turn===epoch)busy=null}
  })();await busy;return snapshot();
 }
 async function commit(state){
  if(!validState(state))throw Error('Ongeldig v2-schema.');
  if(!active)return snapshot();
  const next=clone(state);
  await lock(()=>{if(!active)return;record.state=next;record.edit++;record.dirty=true;if(persist())emit(account?.role==='student'?'pending':account?'teacher':'guest')});
  if(active)await sync();return snapshot();
 }
 async function resolveConflict(choice){
  if(!conflict||!['remote','local'].includes(choice))return snapshot();
  const turn=epoch,local=clone(conflict.local),pendingKey=conflict.backupKey;if(!(await sameAccount(turn)))return snapshot();
  if(!backup('conflict-local',local)||!backup('conflict-other',conflict))return snapshot();
  try{
   let remote=null,other=null;
   if(account?.role==='student'){remote=await progress.load(GAME,account.id);if(!(await sameAccount(turn)))return snapshot();if(remote.state?.rechtenV2!==undefined&&!validState(remote.state.rechtenV2)){emit('schema-error');return snapshot()}}
   const raw=readRaw(key);other=raw?JSON.parse(raw):null;
   if(choice==='remote'){
    if(conflict.source==='local'&&validRecord(other)){record=clone(other)}
    else if(remote){record={...fresh(),state:clone(remote.state?.rechtenV2||initial()),revision:remote.revision,envelope:clone(remote.state||{}),updatedAt:remote.updatedAt}}
    else {emit('schema-error');return snapshot()}
   }else {record=local;record.dirty=true;record.edit++;if(remote){record.revision=remote.revision;record.envelope=clone(remote.state||{});remoteKnown=true}}
   if(remote&&choice==='remote'&&conflict.source==='remote')remoteKnown=true;
   expectedStamp=other?.stamp??null;active=true;conflict=null;
   if(!(await lock(()=>{if(!persist())return false;if(pendingKey){const pending=pendingList();return !!pending&&writePending(pending.filter(k=>k!==pendingKey))}return true})))return snapshot();emit(account?.role==='student'?(record.dirty?'pending':'saved'):account?'teacher':'guest');
   if(record.dirty)await sync();return snapshot();
  }catch(_){active=false;emit('conflict');return snapshot()}
 }
 function exportBackup(){if(status==='account-change')return {schemaVersion:SCHEMA,exportedAt:at(),status:'account-change'};return clone({schemaVersion:SCHEMA,exportedAt:at(),owner:ownerOf(account),record,legacy,conflict,recoveryBackups:recoveryBackups()})}
 function destroy(){active=false;epoch++;unsubscribe?.();unsubscribe=null}
 return Object.freeze({start,snapshot,commit,sync,resolveConflict,exportBackup,destroy,
  get status(){return status},get writable(){return active},get account(){return status==='account-change'?null:clone(account)},get legacy(){return status==='account-change'?null:clone(legacy)},get key(){return key}});
}
return Object.freeze({create,validState});
});
