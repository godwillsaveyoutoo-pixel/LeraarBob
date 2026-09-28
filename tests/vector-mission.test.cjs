const {test}=require('node:test'),assert=require('node:assert/strict');
const Core=require('../games/vectoren/vector-core.js'),UI=require('../games/vectoren/vector-mission.js');
const {VectorMath:M,TaskGenerator:G,TaskValidator:V}=Core;
const stroke=(p,v,role='vector')=>M.stroke(p,M.endPointFromVector(p,v),role);
test('mission stations cover existing IDs exactly once',()=>{
 const ids=UI.STATIONS.flatMap(s=>s.skills);assert.equal(new Set(ids).size,ids.length);assert.deepEqual(ids.sort(),G.skills.map(s=>s.id).sort());
});
test('coach follows geometrically valid steps in either order, including out-of-order drawing',()=>{
 const t=G.generate('headtail',{seed:71,level:1,variant:2});
 for(const order of [[0,1],[1,0]]){
  const first=stroke(t.start,t.parts[order[0]]),second=stroke(first.end,t.parts[order[1]]),result=stroke(t.start,t.target,'result');
  for(const lines of [[],[second],[second,first],[result,second,first]]){
   const state=UI.headtailSteps(t,{strokes:lines},M);assert.equal(state.count,lines.length===1?0:lines.length);
   if(state.count===3)assert(V.validate(t,{strokes:lines}).ok);
  }
 }
});
test('wrong arrows never advance the coach; diagnostics retain validator outcomes',()=>{
 const t=G.generate('headtail',{seed:71,level:1,variant:2}),first=stroke(t.start,t.parts[0]);
 let a={strokes:[first,stroke(M.point(3,2),t.parts[1])]};assert.equal(UI.headtailSteps(t,a,M).count,1);assert.match(UI.diagnostic(t,a,M,'fallback'),/begint nog niet aan de kop/);assert(!V.validate(t,a).ok);
 a.strokes=[first,stroke(first.end,t.parts[1]),M.stroke(M.point(3,2),M.endPointFromVector(t.start,t.target),'result')];assert.match(UI.diagnostic(t,a,M,'fallback'),/start nog niet in P/);assert.equal(UI.headtailSteps(t,a,M).count,2);
 const ordered=G.generate('headtail',{seed:51,level:1,variant:1}),v=stroke(ordered.start,ordered.parts[1]);assert.equal(UI.headtailSteps(ordered,{strokes:[v,stroke(v.end,ordered.parts[0])]},M).count,0);
});
test('streak uses local calendar days and survives midnight and a missed day',()=>{
 assert.equal(UI.streak(['2026-09-25','2026-09-26'],new Date(2026,8,27)),2);
 assert.equal(UI.streak(['2026-09-25','2026-09-26'],new Date(2026,8,28)),0);
 assert.equal(UI.streak(['2026-09-25','2026-09-25'],new Date(2026,8,25)),1);
});

const Lessons=require('../games/vectoren/vector-lessons.js');
const inFrame=(view,p)=>p.x>=view.minX-1e-8&&p.x<=view.maxX+1e-8&&p.y>=view.minY-1e-8&&p.y<=view.maxY+1e-8;
test('adaptive frame fits givens and complete worked constructions for every geometric family',()=>{
 for(const {id} of G.skills)for(const level of [0,1,2])for(let variant=0;variant<4;variant++)for(const seed of [17,51,71,129]){
  const t=G.generate(id,{level,variant,seed});if(t.representation==='symbolic')continue;
  const before=JSON.stringify(t),steps=Lessons.build(t).steps,bounds=UI.boardBounds(t,steps,M);
  const points=[...t.points.map(p=>p.p),...(t.segments||[]).flat(),...t.refs.flatMap(r=>[r.start,M.endPointFromVector(r.start,r.v)]),...steps.flatMap(s=>[...s.strokes.flatMap(a=>[a.start,a.end]),s.point].filter(Boolean))];
  if(t.targetPoint)points.push(t.targetPoint);
  if(t.choicePositions)t.options.forEach((v,i)=>points.push(t.choicePositions[i],M.endPointFromVector(t.choicePositions[i],v)));
  if(t.axes||id==='headtail')points.push(M.point(0,0));
  for(const [w,h] of [[1100,550],[600,160],[330,460]]){
   const view=UI.boardView(bounds,w,h);assert(view.unit>0&&view.unit<=96);
   for(const p of points){assert(inFrame(view,p),`${id}/${level}/${variant}: ${JSON.stringify(p)} fits ${w}×${h}`);const x=view.ox+p.x*view.unit,y=view.oy-p.y*view.unit;assert(x>=24&&x<=w-24&&y>=24&&y<=h-24,'edge clearance');}
  }
  assert.equal(JSON.stringify(t),before,'presentation does not mutate tasks');
 }
});
test('small figures zoom in; long constructions zoom out with equal horizontal and vertical units',()=>{
 const t=G.generate('arrow',{seed:71,level:1,variant:2}),b=UI.boardBounds(t,Lessons.build(t).steps,M),v=UI.boardView(b,800,400);
 const oldUnit=Math.min((800-48)/(t.bounds.maxX-t.bounds.minX),(400-48)/(t.bounds.maxY-t.bounds.minY));
 assert(v.unit>oldUnit*1.4,'compact drawing gets substantially more room');
 const long={...t,target:M.vec(20,16)},wide=UI.boardView(UI.boardBounds(long,Lessons.build(long).steps,M),800,400);
 assert(wide.unit<v.unit);assert(inFrame(wide,M.endPointFromVector(long.start,long.target)));
 assert.equal((v.ox+v.unit)-v.ox,v.oy-(v.oy-v.unit));
});
test('frame reserves reverse chains, route overshoot, both components and all property directions',()=>{
 for(const id of ['headtail','commute','parallelogram','difference','combination','route','decompose','props']){
  const t=G.generate(id,{seed:51,level:0,variant:1}),b=UI.boardBounds(t,Lessons.build(t).steps,M);
  let parts=t.parts;
  if(['difference','combination'].includes(id))parts=[M.scale(t.refs[0].v,t.factor??1),M.scale(t.refs[1].v,-1)];
  if(id==='route')parts=[M.scale(t.operands[0],2),M.scale(t.operands[1],3),M.scale(t.operands[2],-1)];
  if(parts)for(const start of [t.start,t.secondStart].filter(Boolean))for(const order of [parts,[...parts].reverse()]){let p=start;for(const part of order){p=M.endPointFromVector(p,part);assert(inFrame(b,p),id+' intermediate point');}}
  if(id==='props')for(let angle=0;angle<Math.PI*2;angle+=.1)assert(inFrame(b,M.point(t.start.x+M.length(t.source)*Math.cos(angle),t.start.y+M.length(t.source)*Math.sin(angle))));
  if(id==='decompose'){const [a,c]=t.dirs;for(const v of [M.scale(a,M.cross(t.target,c)/M.cross(a,c)),M.scale(c,M.cross(a,t.target)/M.cross(a,c))])assert(inFrame(b,M.endPointFromVector(t.start,v)));}
 }
});

