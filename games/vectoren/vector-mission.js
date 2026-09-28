/* Presentation-only helpers. The existing core owns task generation and assessment. */
(function(root){
'use strict';
const STATIONS=[
 {id:'koerscentrum',number:1,name:'Koerscentrum',subtitle:'richting · zin · lengte',icon:'🧭',goal:'Herken wat een vector bepaalt en wanneer twee vectoren gelijk zijn.',skills:['props','equal','free']},
 {id:'stuwkrachtlab',number:2,name:'Stuwkrachtlab',subtitle:'veelvouden en tegengestelden',icon:'🚀',goal:'Vergroot, verklein en keer vectoren om met scalaire factoren.',skills:['opposite','scalar']},
 {id:'dockingzone',number:3,name:'Dockingzone',subtitle:'vectoren optellen',icon:'↗',goal:'Combineer verplaatsingen met kop-staart en parallellogram.',skills:['sum','headtail','commute','parallelogram','difference','figure']},
 {id:'navigatienet',number:4,name:'Navigatienet',subtitle:'coördinaten en componenten',icon:'▦',goal:'Lees en bereken vectorcoördinaten en navigeer tussen punten.',skills:['coords','arrow','ab','points','basis','coordadd','coordscale','coordcombo']},
 {id:'manoeuvreveld',number:5,name:'Manoeuvreveld',subtitle:'ontbinden en combineren',icon:'✦',goal:'Gebruik meerdere vectorideeën samen in complexe manoeuvres.',skills:['decompose','combination','unknown','route','fourth']}
];
const BATTLE_MIXED_SKILLS=['decompose','figure','headtail','difference','parallelogram','combination','sum'];
const STATION_BY_SKILL=Object.fromEntries(STATIONS.flatMap(st=>st.skills.map(id=>[id,st.id])));
const stationOfSkill=id=>STATIONS.find(st=>st.id===STATION_BY_SKILL[id])||STATIONS[0];

// Reserve the complete construction before drawing; learner input never changes the zoom.
function boardBounds(task,steps,math){
 const points=[...task.points.map(p=>p.p),...(task.segments||[]).flat(),...task.refs.flatMap(r=>[r.start,math.endPointFromVector(r.start,r.v)])];
 const constructing=['sketch','point'].includes(task.interaction);
 if(constructing)points.push(task.start);
 if(task.interaction==='sketch'&&task.target)points.push(math.endPointFromVector(task.start,task.target));
 if(task.targetPoint)points.push(task.targetPoint);
 if(task.axes||task.skill==='headtail')points.push(math.point(0,0));
 if(task.choicePositions)task.options.forEach((v,i)=>points.push(task.choicePositions[i],math.endPointFromVector(task.choicePositions[i],v)));
 // All example steps share one frame, also when opening help halfway through a task.
 for(const step of steps){
  for(const s of step.strokes)points.push(s.start,s.end);
  if(step.point)points.push(step.point);
 }
 let parts=task.parts;
 if(['difference','combination'].includes(task.skill))parts=[math.scale(task.refs[0].v,task.factor??1),math.scale(task.refs[1].v,-1)];
 if(task.skill==='route'&&constructing)parts=[math.scale(task.operands[0],2),math.scale(task.operands[1],3),math.scale(task.operands[2],-1)];
 // Every partial sum fits, including reverse order and cancelling intermediate steps.
 if(parts&&constructing)for(const start of [task.start,task.secondStart].filter(Boolean)){
  let ends=[start];
  for(const part of parts)ends=ends.concat(ends.map(p=>math.endPointFromVector(p,part)));
  points.push(...ends);
 }
 if(task.dirs?.length===2){
  const [a,b]=task.dirs,det=math.cross(a,b);
  if(Math.abs(det)>1e-9)points.push(math.endPointFromVector(task.start,math.scale(a,math.cross(task.target,b)/det)),math.endPointFromVector(task.start,math.scale(b,math.cross(a,task.target)/det)));
 }
 // Changing direction allows any equally long arrow, not only the example direction.
 if(task.skill==='props'&&task.property==='direction'){
  const r=math.length(task.source),p=task.start;
  points.push(math.point(p.x-r,p.y-r),math.point(p.x+r,p.y+r));
 }
 if(!points.length)points.push(task.start||math.point(0,0));
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
 // One spare grid interval around the work, with a usable minimum for tiny/zero vectors.
 const rx=Math.max(2,(maxX-minX)/2+1),ry=Math.max(2,(maxY-minY)/2+1);
 return {minX:cx-rx,maxX:cx+rx,minY:cy-ry,maxY:cy+ry};
}
function boardView(bounds,width,height){
 const pad=24,unit=Math.min(96,(width-2*pad)/(bounds.maxX-bounds.minX),(height-2*pad)/(bounds.maxY-bounds.minY));
 if(unit<=0)return null;
 const cx=(bounds.minX+bounds.maxX)/2,cy=(bounds.minY+bounds.maxY)/2;
 return {minX:Math.ceil(cx-(width-2*pad)/(2*unit)),maxX:Math.floor(cx+(width-2*pad)/(2*unit)),minY:Math.ceil(cy-(height-2*pad)/(2*unit)),maxY:Math.floor(cy+(height-2*pad)/(2*unit)),w:width,h:height,unit,ox:width/2-cx*unit,oy:height/2+cy*unit};
}

// Place the full label (including its vector accent) beside the shaft in screen pixels.
function placeVectorLabel(a,b,width,height,viewport,segments,occupied){
 const overlaps=(r,q)=>r.x<q.x+q.width&&r.x+r.width>q.x&&r.y<q.y+q.height&&r.y+r.height>q.y;
 const crosses=(r,s)=>{
  let lo=0,hi=1;
  for(const [start,delta,min,max] of [[s.a.x,s.b.x-s.a.x,r.x-6,r.x+r.width+6],[s.a.y,s.b.y-s.a.y,r.y-6,r.y+r.height+6]]){
   if(Math.abs(delta)<1e-8){if(start<min||start>max)return false;}
   else {const t1=(min-start)/delta,t2=(max-start)/delta;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>hi)return false;}
  }
  return true;
 };
 const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),nx=length?-dy/length:1,ny=length?dx/length:0;
 const radius=Math.abs(nx)*width/2+Math.abs(ny)*height/2;
 let best=null,bestScore=Infinity;
 for(const gap of [10,18,28,42,60,80,110])for(const t of [.5,.35,.65,.2,.8,.05,.95,-.15,1.15])for(const side of [1,-1]){
  const cx=a.x+dx*t+nx*(radius+gap)*side,cy=a.y+dy*t+ny*(radius+gap)*side;
  const x=Math.max(6,Math.min(viewport.w-width-6,cx-width/2)),y=Math.max(6,Math.min(viewport.h-height-6,cy-height/2));
  const r={x,y,width,height},padded={x:x-4,y:y-4,width:width+8,height:height+8};
  const hits=segments.filter(s=>crosses(r,s)).length+occupied.filter(q=>overlaps(padded,q)).length;
  const score=hits*10000+gap+Math.abs(t-.5)*40+Math.hypot(x+width/2-cx,y+height/2-cy);
  if(score<bestScore){best=r;bestScore=score;}
 }
 return best;
}

