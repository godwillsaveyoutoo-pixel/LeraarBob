/* Axioma Vectorentrainer v0.2 — Cartesian model, independent of the DOM. */
(function(root){
'use strict';
const EPS=1e-8,point=(x,y)=>({x,y}),vec=(dx,dy)=>({dx,dy});
const add=(a,b)=>vec(a.dx+b.dx,a.dy+b.dy),scale=(a,k)=>vec(a.dx*k,a.dy*k),subtract=(a,b)=>add(a,scale(b,-1));
const vectorFromPoints=(a,b)=>vec(b.x-a.x,b.y-a.y),endPointFromVector=(a,v)=>point(a.x+v.dx,a.y+v.dy);
const samePoint=(a,b)=>!!a&&!!b&&Math.abs(a.x-b.x)<EPS&&Math.abs(a.y-b.y)<EPS;
const vectorEquals=(a,b)=>!!a&&!!b&&Math.abs(a.dx-b.dx)<EPS&&Math.abs(a.dy-b.dy)<EPS;
const dot=(a,b)=>a.dx*b.dx+a.dy*b.dy,cross=(a,b)=>a.dx*b.dy-a.dy*b.dx,length=a=>Math.hypot(a.dx,a.dy);
const isZero=a=>length(a)<EPS,isParallel=(a,b)=>!isZero(a)&&!isZero(b)&&Math.abs(cross(a,b))<EPS;
const isOpposite=(a,b)=>vectorEquals(a,scale(b,-1));
const scalarFactor=(a,b)=>isZero(b)?(isZero(a)?0:null):Math.abs(cross(a,b))<EPS?dot(a,b)/dot(b,b):null;
const isScalarMultiple=(a,b)=>scalarFactor(a,b)!==null;
const sum=vs=>vs.reduce(add,vec(0,0));
const stroke=(start,end,role='vector')=>({start,end,...vectorFromPoints(start,end),role});
const recognizeAgainstReferences=(v,refs)=>refs.map(r=>({name:r.name,factor:scalarFactor(v,r.v)})).filter(r=>r.factor!==null);
const VectorMath={point,vec,add,subtract,scale,vectorFromPoints,endPointFromVector,samePoint,vectorEquals,isOpposite,isParallel,isScalarMultiple,scalarFactor,dot,cross,length,isZero,sum,stroke,recognizeAgainstReferences};
function parseNumber(value){const s=String(value).trim().replaceAll('−','-').replace(',','.');if(!s)return NaN;const parts=s.split('/');if(parts.length>2||parts.some(p=>!/^[-+]?\d+(?:\.\d+)?$/.test(p)))return NaN;const n=Number(parts[0]),d=parts.length===2?Number(parts[1]):1;return d? n/d:NaN}
function format(n){if(Math.abs(n-Math.round(n))<EPS)return String(Math.round(n)).replace('-','−');for(const d of [2,3,4,5,6,8])if(Math.abs(n*d-Math.round(n*d))<EPS)return `${Math.round(n*d)}/${d}`.replace('-','−');return String(Math.round(n*1000)/1000).replace('.',',').replace('-','−')}
const coord=v=>`(${format(v.dx)}, ${format(v.dy)})`;
function diagnose(v,target,t={}){
 if(vectorEquals(v,vec(target.dy,target.dx))&&!vectorEquals(v,target))return ['xy','Je x- en y-component zijn verwisseld. Eerst horizontaal (x), dan verticaal (y).'];
 if(isOpposite(v,target))return [t.skill==='ab'?'ba':'opposite',t.skill==='ab'?'Je berekende A − B. Voor AB vertrek je in A: neem eindpunt B min beginpunt A.':'De lengte en richting kloppen, maar de zin is omgekeerd.'];
 if(t.factor!==undefined&&t.source&&((Math.abs(v.dx-target.dx)<EPS&&Math.abs(v.dy-t.source.dy)<EPS)||(Math.abs(v.dy-target.dy)<EPS&&Math.abs(v.dx-t.source.dx)<EPS)))return ['one-component','Vermenigvuldig beide componenten met dezelfde factor.'];
 if(isParallel(v,target))return ['scale','De richting klopt. Controleer de lengte en het teken van de factor.'];
 if(Math.abs(v.dx-target.dx)<EPS||Math.abs(v.dy-target.dy)<EPS)return ['sign','Eén component klopt al. Controleer het teken en de verplaatsing van de andere.'];
 return ['direction','Vergelijk de horizontale en verticale verplaatsing, niet de plaats van de pijl.'];
}
const outcome=(RESULT_OK,METHOD_OK,code,message)=>({RESULT_OK,METHOD_OK,ok:RESULT_OK&&METHOD_OK,code,message});
const ok=message=>outcome(true,true,'correct',message||'Goed: jouw constructie klopt.');
const fail=(code,message,result=false)=>outcome(result,false,code,message);
function findChain(lines,start,parts,ordered=false){
 // Graph search: stroke creation order never decides the mathematical method.
 function visit(p,remaining,path,unused){
  if(!remaining.length)return path;
  for(const i of unused){const line=lines[i];if(!samePoint(line.start,p))continue;
   for(let j=0;j<remaining.length;j++){if(ordered&&j>0)break;if(!vectorEquals(line,remaining[j]))continue;
    const rest=remaining.filter((_,k)=>k!==j),answer=visit(line.end,rest,[...path,line],unused.filter(k=>k!==i));if(answer)return answer;
   }
  }return null;
 }
 return visit(start,parts,[],lines.map((_,i)=>i));
}
function validate(t,answer){
 const lines=(answer.strokes||[]).slice(0,24),vectors=lines,results=lines;
 if(t.interaction==='choice'){
  const chosen=t.options?.[answer.choice];if(!chosen)return fail('input','Kies eerst een antwoord.');
  if(vectorEquals(chosen,t.target))return ok(t.choiceFormat==='coordinates'?`Goed: a = ${coord(t.target)}.`:'Goed. Lengte, richting en zin kloppen.');
  const [code,message]=diagnose(chosen,t.target,t);return fail(code,message);
 }
 if(t.interaction==='number'){
  const v=vec(parseNumber(answer.values?.[0]),parseNumber(answer.values?.[1]));
  if(!Number.isFinite(v.dx)||!Number.isFinite(v.dy))return fail('input','Vul beide componenten in. Een breuk zoals −1/2 mag ook.');
  if(vectorEquals(v,t.target))return ok(`${t.answerLabel||'r'} = ${coord(t.target)}. ${t.success||''}`);
  const [code,message]=diagnose(v,t.target,t);return fail(code,message);
 }
 if(t.interaction==='point')return samePoint(answer.point,t.targetPoint)?ok(`Punt ${t.pointName||'P'} staat goed. Een punt geeft een plaats aan.`):fail('point','Controleer het beginpunt en de totale verplaatsing naar je eindpunt.');
 if(!lines.length)return fail('empty','Teken eerst: tik een beginpunt en een eindpunt, of sleep ertussen.');
 if(t.policy==='properties'){
  const l=lines[lines.length-1];if(!samePoint(l.start,t.start))return fail('start','De verplaatsing moet deze keer vanuit P vertrekken.');
  const valid=t.property==='length'?isParallel(l,t.source)&&dot(l,t.source)>0&&length(l)>length(t.source)+EPS:t.property==='direction'?Math.abs(length(l)-length(t.source))<EPS&&!isParallel(l,t.source):vectorEquals(l,scale(t.source,-1));
  return valid?ok('De gevraagde eigenschap veranderde; de andere eigenschappen bleven behouden.'):fail('property',t.property==='length'?'Maak langer; behoud richting en zin.':t.property==='direction'?'Behoud de lengte, maar kies een andere richting.':'Behoud lengte en richting; keer alleen de zin om.');
 }
 if(t.policy==='decompose'){
  if(vectors.length!==2)return fail('components','Teken precies twee componenten, één volgens elke gegeven richting.');
  const [a,b]=vectors,[d,e]=t.dirs,along=(v,dir)=>isZero(v)||isParallel(v,dir);
  const directions=along(a,d)&&along(b,e)||along(a,e)&&along(b,d);
  const result=vectorEquals(add(a,b),t.target);
  if(!directions)return fail('component-direction','Gebruik beide gegeven richtingen. Een component mag ook de tegengestelde zin hebben.',result);
  if(!result)return fail('component-sum','De richtingen kloppen. Hun som moet nog dezelfde verplaatsing als r geven.');
  // Components are free vectors: common origin and either head-to-tail layout are all valid.
  return ok(`De twee componenten geven samen r = ${coord(t.target)}.`);
 }
 if(t.policy==='commute'){
  const left=findChain(vectors,t.start,t.parts,true),right=findChain(vectors,t.secondStart,[...t.parts].reverse(),true);
  if(!left||!right)return fail('routes','Construeer links u gevolgd door v, en rechts v gevolgd door u.');
  return ok('u + v = v + u. De gebroken routes verschillen; hun totale verplaatsing is dezelfde.');
 }
 const targetEnd=endPointFromVector(t.start,t.target);
 const result=(t.policy==='free'?lines:results).find(s=>samePoint(s.start,t.start)&&samePoint(s.end,targetEnd));
 if(t.policy==='free'){
  if(result)return ok(t.success||'Goed. De vector klopt, onafhankelijk van de gekozen tussenstappen.');
  if(t.acceptChain){
   const queue=[t.start],seen=new Set([`${t.start.x},${t.start.y}`]);
   while(queue.length){const p=queue.shift();for(const l of lines){if(!samePoint(l.start,p)||!t.refs.some(r=>isScalarMultiple(l,r.v)))continue;
    if(samePoint(l.end,targetEnd))return ok('Goed. Je opeenvolgende veelvouden geven precies de gevraagde verplaatsing.');
    const key=`${l.end.x},${l.end.y}`;if(!seen.has(key)){seen.add(key);queue.push(l.end)}
   }}
  }
  const l=lines[lines.length-1];if(vectorEquals(l,t.target)&&!samePoint(l.start,t.start))return fail('start','De vector zelf klopt. Teken hem nu vanuit het gevraagde beginpunt.');
  const [code,message]=diagnose(l,t.target,t);return fail(code,message);
 }
 if(t.policy==='parallelogram'){
  const [u,v]=t.parts,a=endPointFromVector(t.start,u),b=endPointFromVector(t.start,v);
  const sides=vectors.some(l=>samePoint(l.start,a)&&vectorEquals(l,v))&&vectors.some(l=>samePoint(l.start,b)&&vectorEquals(l,u));
  if(result&&!sides)return fail('parallelogram','De resultante klopt. Toon ook beide evenwijdige kopieën van de zijden.',true);
  if(sides&&!result)return fail('resultant','De parallellogramconstructie klopt. Teken de resultante vanuit P naar de overstaande hoek.');
  return sides&&result?ok('De diagonaal en beide parallelle kopieën kloppen.'):fail('parallelogram','Kopieer elke vector vanaf de kop van de andere. Voeg daarna de diagonaal vanuit P toe.');
 }
 if(t.policy==='headtail'||t.policy==='ordered'){
  const chain=findChain(vectors,t.start,t.parts,t.policy==='ordered');
  if(chain&&result)return ok(t.policy==='ordered'?'De gevraagde volgorde én de resultante kloppen.':'Goed. Beide volgordes geven dezelfde somvector.');
  if(result&&t.policy==='ordered'&&findChain(vectors,t.start,t.parts))return fail('order','Je somvector klopt. Deze keer wilden we u eerst en daarna v.',true);
  if(chain)return fail('resultant','Je route klopt. Teken de resultante van het begin van de hele ketting naar haar eindpunt.');
  if(t.parts.every(p=>vectors.some(l=>vectorEquals(l,p))))return fail('headtail','De losse vectoren kloppen. Leg de staart van de volgende aan de kop van de vorige.',!!result);
  return fail('route',result?'Je somvector klopt. Toon nu ook de gevraagde kop-staartconstructie.':'Controleer de vectoren in je route: lengte, richting en zin.',!!result);
 }
 return fail('task','Deze oefening kon niet worden beoordeeld. Keer terug naar het startscherm.');
}
const skill=(id,label,deps,intro)=>({id,label,deps,intro});
const skills=[
 skill('props','Lengte, richting en zin',[],'Een vector is een gerichte verplaatsing. De lengte zegt hoe ver, de richting langs welke rechte, de zin naar welke kant.'),
 skill('equal','Dezelfde vector',['props'],'Gelijke vectoren hebben dezelfde lengte, richting en zin. Hun plaats mag verschillen.'),
 skill('opposite','Tegengestelde en nulvector',['equal'],'−a is even lang als a maar wijst andersom. De nulvector begint en eindigt op hetzelfde punt; hij heeft geen bepaalde richting of zin.'),
 skill('free','Vrij namaken vanuit P',['equal'],'Een vector hangt niet vast aan zijn plaats. Kopieer de verplaatsing; het gegeven pijltje blijft staan.'),
 skill('scalar','Vermenigvuldigen met een getal',['opposite','free'],'Bij ka wordt de lengte |k| keer zo groot. Een negatieve factor keert ook de zin om. Een halve vector is half zo lang.'),
 skill('sum','Som als verplaatsing',['free'],'De som is de ene verplaatsing die hetzelfde doet als twee opeenvolgende verplaatsingen.'),
 skill('headtail','Kop-staart construeren',['sum'],'Een tweede verplaatsing begint waar de eerste eindigt. De resultante loopt van het allereerste begin naar het laatste eind.'),
 skill('commute','u + v en v + u',['headtail'],'Vergelijk twee routes met omgekeerde volgorde. Onderzoek of hun totale verplaatsing verandert.'),
 skill('parallelogram','Parallellogram',['headtail'],'Bij hetzelfde beginpunt kopieer je elke vector vanaf de kop van de andere. De diagonaal vanaf het beginpunt is de som.'),
 skill('difference','Vectoren aftrekken',['scalar','sum'],'a − b betekent a + (−b). Je telt de omgekeerde verplaatsing van b op.'),
 skill('combination','Lineaire combinaties',['difference'],'Je mag veelvouden samenstellen en verplaatsingen in een andere volgorde zetten. 2a − b kan als a + a − b of als −b + 2a.'),
 skill('decompose','Ontbinden in richtingen',['sum'],'Zoek twee componenten in de gegeven richtingen. Hun som moet r zijn. Negatieve en nulcomponenten zijn mogelijk.'),
 skill('coords','Van pijl naar (x, y)',['decompose'],'x is de horizontale verplaatsing, y de verticale. Rechts en omhoog zijn positief. De coördinaten beschrijven de verplaatsing, niet het eindpunt.'),
 skill('arrow','Van (x, y) naar pijl',['coords'],'(x, y) beschrijft hoeveel je horizontaal en verticaal verplaatst, vanaf om het even welk beginpunt.'),
 skill('ab','Van A naar B',['coords'],'Voor AB neem je eindpunt min beginpunt: B − A. Trek de x-coördinaten en de y-coördinaten afzonderlijk af.'),
 skill('points','Punt en plaatsvector',['ab','arrow'],'P is een plaats. OP is de verplaatsing vanuit O naar P. Een ander beginpunt verandert de puntcoördinaten van het eindpunt.'),
 skill('coordadd','Rekenen: som en verschil',['coords','difference'],'Werk horizontaal en verticaal apart. Tel x bij x en y bij y. Bij aftrekken verander je beide tekens van de tweede vector.'),
 skill('coordscale','Rekenen: veelvouden',['coords','scalar'],'Vermenigvuldig beide componenten met dezelfde factor. Dit geldt ook bij negatieve factoren en breuken.'),
 skill('coordcombo','Rekenen: combinaties',['coordadd','coordscale'],'Werk elke term uit en combineer daarna de horizontale en verticale componenten. Het antwoord hoeft niet op een rooster te passen.'),
 skill('unknown','Ontbrekende vector',['coordcombo'],'Bij a + b = r vind je b door a terug weg te nemen: b = r − a. Zo kun je ook een ontbrekende component vinden.'),
 skill('basis','Eenheidsvectoren eₓ en eᵧ',['arrow','coordscale'],'eₓ = (1, 0) en eᵧ = (0, 1). Elke vector (x, y) is x eₓ + y eᵧ.'),
 skill('figure','Vectoren in figuren',['headtail','difference'],'Volg de letters: AD + DC gaat van A via D naar C. Het resultaat is AC, onafhankelijk van de omweg.'),
 skill('route','Route en eindpunt',['combination','points','coordcombo'],'Een vectoruitdrukking beschrijft de totale verplaatsing. Tel die bij je beginpunt om te weten waar je aankomt.'),
 skill('fourth','Vierde hoekpunt',['parallelogram','points'],'Bij opeenvolgende hoekpunten A, B, C, D geldt AD = BC. Dan is D = A + C − B. De volgorde van de hoekpunten doet ertoe.')
];
function rng(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
const ref=(start,v,name)=>({start,v,name}),mark=(p,name)=>({p,name});
function generate(id,{seed=1,level=0,variant=0,repair=null}={}){
 const random=rng(seed),pick=a=>a[Math.floor(random()*a.length)],sign=()=>pick([-1,1]);
 const a=vec(variant%4===2?0:pick([1,2,3])*sign(),variant%4===0?0:pick([1,2])*sign()),b=vec(-a.dy,a.dx>=0?1:-1);
 const P=point(pick([-2,-1,0,1]),pick([-2,-1,0,1])),R=point(-4,2),O=point(0,0),v=variant%4;
 const t={skill:id,seed,variant,level,interaction:'sketch',policy:'free',start:P,target:a,refs:[],points:[mark(P,'P')],dirs:[],representation:'grid',answerLabel:'r',bounds:{minX:-6,maxX:6,minY:-5,maxY:5}};
 const draw=(target,prompt,refs=[ref(R,a,'a')])=>Object.assign(t,{target,prompt,refs});
 const numeric=(target,prompt,givens='',visual=false)=>Object.assign(t,{target,prompt,givens,interaction:'number',representation:visual?'grid-number':'symbolic',points:[],refs:visual?[ref(P,a,'a'),ref(point(2,-2),b,'b')]:[]});
 if(id==='props'){
  t.policy='properties';t.source=a;t.property=['length','direction','sense'][variant%3];
  draw(t.property==='length'?scale(a,2):t.property==='direction'?vec(-a.dy,a.dx):scale(a,-1),`Verander alleen de ${t.property==='length'?'lengte: maak a langer':t.property==='direction'?'richting van a':'zin van a'}. Teken vanuit P.`);
 }else if(id==='equal'||id==='free')draw(a,'Teken dezelfde vector als a vanuit P.');
 else if(id==='opposite'){const zero=v===3;draw(zero?vec(0,0):scale(a,-1),zero?'Teken de nulvector in P.':'Teken −a vanuit P.');}
 else if(id==='scalar'){
  t.factor=repair==='opposite'?-.5:pick(level?[.5,-.5,-2,1.5]:[2,3,.5,-1]);t.source=vec(Math.sign(a.dx)*2,Math.sign(a.dy)*(t.factor===3?1:2));
  draw(scale(t.source,t.factor),`Teken ${format(t.factor)} a vanuit P.`,[ref(R,t.source,'a')]);
 }else if(id==='sum')draw(add(a,b),'Teken de totale verplaatsing vanuit P.',[ref(P,a,'u'),ref(endPointFromVector(P,a),b,'v')]);
 else if(id==='headtail'){
  t.parts=[a,b];t.policy=level&&v%2?'ordered':'headtail';
  draw(add(a,b),t.policy==='ordered'?'Leg eerst u en daarna v kop-staart vanuit P. Teken ook de resultante.':'Construeer u + v kop-staart vanuit P en teken de resultante. Beide volgordes mogen.',[ref(R,a,'u'),ref(point(2,-2),b,'v')]);
  if(level===0)t.guidedSteps=true;
 }else if(id==='commute'){
  t.start=point(-4,-2);t.secondStart=point(2,-2);t.parts=[vec(pick([1,2]),0),vec(-1,pick([1,2]))];if(v%2)t.parts=[vec(1,pick([1,2])),vec(pick([1,2]),-2)];t.target=sum(t.parts);t.policy='commute';
  t.points=[mark(t.start,'P'),mark(t.secondStart,'Q')];t.refs=[ref(point(-4,3),t.parts[0],'u'),ref(point(1,3),t.parts[1],'v')];t.prompt='Vanuit P: u dan v. Vanuit Q: v dan u. Verandert de totale verplaatsing?';
 }else if(id==='parallelogram'){
  t.parts=[a,b];t.policy='parallelogram';draw(add(a,b),'Construeer u + v met de parallellogrammethode. Teken beide kopieën en de resultante.',[ref(P,a,'u'),ref(P,b,'v')]);
 }else if(id==='difference')draw(subtract(a,b),'Construeer a − b vanuit P.',[ref(R,a,'a'),ref(point(2,-2),b,'b')]);
 else if(id==='combination'){
  t.acceptChain=true;const factor=v%2?.5:2;t.source=vec(Math.sign(a.dx)*2,Math.sign(a.dy)*2);t.factor=factor;draw(subtract(scale(t.source,factor),b),`Construeer ${format(factor)} a − b vanuit P. Je kiest zelf de tussenstappen.`,[ref(R,t.source,'a'),ref(point(2,-2),b,'b')]);
 }else if(id==='decompose'){
  t.dirs=level&&v%2?[vec(1,1),vec(-1,1)]:[vec(1,0),vec(0,1)];t.target=add(scale(t.dirs[0],a.dx),scale(t.dirs[1],a.dy));t.policy='decompose';t.refs=[ref(P,t.target,'r')];t.prompt='Ontbind r volgens de twee stippelrichtingen. Teken zelf beide componenten.';
 }else if(id==='coords'){
  t.target=a;t.refs=[ref(P,a,'a')];t.points=[];t.prompt='Bepaal de vectorcoördinaten van a.';
  if(level===0){t.policy='decompose';t.dirs=[vec(1,0),vec(0,1)];t.prompt='Teken de horizontale en verticale component van a.';t.representation='components';}
  else {t.interaction='number';t.representation='grid-number';t.axes=true;t.answerLabel='a';}
 }else if(id==='arrow')draw(a,`Teken de vector ${coord(a)} vanuit P.`,[]);
 else if(id==='ab'){
  const A=point(-2,1),B=endPointFromVector(A,a);numeric(a,'Bepaal AB.',`A = (${A.x}, ${A.y})    B = (${B.x}, ${B.y})`,level<2);t.refs=level<2?[ref(A,a,'AB')]:[];t.points=level<2?[mark(A,'A'),mark(B,'B')]:[];t.answerLabel='AB';t.axes=true;
 }else if(id==='points'){
  t.axes=true;
  if(v===0){t.start=O;t.points=[mark(O,'O'),mark(point(a.dx,a.dy),'P')];draw(a,`P = ${coord(a)}. Teken de plaatsvector OP.`,[]);}
  else if(v===3){t.interaction='point';t.targetPoint=P;t.points=[mark(endPointFromVector(P,a),'B')];t.pointName='A';t.refs=[];const B=endPointFromVector(P,a);t.prompt=`B = (${B.x}, ${B.y}) en AB = ${coord(a)}. Plaats beginpunt A.`;}
  else {t.interaction='point';t.start=v===1?O:P;t.targetPoint=endPointFromVector(t.start,a);t.points=[mark(t.start,v===1?'O':'A')];t.refs=[];t.prompt=v===1?`OP = ${coord(a)}. Plaats het punt P.`:`A = (${P.x}, ${P.y}) en AP = ${coord(a)}. Plaats P.`;}
 }else if(id==='coordadd'){
  const u=level>1?scale(a,4):a,w=level>1?scale(b,3):b,minus=level>0&&v%2;
  numeric(minus?subtract(u,w):add(u,w),`Bereken a ${minus?'−':'+'} b.`,`a = ${coord(u)}     b = ${coord(w)}`,level===0);t.operation=minus?'subtract':'add';
  if(level===0)t.scaffold=`x: ${format(u.dx)} + (${format(w.dx)})     y: ${format(u.dy)} + (${format(w.dy)})`;
 }else if(id==='coordscale'){
  t.source=level>1?scale(a,3):a;t.factor=pick(level?[.5,-.5,-2,1.5]:[2,-1]);numeric(scale(t.source,t.factor),`Bereken ${format(t.factor)} a.`,`a = ${coord(t.source)}`,level===0);t.refs=level===0?[ref(P,t.source,'a')]:[];
 }else if(id==='coordcombo'){
  const c=vec(7,-5),u=scale(a,3),w=scale(b,2);numeric(add(subtract(scale(u,2),scale(w,3)),c),'Bereken 2a − 3b + c.',`a = ${coord(u)}    b = ${coord(w)}    c = ${coord(c)}`);
 }else if(id==='unknown'){
  const u=scale(a,2),r=vec(7,-1);numeric(subtract(r,scale(u,2)),'2a + b = r. Bepaal b.',`a = ${coord(u)}    r = ${coord(r)}`);t.answerLabel='b';
 }else if(id==='basis'){
  if(v%2){numeric(a,`Schrijf a = ${coord(a)} als x eₓ + y eᵧ.`);t.slotLabels=['coëfficiënt van eₓ','coëfficiënt van eᵧ'];t.success=`${format(a.dx)}eₓ + (${format(a.dy)})eᵧ`;}
  else {draw(a,`Teken ${format(a.dx)}eₓ + (${format(a.dy)})eᵧ vanuit P.`,level===0?[ref(point(-4,3),vec(1,0),'eₓ'),ref(point(2,2),vec(0,1),'eᵧ')]:[]);t.axes=true;}
 }else if(id==='figure'){
  const x=pick([-3,-2]),y=pick([-2,-1]),w=pick([3,4,5]),h=pick([2,3,4]),A=point(x,y),B=point(x+w,y),C=point(x+w,y+h),D=point(x,y+h),expr=['AD + DC','AB + BC','CA + AB','AB − CB'][v];
  const s=v===2?C:A,e=v===2?B:C;t.start=s;t.target=vectorFromPoints(s,e);t.prompt=`Teken ${expr} vanuit ${v===2?'C':'A'}.`;t.refs=[];t.points=[mark(A,'A'),mark(B,'B'),mark(C,'C'),mark(D,'D')];t.segments=[[A,B],[B,C],[C,D],[D,A]];
 }else if(id==='route'){
  const u=vec(1,1),w=vec(-1,2),c=vec(0,1),r=subtract(add(scale(u,2),scale(w,3)),c);t.start=point(2,-3);t.points=[mark(t.start,'P')];t.target=r;
  if(level===0){draw(r,'Vertrek bij P. Construeer 2a + 3b − c en teken de totale verplaatsing.',[ref(R,u,'a'),ref(point(3,0),w,'b'),ref(point(-4,0),c,'c')]);t.start=point(2,-3);}
  else if(level===1){t.interaction='point';t.targetPoint=endPointFromVector(t.start,r);t.axes=true;t.prompt='Voorspel het eindpunt van 2a + 3b − c vanaf P(2, −3).';t.givens=`a = ${coord(u)}    b = ${coord(w)}    c = ${coord(c)}`;}
  else {const r2=add(scale(a,2),scale(b,3)),start=point(12,-9),e=endPointFromVector(start,r2);numeric(vec(e.x,e.y),'Waar eindigt 2a + 3b vanaf P?',`P = (12, −9)    a = ${coord(a)}    b = ${coord(b)}`);t.answerLabel='E';}
 }else if(id==='fourth'){
  const A=point(-2,pick([0,1,2])),B=point(pick([1,2,3]),0),C=point(pick([2,3,4]),pick([2,3,4])),D=point(A.x+C.x-B.x,A.y+C.y-B.y);t.prompt='A, B, C, D zijn opeenvolgende hoekpunten van een parallellogram. Plaats D.';
  if(level<2){t.interaction='point';t.axes=true;t.points=[mark(A,'A'),mark(B,'B'),mark(C,'C')];t.segments=[[A,B],[B,C]];t.targetPoint=D;t.pointName='D';}
  else {numeric(vec(D.x,D.y),'A, B, C, D liggen in die volgorde op een parallellogram. Bereken D.',`A = (${A.x}, ${A.y})    B = (${B.x}, ${B.y})    C = (${C.x}, ${C.y})`);t.answerLabel='D';}
 }else throw Error('Unknown skill: '+id);
 // Recognition complements construction; arrow choices precede coordinate notation.
 if(variant%4===1&&(['equal','opposite'].includes(id)||id==='coords'&&level>0)){
  if(id!=='coords'){const reference=vec(2*Math.sign(a.dx||1),Math.sign(a.dy||1));t.target=id==='opposite'?scale(reference,-1):reference;t.refs=[ref(point(-6,0),reference,'a')];}
  const target=t.target,candidates=[target,scale(target,-1),scale(target,2),vec(target.dy,target.dx),vec(-target.dy,target.dx),add(target,vec(1,0))],options=[];
  for(const candidate of candidates)if(!options.some(x=>vectorEquals(x,candidate))&&options.length<4)options.push(candidate);
  for(let i=options.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
  t.options=options;t.interaction='choice';t.representation='choice-grid';t.choiceFormat=id==='coords'?'coordinates':'arrows';t.points=[];if(t.choiceFormat==='arrows')t.choicePositions=[point(0,2),point(6,2),point(0,-2),point(6,-2)];
  t.prompt=id==='coords'?'Welke coördinaten horen bij a?':id==='opposite'?'Welke pijl is tegengesteld aan a?':'Welke pijl stelt dezelfde vector als a voor?';
 }
 t.success=t.success||'';t.repair=repair;
 // Fit geometric givens AND every potential construction, never mark hidden target points.
 if(t.representation!=='symbolic'){
  const pts=[t.start,...t.points.map(p=>p.p),...t.refs.flatMap(r=>[r.start,endPointFromVector(r.start,r.v)]),...(t.segments||[]).flat()];
  if(t.target)pts.push(endPointFromVector(t.start,t.target));if(t.targetPoint)pts.push(t.targetPoint);
  if(t.choicePositions)for(let i=0;i<t.options.length;i++)pts.push(t.choicePositions[i],endPointFromVector(t.choicePositions[i],t.options[i]));
  if(t.parts)for(const start of [t.start,t.secondStart].filter(Boolean))for(const p of t.parts)pts.push(endPointFromVector(start,p),endPointFromVector(start,sum(t.parts)));
  if(id==='combination')pts.push(endPointFromVector(t.start,scale(t.source,t.factor)),endPointFromVector(t.start,scale(b,-1)));
  if(t.dirs){const [d,e]=t.dirs;if(d&&e&&Math.abs(cross(d,e))>EPS){const k=cross(t.target,e)/cross(d,e),l=cross(d,t.target)/cross(d,e);pts.push(endPointFromVector(t.start,scale(d,k)),endPointFromVector(t.start,scale(e,l)));}}
  t.bounds={minX:Math.min(-5,...pts.map(p=>p.x))-1,maxX:Math.max(5,...pts.map(p=>p.x))+1,minY:Math.min(-3,...pts.map(p=>p.y))-1,maxY:Math.max(3,...pts.map(p=>p.y))+1};
 }
 t.signature=JSON.stringify([id,t.representation,t.interaction,t.prompt,t.targetPoint||t.target,t.refs,t.points,t.source,t.factor,t.property,t.policy]);return t;
}
const freshSkill=()=>({intro:false,seen:0,clean:0,strength:0,lastAt:0,lastIndex:-10,representations:[],signatures:[],recent:[],variants:[],due:0});
function freshState(){return {version:2,total:0,sessions:0,skills:Object.fromEntries(skills.map(s=>[s.id,freshSkill()])),repairs:[],lastSkill:null,lastSignatures:[]}}
function sanitize(raw){const p=freshState();if(!raw||raw.version!==2)return p;
 const number=(n,max=1e7)=>Number.isFinite(n)?Math.min(max,Math.max(0,n)):0;
 p.total=number(raw.total);p.sessions=number(raw.sessions);p.lastSkill=skills.some(s=>s.id===raw.lastSkill)?raw.lastSkill:null;
 for(const s of skills){const v=raw.skills?.[s.id]||{},out=p.skills[s.id];out.intro=v.intro===true;for(const k of ['seen','clean','lastAt','lastIndex','due'])out[k]=number(v[k],1e14);out.strength=number(v.strength,1);for(const k of ['representations','signatures','variants'])out[k]=Array.isArray(v[k])?v[k].filter(x=>typeof x==='string').slice(-30):[];out.recent=Array.isArray(v.recent)?v.recent.filter(x=>typeof x==='boolean').slice(-6):[];}
 p.repairs=Array.isArray(raw.repairs)?raw.repairs.filter(r=>p.skills[r.skill]&&typeof r.code==='string').slice(-30).map(r=>({skill:r.skill,code:r.code,due:number(r.due),stage:number(r.stage,1)})):[];
 p.lastSignatures=Array.isArray(raw.lastSignatures)?raw.lastSignatures.filter(x=>typeof x==='string').slice(-20):[];return p;
}
function unlocked(p){return skills.filter(s=>s.deps.every(id=>p.skills[id].clean>=2&&p.skills[id].strength>=.3)).map(s=>s.id)}
function phase(p,id){const s=p.skills[id];if(!unlocked(p).includes(id))return 'locked';if(!s.intro)return 'new';if(s.seen<2)return 'guided';if(s.clean>=5&&s.strength>=.78&&s.signatures.length>=4&&s.variants.length>=3&&(!['coords','coordadd','coordscale','ab','route'].includes(id)||s.representations.length>=2)&&s.recent.slice(-4).length===4&&s.recent.slice(-4).every(Boolean)&&!p.repairs.some(r=>r.skill===id))return 'solid';return 'learning'}
function choose(p,{now=Date.now(),round=0}={}){
 const ids=unlocked(p),due=p.repairs.filter(r=>r.due<=p.total&&ids.includes(r.skill)).sort((a,b)=>a.due-b.due);
 if(due.length)return {id:due[0].skill,mode:'repair',repair:due[0].code};
 const newId=ids.find(id=>!p.skills[id].intro);
 if(newId&&(round>0||p.total===0))return {id:newId,mode:'intro'};
 const scored=ids.map(id=>{const s=p.skills[id],age=p.total-s.lastIndex,days=(now-s.lastAt)/86400000;return {id,score:(1-s.strength)*4+Math.min(10,age)*.45+(s.lastAt?Math.min(4,days):0)+(s.due<=p.total&&s.clean>=3?2:0)-(id===p.lastSkill?2:0)};}).sort((a,b)=>b.score-a.score);
 const id=scored[0].id;return {id,mode:!p.skills[id].intro?'intro':p.skills[id].seen<2?'guided':round===0?'recall':'practice'};
}
function record(p,t,{clean,code='practice',now=Date.now()}={}){
 const s=p.skills[t.skill];s.intro=true;s.seen++;s.lastAt=now;s.lastIndex=p.total;p.total++;p.lastSkill=t.skill;s.recent=[...s.recent,!!clean].slice(-6);
 if(clean){s.clean++;s.strength=Math.min(1,s.strength+(t.level===0?.13:.19));s.signatures=[...new Set([...s.signatures,t.signature])].slice(-30);s.representations=[...new Set([...s.representations,t.representation])];s.variants=[...new Set([...s.variants,`${t.level}:${t.variant%4}`])];s.due=p.total+Math.min(30,3+s.clean*3);
  const r=p.repairs.find(r=>r.skill===t.skill);if(r&&t.repair){if(r.stage===0){r.stage=1;r.due=p.total+6}else p.repairs=p.repairs.filter(x=>x!==r)}
 }else {s.strength=Math.max(0,s.strength-.14);let r=p.repairs.find(r=>r.skill===t.skill);if(!r){r={skill:t.skill};p.repairs.push(r)}Object.assign(r,{code,due:p.total+2,stage:0});}
 p.lastSignatures=[...p.lastSignatures,t.signature].slice(-20);
}
const api={VectorMath,TaskValidator:{validate,findChain},MisconceptionModel:{diagnose},TaskGenerator:{generate,skills,rng},TrainerScheduler:{freshState,sanitize,unlocked,phase,choose,record},parseNumber,format,coord};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.VectorTrainerCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
