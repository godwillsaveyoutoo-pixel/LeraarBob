/* Wortelbouw: exact integer areas, local Euclidean coordinates.
   Based on the constructions in the Axioma v0.4 prototype. No camera rules here. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WortelbouwGeometry=api})(globalThis,()=>{
  'use strict';
  const EPS=1e-8;
  const levels=[
    {n:13,kind:'length',best:1}, {n:12,kind:'length',best:1},
    {n:14,kind:'length',best:2}, {n:7,kind:'area',best:1},
    {n:15,kind:'length',best:1}, {n:21,kind:'length',best:1}
  ];
  const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y}),sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
  const mul=(a,k)=>({x:a.x*k,y:a.y*k}),dot=(a,b)=>a.x*b.x+a.y*b.y;
  const cross=(a,b)=>a.x*b.y-a.y*b.x,len=a=>Math.hypot(a.x,a.y);
  const norm=a=>mul(a,1/len(a)),perp=a=>({x:-a.y,y:a.x});
  const center=p=>mul(p.reduce(add,{x:0,y:0}),1/p.length);
  const signedArea=p=>p.reduce((sum,a,i)=>sum+cross(a,p[(i+1)%p.length]),0)/2;
  const ccw=p=>signedArea(p)<0?[...p].reverse():p;
  const edges=o=>o.points.map((a,i)=>({a,b:o.points[(i+1)%o.points.length],index:i,owner:o.id}));
  const copy=x=>JSON.parse(JSON.stringify(x));
  function overlap(a,b){
    // A separating axis with zero intersection is a legal shared boundary.
    for(const poly of [a,b])for(let i=0;i<poly.length;i++){
      const axis=norm(perp(sub(poly[(i+1)%poly.length],poly[i])));
      const pa=a.map(p=>dot(p,axis)),pb=b.map(p=>dot(p,axis));
      if(Math.min(Math.max(...pa),Math.max(...pb))-Math.max(Math.min(...pa),Math.min(...pb))<=EPS)return false;
    }
    return true;
  }
  function sharedBoundary(e,f){
    const d=sub(e.b,e.a),length=len(d),u=mul(d,1/length);
    if(Math.abs(cross(u,sub(f.a,e.a)))>EPS||Math.abs(cross(u,sub(f.b,e.a)))>EPS)return false;
    const a=dot(sub(f.a,e.a),u),b=dot(sub(f.b,e.a),u);
    return Math.min(length,Math.max(a,b))-Math.max(0,Math.min(a,b))>EPS;
  }
  function freeEdges(s,square){return edges(square).filter(e=>!s.objects.some(o=>o.id!==square.id&&edges(o).some(f=>sharedBoundary(e,f))))}
  function squareOn(edge,triangle,role,id){
    const v=sub(edge.b,edge.a),normal=perp(norm(v));
    const sign=cross(v,sub(center(triangle.points),edge.a))>0?-1:1;
    const offset=mul(normal,Math.sqrt(edge.area)*sign);
    return {id,type:'square',role,area:edge.area,points:ccw([edge.a,edge.b,add(edge.b,offset),add(edge.a,offset)])};
  }
  function initial(level=0){return {level,objects:[],phase:'start',active:null,pending:null,steps:0}}
  function startSquare(k,x=0){
    if(!Number.isInteger(k)||k<1||k>5||!Number.isFinite(x))throw Error('Kies een liniaalmaat van 1 tot 5.');
    return {id:'s0',type:'square',role:'result',area:k*k,points:[{x:x-k/2,y:0},{x:x+k/2,y:0},{x:x+k/2,y:k},{x:x-k/2,y:k}],start:true};
  }
  function plan(s,owner,edgeIndex,k,mode='sum',flip=false){
    if(!Number.isInteger(k)||k<1||k>5||!['sum','difference'].includes(mode))return null;
    const square=s.objects.find(o=>o.id===owner&&o.type==='square');
    if(!square||!freeEdges(s,square).some(e=>e.index===edgeIndex))return null;
    const edge=edges(square)[edgeIndex],A=flip?edge.b:edge.a,B=flip?edge.a:edge.b;
    const u=norm(sub(B,A)),out=mul(perp(norm(sub(edge.b,edge.a))),-1);
    const area=mode==='sum'?square.area+k*k:square.area-k*k;
    if(area<=0)return null;
    const c=Math.sqrt(square.area);
    const C=mode==='sum'?add(A,mul(out,k)):add(A,add(mul(u,k*k/c),mul(out,k*Math.sqrt(area)/c)));
    const step=s.steps+1;
    const triangle={id:`t${step}`,type:'triangle',points:ccw([A,B,C]),mode,known:k,
      base:{a:A,b:B,area:square.area},helper:{a:A,b:C,area:k*k},result:{a:B,b:C,area},
      right:mode==='sum'?A:C,revealed:false};
    const helper=squareOn(triangle.helper,triangle,'helper',`h${step}`);
    const result=squareOn(triangle.result,triangle,'result',`s${step}`);
    const pieces=[triangle,helper,result];let blocked=null;
    for(let i=0;i<pieces.length;i++)if([...s.objects,...pieces.slice(0,i)].some(o=>overlap(o.points,pieces[i].points))){blocked=pieces[i].type==='triangle'?'driehoek':pieces[i].role==='helper'?'hulpvierkant':'resultaatvierkant';break}
    return {owner,edgeIndex,k,mode,flip,triangle,helper,result,valid:!blocked,blocked};
  }
  function apply(s,action){
    const next=copy(s);
    if(action.type==='start'&&s.phase==='start'){
      next.objects=[startSquare(action.k,action.x)];next.active='s0';next.phase='choose';return next;
    }
    if(action.type==='triangle'&&s.phase==='choose'){
      const p=plan(s,action.owner,action.edgeIndex,action.k,action.mode,action.flip);
      if(!p||!p.valid)throw Error(p?`Het ${p.blocked} overlapt een tegel. Spiegel of kies een andere zijde.`:'Deze maat past niet bij de gekozen zijde.');
      next.objects.push(p.triangle);next.active=action.owner;next.pending=p;next.phase='helper';return next;
    }
    if(action.type==='helper'&&s.phase==='helper'){
      next.objects.push(next.pending.helper);next.phase='result';return next;
    }
    if(action.type==='result'&&s.phase==='result'){
      next.objects.push(next.pending.result);next.active=next.pending.result.id;next.steps++;next.phase='reveal';return next;
    }
    if(action.type==='reveal'&&s.phase==='reveal'){
      next.objects.find(o=>o.id===s.pending.triangle.id).revealed=true;
      next.phase=next.pending.result.area===levels[s.level].n?'won':'choose';next.pending=null;return next;
    }
    throw Error('Leg eerst het aangegeven stuk.');
  }
  class Game{
    constructor(level=0){this.state=initial(level);this.history=[]}
    commit(action){const next=apply(this.state,action);if(action.type!=='reveal')this.history.push(copy(this.state));this.state=next;return next}
    undo(){if(this.history.length)this.state=this.history.pop();return this.state}
    reset(level=this.state.level){this.state=initial(level);this.history=[]}
  }
  function bounds(objects){
    const p=objects.flatMap(o=>o.points);if(!p.length)return {minX:-3,maxX:3,minY:0,maxY:5};
    return {minX:Math.min(...p.map(p=>p.x)),maxX:Math.max(...p.map(p=>p.x)),minY:Math.min(...p.map(p=>p.y)),maxY:Math.max(...p.map(p=>p.y))};
  }
  return {levels,Game,initial,startSquare,plan,apply,overlap,sharedBoundary,freeEdges,edges,squareOn,bounds,
    add,sub,mul,dot,cross,len,norm,perp,center,signedArea,EPS};
});
