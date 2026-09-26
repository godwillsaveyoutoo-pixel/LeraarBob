'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const F=require('../games/rechten/trainer-v2/formula-core.js'),R=require('../games/rechten/trainer-v2/mission-runtime.js'),W=require('../games/rechten/trainer/wave-core.js'),A=require('../games/rechten/trainer-v2/content/area-maps.js'),V=require('../games/rechten/trainer-v2/components/formula-view.js'),S=require('../games/rechten/trainer-v2/components/shell-view.js');
const built=t=>({factor:W.text(t.model.a),variable:'x',operator:t.model.b.n<0?'−':'+',constant:W.text(W.mul(t.model.b.n<0?-1:1,t.model.b))});
function solve(s,reverse=false){const m=R.active(s),t=m.task;
 if(m.phase==='formula-build')for(const [k,v]of Object.entries(built(t)))s=R.putFormulaToken(s,k,v);
 if(m.phase==='formula-read')for(const k of ['a','b'])s=R.edit(s,k,W.text(t.model[k]));
 if(m.phase==='formula-plot'){s=R.placeLinePoint(s,'A',{x:0,y:W.num(t.model.b)});const x=W.num(t.model.b)>3?-1:1;s=R.placeLinePoint(s,'B',{x,y:W.num(W.add(W.mul(t.model.a,x),t.model.b))})}
 if(m.phase==='formula-rewrite'){if(reverse)s=R.operateFormula(s,4);let e=F.currentEquation(t,R.active(s).values);if(e.left.x.n)s=R.operateFormula(s,e.left.x.n<0?0:1);e=F.currentEquation(t,R.active(s).values);if(!W.eq(e.left.y,1))s=R.operateFormula(s,4)}
 s=R.commit(s);assert(R.active(s).feedback.result.ok,JSON.stringify(R.active(s).feedback));return R.advance(s)
}
test('four exact six-task sequences support negative, fractional and zero coefficients, equivalent inputs and changed replay',()=>{
 for(const skill of F.skills)for(let run=1;run<=4;run++){let s=R.start(R.initial(),skill);s.missions[skill].run=run;s.missions[skill].task=F.makeTask(skill,0,run);const slopes=[];
 for(let i=0;i<F.count;i++){const m=R.active(s);slopes.push(m.task.model.a);assert.equal(m.task.index,i);assert.equal(F.check(m.task,{},m.phase).kind,'interaction_error');if(skill==='equation_from_ab')for(const token of Object.values(built(m.task)))assert(m.task.tokens.includes(token));s=solve(s,run%2===0)}assert(R.active(s).completed);assert(slopes.some(q=>q.n<0));assert(slopes.some(q=>!q.n));assert(slopes.some(q=>q.d>1));assert.equal(s.events.length,6);assert(s.events.every(e=>e.correct&&e.mastery===false));
 }
});
test('construction repairs retain correct coefficients and reusable tiles without locking the wrong sign',()=>{
 let s=R.start(R.initial(),'equation_from_ab');for(const [k,v]of Object.entries({...built(R.active(s).task),operator:'−'}))s=R.putFormulaToken(s,k,v);s=R.advance(R.commit(s));assert.deepEqual(R.active(s).locks,{factor:true,variable:true});assert.equal(R.active(s).values.formulaSlot,'operator');s=R.putFormulaToken(s,'factor','0');assert.equal(R.active(s).values.factor,'2');s=R.putFormulaToken(s,'operator','+');s=R.undo(s);assert.equal(R.active(s).values.factor,'2');assert.equal(R.active(s).values.operator,'−');s=R.putFormulaToken(s,'operator','+');assert(R.active(R.commit(s)).feedback.result.ok);
 const t=F.makeTask('equation_from_ab',2);assert(F.check(t,{factor:'2/2',variable:'x',operator:'+',constant:'-2'},'formula-build').ok);
});
test('drawing accepts any two distinct on-line points, rejects coincident/vertical/wrong/grid-invalid pairs and preserves valid work',()=>{
 let s=R.start(R.initial(),'graph_from_equation');s=R.placeLinePoint(s,'A',{x:-1,y:-1});s=R.placeLinePoint(s,'B',{x:2,y:5});assert(R.active(R.commit(s)).feedback.result.ok);
 s=R.placeLinePoint(s,'B',{x:-1,y:-1});s=R.advance(R.commit(s));assert.deepEqual(R.active(s).locks,{plotA:true});s=R.placeLinePoint(s,'B',{x:-1,y:2});assert(!R.active(R.commit(s)).feedback.result.ok);s=R.clearLinePoints(s);assert.deepEqual(R.active(s).values.plotA,{x:-1,y:-1});assert.equal(R.active(s).values.plotB,undefined);s=R.placeLinePoint(s,'B',{x:.25,y:1.5});assert.equal(R.active(s).values.plotB,undefined);s=R.placeLinePoint(s,'B',{x:0,y:1});assert(R.active(R.commit(s)).feedback.result.ok);
});
test('reading uses exact equivalent numbers and locks the correct parameter on repair',()=>{
 let s=R.start(R.initial(),'equation_from_graph');s=R.edit(R.edit(s,'a','0'),'b','1');s=R.advance(R.commit(s));assert.deepEqual(R.active(s).locks,{b:true});s=R.edit(R.edit(s,'b','99'),'a','4/2');assert.equal(R.active(s).values.b,'1');assert(R.active(R.commit(s)).feedback.result.ok);
 const t=F.makeTask('equation_from_graph',3);assert(F.check(t,{a:'0,5',b:'-2'},'formula-read').ok);assert(!F.check(t,{a:'0.51',b:'-2'},'formula-read').ok);
});
test('algebra always changes both members, permits division first, records explicit checks, and supports undo and bounded work',()=>{
 let s=R.start(R.initial(),'rewrite_linear_equation'),t=R.active(s).task;s=R.operateFormula(s,4);let m=R.active(s);assert(W.equivalent(t.equation,F.currentEquation(t,m.values)));assert.equal(m.values.algebraSteps[0].operation,'÷ 2');assert.equal(s.events.length,0);assert(!F.check(t,m.values,m.phase).ok);s=R.operateFormula(s,0);assert(F.check(t,R.active(s).values,R.active(s).phase).ok);s=R.undo(s);assert.equal(R.active(s).values.algebraSteps.length,1);s=R.operateFormula(s,1);assert(!F.check(t,R.active(s).values,R.active(s).phase).ok);s=R.undo(s);s=R.operateFormula(s,0);assert(R.active(R.commit(s)).feedback.result.ok);
 s=R.commit(s);for(let i=0;i<10;i++)s=R.operateFormula(s,2);assert.equal(R.active(s).values.algebraSteps.length,2,'feedback freezes operations');
 let fresh=R.start(R.initial(),'rewrite_linear_equation');for(let i=0;i<10;i++)fresh=R.operateFormula(fresh,2);assert.equal(R.active(fresh).values.algebraSteps.length,8);assert(R.active(fresh).values.operationError);assert.deepEqual(R.operateFormula(fresh,-1).events,[]);
});
test('each full round completes only its own map stop; independent resume, hints, replay and saved evidence persist',()=>{
 let s=R.edit(R.start(R.initial(),'zero'),'answer','1'),original=structuredClone(s.missions.zero);
 for(const skill of F.skills){s=R.start(s,skill);const initial=structuredClone(R.active(s));s=R.start(R.start(s,'negative'),skill);assert.deepEqual(R.active(s),initial);s=solve(s);assert.notEqual(A.statuses(s,'formulewerf').nodes.find(n=>n.id===skill).state,'completed');while(!R.active(s).completed)s=solve(s);assert.equal(A.statuses(s,'formulewerf').nodes.find(n=>n.id===skill).state,'completed');s=R.start(s,skill,true);assert.equal(A.statuses(s,'formulewerf').nodes.find(n=>n.id===skill).state,'completed');const before=structuredClone(R.active(s).task);for(let j=0;j<5;j++)s=R.hint(s);s=R.newAfterExample(s);assert.notDeepEqual(R.active(s).task.model.b,before.model.b);assert.equal(R.active(s).hints,0)}assert.deepEqual(s.missions.zero,original);assert.equal(A.statuses(s,'formulewerf').completed,4);assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
});
test('views leave answers blank and drawing help generic, with correct breadcrumbs and preserved basic graph contract',()=>{
 for(const skill of F.skills){const s=R.start(R.initial(),skill),m=R.active(s),html=V.render(m,'');assert(html.includes('Opgave 1 / 6'));assert.equal(html.includes('class="formula-model'),skill==='equation_from_graph');assert(S.header(s,{mission:true}).includes('Formulewerf'));assert(S.header(s,{mission:true}).includes(F.titles[skill]));if(skill==='graph_from_equation'){assert(!html.includes('(0, 1)'));assert(!html.includes('b = 1'));assert(!html.includes('a = 2'));assert(!html.includes('2 omhoog'))}if(skill==='rewrite_linear_equation'){assert(!html.includes('Stap 1'));assert(!html.includes('y = 2x + 3'))}}
 const n=A.all(A.get('formulewerf'))[2];assert(n.playable&&n.entryPolicy.visibleIntercept);for(let i=0;i<6;i++){const t=F.makeTask('equation_from_graph',i);assert(Math.abs(W.num(t.model.b))<5)}
});
