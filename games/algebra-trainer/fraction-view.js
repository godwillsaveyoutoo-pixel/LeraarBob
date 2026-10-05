/* Touch workflow for the fraction prototype; state remains in the saved result. */
(()=>{
'use strict';
const F=AlgebraFractions,C=AlgebraCore;
function mount(api){
 const $=s=>document.querySelector(s),math=C.texHTML;
 const state=()=>F.init(api.task(),api.result());
 function remember(){const r=api.result();r.fractionUndo=r.fractionUndo||[];r.fractionUndo.push(F.copy(state()));if(r.fractionUndo.length>40)r.fractionUndo.shift();}
 function update(message='',bad=false){api.feedback(message,bad);api.render();}
 function chooseRoute(route){remember();const s=state();s.route=route;s.phase='number';update();}
 function chooseNumber(number){
  const s=state(),check=F.numberCheck(s.current,number);
  if(!check.ok){api.result().errors++;update(check.message,true);return;}
  remember();s.build=F.prepare(s,s.route,number);s.phase='build';s.blocks={lhs:[],rhs:[]};s.signs={};s.field='lhs';update(check.message);
 }
 function chooseOperation(index){remember();const s=state(),op=F.operationChoices(s.current)[index];s.build=F.prepareOperation(s,op);s.phase='build';s.blocks={lhs:[],rhs:[]};s.signs={};s.field='lhs';update('Bouw zelf de regel na deze bewerking.');}
 function addTerm(index){
  const s=state(),list=s.blocks[s.field],sign=s.signs[s.field];
  if(list.length&&!sign){update('Kies eerst + of − tussen de termen.');return;}
  if(list.length>=4){update('Wis dit lid of neem een term terug met ↶.');return;}
  const item=F.copy(F.palette(s)[index]);remember();if(sign==='-')item.n=-item.n;list.push(item);delete s.signs[s.field];update();
 }
 function check(){
  const t=api.task(),r=api.result(),checked=F.validate(t,r);
  if(!checked.ok){if(!checked.incomplete)r.errors++;update(checked.message,true);return;}
  remember();const s=state(),skill=s.build.kind==='common'?'common-denominator':s.build.kind==='clear'?'clear-denominators':'equation-operation';
  r.fractionSkills=r.fractionSkills||[];r.fractionSkills.push({skill,done:true,number:s.build.number||null});r.done=F.commit(s);
  update(r.done?'Juist. x staat vrij.':checked.message);
  if(r.done)$('#nextExerciseBtn').focus({preventScroll:true});
 }
 function undo(){const r=api.result(),old=r.fractionUndo?.pop();if(!old)return;r.fraction=old;r.done=false;r.fractionSkills=old.steps.map(st=>({skill:st.kind==='common'?'common-denominator':st.kind==='clear'?'clear-denominators':'equation-operation',done:true,number:st.number||null}));update('Laatste keuze teruggenomen.');}
 function renderAnswer(t,r){
  const s=F.init(t,r),host=$('#touchAnswer');host.hidden=false;
  if(s.phase==='build'){
   host.innerHTML='<div class="fractionBefore"><small>Vorige regel</small><span class="fractionMath" data-math-tex="'+C.escapeHTML(F.equationTex(s.current))+'">'+math(F.equationTex(s.current))+'</span></div><div class="touchFields">'+['lhs','rhs'].map((side,i)=>(i?'<span class="touchEquals">=</span>':'')+'<button type="button" class="touchField" data-fraction-field="'+side+'" aria-label="'+(side==='lhs'?'Links':'Rechts')+'" aria-pressed="'+(s.field===side)+'"><small>'+(side==='lhs'?'Links':'Rechts')+'</small><span class="touchFieldMath"></span></button>').join('')+'</div><p class="touchPrompt">Kies een term. Kies daarna + of − en de volgende term.</p>';
   host.querySelectorAll('[data-fraction-field]').forEach(b=>{
    const side=b.dataset.fractionField,terms=s.blocks[side],sign=s.signs[side],tex=(terms.length?F.sideTex(terms):'\\square')+(sign?' '+sign+' \\square':'');
    const el=b.querySelector('.touchFieldMath');el.dataset.mathTex=tex;el.innerHTML=math(tex);
    b.onclick=()=>{s.field=side;api.render();};
   });
  }else{
   const tex=F.equationTex(s.current);
   host.innerHTML='<div class="fractionCurrent fractionMath" data-math-tex="'+C.escapeHTML(tex)+'">'+math(tex)+'</div><p class="touchPrompt">'+(s.phase==='done'?'Jouw vergelijking is opgelost.':s.steps.length?'Jouw nieuwe regel':'')+'</p>';
  }
 }
 function renderControls(t,r){
  const s=F.init(t,r),form=$('#production');form.classList.remove('hidden');form.classList.add('touchProduction','fractionProduction');let html='';
  if(s.phase==='route'){
   const same=F.sameDenominator(s.current);
   html='<p class="fractionLabel">Kies je aanpak</p><div class="fractionRoutes"><button type="button" data-fraction-route="common" '+(same?'disabled':'')+'><strong>Gelijknamig maken</strong><small>'+(same?'De noemers zijn al gelijk.':'Teller en noemer aanpassen')+'</small></button><button type="button" data-fraction-route="clear"><strong>Noemers wegwerken</strong><small>Elke term in beide leden vermenigvuldigen</small></button></div>';
   if(s.steps.length)html+='<button type="button" data-fraction-solve>Verder oplossen</button>';
  }else if(s.phase==='number'){
   html='<p class="fractionLabel">'+(s.route==='common'?'Gemeenschappelijke noemer':'Factor voor beide leden')+'</p><div class="fractionNumbers">'+F.numberChoices(s.current).map(n=>'<button type="button" data-fraction-number="'+n+'">'+n+'</button>').join('')+'</div>';
  }else if(s.phase==='build'){
   const items=F.palette(s),sign=s.signs[s.field],needsSign=s.blocks[s.field].length&&!sign;
   html='<div class="termHead"><span>Bouw '+(s.field==='lhs'?'links':'rechts')+'</span><div class="termSigns">'+['+','-'].map(v=>'<button type="button" data-fraction-sign="'+v+'" aria-label="'+(v==='+'?'Optellen':'Aftrekken')+'" aria-pressed="'+(v===sign)+'">'+(v==='+'?'+':'−')+'</button>').join('')+'</div><button type="button" data-fraction-clear>Wis</button></div><div class="termPalette">'+items.map((item,i)=>'<button type="button" class="termTile" data-fraction-term="'+F.key(item)+'" data-fraction-index="'+i+'" '+(needsSign?'disabled':'')+' aria-label="Bouwsteen '+C.escapeHTML(C.fallbackText(F.tex(item)))+'">'+math(F.tex(item))+'</button>').join('')+'</div>';
  }else if(s.phase==='operation'){
   html='<p class="fractionLabel">Bewerking op beide leden</p><div class="fractionOperations">'+F.operationChoices(s.current).map((op,i)=>'<button type="button" data-fraction-operation="'+i+'">'+math(F.operationTex(op))+'</button>').join('')+'</div>';
  }else html='<p class="productionSuccess">✓ x staat vrij</p>';
  form.innerHTML=html;
  form.querySelectorAll('[data-fraction-route]').forEach(b=>b.onclick=()=>chooseRoute(b.dataset.fractionRoute));
  form.querySelectorAll('[data-fraction-number]').forEach(b=>b.onclick=()=>chooseNumber(Number(b.dataset.fractionNumber)));
  form.querySelectorAll('[data-fraction-index]').forEach(b=>b.onclick=()=>addTerm(Number(b.dataset.fractionIndex)));
  form.querySelectorAll('[data-fraction-operation]').forEach(b=>b.onclick=()=>chooseOperation(Number(b.dataset.fractionOperation)));
  form.querySelectorAll('[data-fraction-sign]').forEach(b=>b.onclick=()=>{remember();s.signs[s.field]=b.dataset.fractionSign;update('Kies de volgende term.');});
  form.querySelector('[data-fraction-clear]')?.addEventListener('click',()=>{remember();s.blocks[s.field]=[];delete s.signs[s.field];update();});
  form.querySelector('[data-fraction-solve]')?.addEventListener('click',()=>{remember();s.phase='operation';update();});
  form.onsubmit=e=>{e.preventDefault();if(!r.done)check();};
 }
 function history(t,r){const s=F.init(t,r);return [{tex:F.equationTex(t.fractions),caption:'Oorspronkelijke opgave'},...s.steps.map(st=>({tex:F.equationTex(st.target),caption:st.kind==='common'?'Gelijknamig gemaakt met noemer '+st.number:st.kind==='clear'?'Elke term vermenigvuldigd met '+st.number:C.fallbackText(F.operationTex(st.operation))+' op beide leden'}))];}
 return {renderAnswer,renderControls,check,undo,history};
}
window.AlgebraFractionView=Object.freeze({mount});
})();
