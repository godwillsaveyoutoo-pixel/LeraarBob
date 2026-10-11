(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LogicContent=factory();})(typeof globalThis==='object'?globalThis:this,()=>{
'use strict';
const districts=[
 {id:'signaalplein',name:'Uitspraken en negatie',verb:'Herken & ontken',color:'#bc6647',symbol:'¬',description:'Eerst precies zeggen wat je bedoelt.',stops:[0,1,2]},
 {id:'schakelwerkplaats',name:'Logische connectieven',verb:'Lees & bouw',color:'#4d8276',symbol:'∧',description:'Regels die een systeem laten werken.',stops:[3,4,5]},
 {id:'testlab',name:'Waarheidstabellen',verb:'Onderzoek alle gevallen',color:'#507f96',symbol:'01',description:'Geen geval overslaan. Geen gokwerk.',stops:[6,7]},
 {id:'spiegelkamer',name:'Logische wetten en equivalenties',verb:'Vergelijk & herstel',color:'#8b7394',symbol:'≡',description:'Anders geschreven. Dezelfde werking?',stops:[8,9,10]},
 {id:'afsprakenbrug',name:'Implicatie en voorwaarden',verb:'Test & weerleg',color:'#ab8540',symbol:'⇒',description:'Een afspraak heeft een richting.',stops:[11,12,13,14]},
 {id:'controlecentrum',name:'Geldige redeneringen',verb:'Verbind & redeneer',color:'#658455',symbol:'⇔',description:'Regels samenbrengen tot een conclusie.',stops:[15,16,17]}
];
const choice=(prompt,stem,options,correct,explanation,extra={})=>({type:'choice',prompt,stem,options,correct,explanation,...extra});
const predict=(prompt,expr,env,explanation,extra={})=>({type:'predict',prompt,expr,env,explanation,...extra});
const build=(prompt,expr,explanation,extra={})=>({type:'build',prompt,expr,explanation,...extra});
const table=(prompt,columns,explanation,extra={})=>({type:'table',prompt,columns,explanation,...extra});
const difference=(prompt,expr,other,explanation,extra={})=>({type:'difference',prompt,expr,other,explanation,...extra});
const counter=(prompt,condition,conclusion,domain,environments,explanation,extra={})=>({type:'counter',prompt,condition,conclusion,domain,environments,explanation,...extra});
const classify=(expr,explanation,extra={})=>({type:'classify',prompt:'Geldt deze formule altijd, soms of nooit?',expr,explanation,...extra});
const opts=(...labels)=>labels.map((label,i)=>({id:String(i),label}));
const col=(expr,label=expr)=>({expr,label});
const stops=[
 {name:'Uitspraken herkennen',goal:'Herken een propositie, ook als je de waarheid nog niet kent.',example:'“9 is even.”',lesson:[['Een uitspraak zegt iets.','Je kunt haar als waar of vals beoordelen. Ook een onware zin is een uitspraak.'],['Een vraag vraagt iets.','“Is 9 even?” is een vraag; ze heeft zelf geen waarheidswaarde.'],['Niet weten is iets anders.','Een feit kan vastliggen terwijl jij nog niet weet of het waar is.']],tasks:[
 choice('Welke zin is een uitspraak?','Een propositie is waar of vals.',opts('Doe het raam dicht.','12 is deelbaar door 3.','Is het raam open?'),'1','“12 is deelbaar door 3” beweert een controleerbaar feit.'),
 choice('Is een onware zin ook een uitspraak?','“9 is even.”',opts('Ja, en de uitspraak is vals.','Nee, want de zin is onwaar.','Alleen als iemand ermee akkoord gaat.'),'0','Een propositie mag vals zijn. Onwaar betekent niet: geen uitspraak.',{category:'false-vs-statement'}),
 choice('Wat voor zin is dit?','“Welke bus neem je?”',opts('Een ware uitspraak.','Een valse uitspraak.','Een vraag.'),'2','Deze zin vraagt informatie; hij beweert geen feit.'),
 choice('Wat weet je zeker over deze zin?','“In dit gesloten doosje zit een rode fiche.”',opts('Geen uitspraak, want ik kan het niet zien.','Wel een uitspraak; ik ken de waarheid nog niet.','Een vraag.'),'1','Het doosje heeft een vaste inhoud. Je kennis van die inhoud kan ontbreken.',{transfer:true,category:'truth-vs-knowledge'}),
 choice('Welke reden klopt?','“Zet de lamp aan.” is geen propositie.',opts('Een opdracht heeft zelf geen waarheidswaarde.','De lamp staat nu uit.','Een korte zin is nooit een propositie.'),'0','Een opdracht vraagt een handeling in plaats van een waar of vals feit.')
 ]},
 {name:'Negatie',goal:'Negatie keert een waarheidswaarde om.',example:'¬p · ¬¬p',lesson:[['W wordt V.','Als p waar is, is ¬p vals.'],['V wordt W.','Als p vals is, is ¬p waar.'],['Twee keer omkeren.','¬¬p heeft dezelfde waarheidswaarde als p.']],tasks:[
 predict('Voorspel de negatie.','¬p',{p:true},'p is waar; ¬p is dus vals.'),
 predict('Voorspel de negatie.','¬p',{p:false},'p is vals; ¬p is dus waar.'),
 predict('Wat doet twee keer NIET?','¬¬p',{p:true},'Twee negaties heffen elkaar op: ¬¬p is waar.'),
 choice('Welke zin is de negatie?','p: De deur is gesloten.',opts('De deur is niet gesloten.','De deur is zeker open én gesloten.','Misschien is de deur gesloten.'),'0','“Niet gesloten” ontkent precies het gegeven feit.',{transfer:true}),
 predict('Ook zonder een plaatje.','¬¬p',{p:false},'Na twee omkeringen krijg je opnieuw de oorspronkelijke waarde: vals.')
 ]},
 {name:'Negaties formuleren',goal:'Ontken de hele uitspraak, met de juiste grens.',example:'¬(T ≥ 20) ⇔ T < 20',lesson:[['Ontken de volledige zin.','De negatie is waar in precies de gevallen waarin de oorspronkelijke zin vals is.'],['Test het grensgeval.','De negatie van “minstens 20” is “minder dan 20”. Bij 20 is de oorspronkelijke zin waar.'],['Een voorbeeld volstaat niet.','“Het is 18” is geen volledige negatie van “het is minstens 20”. Er zijn meer mogelijke temperaturen.']],tasks:[
 choice('Ontken de uitspraak.','De temperatuur is minstens 20 °C.',opts('De temperatuur is minder dan 20 °C.','De temperatuur is hoogstens 20 °C.','De temperatuur is 18 °C.'),'0','Bij precies 20 °C is “minstens 20” waar; de negatie moet daar vals zijn.',{category:'negation-boundary'}),
 choice('Ontken de uitspraak.','x > 5, met x een reëel getal.',opts('x < 5','x ≤ 5','x = 5'),'1','Alle gevallen x ≤ 5 vallen buiten x > 5. Ook x = 5 hoort bij de negatie.'),
 choice('Test het grensgeval.','p: T ≥ 20 °C. Nu is T = 20 °C.',opts('p is W en ¬p is V.','p is V en ¬p is W.','Beide zijn waar.'),'0','20 voldoet aan “minstens 20”; de negatie is daar vals.'),
 choice('Ontken deze wiskundige uitspraak.','x = 0, met x een reëel getal.',opts('x > 0','x < 0','x ≠ 0'),'2','De volledige negatie omvat zowel negatieve als positieve waarden.',{transfer:true}),
 choice('Welke ontkenning is volledig?','Alle drie de lampen branden.',opts('Geen enkele lamp brandt.','Minstens één lamp brandt niet.','Precies één lamp brandt.'),'1','Niet alle betekent minstens één niet. Het hoeft niet over alle lampen te gaan.',{category:'negation-scope'})
 ]},
 {name:'Conjunctie (EN)',goal:'EN is alleen waar als beide delen waar zijn.',example:'p ∧ q',lesson:[['Twee voorwaarden.','De poort opent alleen als je een pas hebt én de code klopt.'],['Eén ontbreekt.','Bij p = W en q = V is p ∧ q vals. Eén waar deel volstaat niet.'],['Van woorden naar symbolen.','“p en q” schrijven we als p ∧ q. In een schakeling heet dit AND.']],tasks:[
 predict('Opent de EN-poort?','p∧q',{p:true,q:true},'Beide delen zijn waar; p ∧ q is waar.',{defs:{p:'pas aanwezig',q:'code juist'},visual:'gate'}),
 predict('Voorspel vóór je test.','p∧q',{p:true,q:false},'De code is niet juist. EN vereist beide voorwaarden.',{defs:{p:'pas aanwezig',q:'code juist'},visual:'gate'}),
 predict('Wat als beide signalen ontbreken?','p∧q',{p:false,q:false},'Geen van beide delen is waar; EN is vals.',{visual:'gate'}),
 build('Bouw: de sensor werkt en de accu is niet leeg.','p∧¬q','De regel is p ∧ ¬q: de sensor werkt én de accu is niet leeg.',{defs:{p:'sensor werkt',q:'accu leeg'},transfer:true}),
 choice('Wat maakt een AND-uitgang zeker 0?','Eén invoer is 0. De andere invoer is onbekend.',opts('Niets; je moet beide kennen.','De ene 0 volstaat.','De andere moet 1 zijn.'),'1','Bij AND maakt één 0 het hele resultaat 0.',{category:'and'})
 ]},
 {name:'Disjunctie (OF)',goal:'Logische OF laat ook beide ware delen toe.',example:'p ∨ q',lesson:[['Eén is genoeg.','p ∨ q is waar zodra minstens één deel waar is.'],['Beide mag ook.','Bij W,W is logische OF eveneens waar. Deze OF is inclusief.'],['Alleen V,V faalt.','Wanneer beide delen vals zijn, is ook de OF-uitspraak vals.']],tasks:[
 predict('Voorspel de OF-uitgang.','p∨q',{p:true,q:false},'Eén waar deel is voldoende voor OF.',{visual:'gate'}),
 predict('En als beide waar zijn?','p∨q',{p:true,q:true},'Logische OF betekent minstens één: beide waar is toegestaan.',{visual:'gate',category:'inclusive-or',feedback:'Bij logische OF mag ook W,W. “Precies één” is een andere regel.'}),
 predict('Wat als er geen signaal is?','p∨q',{p:false,q:false},'Beide delen zijn vals; OF is vals.',{visual:'gate'}),
 choice('Vertaal “minstens één back-up werkt”.','p: back-up A werkt. q: back-up B werkt.',opts('p ∧ q','p ∨ q','¬(p ∨ q)'),'1','p ∨ q laat A, B én beide samen toe.',{transfer:true}),
 {type:'multi',prompt:'Welke situaties maken logische OF waar? Kies alle mogelijkheden.',stem:'p ∨ q betekent: minstens één deel is waar.',options:opts('W,W','W,V','V,W','V,V'),correct:['0','1','2'],explanation:'W,W, W,V en V,W maken OF waar. Alleen V,V maakt OF vals.',feedback:'“Minstens één” omvat ook beide waar.',category:'inclusive-or'}
 ]},
 {name:'Formules en schakelingen',goal:'Koppel woorden, formule en schakeling.',example:'¬p ∧ q',lesson:[['Kleine bouwstenen.','Kies links en rechts een uitspraak en plaats EN of OF ertussen.'],['Waar hoort NIET?','¬p ∧ q ontkent alleen p. ¬(p ∧ q) ontkent de hele EN-uitspraak.'],['Test ieder geval.','Eén goede test betekent nog niet dat de regel overal werkt.']],tasks:[
 build('Bouw: p en niet q.','p∧¬q','NIET hoort alleen bij q. De volledige regel is p ∧ ¬q.'),
 build('Bouw: niet p of q.','¬p∨q','¬p ∨ q is waar wanneer p vals is of q waar is.'),
 {type:'circuit',prompt:'Laat de lamp branden als p waar is en q vals.',expr:'p∧¬q',explanation:'p gaat rechtstreeks naar AND; q gaat eerst door NOT.',defs:{p:'sensor actief',q:'storing'}},
 build('Bouw: het is niet zo dat beide lampen branden.','¬(p∧q)','De negatie gaat over beide samen. ¬p ∨ ¬q is ook een juiste vorm.',{defs:{p:'lamp A brandt',q:'lamp B brandt'},transfer:true}),
 {type:'circuit',prompt:'Bouw: p is vals en q is vals.',expr:'¬p∧¬q',explanation:'Beide invoeren gaan door NOT en komen daarna samen in AND.'}
 ]},
 {name:'Waarheidstabellen invullen',goal:'Vul een volledige waarheidstabel zonder een geval over te slaan.',example:'WW · WV · VW · VV',lesson:[['Twee invoeren.','Met twee onafhankelijke proposities zijn er vier waarheidstoekenningen.'],['Werk systematisch.','Houd p eerst waar en wissel q. Houd p daarna vals en wissel q opnieuw.'],['Ieder geval telt.','Een volledige tabel toont de formule voor alle booleaanse invoeren.']],tasks:[
 table('Vul alle vier EN-uitkomsten in.',[col('p∧q')],'Alleen W,W geeft W; de andere drie geven V.'),
 table('Vul alle vier OF-uitkomsten in.',[col('p∨q')],'OF geeft W,W,W,V in deze rijvolgorde.'),
 table('Vul de negatiekolom in.',[col('¬p')],'Bij p = W is ¬p = V; bij p = V is ¬p = W.',{vars:['p','q']}),
 table('Van poort naar tabel: p en niet q.',[col('¬q'),col('p∧¬q')],'De einduitkomst is alleen W bij p = W en q = V.',{transfer:true}),
 choice('Welk geval ontbreekt?','Er zijn al WW, WV en VV.',opts('WW','VW','WV'),'1','VW is het vierde onafhankelijke geval. Herhalen vervangt geen ontbrekende rij.')
 ]},
 {name:'Samengestelde formules',goal:'Bereken samengestelde formules stap voor stap.',example:'(p ∨ q) ∧ ¬r',lesson:[['Eerst het deel.','Bereken wat tussen haakjes staat en wat door NIET wordt ontkend.'],['Daarna verbinden.','Gebruik die deelwaarden als invoer voor de laatste bewerking.'],['Drie invoeren.','Drie onafhankelijke proposities geven acht gevallen. Je ziet telkens vier volledige rijen.']],tasks:[
 predict('Bereken eerst de haakjes.','¬(p∨q)',{p:false,q:true},'p ∨ q is W. De negatie daarvan is V.'),
 table('Vul eerst het deel, dan de eindkolom.',[col('p∨q'),col('¬(p∨q)')],'De negatie keert de hele OF-kolom om.'),
 predict('Bereken de samengestelde regel.','(p∨q)∧¬r',{p:false,q:true,r:false},'p ∨ q is W en ¬r is W; de EN-uitkomst is W.'),
 table('Onderzoek alle acht gevallen.',[col('p∨q'),col('(p∨q)∧¬r')],'De laatste kolom is W als minstens één van p en q waar is én r vals is.',{vars:['p','q','r'],transfer:true}),
 choice('Waar zit de eerste fout?','p = V, q = W. Een leerling rekent: p ∨ q = V; daarna ¬(p ∨ q) = W.',opts('De OF-stap.','Alleen de NIET-stap.','Er is geen fout.'),'0','V ∨ W is W. De negatie van die juiste deelwaarde is V.',{category:'intermediate'})
 ]},
 {name:'Logische gelijkwaardigheid',goal:'Vergelijk formules over alle gevallen.',example:'p ≡ (p ∧ q) ∨ p',lesson:[['Een ander uiterlijk.','Twee formules kunnen dezelfde uitkomst geven bij elke invoer.'],['Eén verschil volstaat.','Vind je één waarheidstoekenning met andere uitkomsten, dan zijn ze niet gelijkwaardig.'],['Overeenkomst vraagt alles.','Eén gelijke uitkomst bewijst geen logische gelijkwaardigheid.']],tasks:[
 difference('Vind een verschil tussen EN en OF.','p∧q','p∨q','W,V en V,W maken EN vals en OF waar.'),
 table('Vergelijk beide regels in alle vier gevallen.',[col('p'),col('(p∧q)∨p')],'Beide eindkolommen zijn gelijk: (p ∧ q) ∨ p is logisch gelijkwaardig met p.',{vars:['p','q']}),
 difference('Zijn deze negaties hetzelfde? Zoek een verschil.','¬(p∨q)','¬p∨q','Bij p = V en q = W geeft links V en rechts W. Er zijn ook andere onderscheidende gevallen.'),
 choice('Is dit bewijs voldoende?','Twee regels geven bij p = W, q = W dezelfde uitkomst.',opts('Ja, ze zijn gelijkwaardig.','Nee, de andere gevallen moeten nog gecontroleerd worden.','Ze zijn dus verschillend.'),'1','Eén overeenkomst zegt niets over de nog niet onderzochte gevallen.',{transfer:true,category:'single-case'}),
 choice('Vergelijk de regels.','(p ∨ q) ∧ p en p.',opts('Logisch gelijkwaardig.','Alleen gelijk als q waar is.','Nooit gelijk.'),'0','Bij p = V zijn beide V. Bij p = W is p ∨ q zeker W en zijn beide W.')
 ]},
 {name:'Wetten van De Morgan',goal:'Verdeel de negatie over de hele EN- of OF-uitspraak.',example:'¬(p ∨ q) ≡ ¬p ∧ ¬q',lesson:[['Niet één van beide.','¬(p ∨ q) betekent: p vals én q vals.'],['Niet beide samen.','¬(p ∧ q) betekent: p vals óf q vals; beide vals mag ook.'],['De regel.','Negeren van een geheel keert EN en OF om en negeert elk deel.']],tasks:[
 build('Schrijf zonder NIET rond de hele formule: ¬(p ∨ q).','¬p∧¬q','NIET OF wordt EN van twee negaties.',{requireInnerNegation:true}),
 build('Schrijf zonder NIET rond de hele formule: ¬(p ∧ q).','¬p∨¬q','NIET EN wordt OF van twee negaties.',{requireInnerNegation:true}),
 difference('Vind een geval dat dit foute herstel ontmaskert.','¬(p∧q)','¬p∧¬q','Bij precies één waar deel is links W en rechts V.'),
 choice('Ontken de hele afspraakzin.','“De fiets staat buiten en het slot is dicht.”',opts('De fiets staat niet buiten of het slot is niet dicht.','De fiets staat niet buiten en het slot is niet dicht.','De fiets staat buiten of het slot is dicht.'),'0','Niet beide betekent minstens één deel niet. Dat is De Morgan voor EN.',{transfer:true}),
 table('Controleer De Morgan over alle gevallen.',[col('¬(p∨q)'),col('¬p∧¬q')],'Alle vier rijen zijn gelijk; beide formules zijn alleen W bij V,V.')
 ]},
 {name:'Tautologie en contradictie',goal:'Onderscheid tautologie, contradictie en contingent resultaat.',example:'p ∨ ¬p · p ∧ ¬p',lesson:[['Altijd waar.','Een tautologie is waar bij elke waarheidstoekenning.'],['Nooit waar.','Een contradictie is vals bij elke waarheidstoekenning.'],['Soms waar.','Een contingente formule heeft zowel ware als valse gevallen.']],tasks:[
 classify('p∨¬p','Dit is een tautologie: p of zijn negatie is altijd waar.'),
 classify('p∧¬p','Dit is een contradictie: p en zijn negatie kunnen niet tegelijk waar zijn.'),
 classify('p∧q','EN is soms waar: alleen bij W,W.'),
 classify('(p∧q)∧(¬p∨¬q)','Als p en q allebei waar zijn, is ¬p ∨ ¬q vals. De hele formule is dus altijd vals.',{transfer:true}),
 classify('(p∨q)∨¬p','Bij p = W is p ∨ q waar. Bij p = V is ¬p waar. De hele formule is dus altijd waar.')
 ]},
 {name:'Implicatie',goal:'Implicatie is alleen vals bij W ⇒ V.',example:'p ⇒ q',lesson:[['Twee feiten.','Als een pakket dringend is, wordt het vandaag bezorgd. p: dringend; q: vandaag bezorgd.'],['De overtreding.','Alleen een dringend pakket dat vandaag niet wordt bezorgd breekt de afspraak: W ⇒ V.'],['Niet dringend.','Dan zegt deze afspraak niets over bezorgen vandaag. De formule is W omdat deze situatie de afspraak niet overtreedt.']],tasks:[
 predict('Is de afspraak in dit geval overtreden? Kies de waarde van de implicatie.','p⇒q',{p:true,q:false},'Dringend en niet vandaag bezorgd: de afspraak wordt overtreden, dus de implicatie is V.',{defs:{p:'dringend',q:'vandaag bezorgd'},visual:'monitor'}),
 predict('Beoordeel de afspraak.','p⇒q',{p:false,q:true},'Niet dringend en toch bezorgd overtreedt de afspraak niet. p ⇒ q is W.',{defs:{p:'dringend',q:'vandaag bezorgd'},visual:'monitor',category:'implication-false-premise'}),
 predict('Ook wanneer beide feiten vals zijn.','p⇒q',{p:false,q:false},'De voorwaarde geldt niet. Deze situatie overtreedt de afspraak niet; de formule is W.',{visual:'monitor'}),
 table('Vul de volledige implicatietabel in.',[col('p⇒q')],'De uitkomsten zijn W,V,W,W. Alleen W ⇒ V is vals.',{transfer:true}),
 choice('Welke uitspraak klopt?','De formule p ⇒ q is waar.',opts('q is dus altijd waar.','p kan niet vals zijn.','q kan vals zijn, als p ook vals is.'),'2','De waarde van een implicatie is niet hetzelfde als de waarde van haar gevolg.',{category:'formula-vs-conclusion'})
 ]},
 {name:'Tegenvoorbeelden',goal:'Maak de voorwaarde waar en het gevolg vals.',example:'p = W · q = V',lesson:[['Een algemene claim.','“Elk veelvoud van 4 is een veelvoud van 8.” Zoek één geval waarin dit niet klopt.'],['Twee controles.','Je getal moet wel een veelvoud van 4 zijn, maar geen veelvoud van 8. Bijvoorbeeld 12.'],['Tests en bewijs.','Eén geldig tegenvoorbeeld weerlegt een algemene claim. Een paar geslaagde tests bewijzen haar niet.']],tasks:[
 counter('Weerleg: elk veelvoud van 4 is een veelvoud van 8.','p','q',[2,4,8,12],{2:{p:false,q:false},4:{p:true,q:false},8:{p:true,q:true},12:{p:true,q:false}},'4 en 12 zijn geldige tegenvoorbeelden: de voorwaarde is W en het gevolg V.',{defs:{p:'veelvoud van 4',q:'veelvoud van 8'}}),
 counter('Weerleg: elk oneven positief geheel getal is priem.','p','q',[2,3,9,15],{2:{p:false,q:true},3:{p:true,q:true},9:{p:true,q:false},15:{p:true,q:false}},'9 en 15 zijn oneven maar niet priem. Beide weerleggen de claim.',{defs:{p:'oneven',q:'priem'}}),
 choice('Waarom is 6 geen tegenvoorbeeld?','Claim: elk veelvoud van 4 is een veelvoud van 8.',opts('6 voldoet niet aan de voorwaarde.','6 voldoet aan het gevolg.','Een tegenvoorbeeld moet groter dan 8 zijn.'),'0','6 is geen veelvoud van 4. Het kan de claim over veelvouden van 4 niet weerleggen.'),
 counter('Weerleg: x² > 4 ⇒ x > 2, voor gehele x.','p','q',[-3,-2,0,3],{'-3':{p:true,q:false},'-2':{p:false,q:false},0:{p:false,q:false},3:{p:true,q:true}},'Bij x = −3 is x² = 9 > 4, maar x > 2 is vals.',{defs:{p:'x² > 4',q:'x > 2'},transfer:true}),
 choice('Wat volgt uit deze tests?','Voor x = 8, 16 en 24 klopt “veelvoud van 4 ⇒ veelvoud van 8”.',opts('De claim is bewezen voor alle getallen.','Alleen deze drie gevallen zijn gecontroleerd.','Er bestaat geen tegenvoorbeeld.'),'1','Drie geslaagde tests bewijzen geen algemene getallenclaim.',{category:'example-vs-proof'})
 ]},
 {name:'Omgekeerde en contrapositie',goal:'Gebruik contrapositie zonder de regel zomaar om te keren.',example:'p ⇒ q ≡ ¬q ⇒ ¬p',lesson:[['Een geldige regel.','Als p ⇒ q gegeven en geldig is, volgt uit p dat q waar is.'],['Contrapositie.','Als q vals is, moet p ook vals zijn. Anders krijg je de verboden combinatie W,V.'],['Niet zomaar omkeren.','q ⇒ p volgt niet uit p ⇒ q. Het gevolg kan ook zonder deze voorwaarde voorkomen.']],tasks:[
 build('Bouw de contrapositie van p ⇒ q.','¬q⇒¬p','Wissel de delen van plaats en ontken beide: ¬q ⇒ ¬p.',{requiredForm:'contraposition'}),
 choice('Wat kun je uit q = W afleiden?','Gegeven: de regel p ⇒ q is geldig.',opts('p is zeker W.','p is zeker V.','p is niet bepaald door deze gegevens.'),'2','Zowel p = W als p = V is verenigbaar met een geldige regel en q = W.',{category:'converse',feedback:'Het gevolg kan voorkomen met of zonder de voorwaarde. Bekijk W,W én V,W.'}),
 choice('Wat volgt uit q = V?','Gegeven: de regel p ⇒ q is geldig.',opts('p = V','p = W','Niets over p'),'0','p kan niet W zijn, want W ⇒ V zou de geldige regel overtreden.'),
 build('Bouw de contrapositie: deelbaar door 6 ⇒ deelbaar door 3.','¬q⇒¬p','Niet deelbaar door 3 ⇒ niet deelbaar door 6.',{defs:{p:'deelbaar door 6',q:'deelbaar door 3'},transfer:true,requiredForm:'contraposition'}),
 difference('Vind waarom de omgekeerde regel niet volgt.','p⇒q','q⇒p','W,V en V,W onderscheiden de richtingen. Bij V,W is de oorspronkelijke regel W en de omgekeerde V.')
 ]},
 {name:'Nodige en voldoende voorwaarden',goal:'Benoem steeds waarvoor een voorwaarde nodig of voldoende is.',example:'p ⇒ q: p volstaat voor q',lesson:[['Voldoende.','p is voldoende voor q: als p geldt, krijg je gegarandeerd q.'],['Nodig.','q is nodig voor p: zonder q kan p niet gelden.'],['Twee richtingen.','Bij een equivalentie is elke kant zowel nodig als voldoende voor de andere.']],tasks:[
 choice('p is welke voorwaarde voor q?','Gegeven: p ⇒ q is een geldige regel. Alleen deze richting is gegeven.',opts('Voldoende.','Nodig.','Zeker beide.'),'0','p volstaat voor q. De omgekeerde richting is niet gegeven.'),
 choice('q is welke voorwaarde voor p?','Gegeven: p ⇒ q is een geldige regel. Alleen deze richting is gegeven.',opts('Voldoende.','Nodig.','Geen van beide.'),'1','Zonder q kan p niet gelden. Dus q is nodig voor p.'),
 choice('Deelbaar door 12 is … voor deelbaar door 6.','Domein: positieve gehele getallen.',opts('Nodig maar niet voldoende.','Voldoende maar niet nodig.','Nodig en voldoende.'),'1','Een veelvoud van 12 is een veelvoud van 6. Maar 6 is deelbaar door 6 en niet door 12.'),
 choice('Even zijn is … voor deelbaar door 2.','Domein: gehele getallen.',opts('Alleen nodig.','Alleen voldoende.','Nodig en voldoende.'),'2','Voor gehele getallen betekenen “even” en “deelbaar door 2” hetzelfde.',{transfer:true}),
 choice('“Vierhoek” is … voor “vierkant”.','Domein: vlakke figuren.',opts('Nodig maar niet voldoende.','Voldoende maar niet nodig.','Nodig en voldoende.'),'0','Elk vierkant is een vierhoek. Een vierhoek hoeft geen vierkant te zijn.')
 ]},
 {name:'Equivalentie',goal:'Equivalentie vraagt twee gelijke waarheidswaarden.',example:'p ⇔ q',lesson:[['Heen en terug.','p ⇔ q betekent (p ⇒ q) ∧ (q ⇒ p). Beide richtingen moeten kloppen.'],['Gelijke waarden.','W,W én V,V maken de equivalentie waar. Verschillende waarden maken haar vals.'],['Twee begrippen.','p ⇔ q heeft een waarde per situatie. Logische gelijkwaardigheid van formules gaat over álle situaties.']],tasks:[
 predict('Bereken de equivalentie.','p⇔q',{p:true,q:true},'Beide waar: de equivalentie is W.'),
 predict('En als beide vals zijn?','p⇔q',{p:false,q:false},'Ook twee valse delen geven een ware equivalentie.',{category:'equivalence-00'}),
 table('Vul de equivalentietabel in.',[col('p⇔q')],'De uitkomsten zijn W,V,V,W: gelijke waarden geven W.'),
 choice('Welke formule past bij “als en slechts als”?','De locker opent als en slechts als de pas geldig is.',opts('p ⇒ q','q ⇒ p','p ⇔ q'),'2','“Als en slechts als” geeft beide richtingen.',{defs:{p:'locker opent',q:'pas geldig'},transfer:true}),
 table('Vergelijk de twee schrijfwijzen.',[col('p⇔q'),col('(p⇒q)∧(q⇒p)','heen én terug')],'Voor alle vier rijen zijn de kolommen gelijk.')
 ]},
 {name:'Wiskundige redeneringen',goal:'Pas logica toe met een expliciet wiskundig domein.',example:'even ⇔ deelbaar door 2',lesson:[['Noem het domein.','Een claim gaat bijvoorbeeld over gehele getallen of vlakke driehoeken.'],['Een gevolg testen.','“Deelbaar door 10 ⇒ deelbaar door 5” klopt omdat 10k = 5 · (2k).'],['Bewijzen met contrapositie.','Voor geheel n: als n even is, dan is n² even. Daaruit volgt: n² oneven ⇒ n oneven.']],tasks:[
 choice('Welke algemene redenering bewijst de regel?','Voor geheel n: deelbaar door 10 ⇒ deelbaar door 5.',opts('10, 20 en 30 zijn deelbaar door 5.','n = 10k = 5 · (2k), met k geheel.','Alle getallen zijn deelbaar door 5.'),'1','De vorm 5 · (2k) geldt voor elk geheel veelvoud van 10; dit is een algemene redenering.'),
 counter('Weerleg: elk priemgetal is oneven.','p','q',[2,3,4,9],{2:{p:true,q:false},3:{p:true,q:true},4:{p:false,q:false},9:{p:false,q:true}},'2 is priem maar niet oneven.',{defs:{p:'priem',q:'oneven'}}),
 choice('Beoordeel de redenering.','In een vlakke driehoek zijn twee hoeken 80°. Dus de derde is 20° en de driehoek is gelijkbenig.',opts('Geldig: gelijke hoeken geven gelijke overstaande zijden.','Ongeldig: alle hoeken moeten gelijk zijn.','Alleen geldig in een rechthoekige driehoek.'),'0','De twee gelijke hoeken leveren twee gelijke overstaande zijden.'),
 choice('Welke contrapositie hoort bij de claim?','Voor geheel n: n² oneven ⇒ n oneven.',opts('n even ⇒ n² even','n oneven ⇒ n² oneven','n² even ⇒ n even'),'0','De contrapositie verwisselt beide delen en ontkent ze. Bij gehele getallen is niet oneven hetzelfde als even.',{transfer:true}),
 choice('Vervolledig het bewijs met contrapositie.','Geheel n = 2k. Dan is n² = …',opts('2k², dus oneven.','4k² = 2 · (2k²), dus even.','4k, dus altijd priem.'),'1','n² is tweemaal een geheel getal, dus even. Daarmee is de contrapositie bewezen.')
 ]},
 {name:'Redeneringen toetsen',goal:'Beoordeel regels samen en verantwoorde conclusies.',example:'p, p ⇒ q ⟹ q',lesson:[['Alle regels tegelijk.','Een kandidaat moet aan elke gegeven regel voldoen.'],['Zeker of mogelijk?','Een conclusie is zeker als zij geldt in alle toegelaten situaties. Soms blijft meer dan één situatie over.'],['Een compact dossier.','Test de mogelijkheden systematisch en gebruik één geldig geval om een onterechte conclusie te weerleggen.']],tasks:[
 choice('Welke conclusie is zeker?','Gegeven: p ⇒ q en q ⇒ r zijn geldig. p is waar.',opts('r is waar.','r is vals.','r is niet bepaald.'),'0','Uit p volgt q. Uit q volgt r. Dit is een geldige keten.'),
 choice('Welke conclusie is verantwoord?','Gegeven: p ⇒ q is geldig. q is waar.',opts('p is zeker waar.','p is zeker vals.','p kan waar of vals zijn.'),'2','W,W en V,W zijn beide toegelaten. Je kunt p dus niet bepalen.'),
 classify('(p∧(p⇒q))⇒q','Dit is modus ponens. Als p en p ⇒ q waar zijn, is q waar. In andere gevallen is de buitenste voorwaarde vals; de formule blijft W.'),
 {type:'puzzle',prompt:'Wie heeft de reservemodule? Precies één robot heeft haar; precies twee uitspraken zijn waar.',stem:'Noor: “Ilias of Mei heeft haar.” Ilias: “Noor heeft haar niet.” Mei: “Ilias heeft haar niet.”',defs:{p:'Noor heeft de module',q:'Ilias heeft de module',r:'Mei heeft de module'},rules:['q∨r','¬p','¬q'],ruleNames:['Noor','Ilias','Mei'],trueCount:2,candidates:[{id:'noor',label:'Noor',env:{p:true,q:false,r:false}},{id:'ilias',label:'Ilias',env:{p:false,q:true,r:false}},{id:'mei',label:'Mei',env:{p:false,q:false,r:true}}],explanation:'Bij Ilias zijn Noors en Ilias’ uitspraken waar en Mei’s uitspraak vals. Bij Noor is er één ware uitspraak; bij Mei drie.',transfer:true},
 choice('Klopt deze conclusie?','Geldig: p ⇒ ¬q en q ⇒ r. Iemand besluit: ¬r ⇒ p.',opts('Ja, de regels bewijzen het.','Nee. p = V, q = V, r = V is een tegenvoorbeeld.','Nee. p = W, q = V, r = V is een tegenvoorbeeld.'),'1','Bij V,V,V zijn beide gegeven regels W, maar ¬r ⇒ p is V. Dus de conclusie volgt niet.',{category:'invalid-inference'})
 ]}
];
stops.forEach((s,i)=>{s.id=i;s.district=districts.findIndex(d=>d.stops.includes(i));s.tasks.forEach((t,j)=>{t.id='L'+String(i+1).padStart(2,'0')+'-'+(j+1);t.skill=i;t.hint=t.hint||s.lesson[1][1];t.role=j===0?'instap':j===3?'transfer':j===4?'gemengd':'zelfstandig';});});
const bonus=[
 predict('Voorspel NAND: AND gevolgd door NOT.','¬(p∧q)',{p:true,q:true},'AND geeft 1; NOT keert dat om naar 0. De NAND-uitgang is V.'),
 table('Vul de NAND-tabel in.',[col('p∧q','AND'),col('¬(p∧q)','NAND')],'NAND keert de AND-kolom om: V,W,W,W.',{transfer:true}),
 {type:'circuit',prompt:'Bouw een NOR-regel: OR gevolgd door NOT.',expr:'¬(p∨q)',explanation:'NOR is OR gevolgd door NOT; de uitgang is alleen 1 bij 0,0.',allowDerived:true,transfer:true},
 {type:'multi',prompt:'Welke poorten passen bij deze ene rij? Kies alle mogelijkheden.',stem:'Invoer 0,0 geeft uitgang 0.',options:opts('AND','OR','NAND','NOR'),correct:['0','1'],explanation:'Zowel AND als OR geeft 0 bij 0,0. Deze ene rij onderscheidt ze nog niet.',feedback:'NAND is NIET AND; NOR is NIET OR. Bereken iedere uitgang bij 0,0.'}
];
bonus.forEach((t,i)=>{t.id='B-POORT-'+(i+1);t.skill=5;t.role='verdieping';t.bonus=true;t.hint='NAND is AND gevolgd door NOT. NOR is OR gevolgd door NOT. Bereken eerst AND of OR en keer de uitkomst dan om.';});
return {districts,stops,bonus,tasks:[...stops.flatMap(s=>s.tasks),...bonus],version:'0.2.0'};
});
