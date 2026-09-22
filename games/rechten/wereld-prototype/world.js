'use strict';
// Illustrative state only. This prototype does not read or write learner progress.
const worlds=[
 {id:'coordinates',name:'Coördinaten',title:'Het vertrekpunt',subtitle:'Vind je weg. Geef elke plek een adres.',missions:[
  {id:'point',name:'De uitkijktoren',icon:'tower',goal:'Lees de coördinaten van een plek.',story:'Vanaf de toren zie je waar de reizigers zich bevinden.',stars:2,question:'Op welk adres staat het gemarkeerde punt?',options:['(3; 2)','(2; 3)','(−2; 3)'],answer:1},
  {id:'point_plot',name:'Het kamp',icon:'tent',goal:'Kies de juiste plek vanuit coördinaten.',story:'De reizigers zoeken hun kamp bij P(2; 3). Welk punt hoort daarbij?',stars:0,question:'P(2; 3): welk kamp kies je?',options:['Kamp A','Kamp B','Kamp C'],answer:1},
  {id:'delta',name:'De oversteek',icon:'bridge',goal:'Bepaal de horizontale en verticale verplaatsing.',story:'De kaart verbindt twee oevers. Zoek de verplaatsing tussen beide punten.',stars:0,question:'Van A(1; 2) naar B(4; 4): hoeveel is Δx?',options:['2','3','4'],answer:1}]},
 {id:'slope',name:'Helling',title:'Langs de hoogtelijn',subtitle:'Ontdek wat verandert wanneer x toeneemt.',missions:[
  {id:'slope',name:'Het meetstation',icon:'tower',goal:'Bereken een helling uit verschillen.',story:'Je meet een verticale verandering van 3 bij een horizontale verandering van 2.',stars:0,question:'Δy = 3 en Δx = 2. Wat is a?',options:['2/3','3/2','5'],answer:1},
  {id:'slope_from_two_points',name:'De verbindingsweg',icon:'bridge',goal:'Bepaal a uit twee punten.',story:'Verbind A(1; 2) en B(3; 6).',stars:0,question:'A(1; 2), B(3; 6): welke helling?',options:['2','4','1/2'],answer:0},
  {id:'special_lines',name:'De observatiepost',icon:'tower',goal:'Onderscheid horizontale en verticale rechten.',story:'Twee meetpunten hebben dezelfde x en verschillende y.',stars:0,question:'Dezelfde x, verschillende y: welke rechte?',options:['Horizontaal','Verticaal'],answer:1}]},
 {id:'formulas',name:'Voorschriften',title:'De werkplaats',subtitle:'Maak een regel die bij de gegevens past.',missions:[
  {id:'equation_from_ab',name:'Het atelier',icon:'house',goal:'Bouw een formule met a en b.',story:'De machine gebruikt a = 2 en b = 3.',stars:0,question:'a = 2 en b = 3: welk voorschrift?',options:['y = 3x + 2','y = 2x + 3'],answer:1},
  {id:'intercept_from_point',name:'Het ijkpunt',icon:'tower',goal:'Vind b met a en een punt.',story:'De machine heeft a = 2 en moet door P(1; 5) gaan.',stars:0,question:'a = 2, punt (1; 5): welke b past?',options:['2','3','5'],answer:1},
  {id:'equation_from_two_points',name:'Het constructiehuis',icon:'house',goal:'Reconstrueer een volledige formule.',story:'Twee waarnemingen, één model. Hier komen je eerdere ontdekkingen samen.',stars:0,question:'Door (0; 1) en (2; 5): welke formule?',options:['y = 2x + 1','y = x + 2'],answer:0}]},
 {id:'applications',name:'Toepassingen',title:'De handelsplaats',subtitle:'Onderzoek grafieken, tabellen en verhalen.',missions:[
  {id:'equation_from_table',name:'Het archief',icon:'house',goal:'Maak en controleer een formule bij een tabel.',story:'Controleer alle gegevens; ook de derde rij moet passen.',stars:0,question:'x: 0, 1, 2; y: 1, 3, 6. Past één rechte?',options:['Ja','Nee'],answer:1},
  {id:'equation_from_graph',name:'De kaartkamer',icon:'tower',goal:'Vind een voorschrift vanuit een grafiek.',story:'Kies je eigen meetpunten en controleer het gevonden model.',stars:0,question:'Door (0; 2) en (2; 4): welke formule?',options:['y = x + 2','y = 2x'],answer:0},
  {id:'equation_from_context',name:'De markt',icon:'house',goal:'Vertaal een situatie naar een formule.',story:'Een taxi rekent 3 € startgeld en 2 € per kilometer.',stars:0,question:'3 € startgeld en 2 €/km: welke prijsformule?',options:['y = 3x + 2','y = 2x + 3'],answer:1}]}];
