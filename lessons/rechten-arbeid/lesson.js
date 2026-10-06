(function(root,factory){if(typeof module==='object')module.exports=factory();else root.LessonStageContent=factory();})(globalThis,()=>{
 const accents={
  'opening':['LERAARBOB'],'les':['samen'],'contract':['rechten begrijpen'],'reisweg':['Wij leggen de weg af.'],
  'zelf-lopen':['zelf de stappen'],'regel-upload':['23:00'],'regel-account':['eigen account'],
  'regel-werk':['eigen werk'],'leerdoel':['Het doel blijft hetzelfde.'],'overload':['geen oneindige processor'],
  'denkruimte':['DENKRUIMTE'],'helpen-zelf':['de ander werken'],'parasiet':['NIET GEVONDEN'],
  'nee':['Nee.'],'meedoen':['werkelijk meedoen'],'ronde2':['RONDE 2'],
  'geleverd':['ARBEID'],'bewijs-van-arbeid':['20 VRAGEN'],'uitloop':['kunnen werken.'],'wiskunde':['Wiskunde'],'onze-les':['vorm, richting'],'vaardigheden':['Opnieuw proberen.'],'waar-sta-ik':['waar sta ik?']
 };
 const punch=new Set(['gebouwd','regel-upload','regel-account','regel-werk','overload','parasiet','nee','werkelijkheid','ronde2','geleverd','bewijs-van-arbeid']);
 const sceneColor=(art,phase)=>art==='bandwidth'?(phase===1||phase===2?'red':'teal'):art==='help'?(phase?'teal':'red'):art==='parasite'?'red':['contract','world','points','thinking','position'].includes(art)?'blue':['boat','ethics'].includes(art)?'teal':'amber';
 const scene=(id,title,art,text,options={})=>({
  id,title,chapter:options.chapter,notes:options.notes||'',
  events:[{type:'scene',art,seed:37,phase:options.phase||0,tone:options.tone||'paper',color:options.color||sceneColor(art,options.phase||0),...options.drawing},
   {type:'text',text,emphasis:accents[id]||[],impact:punch.has(id),note:options.note||'',choices:options.choices||[],at:options.delay??350},...(options.events||[])]
 });
 const steps=[
  scene('aftellen','We starten weldra · 3 minuten','empty','We starten weldra.',{tone:'night',delay:0,note:'Leg je materiaal klaar. Meld je aan bij leraarBob en sluit aan via Live.',events:[{type:'pause',duration:180000,next:'samen-lezen',finished:'We gaan beginnen.'}],notes:'Drie minuten om rustig aan te sluiten. De aftelling gaat vanzelf naar de leesafspraak. Je kunt eerder verder klikken; R begint opnieuw bij drie minuten.'}),
  scene('samen-lezen','Zo lezen we samen','empty','We gaan samen lezen.',{delay:0,note:'Zie je jouw naam? Lees de zin hardop.\nStaan jullie met twee? Lees om de beurt.\nDe rest leest mee. Ik klik verder.',notes:'Kondig eerst de leesafspraak aan. Is iemand afwezig, dan neemt de duopartner of een andere leerling over. Jij houdt de regie en klikt verder wanneer iedereen klaar is.'}),
  scene('opening','LeraarBob // sessie 01','opening','LERAARBOB',{tone:'night',note:'SESSIE 01 / RECHTENWERELD',notes:'Een dunne lijn. Laat het even stil zijn. De intro is een gesprek van ongeveer 6–8 minuten; jij bepaalt elk volgend betekenisvol moment.'}),
  scene('sessie-starten','Sessie starten?','opening','SESSIE STARTEN?',{tone:'night',choices:['JA','we zitten hier toch'],notes:'Droge opening. Beide knoppen starten hetzelfde verhaal, geen leerlingstemming.'}),
  scene('gebouwd','Iets voor jullie gebouwd','package','Ik heb iets voor jullie gebouwd.',{chapter:'01 / DE OVEREENKOMST',notes:'Jij opent met wat je hebt voorbereid. Daarna nemen de twee leerlingen het over: de voorbereiding is er, de les maken we samen.'}),
  scene('als-we-dit-doen','De voorbereiding','package','U hebt de les voorbereid.',{phase:1}),
  scene('les','Samen maken we de les','empty','Wij maken er samen iets van.',{tone:'night',notes:'De tweede lezer antwoordt op de eerste. Bevestig kort: precies, deze les maken we samen.'}),
  scene('contract','Ons doel: begrijpen en gebruiken','contract','Ik wil dat jullie rechten begrijpen\nen zelf kunnen gebruiken.',{chapter:'02 / TWEE VERANTWOORDELIJKHEDEN',phase:0,notes:'Mijn verantwoordelijkheid: weten waar we naartoe gaan, een route voorbereiden en bijsturen.'}),
  scene('reisweg','Wij leggen de weg af','contract','Wij leggen de weg af.\nIeder vanaf zijn eigen startpunt.',{phase:1,notes:'De leerling vertrekt, werkt, vraagt en controleert. Die reis is niet voor iedereen even lang.'}),
  scene('zelf-lopen','Zelf de weg afleggen','contract','Ik kan de route bouwen.\nJullie zetten zelf de stappen.',{phase:2}),
  scene('software-update','LeraarBob OS','terminal','Beleid laden…',{chapter:'03 / SYSTEM UPDATE',drawing:{installed:0},notes:'Niet dreigend: deze afspraken worden voorspelbaar. Je haalt discussie uit het systeem.'}),
  scene('regel-upload','Uploaddeadline','terminal','Upload sluit om 23:00.',{drawing:{installed:1},note:'De avond vóór de les.'}),
  scene('regel-account','Eigen account','terminal','We gebruiken ons eigen account.',{drawing:{installed:2},note:'Papier of digitaal: we leveren ons eigen werk.'}),
  scene('regel-werk','Individueel bewijs','terminal','Een individuele taak toont ons eigen werk.',{drawing:{installed:3}}),
  scene('server-uitleg','Onderhandelen met de server','terminal','Maar kunnen we over die deadline onderhandelen?',{drawing:{installed:3},note:'Nee. Die functie is niet geïnstalleerd.\nOm 23:00 sluit de upload.',notes:'De leerling vraagt of de deadline verschoven kan worden. Jij antwoordt: de server onderhandelt niet. Breng de eerste zin droog en maak daarna de afspraak concreet: uploaden vóór 23:00, de avond voor de les.'}),
  scene('middelen','Wat is een les?','tools','Onze les heeft meer dan één vorm.',{chapter:'04 / HET GEREEDSCHAP',phase:0}),
  scene('leerdoel','Het doel blijft','tools','Soms papier. Soms digitaal.\nHet doel blijft hetzelfde.',{phase:1,note:'De leerkracht kiest het gereedschap.'}),
  scene('bandwidth','Grote oren en ogen','bandwidth','Onze leerkracht heeft grote oren en ogen.',{chapter:'05 / BANDWIDTH',phase:0}),
  scene('overload','Geen oneindige processor','bandwidth','Maar helaas geen oneindige processor.',{phase:1,events:[{type:'audio',cue:'overload',at:900}],notes:'Laat de tekstballonnen en CPU-meter oplopen. Het beeld bevriest bij 100%. Jij klikt pas verder wanneer het punt gemaakt is.'}),
  scene('processor','Het probleem zit hier','bandwidth','Het probleem bevindt zich ongeveer hier.',{phase:2,note:'Dat geldt trouwens voor ongeveer ieder mens.'}),
  scene('denkruimte','Rust geeft denkruimte','bandwidth','RUST = DENKRUIMTE',{phase:3,notes:'Praten is niet verboden. De standaardtoestand is rust. Als je praat tijdens het werken, gaat het over wat we aan het doen zijn.'}),
  scene('gesprekken','Waarover spreken we?','bandwidth','Als we praten, gaat het over ons werk.',{phase:3,note:'Een rustige sfeer is ook een manier om te helpen.'}),
  scene('wiskunde','Wiskunde is…','world','Wiskunde is vorm, richting,\ndata en verandering.',{chapter:'06 / WAAROM WISKUNDE?',notes:'De vier beelden maken vorm, richting, data en verandering concreet. Verbind ze daarna met onze eigen les, zonder een lange motivatiepreek.'}),
  scene('onze-les','Onze les is wiskunde','world','Onze les heeft vorm, richting,\ndata en verandering.',{phase:1,note:'Onze les is wiskunde!',notes:'Laat het duo de vier vakken verbinden met onze les: een aanpak kiezen, een doel bepalen, zien wat al lukt en bijleren.'}),
  scene('niet-hele-reden','En hier leren we ook…','thinking','En hier leren we ook…',{phase:0}),
  scene('vaardigheden','Wat je doet als je het nog niet kunt','thinking','Plannen. Controleren.\nOpnieuw proberen.',{notes:'Ook twijfel, volhouden, fouten herkennen, uitleggen en samenwerken zijn werk. Geef ruimte om iets nog niet te kunnen.'}),
  scene('nog-niet','Wanneer het antwoord er nog niet ligt','thinking','We oefenen wat we doen\nals we het antwoord nog niet weten.',{phase:1}),
  scene('startpunten','Iedereen begint ergens','points','We beginnen niet op dezelfde plaats.',{chapter:'07 / BEGINPUNT',phase:0,note:'Dat is normaal.'}),
  scene('doelzone','Verschillende routes','points','Iedereen begint ergens.',{phase:1,note:'Niemand begint aan de finish.'}),
  scene('eerlijk-startpunt','Doen alsof','position','Doen alsof we iets al kunnen,\nbrengt ons niet verder.',{phase:0,notes:'Laat het masker even staan. Geen namen koppelen aan kunnen of niet kunnen; dit gaat over een houding die voor iedereen geldt.'}),
  scene('waar-sta-ik','Geen theater. Waar sta ik?','position','Geen theater.\nGewoon: waar sta ik?',{phase:1,note:'Daar begint mijn volgende stap.',notes:'Vraag na het lezen: hoe merk je waar je staat? Laat het duo of een vrijwilliger kort reageren. Een fout, een vraag of een eigen poging geeft informatie.'}),
  scene('helpen','HELPEN.EXE','help','Helpen?',{chapter:'08 / HELPEN.EXE',phase:0,note:'Het blad overnemen: nee.'}),
  scene('helpen-richting','Terugspoelen. Richting geven.','help','Stel een vraag. Geef richting. Leg iets uit.',{phase:1,notes:'Je geeft niet je afgewerkte blad. Je helpt de ander zien hoe die zelf de volgende stap kan zetten.'}),
  scene('helpen-zelf','De ander zet de laatste stap','help','Helpen laat de ander werken.',{phase:2,note:'Wie iets uitlegt, traint trouwens ook.'}),
  scene('overnemen','Samenwerken?','parasite','SAMENWERKEN?',{chapter:'09 / PARASIETMODE',phase:0}),
  scene('parasiet','Samenwerking niet gevonden','parasite','SAMENWERKING NIET GEVONDEN',{phase:1,note:'parasitaire activiteit gedetecteerd',notes:'Kopiëren, hetzelfde bestand, dezelfde antwoorden, een andere naam erboven: dat is geen samenwerking.'}),
  scene('nee','Nee.','empty','Nee.',{tone:'night',notes:'Niet verder moraliseren. Eén woord; volgende klik.'}),
  scene('samen','Ethiek in moeilijke wiskundetijden','ethics','Ervoor zorgen dat anderen hier ook kunnen leren.',{chapter:'10 / ETHIEK',note:'Ook tijdens deze heel moeilijke wiskundetijden.'}),
  scene('ruimte-geven','Zorgen voor elkaar','ethics','Helpen wanneer je kunt.\nRuimte geven wanneer iemand denkt.',{phase:1,note:'Niemand is een gratis oplossingsmachine.'}),
  scene('boot','Hetzelfde schuitje','boat','We zitten in hetzelfde schuitje.',{chapter:'11 / DEZELFDE BOOT',drawing:{passengers:1}}),
  scene('boot-samen','Iedereen aan boord','boat','De enige optie is samen ons doel bereiken.',{drawing:{passengers:7}}),
  scene('anderhalve-maand','Voorlopig samen','boat','…voor minstens anderhalve maand.',{drawing:{passengers:7,sailing:true},notes:'Laat het kleine bootje een paar seconden verder varen. Dit is de droge eindnoot, geen grootse climax.'}),
  scene('belofte-leraar','Mijn belofte','contract','Ik probeer een goede route te bouwen.',{chapter:'12 / DE AFSPRAAK',phase:1}),
  scene('belofte-leerling','Jullie belofte','contract','Wij beloven niet dat alles meteen lukt.',{phase:2}),
  scene('meedoen','Werkelijk meedoen','contract','Wel dat we werkelijk meedoen.',{phase:2}),
  scene('deal','Deal?','empty','Deal?',{tone:'night',note:'Deal.',notes:'Jij stelt de vraag. Het duo antwoordt. Geef ruimte voor een echte korte reactie vóór je verder klikt.'}),
  scene('werkelijkheid','Dan nu de werkelijkheid','opening','OKÉ. DAN NU DE WERKELIJKHEID.',{tone:'night'}),
  {id:'join',title:'Sessie open · aansluiten',events:[{type:'liveJoin'}]},
  {id:'eerlijk',title:'De papieren taak',events:[{type:'poll',id:'eigen-werk',anonymous:false,question:'Heb jij deze papieren taak volledig zelf gemaakt?',options:['Ja','Neen']}]},
  {id:'polluitslag',title:'De groep',notes:'Geen “aha!” en geen oordeel bij de aantallen. Gewoon: dank u.',events:[{type:'results',source:'poll',poll:'eigen-werk'}]},
  scene('dank-u','Dank u','empty','Dank u.',{note:'Meer hoef ik daar eigenlijk niet over te weten.'}),
  scene('bewijzen','Niet aan mij','empty','Dit antwoord hoef je aan mij niet te bewijzen.'),
  scene('jezelf','Aan jezelf','empty','Aan onszelf misschien wel.'),
  scene('achtergelaten','Wat heeft de arbeid achtergelaten?','paper','We gaan kijken wat de arbeid heeft achtergelaten.',{note:'We gaan ermee werken.'}),
  {id:'correctie',title:'Taak 1 · samen corrigeren',notes:'Laat eerst denken, dan pas de oplossing zien. Gebruik “Korte check invoegen” voor een diagnosevraag of foutbespreking.',events:[{type:'pdf',slot:'taak1'}]},
  scene('ronde2','Ronde 2','paper','RONDE 2',{note:'Nieuwe taak. Zelfde persoon. Iets meer kennis.'}),
  {id:'taak2',title:'Taak 2 · aan het werk',events:[{type:'pdf',slot:'taak2'}]},
  {id:'werktijd',title:'Werktijd · 15 minuten',notes:'Rust als standaard. Korte duo-interventies waar zinvol. Je kunt eerder verder of langer laten werken; de timer forceert niets.',events:[{type:'scene',art:'paper'},{type:'text',text:'Nu opnieuw.',note:'Denk. Werk. Controleer.'},{type:'pause',duration:900000}]},
  scene('geleverd','Arbeid geleverd?','empty','ARBEID GELEVERD?',{tone:'night'}),
  scene('kijken','Laten we kijken','opening','LATEN WE KIJKEN.',{tone:'night'}),
  scene('bewijs-van-arbeid','Bewijs van arbeid','paper','KLASBATTLE · 20 VRAGEN',{note:'Van eenvoudig naar lastig. Gebruik papier. Denk. Reken.',notes:'Geen reflexquiz. Vanaf vraag 11 wordt papier een goed idee. Vanaf vraag 16 verwachten we arbeid.'}),
  scene('mooi-kijken','Geen punten voor mooi kijken','paper','Geen punten voor mooi kijken.',{note:'Niet gokken. Werk het uit.'}),
  {id:'battle',title:'Klasbattle · 20 vragen',events:[{type:'battle',preset:'arbeid'}]},
  {id:'klasbeeld',title:'Wat de arbeid achterliet',events:[{type:'results',source:'battle'}]},
  scene('voltooid','Sessie voltooid','boat','SESSIE VOLTOOID',{drawing:{passengers:7,sailing:true},note:'Vandaag hebben we niet bewezen dat iedereen alles kan.'}),
  scene('uitloop','Wel dat we kunnen werken','boat','Wel dat we kunnen werken.',{drawing:{passengers:7,sailing:true},note:'volgende sessie → verder'})
 ];
 // Stable duos share a chapter; a reading turn never advances the teacher's cursor.
 const readers=['Liana','Amal','Doae','Neva','Emelly','Zemrita','Alae','Lina','Hala','Berfin','Imane','Ibtissam','Shakira','Nilay','Ecrin','Anas','Nadia','Djenaba','Paris','Souraya'];
 const readerPairs=Array.from({length:10},(_,i)=>readers.slice(i*2,i*2+2));
 const readingGroups=[
  ['gebouwd','als-we-dit-doen','les'],
  ['contract','reisweg','zelf-lopen'],
  ['software-update','regel-upload','regel-account','regel-werk','server-uitleg'],
  ['middelen','leerdoel'],
  ['bandwidth','overload','processor','denkruimte','gesprekken'],
  ['wiskunde','onze-les','niet-hele-reden','vaardigheden','nog-niet'],
  ['startpunten','doelzone','eerlijk-startpunt','waar-sta-ik'],
  ['helpen','helpen-richting','helpen-zelf','overnemen','parasiet','nee'],
  ['samen','ruimte-geven'],
  ['boot','boot-samen','anderhalve-maand']
 ];
 const teacherSteps=new Set(['aftellen','samen-lezen','opening','sessie-starten','gebouwd','contract','zelf-lopen','processor','nee','belofte-leraar','deal','werkelijkheid','dank-u','bewijzen','achtergelaten','ronde2','werktijd','geleverd','kijken','bewijs-van-arbeid','mooi-kijken']);
 const duoSteps=new Set(['reisweg','leerdoel','vaardigheden','waar-sta-ik','ruimte-geven']);
 for(const step of steps){
  const text=step.events.find(e=>e.type==='text');if(!text)continue;
  let pair=readingGroups.findIndex(ids=>ids.includes(step.id));
  if(pair<0)pair=['voltooid','uitloop'].includes(step.id)?9:['belofte-leerling','meedoen','deal','jezelf'].includes(step.id)?0:null;
  const group=readingGroups[pair]||[],index=group.filter(id=>!teacherSteps.has(id)).indexOf(step.id);
  step.reading={pair,lead:teacherSteps.has(step.id)?'teacher':duoSteps.has(step.id)?'pair':Math.max(0,index)%2};
  if(['meedoen','uitloop'].includes(step.id))step.reading.lead=1;
  if(step.id==='onze-les')text.noteSpeaker=0;
  if(step.id==='server-uitleg')text.noteSpeaker='teacher';
  if(step.id==='deal')text.noteSpeaker='pair';
 }
 const skills=['point','point_plot','line_behavior','special_lines','zeroRead','delta','slope','equation_from_ab','graph_from_equation','graph_from_table','slope','zero','equation_from_graph','positive','negative','zero','signchart','equation_from_graph','graph_from_equation','negative'];
 const deck=skills.map((skill,i)=>({skill,seed:37+i*13,variant:i<5?0:i<10?1:i<15?2:3}));
 const band=i=>i<5?'WARMLOPEN':i<10?'NU MOET JE REKENEN':i<15?'PAPIER WORDT EEN GOED IDEE':i<19?'ARBEID':'LAATSTE RECHTE';
 const checks=[
  {label:'Zelf een stap uitleggen',question:'Kun je zelf de volgende stap uitleggen?',options:['Ja','Nog niet']},
  {label:'Waar liep het vast?',question:'Waar zat jouw grootste probleem?',options:['Voorschrift','Punt / coördinaat','Richtingscoëfficiënt','Snijpunt met de y-as','Ik wist niet hoe te beginnen']},
  {label:'Een fout bespreken',question:'Wat denk jij dat hier fout ging?',options:['Gegevens verkeerd gelezen','Verkeerde aanpak','Rekenfout','Nog niet duidelijk']}
 ];
 const previousStepIds=['opening','gebouwd','les','contract','regel-upload','regel-account','regel-werk','middelen','bandwidth','wiskunde','vaardigheden','startpunten','helpen','overnemen','samen','boot','anderhalve-maand','werkelijkheid','join','eerlijk','polluitslag','bewijzen','jezelf','achtergelaten','correctie','ronde2','taak2','werktijd','geleverd','kijken','battle','klasbeeld','uitloop'];
 return {id:'rechten-arbeid',version:1,title:'Rechtenwereld — Arbeid',battleResultStep:'klasbeeld',previousStepIds,steps,deck,band,checks,readers,readerPairs};
});
