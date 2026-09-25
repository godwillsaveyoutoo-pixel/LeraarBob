const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../games/rechten/trainer/wave-core.js'),{solve,nextAnswer}=require('./rechten-transfer-helpers.cjs');
const task=(skill,difficulty=2,variant=0,seed=1)=>({skill,difficulty,params:C.transfer.legacyGenerate(skill,{difficulty,variant,seed})});
// Independent determinant test using BigInt, including rational coordinates.
const rat=v=>[BigInt(v.n),BigInt(v.d)],sub=([a,b],[c,d])=>[a*d-c*b,b*d],mul=([a,b],[c,d])=>[a*c,b*d],same=([a,b],[c,d])=>a*d===c*b;
const collinear=(A,B,P)=>same(mul(sub(rat(B.x),rat(A.x)),sub(rat(P.y),rat(A.y))),mul(sub(rat(B.y),rat(A.y)),sub(rat(P.x),rat(A.x))));
test('2400 archived transfer tasks; own points, both subtraction orders, every variant and domain',()=>{
 let count=0;for(const skill of C.transferSkills){const st={};for(let difficulty=0;difficulty<3;difficulty++)for(let seed=1;seed<=200;seed++){
  const t=task(skill,difficulty,seed%12,seed),w=solve(C,t,{read:seed%2===0,reverse:seed%3===0,first:1,second:0});assert(w.done);assert.equal(w.errors.length,0);
  if(t.params.rows.length===3){const expected=collinear(...t.params.rows);assert.equal(w.values.tableVerdict==='fits',expected);assert.equal(expected,t.params.variant!=='inconsistent')}
  if(skill!=='equation_from_context')for(const P of t.params.rows)for(const k of ['x','y']){const tick=C.div(P[k],t.params[k==='x'?'scaleX':'scaleY']);assert.equal(tick.d,1);assert(Math.abs(tick.n)<=5)}
  if(skill==='equation_from_context'){const p=t.params;assert(C.num(p.context.testX)<=C.num(p.context.domain.max));for(const P of p.rows){assert(C.num(P.x)>=0&&C.num(P.x)<=C.num(p.context.domain.max));assert(C.num(P.y)>=0)}assert(C.num(C.add(C.mul(p.model.a,p.context.domain.max),p.model.b))>=0)}
  C.evidence(st,t,count++,true);
 }assert(C.mastered(st,skill),'mastery coverage '+skill)}assert.equal(count,2400);
});
test('all column pairs accepted, including a corrupted chosen column; third row decides consistency',()=>{
 for(const variant of [2,10,11])for(const skill of ['equation_from_table','graph_from_table'])for(let first=0;first<3;first++)for(let second=0;second<3;second++)if(first!==second){const t=task(skill,2,variant,3),w=solve(C,t,{first,second,reverse:true});assert.equal(w.values.tableVerdict,variant>=10?'none':'fits')}
 const p=x=>({x:C.q(x[0]),y:C.q(x[1])}),rows=[[1,5],[3,9],[6,15]].map(p),t={skill:'equation_from_table',difficulty:2,params:{rows,model:{kind:'affine',a:C.q(2),b:C.q(3)}}},w=solve(C,t,{first:2,second:0});assert(C.eq(w.values.a,2));assert(C.eq(w.values.b,3));assert.equal(w.values.tableVerdict,'fits');
 t.params.rows[1].y=C.q(10);assert.equal(solve(C,t,{first:1,second:2}).values.tableVerdict,'none');
});
test('every visible ordered graph pair is accepted, while identical and off-line points are rejected',()=>{
 let count=0;for(let v=0;v<12;v++){const t=task('equation_from_graph',2,v,2),ps=[];for(let x=-5;x<=5;x++)for(let y=-5;y<=5;y++){const P=C.gridPoint(t,{x,y});if(C.onLine(P,t.params.model))ps.push(P)}
 assert(ps.length>=2);for(const A of ps)for(const B of ps){const w=t.work=C.fresh(t);assert(C.submit(t,w,A).ok);const samePoint=C.eq(A.x,B.x)&&C.eq(A.y,B.y);assert.equal(C.submit(t,w,B).ok,!samePoint);if(!samePoint)count++}
 const w=t.work=C.fresh(t);assert(!C.submit(t,w,{x:C.q(100),y:C.q(100)}).ok);assert(C.submit(t,w,ps[0]).ok);const before=structuredClone(w.values);assert(!C.submit(t,w,{x:ps[0].x,y:C.add(ps[0].y,1)}).ok);assert.deepEqual(w.values,before);
 }assert(count>300);
});
test('b route is a learner choice; offscreen intercepts require computation; wrong b retains a',()=>{
 for(const read of [false,true]){const t=task('equation_from_graph',2,2),w=solve(C,t,{read});assert.equal(w.values.bRoute,read?'read':'point');assert(C.eq(read?w.values.readB:w.values.b,t.params.model.b))}
 const t=task('equation_from_graph',2,10),w=t.work=C.fresh(t);while(C.transfer.stages(t,w)[w.index]!=='bRoute')assert(C.submit(t,w,nextAnswer(C,t,w)).ok);
 assert.equal(C.submit(t,w,'read').code,'wave.transfer.interceptView');assert(C.submit(t,w,'point').ok);while(C.transfer.stages(t,w)[w.index]!=='b')C.submit(t,w,nextAnswer(C,t,w));const a=structuredClone(w.values.a);assert(!C.submit(t,w,C.add(t.params.model.b,1)).ok);assert.deepEqual(w.values.a,a);
 const restored=JSON.parse(JSON.stringify(w));while(!restored.done)assert(C.submit(t,restored,nextAnswer(C,t,restored)).ok);assert.deepEqual(restored.values.a,a);
});
test('undo rewinds chosen data, signature reflects selections, and graph point diagnoses retain correct coordinate',()=>{
 const t=task('graph_from_table'),w=t.work=C.fresh(t);assert(C.submit(t,w,2).ok);const P=t.params.rows[2],wrong={...P,y:C.add(P.y,1)};assert.equal(C.submit(t,w,wrong).code,'wave.transfer.plotY');assert(C.submit(t,w,P).ok);assert(C.submit(t,w,0).ok);C.undo(w);assert.equal(w.values.colB,undefined);assert.deepEqual(w.values.plotA,P);
 const e=task('equation_from_graph'),a=solve(C,e),sig=C.signature(e);assert(a.done);solve(C,e,{reverse:true});assert.notEqual(C.signature(e),sig);
});
test('v703 upgrade keeps historical scores, pending transfer-independent work, and all 26 skills reachable',()=>{
 const old={version:703,catalogVersion:3,xp:23,skills:{ab:{seen:6,strength:.7},future:{kept:1}},access:['fx','equation_from_two_points'],review:[],waveDraft:{skill:'rewrite_linear_equation',work:{index:0,operation:{kind:'divide'},entry:['-3','2']}}},before=structuredClone(old),m=C.migrate(old);assert.deepEqual(old,before);assert.equal(m.version,704);assert.equal(m.catalogVersion,4);assert.deepEqual(m.skills,old.skills);assert.deepEqual(m.waveDraft,old.waveDraft);assert.deepEqual(C.migrate(m),m);
 const s={skills:Object.fromEntries(C.order.map(k=>[k,{}])),access:[],review:[]};for(const k of C.order){assert(C.unlock(s).includes(k),k);s.skills[k]={intro:true,seen:4,strength:.5,recent:[true,true,true,true]}}assert.equal(C.unlock(s).length,26);for(const v of Object.values(s.skills))v.strength=0;assert.equal(C.unlock(s).length,26);assert(!C.requirements.intercept_from_point.includes('rewrite_linear_equation'));assert(!C.order.includes('information_sufficiency'));
});

test('compact mastery signatures migrate without changing evidence dates, coverage, scores or duplicates',()=>{
 const t=task('equation_from_table'),w=solve(C,t),signature=C.signature(t),old={version:703,skills:{equation_from_table:{seen:9,correct:8,strength:.8,coverage:{fraction:true},independent:[{at:12,signature,custom:'kept'}]}},review:[],access:[]},before=structuredClone(old),m=C.migrate(old),st=m.skills.equation_from_table;
 assert.deepEqual(old,before);assert.equal(st.seen,9);assert.equal(st.correct,8);assert.equal(st.strength,.8);assert.deepEqual(st.coverage,{fraction:true});assert.equal(st.independent[0].at,12);assert.equal(st.independent[0].custom,'kept');assert(st.independent[0].signature.length<40);assert.equal(st.independent[0].signature,C.compactSignature(signature));C.evidence(st,t,30,true);assert.equal(st.independent.length,1);assert.deepEqual(C.migrate(m),m);
 const keys=new Set();for(let i=0;i<5000;i++)keys.add(C.compactSignature('different-task-'+i));assert.equal(keys.size,5000);
});
