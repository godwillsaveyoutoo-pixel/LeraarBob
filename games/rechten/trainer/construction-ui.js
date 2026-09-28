/* Direct grid placement and automatically checked formula construction. */
(function(root){
'use strict';
const C=root.RechtenWave,H=C.html;
// A pointer confirmation can replace its button with Verder. Consume the click
// belonging to that same gesture so it cannot activate the newly rendered button.
let handledPointer=false;
document.addEventListener('pointerdown',()=>{handledPointer=false},true);
document.addEventListener('click',e=>{if(handledPointer&&e.detail){handledPointer=false;e.preventDefault();e.stopImmediatePropagation()}},true);
const coord=p=>`(${H(p.x)}; ${H(p.y)})`;
function initial(){return {cursor:{x:0,y:0},points:[null,null],active:0,formula:{a:null,variable:null,sign:null,b:null},selected:null,edits:[],checked:null}}
function snapshot(g){return {cursor:{...g.cursor},points:structuredClone(g.points),active:g.active,formula:structuredClone(g.formula)}}
function remember(g){g.edits.push(snapshot(g));g.edits=g.edits.slice(-24);g.checked=null}
function grid(t,g,done){
 const sx=t.params.scaleX,sy=t.params.scaleY,X=x=>110+18*x,Y=y=>110-18*y;
 let svg='<svg class="construct-grid" viewBox="0 0 220 220" role="application" aria-label="Rooster. Klik of tik om een punt te plaatsen. Sleep om het te verplaatsen. Met het toetsenbord: pijltjestoetsen en Enter." tabindex="0">';
 for(let i=-5;i<=5;i++){
  svg+=`<path d="M${X(i)} 20V200 M20 ${Y(i)}H200" stroke="${i?'#dbe5df':'#59747a'}" fill="none"/>`;
  if(i&&i%2===0)svg+=`<text x="${X(i)}" y="123" text-anchor="middle">${C.text(C.mul(i,sx))}</text><text x="105" y="${Y(i)-3}" text-anchor="end">${C.text(C.mul(i,sy))}</text>`;
 }
 svg+='<path class="axis-arrow" d="M194 106l6 4-6 4 M106 26l4-6 4 6" fill="none" stroke="#59747a" stroke-width="1.5"/><text x="207" y="107">x</text><text x="115" y="14">y</text><text x="102" y="122">0</text>';
 if(g.checked&&!g.checked.ok&&t.skill==='graph_from_equation'){
  const m=t.params.model,y=x=>C.num(C.add(C.mul(m.a,x),m.b));
  svg+=`<defs><clipPath id="reference-clip"><rect x="20" y="20" width="180" height="180"/></clipPath></defs><path class="reference-line" clip-path="url(#reference-clip)" d="M${X(-5)} ${Y(y(-5))}L${X(5)} ${Y(y(5))}" stroke="#b64f49" stroke-width="2" stroke-dasharray="5 4" fill="none"/>`;
 }
 if(g.checked||done){
  if(t.skill==='point_plot')svg+=`<path class="construct-projection" d="M110 ${Y(g.cursor.y)}H${X(g.cursor.x)}V110" stroke="#cf8629" stroke-dasharray="4 3" fill="none"/>`;
  else if(g.points.every(Boolean)){
   const [a,b]=g.points,dx=b.x-a.x,dy=b.y-a.y;
   if(dx||dy)svg+=`<defs><clipPath id="construct-clip"><rect x="20" y="20" width="180" height="180"/></clipPath></defs><path class="constructed-line" clip-path="url(#construct-clip)" d="M${X(a.x-20*dx)} ${Y(a.y-20*dy)}L${X(a.x+20*dx)} ${Y(a.y+20*dy)}" stroke="#4c8fd8" stroke-width="3" fill="none"/>`;
  }
 }
 for(let i=0;i<2;i++)if(g.points[i]){const p=g.points[i];svg+=`<circle class="placed-point" data-point="${i}" cx="${X(p.x)}" cy="${Y(p.y)}" r="5" stroke="${g.checked?.point===i?'#b64f49':'none'}" stroke-width="3" fill="${i?'#cf8629':'#245f54'}"/><text x="${X(p.x)+7}" y="${Y(p.y)-7}">${i?'B':'A'}</text>`}
 svg+=`<circle class="construct-cursor" cx="${X(g.cursor.x)}" cy="${Y(g.cursor.y)}" r="6" fill="none" stroke="#695be5" stroke-width="2"/></svg>`;
 return svg;
}
function explanation(skill){
 const data={point_plot:['Plaats P(2; 3)','Lees de assenschaal. Kies eerst x, daarna y. Klik of tik op het rooster om je punt te plaatsen. Tijdens het slepen volgt het punt je vinger; loslaten plaatst het.'],equation_from_ab:['a = −1, b = 2 → y = −x + 2','Het eerste vak is al geselecteerd. Tik op een bouwsteen of sleep die naar een vak; het volgende vak wordt vanzelf actief. Het getal vóór x is a; teken en constante vormen samen b.'],graph_from_equation:['y = −x + 2','Klik of tik twee verschillende punten die bij de formule passen, bijvoorbeeld (0; 2) en (1; 1). Kies daarna Trek rechte. Sleep een punt om het te verbeteren.']};
 const [big,sub]=data[skill];return {title:C.catalog[skill].label,big,sub,visual:'<div class="construction-example">x →<br>↑ y<br><small>Tik of sleep</small></div>'};
}
function mount(t,opts){
 const {visual,answers,question,status,footer,onChange,onDone,onNext,dev=false}=opts;
 const w=t.work||(t.work=C.fresh(t)),g=w.construction||(w.construction=initial());
 const formulaTask=t.skill==='equation_from_ab';
 visual.classList.add('construction-visual');answers.className='answers construction-controls';answers.replaceChildren();footer.replaceChildren();
 const button=(label,action,parent=answers,role)=>{
  const b=document.createElement('button');b.type='button';b.innerHTML=label;if(role)b.dataset.footerAction=role;
  // Use the completed pointer gesture directly; retain native keyboard activation.
  let down=null,handled=false;
  b.onpointerdown=e=>{down={x:e.clientX,y:e.clientY};handled=false};
  b.onpointercancel=()=>{down=null};
  b.onpointerup=e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8){handled=true;handledPointer=true;e.preventDefault();action()}down=null};
  b.onclick=e=>{if(e.detail===0||!handled)action();handled=false};
  parent.append(b);return b;
 };
 const redraw=()=>{onChange();mount(t,opts);opts.onRendered?.()};
 const setStatus=(message,ok=false)=>{status.className='status '+(ok?'good':'bad');status.textContent=message};
 const assess=value=>{const result=C.submit(t,w,value);opts.onResult?.(result);g.checked=result;setStatus(result.message,result.ok);if(w.done){onDone();setStatus(w.errors.length||w.help?'Hersteld. Je juiste deelwerk is behouden.':'Goed gecontroleerd.',true)}redraw()};
 if(formulaTask){
  question.textContent='Bouw het functievoorschrift';
  visual.innerHTML=`<div class="construct-formula"><div class="construct-given"><span class="wave-a">a = ${H(t.params.model.a)}</span> · <span class="wave-b">b = ${H(t.params.model.b)}</span></div><div class="formula-host"></div></div>`;
  if(w.done){visual.querySelector('.formula-host').innerHTML=C.formula(t.params.model.a,t.params.model.b);answers.innerHTML='<div class="wave-result">Voorschrift klopt.</div>'}
  else formulaBuilder(t.params.model,g,{host:visual.querySelector('.formula-host'),answers,onChange:redraw,onComplete:value=>assess(value),remember:()=>remember(g)});
 }else{
  question.innerHTML=t.skill==='point_plot'?`Plaats P${coord(t.params.target)}`:`Teken ${C.formula(t.params.model.a,t.params.model.b)}`;
  visual.innerHTML=grid(t,g,w.done);
  const readout=document.createElement('div');readout.className='construct-readout';answers.append(readout);
  readout.textContent=w.done?(t.skill==='point_plot'?'Punt klopt.':'Beide punten passen.'):(t.skill==='point_plot'?'Tik op het rooster om P te plaatsen.':'Kies twee punten. Sleep een punt om het te verplaatsen.');
  if(!w.done){
   const svg=visual.querySelector('svg');let dragging=null;
   const snapped=e=>{const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());return {x:Math.max(-5,Math.min(5,Math.round((p.x-110)/18))),y:Math.max(-5,Math.min(5,Math.round((110-p.y)/18)))}};
   const preview=tick=>{svg.querySelector('.construct-cursor').setAttribute('cx',110+18*tick.x);svg.querySelector('.construct-cursor').setAttribute('cy',110-18*tick.y);readout.innerHTML=`${t.skill==='point_plot'?'P':g.active?'B':'A'}${coord(C.gridPoint(t,tick))}`};
   const place=(tick,index)=>{remember(g);g.cursor=tick;if(t.skill==='point_plot'){assess(C.gridPoint(t,tick));return}g.active=index===undefined?g.active:index;g.points[g.active]={...tick};g.active=g.points[0]&&!g.points[1]?1:g.active;redraw()};
   svg.onpointerdown=e=>{if(!e.isPrimary||e.button!==0)return;const tick=snapped(e),near=g.points.findIndex(p=>p&&p.x===tick.x&&p.y===tick.y);dragging={tick,point:near<0?undefined:near};svg.setPointerCapture(e.pointerId);preview(tick);e.preventDefault()};
   svg.onpointermove=e=>{if(dragging){dragging.tick=snapped(e);preview(dragging.tick)}};
   svg.onpointercancel=()=>{dragging=null;preview(g.cursor)};
   svg.onpointerup=e=>{if(!dragging)return;handledPointer=true;e.preventDefault();const d=dragging;dragging=null;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);place(d.tick,d.point)};
   svg.onkeydown=e=>{const moves={ArrowLeft:['x',-1],ArrowRight:['x',1],ArrowUp:['y',1],ArrowDown:['y',-1]};if(moves[e.key]){e.preventDefault();const [axis,n]=moves[e.key];g.cursor[axis]=Math.max(-5,Math.min(5,g.cursor[axis]+n));preview(g.cursor);onChange()}else if(e.key==='Enter'||e.key===' '){e.preventDefault();place({...g.cursor});visual.querySelector('svg')?.focus()}};
   if(t.skill==='graph_from_equation')button('Trek rechte',()=>assess(g.points.map(p=>p&&C.gridPoint(t,p))),footer).disabled=!g.points.every(Boolean);
  }

 }
 if(w.done)button(dev?'Nieuwe variant':'Verder →',onNext,footer);
 else if(!formulaTask)button('Terug',()=>{const prev=g.edits.pop();if(prev){Object.assign(g,prev);g.checked=null;g.selected=null;redraw()}},footer,'back').disabled=!g.edits.length;
}
// One active slot, immediate placement, and assessment only when the whole formula is filled.
function formulaBuilder(model,g,{host,answers,onChange,onComplete,remember=()=>{}}){
 g.formula||={a:null,variable:null,sign:null,b:null};
 const keys=['a','variable','sign','b'],names={a:'getal vóór x',variable:'variabele',sign:'teken',b:'constante term'};
 g.slot=keys.includes(g.slot)?g.slot:keys.find(k=>g.formula[k]===null)||'a';
 host.innerHTML=`<div class="construct-slots"><span>y =</span>${keys.map(k=>`<button type="button" data-slot="${k}" class="${g.slot===k?'active':''}" aria-pressed="${g.slot===k}" aria-label="${names[k]}">${g.formula[k]===null?'□':typeof g.formula[k]==='object'?H(g.formula[k]):g.formula[k]}</button>`).join('')}</div><small>Tik op een bouwsteen voor het gemarkeerde vak, of sleep hem erheen.</small>`;
 answers.className='answers construction-controls construct-palette';answers.replaceChildren();
 const numbers=[model.a,model.b,C.mul(-1,model.a),C.mul(-1,model.b),C.q(0),C.q(1)].filter((v,i,a)=>a.findIndex(x=>C.eq(x,v))===i);
 const tokens=[...numbers.map(value=>({kind:'number',value})),{kind:'variable',value:'x'},{kind:'sign',value:'+'},{kind:'sign',value:'−'}];
 function place(key,token){
  const valid=key==='a'||key==='b'?token.kind==='number':key==='variable'?token.kind==='variable':token.kind==='sign';
  if(!valid)return;
  remember();g.formula[key]=structuredClone(token.value);
  const next=keys.slice(keys.indexOf(key)+1).find(k=>g.formula[k]===null)||keys.find(k=>g.formula[k]===null);g.slot=next||key;
  if(!next)onComplete(structuredClone(g.formula));else onChange();
 }
 host.querySelectorAll('[data-slot]').forEach(b=>{b.onclick=()=>{g.slot=b.dataset.slot;onChange()}});
 for(const token of tokens){
  const b=document.createElement('button');b.type='button';b.innerHTML=token.kind==='number'?H(token.value):token.value;b.dataset.token=JSON.stringify(token);
  let origin=null;
  b.onclick=e=>{if(!e.detail)place(g.slot,token)};
  b.onpointerdown=e=>{if(!e.isPrimary||e.button!==0)return;origin={x:e.clientX,y:e.clientY};b.setPointerCapture(e.pointerId)};
  b.onpointercancel=()=>{origin=null};
  b.onpointerup=e=>{if(!origin)return;const moved=Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>6,target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]');origin=null;handledPointer=true;e.preventDefault();if(b.hasPointerCapture(e.pointerId))b.releasePointerCapture(e.pointerId);if(!moved)place(g.slot,token);else if(target&&host.contains(target))place(target.dataset.slot,token)};
  answers.append(b);
 }
}
root.RechtenConstructionUI={mount,explanation,formulaBuilder};
})(globalThis);