const icons={tower:'M12 42h24M16 42V16h16v26M13 16l11-9 11 9M21 22h6v8h-6M22 42v-7h4v7M24 7V2l9 3-9 3',tent:'M5 40L24 9l19 31H5M15 40l9-17 9 17M24 9V4M9 35l-5 8M39 35l5 8',bridge:'M3 30Q24 7 45 30M3 34Q24 11 45 34M4 24v18M44 24v18M12 20v9M21 16v8M30 17v8M39 21v9M3 43q7-5 14 0t14 0t14 0',house:'M7 22L24 8l17 14M11 20v22h26V20M21 42V29h7v13M15 25h3M31 25h3M32 13V6h5v11'};
const state={world:0,selected:'point_plot',playing:false,completed:new Set(),feedback:''};
const $=s=>document.querySelector(s),all=worlds.flatMap(w=>w.missions);
function stars(m){return Math.max(m.stars,state.completed.has(m.id)?1:0)}
function open(m){const i=all.indexOf(m);return i<=1||stars(m)>0||stars(all[i-1])>0}
function starHTML(m){return '<span aria-hidden="true">'+'★'.repeat(stars(m))+'☆'.repeat(3-stars(m))+'</span>'}
function art(m){return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="${icons[m.icon]}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
function miniGrid(m){return `<svg viewBox="0 0 110 100" role="img" aria-label="Rooster: A bij (3;2), B bij (2;3), C bij (1;1)"><g stroke="#cbd1c8" stroke-width=".6">${[0,1,2,3,4].map(i=>`<path d="M${15+i*18} 10V85M15 ${85-i*18}H95"/>`).join('')}</g><path d="M15 10V85H95" fill="none" stroke="#56665f"/><g font-size="8" fill="#56665f"><text x="98" y="88">x</text><text x="10" y="8">y</text><text x="8" y="95">0</text>${[1,2,3,4].map(i=>`<text x="${12+i*18}" y="96">${i}</text><text x="5" y="${88-i*18}">${i}</text>`).join('')}</g>${(m.id==='point_plot'?[[3,2,'A'],[2,3,'B'],[1,1,'C']]:[[2,3,'P']]).map(([x,y,l])=>`<circle cx="${15+x*18}" cy="${85-y*18}" r="3" fill="#276752"/><text x="${20+x*18}" y="${82-y*18}" fill="#243f3a" font-size="9">${l}</text>`).join('')}</svg>`}
function select(id){state.selected=id;state.playing=false;state.feedback='';render()}
function render(){
 const world=worlds[state.world],m=world.missions.find(m=>m.id===state.selected)||world.missions[0];state.selected=m.id;
 $('#regions').innerHTML=worlds.map((w,i)=>`<button data-region="${i}" aria-current="${i===state.world}"><small>0${i+1}</small>${w.name}</button>`).join('');
 document.querySelectorAll('[data-region]').forEach(b=>b.onclick=()=>{state.world=+b.dataset.region;select(worlds[state.world].missions[0].id)});
 $('#chapter').textContent='Gebied 0'+(state.world+1);$('#mapTitle').textContent=world.title;$('#mapSubtitle').textContent=world.subtitle;
 const positions=[[18,67],[49,49],[82,67]],next=all.find(x=>open(x)&&!stars(x));
 $('#locations').innerHTML=world.missions.map((x,i)=>`<button data-mission="${x.id}" class="location ${open(x)?'':'locked'} ${x.id===m.id?'selected':''} ${x===next?'next':''}" style="left:${positions[i][0]}%;top:${positions[i][1]}%" aria-pressed="${x.id===m.id}" aria-label="${x.name}, ${open(x)?stars(x)+' van 3 sterren':'later beschikbaar'}"><span class="building">${art(x)}</span><strong>${x.name}</strong><span class="stars">${open(x)?starHTML(x):'◇'}</span></button>`).join('');
 document.querySelectorAll('[data-mission]').forEach(b=>b.onclick=()=>select(b.dataset.mission));
 const panel=$('#mission');panel.classList.toggle('playing',state.playing);$('#reset').textContent=state.playing?'Terug naar kaart':'Herstart voorbeeld';
 if(state.playing){panel.innerHTML=`<span class="eyebrow">Proefmissie</span><h2>${m.name}</h2><div class="challenge">${['point','point_plot'].includes(m.id)?miniGrid(m):''}<p>${m.question}</p></div><div class="choices">${m.options.map((x,i)=>`<button data-answer="${i}">${x}</button>`).join('')}</div><div class="status" role="status">${state.feedback||'Kies een antwoord. Je mag verbeteren.'}</div>`;
 if(!['point','point_plot'].includes(m.id))panel.querySelector('.challenge').style.gridTemplateColumns='1fr';
 panel.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{if(+b.dataset.answer===m.answer){state.completed.add(m.id);state.playing=false;state.feedback='Missie voltooid. Je route gaat verder.';render();$('#startMission')?.focus()}else{state.feedback='Nog niet. Bekijk de gegevens en probeer opnieuw.';panel.querySelector('[role=status]').textContent=state.feedback}});return}
 panel.innerHTML=`<span class="eyebrow">${!open(m)?'Later op je route':stars(m)?'Ontdekte plek':m===next?'Jouw volgende ontdekking':'Beschikbare missie'}</span><h2>${m.name}</h2><div class="stars" aria-label="${stars(m)} van 3 sterren">${starHTML(m)}</div><p>${m.story}</p><p class="goal">${m.goal}</p><div class="status" role="status">${state.feedback}</div>${open(m)?`<button class="primary" id="startMission">${stars(m)?'Probeer opnieuw':'Probeer deze missie'} →</button>`:`<p class="star-note">Voltooi eerst «${all[all.indexOf(m)-1].name}». Je kunt de andere gebieden alvast bekijken.</p>`}`;
 $('#startMission')?.addEventListener('click',()=>{state.playing=true;state.feedback='';render();panel.querySelector('[data-answer]')?.focus()});
 $('#journey').textContent=state.completed.size?'Je hebt '+state.completed.size+' proefmissie'+(state.completed.size===1?'':'s')+' ontdekt.':'Sterren: voltooid · zelfstandig · later opnieuw aangetoond';
}
$('#reset').onclick=()=>{if(state.playing){state.playing=false;state.feedback='';render();return}state.completed.clear();state.world=0;select('point_plot');$('#locations [aria-pressed=true]')?.focus()};
render();
