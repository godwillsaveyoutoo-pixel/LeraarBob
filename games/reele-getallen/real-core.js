/* Exact values and learning state. No DOM, pixels, network or learner identity. */
(function(root){
'use strict';
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
function rational(n,d=1){if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||!d)throw Error('Ongeldige breuk');if(d<0){n=-n;d=-d}const g=gcd(n,d);return {n:n/g,d:d/g}}
const integer=n=>({kind:'integer',n}),fraction=(n,d)=>({kind:'fraction',n,d}),decimal=text=>({kind:'decimal',text:String(text).replace('.',',')}),percent=n=>({kind:'percent',n}),sqrt=(n,sign=1)=>({kind:'root',n,sign});
function parse(text){
 const s=String(text??'').trim().replace('−','-');if(!/^-?\d{1,6}(?:[.,]\d{1,4})?$/.test(s))return null;
 const negative=s[0]==='-',[a,b='']=s.replace('-','').replace(',','.').split('.');return rational((negative?-1:1)*Number(a+b),10**b.length);
}
function value(e){
 switch(e.kind){case 'integer':return rational(e.n);case 'fraction':return rational(e.n,e.d);case 'decimal':return parse(e.text);case 'percent':return rational(e.n,100);case 'root':{const k=Math.sqrt(e.n);if(Number.isInteger(k))return rational(e.sign*k);return {root:e.n,sign:e.sign}}case 'period':{const lead=e.lead||'',repeat=e.repeat,den=10**lead.length*(10**repeat.length-1);return rational(Number(e.whole||0)*den+Number(lead||0)*(10**repeat.length-1)+Number(repeat),den)}default:throw Error('Onbekende voorstelling')}
}
function compare(a,b){
 if(a.root!==undefined&&b.root!==undefined)return a.sign!==b.sign?Math.sign(a.sign-b.sign):a.sign*Math.sign(a.root-b.root);
 if(a.root!==undefined){if(a.sign>0&&b.n<0)return 1;if(a.sign<0&&b.n>=0)return -1;return a.sign*Math.sign(a.root*b.d*b.d-b.n*b.n)}
 if(b.root!==undefined)return -compare(b,a);
 return Math.sign(a.n*b.d-b.n*a.d);
}
const equal=(a,b)=>compare(a,b)===0,number=v=>v.root!==undefined?v.sign*Math.sqrt(v.root):v.n/v.d;
function format(n){return String(n).replace('-', '−').replace('.',',')}
function decimalOf(v){return format(Number((v.n/v.d).toFixed(4)))}
function label(e){switch(e.kind){case 'fraction':return `${format(e.n)}/${e.d}`;case 'integer':return format(e.n);case 'decimal':return e.text.replace('-','−');case 'percent':return `${format(e.n)}%`;case 'root':return `${e.sign<0?'−':''}√${e.n}`;case 'period':return `${e.whole||0},${e.lead||''}(${e.repeat}) periodiek`;default:return ''}}
const skills=[
 {id:'fraction',title:'Een waarde, meerdere vormen',short:'Breuken bouwen',deps:[],concept:'Een breuk, decimaal en procent kunnen precies hetzelfde getal voorstellen.'},
 {id:'line',title:'Getallen krijgen een plaats',short:'De getallijn',deps:['fraction'],concept:'De schaal bepaalt de plaats. Gelijke afstanden betekenen gelijke verschillen.'},
 {id:'compare',title:'Groter, kleiner of gelijk',short:'Vergelijken',deps:['line'],concept:'Vergelijk de waarden, ook als de schrijfwijzen verschillen. Links op de lijn ligt het kleinere getal.'},
 {id:'group',title:'Andere vorm, dezelfde waarde',short:'Equivalenten groeperen',deps:['compare'],concept:'Voorstellingen horen samen als ze exact dezelfde waarde hebben.'},
 {id:'root',title:'Tussen twee bekende getallen',short:'Wortels begrenzen',deps:['group'],concept:'Vergelijk eerst met kwadraten. Zet daarna de grenzen om naar de wortel.'},
 {id:'interval',title:'Een heel gebied op de lijn',short:'Intervallen bouwen',deps:['root'],concept:'Een interval heeft grenzen. Open betekent dat de grens niet meetelt, gesloten dat ze wel meetelt.'},
 {id:'classify',title:'Tot welke verzamelingen?',short:'Getalsoorten',deps:['root'],concept:'Kijk naar de waarde. Een geheel getal is ook rationaal en reëel; een wortelteken maakt een getal niet automatisch irrationaal.'},
 {id:'period',title:'Een blok dat blijft terugkomen',short:'Periodieke decimalen',deps:['classify'],concept:'Een overbar betekent dat een blok onbeperkt wordt herhaald. Een vaste aanloop hoort niet bij dat blok.'}
];
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296}}
function generate(skill,{seed=1,variant=0,level=0}={}){
 if(!skills.some(s=>s.id===skill))throw Error('Onbekende vaardigheid');
 const random=rng(seed),pick=a=>a[Math.floor(random()*a.length)],v=variant%5;
 const t={skill,seed,variant,level,representation:'symbols'};
 if(skill==='fraction'){
  const values=level?[rational(3,4),rational(7,20),rational(-3,5),rational(5,4),rational(9,8),rational(7,8)]:[rational(3,4),rational(1,2),rational(1,4),rational(2,5),rational(3,5)];
  t.target=pick(values);t.source=v%2?percent(t.target.n*100/t.target.d):decimal(decimalOf(t.target));if(t.source.kind==='percent'&&!Number.isInteger(t.source.n))t.source=decimal(decimalOf(t.target));
  t.prompt='Bouw een vereenvoudigde breuk met dezelfde waarde.';t.representation=t.source.kind;
 }else if(skill==='line'){
  t.step=level&&v%2?rational(1,4):rational(1,2);t.min=level?-2:0;t.max=level?2:2;
  const ticks=Math.round((t.max-t.min)/number(t.step));t.tick=pick(Array.from({length:ticks+1},(_,i)=>i));t.target=rational(t.min*t.step.d+t.tick*t.step.n,t.step.d);
  t.source=v%2?decimal(decimalOf(t.target)):fraction(t.target.n,t.target.d);t.prompt='Plaats dit getal op de geijkte lijn.';t.representation=t.source.kind;
 }else if(skill==='compare'){
  const pairs=level?[[decimal('-0,8'),decimal('-0,75')],[fraction(8,4),integer(2)],[fraction(-3,4),decimal('-0,7')],[fraction(7,8),decimal('0,9')],[fraction(4,5),percent(75)],[percent(125),fraction(5,4)]]:[[percent(75),decimal('0,8')],[fraction(1,2),decimal('0,5')],[fraction(3,4),percent(70)],[decimal('0,4'),fraction(1,2)],[fraction(1,4),percent(25)]];
  [t.left,t.right]=pick(pairs);if(random()>.5)[t.left,t.right]=[t.right,t.left];t.target=compare(value(t.left),value(t.right));t.prompt='Vergelijk de waarden. Kies <, = of >.';t.representation=v%2?'numberline':'symbols';
 }else if(skill==='group'){
  const pairs=level?[[rational(-1,2),rational(3,4)],[rational(5,4),rational(1,4)],[rational(2,5),rational(3,5)]]:[[rational(1,2),rational(3,4)],[rational(1,4),rational(1,2)],[rational(2,5),rational(3,4)]];
  const values=level&&v%2?[rational(pick([1,2,3,4])),rational(1,2)]:pick(pairs);t.tokens=values.flatMap(r=>[fraction(r.n,r.d),r.d===1?integer(r.n):decimal(decimalOf(r)),percent(r.n*100/r.d)]).map(e=>({e,shuffle:random()})).sort((a,b)=>a.shuffle-b.shuffle).map(x=>x.e);
  t.prompt='Groepeer de zes kaartjes volgens hun waarde.';t.representation=t.tokens.some(e=>e.kind==='integer')?'whole-mix':'fraction-mix';
 }else if(skill==='root'){
  t.n=pick(level?[2,5,10,17,20,26,35,50]:[2,5,10,17,20]);t.k=Math.floor(Math.sqrt(t.n));t.source=sqrt(t.n);t.prompt='Zoek eerst de twee opeenvolgende kwadraten.';t.representation=v%2?'area':'bounds';
 }else if(skill==='interval'){
  t.lo=pick(level?[-3,-2,-1,0]:[-1,0,1]);t.hi=t.lo+pick([2,3,4]);t.closedLo=!!(v&1);t.closedHi=!!(v&2);t.min=-4;t.max=6;
  t.sourceMode=v%2?'words':'notation';t.prompt='Bouw het interval op de lijn.';t.representation=t.sourceMode;
 }else if(skill==='classify'){
  t.source=pick(level?[integer(0),integer(-3),fraction(6,3),fraction(-3,4),sqrt(16),sqrt(2),sqrt(3,-1),decimal('1,25')]:[integer(5),integer(-2),integer(0),fraction(3,4),sqrt(16)]);
  const val=value(t.source);t.target=val.root!==undefined?['irr','R']:val.d===1?[...(val.n>=0?['N']:[]),'Z','Q','R']:['Q','R'];
  t.prompt='Kies alle verzamelingen waartoe dit getal behoort.';t.representation=t.source.kind;
 }else if(skill==='period'){
  const pairs=level?[['1','6'],['03','27'],['','125'],['','27'],['','3'],['2','45']]:[['','3'],['','27'],['1','6'],['','12'],['','09']];
  [t.lead,t.repeat]=pick(pairs);t.whole=pick([0,1,2]);t.digits=t.lead+t.repeat.repeat(t.repeat.length>3?2:3);t.target={start:t.lead.length,end:t.lead.length+t.repeat.length-1};
  t.rule=`${t.lead?'Eerst '+t.lead+', daarna':'Na de komma'} blijft het blok ${t.repeat.repeat(t.repeat.length>3?1:2)} zich onbeperkt herhalen.`;
  t.prompt='Duid één kortste herhaalblok aan, zo vroeg mogelijk.';t.representation=t.lead?'with-prefix':'pure-period';
 }
 t.signature=JSON.stringify({...t,seed:0,variant:0,level:0});return t;
}
function freshAnswer(t){return {values:t.skill==='interval'?['','']:['',''],sign:1,relation:null,groups:Array(6).fill(null),labels:[],tick:null,closedLo:false,closedHi:false,start:null,end:null,stage:0}}
const result=(ok,code,message,extra={})=>({ok,code,message,...extra});
function validate(t,a){
 const good=message=>result(true,'ok',message),bad=(code,message)=>result(false,code,message),empty=()=>result(false,'input','Maak eerst je antwoord af.',{input:true});
 if(t.skill==='fraction'){
  if(!/^\d{1,6}$/.test(a.values[0])||!/^\d{1,6}$/.test(a.values[1]))return empty();const n=Number(a.values[0])*a.sign,d=Number(a.values[1]);
  if(!d)return result(false,'input','De noemer mag niet 0 zijn.',{input:true});
  if(!equal(rational(n,d),t.target))return bad('value',`Je breuk heeft de waarde ${decimalOf(rational(n,d))}. Vergelijk die met het gegeven getal.`);
  if(gcd(n,d)!==1)return result(false,'simplify','De waarde klopt. Deel teller en noemer nog door dezelfde gemeenschappelijke deler.',{partial:true});
  return good('Dezelfde waarde, nu als vereenvoudigde breuk.');
 }
 if(t.skill==='compare'){if(a.relation===null)return empty();if(a.relation===t.target)return good(t.target===0?'Deze twee schrijfwijzen stellen hetzelfde getal voor.':'Het kleinere getal ligt links van het grotere.');return bad('order',number(value(t.left))<0&&number(value(t.right))<0?'Bij negatieve getallen ligt het getal met de grootste afstand tot nul verder naar links.':t.left.kind==='root'||t.right.kind==='root'?'Onderzoek de wortelwaarde met een bekend kwadraat. Het wortelteken alleen vertelt niet hoe groot het getal is.':'Breng de waarden naar dezelfde voorstelling. Bijvoorbeeld: procent betekent per honderd.');}
 if(t.skill==='line'){
  if(!Number.isInteger(a.tick))return empty();const n=rational(t.min*t.step.d+a.tick*t.step.n,t.step.d);
  return equal(n,t.target)?good('Je punt past bij de waarde én de schaal.'):bad('scale',`Je punt staat op ${decimalOf(n)}. Tel de gelijke tussenruimten vanaf een bekend anker.`);
 }
 if(t.skill==='group'){
  if(a.groups.length!==6||a.groups.some(x=>!['A','B'].includes(x)))return empty();
  for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)if((a.groups[i]===a.groups[j])!==equal(value(t.tokens[i]),value(t.tokens[j])))return bad('equivalence',`Vergelijk kaart ${i+1} en kaart ${j+1}: ${a.groups[i]===a.groups[j]?'hebben ze echt dezelfde waarde?':'stellen ze misschien hetzelfde getal voor?'}`);
  return good('In elke groep staan drie schrijfwijzen van dezelfde waarde.');
 }
 if(t.skill==='root'){
  const l=parse(a.values[0]),u=parse(a.values[1]);if(!l||!u)return empty();
  const lower=a.stage===0?t.k*t.k:t.k,upper=a.stage===0?(t.k+1)**2:t.k+1;
  if(equal(l,rational(lower))&&equal(u,rational(upper)))return good(a.stage===0?'De kwadraten kloppen. Bouw nu zelf de grenzen voor de wortel.':'De wortel ligt tussen de bijbehorende positieve zijden.');
  return bad(a.stage===0?'squares':'root-bounds',a.stage===0?'Zoek de grootste gehele kwadraatwaarde onder het gegeven getal en het eerstvolgende kwadraat.':`Controleer je grenzen door ze te kwadrateren: ${decimalOf(l)}² = ${format(number(l)**2)} en ${decimalOf(u)}² = ${format(number(u)**2)}.`);
 }
 if(t.skill==='interval'){
  const l=parse(a.values[0]),u=parse(a.values[1]);if(!l||!u)return empty();if(compare(l,u)>=0)return bad('bounds-order','De linkergrens moet kleiner zijn dan de rechtergrens.');
  if(!equal(l,rational(t.lo))||!equal(u,rational(t.hi)))return bad('bounds','Controleer de twee grenswaarden. Open of gesloten verandert de waarde van de grens niet.');
  if(a.closedLo!==t.closedLo)return bad('inclusion',`${format(t.lo)} ${t.closedLo?'hoort wel':'hoort niet'} bij het gevraagde interval. Pas de linkergrens aan.`);
  if(a.closedHi!==t.closedHi)return bad('inclusion',`${format(t.hi)} ${t.closedHi?'hoort wel':'hoort niet'} bij het gevraagde interval. Pas de rechtergrens aan.`);
  return good('Zowel de grenswaarden als het wel of niet meetellen kloppen.');
 }
 if(t.skill==='classify'){
  if(!a.labels.length)return empty();const wrong=a.labels.find(x=>!t.target.includes(x)),missing=t.target.find(x=>!a.labels.includes(x));
  if(wrong||missing)return bad('sets',t.source.kind==='root'&&Number.isInteger(Math.sqrt(t.source.n))?`Bereken eerst de wortel. ${label(t.source)} is ${format(number(value(t.source)))}. Kies daarna alle passende verzamelingen.`:wrong==='N'?'Natuurlijke getallen zijn 0, 1, 2, …; negatieve en niet-gehele waarden horen daar niet bij.':wrong==='irr'||missing==='Q'?'Een getal is rationaal als het als breuk van twee gehele getallen kan worden geschreven, met een niet-nulle noemer.':missing==='R'?'Alle getallen in deze oefening zijn reëel. ℝ telt dus ook mee.':'Denk aan de insluiting: ℕ binnen ℤ, ℤ binnen ℚ en ℚ binnen ℝ. Irrationale getallen liggen ook in ℝ.');
  return good('Je hebt alle passende verzamelingen gekozen. ℕ bevat hier ook 0.');
 }
 if(t.skill==='period'){
  if(a.start===null||a.end===null)return empty();
  if(a.start===t.target.start&&a.end===t.target.end)return good('De overbar omvat één kortste blok. De vaste aanloop blijft ervoor.');
  const selected=t.digits.slice(a.start,a.end+1),tail=t.digits.slice(a.start);
  return bad('period',tail.startsWith(selected.repeat(2))?'Je blok herhaalt zich. Kan het korter of begint dezelfde herhaling al eerder?':'Herhaal je gekozen blok. Dan krijg je niet dezelfde opeenvolging van cijfers; controleer ook de vaste aanloop.');
 }
 throw Error('Onbekende beoordeling');
}
const freshSkill=()=>({intro:false,seen:0,clean:0,recent:[],signatures:[],representations:[],reviewClean:0,last:-1,repair:null,due:0});
function fresh(){return {version:1,xp:0,total:0,sessions:0,lastSkill:null,skills:Object.fromEntries(skills.map(s=>[s.id,freshSkill()]))}}
const count=n=>Number.isFinite(n)?Math.floor(Math.max(0,Math.min(1e7,n))):0;
function sanitize(raw){const p=fresh();if(raw?.version!==1)return p;for(const k of ['xp','total','sessions'])p[k]=count(raw[k]);p.lastSkill=skills.some(s=>s.id===raw.lastSkill)?raw.lastSkill:null;for(const {id} of skills){const d=raw.skills?.[id]||{},s=p.skills[id];s.intro=d.intro===true;for(const k of ['seen','clean','reviewClean','due'])s[k]=count(d[k]);s.last=Number.isInteger(d.last)?Math.max(-1,Math.min(p.total,d.last)):-1;s.repair=typeof d.repair==='string'?d.repair.slice(0,30):null;for(const k of ['signatures','representations'])s[k]=Array.isArray(d[k])?[...new Set(d[k].filter(x=>typeof x==='string'))].slice(-30):[];s.recent=Array.isArray(d.recent)?d.recent.filter(x=>typeof x==='boolean').slice(-4):[];}return p}
function unlocked(p,id){return skills.find(s=>s.id===id).deps.every(d=>p.skills[d].clean>=2)}
function mastered(p,id){const s=p.skills[id];return s.clean>=4&&s.reviewClean>=1&&s.signatures.length>=3&&s.representations.length>=2&&s.recent.length>=3&&s.recent.slice(-3).every(Boolean)&&!s.repair}
function choose(p){
 const available=skills.filter(s=>unlocked(p,s.id));const due=available.find(s=>p.skills[s.id].repair&&p.skills[s.id].due<=p.total);if(due)return due.id;
 const fresh=available.find(s=>!p.skills[s.id].intro);if(fresh)return fresh.id;
 return available.map(s=>({id:s.id,score:(p.total-p.skills[s.id].last)+(mastered(p,s.id)?-5:3)+(s.id===p.lastSkill?-4:0)})).sort((a,b)=>b.score-a.score)[0].id;
}
function record(p,t,{clean=false,solved=false,code='practice'}={}){
 const s=p.skills[t.skill],repair=!!s.repair,age=p.total-s.last;
 const xp=clean?(repair?15:10+2*t.level):solved?5:0;p.xp+=xp;p.total++;p.lastSkill=t.skill;
 s.intro=true;s.seen++;s.last=p.total;s.recent=[...s.recent,!!clean].slice(-4);
 if(clean){s.clean++;if(age>=3)s.reviewClean++;s.signatures=[...new Set([...s.signatures,t.signature])].slice(-30);s.representations=[...new Set([...s.representations,t.representation])];s.repair=null;}
 else{s.repair=code;s.due=p.total+3;}return xp;
}
const api={rational,parse,value,compare,equal,number,format,decimalOf,label,integer,fraction,decimal,percent,sqrt,skills,generate,freshAnswer,validate,Progress:{fresh,sanitize,choose,unlocked,mastered,record}};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.RealNumbersCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
