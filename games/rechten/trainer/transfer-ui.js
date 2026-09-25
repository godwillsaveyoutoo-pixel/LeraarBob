/* Wave 4: table/graph/context remain visible until the learner selects their data. */
(function(root){
'use strict';const C=root.RechtenWave,T=C.transfer,H=C.html,coord=p=>`(${H(p.x)}; ${H(p.y)})`,names=['I','II','III'];
let gridGesture=false;document.addEventListener('pointerdown',()=>{gridGesture=false},true);document.addEventListener('click',e=>{if(gridGesture&&e.detail){gridGesture=false;e.preventDefault();e.stopImmediatePropagation()}},true);
function table(t,w,interactive,button,where){
 const p=t.params,stage=T.stages(t,w)[w.index],wrap=document.createElement('div');wrap.className='transfer-table';where.append(wrap);
 for(const [i,P] of p.rows.entries()){
  const label=`<small>${names[i]}</small><span>x: ${H(P.x)}</span><span>y: ${H(P.y)}</span>`,column=interactive?button(label,()=>interactive(i),wrap):document.createElement('div');
  if(!interactive){column.innerHTML=label;wrap.append(column)}column.dataset.column=i;
  column.classList.toggle('chosen',i===w.values.colA||i===w.values.colB);column.classList.toggle('active',i===(stage==='plotA'?w.values.colA:stage==='plotB'?w.values.colB:-1));
  if(interactive&&stage==='colB')column.disabled=i===w.values.colA;
 }
}
function story(t){const p=t.params,c=p.context,m=p.model,amount=H(C.q(Math.abs(m.a.n),m.a.d));let text;
 if(t.difficulty===2)text=c.kind==='taxi'?`Een taxirit van ${H(p.rows[0].x)} km kost ${H(p.rows[0].y)} €. Bij ${H(p.rows[1].x)} km kost hij ${H(p.rows[1].y)} €.`:c.kind==='tank'?`Na ${H(p.rows[0].x)} min zit er ${H(p.rows[0].y)} liter in de tank; na ${H(p.rows[1].x)} min ${H(p.rows[1].y)} liter.`:`Parkeren kost ${H(p.rows[0].y)} € voor ${H(p.rows[0].x)} uur en ${H(p.rows[1].y)} € voor ${H(p.rows[1].x)} uur.`;
 else text=c.kind==='taxi'?`Een taxi rekent ${H(m.b)} € startgeld en ${amount} € per km.`:c.kind==='tank'?`Een tank bevat ${H(m.b)} liter en verliest ${amount} liter per minuut.`:`Parkeren kost vast ${H(m.b)} €; elk extra uur kost 0 €.`;
 return `<div class="transfer-story">${text}<small>Het verband is affine. x in ${c.xUnit}, y in ${c.yUnit}.<br>Geldig: ${H(c.domain.min)} ≤ x ≤ ${H(c.domain.max)}.</small></div>`;
}
function grid(t,w,{reference=false,line=false}={}){
 const p=t.params,X=x=>110+18*x,Y=y=>110-18*y,toTick=P=>({x:C.num(C.div(P.x,p.scaleX)),y:C.num(C.div(P.y,p.scaleY))}),cursor=w.cursor||{x:0,y:0};
 let svg='<svg class="transfer-grid" viewBox="0 0 220 220" role="application" tabindex="0" aria-label="Rooster: tik of sleep, corrigeer met x en y, bevestig het punt.">';
 svg+='<defs><clipPath id="transfer-clip"><rect x="20" y="20" width="180" height="180"/></clipPath></defs>';
 for(let i=-5;i<=5;i++){svg+=`<path d="M${X(i)} 20V200 M20 ${Y(i)}H200" stroke="${i?'#dbe5df':'#59747a'}" fill="none"/>`;if(i&&i%2===0)svg+=`<text x="${X(i)}" y="124" text-anchor="middle">${C.text(C.mul(i,p.scaleX))}</text><text x="104" y="${Y(i)-3}" text-anchor="end">${C.text(C.mul(i,p.scaleY))}</text>`}
 svg+='<text x="205" y="107">x</text><text x="115" y="14">y</text><text x="103" y="122">0</text>';
 const draw=(m,klass,color)=>{const y=x=>C.num(C.div(C.add(C.mul(m.a,C.mul(x,p.scaleX)),m.b),p.scaleY));return `<path class="${klass}" d="M20 ${Y(y(-5))}L200 ${Y(y(5))}" clip-path="url(#transfer-clip)" fill="none" stroke="${color}" stroke-width="3"/>`};
 if(reference)svg+=draw(p.model,'transfer-reference','#4c8fd8');
 if(line)svg+=draw(T.candidate(t,w),'transfer-line','#245f54');
 const placed=t.skill==='equation_from_graph'?[w.values.pickA,w.values.pickB]:[w.values.plotA,w.values.plotB,w.values.plotRest];
 for(let i=0;i<placed.length;i++)if(placed[i]){const P=toTick(placed[i]);svg+=`<circle cx="${X(P.x)}" cy="${Y(P.y)}" r="4" fill="${i===2?'#b64f49':'#245f54'}"/><text x="${Math.min(199,X(P.x)+6)}" y="${Math.max(15,Y(P.y)-7)}">${i===2?'C':i?'B':'A'}</text>`}
 if(reference&&t.difficulty===0)for(const P of p.rows){const v=toTick(P);svg+=`<circle class="transfer-hint" cx="${X(v.x)}" cy="${Y(v.y)}" r="4" fill="#cf8629"/>`}
 svg+=`<circle class="transfer-cursor" cx="${X(cursor.x)}" cy="${Y(cursor.y)}" r="6" stroke="#695be5" stroke-width="2" fill="none"/></svg>`;return svg;
}
const labels={colA:'Kies een eerste gegevenskolom voor punt A',colB:'Kies een andere kolom voor punt B',pickA:'Kies een roosterpunt A op de rechte',pickB:'Kies een ander roosterpunt B op de rechte',plotA:'Plaats punt A uit je gekozen kolom',plotB:'Plaats punt B uit je gekozen kolom',plotRest:'Plaats het overblijvende tabelpunt C',draw:'Trek de rechte door je twee punten',verifyRest:'Controleer de overblijvende kolom met je formule',tableVerdict:'Past één affine rechte bij alle tabelpunten?',bRoute:'Hoe bepaal je b?',readB:'Lees b af op de y-as',roleA:'Welk gegeven bepaalt a?',roleB:'Welk gegeven bepaalt b?',contextA:'Bepaal a, inclusief het teken',contextB:'Bepaal b uit de context',contextZero:'Controleer de startwaarde bij x = 0',contextTest:'Controleer je formule binnen het geldige bereik',contextDomain:'Welke invoer past binnen de context?'};
function explanation(skill){const data={graph_from_table:['Tabel → twee punten → rechte','Plaats twee punten met een klik of tik op het rooster. De rechte verschijnt meteen. Sleep een punt om te verbeteren en bevestig met OK.'],equation_from_graph:['f(x) = ax + b','Bekijk de grafiek en stel a en b in door over de waarden in de formule te scrollen of te vegen. a bepaalt de helling; b is het snijpunt met de y-as. Bevestig met OK.'],equation_from_table:['De tabel vult je functievoorschrift aan','Staat x = 0 in de tabel? Sleep de bijbehorende functiewaarde naar b. Bepaal a met twee tabelpunten en sleep de uitkomst in je formule. Zonder x = 0 bepaal je eerst a en vul je daarna één punt in om b te vinden.'],equation_from_context:['Grootheden → a en b → voorschrift','De verandering per eenheid is a; de startwaarde is b. Afname geeft een negatieve a. Later gebruik je twee beschreven situaties. Controleer je formule en het geldige bereik, met eenheden.']};const [big,sub]=data[skill];return {title:C.catalog[skill].label,big,sub,visual:'<div class="construction-example">Gegevens → model<small>Kies · bereken · controleer</small></div>'}}
function mount(t,opts){
 if(C.transferWorkbench.modern(t))return root.RechtenTransferWorkbenchUI.mount(t,opts);
 const {visual,answers,question,status,footer,onChange,onDone,onNext,dev=false}=opts,w=t.work||(t.work=C.fresh(t)),p=t.params,stage=T.stages(t,w)[w.index]||'done';
 visual.classList.remove('transfer-grid-visual');visual.classList.add('transfer-visual');answers.className='answers wave-controls transfer-controls';answers.replaceChildren();footer.replaceChildren();question.textContent=w.done?'Controle afgerond':labels[stage]||root.RechtenWaveUI.labels[stage];
 const button=(label,action,parent=answers)=>{const b=document.createElement('button');b.type='button';b.innerHTML=label;let down=null,handled=false;b.onpointerdown=e=>{down={x:e.clientX,y:e.clientY};handled=false};b.onpointercancel=()=>{down=null};b.onpointerup=e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8){handled=true;gridGesture=true;e.preventDefault();action()}down=null};b.onclick=e=>{if(e.detail===0||!handled)action();handled=false};parent.append(b);return b};
 const redraw=()=>{onChange();mount(t,opts);opts.onRendered?.()},submit=value=>{const r=C.submit(t,w,value);opts.onResult?.(r);status.className='status '+(r.ok?'good':'bad');status.textContent=r.ok?'Stap klopt.':r.message;if(w.done){onDone();status.textContent=w.errors.length||w.help?'Gecontroleerd na herstel of hulp.':'Zelfstandig gecontroleerd.'}redraw()};
 const tableSkill=t.skill==='graph_from_table'||t.skill==='equation_from_table';
 const gridStage=['pickA','pickB','plotA','plotB','plotRest','draw','readB'].includes(stage)||(t.skill==='graph_from_table'&&(w.done||stage==='tableVerdict'));
 if(gridStage){visual.innerHTML=grid(t,w,{reference:t.skill==='equation_from_graph',line:!!w.values.draw});visual.classList.add('transfer-grid-visual')}
 else if(t.skill==='equation_from_context'){if(['roleA','roleB','contextA','contextB','colA','colB','contextDomain'].includes(stage))visual.innerHTML=story(t);else if(['contextZero','contextTest','done'].includes(stage))visual.innerHTML='<div class="wave-context"></div>';else{const z=T.proxy(t,w,stage);visual.innerHTML=root.RechtenWaveUI.context(z.task,z.work,stage)}}
 else if(['colA','colB'].includes(stage)){visual.innerHTML='<div class="wave-context"><div class="wave-givens">Kies je eigen punten uit de tabel.</div><small>Ook «geen passend voorschrift» kan de uitkomst zijn.</small></div>';}
 else if(tableSkill&&['verifyRest','tableVerdict'].includes(stage)){const P=T.rest(t,w),m=T.candidate(t,w);visual.innerHTML=`<div class="wave-context"><div class="wave-givens">Overblijvende kolom: ${coord(P)}</div><div class="wave-equation">${C.formula(m.a,m.b)}</div>${stage==='tableVerdict'?`<small>Berekend: ${H(w.values.verifyRest)} · gegeven y: ${H(P.y)}</small>`:''}</div>`}
 else if(!w.done){const z=T.proxy(t,w,stage);visual.innerHTML=root.RechtenWaveUI.context(z.task,z.work,stage)}
 else visual.innerHTML='<div class="wave-context">Alle gegevens gecontroleerd.</div>';
 if(w.done){let result;if(w.values.tableVerdict==='none')result='Geen passend affine voorschrift.<small>Het derde punt past niet bij de rechte door de andere twee.</small>';else if(t.skill==='graph_from_table')result='De tabelpunten liggen op één rechte.';else{const m=T.candidate(t,w);result=C.formula(m.a,m.b);if(p.context)result+=`<small>x in ${p.context.xUnit}, y in ${p.context.yUnit}<br>${H(p.context.domain.min)} ≤ x ≤ ${H(p.context.domain.max)}</small>`}answers.innerHTML=`<div class="wave-result">${result}</div>`;button(dev?'Nieuwe variant':'Verder →',onNext,footer);return}
 if(['colA','colB'].includes(stage))table(t,w,submit,button,answers);
 else if(['pickA','pickB','plotA','plotB','plotRest'].includes(stage)){
  if(tableSkill)table(t,w,null,button,answers);
  const readout=document.createElement('div');readout.className='transfer-readout';answers.append(readout);
  const read=cursor=>{readout.innerHTML='Cursor '+coord(C.gridPoint(t,cursor))};read(w.cursor||{x:0,y:0});
  const remember=()=>{w.gridEdits||=[];w.gridEdits.push({...w.cursor||{x:0,y:0}});w.gridEdits=w.gridEdits.slice(-24)};
  const nudges=document.createElement('div');nudges.className='construct-nudges';answers.append(nudges);
  for(const [axis,delta,label] of [['x',-1,'x −'],['x',1,'x +'],['y',-1,'y −'],['y',1,'y +']])button(label,()=>{remember();w.cursor||={x:0,y:0};w.cursor[axis]=Math.max(-5,Math.min(5,w.cursor[axis]+delta));redraw()},nudges);
  button('Plaats punt',()=>submit(C.gridPoint(t,w.cursor||{x:0,y:0})),footer);
  const svg=visual.querySelector('svg');let pending=null;
  const snap=e=>{const v=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());return {x:Math.max(-5,Math.min(5,Math.round((v.x-110)/18))),y:Math.max(-5,Math.min(5,Math.round((110-v.y)/18)))}};
  const preview=v=>{svg.querySelector('.transfer-cursor').setAttribute('cx',110+18*v.x);svg.querySelector('.transfer-cursor').setAttribute('cy',110-18*v.y);read(v)};
  svg.onpointerdown=e=>{if(!e.isPrimary)return;pending=snap(e);svg.setPointerCapture(e.pointerId);preview(pending);e.preventDefault()};svg.onpointermove=e=>{if(pending){pending=snap(e);preview(pending)}};
  svg.onpointercancel=()=>{pending=null;preview(w.cursor||{x:0,y:0})};svg.onpointerup=e=>{if(!pending)return;gridGesture=true;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);remember();w.cursor=pending;pending=null;onChange();requestAnimationFrame(()=>{if(svg.isConnected){mount(t,opts);opts.onRendered?.()}})};
  svg.onkeydown=e=>{const moves={ArrowLeft:['x',-1],ArrowRight:['x',1],ArrowUp:['y',1],ArrowDown:['y',-1]};if(moves[e.key]){e.preventDefault();remember();w.cursor||={x:0,y:0};const [axis,d]=moves[e.key];w.cursor[axis]=Math.max(-5,Math.min(5,w.cursor[axis]+d));redraw();visual.querySelector('svg').focus()}};
 }else if(stage==='draw'){table(t,w,null,button,answers);button('Trek rechte',()=>submit('draw'),footer)}
 else if(stage==='tableVerdict'){button('Past bij alle punten',()=>submit('fits'));button('Geen passend voorschrift',()=>submit('none'))}
 else if(stage==='bRoute'){button('b aflezen',()=>submit('read'));button('b met een punt berekenen',()=>submit('point'))}
 else if(stage==='roleA'||stage==='roleB'){button('Verandering per eenheid',()=>submit('rate'));button('Startwaarde',()=>submit('start'))}
 else if(stage==='contextDomain'){for(const [value,x] of [['negative',C.q(-1)],['inside',p.context.testX],['outside',C.add(p.context.domain.max,1)]])button('x = '+H(x)+' '+p.context.xUnit,()=>submit(value))}
 else if(stage==='point'){const points=T.points(t,w);for(const [i,P] of points.entries())button((i?'B':'A')+coord(P),()=>submit(i?'B':'A'))}
 else if(stage==='subY'||stage==='subX'){const P=T.points(t,w)[w.values.point==='B'?1:0];for(const axis of ['x','y'])button(axis+' = '+H(P[axis]),()=>submit(axis))}
 else if(stage==='ys'||stage==='xs'){const [A,B]=T.points(t,w);root.RechtenCoordinateBuilder.mount({A,B},w,stage,{visual,answers,question,status,footer,redraw,submit,undo:()=>C.undo(w)});return}
 else {
  answers.classList.add('wave-keypad');
  if(gridStage){answers.classList.add('transfer-read-b');const note=document.createElement('div');note.className='transfer-grid-entry';visual.append(note)}
  let holder=visual.querySelector('.wave-context');if(!holder){holder=document.createElement('div');holder.className='transfer-number';visual.append(holder)}
  if(p.context&&['contextZero','contextTest'].includes(stage)){const m=p.model,x=stage==='contextZero'?C.q(0):p.context.testX;holder.innerHTML=`<div class="wave-equation">${C.formula(m.a,m.b)}</div><small>x = ${H(x)} ${p.context.xUnit}; y in ${p.context.yUnit}</small>`}
  const entry=document.createElement('div');entry.className='wave-entry';entry.innerHTML=`<span class="frac"><span class="${w.part===0?'active':''}">${w.entry[0]||'□'}</span><span class="${w.part===1?'active':''}">${w.entry[1]||'□'}</span></span>${p.context?`<small>${['contextA','a','formulaA'].includes(stage)?p.context.yUnit+'/'+p.context.xUnit:stage==='dx'?p.context.xUnit:p.context.yUnit}</small>`:''}`;holder.append(entry);
  for(const key of ['7','8','9','teller','noemer','4','5','6','±','⌫','1','2','3','0','wis'])button(key,()=>{if(key==='teller'||key==='noemer'){w.part=key==='teller'?0:1;w.replace=true}else if(key==='wis'){w.entry=['','1'];w.part=0;w.replace=false}else if(key==='⌫')w.entry[w.part]=w.entry[w.part].slice(0,-1);else if(key==='±')w.entry[w.part]=w.entry[w.part].startsWith('-')?w.entry[w.part].slice(1):'-'+w.entry[w.part];else if(w.entry[w.part].length<5){w.entry[w.part]=w.replace?key:w.entry[w.part]+key;w.replace=false}redraw()});
  button('Controleer',()=>{const value=C.parse(w.entry.join('/'));if(!value){status.textContent='Gebruik een teller en een noemer ongelijk aan nul.';return}submit(value)},footer);
 }
 button('Terug',()=>{if(w.gridEdits?.length)w.cursor=w.gridEdits.pop();else C.undo(w);redraw()},footer).disabled=!w.history.length&&!w.gridEdits?.length;
 if(tableSkill&&!status.textContent)status.textContent='Controleer alle kolommen; een passend voorschrift kan ontbreken.';
}
root.RechtenTransferUI={mount,explanation,grid,story};
})(globalThis);
