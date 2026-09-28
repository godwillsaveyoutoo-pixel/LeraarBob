/* Worked examples share the generator, geometry and notation of the exercises. */
(function(root){
'use strict';
const C=typeof module!=='undefined'&&module.exports?require('./vector-core.js'):root.VectorTrainerCore;
const {VectorMath:M,format:f,coord}=C,pointText=p=>`(${f(p.x)}, ${f(p.y)})`;
// Native option menus cannot reliably lay out combining vector accents or subscripts.
function topicLabel(skill){return ({commute:'Volgorde bij vectoren optellen',basis:'Eenheidsvectoren langs de assen'})[skill.id]||skill.label;}
function build(t){
 const steps=[],target=t.target,start=t.start,refs=t.refs,strokes=[];
 const add=(title,text,calculation='')=>steps.push({title,text,calculation,strokes:strokes.map(s=>({...s})),point:null,measurements:[]});
 const measurement=(p,v,label,vertical=false)=>steps.at(-1).measurements.push({start:p,v,label,vertical});
 const arrow=(p,v,name='r',role='vector')=>strokes.push({...M.stroke(p,M.endPointFromVector(p,v),role),name});
 const result=(label)=>{
  const single=['props','equal','free','opposite','scalar','points'].includes(t.skill);
  const name=['equal','free'].includes(t.skill)?'a':t.skill==='opposite'&&!M.isZero(target)?'−a':t.skill==='scalar'?`${f(t.factor)} a`:t.skill==='points'?'OP':t.answerLabel||'r';
  const position=t.choicePositions?t.choicePositions[t.options.findIndex(v=>M.vectorEquals(v,target))]:start;
  arrow(position,target,label||name,single?'vector':'result');
 };
 const units=n=>`${f(Math.abs(n))} ${Math.abs(n)===1?'eenheid':'eenheden'}`;
 const directions=v=>`${v.dx===0?'geen horizontale verplaatsing':units(v.dx)+(v.dx<0?' naar links':' naar rechts')} en ${v.dy===0?'geen verticale verplaatsing':units(v.dy)+(v.dy<0?' omlaag':' omhoog')}`;
 const arithmetic=(title,text,formula)=>add(title,text,formula);
 const finishPoint=p=>{steps.at(-1).point=p;};
 switch(t.skill){
 case 'props':
  add('Wat moet gelijk blijven?',({length:'Maak a langer. Behoud de richting en de zin: teken een evenwijdige pijl die dezelfde kant op wijst.',direction:'Draai de pijl naar een andere richting. Behoud zijn lengte. Bij niet-evenwijdige pijlen vergelijken we de zin niet.',sense:'Keer de zin van a om. De nieuwe pijl blijft evenwijdig en even lang.'})[t.property]);result();
  add('Verander alleen het gevraagde kenmerk',({length:'De nieuwe pijl is hier twee keer zo lang als a. Hij heeft dezelfde richting en zin.',direction:'De nieuwe pijl is niet evenwijdig aan a, maar is wel even lang. De zin vergelijken we alleen bij evenwijdige pijlen.',sense:'De nieuwe pijl heeft dezelfde lengte en richting als a, maar de tegengestelde zin.'})[t.property]);break;
 case 'equal':case 'free':
  add('Een vector stelt een verplaatsing voor','Volg a van staart naar pijlpunt. Een gelijke vector brengt je even ver in dezelfde richting en zin, ook vanaf een ander beginpunt.');result();
  add('Schuif zonder te draaien',t.interaction==='choice'?`Keuze ${t.options.findIndex(v=>M.vectorEquals(v,target))+1} heeft dezelfde richting, zin en lengte als a.`:'Vergelijk a met de kopie vanuit P. Beide hebben dezelfde richting, zin en lengte. Alleen het beginpunt is veranderd.');break;
 case 'opposite':
  add('De zin omkeren',M.isZero(target)?'Een nulvector verplaatst je helemaal niet. Begin en einde vallen samen.':'−a is even lang en evenwijdig aan a, maar wijst de andere kant op.');result();
  add('Vergelijk het resultaat',M.isZero(target)?'Het cirkeltje markeert nul verplaatsing. Een nulvector heeft geen bepaalde richting of zin.':t.interaction==='choice'?`Keuze ${t.options.findIndex(v=>M.vectorEquals(v,target))+1} is tegengesteld aan a.`:'De nieuwe pijl stelt −a voor. Volg je eerst a en daarna −a, dan kom je terug bij je beginpunt.');break;
 case 'scalar':case 'coordscale':
  add('Wat doet de factor?',`${f(t.factor)} a: de lengte wordt ${f(Math.abs(t.factor))} keer die van a. ${t.factor<0?'Het minteken keert de zin om.':t.factor===0?'De uitkomst is de nulvector.':'De zin blijft gelijk.'}`);
  if(t.skill==='coordscale')arithmetic('Vermenigvuldig beide componenten','Vermenigvuldig de horizontale én de verticale component met dezelfde factor.',`x: ${f(t.factor)} × (${f(t.source.dx)}) = ${f(target.dx)}\ny: ${f(t.factor)} × (${f(t.source.dy)}) = ${f(target.dy)}`);
  if(t.skill==='scalar')result();
  arithmetic('Pas de factor overal toe',t.skill==='scalar'?'Vergelijk de nieuwe pijl met a: controleer de lengte, de richting en de zin.':'Vermenigvuldig zowel de horizontale als de verticale verplaatsing.',t.skill==='scalar'?'':`${f(t.factor)} a = ${coord(target)}`);break;
 case 'sum':case 'headtail':case 'commute':case 'parallelogram':{
  const parts=t.parts||refs.map(r=>r.v),[u,v]=parts,mid=M.endPointFromVector(start,u);
  add('Twee vectoren optellen',t.skill==='sum'?'De gegeven route begint in P: eerst u, daarna v. De som beschrijft de totale verplaatsing.':'We zoeken u + v. Je mag een vector verschuiven, zolang zijn richting, zin en lengte gelijk blijven.');
  if(t.skill==='parallelogram'){
   arrow(mid,v,'v');add('Kopieer v vanaf de kop van u','Teken een vector met dezelfde richting, zin en lengte als v. Zijn staart komt aan de kop van u.');
   arrow(M.endPointFromVector(start,v),u,'u');add('Maak het parallellogram af','Kopieer u vanaf de kop van v. De koppen van beide kopieën vallen samen in het overstaande hoekpunt.');
  }else if(t.skill!=='sum'){
   arrow(start,u,'u');add('Vanuit P: eerst u','Teken u vanuit P. Behoud de richting, zin en lengte van de gegeven vector.');
   arrow(mid,v,'v');add('Daarna v: kop-staart','Teken v vanaf de kop van u. Zijn staart sluit dus aan op de kop van de eerste vector.');
  }
  result('u+v');
  add(t.skill==='parallelogram'?'Teken de juiste diagonaal':'Teken de resultante vanuit P',t.skill==='parallelogram'?'De somvector loopt van P naar het overstaande hoekpunt. Kies de diagonaal die in het gemeenschappelijke beginpunt vertrekt.':'Teken één pijl van P naar de kop van de laatste vector. Deze resultante stelt u + v voor.');
  if(t.skill==='commute'){
   const q=t.secondStart;
   arrow(q,v,'v');add('Vanuit Q: eerst v','Keer nu de volgorde om. Begin bij Q en teken eerst v.');
   arrow(M.endPointFromVector(q,v),u,'u');add('Daarna u: kop-staart','Teken u vanaf de kop van v. Behoud opnieuw de richting, zin en lengte.');
   arrow(q,target,'v+u','result');
   add('De volgorde verandert de som niet','Teken de tweede resultante vanuit Q. Beide resultanten hebben dezelfde richting, zin en lengte. De eindpunten verschillen omdat de beginpunten verschillen.','u + v = v + u');
  }break;
 }
 case 'difference':case 'combination':{
  const a=refs[0].v,b=refs[1].v,k=t.skill==='combination'?t.factor:1,first=M.scale(a,k),minus=M.scale(b,-1);
  add('Maak van aftrekken optellen',`${t.skill==='combination'?f(k)+' a':'a'} − b betekent: eerst ${t.skill==='combination'?f(k)+' a':'a'}, daarna −b.`);
  arrow(start,first,t.skill==='combination'?`${f(k)} a`:'a');
  add('Teken de eerste vector',t.skill==='combination'?`Teken ${f(k)} a vanuit P. Vermenigvuldig de lengte van a met ${f(Math.abs(k))} en behoud de richting en zin.`:'Teken een kopie van a vanuit P. Behoud de richting, zin en lengte.');
  arrow(M.endPointFromVector(start,first),minus,'−b');
  add('Leg de verplaatsingen kop-staart','Neem de tegengestelde vector −b. Teken die vanaf de kop van de eerste vector.');result();
  add('Lees de totale verplaatsing','De resultante loopt van het beginpunt van de eerste vector naar het eindpunt van de laatste vector.','');break;
 }
 case 'decompose':case 'coords':{
  const dirs=t.dirs?.length?t.dirs:[M.vec(1,0),M.vec(0,1)],det=M.cross(...dirs),u=M.scale(dirs[0],M.cross(target,dirs[1])/det),v=M.subtract(target,u);
  if(t.skill==='coords'){
   add('Begin aan de staart','Bepaal de verplaatsing vanaf de staart naar de kop. Lees eerst de horizontale component af, daarna de verticale.');
   arrow(start,u,'u');add('Horizontaal: links of rechts?',target.dx===0?'Er is geen horizontale verplaatsing. De eerste component is 0.':`Vanaf de staart: ${units(target.dx)} naar ${target.dx<0?'links. Links geeft een negatieve':'rechts. Rechts geeft een positieve'} component.`,`x = ${f(target.dx)}`);measurement(start,u,`x = ${f(target.dx)}`);
   arrow(M.endPointFromVector(start,u),v,'v');add('Verticaal: omhoog of omlaag?',target.dy===0?'Er is geen verticale verplaatsing. De tweede component is 0.':`Vanaf het einde van je horizontale stap: ${units(target.dy)} ${target.dy<0?'omlaag. Omlaag is negatief.':'omhoog. Omhoog is positief.'}`,`y = ${f(target.dy)}`);measurement(M.endPointFromVector(start,u),v,`y = ${f(target.dy)}`,true);
   add('Samen beschrijven ze dezelfde pijl','De horizontale en de verticale componentvector geven samen a. Noteer eerst de horizontale, daarna de verticale component.',`a = ${coord(target)}`);
  }else{
   add('Twee richtingen, één resultante','Ontbind r in twee componentvectoren, één evenwijdig aan elke stippellijn. Hun som moet r zijn.');
   arrow(start,u,'u');add('Kies de eerste component','Teken vanuit P langs één stippellijn. Stop waar je de kop van r kunt bereiken langs een lijn evenwijdig aan de andere stippellijn.');
   arrow(start,v,'v');arrow(M.endPointFromVector(start,u),v,'v');add('Controleer met kop-staart','De kopie van v begint aan de kop van u en eindigt aan de kop van r. De componentvectoren u en v hebben dus samen r als resultante.','u + v = r');
  }break;
 }
 case 'arrow':case 'basis':
  add('Lees horizontaal en verticaal',t.skill==='basis'?'eₓ = (1, 0) en eᵧ = (0, 1). De coëfficiënten geven aan met welk getal je elke eenheidsvector vermenigvuldigt.':`De vector ${coord(target)} geeft een verplaatsing, geen vast eindpunt.`);
  arrow(start,M.vec(target.dx,0),`${f(target.dx)} eₓ`);arrow(M.endPointFromVector(start,M.vec(target.dx,0)),M.vec(0,target.dy),`${f(target.dy)} eᵧ`);
  add(t.interaction==='number'?'Lees de verplaatsing van a':'Vertrek bij P',`Lees de verplaatsing: ${directions(target)}. Een component 0 betekent dat er in die richting geen verplaatsing is.`);
  if(t.skill==='basis'&&t.interaction==='number'){
   add('Lees de coëfficiënten af',`De coëfficiënt van eₓ is ${f(target.dx)}; die van eᵧ is ${f(target.dy)}. Samen geven de twee componentvectoren de gegeven vector a.`,`a = ${f(target.dx)} eₓ + (${f(target.dy)}) eᵧ = ${coord(target)}`);
  }else{
   result();add('Verbind beginpunt en eindpunt','De resultante verbindt begin en einde.',`${f(target.dx)} eₓ + (${f(target.dy)}) eᵧ = ${coord(target)}`);
  }break;
 case 'ab':{
  const {A,B}=t.inputPoints;
  add('Van beginpunt A naar eindpunt B',`A = ${pointText(A)} en B = ${pointText(B)}. Voor de coördinaten van AB trek je de coördinaten van A af van die van B.`);
  arithmetic('Eind min begin, voor beide componenten','Trek telkens de begincoördinaat af van de eindcoördinaat. Een negatief getal aftrekken is hetzelfde als zijn tegengestelde optellen.',`x: ${f(B.x)} − (${f(A.x)}) = ${f(target.dx)}\ny: ${f(B.y)} − (${f(A.y)}) = ${f(target.dy)}`);
  arithmetic('Controleer de verplaatsing','Vertrek bij A met deze verplaatsing. Je komt bij B. Voor BA neem je het tegengestelde van beide componenten; een component die 0 is, blijft 0.',`AB = (${f(B.x)} − (${f(A.x)}), ${f(B.y)} − (${f(A.y)})) = ${coord(target)}`);break;
 }
 case 'points':{
  add('Maak onderscheid tussen punt en vector',t.prompt);
  if(t.interaction==='point'){
   const backwards=t.variant%4===3,p=t.targetPoint;
   arrow(backwards?p:start,target,backwards?'AB':t.variant%4===2?'AP':'OP');
   add(backwards?'Reken terug vanaf B':'Tel de verplaatsing bij het beginpunt',backwards?`Trek de componenten van AB af van de coördinaten van B. Zo vind je beginpunt A.`:`Tel de horizontale component bij de x-coördinaat van het beginpunt en de verticale component bij de y-coördinaat.`,`${t.pointName||'P'} = ${backwards?`(${f(p.x+target.dx)} − (${f(target.dx)}), ${f(p.y+target.dy)} − (${f(target.dy)}))`:`(${f(start.x)} + (${f(target.dx)}), ${f(start.y)} + (${f(target.dy)}))`} = ${pointText(p)}`);finishPoint(p);
  }else{result();add('Van O naar P','De plaatsvector OP begint in de oorsprong O. De coördinaten van OP zijn daarom gelijk aan de coördinaten van P.',`OP = ${coord(target)}`);}break;
 }
 case 'coordadd':{
  const [a,b]=t.operands,op=t.operation==='subtract'?'−':'+';
  add('Werk met overeenkomstige componenten',`Bereken a ${op} b. ${op==='−'?'Trek beide componenten van b af.':'Tel x bij x en y bij y.'}`,t.givens);
  arithmetic('Reken per component',op==='−'?'Trek een negatief getal af door het tegengestelde erbij op te tellen.':'Tel horizontaal bij horizontaal en verticaal bij verticaal. Let bij elke optelling op de tekens.',`x: ${f(a.dx)} ${op} (${f(b.dx)}) = ${f(target.dx)}\ny: ${f(a.dy)} ${op} (${f(b.dy)}) = ${f(target.dy)}`);
  arithmetic('Schrijf de uitkomst als vector','De eerste component is horizontaal, de tweede verticaal.',`a ${op} b = ${coord(target)}`);break;
 }
 case 'coordcombo':{
  const [a,b,c]=t.operands,u=M.scale(a,2),v=M.scale(b,-3);
  add('Werk eerst de veelvouden uit',t.givens,`2a = ${coord(u)}\n−3b = ${coord(v)}`);
  arithmetic('Combineer de horizontale en verticale verplaatsingen','Let op: −3 vermenigvuldigt beide componenten van b.',`x: ${f(u.dx)} + (${f(v.dx)}) + (${f(c.dx)}) = ${f(target.dx)}\ny: ${f(u.dy)} + (${f(v.dy)}) + (${f(c.dy)}) = ${f(target.dy)}`);
  arithmetic('De totale vector','Het minteken in −3b geldt voor beide componenten.',`${coord(u)} + ${coord(v)} + ${coord(c)} = ${coord(target)}`);break;
 }
 case 'unknown':{
  const [a,r]=t.operands;
  add('Isoleer de onbekende vector','Uit 2a + b = r volgt b = r − 2a. Trek aan beide kanten van de gelijkheid 2a af.',t.givens);
  arithmetic('Vul de bekende vectoren in','Controleer door je gevonden vector weer bij 2a op te tellen.',`b = ${coord(r)} − ${coord(M.scale(a,2))} = ${coord(target)}`);break;
 }
 case 'figure':{
  const pts=Object.fromEntries(t.points.map(p=>[p.name,p.p])),v=t.variant%4,names=[['A','D','C'],['A','B','C'],['C','A','B'],['A','B','C']][v];
  add('Let op beginpunt en eindpunt',v===3?'−CB is BC. Daarom is AB − CB gelijk aan AB + BC.':`${names[0]}${names[1]} eindigt waar ${names[1]}${names[2]} begint.`);
  for(let i=0;i<2;i++)arrow(pts[names[i]],M.vectorFromPoints(pts[names[i]],pts[names[i+1]]),names[i]+names[i+1]);
  add('Volg de route door de figuur',`Van ${names[0]} via ${names[1]} naar ${names[2]}. De som beschrijft de verplaatsing van het eerste naar het laatste punt.`);result(names[0]+names[2]);
  add('Verbind het eerste en laatste punt',`De som is ${names[0]}${names[2]}.`);break;
 }
 case 'route':{
  const [a,b,c]=t.operands,parts=[M.scale(a,2),M.scale(b,3),...(c?[M.scale(c,-1)]:[])],names=['2a','3b','−c'],displacement=M.sum(parts),p=t.routeStart||start,end=M.endPointFromVector(p,displacement);
  add('Lees de route',`Begin bij P. Volg eerst 2a, dan 3b${c?' en ten slotte −c':''}. Behandel het beginpunt en de verplaatsing afzonderlijk.`,t.givens||'');
  let cursor=p;
  parts.forEach((part,i)=>{
   arrow(cursor,part,names[i]);cursor=M.endPointFromVector(cursor,part);
   add(`Teken ${names[i]}`,i===0?'Teken vanuit P een vector met dezelfde richting en zin als a, maar met tweemaal de lengte.':i===1?'Teken vanaf de vorige kop een vector met dezelfde richting en zin als b, maar met driemaal de lengte.':'Teken vanaf de vorige kop de tegengestelde vector van c: even lang en evenwijdig, met de omgekeerde zin.');
  });
  arrow(p,displacement,'r','result');
  add('Bepaal de totale verplaatsing','De resultante loopt van P naar het eindpunt van de route.',`${parts.map(coord).join(' + ')} = ${coord(displacement)}`);
  add('Bereken het eindpunt',`Tel de componenten van de totale verplaatsing bij de coördinaten van P = ${pointText(p)}. De uitkomst geeft de plaats van het eindpunt aan.`,`Eindpunt = (${f(p.x)} + (${f(displacement.dx)}), ${f(p.y)} + (${f(displacement.dy)})) = ${pointText(end)}`);
  if(t.interaction==='point')finishPoint(end);break;
 }
 case 'fourth':{
  const {A,B,C,D}=t.inputPoints,v=M.vectorFromPoints(B,C);
  add('Gebruik de volgorde A, B, C, D','Bij deze volgorde van de hoekpunten hebben AD en BC dezelfde richting, zin en lengte. Dus AD = BC.',`BC = (${f(C.x)} − (${f(B.x)}), ${f(C.y)} − (${f(B.y)})) = ${coord(v)}`);
  arrow(A,v,'AD');add('Neem BC over vanaf A','Het einde van die kopie is D. Controleer dat beide paren overstaande zijden evenwijdig zijn.',`D = (${f(A.x)} + (${f(v.dx)}), ${f(A.y)} + (${f(v.dy)})) = ${pointText(D)}`);finishPoint(D);break;
 }
 default:throw Error('Missing lesson: '+t.skill);
 }
 return {steps,takeaway:steps.at(-1).text,conclusion:steps.at(-1).calculation};
}
const api={build,topicLabel};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.VectorTrainerLessons=api;
})(typeof globalThis!=='undefined'?globalThis:this);
