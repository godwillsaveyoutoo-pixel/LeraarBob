/* Wave 2: confirmed grid placement and formula tokens, with tap alternatives to dragging. */
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
 let svg='<svg class="construct-grid" viewBox="0 0 220 220" role="application" aria-label="Rooster. Tik of sleep om een punt te kiezen; bevestig met Plaats. Gebruik ook de x- en y-knoppen." tabindex="0">';
 for(let i=-5;i<=5;i++){
  svg+=`<path d="M${X(i)} 20V200 M20 ${Y(i)}H200" stroke="${i?'#dbe5df':'#59747a'}" fill="none"/>`;
  if(i&&i%2===0)svg+=`<text x="${X(i)}" y="123" text-anchor="middle">${C.text(C.mul(i,sx))}</text><text x="105" y="${Y(i)-3}" text-anchor="end">${C.text(C.mul(i,sy))}</text>`;
 }
 svg+='<text x="207" y="107">x</text><text x="115" y="14">y</text><text x="102" y="122">0</text>';
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
 const data={point_plot:['Plaats P(2; 3)','Lees de assenschaal. Kies eerst x, daarna y. Tik of sleep op het rooster, verfijn met de stapknoppen en bevestig.'],equation_from_ab:['a = −1, b = 2 → y = −x + 2','Kies een token en tik zijn plaats in de formule, of sleep het erheen. Het getal vóór x is a; teken en constante vormen samen b.'],graph_from_equation:['y = −x + 2','Plaats eerst (0; 2), daarna bijvoorbeeld (1; 1). Trek en controleer de rechte. Later mag je twee eigen, verschillende punten kiezen.']};
 const [big,sub]=data[skill];return {title:C.catalog[skill].label,big,sub,visual:'<div class="construction-example">x →<br>↑ y<br><small>Tik · verplaats · bevestig</small></div>'};
}
function mount(t,opts){
 const {visual,answers,question,status,footer,onChange,onDone,onNext,dev=false}=opts;
 const w=t.work||(t.work=C.fresh(t)),g=w.construction||(w.construction=initial());
 const formulaTask=t.skill==='equation_from_ab';
 visual.classList.add('construction-visual');answers.className='answers construction-controls';answers.replaceChildren();footer.replaceChildren();
 const button=(label,action,parent=answers)=>{
  const b=document.createElement('button');b.type='button';b.innerHTML=label;
  // Use the completed pointer gesture directly; retain native keyboard activation.
  let down=null,handled=false;
  b.onpointerdown=e=>{down={x:e.clientX,y:e.clientY};handled=false};
  b.onpointercancel=()=>{down=null};
  b.onpointerup=e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8){handled=true;handledPointer=true;e.preventDefault();action()}down=null};
  b.onclick=e=>{if(e.detail===0||!handled)action();handled=false};
  parent.append(b);return b;
 };
 const redraw=()=>{onChange();mount(t,opts)};
 const setStatus=(message,ok=false)=>{status.className='status '+(ok?'good':'bad');status.textContent=message};
 const assess=value=>{const result=C.submit(t,w,value);g.checked=result;setStatus(result.message,result.ok);if(w.done){onDone();setStatus(w.errors.length||w.help?'Hersteld. Je juiste deelwerk is behouden.':'Goed gecontroleerd.',true)}redraw()};
 if(formulaTask){
  question.textContent='Bouw het voorschrift met de tokens';
  visual.innerHTML=`<div class="construct-formula"><div class="construct-given"><span class="wave-a">a = ${H(t.params.model.a)}</span> · <span class="wave-b">b = ${H(t.params.model.b)}</span></div><div class="construct-slots"><span>y =</span></div><small>Kies een token, tik daarna een vak.</small></div>`;
  const slots=visual.querySelector('.construct-slots');
  for(const [key,label] of [['a','getal vóór x'],['variable','x'],['sign','teken'],['b','constante term']]){
   const value=g.formula[key],b=button(value&&typeof value==='object'?H(value):value||'□',()=>place(key),slots);b.dataset.slot=key;b.setAttribute('aria-label',label);b.disabled=w.done;
  }
  function place(key,token=g.selected){if(!token||w.done)return;const valid=key==='a'||key==='b'?token.kind==='number':key==='variable'?token.kind==='variable':token.kind==='sign';if(!valid){setStatus('Dit token past niet in dit vak. Kies een getal, x of een teken.');return}remember(g);g.formula[key]=structuredClone(token.value);g.selected=null;redraw()}
  if(w.done){visual.querySelector('small').innerHTML=C.formula(t.params.model.a,t.params.model.b);answers.innerHTML='<div class="wave-result">Voorschrift klopt.</div>'}
  else {
   const numbers=[t.params.model.a,t.params.model.b,C.mul(-1,t.params.model.a),C.mul(-1,t.params.model.b),C.q(0),C.q(1)].filter((v,i,a)=>a.findIndex(x=>C.eq(x,v))===i);
   const tokens=[...numbers.map(value=>({kind:'number',value})),{kind:'variable',value:'x'},{kind:'sign',value:'+'},{kind:'sign',value:'−'}];
   answers.classList.add('construct-palette');
   for(const token of tokens){
    const b=button(token.kind==='number'?H(token.value):token.value,()=>{g.selected=token;onChange();answers.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
    b.dataset.token=JSON.stringify(token);if(JSON.stringify(token)===JSON.stringify(g.selected))b.classList.add('selected');
    let origin=null,moved=false;
    b.onpointerdown=e=>{origin={x:e.clientX,y:e.clientY};moved=false;b.setPointerCapture(e.pointerId)};
    b.onpointermove=e=>{if(origin&&Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>6)moved=true};
    b.onpointercancel=()=>{origin=null;moved=false};
    b.onpointerup=e=>{if(origin&&moved){const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]');if(target){handledPointer=true;e.preventDefault();place(target.dataset.slot,token)}}origin=null};
   }
   button('Controleer',()=>assess(structuredClone(g.formula)),footer);
  }
 }else{
  question.innerHTML=t.skill==='point_plot'?`Plaats P${coord(t.params.target)}`:`Teken ${C.formula(t.params.model.a,t.params.model.b)}`;
  visual.innerHTML=grid(t,g,w.done);
  const readout=document.createElement('div');readout.className='construct-readout';readout.innerHTML=`Cursor ${coord(C.gridPoint(t,g.cursor))}`;answers.append(readout);
  if(w.done)answers.innerHTML+=`<div class="wave-result">${t.skill==='point_plot'?'Punt klopt.':'Beide punten passen.'}</div>`;
  else {
   if(t.skill==='graph_from_equation'){
    const row=document.createElement('div');row.className='construct-point-tabs';answers.append(row);
    for(let i=0;i<2;i++){const b=button((i?'B':'A')+(g.points[i]?' •':''),()=>{g.active=i;if(g.points[i])g.cursor={...g.points[i]};redraw()},row);b.classList.toggle('selected',g.active===i)}
   }
   const nudges=document.createElement('div');nudges.className='construct-nudges';answers.append(nudges);
   for(const [axis,delta,label] of [['x',-1,'x −'],['x',1,'x +'],['y',-1,'y −'],['y',1,'y +']])button(label,()=>{remember(g);g.cursor[axis]=Math.max(-5,Math.min(5,g.cursor[axis]+delta));redraw()},nudges);
   button(t.skill==='point_plot'?'Plaats':'Plaats '+(g.active?'B':'A'),()=>{
    if(t.skill==='point_plot'){remember(g);assess(C.gridPoint(t,g.cursor))}
    else{remember(g);g.points[g.active]={...g.cursor};if(g.active===0&&!g.points[1])g.active=1;redraw()}
   },footer);
   if(t.skill==='graph_from_equation')button('Trek rechte',()=>assess(g.points.map(p=>p&&C.gridPoint(t,p))),footer);
   const svg=visual.querySelector('svg');let dragging=null;
   const snapped=e=>{const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());return {x:Math.max(-5,Math.min(5,Math.round((p.x-110)/18))),y:Math.max(-5,Math.min(5,Math.round((110-p.y)/18)))}};
   const preview=tick=>{svg.querySelector('.construct-cursor').setAttribute('cx',110+18*tick.x);svg.querySelector('.construct-cursor').setAttribute('cy',110-18*tick.y);readout.innerHTML=`Cursor ${coord(C.gridPoint(t,tick))}`};
   svg.onpointerdown=e=>{if(!e.isPrimary)return;dragging={tick:snapped(e),point:e.target.dataset.point};svg.setPointerCapture(e.pointerId);preview(dragging.tick);e.preventDefault()};
   svg.onpointermove=e=>{if(dragging){dragging.tick=snapped(e);preview(dragging.tick)}};
   svg.onpointercancel=()=>{dragging=null;preview(g.cursor)};
   svg.onpointerup=e=>{if(!dragging)return;handledPointer=true;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);remember(g);g.cursor=dragging.tick;if(dragging.point!==undefined)g.active=Number(dragging.point);dragging=null;onChange();requestAnimationFrame(()=>{if(svg.isConnected)mount(t,opts)})};
   svg.onkeydown=e=>{const moves={ArrowLeft:['x',-1],ArrowRight:['x',1],ArrowUp:['y',1],ArrowDown:['y',-1]};if(moves[e.key]){e.preventDefault();const [axis,n]=moves[e.key];remember(g);g.cursor[axis]=Math.max(-5,Math.min(5,g.cursor[axis]+n));redraw();visual.querySelector('svg').focus()}};
   if(t.skill==='graph_from_equation'&&t.difficulty===0&&!g.points[0]&&!g.checked)status.textContent='Begin met A op de y-as: (0; b).';
  }
 }
 if(w.done)button(dev?'Nieuwe variant':'Verder →',onNext,footer);
 else button('Undo',()=>{const prev=g.edits.pop();if(prev){Object.assign(g,prev);g.checked=null;g.selected=null;redraw()}},footer).disabled=!g.edits.length;
}
root.RechtenConstructionUI={mount,explanation};
})(globalThis);
