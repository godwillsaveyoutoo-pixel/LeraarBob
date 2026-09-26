/* Native controls and exact SVG coordinates shared by prototype and missions. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../../trainer/wave-core.js'));else root.RechtenV2Workbench=factory(root.RechtenWave)})(globalThis,function(W){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>typeof v==='number'?v:W.num(v);
const text=v=>W.text(typeof v==='number'?W.fromNumber(v):v);
function field(name,label,value='',options={}){return `<label class="value-field">${esc(label)}<input name="${esc(name)}" value="${esc(value)}" type="text" inputmode="${options.inputmode||'text'}" autocomplete="off" spellcheck="false" maxlength="32" ${options.disabled?'readonly aria-readonly="true"':''} aria-label="${esc(label)}"></label>`}
function choice(name,label,value,selected){return `<button type="button" data-choice="${esc(name)}" data-value="${esc(value)}" aria-pressed="${String(value)===String(selected)}">${esc(label)}</button>`}
function stepper(name,label,value=''){return `<div class="stepper">${field(name,label,value)}<div><button type="button" data-step="${name}" data-amount="-1" aria-label="${esc(label)} één kleiner">−</button><button type="button" data-step="${name}" data-amount="1" aria-label="${esc(label)} één groter">+</button></div></div>`}
function fraction(numerator,denominator,locked=false){return `<div class="fraction-entry" role="group" aria-label="Helling als breuk, delta y gedeeld door delta x">${field('numerator','Teller',numerator,{disabled:locked})}<span class="fraction-bar" aria-hidden="true"></span>${field('denominator','Noemer',denominator,{disabled:locked})}</div>`}
function formula(model){const label=`y is ${text(model.a)} maal x plus ${text(model.b)}`;return `<div class="formula" role="math" aria-label="${esc(label)}">${W.formula(model.a,model.b)}</div>`}
function table(rows){return `<table class="data-table"><caption class="sr-only">Invoer x en uitvoer y</caption><thead><tr><th scope="col">x</th><th scope="col">y</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${W.html(p.x)}</td><td>${W.html(p.y)}</td></tr>`).join('')}</tbody></table>`}
let uid=0;
function graph({model=null,points={},bounds={xMin:-5,xMax:5,yMin:-5,yMax:5},candidate=null,probes=[],anchor=null,region=null,closed=false,caption='Assenstelsel',interactive=false,delta=null}={}){
 const {xMin,xMax,yMin,yMax}=bounds,id='v2plot'+ ++uid;
 const X=x=>42+(number(x)-xMin)/(xMax-xMin)*520,Y=y=>294-(number(y)-yMin)/(yMax-yMin)*260;
 const axisY=Y(Math.min(yMax,Math.max(yMin,0))),axisX=X(Math.min(xMax,Math.max(xMin,0)));
 const tickX=Math.max(1,Math.ceil((xMax-xMin)/10)),tickY=Math.max(1,Math.ceil((yMax-yMin)/(yMax-yMin>20?5:8)));let grid='';
 for(let x=Math.ceil(xMin/tickX)*tickX;x<=xMax;x+=tickX)grid+=`<path class="grid" d="M${X(x)} 28V298"/><text x="${X(x)}" y="${axisY+20}" text-anchor="middle">${x}</text>`;
 for(let y=Math.ceil(yMin/tickY)*tickY;y<=yMax;y+=tickY)grid+=`<path class="grid" d="M38 ${Y(y)}H566"/>${y===0?'':`<text x="${axisX-10}" y="${Y(y)+5}" text-anchor="end">${y}</text>`}`;
 const line=(m,cls)=>m?.kind==='affine'?`<path class="${cls}" d="M${X(xMin)} ${Y(W.add(W.mul(m.a,W.q(xMin)),m.b))}L${X(xMax)} ${Y(W.add(W.mul(m.a,W.q(xMax)),m.b))}"/>`:'';
 const pointData=Object.entries(points).map(([name,p])=>`${name}: (${text(p.x)}, ${text(p.y)})`).join('; ');
 const readable=model?`Rechte door (${xMin}, ${text(W.add(W.mul(model.a,W.q(xMin)),model.b))}) en (${xMax}, ${text(W.add(W.mul(model.a,W.q(xMax)),model.b))}).`:pointData;
 let selected='';const parsed=anchor==null?null:W.parse(String(anchor));
 if(parsed&&number(parsed)>=xMin&&number(parsed)<=xMax){const px=X(parsed);selected=`<path class="anchor" d="M${px} ${axisY-16}V${axisY+16}"/><circle class="anchor-pin" cx="${px}" cy="${axisY}" r="7"/>`;if(region==='left'||region==='right')selected+=`<path class="interval" d="M${region==='left'?X(xMin):px} ${axisY+32}H${region==='left'?px:X(xMax)}"/><circle class="endpoint ${closed?'closed':''}" cx="${px}" cy="${axisY+32}" r="6"/>`}
 if(region==='all')selected+=`<path class="interval" d="M${X(xMin)} ${axisY+32}H${X(xMax)}"/>`;
 const psvg=probes.filter(p=>p?.x!=null&&p?.y!=null).map(p=>`<path class="probe" d="M${X(p.x)} ${axisY}V${Y(p.y)}"/><circle class="probe-dot" cx="${X(p.x)}" cy="${Y(p.y)}" r="6"/>`).join('');
 let triangle='';if(delta?.A&&delta?.dx&&delta?.dy){const ex=W.add(delta.A.x,delta.dx),ey=W.add(delta.A.y,delta.dy);triangle=`<path class="delta-path" d="M${X(delta.A.x)} ${Y(delta.A.y)}H${X(ex)}V${Y(ey)}"/>`}
 return `<svg class="math-graph" viewBox="0 0 600 340" role="img" aria-label="${esc(caption)}" ${interactive?'data-axis-picker="root"':''}><title>${esc(caption)}</title><desc>${esc(readable)} x van ${xMin} tot ${xMax}; y van ${yMin} tot ${yMax}. Gebruik de waardevelden voor bediening.</desc><defs><clipPath id="${id}"><rect x="38" y="24" width="530" height="276"/></clipPath></defs>${grid}<path class="axis" d="M38 ${axisY}H570M${axisX} 300V20"/><text class="axis-name" x="580" y="${axisY+5}">x</text><text class="axis-name" x="${axisX+9}" y="20">y</text><g clip-path="url(#${id})">${line(model,'model-line')}${line(candidate,'candidate-line')}${triangle}${psvg}${Object.entries(points).map(([name,p])=>`<circle class="given-point" cx="${X(p.x)}" cy="${Y(p.y)}" r="6"/><text class="point-name" x="${X(p.x)+9}" y="${Y(p.y)-10}">${esc(name)}</text>`).join('')}</g>${selected}</svg>`;
}
return {esc,field,choice,stepper,fraction,formula,table,graph};
});
