/* Wortelbouw: exact integer areas, local Euclidean coordinates.
   Based on the constructions in the Axioma v0.4 prototype. No camera rules here. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WortelbouwGeometry=api})(globalThis,()=>{
  'use strict';
  const EPS=1e-8;
  const levels=[
    {n:2,kind:'length',best:1,title:'De eerste wortel',hint:'Probeer twee even lange benen.',lesson:'1² + 1² = 2. De schuine zijde is dus √2.'},
    {n:18,kind:'length',label:'3√2',best:1,title:'Drie keer zo lang',hint:'Denk terug aan √2. Maak beide benen drie keer zo lang.',lesson:'(3√2)² = 9 × 2 = 18. Driemaal de lengte geeft negenmaal de oppervlakte.'},
    {n:5,kind:'length',best:1,title:'Ongelijke benen',hint:'Ook twee verschillende maten kunnen samen een wortel maken.',lesson:'1² + 2² = 5. De twee benen hoeven niet even lang te zijn.'},
    {n:25,kind:'length',label:'5',best:1,title:'Een bekende driehoek',hint:'Bouw 5 als schuine zijde met twee verschillende benen.',lesson:'3² + 4² = 5²: de bekende 3–4–5-driehoek. Een wortel kan ook een geheel getal zijn.'},
    {n:100,kind:'length',label:'10',best:1,maxLength:10,title:'Dubbel zo groot',hint:'Bouw 10 als schuine zijde. Denk terug aan 3–4–5 en verdubbel beide benen.',lesson:'6–8–10 is tweemaal 3–4–5. De lengtes verdubbelen; de oppervlakten worden viermaal zo groot.'},
    {n:13,kind:'length',best:1,title:'Twee kwadraten samen',hint:'Welke twee kwadraten vormen samen 13?',lesson:'De oppervlakten op de benen vormen samen de oppervlakte op de schuine zijde.'},
    {n:12,kind:'length',best:1,title:'Een vierkant eraf',hint:'Gebruik een bestaande zijde als schuine zijde.',lesson:'Bij een verschil is de bestaande zijde de schuine zijde: je trekt een oppervlakte af.'},
    {n:11,kind:'length',best:1,maxLength:6,title:'Een maatje groter',hint:'Je liniaal gaat nu tot 6. Welk verschil van kwadraten geeft 11?',lesson:'6² − 5² = 36 − 25 = 11. Een kleine wortel kan uit twee grote vierkanten ontstaan.'},
    {n:7,kind:'area',best:1,title:'Denk in oppervlakte',hint:'Nu is de oppervlakte je doel. Welke zijde hoort daarbij?',lesson:'Oppervlakte 7 en zijde √7 horen bij hetzelfde vierkant.'},
    {n:15,kind:'length',best:1,title:'Net geen vier',hint:'15 ligt vlak onder een kwadraat.',lesson:'16 − 1 = 15. De gevonden lengte √15 is iets kleiner dan 4.'},
    {n:21,kind:'length',best:1,title:'Kies je verschil',hint:'Zoek een kwadraat boven 21 en haal er een kleiner kwadraat af.',lesson:'25 − 4 = 21. Oppervlakten helpen je om een onbekende lengte te bouwen.'},
    {n:14,kind:'length',best:2,title:'Bouw verder',hint:'Niet alles lukt in één stap. Gebruik een gevonden zijde opnieuw.',lesson:'Het koord bewaart je nieuwe lengte, zodat je op het resultaat kunt verder bouwen.'},
    {n:6,kind:'length',best:2,compareRoutes:true,title:'Eén wortel, twee manieren',hint:'Bouw √6 eerst op jouw manier. Zoek daarna een route die anders eindigt: met optellen of met aftrekken.',lesson:'Dezelfde lengte √6 kun je met een som én met een verschil van oppervlakten bouwen.'},
    {n:104,kind:'length',best:1,maxLength:10,title:'De grote verrassing',hint:'De liniaal gaat tot 10. Groot hoeft niet ingewikkeld te zijn.',lesson:'10² + 2² = 100 + 4 = 104. Ook deze grote wortel lukt in één bouwstap!'}
  ];
  const maxLength=s=>levels[s.level].maxLength||5;
  const goalLabel=level=>level.label||`√${level.n}`;
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
  function initial(level=0){return {level,objects:[],phase:'start',active:null,pending:null,steps:0,solutions:[]}}
  function startSquare(k,x=0){
    if(!Number.isInteger(k)||k<1||k>10||!Number.isFinite(x))throw Error('Kies een liniaalmaat van 1 tot 10.');
    return {id:'s0',type:'square',role:'result',area:k*k,points:[{x:x-k/2,y:0},{x:x+k/2,y:0},{x:x+k/2,y:k},{x:x-k/2,y:k}],start:true};
  }
  function plan(s,owner,edgeIndex,k,mode='sum',flip=false){
    if(!Number.isInteger(k)||k<1||k>maxLength(s)||!['sum','difference'].includes(mode))return null;
    const square=s.objects.find(o=>o.id===owner&&o.type==='square');
    if(!square||!freeEdges(s,square).some(e=>e.index===edgeIndex))return null;
    const edge=edges(square)[edgeIndex],A=flip?edge.b:edge.a,B=flip?edge.a:edge.b;
    const u=norm(sub(B,A)),out=mul(perp(norm(sub(edge.b,edge.a))),-1);
    const area=mode==='sum'?square.area+k*k:square.area-k*k;
    if(area<=0)return null;
    const c=Math.sqrt(square.area);
    const C=mode==='sum'?add(A,mul(out,k)):add(A,add(mul(u,k*k/c),mul(out,k*Math.sqrt(area)/c)));
    const step=s.steps+1;
    const triangle={id:`t${step}`,type:'triangle',owner,points:ccw([A,B,C]),mode,known:k,
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
    if(action.type==='nextRoute'&&s.phase==='routeDone')return {...initial(s.level),solutions:copy(s.solutions)};
    if(action.type==='start'&&s.phase==='start'){
      if(action.k>maxLength(s))throw Error(`De liniaal gaat hier tot ${maxLength(s)}.`);
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
      const goal=levels[s.level],reached=next.pending.result.area===goal.n;
      next.phase=reached?'won':'choose';
      if(reached&&goal.compareRoutes){
        const mode=next.pending.mode;
        if(!next.solutions.some(route=>route.mode===mode)){
          const equations=[];let owner=next.pending.result.id;
          while(true){
            const t=next.objects.find(o=>o.type==='triangle'&&'s'+o.id.slice(1)===owner);
            if(!t)break;
            equations.unshift({base:t.base.area,helper:t.helper.area,result:t.result.area,mode:t.mode});owner=t.owner;
          }
          next.solutions.push({mode,equations});
        }
        next.phase=next.solutions.length===2?'won':'routeDone';
      }
      next.pending=null;return next;
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
  return {levels,maxLength,goalLabel,Game,initial,startSquare,plan,apply,overlap,sharedBoundary,freeEdges,edges,squareOn,bounds,
    add,sub,mul,dot,cross,len,norm,perp,center,signedArea,EPS};
});
