/* Direct manipulation of a local glass draft; no XP or mastery writes. */
(() => {
'use strict';
const C=window.GlasatelierCore,KEY='leraarbob-glasatelier-draft-v1',NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id),board=$('glass-board'),stage=document.querySelector('.glass-stage');
let state=C.initial(),cursor={x:0,y:0},wrong=[],gesture=null,geometry=null,serial=0;
try{state=C.restore(JSON.parse(localStorage.getItem(KEY)));document.documentElement.dataset.mode=localStorage.getItem('axioma-mode')==='dark'?'dark':'light';}catch{}
const pattern=()=>C.PATTERNS.find(p=>p.id===state.pattern),free=()=>state.mode==='design',draft=()=>free()?state.free:state.drafts[state.pattern];
const complete=()=>!free()&&draft().count===pattern().lines.length;
const lines=()=>free()?draft().lines:pattern().lines.slice(0,draft().count);
const painting=()=>complete()||state.tool==='paint';
const preset=()=>free()?{...pattern(),scheme:'mosaic',colors:C.PALETTE.map(c=>c.hex)}:pattern();
const copyPoints=points=>points.map(p=>p?{...p}:null);
function node(tag,attrs={},text){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('save-status').textContent='Automatisch bewaard op dit toestel.';}catch{$('save-status').textContent='Bewaren lukt hier niet. Download je raam vóór je afsluit.';}}
function message(text='',kind=''){const e=$('feedback');e.textContent=text;e.dataset.kind=kind;}
function progress(){const count=C.PATTERNS.filter(p=>state.drafts[p.id].done).length,e=$('atelier-progress');e.dataset.value=count;e.dataset.total=C.PATTERNS.length;e.textContent=count+'/'+C.PATTERNS.length+' ramen';window.dispatchEvent(new CustomEvent('axioma:game-progress'));}
function boundsFor(w,h){
 const ratio=Math.max(.2,(w-50)/(h-50));
 const b=ratio>=1?{x:Math.min(16,Math.max(6,Math.round(6*ratio))),y:6}:{x:6,y:Math.min(16,Math.max(6,Math.round(6/ratio)))};
 // Rotation keeps all pending points visible without discarding the work.
 for(const p of draft().points)if(p){b.x=Math.max(b.x,Math.abs(p.x));b.y=Math.max(b.y,Math.abs(p.y));}
 return b;
}
function renderGlass(target,p,accepted,options){
 const {w,h,bounds,grid=false,lit=false,interactive=false,points=[],candidate=null,bad=[],colors={}}=options;
 const margin=interactive?25:18,unit=Math.min((w-margin*2)/(bounds.x*2),(h-margin*2)/(bounds.y*2));
 const cx=w/2,cy=h/2,map=q=>({x:cx+q.x*unit,y:cy-q.y*unit});
 const left=cx-bounds.x*unit,top=cy-bounds.y*unit,pw=2*bounds.x*unit,ph=2*bounds.y*unit;
 const id='glass-'+(++serial),shine=id+'-shine',grain=id+'-grain';target.setAttribute('viewBox',`0 0 ${w} ${h}`);target.replaceChildren();
 const defs=node('defs'),gradient=node('linearGradient',{id:shine,x1:0,y1:0,x2:1,y2:1});
 gradient.append(node('stop',{offset:'0%','stop-color':'#fffefa','stop-opacity':'.5'}),node('stop',{offset:'48%','stop-color':'#fffefa','stop-opacity':'0'}),node('stop',{offset:'100%','stop-color':'#ffd778','stop-opacity':'.18'}));defs.append(gradient);
 const texture=node('filter',{id:grain,x:'0%',y:'0%',width:'100%',height:'100%'});texture.append(node('feTurbulence',{type:'fractalNoise',baseFrequency:'.055',numOctaves:3,seed:7,stitchTiles:'stitch'}),node('feColorMatrix',{type:'saturate',values:0}));defs.append(texture);target.append(defs);
 // A narrow brass frame leaves the entire coordinate plane rectangular and readable.
 target.append(node('rect',{x:left-16,y:top-16,width:pw+32,height:ph+32,rx:Math.min(24,ph*.07),fill:'#b6a078',stroke:'#8c7956','stroke-width':1}),node('rect',{x:left-11,y:top-11,width:pw+22,height:ph+22,rx:8,fill:'#e1d0a3',stroke:'#8d7b58','stroke-width':1.2}));
 const parts=C.cells(accepted,bounds);
 for(let i=0;i<parts.length;i++){
  const cell=parts[i],attrs={points:cell.points.map(q=>{const at=map(q);return at.x+','+at.y;}).join(' '),fill:C.colorFor(cell,colors,i,p),'fill-opacity':lit?'.98':accepted.length?'.8':'.28',stroke:'#25413b','stroke-width':'.7',class:'glass-cell'+(interactive&&painting()?' colorable':''),'data-cell':cell.id};
  if(interactive&&painting())Object.assign(attrs,{tabindex:0,role:'button','aria-label':`Glasvlak ${i+1}, kleuren met kleur ${state.palette+1}`});
  target.append(node('polygon',attrs));
 }
 const gleam=node('g',{'pointer-events':'none'});gleam.append(node('rect',{x:left,y:top,width:pw,height:ph,fill:'url(#'+shine+')'}),node('rect',{x:left,y:top,width:pw,height:ph,filter:'url(#'+grain+')',opacity:'.07'}));target.append(gleam);
 if(grid){
  const group=node('g',{'data-grid':'','pointer-events':'none'}),step=unit<20?2:1,labelSize=unit<24?10:12;
  for(let x=-bounds.x;x<=bounds.x;x++){const at=map({x,y:0});group.append(node('line',{x1:at.x,y1:top,x2:at.x,y2:top+ph,class:x===0?'axis':'grid-line'}));if(x!==0&&x%step===0)group.append(node('text',{x:at.x,y:top+ph+13,'text-anchor':'middle',class:'axis-label','font-size':labelSize},x));}
  for(let y=-bounds.y;y<=bounds.y;y++){const at=map({x:0,y});group.append(node('line',{x1:left,y1:at.y,x2:left+pw,y2:at.y,class:y===0?'axis':'grid-line'}));if(y!==0&&y%step===0)group.append(node('text',{x:left-9,y:at.y+3,'text-anchor':'middle',class:'axis-label','font-size':labelSize},y));}
  group.append(node('text',{x:cx-5,y:cy+13,'text-anchor':'end',class:'axis-label'},'0'),node('text',{x:left+pw-9,y:cy-8,class:'axis-label'},'x'),node('text',{x:cx+8,y:top+13,class:'axis-label'},'y'));target.append(group);
 }
 const addLine=(l,cls,stroke,width)=>{const seg=C.segment(l,bounds);if(!seg)return;const [a,b]=seg.map(map);target.append(node('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:cls,stroke,'stroke-width':width,'stroke-linecap':'round','pointer-events':'none'}));};
 for(const l of accepted){addLine(l,'lead-line','#263e38',interactive?3.5:3);addLine(l,'lead-glint','#eee6c7',.65);}
 if(candidate)addLine(candidate,'candidate'+(bad.length?' wrong':''),bad.length?'#b84d63':'#9d6632',2.5);
 points.forEach((q,i)=>{if(!q)return;const at=map(q);target.append(node('circle',{cx:at.x,cy:at.y,r:7,class:'point-dot'+(bad.includes(i)?' wrong':''),'data-point-marker':i}),node('text',{x:at.x+(at.x>left+pw-30?-14:12),y:at.y+(at.y<top+24?22:-11),class:'point-label'},`${i?'B':'A'} (${q.x}; ${q.y})`));});
 target.append(node('rect',{x:left,y:top,width:pw,height:ph,class:'board-trim',fill:'none',stroke:'#263e38','stroke-width':3.5,'pointer-events':'none'}));
 return {w,h,unit,cx,cy,left,top,pw,ph,bounds,map};
}
function renderBoard(){
 const box=board.getBoundingClientRect(),w=Math.max(120,box.width),h=Math.max(120,box.height),b=boundsFor(w,h);
 const lit=state.light&&painting(),grid=!lit&&(state.grid||!painting()),points=painting()?[]:draft().points;
 geometry=renderGlass(board,preset(),lines(),{w,h,bounds:b,grid,lit,interactive:true,points,candidate:painting()?null:C.fromPoints(points),bad:wrong,colors:draft().colors});
 for(const [key,value]of Object.entries({cx:geometry.cx,cy:geometry.cy,unit:geometry.unit,xLimit:b.x,yLimit:b.y}))board.dataset[key]=value;
 board.setAttribute('aria-label',painting()?'Kies een kleur en tik op een glasvlak.':'Tik twee punten. Sleep een punt om het te verplaatsen; tik het opnieuw om het weg te halen.');
 stage.classList.toggle('is-lit',lit);if(document.activeElement===board&&!painting())showCursor();
}
function showCursor(){board.querySelector('.cursor-ring')?.remove();if(!geometry)return;const q=geometry.map(cursor);board.append(node('circle',{cx:q.x,cy:q.y,r:10,class:'cursor-ring'}));}
function fitFormula(){const e=$('target-formula');e.style.fontSize='';if(e.clientWidth&&e.scrollWidth>e.clientWidth+1){const size=parseFloat(getComputedStyle(e).fontSize);e.style.fontSize=Math.max(14,size*e.clientWidth/(e.scrollWidth+2))+'px';}}
function render(){
 const d=draft(),paint=painting(),all=lines(),p=pattern();
 document.querySelector('.work-panel').classList.toggle('is-painting',paint);$('window-name').textContent=free()?'Eigen glasraam':p.name;
 $('line-progress').replaceChildren(...Array.from({length:free()?C.MAX_LINES:p.lines.length},(_,i)=>{const e=document.createElement('i');if(i<all.length)e.className='done';return e;}));$('line-progress').setAttribute('aria-label',all.length+' van '+(free()?C.MAX_LINES:p.lines.length)+' lijnen getekend');
 $('task-title').textContent=free()?'Jouw lijn':'Teken deze lijn';$('target-formula').textContent=free()?(C.fromPoints(d.points)?C.formula(C.fromPoints(d.points)):'Teken vrij'):complete()?'Raam klaar':C.formula(p.lines[d.count]);
 $('task-copy').textContent=d.points.every(Boolean)?'Sleep een punt. Of tik het weg.':'Tik twee punten. Sleep om te verplaatsen.';
 $('check').disabled=paint||d.points.some(q=>!q);$('clear-points').disabled=!d.points.some(Boolean);$('undo').disabled=!d.history.length&&!all.length;$('undo-option').disabled=$('undo').disabled;
 $('palette-panel').hidden=!paint;$('paint-toggle').disabled=!free()&&!complete();$('paint-toggle').setAttribute('aria-pressed',String(paint));$('paint-toggle').setAttribute('aria-label',paint&&free()?'Verder tekenen':'Glas kleuren');$('light-toggle').disabled=!paint;
 $('light-toggle').setAttribute('aria-pressed',String(state.light&&paint));$('light-toggle').setAttribute('aria-label',state.light&&paint?'Licht uit':'Licht aan');$('light-toggle').title=$('light-toggle').getAttribute('aria-label');
 $('grid-toggle').setAttribute('aria-pressed',String(state.grid));$('formula-open').hidden=!free();$('hint').hidden=free()||complete();
 const colors=preset().colors;for(const b of $('palette').children){const i=Number(b.dataset.color);b.style.setProperty('--swatch',colors[i]);b.setAttribute('aria-pressed',String(i===state.palette));}
 fitFormula();renderBoard();progress();
}
function changed(){wrong=[];message();save();render();}
function tapPoint(p){
 if(!C.isPoint(p))return;const d=draft(),existing=d.points.findIndex(q=>q&&q.x===p.x&&q.y===p.y);C.remember(d,free());
 if(existing>=0)d.points[existing]=null;else d.points[C.slot(d.points,p)]={...p};cursor={...p};changed();
}
function clearPoints(){if(!draft().points.some(Boolean))return;C.remember(draft(),free());draft().points=[null,null];cursor={x:0,y:0};changed();}
function undo(){if(C.undo(draft(),free())){state.tool='draw';state.light=false;changed();message('Vorige stap terug.');}}
function addFreeLine(l){
 if(!l||!C.validLine(l))return 'Kies twee verschillende punten.';
 if(lines().length>=C.MAX_LINES)return 'Twaalf lijnen is genoeg. Haal er één weg om verder te tekenen.';
 if(lines().some(q=>C.sameLine(q,l)))return 'Deze lijn staat er al.';
 if(C.cells([...lines(),l],geometry.bounds).length===C.cells(lines(),geometry.bounds).length)return 'Deze lijn valt buiten het glas.';
 C.remember(draft(),true);draft().lines.push(l);draft().points=[null,null];changed();return null;
}
$('check').onclick=()=>{
 if(painting())return;const d=draft();
 if(free()){const error=addFreeLine(C.fromPoints(d.points));if(error)message(error,'error');return;}
 const result=C.check(pattern().lines[d.count],d.points);if(!result.ok){wrong=result.wrong||[];message(result.text,'error');renderBoard();return;}
 C.remember(d);d.count++;d.points=[null,null];cursor={x:0,y:0};if(complete()){d.done=true;state.light=true;}changed();if(complete())message('Mooi! Geef het glas jouw kleur.','success');
};
$('clear-points').onclick=clearPoints;$('undo').onclick=undo;
// A touch release activates drawing controls immediately, including just after
// a captured canvas drag. The later compatibility click must not apply undo twice.
for(const id of ['check','undo','clear-points']){
 const b=$(id),activate=b.onclick;let press=null,lastTouch=-Infinity;
 b.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!b.disabled)press={id:e.pointerId,x:e.clientX,y:e.clientY};});
 b.addEventListener('pointercancel',()=>{press=null;});
 b.addEventListener('pointerup',e=>{
  const start=press;press=null;if(!start||start.id!==e.pointerId||b.disabled||Math.hypot(e.clientX-start.x,e.clientY-start.y)>12)return;
  const r=b.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;
  e.preventDefault();lastTouch=performance.now();activate.call(b,e);
 });
 b.onclick=e=>{if(e.detail>0&&performance.now()-lastTouch<700)return;activate.call(b,e);};
}
// Point capture is kept on the SVG itself; rebuilding its artwork cannot cancel a drag.
function eventPoint(e){const q=new DOMPoint(e.clientX,e.clientY).matrixTransform(board.getScreenCTM().inverse());return {raw:q,point:{x:Math.max(-geometry.bounds.x,Math.min(geometry.bounds.x,Math.round((q.x-geometry.cx)/geometry.unit))),y:Math.max(-geometry.bounds.y,Math.min(geometry.bounds.y,Math.round((geometry.cy-q.y)/geometry.unit)))},inside:q.x>=geometry.left-2&&q.x<=geometry.left+geometry.pw+2&&q.y>=geometry.top-2&&q.y<=geometry.top+geometry.ph+2};}
function paintCell(id){const color=preset().colors[state.palette];draft().colors[id]=color;board.querySelector(`[data-cell="${id}"]`)?.setAttribute('fill',color);save();}
board.addEventListener('pointerdown',e=>{
 if(e.button!==0||gesture)return;const at=eventPoint(e);if(!at.inside)return;
 if(painting()){const cell=e.target.closest('[data-cell]');if(cell)paintCell(cell.dataset.cell);return;}
 e.preventDefault();board.focus({preventScroll:true});const d=draft(),existing=d.points.findIndex(p=>p&&p.x===at.point.x&&p.y===at.point.y);
 gesture={id:e.pointerId,start:{x:e.clientX,y:e.clientY},index:existing>=0?existing:C.slot(d.points,at.point),dragged:false};board.setPointerCapture(e.pointerId);
});
board.addEventListener('pointermove',e=>{
 if(!gesture||gesture.id!==e.pointerId)return;
 if(!gesture.dragged&&Math.hypot(e.clientX-gesture.start.x,e.clientY-gesture.start.y)<6)return;
 if(!gesture.dragged){C.remember(draft(),free());gesture.dragged=true;}
 const at=eventPoint(e);draft().points[gesture.index]={...at.point};cursor={...at.point};wrong=[];message();render();
});
board.addEventListener('pointerup',e=>{
 if(!gesture||gesture.id!==e.pointerId)return;const was=gesture;gesture=null;
 if(board.hasPointerCapture(e.pointerId))board.releasePointerCapture(e.pointerId);
 if(was.dragged){save();render();}else{const at=eventPoint(e);if(at.inside)tapPoint(at.point);}
});
board.addEventListener('pointercancel',e=>{if(gesture?.id!==e.pointerId)return;const was=gesture;gesture=null;if(was.dragged)C.undo(draft(),free());changed();});
board.addEventListener('keydown',e=>{
 const cell=e.target.dataset.cell;if(painting()&&cell&&(e.key==='Enter'||e.key===' ')){e.preventDefault();paintCell(cell);return;}
 if(e.target!==board||painting())return;const arrows={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]};
 if(arrows[e.key]){e.preventDefault();const [x,y]=arrows[e.key];cursor={x:Math.max(-geometry.bounds.x,Math.min(geometry.bounds.x,cursor.x+x)),y:Math.max(-geometry.bounds.y,Math.min(geometry.bounds.y,cursor.y+y))};showCursor();board.setAttribute('aria-label',`Cursor (${cursor.x}; ${cursor.y}). Enter plaatst of verwijdert het punt.`);}
 if(e.key==='Enter'||e.key===' '){e.preventDefault();tapPoint(cursor);}if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();undo();}if(e.key==='Escape'){e.preventDefault();clearPoints();}
});
board.addEventListener('focus',()=>{if(!painting())showCursor();});
function showGallery(){const grid=$('gallery-grid');grid.replaceChildren();for(const p of C.PATTERNS){const b=document.createElement('button');b.type='button';b.className='window-choice';b.dataset.pattern=p.id;b.setAttribute('aria-current',String(!free()&&state.pattern===p.id));b.setAttribute('aria-label',p.name+'. '+p.subtitle+(state.drafts[p.id].done?'. Afgerond.':''));const art=node('svg',{'aria-hidden':'true'});renderGlass(art,p,p.lines,{w:320,h:240,bounds:{x:8,y:6},lit:true});const title=document.createElement('strong');title.textContent=p.name;const sub=document.createElement('small');sub.textContent=p.subtitle;b.append(art,title,sub);if(state.drafts[p.id].done){const tick=document.createElement('span');tick.className='finished-mark';tick.textContent='✓';b.append(tick);}b.onclick=()=>{state.mode='restore';state.pattern=p.id;state.tool='draw';state.light=state.drafts[p.id].count===p.lines.length;$('gallery-dialog').close();changed();};grid.append(b);}$('gallery-dialog').showModal();}
$('gallery-open').onclick=showGallery;$('design-mode').onclick=()=>{state.mode='design';state.tool='draw';state.light=false;$('gallery-dialog').close();changed();};
$('more-open').onclick=()=>$('options-dialog').showModal();
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$(b.dataset.close).close();
const undoOption=document.createElement('button');undoOption.id='undo-option';undoOption.type='button';undoOption.textContent='Vorige stap terug ↶';undoOption.onclick=()=>{undo();$('options-dialog').close();};$('options-dialog').insertBefore(undoOption,$('grid-toggle'));
$('paint-toggle').onclick=()=>{if(complete())return;state.tool=painting()?'draw':'paint';state.light=false;changed();};
$('light-toggle').onclick=()=>{state.light=!state.light;save();render();};$('grid-toggle').onclick=()=>{state.grid=!state.grid;state.light=false;save();render();};
for(let i=0;i<6;i++){const b=document.createElement('button');b.type='button';b.className='swatch';b.dataset.color=i;b.setAttribute('aria-label','Glaskleur '+(i+1));b.onclick=()=>{state.palette=i;save();for(const e of $('palette').children)e.setAttribute('aria-pressed',String(Number(e.dataset.color)===i));for(const e of board.querySelectorAll('[data-cell][role=button]'))e.setAttribute('aria-label',e.getAttribute('aria-label').replace(/kleur \d+$/,'kleur '+(i+1)));};$('palette').append(b);}
$('hint').onclick=()=>{const open=$('hint-text').hidden;$('hint-text').hidden=!open;$('hint').setAttribute('aria-expanded',String(open));const l=pattern().lines[state.drafts[state.pattern].count];$('hint-text').textContent=l.type==='vertical'?'Alle punten hebben dezelfde x-coördinaat.':l.a===0?'Alle punten hebben dezelfde y-coördinaat.':'Probeer eerst x = 0. Reken daarna y uit voor een andere x. Bij een halve helling is een stap van twee handig.';};
function currentDesign(){const a=C.parseNumber(state.free.inputs.a),b=C.parseNumber(state.free.inputs.b);if(b===null||state.free.inputs.type==='function'&&a===null)return null;const l=state.free.inputs.type==='vertical'?{type:'vertical',x:b}:{type:'function',a,b};return C.validLine(l)?l:null;}
function editDesign(){state.free.inputs={type:$('line-type').value,a:$('slope').value,b:$('intercept').value};$('slope-field').hidden=state.free.inputs.type==='vertical';$('intercept-label').textContent=state.free.inputs.type==='vertical'?'x-coördinaat c':'Verschuiving b';$('design-preview').textContent=currentDesign()?C.formula(currentDesign()):'Vul een geldig getal in';$('formula-feedback').textContent='';save();}
$('line-type').value=state.free.inputs.type;$('slope').value=state.free.inputs.a;$('intercept').value=state.free.inputs.b;
$('formula-open').onclick=()=>{$('options-dialog').close();editDesign();$('formula-dialog').showModal();};$('line-type').onchange=editDesign;$('slope').oninput=editDesign;$('intercept').oninput=editDesign;
$('line-form').onsubmit=e=>{e.preventDefault();const l=currentDesign();if(!l){$('formula-feedback').textContent='Vul een getal of breuk in. De noemer mag niet nul zijn.';return;}const error=addFreeLine(l);if(error){$('formula-feedback').textContent=error;return;}$('formula-dialog').close();};
$('themeBtn').onclick=()=>{const dark=document.documentElement.dataset.mode!=='dark';document.documentElement.dataset.mode=dark?'dark':'light';$('themeBtn').setAttribute('aria-pressed',String(dark));try{localStorage.setItem('axioma-mode',dark?'dark':'light');}catch{}};$('themeBtn').setAttribute('aria-pressed',String(document.documentElement.dataset.mode==='dark'));
$('download').onclick=()=>{const output=node('svg',{xmlns:NS,width:Math.round(geometry.w*2),height:Math.round(geometry.h*2)});renderGlass(output,preset(),lines(),{w:geometry.w,h:geometry.h,bounds:geometry.bounds,lit:true,colors:draft().colors});output.prepend(node('title',{},(free()?'Mijn glasraam':pattern().name)+' · leraarBob'),node('desc',{},lines().map(C.formula).join('; ')));const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(output)],{type:'image/svg+xml'})),a=document.createElement('a');a.href=url;a.download='glasatelier-'+(free()?'eigen-ontwerp':state.pattern)+'.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
let resizeQueued=false;new ResizeObserver(()=>{if(!resizeQueued){resizeQueued=true;requestAnimationFrame(()=>{resizeQueued=false;fitFormula();renderBoard();});}}).observe(board);
render();
})();
