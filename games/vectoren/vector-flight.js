/* Equal-duration displacement comparison. No scoring or account state. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.VectorFlight=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function model(task){
 if(!task||!['opposite','scalar'].includes(task.skill)||!task.refs[0])return null;
 const reference=task.refs[0],factor=task.skill==='scalar'?task.factor:task.target.dx===0&&task.target.dy===0?0:-1;
 const label=factor===0?'0a':factor===-1?'−a':`${String(factor).replace('-','−').replace('0.5','1/2').replace('1.5','3/2')} a`;
 const ratio=Math.abs(factor),speed=ratio===1?'even snel':ratio===.5?'half zo snel':ratio===1.5?'anderhalf keer zo snel':`${ratio} keer zo snel`;
 const explanation=factor===0?'Het gele schip blijft staan: de nulvector.':`Bij gelijke vliegtijd: ${label} vliegt ${speed}, in ${factor<0?'tegengestelde':'dezelfde'} zin als a.`;
 const index=task.options?.findIndex(v=>v.dx===task.target.dx&&v.dy===task.target.dy);
 const start=task.choicePositions?.[index]||task.start;
 return {factor,label,explanation,routes:[{start:reference.start,v:reference.v,name:'a',color:'#61ddf2'},{start,v:task.target,name:label,color:'#ffd17c'}]};
}
function create({button,meter,status}){
 const NS='http://www.w3.org/2000/svg',duration=3600,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let key=null,layer=null,ships=[],frame=0,elapsed=0,last=0,paused=false;
 const el=(tag,attrs,parent)=>{const e=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e;};
 function craft(parent,color){
   const node=el('g',{color,fill:'#07192b',stroke:color,'stroke-width':2,'stroke-linejoin':'round'},parent);
   const flame=el('path',{d:'M-13 -4L-25 0L-13 4Z',fill:color,stroke:'none',opacity:.8},node);
   el('path',{d:'M4 -4L-10 -14L-16 -13L-11 -3L-11 3L-16 13L-10 14L4 4Z'},node);
   el('path',{d:'M20 0L7 -6L-12 -6L-16 0L-12 6L7 6Z',fill:'#07192b'},node);
   el('ellipse',{cx:6,cy:0,rx:5,ry:3,fill:color,stroke:'none'},node);
  const hull=el('g',{transform:'scale(1.18)'},node);for(const part of [...node.children])if(part!==hull)hull.append(part);
  return {node,flame};
 }
 function park(svg,project,task){
  clear();
  if(!task||!['opposite','scalar'].includes(task.skill)||!task.refs[0])return;
  layer=el('g',{class:'flight-layer','aria-hidden':'true','pointer-events':'none'},svg);
  const reference=task.refs[0],starts=[{p:reference.start,color:'#61ddf2',name:'a',angle:Math.atan2(-reference.v.dy,reference.v.dx)*180/Math.PI}];
  // No answer orientation or correct choice is disclosed before validation.
  if(task.interaction==='sketch')starts.push({p:task.start,color:'#ffd17c',name:'P',angle:-90});
  for(const start of starts){const p=project(start.p),{node,flame}=craft(layer,start.color);node.setAttribute('data-flight-parked',start.name);node.setAttribute('transform',`translate(${p.x} ${p.y}) rotate(${start.angle})`);flame.style.display='none';}
 }
 function ui(){
  const finished=elapsed>=duration;button.textContent=finished?'↻ Opnieuw vliegen':paused?'▶ Vlieg verder':'Ⅱ Pauzeer vlucht';button.hidden=reduced.matches;
  meter.value=Math.min(1,elapsed/duration);
  status.textContent=reduced.matches?'Eindposities · beweging uit volgens je apparaatinstelling.':finished?'Aangekomen · gelijke vliegtijd':paused?'Vlucht gepauzeerd':'Langere pijl = sneller bij gelijke vliegtijd.';
 }
 function position(){const p=Math.min(1,elapsed/duration);for(const s of ships){s.node.setAttribute('transform',`translate(${s.x+s.dx*p} ${s.y+s.dy*p}) rotate(${s.angle})`);s.trail.setAttribute('x2',s.x+s.dx*p);s.trail.setAttribute('y2',s.y+s.dy*p);s.flame.style.display=p<1&&!paused&&s.moving?'':'none';}meter.value=p;}
 function tick(now){frame=0;if(!layer?.isConnected||document.body.dataset.screen!=='play')return;if(last)elapsed=Math.min(duration,elapsed+now-last);last=now;position();if(elapsed<duration&&!paused)frame=requestAnimationFrame(tick);else ui();}
 function schedule(){cancelAnimationFrame(frame);last=0;position();ui();if(!paused&&elapsed<duration)frame=requestAnimationFrame(tick);}
 function clear(){cancelAnimationFrame(frame);layer?.remove();layer=null;ships=[];key=null;elapsed=0;last=0;}
 function attach(svg,project,data,taskKey){
  cancelAnimationFrame(frame);layer?.remove();
  if(key!==taskKey){key=taskKey;elapsed=reduced.matches?duration:0;paused=false;}
  layer=el('g',{class:'flight-layer','aria-hidden':'true','pointer-events':'none'},svg);ships=[];
  for(const route of data.routes){
   const start=project(route.start),end=project({x:route.start.x+route.v.dx,y:route.start.y+route.v.dy}),dx=end.x-start.x,dy=end.y-start.y,moving=!!(dx||dy);
   const trail=el('line',{x1:start.x,y1:start.y,x2:start.x,y2:start.y,stroke:route.color,'stroke-width':7,opacity:.35,'stroke-linecap':'round'},layer);
   el('circle',{cx:start.x,cy:start.y,r:11,fill:'none',stroke:route.color,'stroke-width':1.5,'stroke-dasharray':'2 4'},layer);
   const {node,flame}=craft(layer,route.color);node.setAttribute('data-flight-vector',route.name);
   ships.push({node,flame,trail,x:start.x,y:start.y,dx,dy,moving,angle:moving?Math.atan2(dy,dx)*180/Math.PI:0});
  }
  schedule();
 }
 button.onclick=()=>{if(!key)return;if(elapsed>=duration){elapsed=0;paused=false;}else paused=!paused;schedule();};
 reduced.addEventListener('change',()=>{if(reduced.matches){elapsed=duration;paused=false;schedule();}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&key&&elapsed<duration){paused=true;schedule();}});
 return {attach,park,clear};
}
return {model,create};
});
