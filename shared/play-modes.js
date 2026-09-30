/* One set of names and destinations for the central chooser and game menus. */
(() => {
  'use strict';
  if (window.LeraarBobPlayModes) return;
  const root = new URL('../', document.currentScript.src);
  const worlds = ['puntenbaai','hellingrug','grenspas','formulewerf','signaalstad'];
  const definitions = {
    solo: {id:'solo',group:'learning',title:'Alleen leren',devices:'1 leerling',description:'Volg je eigen leerroute, in je eigen tempo.',access:'Ook zonder aanmelding',file:'index.html',glyph:'route'},
    learn: {id:'learn',group:'learning',title:'Samen leren',devices:'2–3 leerlingen · elk een toestel',description:'Eerst je eigen idee, daarna samen bouwen en controleren.',access:'Leerlingaccounts · uitnodigen op alias',file:'learn.html',glyph:'classroom'},
    local: {id:'local',group:'battle',title:'Duo-battle op één toestel',devices:'2 spelers · één scherm',description:'Speel tegen elkaar op twee werkborden naast elkaar.',access:'Ook zonder aanmelding',file:'battle.html',glyph:'battle'},
    online: {id:'online',group:'battle',title:'Online duel',devices:'2 leerlingen · elk een toestel',description:'Daag een klasgenoot uit. Jullie hebben dezelfde wereld afgerond.',access:'Leerlingaccounts · uitnodiging',file:'online.html',glyph:'battle'},
    classroom: {id:'classroom',group:'battle',title:'Klasbattle',devices:'De hele klas · elk een toestel',description:'De leerkracht start een sessie; leerlingen doen mee met de code.',teacherDescription:'Start een sessie, deel de code en kies wanneer de ronde begint.',studentDescription:'Voer de code van je leerkracht in en speel mee met de klas.',access:'leraarBob-account · sessiecode',file:'classroom.html',glyph:'classroom'}
  };
  const games = [
    {id:'rechten',name:'Rechtenwereld',subject:'Rechten',path:'games/rechten/rechtenwereld/',cover:'rechtenwereld',modes:['learn','local','online','classroom']},
    {id:'wortelbouw',name:'Wortelbouw',subject:'Pythagoras & wortels',path:'games/wortelbouw_pro_v0.5.0/wortelbouw/',cover:'wortelbouw',modes:['local','classroom']},
    {id:'vectoren',name:'Vectormissie',subject:'Vectoren',path:'games/vectoren/',cover:'vectormissie',modes:['local','classroom']}
  ];
  const escape = text => String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const game = id => games.find(item=>item.id===id);
  const current = () => games.find(item=>location.pathname.startsWith(new URL(item.path,root).pathname));
  function modes(id, {solo=false,role=''}={}) {
    const item=game(id);
    return item ? [...(solo&&id==='rechten'?['solo']:[]),...item.modes].map(key=>{
      const mode=definitions[key];
      return {...mode,description:role==='teacher'?mode.teacherDescription||mode.description:role==='student'?mode.studentDescription||mode.description:mode.description};
    }) : [];
  }
  function destination(id, mode, world) {
    const url=new URL(game(id).path+definitions[mode].file,root);
    if(id==='rechten'&&worlds.includes(world)) {
      if(mode==='solo')url.hash=world;
      else url.searchParams.set('world',world);
    }
    return url.href;
  }
  function cards(id,options={}) {
    const entries=modes(id,options),item=game(id);
    return ['learning','battle'].map(group=>{
      const list=entries.filter(mode=>mode.group===group);
      if(!list.length)return '';
      return `<section class="play-mode-section"><h3>${group==='learning'?'Leren':'Battles'}</h3><div class="mode-links">${list.map(mode=>`<a class="play-mode" data-play-mode="${mode.id}" href="${escape(destination(id,mode.id,options.world))}" aria-label="${escape(item.name+': '+mode.title)}"><span class="play-mode-copy"><strong>${escape(mode.title)}</strong><span class="play-mode-devices">${escape(mode.devices)}</span><span class="play-mode-description">${escape(mode.description)}</span><small>${escape(mode.access)}</small></span><span class="play-mode-arrow" aria-hidden="true">→</span></a>`).join('')}</div></section>`;
    }).join('');
  }
  function navigation(node, id) {
    const item=game(id);if(!item)return null;
    const key=node.id==='battleBtn'?'local':node.id==='classBtn'?'classroom':null;
    return modes(id).find(mode=>mode.id===key||node.href&&new URL(node.href).pathname===new URL(item.path+mode.file,root).pathname)||null;
  }
  const css=`
    .play-mode-section{margin:14px 0 0}.play-mode-section>h3{margin:0 0 7px;font:700 12px/1.4 system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:inherit}
    .mode-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.mode-links>.play-mode:only-child{grid-column:1/-1}
    .mode-links .play-mode{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;min-height:44px;padding:12px;border:1px solid var(--lb-line,#c2cfca);border-radius:0;background:var(--lb-surface,#faf9f4);color:var(--lb-ink,#183b3d);text-decoration:none;line-height:1.35;min-width:0}
    .play-mode:hover{background:var(--lb-hover,#e8f0e9)}.play-mode:focus-visible{outline:3px solid #c6a24f;outline-offset:2px}.play-mode-copy{display:grid;gap:4px;min-width:0}.play-mode strong{font-size:14px;font-weight:750}.play-mode-devices{font-size:12px;font-weight:600}.play-mode-description{font-size:13px}.play-mode small{font-size:11px;margin-top:3px}.play-mode-arrow{font-size:20px;flex:none;line-height:1}
    @media(max-width:480px){.mode-links{grid-template-columns:minmax(0,1fr)}.mode-links .play-mode{padding:10px 12px}.play-mode-description{font-size:12px}}
  `;
  window.LeraarBobPlayModes=Object.freeze({games,game,current,modes,cards,destination,navigation,css});
  function retainWorld() {
    const world=new URLSearchParams(location.search).get('world');
    if(current()?.id!=='rechten'||!worlds.includes(world))return;
    for(const link of document.querySelectorAll('a[href="play.html"]'))link.href='play.html?world='+encodeURIComponent(world);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',retainWorld,{once:true});else retainWorld();
})();