test('coordinate arithmetic retains drawn givens without revealing unknown answers',()=>{
 for(const level of [0,1,2])for(const id of ['coordadd','coordscale','coordcombo','unknown','route','ab','fourth','basis']){
  const t=G.generate(id,{seed:71,level,variant:1});
  if(id==='route'&&level===0)continue;
  assert.notEqual(t.representation,'symbolic',id+' has visual support');
  assert(t.refs.length||t.segments?.length,id+' has a given figure');
  if(['coordadd','coordcombo','unknown','route'].includes(id))assert.deepEqual(t.refs.map(r=>r.v),t.operands,id+' draws actual operands');
  if(id==='unknown')assert.deepEqual(t.refs.map(r=>r.name),['a','r']);
  if(id==='fourth')assert.deepEqual(t.points.map(p=>p.name),['A','B','C']);
 }
});
test('Mixed battle selects substantial geometric constructions across worlds',()=>{
 assert(UI.BATTLE_MIXED_SKILLS.includes('decompose'));assert(UI.BATTLE_MIXED_SKILLS.includes('figure'));assert(UI.BATTLE_MIXED_SKILLS.includes('headtail'));assert(UI.BATTLE_MIXED_SKILLS.includes('difference'));
 assert(UI.BATTLE_MIXED_SKILLS.every(id=>!['props','equal','free','opposite','coords','arrow'].includes(id)));
 assert(new Set(UI.BATTLE_MIXED_SKILLS.map(id=>UI.stationOfSkill(id).id)).size>1);
});

test('retry clears wrong arrows and preserves valid partial constructions',()=>{
 for(const skill of ['scalar','opposite','props']){
  const t=G.generate(skill,{seed:71,level:1,variant:0}),bad=stroke(M.point(100,100),t.target),good=stroke(t.start,t.target);
  assert.deepEqual(UI.retryStrokes(t,[bad],M,V.validate),[]);
  assert.deepEqual(UI.retryStrokes(t,[bad,good],M,V.validate),[good]);
 }
 for(const policy of ['headtail','parallelogram','commute','decompose']){
  const t=G.generate(policy,{seed:71,level:1,variant:2});
  const solved=Lessons.build(t).steps.at(-1).strokes.map(s=>({...s}));
  const bad=stroke(M.point(100,100),M.vec(99,99));
  const kept=UI.retryStrokes(t,[...solved,bad],M,V.validate);
  assert(!kept.includes(bad),policy+' rejects unrelated arrow');
  assert(V.validate(t,{strokes:kept}).ok,policy+' keeps the valid construction');
 }
 const t=G.generate('headtail',{seed:71,level:1,variant:2}),first=stroke(t.start,t.parts[0]),second=stroke(first.end,t.parts[1]);
 assert.deepEqual(UI.retryStrokes(t,[second],M,V.validate),[second],'second part can be drawn before first');
 assert.deepEqual(UI.retryStrokes(t,[first,stroke(t.start,t.parts[1])],M,V.validate),[first],'keep the chosen order rather than two disconnected beginnings');
 assert.deepEqual(UI.retryStrokes(t,[first,stroke(M.point(100,100),t.parts[1])],M,V.validate),[first]);
});
