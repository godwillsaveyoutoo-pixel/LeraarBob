(function(){
'use strict';
const $=id=>document.getElementById(id),svg=$('canvas'),NS='http://www.w3.org/2000/svg',KEY='leraarbob-vector-canvas-v1';
const palette=[['Cyaan','#56d9ef'],['Roze','#f17bdc'],['Groen','#71e2b5'],['Geel','#f7d17b'],['Paars','#ba9cff'],['Wit','#eef6ff']];
let shapes=[],history=[],tool='vector',color=palette[0][1],view=null,anchor=null,drag=null,cursor=null;
const pointOK=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&Math.abs(p.x)<10000&&Math.abs(p.y)<10000;
try{const data=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(data))shapes=data.filter(s=>s&&['vector','point','dashed'].includes(s.tool)&&pointOK(s.start)&&pointOK(s.end)&&palette.some(c=>c[1]===s.color)&&typeof s.name==='string').slice(0,200).map(s=>({...s,name:s.name.slice(0,16)}));}catch{$('saveStatus').textContent='Bewaren is niet beschikbaar';}
function save(){try{localStorage.setItem(KEY,JSON.stringify(shapes));$('saveStatus').textContent='Bewaard op dit toestel';}catch{$('saveStatus').textContent='Bewaren is niet beschikbaar';}}
function node(tag,attrs={},text,parent=svg){const e=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))e.setAttribute(key,value);if(text!==undefined)e.textContent=text;parent.append(e);return e;}
const project=p=>({x:view.ox+p.x*view.unit,y:view.oy-p.y*view.unit});
function automaticName(){
 if(tool==='dashed')return '';
 const letters=tool==='point'?'ABCDEFGHIJKLMNOPQRSTUVWXYZ':'uvwabcdefghijklmnopqrstxyz';
 for(let i=0;i<500;i++){const name=letters[i%letters.length]+(i>=letters.length?Math.floor(i/letters.length)+1:'');if(!shapes.some(s=>s.name===name))return name;}
 return '';
}
function controls(){
 for(const b of document.querySelectorAll('[data-tool]'))b.setAttribute('aria-pressed',String(b.dataset.tool===tool));
 for(const b of $('colors').children)b.setAttribute('aria-pressed',String(b.dataset.color===color));
 $('shapeName').placeholder=tool==='dashed'?'Optioneel':'Automatisch: '+automaticName();$('undo').disabled=!history.length&&!anchor;$('clear').disabled=!shapes.length;
}
function hint(){ $('hint').textContent=anchor?'Kies het eindpunt. Escape annuleert.':tool==='point'?'Tik op het rooster om een punt te plaatsen.':tool==='dashed'?'Sleep een stippellijn, of tik begin en einde.':'Sleep een pijl, of tik begin en einde.'; }
function cancel(){anchor=null;drag=null;cursor=null;controls();hint();render();}
for(const b of document.querySelectorAll('[data-tool]'))b.onclick=()=>{tool=b.dataset.tool;cancel();};
for(const [name,value] of palette){const b=document.createElement('button');b.type='button';b.dataset.color=value;b.style.setProperty('--swatch',value);b.setAttribute('aria-label',name);b.title=name;const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');b.append(dot);b.onclick=()=>{color=value;cancel();};$('colors').append(b);}
function remember(){history.push(structuredClone(shapes));if(history.length>50)history.shift();}
function add(start,end){
 if(shapes.length>=200){$('hint').textContent='Het kanvas bevat 200 vormen. Gebruik Ongedaan of begin opnieuw.';return;}
 remember();const name=$('shapeName').value.trim()||automaticName();shapes.push({tool,color,name,start:{...start},end:{...(tool==='point'?start:end)}});$('shapeName').value='';anchor=null;save();controls();hint();render();
}
$('undo').onclick=()=>{if(anchor){cancel();return;}if(!history.length)return;shapes=history.pop();cancel();save();};
$('clear').onclick=()=>{if(!shapes.length)return;remember();shapes=[];cancel();save();$('hint').textContent='Kanvas gewist. Met Ongedaan haal je de tekening terug.';};
function size(){
 const r=svg.getBoundingClientRect();if(!r.width||!r.height)return;
 const pts=shapes.flatMap(s=>[s.start,s.end]);
 const bounds={minX:Math.min(-5,...pts.map(p=>p.x-1)),maxX:Math.max(5,...pts.map(p=>p.x+1)),minY:Math.min(-3,...pts.map(p=>p.y-1)),maxY:Math.max(3,...pts.map(p=>p.y+1))};
 view=VectorMission.boardView(bounds,r.width,r.height);anchor=null;drag=null;controls();hint();render();
}
function render(){
 if(!view)return;
 svg.setAttribute('viewBox',`0 0 ${view.w} ${view.h}`);svg.replaceChildren();
 for(let x=view.minX;x<=view.maxX;x++){const a=project({x,y:view.minY}),b=project({x,y:view.maxY});node('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:x===0?'#91b9d4':'#29475f','stroke-width':x===0?1.6:1});if(x!==0&&(view.unit>=24||x%2===0)){const q=project({x,y:0});node('text',{x:q.x,y:q.y+17,'text-anchor':'middle',class:'grid-number'},x);}}
 for(let y=view.minY;y<=view.maxY;y++){const a=project({x:view.minX,y}),b=project({x:view.maxX,y});node('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:y===0?'#91b9d4':'#29475f','stroke-width':y===0?1.6:1});if(y!==0&&(view.unit>=24||y%2===0)){const q=project({x:0,y});node('text',{x:q.x-8,y:q.y+4,'text-anchor':'end',class:'grid-number'},y);}}
 const segments=[],occupied=[],labels=[];
 function draw(s,preview=false){
  const a=project(s.start),b=project(s.end),g=node('g',{'data-shape':s.tool,color:s.color,opacity:preview?0.55:1});
  if(s.tool==='point'){node('circle',{cx:a.x,cy:a.y,r:5.5,fill:s.color,stroke:'#091b30','stroke-width':2},undefined,g);occupied.push({x:a.x-9,y:a.y-9,width:18,height:18});}
  else{
   segments.push({a,b});const length=Math.hypot(b.x-a.x,b.y-a.y);
   if(length<.1&&s.tool==='vector')node('circle',{cx:a.x,cy:a.y,r:7,fill:'none',stroke:s.color,'stroke-width':4},undefined,g);
   else node('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:s.color,'stroke-width':s.tool==='vector'?4:2.5,'stroke-linecap':'round','stroke-dasharray':s.tool==='dashed'?'7 7':'none'},undefined,g);
   if(s.tool==='vector'&&length>.1){const dx=(b.x-a.x)/length,dy=(b.y-a.y)/length,n=Math.min(13,length*.55);node('path',{d:`M${b.x} ${b.y}L${b.x-n*dx-n*.46*dy} ${b.y-n*dy+n*.46*dx}L${b.x-n*dx+n*.46*dy} ${b.y-n*dy-n*.46*dx}Z`,fill:s.color},undefined,g);occupied.push({x:b.x-n,y:b.y-n,width:n*2,height:n*2});}
  }
  if(s.name&&!preview){const group=node('g',{class:'shape-name'},undefined,g),label=node('text',{x:0,y:0,fill:s.color},s.name,group),box=label.getBBox();
   if(s.tool==='vector'){const y=box.y-5,w=Math.max(10,box.width);node('path',{d:`M0 ${y}H${w}M${w-4} ${y-3}L${w} ${y}L${w-4} ${y+3}`,stroke:s.color,'stroke-width':1.8,fill:'none'},undefined,group);}
   labels.push({group,a,b});
  }
 }
 shapes.forEach(s=>draw(s));
 if(drag?.moved&&tool!=='point')draw({tool,color,name:'',start:drag.start,end:drag.last},true);
 for(const {group,a,b} of labels){const r=group.getBBox(),p=VectorMission.placeVectorLabel(a,b,r.width,r.height,view,segments,occupied);group.setAttribute('transform',`translate(${p.x-r.x} ${p.y-r.y})`);occupied.push(p);}
 for(const p of [anchor,cursor].filter(Boolean)){const q=project(p);node('circle',{cx:q.x,cy:q.y,r:10,fill:'none',stroke:color,'stroke-width':2,'stroke-dasharray':'3 3'});}
}
function snap(x,y){if(!view)return null;const r=svg.getBoundingClientRect();if(x<r.left||x>r.right||y<r.top||y>r.bottom)return null;const p={x:Math.round((x-r.left-view.ox)/view.unit),y:Math.round((view.oy-y+r.top)/view.unit)};return p.x>=view.minX&&p.x<=view.maxX&&p.y>=view.minY&&p.y<=view.maxY?p:null;}
function tap(p){if(tool==='point'){add(p,p);return;}if(anchor){const start=anchor;anchor=null;add(start,p);}else{anchor=p;controls();hint();render();}}
svg.addEventListener('pointerdown',e=>{if(drag||e.button>0)return;const p=snap(e.clientX,e.clientY);if(!p)return;e.preventDefault();svg.focus({preventScroll:true});cursor=null;drag={id:e.pointerId,start:p,last:p,x:e.clientX,y:e.clientY,moved:false};svg.setPointerCapture(e.pointerId);});
svg.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;const p=snap(e.clientX,e.clientY);if(!p)return;drag.last=p;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6){drag.moved=true;render();}});
svg.addEventListener('pointerup',e=>{if(drag?.id!==e.pointerId)return;const d=drag,p=snap(e.clientX,e.clientY);drag=null;if(!p){cancel();return;}if(d.moved&&tool!=='point'){anchor=null;add(d.start,p);}else tap(p);});
svg.addEventListener('pointercancel',cancel);
svg.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();cancel();return;}if(!view)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(e.key)){e.preventDefault();cursor||={x:0,y:0};if(e.key==='Enter'||e.key===' ')tap({...cursor});else{cursor.x=Math.max(view.minX,Math.min(view.maxX,cursor.x+(e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0)));cursor.y=Math.max(view.minY,Math.min(view.maxY,cursor.y+(e.key==='ArrowDown'?-1:e.key==='ArrowUp'?1:0)));render();}}});
controls();hint();new ResizeObserver(size).observe(svg);
window.VectorCanvas=Object.freeze({inspect:()=>structuredClone({shapes,tool,color,view}),project:p=>project(p)});
})();
