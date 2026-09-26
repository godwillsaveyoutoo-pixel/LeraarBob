/* Three Hellingrug adapters. All mathematical comparisons use the existing exact engine. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../trainer/wave-core.js'),require('./semantic-math-core.js'),require('./lines-core.js'));else root.RechtenV2Hills=factory(root.RechtenWave,root.RechtenV2Math,root.RechtenV2Lines)})(globalThis,function(W,M,L){
'use strict';
const skills=['delta','slope','slope_from_two_points',...L.skills],count=6,slots=['y1','y0','x1','x0'];
const names={delta:'Δx en Δy',slope:'Richtingscoëfficiënt',slope_from_two_points:'Helling uit twee punten',line_behavior:'Stijgend, dalend of constant',special_lines:'Bijzondere rechten'};
const fraction=(top,bottom)=>{const row=value=>value.includes('<sub>')?`<span class="hill-formula-expression">${value}</span>`:value;return `<span class="hill-fraction"><span>${row(top)}</span><span>${row(bottom)}</span></span>`};
function choices(want,other,seed,reciprocal=false){const values=[want,W.mul(-1,want),other,W.mul(-1,other),W.q(0),W.add(want,1),W.sub(want,1),W.q(2),W.q(-2)];if(reciprocal&&want.n)values.splice(2,0,W.div(1,want));const unique=[];for(const q of values)if(!unique.some(p=>W.eq(p,q)))unique.push(q);const out=unique.slice(0,4);for(let i=3;i>0;i--){seed=(seed*1664525+1013904223)>>>0;const j=seed%(i+1);[out[i],out[j]]=[out[j],out[i]]}return out}
function makeTask(skill,index=0,run=1){
 if(L.skills.includes(skill))return L.makeTask(skill,index,run);
 if(!skills.includes(skill))throw Error('Onbekende hellingvaardigheid');
 const pool=[[0,2,2,1],[-2,-1,1,2],[-1,3,1,-1],[-3,-2,1,0],[-2,2,2,2],[1,-2,3,1]];
 let row=pool[index%count];if(skill==='slope_from_two_points'&&index===0)row=[1,0,2,-2];
 const shift=(run-1)%3; // Translate both points vertically on a replay, keeping the graph in bounds.
 const yShift=shift===2?-1:shift;
 const [ax,ay,bx,by]=row,A={x:W.q(ax),y:W.q(ay+yShift)},B={x:W.q(bx),y:W.q(by+yShift)},model=W.model(A,B),dx=W.sub(B.x,A.x),dy=W.sub(B.y,A.y);
 const variant=!model.a.n?'horizontal':model.a.d>1?(model.a.n<0?'negative-fraction':'positive-fraction'):model.a.n<0?'negative':'positive';
 return {id:`rechten-v2:hellingrug:${skill}:${run}:${index}`,world:'hellingrug',skill_id:skill,family_id:'F2',index,mode:index===0?'discover':'practice',variant,points:{A,B},model,dx,dy,bounds:{xMin:-5,xMax:5,yMin:-5,yMax:5},legacy:{skill:'slope_from_two_points',params:{A,B,model}},given_representations:skill==='slope_from_two_points'?['coordinates']:['graph'],options:{dx:choices(dx,dy,run*19+index*7),dy:choices(dy,dx,run*23+index*13),a:choices(model.a,dx,run*29+index*11,true)},hints:[
 'Volg steeds dezelfde richting: van A naar B.',
 'Δx is horizontaal: xB − xA. Δy is verticaal: yB − yA.',
 'Omhoog en rechts zijn positief; omlaag en links zijn negatief. De helling is Δy gedeeld door Δx.',
 'Ander voorbeeld: A(−1, 1), B(2, 7). Δx = 2 − (−1) en Δy = 7 − 1.',
 'Voorbeeld: A(−1, 1), B(2, 7): Δx = 3 en Δy = 6, dus a = 6/3 = 2. Probeer nu een nieuw geval.'
 ]};
}
const firstPhase=(skill,task)=>L.skills.includes(skill)?L.firstPhase(task):skill==='delta'?'hill-dx':skill==='slope'?'hill-rate':'hill-inspect';
const nextPhase=phase=>({'line-plot':'line-behavior','line-behavior':'next-task','line-special':'next-task','hill-dx':'hill-dy','hill-dy':'next-task','hill-rate':'next-task','hill-fill':'hill-calculate','hill-calculate':'next-task'})[phase];
const syntax=message=>({ok:false,kind:'interaction_error',code:'input.missing',message,keep:{}});
const result=(r,message,keep={})=>({...r,kind:r.ok?'correct':'hypothesis',code:r.ok?null:r.code,message,keep});
function coordinate(t,token){return /^[AB]\.[xy]$/.test(token||'')?t.points[token[0]][token[2]]:null}
function check(t,v,phase){
 if(L.skills.includes(t.skill_id))return L.check(t,v,phase);
 if(phase==='hill-fill'){
  if(!slots.every(k=>coordinate(t,v[k])))return syntax('Vul eerst alle vier vakjes met een coördinaat.');
  const ys=[v.y1[0],v.y0[0]],xs=[v.x1[0],v.x0[0]],work={values:{ys}};
  const yOK=[v.y1,v.y0].every(s=>s.endsWith('.y'))&&W.check(t.legacy,{...work,index:0},ys).ok;
  const xOK=[v.x1,v.x0].every(s=>s.endsWith('.x'))&&W.check(t.legacy,{...work,index:1},xs).ok;
  const ok=yOK&&xOK,keep={y1:yOK,y0:yOK,x1:yOK&&xOK,x0:yOK&&xOK};
  return result({ok,code:!yOK?'delta.y_coordinates':'delta.direction'},ok?'De coördinaten staan goed: boven de y-waarden, onder de x-waarden, in dezelfde richting.':!yOK?'Gebruik bovenaan de twee y-coördinaten van verschillende punten.':'De teller klopt. Gebruik onderaan de x-coördinaten in dezelfde volgorde.',keep);
 }
 if(phase==='hill-calculate'){
  const a=M.parse(v.a);if(!a)return syntax('Vul een getal of breuk in, bijvoorbeeld −1/2.');
  const r=W.check(t.legacy,{index:2,values:{}},a);
  const message=r.ok?`Juist: a = ${W.text(a)}.`:W.eq(a,W.mul(-1,t.model.a))?'Controleer de tekens. Gebruik bij beide aftrekkingen dezelfde richting.':t.model.a.n&&W.eq(a,W.div(1,t.model.a))?'Je hebt de breuk omgekeerd. Deel Δy door Δx.':'Reken de teller en noemer uit en deel Δy door Δx.';
  return result(r,message);
 }
 const key=phase==='hill-dx'?'dx':phase==='hill-dy'?'dy':'a',field=key==='a'?'rateChoice':key+'Choice',i=String(v[field]??'');
 if(!/^[0-3]$/.test(i))return syntax('Kies eerst een antwoord.');
 const value=t.options[key][Number(i)],r=key==='a'?W.check(t.legacy,{index:2,values:{}},value):M.checkDeltas(t,{direction:'AB',dx:W.text(key==='dx'?value:t.dx),dy:W.text(key==='dy'?value:t.dy)});
 return result(r,r.ok?`Juist: ${key==='a'?'a':'Δ'+key[1]} = ${W.text(value)}.`:key==='dx'?'Δx = xB − xA. Kijk naar de horizontale verandering.':key==='dy'?'Δy = yB − yA. Omlaag is negatief; omhoog is positief.':'Deel Δy door Δx. Let op de volgorde en de tekens.');
}
return Object.freeze({lines:L,taskCount:skill=>L.skills.includes(skill)?L.count(skill):count,skills,count,slots,names,fraction,makeTask,firstPhase,nextPhase,coordinate,check});
});
