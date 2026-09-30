const {test}=require('node:test'),assert=require('node:assert/strict');
const XP=require('../games/rechten/rechtenwereld/xp.js');
const base=()=>({missions:{},events:[],platformXp:0});
const done=(run=1,supported=false)=>({taskId:`rechten-v2:hellingrug:delta:${run}:2`,supported});
test('only a full task earns XP; supported tasks can improve once, replays cannot farm',()=>{
 let s=base();s.missions.delta={task:{id:done().taskId,mode:'practice'},feedback:{result:{ok:true},next:'hill-dy'},errors:0,hints:0};
 s=XP.update(s);assert.equal(s.platformXp,0);
 s.missions.delta.feedback.next='next-task';s=XP.update(s);assert.equal(s.platformXp,10);
 s.missions.delta={completion:[done()]};assert.equal(XP.update(s).platformXp,10);
 s.missions.delta={completion:[done(2)]};assert.equal(XP.update(s).platformXp,10);
 s=base();s.missions.delta={completion:[done(1,true)]};s=XP.update(s);assert.equal(s.platformXp,5);
 s.missions.delta={completion:[done(2)]};s=XP.update(s);assert.equal(s.platformXp,10);assert.equal(XP.update(JSON.parse(JSON.stringify(s))).platformXp,10);
});
test('migration preserves old XP without paying for old tasks again',()=>{
 let s=base();s.platformXp=80;s.events=[{taskId:done().taskId+':run1',correct:true,independent:true}];s.missions.delta={completion:[done()]};
 s=XP.update(s);assert.equal(s.platformXp,80);
 s.missions.delta.completion.push({taskId:'rechten-v2:hellingrug:delta:1:3',supported:false});assert.equal(XP.update(s).platformXp,90);
});
test('update does not mutate storage input, missing support data is conservative',()=>{
 const s=base();s.missions.delta={completion:[{taskId:done().taskId}]};const before=JSON.stringify(s);assert.equal(XP.update(s).platformXp,5);assert.equal(JSON.stringify(s),before);
});
