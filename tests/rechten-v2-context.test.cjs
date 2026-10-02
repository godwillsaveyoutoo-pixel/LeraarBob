'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const X=require('../games/rechten/rechtenwereld/context-core.js'),R=require('../games/rechten/rechtenwereld/mission-runtime.js'),A=require('../games/rechten/rechtenwereld/content/area-maps.js'),V=require('../games/rechten/rechtenwereld/components/context-view.js'),XP=require('../games/rechten/rechtenwereld/xp.js');
const put=(s,v)=>Object.entries(v).reduce((s,[k,v])=>R.edit(s,k,String(v)),s);
function solution(m){const t=m.task,total=x=>t.perUnit*x+t.gateFee;return {'context-start':{openingCost:t.gateFee},'context-add':{onePrice:total(1)},'context-table':{twoPrice:total(2),threePrice:total(3)},'context-rule':{perUnit:t.perUnit,gateFee:t.gateFee},'context-plot':{plotY1:total(1),plotY2:total(3)},'context-check':{caravanTotal:total(t.groupSize)}}[m.phase]}
function finish(s){while(!R.active(s).completed){s=R.commit(put(s,solution(R.active(s))));assert(R.active(s).feedback.result.ok,JSON.stringify(R.active(s).feedback));s=XP.update(R.advance(s))}return s}
test('three toll caravans finish, survive reload and award XP once without changing other work',()=>{
 let s=R.edit(R.start(R.initial(),'point_plot'),'point',{x:1,y:2}),old=structuredClone(s.missions.point_plot);
 for(let run=1;run<=3;run++){
  s=R.start(s,'equation_from_context',true);assert.equal(R.active(s).run,run);s=finish(s);
  assert.equal(R.active(s).completion.length,1);assert.equal(A.statuses(s,'formulewerf').nodes.at(-1).state,'completed');
  assert.deepEqual(JSON.parse(JSON.stringify(s)),s);assert.deepEqual(s.missions.point_plot,old);assert.equal(s.platformXp,10);
  assert(V.render(R.active(s),'').includes('De tol is berekend.'));
 }
 assert.equal(s.events.length,18);assert(s.events.every(e=>e.mastery===false));assert.equal(s.events.filter(e=>e.skill==='graph_from_equation').length,3);
 s=R.start(s,'equation_from_context',true);assert.equal(A.statuses(s,'formulewerf').nodes.at(-1).state,'completed');
});
test('the small-number sequence distinguishes one gate opening, extra carts and rule parameters',()=>{
 const t=X.makeTask('equation_from_context');
 assert.deepEqual([X.total(t,0),X.total(t,1),X.total(t,2),X.total(t,3),X.total(t,4)],[2,5,8,11,14]);
 assert.equal(X.check(t,{},'context-start').kind,'interaction_error');
 assert.equal(X.check(t,{openingCost:'1.5'},'context-start').kind,'interaction_error');
 assert.equal(X.check(t,{openingCost:'-3'},'context-start').kind,'interaction_error');
 assert(X.check(t,{openingCost:'4/2'},'context-start').ok);
 assert(!X.check(t,{onePrice:'3'},'context-add').ok,'the gate opening still counts');
 assert(!X.check(t,{twoPrice:'10',threePrice:'15'},'context-table').ok,'the gate opens once');
 assert(!X.check(t,{perUnit:'2',gateFee:'3'},'context-rule').ok);
 assert(X.check(t,{caravanTotal:'14'},'context-check').ok);
});
test('partial table and rule answers are kept and repair focuses the remaining field',()=>{
 let s=R.start(R.initial(),'equation_from_context');
 for(let i=0;i<2;i++)s=R.advance(R.commit(put(s,solution(R.active(s)))));
 s=R.advance(R.commit(put(s,{twoPrice:'8',threePrice:'12'})));
 assert(R.active(s).locks.twoPrice);assert.equal(R.active(s).values.contextField,'threePrice');
 assert.deepEqual(R.edit(s,'twoPrice','99'),s);assert.equal(X.enter(R.active(s),'back').field,'threePrice');
 s=R.advance(R.commit(put(s,{threePrice:'11'})));
 while(R.active(s).phase!=='context-rule')s=R.advance(R.commit(put(s,solution(R.active(s)))));
 s=R.advance(R.commit(put(s,{perUnit:'3',gateFee:'4'})));
 assert(R.active(s).locks.perUnit);assert.equal(R.active(s).values.contextField,'gateFee');
 assert.notEqual(A.statuses(s,'formulewerf').nodes.at(-1).state,'completed');
});
test('graph points come from the table, after the caravan toll has been calculated',()=>{
 const t=X.makeTask('equation_from_context');
 assert(X.check(t,{plotY1:'5',plotY2:'11'},'context-plot').ok);
 assert(!X.check(t,{plotY1:'11',plotY2:'5'},'context-plot').ok);
 let s=R.start(R.initial(),'equation_from_context');
 while(R.active(s).phase!=='context-check')s=R.advance(R.commit(put(s,solution(R.active(s)))));
 assert(!R.active(s).completed);assert.notEqual(A.statuses(s,'formulewerf').nodes.at(-1).state,'completed');
 assert(!X.check(t,{caravanTotal:'8'},'context-check').ok);
 s=R.advance(R.commit(put(s,solution(R.active(s)))));
 assert.equal(R.active(s).phase,'context-rule');assert(!R.active(s).completed);
 assert.equal(XP.update(s).platformXp,0);assert.notEqual(A.statuses(s,'formulewerf').nodes.at(-1).state,'completed');
 s=R.advance(R.commit(put(s,solution(R.active(s)))));assert.equal(R.active(s).phase,'context-plot');
});
test('the toll for the entire caravan is required, and incomplete payment input is not a calculation error',()=>{
 for(let run=1;run<=3;run++){
  const t=X.makeTask('equation_from_context',0,run),price=X.total(t,t.groupSize);
  assert(X.check(t,{caravanTotal:String(price)},'context-check').ok);
  assert(!X.check(t,{caravanTotal:String(price+1)},'context-check').ok);
  assert(!X.check(t,{caravanTotal:String(t.perUnit*t.groupSize)},'context-check').ok,'opening the gate is part of the toll');
  assert(!X.check(t,{caravanTotal:String((t.perUnit+t.gateFee)*t.groupSize)},'context-check').ok,'opening the gate is charged once');
  assert.equal(X.check(t,{},'context-check').kind,'interaction_error');
 }
 let s=R.start(R.initial(),'equation_from_context');
 while(R.active(s).phase!=='context-check')s=R.advance(R.commit(put(s,solution(R.active(s)))));
 const errors=R.active(s).errors;s=R.commit(s);assert.equal(R.active(s).errors,errors);s=R.advance(s);
 s=R.advance(R.commit(put(s,{caravanTotal:12})));assert.equal(R.active(s).errors,1);assert(!R.active(s).completed);
 s=R.edit(s,'caravanTotal','14');const saved=JSON.parse(JSON.stringify(s));assert.deepEqual(R.start(saved,'equation_from_context'),s);
 s=R.advance(R.commit(s));assert.equal(R.active(s).phase,'context-rule');assert(!R.active(s).completed);
 assert(R.active(finish(s)).completed);
});
test('pictures and everyday words precede symbolic notation; input never submits an answer',()=>{
 const m=R.active(R.start(R.initial(),'equation_from_context')),html=V.render(m,'');
 assert(html.includes('4 karren'));assert(html.includes('Signaalstad'));assert(html.includes('toll-gate'));assert(html.includes('Poort openen'));assert(html.includes('Per kar'));assert(!html.includes('€'));assert(!html.includes('Budget:'));
 assert(!html.includes('y ='));assert(!html.includes('B − A'));assert(!html.includes('<dialog'));
 assert.deepEqual(X.enter(m,'3'),{field:'openingCost',value:'3'});assert.equal(m.feedback,null);assert.deepEqual(m.values,{});
});
test('hints, undo and resume keep the work; supported completion has the existing 5 XP reward',()=>{
 let s=R.start(R.initial(),'equation_from_context');s=R.hint(R.hint(s));
 assert.notEqual(X.hint('context-start',1),X.hint('context-start',2));
 s=R.edit(s,'openingCost','4');s=R.undo(s);assert.equal(R.active(s).values.openingCost,undefined);
 const saved=JSON.parse(JSON.stringify(s));assert.deepEqual(R.start(saved,'equation_from_context'),s);
 s=R.advance(R.commit(put(s,{openingCost:2})));s=R.hint(s);
 assert.equal(R.active(s).contextHints['context-add'],1);s=finish(s);assert.equal(s.platformXp,5);
});
test('the former score investigation is backed up exactly; migration and later reload are idempotent',()=>{
 const s=R.start(R.initial(),'equation_from_context'),key=s.active;
 const old={...s.missions[key],run:1,phase:'context-switch',task:{id:'rechten-v2:formulewerf:equation_from_context:1:0',models:{A:{a:2,b:10}}},values:{firstWin:'4',previousGap:'-1'},completion:[{taskId:'rechten-v2:formulewerf:equation_from_context:1:0',supported:false}]};
 s.missions[key]=old;s.platformXp=10;s.events=[{skill:key,correct:true,taskId:old.task.id+':run1',attemptId:'context-fair:8'}];
 const next=R.upgradeContext(s);assert.deepEqual(next.contextArchive.scoreInvestigation,old);assert.deepEqual(s.missions[key],old);
 assert.equal(R.active(next).task.scenario,'world-toll');assert.equal(R.active(next).phase,'context-start');assert.equal(R.active(next).completion,null);
 assert.deepEqual(R.upgradeContext(next),next);assert.equal(XP.update(next).platformXp,10);
 assert.equal(A.statuses(next,'formulewerf').nodes.at(-1).state,'completed');
 assert.deepEqual(R.start(next,key,true).contextArchive,next.contextArchive);
 const onlyCompletion=structuredClone(s);onlyCompletion.events=[];onlyCompletion.platformXp=0;onlyCompletion.missions[key].completed=true;
 const archived=R.upgradeContext(onlyCompletion);assert.equal(XP.update(archived).platformXp,10);assert.equal(A.statuses(archived,'formulewerf').nodes.at(-1).state,'completed');
 assert.equal(XP.update(XP.update(archived)).platformXp,10);
});
test('another situation change keeps both previous backups and all earned completion',()=>{
 const s=finish(R.start(R.initial(),'equation_from_context')),key=s.active;
 const current=structuredClone(s.missions[key]);current.task.scenario='sticker-kraam';current.values={freeCount:'3',oneTotal:'5',twoTotal:'7',threeTotal:'9',fourTotal:'11'};
 s.missions[key]=current;
 const older={...structuredClone(current),task:{...current.task,scenario:'previous-score-situation'},values:{answer:'preserved'}};
 s.contextArchive={scoreInvestigation:older};
 const upgraded=R.upgradeContext(s);
 assert.deepEqual(upgraded.contextArchive.scoreInvestigation,older);
 assert.deepEqual(upgraded.contextArchive['sticker-kraam'],current);
 assert.equal(XP.update(upgraded).platformXp,10);
 const noEvents={...upgraded,events:[]};assert.equal(A.statuses(noEvents,'formulewerf').nodes.at(-1).state,'completed');
 assert.deepEqual(R.upgradeContext(upgraded),upgraded);
});
test('a partial taxi exercise is archived alongside older scenarios without overwriting a previous taxi backup',()=>{
 const s=R.start(R.initial(),'equation_from_context'),key=s.active;
 const old={...structuredClone(s.missions[key]),run:4,phase:'context-table',task:{id:'rechten-v2:formulewerf:equation_from_context:4:0',scenario:'taxi-ride',perUnit:2,startPrice:3,distance:4,budget:10},values:{startingFare:'3',onePrice:'5',twoPrice:'7',threePrice:'10'},locks:{startingFare:true,onePrice:true},hints:1};
 const earlier={...structuredClone(old),run:1,values:{startingFare:'3'}};
 s.missions[key]=old;s.contextArchive={'taxi-ride':earlier,scoreInvestigation:{skill:key,completed:false,values:{firstWin:'4'}}};
 const before=structuredClone(s),next=R.upgradeContext(s),backups=Object.values(next.contextArchive);
 assert.deepEqual(s,before);assert.deepEqual(next.contextArchive['taxi-ride'],earlier);
 assert(backups.some(m=>JSON.stringify(m)===JSON.stringify(old)));
 assert.deepEqual(next.contextArchive.scoreInvestigation,s.contextArchive.scoreInvestigation);
 assert.equal(R.active(next).task.scenario,'world-toll');assert.equal(R.active(next).phase,'context-start');
 assert.equal(R.active(next).run,5);assert.equal(R.active(next).completed,false);
 assert.equal(XP.update(next).platformXp,0);assert.notEqual(A.statuses(next,'formulewerf').nodes.at(-1).state,'completed');
 assert.deepEqual(R.upgradeContext(next),next);
});
test('the toll gate leads to Signaalstad after all Formulewerf work is complete, without bypassing the existing route',()=>{
 const {fill}=require('./helpers/rechten-question-fixtures.cjs');let s=R.initial();
 for(const node of A.all(A.get('formulewerf')).filter(n=>n.id!=='equation_from_context')){
  s=R.start(s,node.id);while(!R.active(s).completed)s=R.advance(R.commit(fill(s)));
 }
 assert.equal(A.unlocked(s,'signaalstad'),false);
 s=R.start(s,'equation_from_context');
 while(R.active(s).phase!=='context-plot')s=R.advance(R.commit(put(s,solution(R.active(s)))));
 assert.equal(A.unlocked(s,'signaalstad'),false,'the caravan total and price rule are intermediate work');
 s=finish(s);assert.equal(A.unlocked(s,'signaalstad'),true);
 const m=R.active(s),html=V.render(m,'',{nextWorldUnlocked:A.unlocked(s,'signaalstad')});
 assert(html.includes('De poort gaat open.'));assert(html.includes('data-area="signaalstad"'));
 const onlyToll=finish(R.start(R.initial(),'equation_from_context'));
 assert.equal(A.unlocked(onlyToll,'signaalstad'),false);
 const lockedHtml=V.render(R.active(onlyToll),'',{nextWorldUnlocked:false});
 assert(!lockedHtml.includes('De poort gaat open.'));assert(!lockedHtml.includes('data-area="signaalstad"'));
 assert(lockedHtml.includes('Rond de andere haltes in Formulewerf af'));
});
test('the previous film booking is preserved exactly when the toll gate replaces it',()=>{
 const s=R.start(R.initial(),'equation_from_context'),key=s.active;
 const old={...structuredClone(s.missions[key]),phase:'context-rule',task:{id:'rechten-v2:formulewerf:equation_from_context:1:0',scenario:'cinema-booking',perUnit:3,bookingFee:2,groupSize:4,budget:13},values:{reservationFee:'2',onePrice:'5',twoPrice:'8',threePrice:'11',groupPrice:'14',canPay:'no'},hints:1};
 s.missions[key]=old;const next=R.upgradeContext(s);
 assert.deepEqual(next.contextArchive['cinema-booking'],old);assert.deepEqual(s.missions[key],old);
 assert.equal(R.active(next).task.scenario,'world-toll');assert.deepEqual(R.active(next).values,{});
 assert.deepEqual(R.upgradeContext(next),next);
});
module.exports={solution,finish};
