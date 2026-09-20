/* Load after the platform's normal registry. Existing IDs are replaced, other games stay untouched. */
(()=>{
  const additions=[
    {id:'pythagoras',title:'Pythagoras',subtitle:'Ontdek en gebruik de stelling van Pythagoras.',path:'games/pythagoras.html',accent:'#e0a44b',dark:'#17212a'},
    {id:'stelsels',title:'Stelsels',subtitle:'Los stelsels grafisch, met substitutie en met combinatie op.',path:'games/stelsels.html',accent:'#4f91aa',dark:'#3f4e51'},
    {id:'algebra-smederij',title:'Algebra Smederij',subtitle:'Herschrijf algebra stap voor stap.',path:'games/algebra-smederij.html',accent:'#e9c56d',dark:'#0a1017'},
    {id:'taartenwinkel',title:'Taartenwinkel',subtitle:'Snijd, verdeel en combineer breuken.',path:'games/taartenwinkel.html',accent:'#d6a353',dark:'#173f3c'},
    {id:'kubusbouw',title:'Kubusbouw',subtitle:'Bouw 3D-vormen en lees voor-, boven- en zijaanzichten.',path:'games/kubusbouw.html',accent:'#55dfd3',dark:'#081225'},
    {id:'verfwinkel',title:'Verfwinkel',subtitle:'Meng verf met verhoudingen en hoeveelheden.',path:'games/verfwinkel.html',accent:'#2787df',dark:'#182b3e'},
    {id:'data-check',title:'Data Check',subtitle:'Onderzoek data en herken misleidende voorstellingen.',path:'games/data-check.html',accent:'#4f79c9',dark:'#19324e'},
    {id:'signal-lab',title:'Signal Lab',subtitle:'Ontdek functies via invoer, uitvoer en grafieken.',path:'games/signal-lab.html',accent:'#397eea',dark:'#17395f'},
    {id:'gravity-maze',title:'Gravity Maze',subtitle:'Stuur zwaartekracht, stenen en portals door compacte puzzelkamers.',path:'games/gravity/index.html',accent:'#8a7ee8',dark:'#11131c'}
  ];
  const prior=Array.isArray(window.GAMES)?window.GAMES:[];
  const ids=new Set(additions.map(g=>g.id));
  window.GAMES=[...prior.filter(g=>!ids.has(g.id)),...additions];
  window.AXIOMA_GAME_ADDITIONS=additions;
})();