function headtailSteps(task, answer, math){
 const lines=answer.strokes.filter(s=>s.role!=='result');
 const orders=task.policy==='ordered'?[[0,1]]:[[0,1],[1,0]];
 let best={count:0,order:orders[0],accepted:[]};
 for(const order of orders){
  let start=task.start;const accepted=[];
  for(const index of order){
   const line=lines.find(s=>!accepted.includes(s)&&math.samePoint(s.start,start)&&math.vectorEquals(s,task.parts[index]));
   if(!line)break;accepted.push(line);start=line.end;
  }
  if(accepted.length>best.count)best={count:accepted.length,order,accepted};
 }
 const end=math.endPointFromVector(task.start,task.target);
 const result=answer.strokes.find(s=>s.role==='result'&&math.samePoint(s.start,task.start)&&math.samePoint(s.end,end));
 return {...best,result,count:best.count===2&&result?3:best.count};
}
// Keep usable construction steps when a learner dismisses error feedback.
function retryStrokes(task,strokes,math,validate){
 if(task.interaction!=='sketch')return strokes;
 const expected=[],add=(start,v)=>expected.push({start,v});
 if(task.policy==='headtail'||task.policy==='ordered'){
  const orders=task.policy==='ordered'?[[0,1]]:[[0,1],[1,0]];
  const routes=orders.map(order=>{
   let p=task.start;const steps=order.map(i=>{const s={start:p,v:task.parts[i]};p=math.endPointFromVector(p,task.parts[i]);return s;});
   const matches=strokes.map((s,i)=>steps.some(e=>math.samePoint(s.start,e.start)&&math.vectorEquals(s,e.v))?i:-1).filter(i=>i>=0);
   return {steps,count:matches.length,first:matches[0]??Infinity};
  }).sort((a,b)=>b.count-a.count||a.first-b.first);
  expected.push(...routes[0].steps);add(task.start,task.target);
 }else if(task.policy==='commute'){
  for(const order of [[0,1],[1,0]]){let p=order[0]===1?task.secondStart:task.start;add(p,task.target);for(const i of order){add(p,task.parts[i]);p=math.endPointFromVector(p,task.parts[i]);}}
 }else if(task.policy==='parallelogram'){
  const [u,v]=task.parts;add(math.endPointFromVector(task.start,u),v);add(math.endPointFromVector(task.start,v),u);add(task.start,task.target);
 }else if(task.policy==='decompose'){
  const [a,b]=task.dirs,det=math.cross(a,b);if(Math.abs(det)<1e-9)return strokes;
  const components=[math.scale(a,math.cross(task.target,b)/det),math.scale(b,math.cross(a,task.target)/det)];
  return strokes.filter(s=>{const i=components.findIndex(v=>math.vectorEquals(s,v));if(i<0)return false;components.splice(i,1);return true;});
 }else if(task.acceptChain){
  // In free combinations, intermediate scalar multiples may still be useful.
  return strokes.filter(s=>math.samePoint(s.start,task.start)&&math.vectorEquals(s,task.target)||task.refs.some(r=>math.isScalarMultiple(s,r.v)));
 }else return strokes.filter(s=>validate(task,{strokes:[s]}).ok).slice(-1);
 return strokes.filter(s=>expected.some(e=>math.samePoint(s.start,e.start)&&math.vectorEquals(s,e.v)));
}
function diagnostic(task,answer,math,fallback){
 if(task.skill!=='headtail')return fallback;
 const route=headtailSteps(task,answer,math);
 const results=answer.strokes.filter(s=>s.role==='result');
 const end=math.endPointFromVector(task.start,task.target);
 if(route.count>=2&&results.some(s=>math.samePoint(s.end,end)&&!math.samePoint(s.start,task.start)))return 'Je resultante eindigt goed, maar start nog niet in P.';
 if(route.count===1){
  const other=route.order[1],name=other===0?'u':'v',first=route.order[0]===0?'u':'v';
  if(answer.strokes.some(s=>s.role!=='result'&&math.vectorEquals(s,task.parts[other])&&!math.samePoint(s.start,route.accepted[0].end)))return `Vector ${name} zelf klopt, maar begint nog niet aan de kop van ${first}. Je eerste pijl blijft staan.`;
 }
 return fallback;
}
function streak(days,now=new Date()){
 const date=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate()).toLocaleDateString('sv-SE');
 const set=new Set(days),cursor=new Date(now);let count=0;
 if(!set.has(date(cursor)))cursor.setDate(cursor.getDate()-1);
 while(set.has(date(cursor))){count++;cursor.setDate(cursor.getDate()-1)}
 return count;
}
// Percent anchors are shared by the path SVG and the HTML stop buttons.
function stationLayout(count){
 const columns=count<=3?count:count<=6?3:4,rows=Math.ceil(count/columns);
 return Array.from({length:count},(_,i)=>{
  const row=Math.floor(i/columns),inRow=Math.min(columns,count-row*columns),index=i%columns;
  const x=inRow===1?50:(columns===4?14:20)+(row%2?inRow-1-index:index)*(columns===4?72:60)/(inRow-1);
  const portraitRow=Math.floor(i/2),portraitRows=Math.ceil(count/2),lastAlone=count%2&&i===count-1;
  return {x,y:rows===1?48:28+row*44,px:lastAlone?50:((portraitRow%2?1-i%2:i%2)===0?25:75),py:portraitRows===1?48:14+portraitRow*72/(portraitRows-1)};
 });
}
function skillArt(id){
 const paths={
  arrows:'M9 31L32 9M25 9h7v7M16 39l23-23M32 16h7v7',
  scalar:'M8 36L36 8M27 8h9v9M25 39l14-14M32 25h7v7',
  sum:'M8 33h16V12M18 12h6v6M8 33L35 12M28 12h7v7',
  headtail:'M7 36h17V12M17 12h7v7M7 36l30-24M30 12h7v7',
  parallelogram:'M9 35V16l25-7v19L9 35M9 35L34 9M26 11l8-2v8',
  decompose:'M9 37V10M9 37h29M9 37L34 12M27 12h7v7',
  coords:'M8 24h32M24 40V8M35 20l5 4-5 4M20 13l4-5 4 5M24 24l11-9M29 15h6v6',
  route:'M7 37l10-15 12 5 12-17M34 10h7v7',
  equal:'M6 25L21 10M14 10h7v7M24 38l15-15M32 23h7v7',
  opposite:'M8 34L33 9M26 9h7v7M39 16L17 38M17 31v7h7'
 };
 const key=['scalar','coordscale'].includes(id)?'scalar':['sum','coordadd'].includes(id)?'sum':['headtail','commute'].includes(id)?'headtail':id==='parallelogram'?'parallelogram':id==='decompose'?'decompose':['coords','arrow','ab','points','basis','unknown','fourth'].includes(id)?'coords':['opposite','difference'].includes(id)?'opposite':['combination','coordcombo','route','figure'].includes(id)?'route':id==='equal'?'equal':'arrows';
 return `<svg class="mission-symbol" viewBox="0 0 48 48" aria-hidden="true"><path d="${paths[key]}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
const api={STATIONS,BATTLE_MIXED_SKILLS,stationOfSkill,headtailSteps,retryStrokes,diagnostic,streak,stationLayout,skillArt,boardBounds,boardView,placeVectorLabel};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VectorMission=Object.freeze(api);
})(typeof window!=='undefined'?window:globalThis);
