'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const M=require('../games/rechten/trainer-v2/semantic-math-core.js'),W=require('../games/rechten/trainer/wave-core.js');
const skills=require('../games/rechten/trainer-v2/content/skills.json').skills;
const ids=['point','point_plot','delta','slope','slope_from_two_points','line_behavior','special_lines','intercept','ab','fx','table','graph_from_equation','graph_from_table','rewrite_linear_equation','input_from_output','point_on_line','zeroRead','zero','sign','signchart','equation_from_ab','intercept_from_point','equation_from_point_slope','equation_from_two_points','equation_from_graph','equation_from_table','equation_from_context'];
const string=v=>`${v.n}/${v.d}`;
// Independent BigInt oracle: no W operation, floating tolerance or same implementation.
const R=x=>({n:BigInt(x.n),d:BigInt(x.d)}),plus=(a,b)=>({n:a.n*b.d+b.n*a.d,d:a.d*b.d}),times=(a,b)=>({n:a.n*b.n,d:a.d*b.d}),minus=(a,b)=>plus(a,{n:-b.n,d:b.d}),ratio=(a,b)=>({n:a.n*b.d,d:a.d*b.n}),equal=(a,b)=>a.n*b.d===b.n*a.d;
const value=(m,x)=>plus(times(R(m.a),R(x)),R(m.b));
const fields=['id','skill_id','family_id','world_id','mode','profile','curriculum_claim','primary_cognitive_action','given_representations','target_representation','task_features','visible_case','contrast_case','hidden_cases','primary_action','response_component','allowed_alternatives','commit_policy','feedback_model','misconception_hypotheses','repair_policy','hints','worked_example_ref','difficulty_features','units','language_load','accessibility','evidence_events','asset_slots','validator'];
function correctInterval(t){const expected=M.intervalExpected(t);return {boundary:t.root?string(t.root):'',side:expected.side,closed:false,symbol:expected.symbol};}
function slopeResponse(t,direction='AB'){const A=direction==='AB'?t.points.A:t.points.B,B=direction==='AB'?t.points.B:t.points.A;return {direction,dx:string(W.sub(B.x,A.x)),dy:string(W.sub(B.y,A.y)),numerator:string(t.model.a),denominator:'1'};}
test('exactly 27 preserved IDs, context remains paused, every matrix record has all 21 contract fields',()=>{
 assert.deepEqual(skills.map(s=>s.id),ids);assert.equal(skills.filter(s=>s.active).length,26);assert.equal(skills.find(s=>s.id==='equation_from_context').active,false);
 assert.deepEqual(new Set([...W.order,...W.disabledSkills]),new Set(ids));
 const doc=fs.readFileSync(path.join(__dirname,'../docs/rechten-v2/QUESTION_MECHANICS_MATRIX.md'),'utf8');
 for(const id of ids){const section=doc.split('\n## '+id+'\n')[1]?.split('\n## ')[0];assert(section,id);const rows=section.split('\n').filter(s=>s.startsWith('| ')&&!s.startsWith('| Veld'));assert.equal(rows.length,21,id);assert(section.includes('Actuele generator:'));assert(section.includes('Actuele validator / UI:'));assert(section.includes('Nog niet ondersteund / migratiegrens:'));}
});
test('complete non-empty metadata; frozen deterministic semantic task snapshots and JSON roundtrip',()=>{
 for(const world of ['grenspas','hellingrug','signaalstad'])for(let variant=0;variant<6;variant++){
  const t=M.makeTask(world,{variant,seed:23});for(const key of fields){assert(Object.hasOwn(t,key),world+' '+key);assert(t[key]!==null&&t[key]!==undefined);if(Array.isArray(t[key]))assert(t[key].length);if(typeof t[key]==='string')assert(t[key].trim().length);}
  assert.equal(t.hints.length,5);assert.equal(t.accessibility.maxPinnedViews,2);assert.equal(t.commit_policy.liveCorrectness,false);assert.equal(Object.isFrozen(t.model),true);assert.deepEqual(M.makeTask(world,{variant,seed:23}),t);assert.deepEqual(JSON.parse(JSON.stringify(t)),t);
  assert.throws(()=>{t.model.a.n=999});assert(M.checkHidden(t,string(t.hidden.y)).ok);
 }
 const transfer=M.makeTask('hellingrug',{variant:1});assert(transfer.features.includes('point-to-table-transfer'));assert.deepEqual(transfer.given_representations,['table']);assert(!Object.hasOwn(transfer,'scaleX'));assert(!transfer.features.includes('unequal-axis-scales'));
 assert.throws(()=>M.makeTask('unknown'));
});
test('12000 seeded Grenspas cases: oracle roots, strict sides, symbols, all/none, no mutation',()=>{
 const seen=new Set();for(let seed=0;seed<2000;seed++)for(let variant=0;variant<6;variant++){
  const t=M.makeTask('grenspas',{variant,seed}),before=JSON.stringify(t),answer=correctInterval(t),expected=M.intervalExpected(t);seen.add([t.model.a.n>0?'rise':t.model.a.n<0?'fall':'constant',t.ask,expected.side].join(':'));
  assert(M.checkInterval(t,answer).ok);assert.equal(JSON.stringify(t),before);
  if(t.root){assert(value(t.model,t.root).n===0n);assert(M.checkRoot(t,string(t.root)).ok);const probe=W.add(t.root,expected.side==='right'?1:-1),actual=value(t.model,probe);assert(t.ask==='positive'?actual.n>0n:actual.n<0n);assert.equal(M.checkInterval(t,{...answer,closed:true}).code,'sign.boundary_included');assert.equal(M.checkInterval(t,{...answer,side:answer.side==='left'?'right':'left'}).code,'sign.side_reversed');assert.equal(M.checkInterval(t,{...answer,symbol:answer.symbol==='<'?'>':'<'}).code,'sign.symbol_side');assert.equal(M.checkInterval(t,{...answer,symbolBoundary:string(W.add(t.root,1))}).code,'sign.symbol_boundary');assert(!M.checkRoot(t,string(W.add(t.root,1))).ok);
  }else{const yes=t.ask==='positive'?t.model.b.n>0:t.model.b.n<0;assert.equal(expected.side,yes?'all':'none');assert(M.checkRoot(t,t.model.b.n?'none':'all').ok);assert(!M.checkRoot(t,'1').ok);}
 }
 assert(seen.has('rise:positive:right'));assert(seen.has('fall:positive:left'));assert(seen.has('fall:negative:right'));assert(seen.has('constant:positive:all'));assert(seen.has('constant:positive:none'));assert(seen.has('constant:negative:none'));
});
test('12000 seeded Hellingrug cases, two orientations: independent exact rate and hidden third point',()=>{
 const seen=new Set();for(let seed=0;seed<2000;seed++)for(let variant=0;variant<6;variant++){
  const t=M.makeTask('hellingrug',{variant,seed}),{A,B}=t.points,rate=ratio(minus(R(B.y),R(A.y)),minus(R(B.x),R(A.x)));assert(equal(rate,R(t.model.a)));assert(equal(value(t.model,t.hidden.x),R(t.hidden.y)));assert(!W.eq(t.hidden.x,A.x));assert(!W.eq(t.hidden.x,B.x));seen.add(t.model.a.n>0?'positive':t.model.a.n<0?'negative':'zero');
  for(const direction of ['AB','BA']){const r=slopeResponse(t,direction);assert(M.checkDeltas(t,r).ok);assert(M.checkSlope(t,r).ok);assert(M.checkSlope(t,{...r,numerator:String(-2*t.model.a.n),denominator:String(-2*t.model.a.d)}).ok);}
 }
 assert.deepEqual([...seen].sort(),['negative','positive','zero']);
});
test('local repair preserves correct deltas; mixed subtraction and reciprocal are distinguishable',()=>{
 const t=M.makeTask('hellingrug'),r=slopeResponse(t),bad=M.checkDeltas(t,{...r,dy:string(W.mul(-1,W.parse(r.dy)))});assert.equal(bad.code,'delta.orientation_mixed');assert.equal(bad.keep.dx,true);assert.equal(bad.keep.dy,false);
 const reciprocal=M.checkSlope(t,{...r,numerator:String(t.model.a.d),denominator:String(t.model.a.n)});assert.equal(reciprocal.code,'slope.reciprocal');assert.equal(reciprocal.keep.dx,true);assert.equal(reciprocal.keep.dy,true);assert.equal(M.checkSlope(t,{...r,denominator:'0'}).kind,'interaction_error');assert.deepEqual(M.checkDeltas(t,r).keep,{direction:true,dx:true,dy:true});
});
test('8000 Signal tasks: zero/difference information choices, atomic repair and independent hidden x10',()=>{
 for(let seed=0;seed<2000;seed++)for(let variant=0;variant<4;variant++){
  const t=M.makeTask('signaalstad',{variant,seed});assert(!W.eq(t.model.a,t.model.b));
  for(const kind of ['zero','difference']){const expected=kind==='zero'?t.model.b:t.model.a,actual=kind==='zero'?t.faultModel.b:t.faultModel.a,p=M.signalProbe(t,kind,{expected:string(expected)});assert(p.ok);assert(W.eq(p.actual,actual));assert(!W.eq(p.actual,p.expected));assert.equal(p.probes.length,kind==='difference'?2:1);for(const probe of p.probes){assert(equal(value(t.faultModel,probe.x),R(probe.y)),'probe is an actual graph point, not a rate as absolute y');assert(equal(value(t.model,probe.x),R(probe.expected)));}if(kind==='difference')assert(equal(minus(R(p.probes[1].y),R(p.probes[0].y)),R(actual)));assert(!M.signalProbe(t,kind,{expected:string(W.add(expected,1))}).ok);}
  assert(M.checkSignal(t,{feature:'swapped',a:string(t.model.a),b:string(t.model.b)}).ok);const wrong=M.checkSignal(t,{feature:'swapped',a:string(t.faultModel.a),b:string(t.faultModel.b)});assert.equal(wrong.code,'param.slope_intercept_swap');
  assert.equal(M.checkSignal(t,{feature:'swapped',a:string(t.model.a),b:'999'}).keep.a,true);assert.equal(t.hidden.x.n,10);assert(equal(value(t.model,t.hidden.x),R(t.hidden.y)));assert(M.checkHidden(t,string(t.hidden.y)).ok);assert(!M.checkHidden(t,string(W.add(t.hidden.y,1))).ok);
 }
});
test('invalid syntax, missing selections, huge numbers and zero denominator are interaction errors',()=>{
 const boundary=M.makeTask('grenspas'),slope=M.makeTask('hellingrug'),signal=M.makeTask('signaalstad');
 for(const invalid of ['', ' ', '-', '1/0', 'NaN', '1,', '1e3','Infinity','9007199254740992','9007199254740991','1000001','1/1000001',null,{},'1'.repeat(65)]){
  for(const r of [M.checkRoot(boundary,invalid),M.checkInterval(boundary,{...correctInterval(boundary),boundary:invalid}),M.checkDeltas(slope,{...slopeResponse(slope),dx:invalid}),M.checkSlope(slope,{...slopeResponse(slope),numerator:invalid}),M.signalProbe(signal,'zero',{expected:invalid}),M.checkSignal(signal,{feature:'swapped',a:invalid,b:'8'}),M.checkHidden(signal,invalid)]){assert.equal(r.ok,false);assert.equal(r.kind,'interaction_error');assert.equal(r.code,'input.syntax');}
 }
 assert.deepEqual(M.parse('−1,25'),W.q(-5,4));assert.deepEqual(M.parse('2/-3'),W.q(-2,3));assert.equal(M.signalProbe(signal,'unsupported',{expected:'8'}).kind,'interaction_error');
});
test('underlying degenerate/equivalence validators remain unchanged and reject false mathematical claims',()=>{
 assert.equal(W.model({x:W.q(1),y:W.q(2)},{x:W.q(1),y:W.q(3)}).kind,'vertical');assert.equal(W.model({x:W.q(1),y:W.q(2)},{x:W.q(1),y:W.q(2)}).kind,'identical');assert.throws(()=>W.div(1,0));
 const e={left:W.expr(0,2),right:W.expr(4,0,6)},next=W.operate(e,{kind:'divide',value:W.q(2)});assert(W.equivalent(e,next));next.right.c=W.q(4);assert(!W.equivalent(e,next));
});

