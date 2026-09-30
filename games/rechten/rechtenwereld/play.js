(() => {
  'use strict';
  const modes=window.LeraarBobPlayModes,style=document.createElement('style');
  style.textContent=modes.css;document.head.append(style);
  const names={puntenbaai:'Puntenbaai',hellingrug:'Hellingrug',grenspas:'Grenspas',formulewerf:'Formulewerf',signaalstad:'Signaalstad'};
  const requested=new URLSearchParams(location.search).get('world');
  const world=Object.hasOwn(names,requested)?requested:null;
  if(world){document.getElementById('backToWorld').href='index.html#'+world;const context=document.getElementById('worldContext');context.hidden=false;context.textContent='Vanuit '+names[world];}
  document.getElementById('paperChoice').hidden=Boolean(world&&!['hellingrug','grenspas','formulewerf'].includes(world));
  if(['hellingrug','grenspas','formulewerf'].includes(world)){document.querySelector('#paperChoice p').textContent=names[world]+' · kies je leerdoelen, opbouw en verbetersleutel.';document.getElementById('openWorksheets').href='worksheets.html?world='+world;}
  if(['hellingrug','grenspas','formulewerf'].includes(world)){document.querySelector('h1').textContent='Leren, spelen of papier';document.querySelector('.play-intro').textContent='Werk digitaal, samen of met een eigen oefenblad.';}
  const render=detail=>{if(detail?.pending)return;document.getElementById('playModes').innerHTML=modes.cards('rechten',{solo:true,role:detail?.account?.role,world});};
  render();AxiomaAuth.onChange(render);AxiomaAuth.ready().then(render).catch(()=>{});
})();
