/* Remaining Hellingrug tasks: adapters around the existing exact validators. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../trainer/wave-core.js'));else root.RechtenV2Lines=factory(root.RechtenWave)})(globalThis,function(W){
'use strict';
const skills=['line_behavior','special_lines'],count=skill=>skill==='line_behavior'?9:6;
const firstPhase=t=>t.skill_id==='special_lines'?'line-special':t.representation==='points'?'line-plot':'line-behavior';
function makeTask(skill,index=0,run=1){
 if(!skills.includes(skill))throw Error('Onbekende rechtevaardigheid');
 const special=skill==='special_lines';
 const rows=special?[[-2,0,3,0],[2,-3,2,2],[-2,-1,2,3],[-3,-2,1,-2],[0,-2,0,3],[1,2,1,2]]:[[-1,0,0,-2],[0,2,2,-1],[1,.5,-1,3.5],[-2,-2,1,1],[-1,-1,1,2],[-1,-1.5,1,1.5],[-2,1,2,1],[-2,-2,2,-2],[-2,-.5,2,-.5]];
 const row=rows[index%rows.length],shift=[0,.5,-.5][(run-1)%3],A={x:W.fromNumber(row[0]),y:W.fromNumber(row[1]+shift)},B={x:W.fromNumber(row[2]),y:W.fromNumber(row[3]+shift)},model=W.model(A,B),representation=special?'points':['graph','slope','points'][index%3];
 const variant=model.kind==='identical'?'identical':model.kind==='vertical'?'vertical':!model.a.n?'horizontal':model.a.n>0?'positive':'negative';
 return {id:`rechten-v2:hellingrug:${skill}:${run}:${index}`,world:'hellingrug',skill_id:skill,family_id:'F2',mode:index===0?'discover':'practice',index,count:count(skill),variant,points:{A,B},model,representation,gridStep:[A.x,A.y,B.x,B.y].some(q=>q.d!==1)?.5:1,bounds:{xMin:-5,xMax:5,yMin:-5,yMax:5},given_representations:[representation],legacy:{skill,params:{A,B,model}},hints:special?[
 'Vergelijk eerst de x-coördinaten en daarna de y-coördinaten.',
 'Verschillende punten met dezelfde y bepalen een horizontale rechte. Dezelfde x geeft een verticale rechte.',
 'Bij een functie hoort bij elke x precies één y. Op een verticale rechte horen meerdere y-waarden bij dezelfde x.',
 'Als A en B samenvallen, heb je maar één punt. Daardoor is er geen unieke rechte bepaald.',
 'Ander voorbeeld: A(−3, 4) en B(1, 4) geven y = 4: horizontaal en een functie. A(2, −1) en B(2, 3) geven x = 2: verticaal en geen functie.'
 ]:[
 'Lees de rechte steeds van links naar rechts: x neemt toe.',
 'Stijgend: y wordt groter. Dalend: y wordt kleiner. Constant: y blijft gelijk.',
 'Het teken van a beslist: positief is stijgend, negatief is dalend, nul is constant.',
 'Als A en B in omgekeerde volgorde gegeven zijn, kijk je toch van links naar rechts.',
 'Ander voorbeeld: A(−3, 4) en B(1, 4) hebben dezelfde y. De rechte is constant en a = 0. Probeer daarna een nieuw geval.'
 ]};
}
const validPlot=(t,p)=>!!p&&['x','y'].every(k=>typeof p[k]==='number'&&Number.isFinite(p[k])&&Math.abs(p[k])<=5&&Number.isInteger(p[k]/t.gridStep));
const syntax=message=>({ok:false,kind:'interaction_error',code:'input.missing',message,keep:{}});
function pointResult(t,name,p){if(!validPlot(t,p))return {ok:false,code:'point.missing',message:`Plaats punt ${name} op het rooster.`};const r=W.constructionCheck({skill:'point_plot',params:{target:t.points[name]}},{x:W.fromNumber(p.x),y:W.fromNumber(p.y)});return {...r,message:r.ok?`Punt ${name} staat goed.`:`Punt ${name}: ${r.message}`}}
const classification=t=>t.model.kind==='identical'?'neither':t.model.kind==='vertical'?'vertical':t.model.a.n===0?'horizontal':'neither';
const functionKind=t=>t.model.kind==='identical'?'unknown':t.model.kind==='vertical'?'no':'yes';
function check(t,v,phase){
 if(phase==='line-plot'){
  if(!v.plotA||!v.plotB)return syntax('Plaats eerst A én B op het rooster.');
  const a=pointResult(t,'A',v.plotA),b=pointResult(t,'B',v.plotB),ok=a.ok&&b.ok;
  return {ok,kind:ok?'correct':'hypothesis',code:ok?null:!a.ok?a.code:b.code,message:ok?'Beide punten staan goed. Kijk nu van links naar rechts.':!a.ok?a.message:b.message,keep:{plotA:a.ok,plotB:b.ok}};
 }
 if(phase==='line-behavior'){
  if(!['stijgend','dalend','constant'].includes(v.behavior))return syntax('Kies stijgend, dalend of constant.');
  const r=W.check(t.legacy,{index:0,values:{}},v.behavior);
  return {...r,kind:r.ok?'correct':'hypothesis',code:r.ok?null:r.code,message:r.ok?`Juist: de rechte is ${v.behavior}.`:t.representation==='slope'?'Kijk naar het teken van a: positief, negatief of nul.':'Volg de rechte van links naar rechts. Wordt y groter, kleiner of blijft y gelijk?',keep:{}};
 }
 if(!['horizontal','vertical','neither'].includes(v.lineKind)||!['yes','no','unknown'].includes(v.isFunction))return syntax('Beantwoord beide vragen: het soort rechte en of het een functie is.');
 const oblique=t.model.kind==='affine'&&t.model.a.n!==0,mapped=v.lineKind==='horizontal'?'horizontaal':v.lineKind==='vertical'?'verticaal':t.model.kind==='identical'?'identiek':'geen van beide';
 // The original classification covers horizontal/vertical/coincident; oblique is an exact affine extension.
 const lineOK=oblique?v.lineKind==='neither':W.check(t.legacy,{index:0,values:{}},mapped).ok;
 const fnOK=t.model.kind==='identical'?v.isFunction==='unknown':W.check(t.legacy,{index:4,values:{}},v.isFunction==='yes'?'functie':v.isFunction==='no'?'geen functie':'onbepaald').ok;
 const keep={lineKind:lineOK,isFunction:fnOK};
 if(!lineOK||!fnOK)return {ok:false,kind:'hypothesis',code:!lineOK?'line.classification':'line.function',keep,message:!lineOK?'Vergelijk de coördinaten. Gelijke y: horizontaal; gelijke x: verticaal. Als beide punten hetzelfde zijn, is er geen unieke rechte.':t.model.kind==='identical'?'A en B vallen samen. Eén punt bepaalt geen unieke rechte, dus je kunt dit niet vaststellen.':'Een functie heeft bij elke x precies één y. Controleer of dat hier zo is.'};
 for(const name of ['A','B'])if(v['plot'+name]){const r=pointResult(t,name,v['plot'+name]);if(!r.ok)return {ok:false,kind:'hypothesis',code:r.code,keep,message:`Je antwoorden kloppen. ${r.message} Verplaats het punt of wis je plaatsing.`}}
 return {ok:true,kind:'correct',code:null,keep,message:t.model.kind==='identical'?'Juist: de punten vallen samen. Er is geen unieke rechte; of die een functie is, kun je niet bepalen.':oblique?'Juist: de rechte is schuin en stelt een functie voor.':t.model.kind==='vertical'?'Juist: de rechte is verticaal en stelt geen functie voor.':'Juist: de rechte is horizontaal en stelt een functie voor.'};
}
return Object.freeze({skills,count,makeTask,firstPhase,validPlot,pointResult,classification,functionKind,check});
});
