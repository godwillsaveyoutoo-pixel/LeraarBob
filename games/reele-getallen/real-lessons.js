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
 case 'root':{
  const powers=C.rootBounds(t,0),bounds=C.rootBounds(t,1),cube=t.degree===3;
  add(cube?'Van derde macht naar wortel':'Van kwadraat naar wortel',cube?`Zoek een getal waarvan de derde macht ${t.n} is. Negatieve getallen hebben ook een reële derdemachtswortel.`:t.source.sign<0?`Bij ${C.label(t.source)} staat het minteken vóór de wortel. Zoek eerst de positieve wortelwaarde en neem daarna het tegengestelde.`:`Een vierkant met oppervlakte ${t.n} heeft zijde √${t.n}. Vergelijk met gehele zijden.`);
  a.values=powers.map(String);add('Zoek de naburige machten',`${t.k}${cube?'³':'²'} = ${powers[0]} en ${t.k+1}${cube?'³':'²'} = ${powers[1]}. ${t.n} ligt ertussen.`);
  a.stage=1;a.values=['',''];add('Ga naar de wortelwaarde',t.source.sign<0?'Door het tegengestelde te nemen keert de volgorde om: het grootste positieve getal wordt het kleinste negatieve.':cube?'Derdemachtswortels behouden de volgorde, ook bij negatieve getallen.':'Neem de positieve zijden. √9 is 3; −√9 is −3. √(−9) is geen reëel getal.');
  a.values=bounds.map(String);add('Begrens zonder afronden',`${C.format(bounds[0])} < ${C.label(t.source)} < ${C.format(bounds[1])}. Dit zijn exacte grenzen, geen afgeronde wortelwaarde.`);break;
 }
 case 'interval':
  add('Vertaal de voorwaarde',t.sourceText||'Alle punten tussen de grenzen horen erbij. Voor de grenspunten beslis je apart.');
  a.values=[t.lo===null?'-inf':String(t.lo),t.hi===null?'inf':String(t.hi)];add('Kies de grenzen en de richting',t.lo===null||t.hi===null?'Aan een onbegrensde kant teken je een pijl. Kies −∞ voor alle kleinere waarden, +∞ voor alle grotere waarden.':'Je mag links of rechts beginnen. Tik beide grensgetallen op de lijn.');
  a.closedLo=t.closedLo;a.closedHi=t.closedHi;add('Open of gesloten?',`${t.lo===null||t.hi===null?'Een oneindige kant is altijd open. ':''}Bij < of > blijft het grenspunt hol. Bij ≤ of ≥ maak je het vol. ${t.convention||''}`);break;
 case 'sets':{
  add('Verzamelingen liggen in elkaar','ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ. Een natuurlijk getal hoort dus ook bij de drie grotere verzamelingen.');
  const first=t.target.indexOf('N');a.placements[first]='N';add('Kies het kleinste vak',`${C.label(t.tokens[first])} is natuurlijk. Het komt in ℕ, het binnenste vak. Dat vak ligt tegelijk in ℤ, ℚ en ℝ.`);
  a.placements=[...t.target];add('Plaats ook de andere getallen','Negatieve gehele getallen komen in ℤ buiten ℕ. Niet-gehele rationale getallen in ℚ buiten ℤ. Irrationale getallen in ℝ buiten ℚ.');break;
 }
 case 'decimaltype':
  add('Vier verschillende voortzettingen','Eindig: de cijfers stoppen. Zuiver repeterend: het herhaalblok begint meteen na de komma.');
  add('Een aanloop of helemaal geen periode?','Gemengd repeterend: eerst een vaste aanloop, daarna een periode. Irrationaal: oneindig veel cijfers, zonder periode.');
  a.decimalType=t.target;add(C.decimalNames[t.target],({finite:'Dit getal heeft een eindige decimale ontwikkeling. Gehele getallen ook: 3 kun je schrijven als 3,0.',pure:'Dit getal heeft een periode die meteen na de komma begint.',mixed:'Na de komma staat eerst een vaste aanloop. Daarna blijft hetzelfde blok terugkomen.',irr:'Deze waarde is irrationaal. De decimale ontwikkeling is oneindig en niet-periodiek. Dat besluit je niet uit alleen enkele zichtbare cijfers.'})[t.target]);break;
 case 'classify':{
  const r=C.value(t.source);
  add('Lees de waarde, niet de vorm',r.root!==undefined?`${C.label(t.source)} is irrationaal: ${t.source.degree===3?'het getal onder deze derdemachtswortel is geen gehele derdemacht':'het getal onder deze vierkantswortel is geen geheel kwadraat'}.`:`${C.label(t.source)} heeft waarde ${C.decimalOf(r)}. Bijvoorbeeld: √16 = 4, dus een wortelteken betekent niet automatisch irrationaal.`);
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
