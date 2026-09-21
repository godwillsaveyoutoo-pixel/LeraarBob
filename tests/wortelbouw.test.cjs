const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../games/wortelbouw/geometry.js');
const close=(a,b,message)=>assert(Math.abs(a-b)<1e-7,`${message}: ${a} ≠ ${b}`);
const length2=e=>G.dot(G.sub(e.a,e.b),G.sub(e.a,e.b));
function verifyMosaic(s){
  for(const [i,o] of s.objects.entries()){
    for(const p of s.objects.slice(0,i))assert.equal(G.overlap(o.points,p.points),false,'no positive area overlap');
    if(i)assert(s.objects.slice(0,i).some(p=>G.edges(o).some(e=>G.edges(p).some(f=>G.sharedBoundary(e,f)))),'each new piece attaches to the mosaic');
    if(o.type==='square'){
      close(G.signedArea(o.points),o.area,'square area');
      const e=G.edges(o);for(let j=0;j<4;j++){
        close(length2(e[j]),o.area,'all square sides');
        close(G.dot(G.sub(e[j].b,e[j].a),G.sub(e[(j+1)%4].b,e[(j+1)%4].a)),0,'square right angle');
      }
    }else{
      close(length2(o.helper),o.known**2,'known leg');close(length2(o.result),o.result.area,'unknown side');close(length2(o.base),o.base.area,'original side');
      const others=o.points.filter(p=>G.len(G.sub(p,o.right))>G.EPS);
      close(G.dot(G.sub(others[0],o.right),G.sub(others[1],o.right)),0,'triangle right angle');
      if(o.mode==='difference')close(o.base.area,o.helper.area+o.result.area,'original edge is hypotenuse');
      else close(o.result.area,o.base.area+o.helper.area,'new edge is hypotenuse');
    }
  }
}
function finishStep(g,p){
  g.commit({type:'triangle',...p});verifyMosaic(g.state);
  assert.equal(g.state.objects.at(-1).revealed,false);
  g.commit({type:'helper'});verifyMosaic(g.state);
  assert.equal(g.state.objects.find(o=>o.type==='triangle'&&o.id===g.state.pending.triangle.id).revealed,false);
  g.commit({type:'result'});verifyMosaic(g.state);assert.equal(g.state.phase,'reveal');
  g.commit({type:'reveal'});verifyMosaic(g.state);
}
const routes=require('./fixtures/wortelbouw-routes.cjs');
test('every diagnostic puzzle has a spatially legal shortest route',()=>{
  routes.forEach((route,index)=>{
    const g=new G.Game(index);g.commit({type:'start',k:route.start});
    for(const [mode,k,edgeIndex,flip] of route.steps)finishStep(g,{owner:g.state.active,mode,k,edgeIndex,flip});
    assert.equal(g.state.phase,'won');assert.equal(g.state.steps,G.levels[index].best);
    assert.equal(g.state.objects.find(o=>o.id===g.state.active).area,G.levels[index].n);
    if(route.n===14){const t=g.state.objects.find(o=>o.id==='t2');assert(Math.abs(t.base.b.x-t.base.a.x)>.1&&Math.abs(t.base.b.y-t.base.a.y)>.1,'second step is off the global grid')}
  });
});
test('all ruler values, orientations and reflections produce exact right triangles and connected squares',()=>{
  let checked=0;
  for(const angle of [0,.371,1.83])for(let start=1;start<=5;start++)for(const mode of ['sum','difference'])for(let k=1;k<=5;k++)for(let edgeIndex=0;edgeIndex<4;edgeIndex++)for(const flip of [false,true]){
    const g=new G.Game();g.commit({type:'start',k:start});
    g.state.objects[0].points=g.state.objects[0].points.map(p=>({x:p.x*Math.cos(angle)-p.y*Math.sin(angle)+19,y:p.x*Math.sin(angle)+p.y*Math.cos(angle)-37}));
    const p=G.plan(g.state,'s0',edgeIndex,k,mode,flip);
    if(mode==='difference'&&k>=start){assert.equal(p,null);continue}
    assert(p?.valid);finishStep(g,{owner:'s0',edgeIndex,k,mode,flip});checked++;
  }
  assert.equal(checked,840);
});
test('shared edges and vertices are legal; positive area overlap and a used side are refused',()=>{
  const a=[{x:0,y:0},{x:2,y:0},{x:2,y:2},{x:0,y:2}];
  assert.equal(G.overlap(a,a.map(p=>({...p,x:p.x+2}))),false);
  assert.equal(G.overlap(a,a.map(p=>({x:p.x+2,y:p.y+2}))),false);
  assert.equal(G.overlap(a,a.map(p=>({...p,x:p.x+1.99}))),true);
  const g=new G.Game(11);g.commit({type:'start',k:3});finishStep(g,{owner:'s0',edgeIndex:0,k:2,mode:'sum',flip:false});
  assert.equal(G.plan(g.state,'s0',0,1,'sum',false),null,'cannot attach twice to the same edge');
  let blocked;
  for(const square of g.state.objects.filter(o=>o.type==='square'))for(let e=0;e<4;e++)for(let k=1;k<=5;k++)for(const flip of [false,true]){
    const p=G.plan(g.state,square.id,e,k,'sum',flip);if(p&&!p.valid)blocked=p;
  }
  assert(blocked,'there are real spatial collisions');const before=JSON.stringify(g.state);
  assert.throws(()=>g.commit({type:'triangle',...blocked}),/overlapt/);assert.equal(JSON.stringify(g.state),before);
});
test('undo restores each physical piece, cancels completed reveals and supports branching',()=>{
  const g=new G.Game(5);const states=[JSON.stringify(g.state)];
  for(const action of [{type:'start',k:3},{type:'triangle',owner:'s0',edgeIndex:0,k:2,mode:'sum',flip:false},{type:'helper'},{type:'result'}]){
    g.commit(action);states.push(JSON.stringify(g.state));
  }
  g.commit({type:'reveal'});assert.equal(g.state.phase,'won');
  for(let i=3;i>=0;i--){g.undo();assert.equal(JSON.stringify(g.state),states[i]);verifyMosaic(g.state)}
  g.commit({type:'start',k:4});finishStep(g,{owner:'s0',edgeIndex:1,k:1,mode:'difference',flip:true});
  assert.equal(g.state.objects.at(-1).area,15);
});
test('area-only breadth-first search confirms the campaign lower bounds',()=>{
  for(const level of G.levels){
    const limit=level.maxLength||5,seen=new Map(Array.from({length:limit},(_,i)=>[(i+1)**2,0])),q=[...seen.keys()];
    while(q.length){const n=q.shift(),d=seen.get(n);if(d>=3)continue;for(let k=1;k<=limit;k++)for(const sign of [1,-1]){const next=n+sign*k*k;if(next>0&&!seen.has(next)){seen.set(next,d+1);q.push(next)}}}
    // A construction must include a right triangle, even if the target is an integer.
    assert.equal(Math.max(1,seen.get(level.n)),level.best);
  }
});
test('difference works on an irrational hypotenuse, and the longer sum route for 15 is also playable',()=>{
  const g=new G.Game(11);g.commit({type:'start',k:4});
  finishStep(g,{owner:'s0',mode:'difference',k:1,edgeIndex:1,flip:false});
  finishStep(g,{owner:'s1',mode:'difference',k:1,edgeIndex:3,flip:true});
  assert.equal(g.state.phase,'won');assert.equal(g.state.objects.find(o=>o.id==='t2').base.area,15);
  const h=new G.Game(9);h.commit({type:'start',k:3});
  for(const [k,edgeIndex,flip]of [[2,0,false],[1,3,false],[1,1,true]])finishStep(h,{owner:h.state.active,mode:'sum',k,edgeIndex,flip});
  assert.equal(h.state.phase,'won');assert.equal(h.state.steps,3);
});
module.exports={routes};

test('larger rulers are introduced by level and equivalent roots share the exact goal',()=>{
  const g=new G.Game();assert.throws(()=>g.commit({type:'start',k:6}),/liniaal/);
  const large=new G.Game(12);large.commit({type:'start',k:10});assert.equal(large.state.objects[0].area,100);
  assert.equal(G.plan(g.state,'s0',0,6),null);
  assert.equal(G.levels[1].n,3**2*2);assert.equal(G.goalLabel(G.levels[1]),'3√2');
  assert.equal(G.maxLength(new G.Game(7).state),6);assert.equal(G.maxLength(large.state),10);
});
