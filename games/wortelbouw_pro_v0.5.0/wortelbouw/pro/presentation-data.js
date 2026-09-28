(function(root){
  'use strict';
  const mottos=[
    ['Kleine stappen.','Grote wortels.','🥕'],
    ['Bouw wat klopt.','Dan groeit het land.','🌱'],
    ['Elke zijde telt.','Elke wortel krijgt een plek.','↗'],
    ['Drie velden.','Eén nieuwe lengte.','△']
  ];

  function poster(levelIndex,phase,level,celebration=null){
    if(phase==='won'||phase==='routeDone'){
      if(celebration==='signal')return {type:'signal',title:'De zijde klopt.',body:'Kijk naar de gouden lijn. De nieuwe lengte is gevonden.',icon:'✨'};
      if(celebration==='field')return {type:'field',title:'Nieuw konijnenland.',body:'Het gras groeit het nieuwe veld helemaal dicht.',icon:'🌱'};
      if(celebration==='rabbit')return {type:'rabbit',title:'Daar komt iemand.',body:'Een konijn springt het nieuwe veld in.',icon:'🐇'};
      if(celebration==='settle')return {type:'settle',title:'Nog één ontdekking.',body:'De lengte krijgt nu haar plaats op de wortel-as.',icon:'↘'};
      if(celebration==='harvest')return {type:'harvest',title:'Je worteltuin groeit.',body:'De nieuwe wortel staat nu tussen je eerdere ontdekkingen.',icon:'🥕'};
      return {type:'discovery',title:'Nieuwe wortel!',body:level.kind==='area'?`Oppervlakte ${level.n} hoort bij zijde √${level.n}.`:`${level.label||`√${level.n}`} staat nu op de wortel-as.`,icon:'🥕'};
    }
    if(phase==='reveal')return {type:'discovery',title:'Kijk goed.',body:'De nieuwe zijde wordt gemeten.',icon:'📏'};
    if(phase==='helper')return {type:'hint',title:'Bouw het tweede veld.',body:'Ook dit veld wordt gewoon vruchtbare konijnengrond.',icon:'🌱'};
    if(phase==='result')return {type:'hint',title:'Bouw verder.',body:'Maak het vierkant op de overblijvende zijde af.',icon:'□'};
    const m=mottos[levelIndex%mottos.length];return {type:'motto',title:m[0],body:m[1],icon:m[2]};
  }

  function speech(phase,level,rootText,celebration=null){
    if(phase==='won'||phase==='routeDone'){
      if(celebration==='rabbit')return 'Hop! Nieuw veld.';
      if(celebration==='harvest')return 'Kijk, je wortels staan samen op een rij.';
      if(celebration==='root'||celebration==='done')return phase==='routeDone'?'De wortel klopt. Zoek nu nog de andere bouwroute.':`Mooi! ${rootText}`;
      return '';
    }
    if(phase==='reveal')return 'Even meten…';
    return '';
  }
  root.WortelbouwPresentation=Object.freeze({poster,speech});
})(globalThis);