test('committed fault and hidden feedback state the first exact divergence in screenreader text',()=>{
 const t=M.makeTask('signaalstad');
 const intercept=M.checkSignal(t,{feature:'swapped',a:'2',b:'3'});assert.match(intercept.message,/x = 0.*y = 3.*y = 8/);assert(intercept.message.length<180);assert.equal(intercept.keep.a,true);
 const rate=M.checkSignal(t,{feature:'swapped',a:'3',b:'8'});assert.match(rate.message,/x = 1.*y = 11.*y = 10/);assert(rate.message.length<180);assert.equal(rate.keep.b,true);
 const hidden=M.checkHidden(t,'29');assert.match(hidden.message,/y = 29.*x = 10.*y = 28/);assert(hidden.message.length<180);
});

test('full examples lead to a structural contrast, never their worked answer, and evidence follows authored representation',()=>{
 const R=require('../games/rechten/trainer-v2/mission-runtime.js');
 const worked={grenspas:{a:W.q(1),b:W.q(-2)},hellingrug:{a:W.q(1,2),b:W.q(1)},signaalstad:{a:W.q(3),b:W.q(-1)}};
 for(const world of R.worlds.filter(w=>w!=='puntenbaai')){
  let s=R.start(R.initial(),world);for(let level=0;level<5;level++)s=R.hint(s);const before=JSON.parse(JSON.stringify(s)),old=R.active(s),fresh=R.newAfterExample(s),next=R.active(fresh);
  assert.deepEqual(s,before,'replacement does not mutate the existing draft');assert.equal(next.variant,next.task.variant);assert.equal(next.variant,old.variant+1);assert.equal(next.task.seed,2);assert.equal(next.task.mode,'practice');assert.notDeepEqual(next.task.features,old.task.features,'contrast changes task structure');
  assert(!(W.eq(next.task.model.a,worked[world].a)&&W.eq(next.task.model.b,worked[world].b)),'new task is not the worked example');assert.notDeepEqual(next.task.model,old.task.model);assert.equal(next.hints,0);assert.equal(fresh.events.length,s.events.length);
  if(world==='hellingrug'){
   assert.deepEqual(next.task.given_representations,['table']);const {A,B}=next.task.points;let edited=fresh;for(const [key,v]of Object.entries({direction:'AB',dx:string(W.sub(B.x,A.x)),dy:string(W.sub(B.y,A.y))}))edited=R.edit(edited,key,v);const committed=R.commit(edited);assert(R.active(committed).feedback.result.ok);assert.equal(committed.events.at(-1).representation,'table');
  }
 }
});
