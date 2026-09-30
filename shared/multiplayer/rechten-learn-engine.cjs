/* Trusted cooperative session engine. Mathematics stays in the native game validator. */
const Game=require('../../games/rechten/rechtenwereld/learn-config.js');
const policy={grade:(spec,answer)=>Game.validate(Game.generate(spec),answer).ok===true};
const skills=Object.freeze(Game.skills.map(s=>s.id));
const copy=v=>JSON.parse(JSON.stringify(v));
const live=r=>r.members.filter(m=>!(r.data.left||[]).includes(m.id));
const builder=r=>{const people=live(r);return people[r.data.round%people.length]?.id;};
const spec=(r,user)=>({skill:r.data.skill,seed:(r.data.seed+r.data.round*104729+(user?1+r.members.findIndex(m=>m.id===user):0)*7919)>>>0,variant:r.data.round%(r.data.sequence===2?6:4)});
const answer=a=>{if(!a||typeof a!=='object'||Array.isArray(a)||JSON.stringify(a).length>16000||!Array.isArray(a.steps)||a.steps.length>8)throw Error('Ongeldig voorstel.');return copy(a);};
function settleMembers(r){const s=r.data,people=live(r);if(people.length<2&&!['lobby','finished'].includes(s.phase)){s.phase='paused';return;}if(s.phase==='idea'&&people.every(m=>s.ideas?.[m.id])){s.phase='build';s.draft=s.ideas[builder(r)].answer;}if(s.phase==='individual'&&people.every(m=>s.checks?.[m.id]))s.phase='finished';}
function change(raw,uid,action,input={}){
 const r=copy(raw),s=r.data,people=live(r),mine=people.some(m=>m.id===uid);if(!mine)throw Error('Je neemt niet meer deel. Je kunt alleen verder leren.');
 const own=builder(r)===uid;
 if(action==='leave'){
  s.left=[...(s.left||[]),uid];s.approvals=[];s.revision++;
  settleMembers(r);
  return s;
 }
 if(action==='start'){
  if(s.phase!=='lobby'||people[0]?.id!==uid||people.length<2)throw Error('Wacht tot jullie met twee of drie zijn.');
  if(people.some(m=>Date.parse(r.now)-Date.parse(m.seen_at)>20000))throw Error('Wacht tot je partners weer online zijn, of ga alleen verder.');
  s.phase='idea';s.ideas={};return s;
 }
 if(action==='continue-duo'){
  const absent=people.filter(m=>Date.parse(r.now)-Date.parse(m.seen_at)>20000);
  if(people.length!==3||absent.length!==1||absent[0].id===uid)throw Error('Wacht even op je partner, of ga alleen verder.');
  s.continueVotes=[...new Set([...(s.continueVotes||[]),uid])];
  if(people.filter(m=>m.id!==absent[0].id).every(m=>s.continueVotes.includes(m.id))){s.left=[...(s.left||[]),absent[0].id];s.approvals=[];s.continueVotes=[];s.revision++;settleMembers(r);}
  return s;
 }
 if(action==='idea'){
  if(s.phase!=='idea')throw Error('De eigen denkstap is voorbij.');
  if(!s.ideas[uid])s.ideas[uid]={answer:answer(input.answer),skipped:!!input.skipped};
  if(people.every(m=>s.ideas[m.id])){s.phase='build';s.draft=s.ideas[builder(r)].answer;s.approvals=[];s.revision++;}return s;
 }
 if(action==='draft'){
  if(s.phase!=='build'||!own)throw Error('Je partner bouwt nu.');
  if(input.revision!==s.revision)throw Error('Het bord is gewijzigd. Bekijk het nieuwste voorstel.');
  const next=answer(input.answer);if(JSON.stringify(next)!==JSON.stringify(s.draft)){s.draft=next;s.approvals=[];s.revision++;}return s;
 }
 if(action==='approve'){
  if(s.phase!=='build'||!s.draft?.steps?.length||input.revision!==s.revision)throw Error('Bekijk eerst het nieuwste voorstel.');
  s.approvals=[...new Set([...s.approvals,uid])];return s;
 }
 if(action==='check'){
  if(s.phase!=='build'||!own||input.revision!==s.revision||!people.every(m=>s.approvals.includes(m.id)))throw Error('Iedereen moet dit voorstel eerst goedkeuren.');
  const checked=Game.validate(Game.generate(spec(r)),s.draft);s.correct=checked.ok;s.feedback=checked.ok?null:{step:checked.step||null,message:checked.message||'Vul alle stappen in en bespreek jullie voorstel.'};s.phase='result';return s;
 }
 if(action==='retry'){
  if(s.phase!=='result'||!own||s.correct)throw Error('Herwerken kan nu niet.');s.phase='build';s.approvals=[];s.revision++;return s;
 }
 if(action==='next'){
  if(s.phase!=='result'||!own||!s.correct)throw Error('Rond eerst de opgave samen af.');
  s.round++;s.revision++;s.ideas={};s.approvals=[];s.draft={steps:[]};s.correct=null;s.phase=s.round>=6?'individual':'idea';return s;
 }
 if(action==='individual'){
  if(!['individual','finished'].includes(s.phase))throw Error('De eigen eindcheck is nog niet begonnen.');
  s.checks||={};if(!s.checks[uid])s.checks[uid]={correct:policy.grade(spec(r,uid),answer(input.answer)),answer:answer(input.answer)};
  if(people.every(m=>s.checks[m.id]))s.phase='finished';return s;
 }
 throw Error('Onbekende leeractie.');
}
function project(r,uid){
 const s=r.data,people=live(r),participating=people.some(m=>m.id===uid),myIdea=s.ideas?.[uid];
 return {id:r.id,code:r.code,capacity:r.capacity||Math.max(2,people.length),peers:r.peers||[],invitees:r.invitees||[],version:r.version,phase:s.phase,round:s.round,skill:s.skill,revision:s.revision,builder:builder(r),host:people[0]?.id,participating,
  members:people.map(m=>({id:m.id,alias:m.alias,online:Date.parse(r.now)-Date.parse(m.seen_at)<20000,idea:!!s.ideas?.[m.id],approved:!!s.approvals?.includes(m.id),checked:!!s.checks?.[m.id]})),
  task:participating?spec(r,s.phase==='individual'||s.phase==='finished'?uid:null):null,
  draft:participating&&['build','result'].includes(s.phase)?s.draft:null,
  ideas:participating&&['build','result'].includes(s.phase)?people.map(m=>({alias:m.alias,...s.ideas?.[m.id]})):null,
  mine:participating?{idea:!!myIdea,answer:s.phase==='idea'?myIdea?.answer:null,check:s.checks?.[uid]||null}:null,
  correct:s.phase==='result'?s.correct:null,feedback:s.phase==='result'?s.feedback||null:null,continueVotes:s.continueVotes||[],server_time:r.now};
}
module.exports={skills,change,project,spec,builder};
