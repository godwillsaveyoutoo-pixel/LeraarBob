/* Read-only interpretation of the trainers' own learning models. No database calls. */
(function(root){
'use strict';
const V=typeof module!=='undefined'&&module.exports?require('../games/vectoren/vector-core.js'):root.VectorTrainerCore;
const R=typeof module!=='undefined'&&module.exports?require('../games/reele-getallen/real-core.js'):root.RealNumbersCore;
const configs={
 'vectoren-trainer':{key:'axioma-vectorentrainer-v020',version:2,skills:V.TaskGenerator.skills,sanitize:V.TrainerScheduler.sanitize},
 'reele-getallen-trainer':{key:'axioma-real-numbers-v1',version:1,skills:R.skills,sanitize:R.Progress.sanitize}
};
const common={
 help:['Uitleg geraadpleegd','Laat later een vergelijkbare opgave zelfstandig oplossen.'],
 practice:['Opnieuw zelfstandig oefenen','Deze opgave is niet zelfstandig afgerond; er is geen specifieke foutdiagnose bewaard.']
};
const vectorErrors={
 xy:['Componenten verwisseld','Laat eerst de horizontale en daarna de verticale verplaatsing aanwijzen.'],
 ba:['Begin- en eindpunt verwisseld','Controleer: eindpunt min beginpunt.'],
 opposite:['Zin omgekeerd','Vergelijk de kant waarnaar de pijlpunt wijst.'],
 'one-component':['Slechts één component vermenigvuldigd','Pas dezelfde factor op beide componenten toe.'],
 scale:['Lengte of factor klopt niet','Controleer de grootte en het teken van de factor.'],
 sign:['Teken of component klopt niet','Vergelijk beide verplaatsingen afzonderlijk.'],
 direction:['Verplaatsing klopt niet','Laat horizontale en verticale verplaatsing vergelijken.'],
 start:['Verkeerd beginpunt','De pijl moet vanuit het gevraagde punt vertrekken.'],
 property:['Verkeerde eigenschap veranderd','Onderscheid lengte, richting en zin.'],
 components:['Componenten ontbreken','Construeer één component volgens elke gegeven richting.'],
 'component-direction':['Verkeerde ontbindingsrichting','Laat de twee gegeven richtingen aanwijzen.'],
 'component-sum':['Som van componenten klopt niet','Controleer de totale verplaatsing met kop-staart.'],
 routes:['Beide routes nog niet getoond','Vergelijk de constructie in beide volgordes.'],
 parallelogram:['Parallellogramconstructie onvolledig','Controleer de evenwijdige kopieën en de diagonaal.'],
 resultant:['Resultante ontbreekt of klopt niet','Verbind het eerste beginpunt met het laatste eindpunt.'],
 order:['Gevraagde volgorde niet gevolgd','De som kan kloppen terwijl de gevraagde constructievolgorde verschilt.'],
 headtail:['Pijlen sluiten niet kop-staart aan','Laat de volgende staart aan de vorige kop leggen.'],
 route:['Constructieroute klopt niet','Controleer de losse vectoren en hun aansluiting.'],
 point:['Punt verkeerd geplaatst','Onderscheid de plaats van een punt en een verplaatsing.']
};
const realErrors={
 value:['Breukwaarde klopt niet','Verbind de breuk met de gegeven decimaal of het procent.'],
 simplify:['Breuk nog niet vereenvoudigd','De waarde klopt; deel teller en noemer door dezelfde factor.'],
 order:['Getallen verkeerd vergeleken','Vergelijk de waarden, ook bij negatieve getallen.'],
 scale:['Schaal op de getallijn verkeerd gelezen','Laat de stapgrootte en het nulpunt aanwijzen.'],
 equivalence:['Ongelijke waarden gegroepeerd','Laat de betrokken schrijfwijzen naar dezelfde waarde omzetten.'],
 squares:['Naburige machten niet gevonden','Herhaal bekende kwadraten of derdemachten.'],
 'root-bounds':['Wortelwaarde verkeerd begrensd','Controleer de gehele grenzen met hun kwadraat of derde macht.'],
 'root-real':['Reële wortelwaarde verkeerd beoordeeld','Onderscheid een minteken vóór de wortel en onder het wortelteken.'],
 'root-value':['Wortel verkeerd berekend','Controleer met de bijbehorende macht; √(a²) is |a|.'],
 'root-factor':['Factor verkeerd buiten de wortel gebracht','Neem de wortel van de uitgehaalde kwadraat- of derdemachtsfactor.'],
 'root-simplify':['Nog verder buiten de wortel brengen','De waarde klopt; zoek een grotere volledige macht als factor.'],
 'root-coefficient':['Breuk vóór de wortel nog vereenvoudigen','De wortelvorm klopt; vereenvoudig ook de breukfactor.'],
 'bounds-order':['Intervalgrenzen verwisseld','De linkergrens moet kleiner zijn dan de rechtergrens.'],
 bounds:['Verkeerde intervalgrenzen','Controleer grenswaarden en de onbegrensde kant.'],
 inclusion:['Open en gesloten grens verward','Verbind < en > met open; ≤ en ≥ met gesloten grenzen.'],
 sets:['Getallenverzameling verkeerd gekozen','Bereken eerst de waarde en gebruik de insluiting van de verzamelingen.'],
 'decimal-type':['Soort decimaal verkeerd herkend','Onderscheid eindig, zuiver/gemengd repeterend en irrationaal.'],
 period:['Herhaalblok verkeerd gekozen','Zoek het kortste blok en onderscheid de vaste aanloop.']
};
function errorInfo(gameId,code){const errors=gameId==='vectoren-trainer'?vectorErrors:realErrors,pair=Object.hasOwn(common,code)?common[code]:Object.hasOwn(errors,code)?errors[code]:null;return pair?{label:pair[0],advice:pair[1]}:{label:'Aandachtspunt zonder herkenbare diagnose',advice:'Bekijk samen een nieuwe opgave van deze vaardigheid.'}}
const phaseNames={locked:'Later in de leerroute',new:'Klaar om te starten',guided:'Begeleid oefenen',learning:'In opbouw',solid:'Stevig'};
function read(gameId,row){
 const config=Object.hasOwn(configs,gameId)?configs[gameId]:null;if(!config)return null;
 let stored;try{const value=row?.state?.storage?.[config.key];stored=typeof value==='string'?JSON.parse(value):value;}catch{}
 if(!stored?.progress||stored.progress.version!==config.version)return {available:false,message:row?'Geen leesbare vaardigheidsdetails in deze opgeslagen versie.':'Nog geen opgeslagen oefeningen.'};
 const vector=gameId==='vectoren-trainer',p=config.sanitize(stored.progress),labels=Object.fromEntries(config.skills.map(s=>[s.id,s.label||s.short]));
 const unlocked=vector?V.TrainerScheduler.unlocked(p):null;
 const repairs=vector?p.repairs:config.skills.filter(s=>p.skills[s.id].repair).map(s=>({skill:s.id,code:p.skills[s.id].repair,due:p.skills[s.id].due,stage:0}));
 const skillRows=config.skills.map(s=>{
  const d=p.skills[s.id],phase=vector?V.TrainerScheduler.phase(p,s.id):R.Progress.mastered(p,s.id)?'solid':d.seen?'learning':R.Progress.unlocked(p,s.id)?'new':'locked';
  const repair=repairs.find(r=>r.skill===s.id),eligible=vector?unlocked.includes(s.id):R.Progress.unlocked(p,s.id);
  const due=repair?.due??(vector&&d.clean>=3?d.due:null),remaining=due===null?null:Math.max(0,due-p.total);
  const review=due===null?'Geen vaste herhaling gepland':!eligible?'Na de voorafgaande vaardigheden':remaining?`Na nog ${remaining} ${remaining===1?'opgave':'opgaven'}`:'Beschikbaar voor herhaling';
  return {id:s.id,label:labels[s.id],phase,status:phaseNames[phase],seen:d.seen,clean:Math.min(d.clean,d.seen),recent:d.recent,review,repair:!!repair,strength:vector?Math.round(d.strength*100):null,lastAt:vector?d.lastAt:null,lastIndex:vector?d.lastIndex:d.last,reviewClean:vector?null:d.reviewClean};
 });
 const attention=repairs.map(r=>({skill:r.skill,label:labels[r.skill],...errorInfo(gameId,r.code),skillLabel:labels[r.skill],code:r.code,review:skillRows.find(s=>s.id===r.skill).review,stage:vector&&r.stage===1?'Eerste herstelvraag zelfstandig gelukt; latere controle volgt.':null}));
 const draft=stored.draft&&Object.hasOwn(labels,stored.draft.skill)?stored.draft:null;
 const done=vector?draft?.done:draft?.phase==='done';
 const current=draft?{skillLabel:labels[draft.skill],status:done?'Opgave afgerond':(vector?draft.intro:draft.phase==='intro')?'Uitleg bekijken':draft.dirty?'Bezig met verbeteren of hulp':'Opgave in uitvoering',free:vector&&draft.free===true}:null;
 if(draft&&!done&&draft.dirty&&draft.errorCode&&!['input','empty'].includes(draft.errorCode)&&!attention.some(r=>r.skill===draft.skill&&r.code===draft.errorCode))attention.unshift({skill:draft.skill,skillLabel:labels[draft.skill],code:draft.errorCode,...errorInfo(gameId,draft.errorCode),review:draft.free?'Losse oefening, buiten de leerroute':'In de lopende oefening',stage:null});
 const activities=p.activity.slice().reverse().map(e=>({...e,skillLabel:labels[e.skill],label:{independent:'Zelfstandig opgelost',supported:'Opgelost na hulp of verbetering',skipped:'Overgeslagen'}[e.outcome],error:e.code?errorInfo(gameId,e.code):null}));
 const recentSkills=skillRows.filter(s=>s.seen>0).sort((a,b)=>b.lastIndex-a.lastIndex).slice(0,6);
 return {available:true,total:p.total,xp:p.xp,sessions:p.sessions,skillCount:skillRows.length,solid:skillRows.filter(s=>s.phase==='solid').length,independent:skillRows.reduce((n,s)=>n+s.clean,0),skills:skillRows,attention,activities,recentSkills,current,updatedAt:row.updated_at||null,historyIncomplete:p.total>activities.length};
}
const api={read,errorInfo};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.LeraarBobTrainerDetails=api;
})(typeof globalThis!=='undefined'?globalThis:this);
