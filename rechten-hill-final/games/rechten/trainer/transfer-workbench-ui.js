/* Persistent function header, a real x/f(x) table, and direct graph manipulation. */
(function(root){
'use strict';const C=root.RechtenWave,T=C.transferWorkbench,H=C.html,E=root.RechtenEquationEditor;
const signed=v=>v.n<0?`(${H(v)})`:H(v);
const activeLabels={tableB:'Lees b af uit de tabel: kijk bij x = 0.',slopeFraction:'Bepaal a met twee punten uit de tabel.',tableA:'Bereken a uit je breuk.',installA:'Sleep je gevonden a naar de formule.',pointX:'Kies een punt: sleep zijn x naar de vergelijking.',pointY:'Sleep f(x) uit dezelfde kolom naar y.',pointProduct:'Bereken het product a · x.',solveB:'Maak b vrij door te slepen.',installB:'Sleep je gevonden b naar de formule.'};
function header(w,stage,done){
 const a=w.values.installA||done?w.values.a:null,b=w.values.tableB||w.values.installB||done?w.values.b:null;
 const slot=(key,value)=>`<span class="transfer-coefficient ${stage===('install'+key.toUpperCase())||stage==='tableB'&&key==='b'?'active':''}" data-coefficient="${key}">${value?H(key==='b'?C.q(Math.abs(value.n),value.d):value):key}</span>`;
 return `<div class="transfer-function"><span>f(x) =</span>${slot('a',a)}<span>x</span><span>${b?.n<0?'−':'+'}</span>${slot('b',b)}</div>`;
}
function grid(p,{reference=false,points=[],cursor=null}={}){
 const X=x=>110+18*x,Y=y=>110-18*y,tick=P=>({x:C.num(C.div(P.x,p.scaleX)),y:C.num(C.div(P.y,p.scaleY))});
 let s=`<svg class="transfer-grid workbench-grid" viewBox="0 0 220 220" role="${reference?'img':'application'}" ${reference?'':'tabindex="0"'} aria-label="${reference?'Grafiek van de gezochte functie':'Klik of tik twee punten. Sleep een punt om het te verplaatsen. Pijltjestoetsen en Enter werken ook.'}"><defs><clipPath id="workbench-clip"><rect x="20" y="20" width="180" height="180"/></clipPath></defs>`;
 for(let i=-5;i<=5;i++){s+=`<path d="M${X(i)} 20V200 M20 ${Y(i)}H200" stroke="${i?'#dbe5df':'#59747a'}" fill="none"/>`;if(i&&i%2===0)s+=`<text x="${X(i)}" y="124" text-anchor="middle">${C.text(C.mul(i,p.scaleX))}</text><text x="104" y="${Y(i)-3}" text-anchor="end">${C.text(C.mul(i,p.scaleY))}</text>`}
 s+='<path class="axis-arrow" d="M194 106l6 4-6 4 M106 26l4-6 4 6" fill="none" stroke="#59747a" stroke-width="1.5"/><text x="205" y="107">x</text><text x="115" y="14">y</text><text x="103" y="122">0</text>';
 if(reference){const y=x=>Y(C.num(C.div(C.add(C.mul(p.model.a,C.mul(x,p.scaleX)),p.model.b),p.scaleY)));s+=`<path class="transfer-reference" d="M20 ${y(-5)}L200 ${y(5)}" clip-path="url(#workbench-clip)" fill="none" stroke="#4c8fd8" stroke-width="3"/>`}
 const ticks=points.map(P=>P&&tick(P));s+=`<path class="transfer-line" d="${linePath(ticks)}" clip-path="url(#workbench-clip)" fill="none" stroke="#245f54" stroke-width="3"/>`;
 ticks.forEach((P,i)=>{if(P)s+=`<g data-plot-point="${i}"><circle cx="${X(P.x)}" cy="${Y(P.y)}" r="5" fill="${i?'#cf8629':'#245f54'}"/><text x="${X(P.x)+7}" y="${Y(P.y)-7}">${i?'B':'A'}</text></g>`});
 if(!reference)s+=`<circle class="transfer-cursor" cx="${X(cursor?.x||0)}" cy="${Y(cursor?.y||0)}" r="6" stroke="#695be5" stroke-width="2" fill="none" style="visibility:hidden"/>`;
 return s+'</svg>';
}
function linePath(points){if(!points[0]||!points[1])return '';const [a,b]=points,dx=b.x-a.x,dy=b.y-a.y;if(!dx&&!dy)return '';return `M${110+18*(a.x-20*dx)} ${110-18*(a.y-20*dy)}L${110+18*(a.x+20*dx)} ${110-18*(a.y+20*dy)}`}
function mount(t,opts){
 const {visual,answers,question,status,footer,onChange,onDone,onNext,dev=false}=opts,w=t.work||(t.work=C.fresh(t)),p=t.params,stage=C.stages(t)[w.index]||'done';
 const ui=w.transferUI||(w.transferUI={});visual.className='visual transfer-visual';answers.className='answers transfer-data';answers.replaceChildren();footer.replaceChildren();
 const button=(label,action,parent=footer,role)=>{const b=document.createElement('button');b.type='button';b.innerHTML=label;if(role)b.dataset.footerAction=role;E.activate(b,action);parent.append(b);return b};
 const redraw=()=>{onChange();mount(t,opts);opts.onRendered?.()};
 const submit=value=>{const r=C.submit(t,w,value);opts.onResult?.(r);status.className='status '+(r.ok?'good':'bad');status.textContent=r.message||'Stap klopt.';if(w.done)onDone();redraw()};
 visual.innerHTML='<div class="transfer-workbench"><div class="transfer-working"></div></div>';const work=visual.querySelector('.transfer-working');
 if(t.skill==='equation_from_graph'){
  question.innerHTML='<div class="transfer-function"><span>f(x) =</span><span data-dial-host="a"></span><span>x +</span><span data-dial-host="b"></span></div>';
  work.innerHTML=grid(p,{reference:true});visual.classList.add('transfer-grid-visual');
  ui.dials||={a:null,b:null};
  if(w.done){question.innerHTML=`<div class="transfer-function">${C.formula(p.model.a,p.model.b).replace('y =','f(x) =')}</div>`;status.textContent='Je voorschrift past bij de grafiek.'}
  else{
   const ok=button('OK',()=>submit(structuredClone(ui.dials)));ok.disabled=!ui.dials.a||!ui.dials.b;
   const refresh=()=>{ok.disabled=!ui.dials.a||!ui.dials.b;onChange()};
   for(const key of ['a','b'])dial(question.querySelector(`[data-dial-host="${key}"]`),key,ui.dials,refresh);
   const hint=document.createElement('p');hint.className='transfer-instruction';hint.textContent='Scroll of veeg over a en b. Controleer daarna met OK.';work.append(hint);
  }
 }else{
  if(t.skill==='graph_from_table'){
   question.textContent='Teken de rechte bij de tabel';ui.points||=[null,null];ui.active??=0;ui.cursor||={x:0,y:0};
   work.innerHTML=grid(p,{points:ui.points,cursor:ui.cursor});visual.classList.add('transfer-grid-visual');
   table(answers,p,()=>false);
   if(!w.done){
    button('OK',()=>submit(structuredClone(ui.points))).disabled=!ui.points.every(Boolean);
    const hint=document.createElement('p');hint.className='transfer-instruction';hint.textContent='Kies twee punten op het rooster. De rechte verschijnt vanzelf.';answers.append(hint);
    const svg=work.querySelector('svg');let pending=null;
    const snap=e=>{const v=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());return {x:Math.max(-5,Math.min(5,Math.round((v.x-110)/18))),y:Math.max(-5,Math.min(5,Math.round((110-v.y)/18)))}};
    const preview=(tick,index)=>{const cursor=svg.querySelector('.transfer-cursor');cursor.style.visibility='visible';cursor.setAttribute('cx',110+18*tick.x);cursor.setAttribute('cy',110-18*tick.y);const points=ui.points.map(P=>P&&({x:C.num(C.div(P.x,p.scaleX)),y:C.num(C.div(P.y,p.scaleY))}));points[index]=tick;svg.querySelector('.transfer-line').setAttribute('d',linePath(points))};
    const place=(tick,index)=>{ui.edits||=[];ui.edits.push({points:structuredClone(ui.points),active:ui.active,cursor:{...ui.cursor}});ui.edits=ui.edits.slice(-24);ui.points[index]=C.gridPoint(t,tick);ui.cursor=tick;ui.active=ui.points[0]&&!ui.points[1]?1:index;redraw()};
    svg.onpointerdown=e=>{if(!e.isPrimary||e.button!==0)return;const tick=snap(e),near=ui.points.findIndex(P=>P&&C.eq(P.x,C.mul(tick.x,p.scaleX))&&C.eq(P.y,C.mul(tick.y,p.scaleY)));pending={tick,index:near>=0?near:ui.active};svg.setPointerCapture(e.pointerId);preview(tick,pending.index);e.preventDefault()};
    svg.onpointermove=e=>{if(pending){pending.tick=snap(e);preview(pending.tick,pending.index)}};
    svg.onpointercancel=()=>{pending=null;redraw()};svg.onpointerup=e=>{if(!pending)return;const d=pending;pending=null;e.preventDefault();if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);place(d.tick,d.index)};
    svg.onkeydown=e=>{const moves={ArrowLeft:['x',-1],ArrowRight:['x',1],ArrowUp:['y',1],ArrowDown:['y',-1]};if(moves[e.key]){e.preventDefault();const [key,n]=moves[e.key];ui.cursor[key]=Math.max(-5,Math.min(5,ui.cursor[key]+n));preview(ui.cursor,ui.active);onChange()}else if(e.key==='Enter'||e.key===' '){e.preventDefault();place({...ui.cursor},ui.active);work.querySelector('svg')?.focus()}};
    button('Terug',()=>{const edit=ui.edits?.pop();if(edit){Object.assign(ui,edit);redraw()}},footer,'back').disabled=!ui.edits?.length;
   }
  }else{
   question.innerHTML=header(w,stage,w.done);
   const interactive=['tableB','slopeFraction','pointX','pointY'].includes(stage);
   const cells=table(answers,p,()=>interactive);
   const hint=document.createElement('p');hint.className='transfer-instruction';hint.textContent=w.done?'Het functievoorschrift is gevonden.':activeLabels[stage]||'';answers.append(hint);
   const target=key=>question.querySelector(`[data-coefficient="${key}"]`);
   if(stage==='tableB'){
    work.innerHTML='<div class="transfer-clue">x = 0<span>↓</span>f(0) = b</div>';
    bindCells(cells,()=>[target('b')],cell=>submit(cell));
   }else if(stage==='slopeFraction'){
    ui.fraction||={ys:[null,null],xs:[null,null]};ui.slot||='ys0';
    const slot=(row,i)=>{const cell=ui.fraction[row][i],value=cell&&p.rows[cell.column][cell.axis];return `<button type="button" class="transfer-fraction-slot ${ui.slot===row+i?'active':''}" data-fraction-slot="${row}${i}" aria-label="${row==='ys'?'Teller':'Noemer'}, ${i?'tweede':'eerste'} waarde">${value?signed(value):'□'}</button>`};
    work.innerHTML=`<div class="transfer-slope"><span>a =</span><div class="transfer-fraction"><div>${slot('ys',0)}<span>−</span>${slot('ys',1)}</div><div>${slot('xs',0)}<span>−</span>${slot('xs',1)}</div></div></div>`;
    work.querySelectorAll('[data-fraction-slot]').forEach(b=>E.activate(b,()=>{ui.slot=b.dataset.fractionSlot;redraw()}));
    const place=(cell,slot)=>{const row=slot.slice(0,2),i=Number(slot[2]);ui.fraction[row][i]=cell;const keys=['ys0','ys1','xs0','xs1'];ui.slot=keys.find(k=>!ui.fraction[k.slice(0,2)][Number(k[2])])||slot;if(keys.every(k=>ui.fraction[k.slice(0,2)][Number(k[2])]))submit(structuredClone(ui.fraction));else redraw()};
    bindCells(cells,()=>[...work.querySelectorAll('[data-fraction-slot]')],(cell,drop)=>place(cell,drop?.dataset.fractionSlot||ui.slot));
   }else if(stage==='tableA'||stage==='pointProduct'){
    let expression;
    if(stage==='tableA'){const f=w.values.slopeFraction,parts=row=>f[row].map(cell=>signed(p.rows[cell.column][cell.axis])).join(' − ');expression=`a = <span class="frac"><span>${parts('ys')}</span><span>${parts('xs')}</span></span>`}
    else expression=`${H(w.values.a)} · (${H(T.selectedPoint(t,w).x)})`;
    work.innerHTML=`<div class="transfer-numeric"><div class="transfer-calculation"><span>${expression}</span></div><div class="wave-controls transfer-keypad"></div></div>`;
    root.RechtenNumberEntry.mount(w,{host:work.querySelector('.transfer-calculation'),answers:work.querySelector('.transfer-keypad'),footer,label:'',submit,redraw,status});
   }else if(stage==='installA'||stage==='installB'){
    const key=stage==='installA'?'a':'b',value=w.values[key];work.innerHTML=`<button type="button" class="transfer-found" data-found="${key}">${key} = ${H(value)}</button><p class="transfer-instruction">Sleep naar ${key} bovenaan, of tik de waarde aan.</p>`;
    E.draggable(work.querySelector('[data-found]'),{targets:()=>[target(key)],drop:()=>submit(key),tap:()=>submit(key)});
   }else if(stage==='pointX'||stage==='pointY'){
    const chosen=w.values.pointX?T.selectedPoint(t,w):null;
    work.innerHTML=`<div class="transfer-substitution"><span class="${stage==='pointY'?'active':''}" ${stage==='pointY'?'data-point-slot="y"':''}>y</span><span>=</span><span>${H(w.values.a)} · (</span><span class="${stage==='pointX'?'active':''}" ${stage==='pointX'?'data-point-slot="x"':''}>${chosen?H(chosen.x):'x'}</span><span>) + b</span></div>`;
    if(chosen)answers.querySelectorAll(`[data-table-column="${w.values.pointX.column}"]`).forEach(b=>b.classList.add('same-point'));
    bindCells(cells,()=>[work.querySelector('[data-point-slot]')],cell=>submit(cell));
   }else if(stage==='solveB'){
    E.mount(T.equation(t,w),w,{host:work,answers:document.createElement('div'),axis:'y',symbol:'b',submit,redraw});
   }else if(w.done){work.innerHTML=`<div class="transfer-clue">${C.formula(w.values.a,w.values.b).replace('y =','f(x) =')}</div>`}
   if(!w.done)button('Terug',()=>{C.undo(w);delete ui.fraction;delete ui.slot;redraw()},footer,'back').disabled=!w.history.length;
  }
 }
 if(w.done)button(dev?'Nieuwe variant':'Verder →',onNext);
 function bindCells(cells,targets,place){for(const source of cells){const cell={column:Number(source.dataset.tableColumn),axis:source.dataset.tableAxis};E.draggable(source,{targets,drop:target=>place(cell,target),tap:()=>place(cell)})}}
}
function table(where,p,interactive){
 const el=document.createElement('table');el.className='transfer-value-table';el.setAttribute('aria-label','Waarden van x en f(x)');
 el.innerHTML=['x','y'].map(axis=>`<tr><th scope="row">${axis==='x'?'x':'f(x)'}</th>${p.rows.map((P,i)=>`<td>${interactive(i,axis)?`<button type="button" data-table-column="${i}" data-table-axis="${axis}" aria-label="Kolom ${i+1}, ${axis==='x'?'x':'f(x)'} = ${C.text(P[axis])}">${H(P[axis])}</button>`:`<span>${H(P[axis])}</span>`}</td>`).join('')}</tr>`).join('');where.append(el);return [...el.querySelectorAll('button')];
}
function dial(host,key,values,onChange){
 const pool=T.coefficientValues(key),zero=pool.findIndex(v=>!v.n);let drag=null;
 const b=document.createElement('button');b.type='button';b.className='coefficient-dial';b.setAttribute('role','spinbutton');b.setAttribute('aria-label',`${key}: scroll, veeg of gebruik de pijltjestoetsen`);b.setAttribute('aria-valuemin',C.num(pool[0]));b.setAttribute('aria-valuemax',C.num(pool.at(-1)));host.append(b);
 const index=()=>values[key]?pool.findIndex(v=>C.eq(v,values[key])):zero;
 const paint=value=>{b.innerHTML=`<span class="dial-arrow" aria-hidden="true">▴</span><span>${value?(key==='b'&&value.n<0?`(${H(value)})`:H(value)):key}</span><span class="dial-arrow" aria-hidden="true">▾</span>`;if(value){b.setAttribute('aria-valuenow',C.num(value));b.setAttribute('aria-valuetext',C.text(value))}else{b.removeAttribute('aria-valuenow');b.setAttribute('aria-valuetext',key)}};
 const set=i=>{values[key]=pool[Math.max(0,Math.min(pool.length-1,i))];paint(values[key]);onChange()};
 b.addEventListener('wheel',e=>{e.preventDefault();if(e.deltaY)set(index()+(e.deltaY<0?1:-1))},{passive:false});
 b.onkeydown=e=>{const move={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1};if(move[e.key]){e.preventDefault();set(index()+move[e.key])}else if(e.key==='Home'||e.key==='End'){e.preventDefault();set(e.key==='Home'?0:pool.length-1)}else if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!values[key])set(zero)}};
 b.onpointerdown=e=>{if(!e.isPrimary||e.button!==0)return;drag={y:e.clientY,index:index(),next:index(),moved:false};b.setPointerCapture(e.pointerId);e.preventDefault()};
 b.onpointermove=e=>{if(!drag)return;const delta=Math.round((drag.y-e.clientY)/22);if(Math.abs(e.clientY-drag.y)>7)drag.moved=true;drag.next=Math.max(0,Math.min(pool.length-1,drag.index+delta));if(drag.moved)paint(pool[drag.next])};
 b.onpointercancel=()=>{drag=null;paint(values[key])};b.onpointerup=e=>{if(!drag)return;const d=drag;drag=null;e.preventDefault();if(b.hasPointerCapture(e.pointerId))b.releasePointerCapture(e.pointerId);set(d.moved?d.next:values[key]?d.index+(e.clientY<b.getBoundingClientRect().y+b.getBoundingClientRect().height/2?1:-1):zero)};
 paint(values[key]);
}
root.RechtenTransferWorkbenchUI={mount,grid};
})(globalThis);
