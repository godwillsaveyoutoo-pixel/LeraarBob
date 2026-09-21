/* Worked examples share the generator, geometry and notation of the exercises. */
(function(root){
'use strict';
const C=typeof module!=='undefined'&&module.exports?require('./vector-core.js'):root.VectorTrainerCore;
const {VectorMath:M,format:f,coord}=C,pointText=p=>`(${f(p.x)}, ${f(p.y)})`;
function build(t){
 const steps=[],target=t.target,start=t.start,refs=t.refs,strokes=[];
 const add=(title,text,calculation='')=>steps.push({title,text,calculation,strokes:strokes.map(s=>({...s})),point:null});
 const arrow=(p,v,name='r',role='vector')=>strokes.push({...M.stroke(p,M.endPointFromVector(p,v),role),name});
 const route=(parts,names)=>{let p=start;parts.forEach((v,i)=>{arrow(p,v,names[i]);p=M.endPointFromVector(p,v)});};
 const result=()=>{
  const single=['props','equal','free','opposite','scalar','points'].includes(t.skill);
  const name=['equal','free'].includes(t.skill)?'a':t.skill==='opposite'&&!M.isZero(target)?'−a':t.skill==='scalar'?`${f(t.factor)} a`:t.skill==='points'?'OP':t.answerLabel||'r';
  const position=t.choicePositions?t.choicePositions[t.options.findIndex(v=>M.vectorEquals(v,target))]:start;
  arrow(position,target,name,single?'vector':'result');
 };
 const directions=v=>`${f(Math.abs(v.dx))} ${v.dx<0?'naar links':'naar rechts'} en ${f(Math.abs(v.dy))} ${v.dy<0?'omlaag':'omhoog'}`;
 const arithmetic=(title,text,formula)=>add(title,text,formula);
 const finishPoint=p=>{steps.at(-1).point=p;};
 switch(t.skill){
 case 'props':
  add('Vergelijk drie kenmerken','De blauwe pijl a heeft een richting, een zin en een lengte. We veranderen hier één kenmerk.');result();
  add('Verander alleen het gevraagde kenmerk',({length:'De groene pijl is hier twee keer zo lang. Hij blijft evenwijdig en wijst dezelfde kant op.',direction:'De groene pijl ligt op een andere richting. Hij is even lang. Zin vergelijk je bij evenwijdige pijlen.',sense:'De groene pijl is even lang en evenwijdig, maar wijst de andere kant op.'})[t.property]);break;
 case 'equal':case 'free':
  add('Kijk naar de verplaatsing','Vergelijk richting, zin en lengte van a. De plaats op het blad hoort niet bij de vector.');result();
  add('Schuif zonder te draaien',t.interaction==='choice'?`Keuze ${t.options.findIndex(v=>M.vectorEquals(v,target))+1} heeft dezelfde richting, zin en lengte als a.`:'De groene kopie begint in P. Ze is evenwijdig, even lang en wijst dezelfde kant op als a.');break;
 case 'opposite':
  add('De zin omkeren',M.isZero(target)?'Een nulvector verplaatst je helemaal niet. Begin en einde vallen samen.':'−a is even lang en evenwijdig aan a, maar wijst de andere kant op.');result();
  add('Vergelijk het resultaat',M.isZero(target)?'Het cirkeltje markeert nul verplaatsing. Een nulvector heeft geen richting of zin.':t.interaction==='choice'?`Keuze ${t.options.findIndex(v=>M.vectorEquals(v,target))+1} is tegengesteld aan a.`:'De groene pijl is −a. Samen met a brengt hij je terug bij het begin.');break;
 case 'scalar':case 'coordscale':
  add('Lees de factor',`${f(t.factor)} a: de absolute waarde van de factor bepaalt de lengte. Een negatieve factor keert ook de zin om.`);
  if(t.skill==='scalar')result();
  arithmetic('Pas de factor overal toe',t.skill==='scalar'?'Vergelijk met de blauwe pijl: controleer de lengte en de kant waarnaar de nieuwe pijl wijst.':'Vermenigvuldig zowel de horizontale als de verticale verplaatsing.',t.skill==='scalar'?'':`${f(t.factor)} × ${coord(t.source)} = (${f(t.factor)} × (${f(t.source.dx)}), ${f(t.factor)} × (${f(t.source.dy)})) = ${coord(target)}`);break;
 case 'sum':case 'headtail':case 'commute':case 'parallelogram':{
  const parts=t.parts||refs.map(r=>r.v),[u,v]=parts,mid=M.endPointFromVector(start,u),end=M.endPointFromVector(mid,v);
  add('Bekijk de twee verplaatsingen','De blauwe pijlen geven u en v. Een kopie behoudt richting, zin en lengte.');
  if(t.skill==='parallelogram'){
   arrow(M.endPointFromVector(start,u),v,'v');arrow(M.endPointFromVector(start,v),u,'u');
   add('Maak het parallellogram af','Teken v vanaf de kop van u en u vanaf de kop van v. De kopieën ontmoeten elkaar.');
  }else{
   arrow(start,u,'u');add('Begin met u','Vertrek bij P en neem de volledige verplaatsing u over.');
   arrow(mid,v,'v');add('Sluit v aan','De staart van v komt precies aan de kop van u. Zo ontstaat één doorlopende route.');
  }
  result();
  if(t.skill==='commute'){const q=t.secondStart;arrow(q,v,'v');arrow(M.endPointFromVector(q,v),u,'u');arrow(q,target,'v+u','result');}
  add('Verbind begin en einde',t.skill==='commute'?'De twee routes beginnen op een andere plaats. Hun resultanten zijn wel gelijk: u + v = v + u.':'De gouden resultante loopt van P naar het laatste eindpunt. Ze beschrijft de hele verplaatsing in één pijl.');break;
 }
 case 'difference':case 'combination':{
  const a=refs[0].v,b=refs[1].v,k=t.skill==='combination'?t.factor:1,first=M.scale(a,k),minus=M.scale(b,-1);
  add('Maak van aftrekken optellen',`${t.skill==='combination'?f(k)+' a':'a'} − b betekent: eerst ${t.skill==='combination'?f(k)+' a':'a'}, daarna −b.`);
  arrow(start,first,t.skill==='combination'?`${f(k)} a`:'a');arrow(M.endPointFromVector(start,first),minus,'−b');
  add('Leg de verplaatsingen kop-staart','Keer b om. Leg zijn kopie aan het einde van de eerste verplaatsing.');result();
  add('Lees de totale verplaatsing','De gouden pijl verbindt het eerste beginpunt met het laatste eindpunt.','');break;
 }
 case 'decompose':case 'coords':{
  const dirs=t.dirs?.length?t.dirs:[M.vec(1,0),M.vec(0,1)],det=M.cross(...dirs),u=M.scale(dirs[0],M.cross(target,dirs[1])/det),v=M.subtract(target,u);
  add('Volg de gegeven richtingen',t.skill==='coords'?'Meet de verplaatsing van de pijl. De coördinaten van het eindpunt alleen zijn niet voldoende.':'Zoek één component in elke stippelrichting. Een component mag tegen de aangeduide richting in wijzen.');
  arrow(start,u,'u');add('Eerste component','Deze component neemt de eerste richting voor haar rekening.',t.skill==='coords'?`x = ${f(target.dx)}`:'');
  arrow(start,v,'v');arrow(M.endPointFromVector(start,u),v,'v');
  add('Tweede component en controle','De twee componenten moeten samen precies de oorspronkelijke pijl opleveren.',t.skill==='coords'?`(x, y) = ${coord(target)}`:'u + v = r');break;
 }
 case 'arrow':case 'basis':
  add('Lees horizontaal en verticaal',t.skill==='basis'?'eₓ is één stap naar rechts; eᵧ is één stap omhoog. De coëfficiënten vertellen hoeveel stappen je neemt.':`De vector ${coord(target)} geeft een verplaatsing, geen vast eindpunt.`);
  arrow(start,M.vec(target.dx,0),`${f(target.dx)} eₓ`);arrow(M.endPointFromVector(start,M.vec(target.dx,0)),M.vec(0,target.dy),`${f(target.dy)} eᵧ`);
  add('Vertrek bij het gegeven punt',`Neem ${directions(target)}. Een nul betekent: geen verplaatsing in die richting.`);result();
  add('Teken de ene verplaatsing','De resultante verbindt begin en einde.',`${f(target.dx)} eₓ + (${f(target.dy)}) eᵧ = ${coord(target)}`);break;
 case 'ab':{
  const {A,B}=t.inputPoints;
  add('Van beginpunt A naar eindpunt B',`A = ${pointText(A)} en B = ${pointText(B)}. Voor AB neem je telkens eind min begin.`);
  arithmetic('Trek per component af','Let op: een negatief begingetal trek je ook af.',`AB = (${f(B.x)} − (${f(A.x)}), ${f(B.y)} − (${f(A.y)})) = ${coord(target)}`);break;
 }
 case 'points':{
  add('Maak onderscheid tussen punt en vector',t.prompt);
  if(t.interaction==='point'){
   const backwards=t.variant%4===3,p=t.targetPoint;
   arrow(backwards?p:start,target,backwards?'AB':t.variant%4===2?'AP':'OP');
   add(backwards?'Reken terug vanaf B':'Tel de verplaatsing bij het beginpunt',backwards?`A = B − AB. Vanaf B neem je de tegengestelde verplaatsing.`:`x en y van het beginpunt krijgen elk hun eigen verplaatsing erbij.`,`${t.pointName||'P'} = ${pointText(p)}`);finishPoint(p);
  }else{result();add('Van O naar P','De plaatsvector OP begint in de oorsprong. Alleen dan zijn de vectorcoördinaten meteen ook de puntcoördinaten.',`OP = ${coord(target)}`);}break;
 }
 case 'coordadd':{
  const [a,b]=t.operands,op=t.operation==='subtract'?'−':'+';
  add('Werk met overeenkomstige componenten',`Bereken a ${op} b. ${op==='−'?'Trek beide componenten van b af.':'Tel x bij x en y bij y.'}`,t.givens);
  arithmetic('Reken horizontaal en verticaal apart','Bewaar de volgorde (x, y).',`(${f(a.dx)} ${op} (${f(b.dx)}), ${f(a.dy)} ${op} (${f(b.dy)})) = ${coord(target)}`);break;
 }
 case 'coordcombo':{
  const [a,b,c]=t.operands,u=M.scale(a,2),v=M.scale(b,-3);
  add('Werk eerst de veelvouden uit',t.givens,`2a = ${coord(u)}; −3b = ${coord(v)}`);
  arithmetic('Tel daarna per component op','Het minteken in −3b geldt voor beide componenten.',`${coord(u)} + ${coord(v)} + ${coord(c)} = ${coord(target)}`);break;
 }
 case 'unknown':{
  const [a,r]=t.operands;
  add('Maak de ontbrekende vector vrij','Uit 2a + b = r volgt b = r − 2a. Neem dezelfde verplaatsing aan beide kanten weg.',t.givens);
  arithmetic('Vul de bekende vectoren in','Controleer door je gevonden vector weer bij 2a op te tellen.',`b = ${coord(r)} − ${coord(M.scale(a,2))} = ${coord(target)}`);break;
 }
 case 'figure':{
  const pts=Object.fromEntries(t.points.map(p=>[p.name,p.p])),v=t.variant%4,names=[['A','D','C'],['A','B','C'],['C','A','B'],['A','B','C']][v];
  add('Volg de letters',v===3?'−CB is BC. Daarom is AB − CB gelijk aan AB + BC.':`${names[0]}${names[1]} eindigt waar ${names[1]}${names[2]} begint.`);
  for(let i=0;i<2;i++)arrow(pts[names[i]],M.vectorFromPoints(pts[names[i]],pts[names[i+1]]),names[i]+names[i+1]);
  add('Volg de route door de figuur',`Van ${names[0]} via ${names[1]} naar ${names[2]}. De tussenstop verandert het eindpunt niet.`);result();
  add('Verbind het eerste en laatste punt',`De som is ${names[0]}${names[2]}.`);break;
 }
 case 'route':{
  const [a,b,c]=t.operands,u=M.scale(a,2),v=M.scale(b,3),parts=[u,v,...(c?[M.scale(c,-1)]:[])],displacement=M.sum(parts),p=t.routeStart||start,end=M.endPointFromVector(p,displacement);
  add('Bereken eerst de verplaatsing',t.givens||'Neem twee keer a, drie keer b en de tegengestelde vector van c.',`${parts.map(coord).join(' + ')} = ${coord(displacement)}`);
  if(t.level===0){route(parts,['2a','3b','−c']);result();}
  add('Vertrek daarna bij het juiste punt',`De verplaatsing ${coord(displacement)} begint in ${pointText(p)}. Tel haar componenten bij die van het beginpunt.`,`Eindpunt = (${f(p.x)} + (${f(displacement.dx)}), ${f(p.y)} + (${f(displacement.dy)})) = ${pointText(end)}`);if(t.interaction==='point')finishPoint(end);break;
 }
 case 'fourth':{
  const {A,B,C,D}=t.inputPoints,v=M.vectorFromPoints(B,C);
  add('Gebruik de volgorde A, B, C, D','De overstaande zijden geven gelijke vectoren: AD = BC.',`BC = (${f(C.x)} − (${f(B.x)}), ${f(C.y)} − (${f(B.y)})) = ${coord(v)}`);
  arrow(A,v,'AD');add('Neem BC over vanaf A','Het einde van die kopie is D. Controleer dat beide paren overstaande zijden evenwijdig zijn.',`D = (${f(A.x)} + (${f(v.dx)}), ${f(A.y)} + (${f(v.dy)})) = ${pointText(D)}`);finishPoint(D);break;
 }
 default:throw Error('Missing lesson: '+t.skill);
 }
 return {steps,takeaway:steps.at(-1).text,conclusion:steps.at(-1).calculation};
}
const api={build};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.VectorTrainerLessons=api;
})(typeof globalThis!=='undefined'?globalThis:this);
