/* Presentation catalog. IDs mirror skills.json; this module never awards mastery. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../../trainer/wave-core.js'),require('../scheduler-adapter.js'));else root.RechtenV2Areas=factory(root.RechtenWave,root.RechtenV2Scheduler)})(globalThis,function(W,P){
'use strict';
const node=(id,name,label,x,y,extra={})=>({key:id,id,name,label,x,y,...extra});
const areas={
 puntenbaai:{name:'Puntenbaai',caption:'Coördinaten en punten',intro:'Vind je plek. Zet je eerste punt.',art:'puntenbaai',zones:[{id:'route',name:'Rond de baai',nodes:[
  node('point','Coördinaten aflezen','Coördinaten<br>aflezen',30,48,{playable:true}),
  node('point_plot','Punt plaatsen','Punt<br>plaatsen',70,32,{playable:true})
 ]}]},
 hellingrug:{name:'Hellingrug',caption:'Richting en helling',intro:'Van basisverschil tot bergtop.',art:'hellingrug',zones:[{id:'route',name:'De klimroute',nodes:[
  node('delta','Δx en Δy','Δx en Δy',17,64,{playable:true}),
  node('slope','Helling uit Δy / Δx','Helling uit<br>Δy / Δx',36,46,{playable:true}),
  node('slope_from_two_points','Helling uit twee punten','Helling uit<br>twee punten',55,25,{playable:true}),
  node('line_behavior','Stijgend, dalend of constant','Stijgend, dalend<br>of constant',74,55,{playable:true}),
  node('special_lines','Bijzondere rechten','Bijzondere<br>rechten',86,18,{playable:true})
 ]}]},
 signaalstad:{name:'Signaalstad',caption:'Functies, grafieken en tabellen',intro:'Volg het signaal. Lees en controleer.',art:'signaalstad',zones:[{id:'route',name:'Het signaalnetwerk',nodes:[
  node('intercept','y-afsnede b aflezen','y-afsnede b<br>aflezen',18,21),
  node('ab','a en b herkennen','a en b<br>herkennen',39,21),
  node('fx','Functiewaarde f(x)','Functiewaarde<br>f(x)',61,21),
  node('table','Tabel aanvullen','Tabel<br>aanvullen',82,21),
  node('input_from_output','Welke x hoort bij deze functiewaarde?','Welke x bij<br>deze f(x)?',72,65),
  node('point_on_line','Ligt dit punt op de rechte?','Punt op<br>de rechte?',49,65),
  node('graph_from_table','Rechte tekenen uit een tabel','Rechte tekenen<br>uit tabel',27,65)
 ]}]},
 formulewerf:{name:'Formulewerf',caption:'Voorschriften en representaties',intro:'Van de basisvorm naar zelf afleiden.',art:'formulewerf',zones:[{id:'bouwen',badge:'A',name:'Voorschrift en grafiek',intro:'Gebruik en herken de basisvorm y = ax + b. Daarna leid je zelf voorschriften af in werkplaats B.',nodes:[
  node('equation_from_ab','Voorschrift uit a en b','Voorschrift<br>uit a en b',24,25),
  node('graph_from_equation','Rechte uit voorschrift','Rechte uit<br>voorschrift',76,25),
  node('equation_from_graph','Voorschrift uit grafiek','Voorschrift<br>uit grafiek',68,62,{entryPolicy:Object.freeze({difficultyLayers:Object.freeze([0,1]),readableSlope:true,visibleIntercept:true,requiresInterceptFromArbitraryPoint:false,requiresExtendedTwoPointCalculation:false})}),
  node('rewrite_linear_equation','Schrijf de vergelijking in de vorm y = ax + b','Schrijf de vergelijking<br>in de vorm<br>y = ax + b',32,58)
 ]},{id:'omzetten',badge:'B',name:'Zelf een voorschrift bepalen',intro:'Van de basisvorm naar zelf afleiden: eerst de parameters, daarna een volledig voorschrift en een context.',nodes:[
  node('intercept_from_point','b uit helling en punt','b uit helling<br>en punt',24,25),
  node('equation_from_point_slope','Voorschrift uit helling en punt','Voorschrift uit<br>helling en punt',50,25),
  node('equation_from_two_points','Voorschrift uit twee punten','Voorschrift uit<br>twee punten',76,24),
  node('equation_from_table','Voorschrift uit tabel','Voorschrift<br>uit tabel',68,63),
  node('equation_from_context','Voorschrift uit context','Voorschrift<br>uit context',32,63,{culmination:true})
 ]}]},
 grenspas:{name:'Grenspas',caption:'Nulwaarden en tekens',intro:'Vind de grens. Ontdek het juiste gebied.',art:'grenspas',zones:[{id:'route',name:'De grensroute',nodes:[
  node('zeroRead','Nulwaarde aflezen','Nulwaarde<br>aflezen',28,24),
  node('zero','Nulwaarde berekenen','Nulwaarde<br>berekenen',28,70),
  node('sign','Wanneer is f(x) > 0?','Wanneer is<br>f(x) &gt; 0?',51,47,{key:'positive',variant:'positive',playable:true}),
  node('sign','Wanneer is f(x) < 0?','Wanneer is<br>f(x) &lt; 0?',75,25,{key:'negative',variant:'negative'}),
  node('signchart','Tekenschema','Tekenschema',82,70)
 ]}]}
};
for(const a of Object.values(areas)){let i=0;for(const z of a.zones){for(const n of z.nodes){n.number=++i;Object.freeze(n)}Object.freeze(z.nodes);Object.freeze(z)}Object.freeze(a.zones);Object.freeze(a)}Object.freeze(areas);
const canonical=id=>id==='puntbaai'?'puntenbaai':id;
const has=id=>Object.hasOwn(areas,canonical(id));
const get=id=>has(id)?areas[canonical(id)]:areas.grenspas;
const all=a=>a.zones.flatMap(z=>z.nodes);
function selection(state){const shell=state.settings?.shell||{},id=has(shell.area)?canonical(shell.area):'grenspas',area=get(id),zone=(id==='formulewerf'&&area.zones.find(z=>z.nodes.some(n=>n.key===shell.stop)))||area.zones.find(z=>z.id===shell.zone)||area.zones[0],stop=zone.nodes.find(n=>n.key===shell.stop);return {id,area,zone,stop}}
function positiveDone(state){const m=state.missions?.grenspas;return !!m?.completed||!!m?.completion?.some(c=>c.variant===0||c.variant===1)||!!state.events?.some(e=>e.skill==='sign'&&e.correct&&((e.variant===0&&e.attemptId?.startsWith('symbol:'))||(e.variant===1&&e.phase==='transfer')))}
function statuses(state,id,legacy){
 const a=get(id),nodes=all(a),raw=legacy?.state||legacy;
 let s=null,access=new Set(),choice=null;
 if(raw?.skills){s=W.migrate(raw);s.review||=[];s.skills||={};access=new Set(W.unlock(s));choice=P.recommend(raw).skill}
 const pointsDone=n=>id==='puntenbaai'&&(!!state.missions?.[n.id]?.completed||!!state.events?.some(e=>e.skill===n.id&&e.correct&&e.taskId?.startsWith('rechten-v2:puntenbaai:')&&/:5:run\d+$/.test(e.taskId)));
 const hillDone=n=>id==='hellingrug'&&n.playable&&(!!state.missions?.[n.id]?.completed||!!state.events?.some(e=>e.skill===n.id&&e.correct&&e.taskId?.startsWith('rechten-v2:hellingrug:')&&(n.id==='line_behavior'?/:8:run\d+$/:/:5:run\d+$/).test(e.taskId)&&e.attemptId?.startsWith(({delta:'hill-dy:',slope:'hill-rate:',slope_from_two_points:'hill-calculate:',line_behavior:'line-behavior:',special_lines:'line-special:'})[n.id])));
 const completed=n=>hillDone(n)||pointsDone(n)|| (n.key==='positive'?positiveDone(state)||!!(s&&W.ready(s,n.id)):n.id==='zeroRead'?!!state.events?.some(e=>e.skill==='zeroRead'&&e.correct)||!!(s&&W.ready(s,n.id)):!!(s&&W.ready(s,n.id)));
 const available=n=>n.playable||!!s&&access.has(n.id)&&!W.disabledSkills.includes(n.id)||!s&&n===nodes[0]&&id!=='grenspas';
 // Formulewerf follows its authored 1–9 order, using existing access/readiness only.
 const recommended=['formulewerf','hellingrug'].includes(id)?(nodes.find(n=>available(n)&&!completed(n))||nodes.find(available)||null):nodes.find(n=>n.id===choice&&available(n)&&!completed(n))||nodes.find(n=>available(n)&&!completed(n))||nodes.find(n=>!completed(n))||nodes[0];
 return {recommended,completed:nodes.filter(completed).length,total:nodes.length,nodes:nodes.map(n=>({...n,recommended:n===recommended,state:completed(n)?'completed':available(n)?n===recommended?'current':'available':'locked'}))};
}
function recommendation(state,legacy){const skill=P.recommend(legacy).skill;const id=Object.keys(areas).find(id=>all(areas[id]).some(n=>n.id===skill))||'grenspas';const status=statuses(state,id,legacy),selected=status.recommended||all(get(id))[0];return {id,node:status.recommended,zone:get(id).zones.find(z=>z.nodes.some(n=>n.key===selected.key)).id}}
function locationState(source,screen,{area,zone,stop}={}){
 const next=JSON.parse(JSON.stringify(source)),old=selection(source),id=has(area)?canonical(area):old.id,a=get(id),z=(screen==='stop'&&id==='formulewerf'&&a.zones.find(z=>z.nodes.some(n=>n.key===stop)))||a.zones.find(z=>z.id===(zone||(!area||id===old.id?old.zone.id:null)))||a.zones[0];
 next.settings.shell={...next.settings.shell,area:['area','stop'].includes(screen)?id:null,zone:z.id,stop:screen==='stop'&&z.nodes.some(n=>n.key===stop)?stop:null};
 next.screen=['area','stop'].includes(screen)?'world':screen;return next;
}
function hash(state){const {id,zone,stop}=selection(state);if(state.screen==='world'&&state.settings?.shell?.area)return '#'+id+(get(id).zones.length>1?'/'+zone.id:'')+(stop?'/halte/'+stop.key:'');return {world:'#wereld',mission:'#oefenen',book:'#voortgang',profile:'#profiel'}[state.screen]||'#wereld'}
function fromHash(source,hash){const parts=hash.replace(/^#/,'').split('/'),id=canonical(parts[0]);if(has(id)){const a=get(id),zone=a.zones.find(z=>z.id===parts[1])||a.zones[0],stop=parts[parts.indexOf('halte')+1];return locationState(source,parts.includes('halte')&&(id==='formulewerf'?all(a):zone.nodes).some(n=>n.key===stop)?'stop':'area',{area:id,zone:zone.id,stop})}const screen={'wereld':'world','voortgang':'book','profiel':'profile'}[parts[0]];return screen?locationState(source,screen):locationState(source,'world')}
return Object.freeze({areas,get,all,selection,statuses,recommendation,locationState,hash,fromHash});
});
