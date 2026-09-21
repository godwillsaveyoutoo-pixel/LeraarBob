(function(root){
'use strict';
const C=typeof module!=='undefined'&&module.exports?require('./real-core.js'):root.RealNumbersCore;
function build(t){
 const a=C.freshAnswer(t),steps=[];const add=(title,text)=>steps.push({title,text,answer:JSON.parse(JSON.stringify(a))});
 switch(t.skill){
 case 'fraction':{
  const r=t.target,isPercent=t.source.kind==='percent',places=isPercent?2:(t.source.text.split(',')[1]||'').length,d=10**places,n=Math.abs(r.n*d/r.d);
  add('Lees wat één deel betekent',isPercent?'Procent betekent per honderd. De teller vertelt hoeveel honderdsten je neemt.':`Er staan ${places} cijfers na de komma. Schrijf het getal eerst in ${places===1?'tienden':places===2?'honderdsten':'duizendsten'}.`);
  a.values=[String(n),String(d)];a.sign=Math.sign(r.n)||1;add('Bewaar dezelfde waarde','De breuk stelt hetzelfde getal voor. Een eventueel minteken geldt voor de hele breuk.');
  a.values=[String(Math.abs(r.n)),String(r.d)];add('Vereenvoudig samen','Deel teller én noemer door dezelfde gemeenschappelijke deler. De waarde verandert niet.');break;
 }
 case 'line':
  add('Lees eerst de schaal',`Van ${C.format(t.min)} naar ${C.format(t.max)}. Eén klein streepje verder is ${C.decimalOf(t.step)} erbij.`);
  a.tick=Math.round((0-t.min)/C.number(t.step));add('Begin bij een bekend anker','Vanaf nul beweeg je naar rechts voor positieve waarden en naar links voor negatieve. Tel tussenruimten, niet streepjes.');
  a.tick=t.tick;add('Koppel waarde aan plaats',`${C.label(t.source)} is ${C.decimalOf(t.target)}. Het gekozen punt ligt op precies die waarde.`);break;
 case 'compare':
  add('Vergelijk de waarden','Een langere schrijfwijze maakt een getal niet groter. Zet beide waarden eerst om naar dezelfde voorstelling.');
  add('Maak de vergelijking zichtbaar',`${C.label(t.left)} = ${C.decimalOf(C.value(t.left))}; ${C.label(t.right)} = ${C.decimalOf(C.value(t.right))}. Bij negatieve waarden ligt het kleinste getal verder naar links.`);
  a.relation=t.target;add('Lees van links naar rechts',t.target===0?'De waarden zijn gelijk. Daarom past =.':t.target<0?'De linkse waarde is kleiner. Daarom past <.':'De linkse waarde is groter. Daarom past >.');break;
 case 'group':{
  add('Maak groepen op waarde','Groep A en B hebben vooraf geen betekenis. Jij kiest welke waarde bij welke letter hoort.');
  const first=C.value(t.tokens[0]);a.groups=t.tokens.map(e=>C.equal(C.value(e),first)?'A':null);add('Verbind één waarde',`De kaartjes in A stellen allemaal ${C.decimalOf(first)} voor. Procent betekent per honderd.`);
  a.groups=a.groups.map(x=>x||'B');add('Controleer binnen én tussen groepen','Binnen elke groep zijn de waarden gelijk. De twee groepen hebben verschillende waarden. A en B omwisselen mag ook.');break;
 }
 case 'root':
  add('Een wortel is een zijde',`Een vierkant met oppervlakte ${t.n} heeft zijde √${t.n}. Vergelijk met vierkanten met gehele zijden.`);
  a.values=[String(t.k*t.k),String((t.k+1)**2)];add('Zoek de naburige kwadraten',`${t.k}² = ${t.k*t.k} en ${t.k+1}² = ${(t.k+1)**2}. De oppervlakte ligt ertussen.`);
  a.stage=1;a.values=['',''];add('Ga van oppervlakte naar zijde','Neem nu de positieve zijden van die twee vierkanten. Je schrijft dus andere grensgetallen.');
  a.values=[String(t.k),String(t.k+1)];add('Begrens zonder afronden',`${t.k} < √${t.n} < ${t.k+1}. Dit is een exacte insluiting, geen afgeronde waarde voor de wortel.`);break;
 case 'interval':
  add('Een gebied van getallen','Alle punten tussen de grenzen horen erbij. Voor de grenspunten moet je apart beslissen.');
  a.values=[String(t.lo),String(t.hi)];add('Kies de grenswaarden',`Links ${C.format(t.lo)}, rechts ${C.format(t.hi)}. Een leeg rondje betekent: deze grens telt niet mee.`);
  a.closedLo=t.closedLo;a.closedHi=t.closedHi;add('Beslis over beide grenspunten',`${C.format(t.lo)} ${t.closedLo?'telt mee: een vol rondje':'telt niet mee: een leeg rondje'}. ${C.format(t.hi)} ${t.closedHi?'telt mee':'telt niet mee'}.`);break;
 case 'classify':{
  const r=C.value(t.source);
  add('Lees de waarde, niet de vorm',r.root!==undefined?`${C.label(t.source)} is irrationaal: deze wortel van een niet-kwadraat kan niet als breuk van gehele getallen worden geschreven.`:`${C.label(t.source)} heeft waarde ${C.decimalOf(r)}. Bijvoorbeeld: √16 = 4, dus een wortelteken betekent niet automatisch irrationaal.`);
  add('Verzamelingen passen in elkaar','ℕ = {0, 1, 2, …}. ℤ bevat ook negatieve gehele getallen. Elk geheel getal is een breuk met noemer 1 en hoort dus ook bij ℚ.');
  a.labels=t.target;add('Kies alle passende namen','ℝ bevat zowel rationale als irrationale getallen. Daarom kies je ℝ ook. De buitenste verzameling vervangt de andere juiste namen niet.');break;
 }
 case 'period':
  add('De voortzetting is gegeven',t.rule+' Met alleen een eindig rijtje cijfers zou je niet zeker weten hoe het getal verdergaat.');
  add('Laat de vaste aanloop staan',t.lead?`De aanloop ${t.lead} komt maar één keer. Het herhaalblok begint daarna.`:'Er is geen vaste aanloop. De herhaling begint meteen na de komma.');
  a.start=t.target.start;a.end=t.target.end;add('Neem het kortste blok',`Het blok ${t.repeat} herhaalt zich onbeperkt. Extra herhalingen hoeven niet onder de overbar.`);break;
 }
 return steps;
}
const api={build};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.RealNumbersLessons=api;
})(typeof globalThis!=='undefined'?globalThis:this);
