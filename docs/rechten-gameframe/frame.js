/* Clickable design model only. No trainer, account, network or progress writes. */
'use strict';
const icons={tower:'M17 49V18h26v31M13 18 30 6l17 12M26 49V36h9v13M24 23h12v7',trail:'M8 46h18V32h16V18h10M8 46l44-28',bridge:'M5 43h50M10 43V20m40 23V20M10 24q20 23 40 0M20 32v11m10-7v7m10-11v11',house:'M10 29 30 10l20 19M16 26v23h29V26M26 49V35h10v14',scale:'M30 8v40M14 18h32M16 18 8 35h16L16 18m28 0-8 17h16L44 18M17 49h26',flag:'M17 51V8m0 2h28l-6 10 6 10H17'};
const regions=[
 {
  "id": "vallei",
  "name": "Punten en helling",
  "tag": "coördinaten, verschillen en helling",
  "at": [
   18,
   68
  ],
  "icon": "tower",
  "goal": "Lees en plaats punten. Gebruik verschillen om een helling te bepalen.",
  "places": [
   {
    "name": "Coördinaten lezen en plaatsen",
    "skills": [
     "point",
     "point_plot"
    ],
    "goal": "Lees de x- en y-coördinaat en plaats een punt in het assenstelsel."
   },
   {
    "name": "Verschillen en helling",
    "skills": [
     "delta",
     "slope"
    ],
    "goal": "Bepaal Δx en Δy en verbind hun verhouding met de helling."
   },
   {
    "name": "Helling uit twee punten",
    "skills": [
     "slope_from_two_points"
    ],
    "goal": "Bereken de helling uit twee punten. Gebruik één consistente aftrekvolgorde."
   }
  ]
 },
 {
  "id": "landschap",
  "name": "Eigenschappen van rechten",
  "tag": "richting, bijzondere rechten, a en b",
  "at": [
   35,
   25
  ],
  "icon": "trail",
  "goal": "Verbind het gedrag van een rechte met haar helling en herken a en b.",
  "places": [
   {
    "name": "Stijgen, dalen en bijzondere rechten",
    "skills": [
     "line_behavior",
     "special_lines"
    ],
    "goal": "Onderscheid stijgend, dalend, horizontaal, verticaal en twee identieke punten."
   },
   {
    "name": "a en b herkennen",
    "skills": [
     "intercept",
     "ab"
    ],
    "goal": "Herken het snijpunt met de y-as en de betekenis van a en b."
   }
  ]
 },
 {
  "id": "werkplaats",
  "name": "Voorschriften opstellen",
  "tag": "uit a en b, uit punten, door herleiden",
  "at": [
   51,
   68
  ],
  "icon": "scale",
  "goal": "Stel een voorschrift op uit de beschikbare gegevens en controleer het.",
  "places": [
   {
    "name": "Voorschrift uit a en b",
    "skills": [
     "equation_from_ab"
    ],
    "goal": "Stel y = ax + b op met een gegeven a en b."
   },
   {
    "name": "Voorschrift uit punten",
    "skills": [
     "intercept_from_point",
     "equation_from_point_slope",
     "equation_from_two_points"
    ],
    "goal": "Bepaal b uit a en een punt, bouw het voorschrift en controleer de oorspronkelijke punten."
   },
   {
    "name": "Vergelijking herleiden",
    "skills": [
     "rewrite_linear_equation"
    ],
    "goal": "Herleid een vergelijking naar y = ax + b. Dit is een aparte route; ze blokkeert b bepalen niet."
   }
  ]
 },
 {
  "id": "markt",
  "name": "Tabellen, grafieken en toepassingen",
  "tag": "rekenen, tekenen en gegevens gebruiken",
  "at": [
   72,
   25
  ],
  "icon": "house",
  "goal": "Wissel tussen waarden, tabellen, grafieken en situaties.",
  "places": [
   {
    "name": "Waarden berekenen en tabellen invullen",
    "skills": [
     "fx",
     "table",
     "input_from_output"
    ],
    "goal": "Bereken functiewaarden, vul een tabel in en zoek een invoer bij een gegeven uitvoer."
   },
   {
    "name": "Grafieken tekenen en punten controleren",
    "skills": [
     "graph_from_equation",
     "graph_from_table",
     "point_on_line"
    ],
    "goal": "Teken een grafiek uit een voorschrift of tabel en controleer of een punt op de rechte ligt."
   },
   {
    "name": "Voorschrift uit tabel of grafiek",
    "skills": [
     "equation_from_table",
     "equation_from_graph"
    ],
    "goal": "Bepaal a en b uit een tabel of grafiek en controleer de gegevens."
   },
   {
    "name": "Voorschrift uit een situatie",
    "skills": [
     "equation_from_context"
    ],
    "goal": "Vertaal startwaarde en verandering naar een voorschrift. Controleer eenheden en domein."
   }
  ]
 },
 {
  "id": "grens",
  "name": "Nulwaarden en tekens",
  "tag": "nul, positief en negatief",
  "at": [
   82,
   72
  ],
  "icon": "flag",
  "goal": "Bepaal waar de functiewaarde nul, positief of negatief is.",
  "places": [
   {
    "name": "Nulwaarde bepalen",
    "skills": [
     "zeroRead",
     "zero"
    ],
    "goal": "Lees of bereken voor welke x de functiewaarde nul is."
   },
   {
    "name": "Teken en tekenschema",
    "skills": [
     "sign",
     "signchart"
    ],
    "goal": "Onderzoek positieve en negatieve functiewaarden en stel een tekenschema op."
   }
  ]
 }
];
let state={region:0,place:2,event:'mission',draft:null,built:false,emblem:'◇',plaza:'together',participate:false,still:false};
const screen=document.querySelector('#screen'),help=document.querySelector('#help');
const icon=name=>`<svg viewBox="0 0 60 60" aria-hidden="true"><path d="${icons[name]}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const land=(local=false)=>`<svg class="land" viewBox="0 0 800 470" preserveAspectRatio="none" aria-hidden="true"><rect width="800" height="470" fill="#edf0e6"/><g fill="none" stroke="#c5ccb9" stroke-width="1.5"><path d="M-30 80Q100 0 230 95T500 65T850 100M-20 100Q100 20 230 115T500 85T850 120M-30 380Q150 300 320 385T850 350M-30 405Q150 325 320 410T850 375"/><path d="M70 240l20-40 20 40M102 250l14-28 14 28M625 170l28-50 28 50M660 180l20-39 20 39"/></g><path d="M480-30C350 90 590 120 470 240S580 420 440 510" stroke="#c7d8d1" stroke-width="25" fill="none" opacity=".8"/><path d="${local?'M150 310Q300 265 360 175T645 290':'M150 320 270 140 420 320 580 140 665 370'}" stroke="#9fa98d" stroke-width="2" stroke-dasharray="5 10" fill="none"/>${local&&state.built&&!state.region?'<path class="new-path complete" d="M360 175Q470 178 550 237T645 290"/>':''}</svg>`;
const title=(small,big,back='')=>`<div class="title"><div><span class="eyebrow">${small}</span><h1 tabindex="-1">${big}</h1></div>${back?`<a class="return" href="#${back}">← ${back==='atlas'?'Hoofdkaart':'Deelkaart'}</a>`:''}</div>`;
const active=()=>state.draft&&!state.built;
function go(page){if(location.hash==='#'+page)render();else location.hash=page}
function atlas(){const r=regions[state.region];return title('Hoofdkaart · structuurvoorstel','Rechten')+`<p class="subtitle">Kies een onderwerp en open de deelkaart. Elke stopplaats heeft een concreet leerdoel.</p><div class="split"><section class="map" aria-label="Hoofdkaart Rechten">${land()}<span class="map-label">5 onderwerpen · 14 stopplaatsen</span>${regions.map((x,i)=>`<button class="place ${i===state.region?'selected':''} ${i?'preview':''}" style="left:${x.at[0]}%;top:${x.at[1]}%" data-region="${i}" aria-pressed="${i===state.region}">${icon(x.icon)}<strong>${x.name}</strong><small>${i?'ontwerp bekijken':state.built?'★ voorbeeld afgerond':'met speelbare voorbeeldopgave'}</small></button>`).join('')}<span class="map-key">Selecteer een onderwerp → bekijk de deelkaart</span></section><aside class="brief"><span class="tag">Onderwerp ${state.region+1} van 5</span><h2>${r.name}</h2><p>${r.goal}</p><div class="callout">Deze deelkaart bevat ${r.places.length} stopplaatsen. Herhaling uit andere onderwerpen blijft terugkomen.</div><ol class="place-list">${r.places.map(p=>`<li>${p.name}</li>`).join('')}</ol><button class="primary" data-go="gebied">Open deelkaart →</button></aside></div><p class="subtle">De indeling groepeert leerdoelen. Je hoeft een deelkaart niet volledig af te werken voordat je elders verder kunt.</p>`}
const activities={mission:{name:'Oefenen',text:'Nieuwe uitleg en passende opgaven rond dit leerdoel, gemengd met benodigde herhaling.'},camp:{name:'Gemengd herhalen',text:'De leerplanner kiest eerdere leerdoelen uit alle beschikbare onderwerpen. Geen aparte herhalingskaart.'},encounter:{name:'Extra variatie',text:'Een optionele andere voorstelling of moeilijkere variant van dit leerdoel.'},project:{name:'Onderwerptoets',text:'Een toets met doelen uit dit onderwerp en eerdere kennis. Bestaande toegang en reeds aangetoonde onderdelen blijven bewaard.'}};
function region(){const r=regions[state.region];if(state.place>=r.places.length)state.place=0;const p=r.places[state.place],a=activities[state.event],demo=state.region===0&&state.place===2&&state.event==='mission',positions=r.places.length===4?[[23,29],[74,29],[23,72],[74,72]]:r.places.length===2?[[27,60],[73,40]]:[[20,68],[47,34],[79,65]];return title('Rechten / '+r.name,r.name,'atlas')+`<p class="subtitle">Deelkaart · selecteer een leerdoel, kies daarna een activiteit.</p><div class="split"><section class="map submap ${state.built&&!state.region?'connected':''}" aria-label="Deelkaart ${r.name}">${land(true)}<span class="map-label">${r.places.length} stopplaatsen met leerdoelen</span>${r.places.map((x,i)=>`<button class="place ${state.place===i?'selected':''}" style="left:${positions[i][0]}%;top:${positions[i][1]}%" data-place="${i}" aria-pressed="${state.place===i}">${icon(state.region?r.icon:['tower','trail','bridge'][i])}<strong>${x.name}</strong><small class="${state.built&&i===2&&!state.region?'earned':''}">${state.built&&i===2&&!state.region?'★ voorbeeld afgerond':'leerdoel bekijken'}</small></button>`).join('')}${state.region?'':`<span class="traveler" aria-label="Jouw positie">${state.emblem}</span>`}<span class="map-key">Herhaling blijft onderdeel van elke oefenreeks</span></section><aside class="brief"><span class="tag">Stopplaats · leerdoel</span><h2>${p.name}</h2><p>${p.goal}</p><span class="subtle">Bij dit leerdoel</span><div class="activity-options" aria-label="Activiteit bij dit leerdoel">${['mission','encounter'].map(key=>`<button data-event="${key}" aria-pressed="${state.event===key}">${activities[key].name}</button>`).join('')}</div><span class="subtle">Over meerdere leerdoelen</span><div class="activity-options" aria-label="Activiteit over meerdere leerdoelen">${['camp','project'].map(key=>`<button data-event="${key}" aria-pressed="${state.event===key}">${activities[key].name}</button>`).join('')}</div><div class="callout"><strong>${a.name}</strong><br>${a.text}</div>${demo?(active()?'<button class="primary" data-go="werk">Hervat voorbeeldopgave →</button>':state.built?'<button data-go="reisboek">Bekijk resultaat →</button>':'<button class="primary" data-begin>Start voorbeeldopgave →</button>'):'<p class="subtle">Deze activiteit is nog een ontwerp, zonder gekoppelde vragenreeks.</p><button data-demo>Bekijk voorbeeld: helling uit twee punten →</button>'}<p class="subtle">Schermmodel: alleen ‘Oefenen’ bij ‘Helling uit twee punten’ bevat een vaste voorbeeldopgave.</p></aside></div>`}
function graph(){let lines='';for(let i=0;i<7;i++)lines+=`<path d="M40 ${240-i*32}H264M${40+i*32} 16V240"/>`;return `<svg viewBox="0 0 320 270" role="img" aria-label="A is (1, 1), B is (3, 5). Horizontale verandering 2, verticale verandering 4."><g stroke="#e1e4d8" stroke-width="1">${lines}</g><path d="M40 16V240H278" stroke="#7d9281" stroke-width="1.5" fill="none"/><text x="282" y="244" fill="#526657">x</text><text x="35" y="12" fill="#526657">y</text><path d="M72 208H136V80" fill="none" stroke="#b18839" stroke-dasharray="4 4" stroke-width="2"/>${state.built?'<path d="M72 208 136 80" stroke="#2c6554" stroke-width="4"/>':''}<g fill="#2c6554"><circle cx="72" cy="208" r="5"/><circle cx="136" cy="80" r="5"/><text x="81" y="229">A(1, 1)</text><text x="147" y="80">B(3, 5)</text></g><text x="77" y="197" fill="#87641e">Δx = ${state.draft?.step?'2':'?'}</text><text x="148" y="152" fill="#87641e">Δy = 4</text></svg>`}
function work(){if(!state.draft){go('gebied');return ''}const d=state.draft;return title('Rechten / Punten en helling / Helling uit twee punten','Helling uit twee punten · oefenen','gebied')+`<div class="split"><section class="map ${state.built?'connected':''}" aria-label="Werkvlak op de kaart">${land(true)}<div class="work"><div class="step"><span class="${d.step===0?'on':''}">1 · meten</span><span class="${d.step===1?'on':''}">2 · helling</span><span class="${state.built?'on':''}">3 · resultaat</span></div>${graph()}</div></section><aside class="brief">${state.built?`<span class="star">★</span><h2>Helling bepaald</h2><p>De helling door A en B is 2. Je afgeronde voorbeeldopgave krijgt een ster op de deelkaart.</p><div class="callout">${d.help||d.errors?'Voltooid met ondersteuning. Een latere opdracht geeft ruimte voor zelfstandig bewijs.':'Zelfstandig gelukt in dit voorbeeld. De echte trainer bepaalt later welk leerbewijs dit oplevert.'}</div><p>Je resultaat staat bij Voortgang.</p><button class="primary" data-go="gebied">Terug naar deelkaart →</button>`:`<span class="tag">${d.step?'Bouwen op je vorige stap':'Onderzoeken'}</span><h2>${d.step?'Welke helling past?':'Hoe ver naar rechts?'}</h2><p>${d.step?'Δx = 2 en Δy = 4. Kies de helling van de rechte door A en B.':'Ga van A(1, 1) naar B(3, 5). Hoe groot is Δx?'}</p><div class="choices">${(d.step?['2','½','−2']:['2','4','−2']).map(x=>`<button data-answer="${x}" aria-label="Antwoord ${x}">${x}</button>`).join('')}</div><p class="feedback ${d.error?'error':''}" role="status">${d.feedback||'Je krijgt feedback op je werk. Juiste stappen blijven staan.'}</p><div class="actions"><button data-help>Uitleg</button><button data-go="gebied">Pauzeer</button></div><p class="subtle">Dit is een vaste voorbeeldopgave om de scherminteractie te ervaren.</p>`}</aside></div>`}
function journal(){return title('Voortgang','Resultaten en herhaling')+`<div class="cards"><article class="paper"><span class="eyebrow">Wat je hebt gedaan</span><h2>Resultaten</h2><div class="note-row"><strong>Coördinaten lezen</strong><span>Voorbeeldnotitie: eerst x, dan y.</span></div>${state.built?'<div class="note-row"><strong>★ Helling uit twee punten</strong><span>Δx = 2 · Δy = 4 · helling 2. Deze voorbeeldopgave is afgerond.</span></div>':'<p>Hier verschijnt je resultaat zodra je de voorbeeldopgave afrondt.</p>'}<button data-go="gebied">Terug naar deelkaart →</button></article><article class="paper"><span class="eyebrow">Wat later terugkomt</span><h2>Geplande herhaling</h2><p>Een eerdere puntvraag kan terugkomen bij een nieuw onderwerp.</p><p>Een negatieve helling of andere schaal geeft bekende kennis een nieuwe toepassing.</p><div class="callout">Herhaling zit ook in gewone oefenreeksen. Je hoeft niet zelf telkens Gemengd herhalen te kiezen.</div></article><article class="paper"><span class="eyebrow">Wat de tekens betekenen</span><h2>Voltooid en geleerd</h2><p><strong>★ Voltooid:</strong> deze oefenreeks heb je afgerond.</p><p><strong>Zelfstandig gelukt:</strong> een poging zonder hulp of verbetering.</p><p><strong>Later aangetoond:</strong> opnieuw zelfstandig, in een latere situatie.</p><p class="subtle">In de echte versie komen leerbewijzen uit de bestaande trainer. Dit scherm bevat ontwerpvoorbeelden.</p></article></div>`}
function plaza(){return title('Groep · fictieve gegevens','Groepsdoel en ranglijst')+`<p class="subtitle">Een gezamenlijk doel, met een aparte plek voor wie wil vergelijken.</p><div class="tabs"><button data-plaza="together" aria-pressed="${state.plaza==='together'}">Groepsdoel</button><button data-plaza="ranking" aria-pressed="${state.plaza==='ranking'}">Ranglijst bekijken</button></div>${state.plaza==='together'?`<div class="summary"><article class="paper"><span class="eyebrow">Voorbeeldproject</span><h2>Samen 30 oefenreeksen afronden</h2><p>Iedereen kan bijdragen door passende oefenreeksen af te ronden. Ook geholpen werk kan een bijdrage opleveren.</p><progress value="18" max="30" aria-label="18 van 30 voorbeeldbijdragen"></progress><p>18 van 30 bijdragen · fictieve stand</p><div class="callout">Je eigen leerroute blijft persoonlijk. Een bijdrage vertelt niet wie de moeilijkste vragen kreeg.</div></article><article class="paper"><h2>Op jouw tempo</h2><p>Voorstel: maximaal drie bijdragen per leerling aan dit project. Verder oefenen kan altijd.</p><p>Wanneer het project klaar is, krijgt de groep een gezamenlijke illustratie.</p><button class="primary" data-go="gebied">Verder oefenen →</button></article></div>`:`<div class="summary"><article class="paper"><span class="eyebrow">Ontwerpdata · geen echte leerlingen</span><h2>Helling bepalen · niveau 1</h2><table><thead><tr><th>Plaats</th><th>Alias</th><th>Score</th></tr></thead><tbody><tr><td>1</td><td>Rietvos</td><td>11 / 12</td></tr><tr><td>1</td><td>Merelpad</td><td>11 / 12</td></tr><tr class="self"><td>3</td><td>Kaartmaker · voorbeeld</td><td>9 / 12</td></tr><tr><td>4</td><td>Duinuil</td><td>8 / 12</td></tr></tbody></table><p class="subtle">Gelijke scores delen dezelfde plaats. De getoonde eigen score is ook fictief.</p></article><article class="paper"><h2>Een vergelijkbare uitdaging</h2><p>Iedereen speelt dezelfde opzet en hetzelfde niveau. Eén zelfstandige eerste beoordeling per opgave telt.</p><p>Hulp blijft beschikbaar. Tijd bepaalt de rang niet; gewone oefen-XP telt hier niet mee.</p><button data-join aria-pressed="${state.participate}">${state.participate?'Deelname aangevinkt in dit model':'Voorbeeld: vrijwillig deelnemen'}</button><p class="subtle">Deze knop demonstreert de keuze. Er wordt niets ingeschreven of verzonden.</p></article></div>`}`}
function profile(){return title('Profiel','Alias en weergave')+`<div class="summary"><article class="paper"><div class="person" aria-hidden="true">${state.emblem}</div><h2>Kaartmaker</h2><p>Voorbeeldalias · in de echte versie gebruiken we de bestaande accountalias.</p><div class="emblems" aria-label="Kies een embleem">${['◇','△','✧'].map(x=>`<button data-emblem="${x}" aria-label="Embleem ${x}" aria-pressed="${state.emblem===x}">${x}</button>`).join('')}</div><p class="subtle">Cosmetische keuze. Je vragen, hulp en toegang blijven hetzelfde.</p></article><article class="paper"><h2>Rust tijdens het spelen</h2><div class="toggle"><button data-motion role="switch" aria-checked="${state.still}">Verminder beweging: ${state.still?'aan':'uit'}</button></div><p>De voorkeur voor verminderde beweging van je toestel geldt ook.</p><div class="callout">In dit schermmodel veranderen alleen het embleem en de presentatie. Je echte profiel en instellingen worden niet aangepast.</div></article></div>`}
function render(){const page=location.hash.slice(1)||'atlas',views={atlas,gebied:region,werk:work,reisboek:journal,plein:plaza,profiel:profile};screen.innerHTML=(views[page]||atlas)();document.querySelectorAll('nav a').forEach(a=>{const on=a.hash==='#'+(['gebied','werk'].includes(page)?'atlas':page);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});document.querySelector('#resume').hidden=!active()||page==='werk';document.body.classList.toggle('still',state.still);
 screen.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
 screen.querySelectorAll('[data-region]').forEach(b=>b.onclick=()=>{state.region=+b.dataset.region;state.place=0;state.event='mission';render();screen.querySelector(`[data-region="${state.region}"]`).focus()});
 screen.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>{state.place=+b.dataset.place;state.event='mission';render();screen.querySelector(`[data-place="${state.place}"]`).focus()});
 screen.querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>{state.event=b.dataset.event;render();screen.querySelector(`[data-event="${state.event}"]`).focus()});
 screen.querySelector('[data-demo]')?.addEventListener('click',()=>{state.region=0;state.place=2;state.event='mission';render()});
 screen.querySelector('[data-begin]')?.addEventListener('click',()=>{state.region=0;state.place=2;state.draft={step:0,help:false,errors:0,feedback:'',error:false};go('werk')});
 screen.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const d=state.draft;if(b.dataset.answer!=='2'){d.errors++;d.error=true;d.feedback=d.step?'Vergelijk de verticale verandering met de horizontale: 4 gedeeld door 2.':'Kijk alleen naar x: van 1 naar 3. De verticale stap bewaar je voor later.'}else if(!d.step){d.step=1;d.error=false;d.feedback='Δx = 2 klopt. Die stap blijft bewaard; gebruik nu ook Δy.'}else{state.built=true;d.step=2}render();screen.querySelector('h1')?.focus({preventScroll:true})});
 screen.querySelector('[data-help]')?.addEventListener('click',()=>{state.draft.help=true;help.showModal()});
 screen.querySelectorAll('[data-plaza]').forEach(b=>b.onclick=()=>{state.plaza=b.dataset.plaza;render();screen.querySelector(`[data-plaza="${state.plaza}"]`).focus()});
 screen.querySelector('[data-join]')?.addEventListener('click',()=>{state.participate=!state.participate;render();screen.querySelector('[data-join]').focus()});
 screen.querySelectorAll('[data-emblem]').forEach(b=>b.onclick=()=>{state.emblem=b.dataset.emblem;render();screen.querySelector(`[data-emblem="${state.emblem}"]`).focus()});
 screen.querySelector('[data-motion]')?.addEventListener('click',()=>{state.still=!state.still;render();screen.querySelector('[data-motion]').focus()});
}
document.querySelector('#resume').onclick=()=>{state.region=0;state.place=2;state.event='mission';go('werk')};
document.querySelector('#restart').onclick=()=>{state={region:0,place:2,event:'mission',draft:null,built:false,emblem:'◇',plaza:'together',participate:false,still:false};go('atlas')};
window.addEventListener('hashchange',()=>{render();screen.querySelector('h1')?.focus({preventScroll:true});window.scrollTo(0,0)});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!help.open){const p=location.hash.slice(1);if(p==='werk')go('gebied');else if(p&&p!=='atlas')go('atlas')}});
render();
