/* Exact values and learning state. No DOM, pixels, network or learner identity. */
(function(root){
'use strict';
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
function rational(n,d=1){if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||!d)throw Error('Ongeldige breuk');if(d<0){n=-n;d=-d}const g=gcd(n,d);return {n:n/g,d:d/g}}
const integer=n=>({kind:'integer',n}),fraction=(n,d)=>({kind:'fraction',n,d}),decimal=text=>({kind:'decimal',text:String(text).replace('.',',')}),percent=n=>({kind:'percent',n}),sqrt=(n,sign=1)=>({kind:'root',n,sign}),cbrt=n=>({kind:'root',n,sign:1,degree:3});
function parse(text){
 const s=String(text??'').trim().replace('−','-');if(!/^-?\d{1,6}(?:[.,]\d{1,4})?$/.test(s))return null;
 const negative=s[0]==='-',[a,b='']=s.replace('-','').replace(',','.').split('.');return rational((negative?-1:1)*Number(a+b),10**b.length);
}
function value(e){
 switch(e.kind){case 'integer':return rational(e.n);case 'fraction':return rational(e.n,e.d);case 'decimal':return parse(e.text);case 'percent':return rational(e.n,100);case 'root':{const degree=e.degree||2;if(![2,3].includes(degree)||!Number.isSafeInteger(e.n)||(degree===2&&e.n<0)||![-1,1].includes(e.sign))throw Error('Geen reële wortel');const sign=e.sign*Math.sign(e.n||1),absolute=Math.abs(e.n),k=Math.round(absolute**(1/degree));if(k**degree===absolute)return rational(sign*k);return {root:absolute,degree,sign}}case 'pi':return {pi:true,sign:1};case 'period':{const lead=e.lead||'',repeat=e.repeat,den=10**lead.length*(10**repeat.length-1);return rational(Number(e.whole||0)*den+Number(lead||0)*(10**repeat.length-1)+Number(repeat),den)}default:throw Error('Onbekende voorstelling')}
}
function compare(a,b){
 if(a.pi||b.pi)return Math.sign(number(a)-number(b));
 if(a.root!==undefined&&b.root!==undefined){if(a.sign!==b.sign)return Math.sign(a.sign-b.sign);const da=a.degree||2,db=b.degree||2;return a.sign*signBig(BigInt(a.root)**BigInt(db)-BigInt(b.root)**BigInt(da));}
 if(a.root!==undefined){if(a.sign>0&&b.n<0)return 1;if(a.sign<0&&b.n>=0)return -1;const d=BigInt(a.degree||2);return a.sign*signBig(BigInt(a.root)*BigInt(b.d)**d-BigInt(Math.abs(b.n))**d)}
 if(b.root!==undefined)return -compare(b,a);
 return signBig(BigInt(a.n)*BigInt(b.d)-BigInt(b.n)*BigInt(a.d));
}
const signBig=n=>n<0n?-1:n>0n?1:0;
const equal=(a,b)=>compare(a,b)===0,number=v=>v.pi?Math.PI:v.root!==undefined?v.sign*v.root**(1/(v.degree||2)):v.n/v.d;
function numberSets(e){const v=value(e);return v.root!==undefined||v.pi?['irr','R']:v.d===1?[...(v.n>=0?['N']:[]),'Z','Q','R']:['Q','R']}
function decimalType(e){const v=value(e);if(v.root!==undefined||v.pi)return 'irr';let d=v.d;while(d%2===0)d/=2;while(d%5===0)d/=5;return d===1?'finite':gcd(v.d,10)===1?'pure':'mixed'}
const decimalNames={finite:'Eindig decimaal',pure:'Zuiver repeterend',mixed:'Gemengd repeterend',irr:'Irrationaal getal'};
const radical=(n,d=1,degree=2,sign=1)=>({kind:'radical',radicand:d===1?integer(n):fraction(n,d),degree,sign});
function parseExact(text){const parts=String(text).replaceAll('−','-').split('/');if(parts.length===1)return parse(parts[0]);if(parts.length!==2||!/^[-]?\d{1,6}$/.test(parts[0])||!/^\d{1,6}$/.test(parts[1])||!Number(parts[1]))return null;return rational(Number(parts[0]),Number(parts[1]))}
const exactText=r=>r.d===1?format(r.n):`${format(r.n)}/${r.d}`;
function extractRoot(n,degree){let outside=1;for(let k=2;k**degree<=Math.abs(n);k++)if(n%(k**degree)===0)outside=k;return {outside,inside:Math.abs(n)/outside**degree}}
function rootBounds(t,stage){const degree=t.degree||2,k=t.k;if(stage===0)return [k**degree,(k+1)**degree];return t.source.sign<0?[-k-1,-k]:[k,k+1]}
function endpoint(v){return v==='-inf'?-Infinity:v==='inf'?Infinity:parse(v)?number(parse(v)):null}
function intervalLabel(lo,hi,cl,ch){return `${cl&&lo!==null?'[':']'}${lo===null?'−∞':format(lo)}; ${hi===null?'+∞':format(hi)}${ch&&hi!==null?']':'['}`}
function format(n){return String(n).replace('-', '−').replace('.',',')}
function decimalOf(v){return format(Number((v.n/v.d).toFixed(4)))}
function label(e){switch(e.kind){case 'fraction':return `${format(e.n)}/${e.d}`;case 'integer':return format(e.n);case 'decimal':return e.text.replace('-','−');case 'percent':return `${format(e.n)}%`;case 'root':return `${e.sign<0?'−':''}${e.degree===3?'∛':'√'}${e.n<0?'('+format(e.n)+')':e.n}`;case 'power':return `(${format(e.base)})${e.degree===3?'³':'²'}`;case 'radical':return `${e.sign<0?'−':''}${e.degree===3?'∛':'√'}(${label(e.radicand)})`;case 'pi':return 'π';case 'period':return `${e.whole||0},${e.lead||''}${e.repeat.repeat(3)}…`;default:return ''}}
const skills=[
 {id:'fraction',title:'Een waarde, meerdere vormen',short:'Breuken bouwen',deps:[],concept:'Een breuk, decimaal en procent kunnen precies hetzelfde getal voorstellen.'},
 {id:'line',title:'Getallen krijgen een plaats',short:'De getallijn',deps:['fraction'],concept:'De schaal bepaalt de plaats. Gelijke afstanden betekenen gelijke verschillen.'},
 {id:'compare',title:'Groter, kleiner of gelijk',short:'Vergelijken',deps:['line'],concept:'Vergelijk de waarden, ook als de schrijfwijzen verschillen. Links op de lijn ligt het kleinere getal.'},
 {id:'group',title:'Andere vorm, dezelfde waarde',short:'Equivalenten groeperen',deps:['compare'],concept:'Voorstellingen horen samen als ze exact dezelfde waarde hebben.'},
 {id:'rootcalc',title:'Wortels uit het hoofd',short:'Wortels berekenen',deps:['group'],concept:'Bereken vierkantswortels en derdemachtswortels exact, ook met mintekens, machten en breuken.'},
 {id:'rootsimplify',title:'Haal eruit wat je kunt',short:'Wortelvormen vereenvoudigen',deps:['rootcalc'],concept:'Haal volledige kwadraten of derdemachten buiten de wortel. Bijvoorbeeld: √72 = 6√2.'},
 {id:'root',title:'Hoe groot is deze wortel?',short:'Wortels schatten',deps:['rootsimplify'],concept:'Tussen welke twee opeenvolgende gehele getallen ligt de wortel? Gebruik bekende kwadraten of derdemachten om te controleren.'},
 {id:'interval',title:'Een heel gebied op de lijn',short:'Intervallen bouwen',deps:['root'],concept:'Een interval heeft grenzen. Open betekent dat de grens niet meetelt, gesloten dat ze wel meetelt.'},
 {id:'classify',title:'Tot welke verzamelingen?',short:'Getalsoorten',deps:['root'],concept:'Kijk naar de waarde. Een geheel getal is ook rationaal en reëel; een wortelteken maakt een getal niet automatisch irrationaal.'},
 {id:'sets',title:'Getallen in elkaar passende verzamelingen',short:'Slepen naar ℕ, ℤ, ℚ en ℝ',deps:['classify'],concept:'ℕ ligt in ℤ, ℤ in ℚ, en ℚ in ℝ. Plaats elk getal in de kleinste passende verzameling.'},
 {id:'decimaltype',title:'Hoe gaat de decimaal verder?',short:'Vier soorten decimalen',deps:['period'],concept:'Eindig, zuiver repeterend, gemengd repeterend of irrationaal: kijk naar de volledige voortzetting.'},
 {id:'period',title:'Een blok dat blijft terugkomen',short:'Periodieke decimalen',deps:['classify'],concept:'We schrijven de periode drie keer, gevolgd door … . De herhaling gaat onbeperkt door. Een vaste aanloop hoort niet bij de periode.'}
];
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296}}
function generate(skill,{seed=1,variant=0,level=0,contentVersion=3}={}){
 if(!skills.some(s=>s.id===skill))throw Error('Onbekende vaardigheid');
 const random=rng(seed),pick=a=>a[Math.floor(random()*a.length)],v=variant%5;
 const t={skill,seed,variant,level,contentVersion,representation:'symbols'};
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
 }else if(skill==='rootcalc'){
  const kind=variant%(level===0?4:12),k=pick([2,3,4,5,6,7,8,9,10,11,12,15]),c=pick([2,3,4,5,6]);
  t.source=radical(k*k);t.target=rational(k);t.representation='square';
  if(kind===1){t.source.sign=-1;t.target.n*=-1;t.representation='negative-square';}
  if(kind===2||kind===3){const n=kind===3?-c:c;t.source=radical(n**3,1,3);t.target=rational(n);t.representation='cube';}
  if(kind===4||kind===9){const base=kind===4?-4:pick([-3,-5,-7]);t.source.radicand={kind:'power',base,degree:2};t.target=rational(Math.abs(base));t.representation='square-of-negative';}
  if(kind===5||kind===8){t.source=radical(9,16,2,kind===8?-1:1);t.target=rational(kind===8?-3:3,4);t.representation='fraction';}
  if(kind===6||kind===7){t.source=radical(kind===7?-125:125,64,3);t.target=rational(kind===7?-5:5,4);t.representation='cube-fraction';}
  if(kind===10){t.source=radical(-k*k);t.target=null;t.representation='not-real';}
  if(kind===11){t.source=radical(0,1,variant%2?3:2);t.target=rational(0);t.representation='zero';}
  t.prompt='Bereken de wortelwaarde exact, zonder rekenmachine.';
 }else if(skill==='rootsimplify'){
  const kind=variant%(level===0?2:6),degree=kind===2||kind===3||kind===5?3:2;
  let n=pick(degree===2?[8,12,18,20,27,32,45,48,50,72,98,108,125]:[16,24,54,81,128,192,250]),d=1,sign=kind===1?-1:1;
  if(kind===3)n=-n;
  if(kind===4){n=125;d=64;}if(kind===5){n=54;d=125;}
  const {outside,inside}=extractRoot(n,degree),den=Math.round(d**(1/degree));
  t.source=radical(n,d,degree,sign);t.radicand=rational(n,d);t.target={coefficient:rational(sign*Math.sign(n)*outside,den),inside};
  t.degree=degree;t.factorPower=outside**degree;t.prompt='Vereenvoudig: breng zoveel mogelijk buiten de wortel.';
  t.representation=d!==1?'fraction':degree===3?'cube':'square';
 }else if(skill==='root'){
  t.n=pick(level?[2,5,10,17,20,26,35,50]:[2,5,10,17,20]);t.k=Math.floor(Math.sqrt(t.n));t.source=sqrt(t.n);if(contentVersion>=2&&level){if(variant%3===1)t.source=sqrt(t.n,-1);if(variant%3===2){t.degree=3;t.n=pick([-30,-10,-2,2,10,30]);t.k=Math.floor(Math.cbrt(t.n));t.source=cbrt(t.n);}}t.prompt='Zoek eerst de twee opeenvolgende kwadraten.';t.representation=t.degree===3?'cubes':t.source.sign<0?'negative-root':v%2?'area':'bounds';if(t.degree===3)t.prompt='Zoek de twee opeenvolgende gehele derdemachten.';
  if(contentVersion>=3){t.directBounds=true;t.prompt='Tussen welke twee opeenvolgende gehele getallen ligt deze wortel?';t.representation=t.degree===3?'cubes':t.source.sign<0?'negative-root':'bounds';}
 }else if(skill==='interval'){
  t.lo=pick(level?[-3,-2,-1,0]:[-1,0,1]);t.hi=t.lo+pick([2,3,4]);t.closedLo=!!(v&1);t.closedHi=!!(v&2);t.min=-4;t.max=7;
  t.sourceMode=v%2?'words':'notation';t.prompt='Bouw het interval op de lijn.';t.representation=t.sourceMode;
  if(contentVersion>=2){
   t.lo=pick([-3,-2,-1,0,1,2,3,4,5]);t.hi=t.lo+pick([1,2,3,4]);
   const kind=level?variant%12:variant%3;if(kind===1)t.closedLo=t.closedHi=true;const wordLo=t.closedLo?'groter dan of gelijk aan':'groter dan',wordHi=t.closedHi?'kleiner dan of gelijk aan':'kleiner dan';
   t.sourceText=kind===1?`x is ${wordHi} ${format(t.hi)} en ${wordLo} ${format(t.lo)}.`:`x is ${wordLo} ${format(t.lo)} en ${wordHi} ${format(t.hi)}.`;
   if(kind===2)t.sourceText=`${format(t.lo)} ${t.closedLo?'≤':'<'} x ${t.closedHi?'≤':'<'} ${format(t.hi)}`;
   if([3,6].includes(kind)){t.lo=null;t.closedLo=false;t.closedHi=kind===3;t.sourceText=`x is kleiner ${t.closedHi?'dan of gelijk aan':'dan'} ${format(t.hi)}.`;}
   if([4,5].includes(kind)){t.hi=null;t.closedHi=false;t.closedLo=kind===5;t.sourceText=`x is groter ${t.closedLo?'dan of gelijk aan':'dan'} ${format(t.lo)}.`;}
   if([7,11].includes(kind)){t.lo=0;t.hi=null;t.closedLo=kind===7;t.closedHi=false;t.sourceText=kind===7?'x ∈ ℝ⁺':'x ∈ ℝ⁺, met x ≠ 0';t.convention='Hier betekent ℝ⁺: alle reële getallen groter dan of gelijk aan 0.';}
   if(kind===8){t.lo=null;t.hi=0;t.closedLo=false;t.closedHi=true;t.sourceText='x ∈ ℝ⁻';t.convention='Hier betekent ℝ⁻: alle reële getallen kleiner dan of gelijk aan 0.';}
   if(kind===9){t.lo=t.hi=null;t.closedLo=t.closedHi=false;t.sourceText='x ∈ ℝ';}
   if(kind===10)t.sourceText=intervalLabel(t.lo,t.hi,t.closedLo,t.closedHi);
   t.representation=t.lo===null||t.hi===null?'unbounded':kind===2?'inequality':'words';t.min=Math.min(-4,(t.lo??t.hi??0)-1);t.max=Math.max(7,(t.hi??t.lo??0)+1);
  }else t.max=6;
 }else if(skill==='classify'){
  t.source=pick(level?[integer(0),integer(-3),fraction(6,3),fraction(-3,4),sqrt(16),sqrt(2),sqrt(3,-1),decimal('1,25')]:[integer(5),integer(-2),integer(0),fraction(3,4),sqrt(16)]);
  if(contentVersion>=2&&level)t.source=pick([integer(0),integer(-3),fraction(6,3),fraction(-3,4),sqrt(16),sqrt(9,-1),sqrt(2),sqrt(3,-1),cbrt(-8),cbrt(27),cbrt(-2),cbrt(5),decimal('1,25')]);t.target=numberSets(t.source);
  t.prompt='Kies alle verzamelingen waartoe dit getal behoort.';t.representation=t.source.kind;
 }else if(skill==='sets'){
  t.tokens=[pick([integer(0),sqrt(16),cbrt(27),fraction(6,3)]),pick([integer(-3),sqrt(9,-1),cbrt(-8)]),pick([fraction(-3,4),decimal('1,25'),fraction(7,3)]),pick([sqrt(2),sqrt(3,-1),cbrt(-2),cbrt(5),{kind:'pi'}])].map(e=>({e,r:random()})).sort((a,b)=>a.r-b.r).map(x=>x.e);
  t.target=t.tokens.map(e=>{const kinds=numberSets(e);return kinds[0]==='irr'?'R':kinds[0]});t.prompt='Sleep elk getal naar de kleinste passende verzameling.';t.representation=t.tokens.some(e=>e.degree===3)?'cube-roots':'mixed-forms';
 }else if(skill==='decimaltype'){
  const examples=[decimal('0,125'),{kind:'period',whole:0,lead:'',repeat:'27'},{kind:'period',whole:0,lead:'1',repeat:'6'},sqrt(2),fraction(7,8),fraction(5,3),fraction(1,6),cbrt(-2),sqrt(16),{kind:'pi'},cbrt(-8),sqrt(3,-1)];
  t.source=examples[variant%examples.length];t.target=decimalType(t.source);t.prompt='Welke soort decimale ontwikkeling heeft dit getal?';t.representation=t.source.kind;
  t.rule=t.source.kind==='period'?`${t.source.lead?'Na de vaste aanloop '+t.source.lead+' herhaalt':'Meteen na de komma herhaalt'} het blok ${t.source.repeat} zich onbeperkt.`:t.source.kind==='pi'?'π is de verhouding tussen de omtrek en de diameter van een cirkel.':'';
 }else if(skill==='period'){
  const pairs=level?[['1','6'],['03','27'],['','125'],['','27'],['','3'],['2','45']]:[['','3'],['','27'],['1','6'],['','12'],['','09']];
  [t.lead,t.repeat]=pick(pairs);t.repeat=shortestPeriod(t.repeat);t.whole=pick([0,1,2]);t.digits=t.lead+t.repeat.repeat(t.repeat.length>3?2:3);t.target={start:t.lead.length,end:t.lead.length+t.repeat.length-1};
  t.rule=`${t.lead?'Eerst '+t.lead+', daarna':'Na de komma'} blijft het blok ${t.repeat} zich onbeperkt herhalen.`;
  t.prompt='Duid één kortste herhaalblok aan, zo vroeg mogelijk.';t.representation=t.lead?'with-prefix':'pure-period';
 }
 t.signature=JSON.stringify({...t,seed:0,variant:0,level:0});return t;
}
// Keep inclusion attached to its endpoint when the learner works right-to-left.
function orderInterval(a){
 const lo=endpoint(a.values[0]),hi=endpoint(a.values[1]);
 if(lo!==null&&hi!==null&&lo>hi){a.values.reverse();[a.closedLo,a.closedHi]=[a.closedHi,a.closedLo];return true}return false;
}
function shortestPeriod(block){
 for(let n=1;n<=block.length;n++)if(block.length%n===0&&block.slice(0,n).repeat(block.length/n)===block)return block.slice(0,n);
 return block;
}
function freshAnswer(t){return {values:t.skill==='interval'?['','']:['',''],sign:1,relation:null,groups:Array(6).fill(null),labels:[],tick:null,closedLo:false,closedHi:false,start:null,end:null,stage:t.directBounds?1:0,noReal:false,periodAnchor:null,placements:Array(t.tokens?.length||4).fill(null),decimalType:null}}
const result=(ok,code,message,extra={})=>({ok,code,message,...extra});
function validate(t,a){
 const good=message=>result(true,'ok',message),bad=(code,message)=>result(false,code,message),empty=()=>result(false,'input','Maak eerst je antwoord af.',{input:true});
 if(t.skill==='fraction'){
  if(!/^\d{1,6}$/.test(a.values[0])||!/^\d{1,6}$/.test(a.values[1]))return empty();const n=Number(a.values[0])*a.sign,d=Number(a.values[1]);
  if(!d)return result(false,'input','De noemer mag niet 0 zijn.',{input:true});
  if(!equal(rational(n,d),t.target)){const r=rational(n,d),shown=decimalOf(r),exact=equal(r,parse(shown));return bad('value',`Je breuk ${exact?'heeft de waarde':'is ongeveer'} ${shown}. Vergelijk die met het gegeven getal.`);}
  if(gcd(n,d)!==1)return result(false,'simplify','De waarde klopt. Deel teller en noemer nog door dezelfde gemeenschappelijke deler.',{partial:true});
  return good('Dezelfde waarde, nu als vereenvoudigde breuk.');
 }
 if(t.skill==='rootcalc'){
  if(a.noReal)return t.target===null?good('In ℝ bestaat geen vierkantswortel van een negatief getal. Elk reëel kwadraat is niet-negatief.'):bad('root-real','Deze wortel heeft wel een reële waarde. Een minteken vóór √ mag; een derdemachtswortel kan ook negatief zijn.');
  const r=parseExact(a.values[0]);if(!r)return empty();
  if(t.target===null)return bad('root-real','Onder √ staat een negatief getal. Geen enkel reëel getal heeft dat als kwadraat.');
  if(equal(r,t.target))return good(`${label(t.source)} = ${exactText(t.target)}. Controleer met de bijbehorende macht.`);
  return bad('root-value',t.representation==='square-of-negative'?'Bereken eerst het kwadraat. De vierkantswortel daarvan is niet-negatief: √(a²) = |a|.':t.source.degree===3?'Welk getal geeft bij driemaal vermenigvuldigen met zichzelf het getal onder de wortel? Denk ook aan het teken.':'√ geeft de niet-negatieve wortel. Een minteken vóór de wortel neem je daarna mee.');
 }
 if(t.skill==='rootsimplify'){
  const c=parseExact(a.values[0]),inside=Number(a.values[1]);if(!c||!/^\d{1,6}$/.test(a.values[1])||inside<1)return empty();
  const degree=BigInt(t.degree),r=t.radicand;
  const same=BigInt(c.n)**degree*BigInt(inside)*BigInt(r.d)===BigInt(r.n)*BigInt(c.d)**degree&&(t.degree===3||Math.sign(c.n)===t.source.sign);
  if(!same)return bad('root-factor',`Een factor mag alleen buiten de wortel als je de ${t.degree===3?'derdemachtswortel':'vierkantswortel'} van die factor neemt. De waarde moet gelijk blijven.`);
  if(inside!==t.target.inside)return result(false,'root-simplify','De waarde klopt, maar er kan nog meer buiten de wortel. Zoek een grotere kwadraat- of derdemachtsfactor.',{partial:true});
  const parts=a.values[0].replaceAll('−','-').split('/');if(parts.length===2&&gcd(Number(parts[0]),Number(parts[1]))>1)return result(false,'root-coefficient','De wortel is vereenvoudigd. Vereenvoudig nu ook de breuk vóór het wortelteken.',{partial:true});
  return good(`Volledig vereenvoudigd: ${t.target.coefficient.d===1?exactText(t.target.coefficient):`(${exactText(t.target.coefficient)})`}${t.degree===3?'∛':'√'}${t.target.inside}. Onder de wortel blijft geen volledige ${t.degree===3?'derdemachtsfactor':'kwadraatfactor'} groter dan 1 over.`);
 }
 if(t.skill==='compare'){if(a.relation===null)return empty();if(a.relation===t.target)return good(t.target===0?'Deze twee schrijfwijzen stellen hetzelfde getal voor.':'Het kleinere getal ligt links van het grotere.');return bad('order',number(value(t.left))<0&&number(value(t.right))<0?'Bij negatieve getallen ligt het getal met de grootste afstand tot nul verder naar links.':t.left.kind==='root'||t.right.kind==='root'?'Onderzoek de wortelwaarde met een bekend kwadraat. Het wortelteken alleen vertelt niet hoe groot het getal is.':'Breng de waarden naar dezelfde voorstelling. Bijvoorbeeld: procent betekent per honderd.');}
 if(t.skill==='line'){
  if(!Number.isInteger(a.tick))return empty();const n=rational(t.min*t.step.d+a.tick*t.step.n,t.step.d);
  return equal(n,t.target)?good('Je punt past bij de waarde én de schaal.'):bad('scale',`Je punt staat op ${decimalOf(n)}. Tel de gelijke tussenruimten vanaf een bekend anker.`);
 }
 if(t.skill==='group'){
  if(a.groups.length!==6||a.groups.some(x=>!['A','B'].includes(x)))return empty();
  for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)if((a.groups[i]===a.groups[j])!==equal(value(t.tokens[i]),value(t.tokens[j])))return {...bad('equivalence',`Vergelijk kaart ${i+1} en kaart ${j+1}: ${a.groups[i]===a.groups[j]?'hebben ze echt dezelfde waarde?':'stellen ze misschien hetzelfde getal voor?'}`),pair:[i,j]};
  return good('In elke groep staan drie schrijfwijzen van dezelfde waarde.');
 }
 if(t.skill==='root'){
  const l=parse(a.values[0]),u=parse(a.values[1]);if(!l||!u)return empty();
  const [lower,upper]=rootBounds(t,t.directBounds?1:a.stage);
  if(equal(l,rational(lower))&&equal(u,rational(upper)))return good(a.stage===0?'De machten kloppen. Bouw nu de grenzen voor de wortelwaarde.':t.source.sign<0?'Bij tegengestelde getallen keert de volgorde om. De negatieve wortelwaarde ligt tussen jouw grenzen.':'De wortelwaarde ligt tussen de bijbehorende gehele getallen.');
  return bad(a.stage===0?'squares':'root-bounds',a.stage===0?`Zoek twee opeenvolgende gehele getallen waarvan de ${t.degree===3?'derdemachten':'kwadraten'} de gegeven waarde insluiten.`:t.source.sign<0?'Begrens eerst de positieve wortel. Neem de tegengestelden en keer de volgorde om.':`Controleer door je grenzen tot de ${t.degree===3?'derde':'tweede'} macht te verheffen.`);

 }
 if(t.skill==='interval'){
  a={...a,values:[...a.values]};orderInterval(a);
  const l=endpoint(a.values[0]),u=endpoint(a.values[1]);if(l===null||u===null)return empty();if(l>=u)return bad('bounds-order','De linkergrens moet kleiner zijn dan de rechtergrens.');
  if(l!==(t.lo??-Infinity)||u!==(t.hi??Infinity))return bad('bounds','Controleer de grenswaarden en de richting. Bij een onbegrensde kant hoort een pijl naar −∞ of +∞.');
  if(a.closedLo!==t.closedLo||a.closedHi!==t.closedHi)return bad('inclusion',!Number.isFinite(l)&&a.closedLo||!Number.isFinite(u)&&a.closedHi?'Oneindig is geen grensgetal dat je kunt opnemen. Een oneindige kant is altijd open.':'Bij < of > hoort een hol punt; bij ≤ of ≥ een vol punt. Controleer beide kanten.');
  return good('De grenswaarden, de richting en het meetellen van de eindpunten kloppen.');
 }
 if(t.skill==='sets'){
  if(a.placements.length!==t.tokens.length||a.placements.some(x=>!['N','Z','Q','R'].includes(x)))return empty();const i=a.placements.findIndex((x,i)=>x!==t.target[i]);
  if(i>=0)return {...bad('sets',`${label(t.tokens[i])}: kijk naar de waarde en kies de kleinste passende verzameling. Een getal in ℕ hoort ook bij ℤ, ℚ en ℝ, maar ligt in het binnenste vak.`),token:i};
  return good('Alle getallen liggen in de kleinste passende verzameling. De grotere verzamelingen bevatten ze ook.');
 }
 if(t.skill==='decimaltype'){
  if(!a.decimalType)return empty();if(a.decimalType===t.target)return good(({finite:'De decimale ontwikkeling stopt. Je mag daarna nullen toevoegen.',pure:'De periode begint meteen na de komma: er is geen vaste aanloop.',mixed:'Eerst komt een vaste aanloop, daarna herhaalt het blok onbeperkt.',irr:'De decimale ontwikkeling is oneindig en niet-periodiek.'})[t.target]);
  return bad('decimal-type',t.source.kind==='root'&&value(t.source).n!==undefined?`Bereken eerst ${label(t.source)}. Een wortelteken betekent niet automatisch irrationaal.`:'Eindig: de cijfers stoppen. Zuiver: de periode start meteen. Gemengd: eerst een vaste aanloop. Irrationaal: oneindig, zonder periode.');
 }

 if(t.skill==='classify'){
  if(!a.labels.length)return empty();const wrong=a.labels.find(x=>!t.target.includes(x)),missing=t.target.find(x=>!a.labels.includes(x));
  if(wrong||missing)return bad('sets',t.source.kind==='root'&&value(t.source).n!==undefined?`Bereken eerst de wortel. ${label(t.source)} is ${format(number(value(t.source)))}. Kies daarna alle passende verzamelingen.`:wrong==='N'?'Natuurlijke getallen zijn 0, 1, 2, …; negatieve en niet-gehele waarden horen daar niet bij.':wrong==='irr'||missing==='Q'?'Een getal is rationaal als het als breuk van twee gehele getallen kan worden geschreven, met een niet-nulle noemer.':missing==='R'?'Alle getallen in deze oefening zijn reëel. ℝ telt dus ook mee.':'Denk aan de insluiting: ℕ binnen ℤ, ℤ binnen ℚ en ℚ binnen ℝ. Irrationale getallen liggen ook in ℝ.');
  return good('Je hebt alle passende verzamelingen gekozen. ℕ bevat hier ook 0.');
 }
 if(t.skill==='period'){
  if(a.start===null||a.end===null)return empty();
  if(a.start===t.target.start&&a.end===t.target.end)return good('Je hebt één kortste herhaalblok gekozen. De vaste aanloop blijft ervoor.');
  const selected=t.digits.slice(a.start,a.end+1),tail=t.digits.slice(a.start);
  return bad('period',tail.startsWith(selected.repeat(2))?'Je blok herhaalt zich. Kan het korter of begint dezelfde herhaling al eerder?':'Herhaal je gekozen blok. Dan krijg je niet dezelfde opeenvolging van cijfers; controleer ook de vaste aanloop.');
 }
 throw Error('Onbekende beoordeling');
}
// A bounded record of processed exercises; old saves legitimately have no event history.
function sanitizeActivity(items){return (Array.isArray(items)?items:[]).filter(e=>e&&skills.some(s=>s.id===e.skill)&&['independent','supported','skipped'].includes(e.outcome)).slice(-30).map(e=>({skill:e.skill,outcome:e.outcome,code:typeof e.code==='string'?e.code.slice(0,40):null,at:Number.isFinite(e.at)&&e.at>0&&e.at<1e14?e.at:0,seq:Number.isInteger(e.seq)&&e.seq>0?e.seq:0,xp:Number.isFinite(e.xp)?Math.max(0,Math.min(18,e.xp)):0}))}
const freshSkill=()=>({intro:false,seen:0,clean:0,recent:[],signatures:[],representations:[],reviewClean:0,last:-1,repair:null,due:0});
function fresh(){return {version:1,xp:0,total:0,sessions:0,activity:[],lastSkill:null,skills:Object.fromEntries(skills.map(s=>[s.id,freshSkill()]))}}
const count=n=>Number.isFinite(n)?Math.floor(Math.max(0,Math.min(1e7,n))):0;
function sanitize(raw){const p=fresh();if(raw?.version!==1)return p;p.activity=sanitizeActivity(raw.activity);for(const k of ['xp','total','sessions'])p[k]=count(raw[k]);p.lastSkill=skills.some(s=>s.id===raw.lastSkill)?raw.lastSkill:null;for(const {id} of skills){const d=raw.skills?.[id]||{},s=p.skills[id];s.intro=d.intro===true;for(const k of ['seen','clean','reviewClean','due'])s[k]=count(d[k]);s.last=Number.isInteger(d.last)?Math.max(-1,Math.min(p.total,d.last)):-1;s.repair=typeof d.repair==='string'?d.repair.slice(0,30):null;for(const k of ['signatures','representations'])s[k]=Array.isArray(d[k])?[...new Set(d[k].filter(x=>typeof x==='string'))].slice(-30):[];s.recent=Array.isArray(d.recent)?d.recent.filter(x=>typeof x==='boolean').slice(-4):[];}return p}
function unlocked(p,id){return skills.find(s=>s.id===id).deps.every(d=>p.skills[d].clean>=2)}
function mastered(p,id){const s=p.skills[id];return s.clean>=4&&s.reviewClean>=1&&s.signatures.length>=3&&s.representations.length>=2&&s.recent.length>=3&&s.recent.slice(-3).every(Boolean)&&!s.repair}
function choose(p){
 const available=skills.filter(s=>unlocked(p,s.id));const due=available.find(s=>p.skills[s.id].repair&&p.skills[s.id].due<=p.total);if(due)return due.id;
 const fresh=available.find(s=>!p.skills[s.id].intro);if(fresh)return fresh.id;
 return available.map(s=>({id:s.id,score:(p.total-p.skills[s.id].last)+(mastered(p,s.id)?-5:3)+(s.id===p.lastSkill?-4:0)})).sort((a,b)=>b.score-a.score)[0].id;
}
function record(p,t,{clean=false,solved=false,code='practice',now=Date.now()}={}){
 const s=p.skills[t.skill],repair=!!s.repair,age=p.total-s.last;
 const xp=clean?(repair?15:10+2*t.level):solved?5:0;p.xp+=xp;p.total++;p.lastSkill=t.skill;
 s.intro=true;s.seen++;s.last=p.total;s.recent=[...s.recent,!!clean].slice(-4);
 if(clean){s.clean++;if(age>=3)s.reviewClean++;s.signatures=[...new Set([...s.signatures,t.signature])].slice(-30);s.representations=[...new Set([...s.representations,t.representation])];s.repair=null;}
 else{s.repair=code;s.due=p.total+3;}
 p.activity=[...sanitizeActivity(p.activity),{skill:t.skill,outcome:clean?'independent':solved?'supported':'skipped',code:clean?null:code,at:now,seq:p.total,xp}].slice(-30);return xp;
}
const api={radical,parseExact,exactText,extractRoot,numberSets,decimalType,decimalNames,rootBounds,endpoint,intervalLabel,cbrt,orderInterval,shortestPeriod,rational,parse,value,compare,equal,number,format,decimalOf,label,integer,fraction,decimal,percent,sqrt,skills,generate,freshAnswer,validate,Progress:{fresh,sanitize,choose,unlocked,mastered,record}};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.RealNumbersCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
