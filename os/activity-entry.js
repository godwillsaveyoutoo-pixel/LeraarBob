/* The OS owns workform navigation; native providers keep their forms and sessions. */
(() => {
  'use strict';
  const titles = {solo:'Solo',learn:'Samen leren',online:'Duo Battle',local:'Duo Battle',classroom:'Klasbattle',classlearn:'Samen leren met de klas',series:'Eigen oefenreeks',teacher:'Borduitleg',group:'Groepsbattle',live:'Live les'};
  function label(mode) { return ({local:'Duo · één toestel',online:'Duo · online'})[mode.id] || titles[mode.id] || mode.title || mode.id; }
  function mount(doc, options) {
    const {app,mode,model,base,role,openMode,openWorksheets,openModes}=options, win=doc.defaultView;
    const path=new URL(doc.URL).pathname, at=s=>path===new URL(s,base).pathname;
    let kind='';
    if(at('games/rechten/rechtenwereld/online.html'))kind='duel';
    else if(at('games/rechten/rechtenwereld/learn.html'))kind='learn';
    else if(doc.querySelector('#hostForm')&&doc.querySelector('#joinForm'))kind='class';
    else if(doc.querySelector('#battleForm'))kind='local';
    else if(doc.querySelector('#battleSetup'))kind='build';
    else if(at('games/bewerkingen-trainer/start.html'))kind='numbers';
    else if(at('games/bewerkingen-trainer/index.html')||at('games/bewerkingen-trainer/'))kind='series';
    else if(app.id==='rechten-zeeslag')kind='naval';
    else if(app.id==='kleiduifschieten')kind='clay';
    if(!kind)return ()=>{};
    const $=selector=>doc.querySelector(selector), visible=selector=>{const n=$(selector);return n&&!n.closest('[hidden]')&&win.getComputedStyle(n).display!=='none';};
    const node=(tag,cls,text)=>{const n=doc.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
    const head=node('section','os-entry');head.setAttribute('aria-label','Werkvorm kiezen');
    const identity=node('div','os-entry-identity'),img=node('img','os-entry-cover');img.src=new URL(app.cover||'assets/covers/graph.svg',base).href;img.alt='';
    const copy=node('div','os-entry-copy');copy.append(node('span','os-entry-kind',model.types[app.type]?.label||'Activiteit'),node('strong','os-entry-world',app.title));identity.append(img,copy);
    const nav=node('nav','os-entry-modes');nav.setAttribute('aria-label','Werkvormen voor '+app.title);
    for(const m of model.modes(app.id,role,options.topic())){const b=node('button','',label(m));b.type='button';b.dataset.entryMode=m.id;b.setAttribute('aria-pressed',String(m.id===mode));b.onclick=()=>m.id!==mode&&openMode(m.id);nav.append(b);}
    if(model.worksheets(app.id).length){const b=node('button','','Oefenbladen');b.type='button';b.dataset.entryWorksheets='';b.onclick=openWorksheets;nav.append(b);}
    const intro=node('div','os-entry-intro'),title=node('h1','',titles[mode]||options.label),hint=node('p','');intro.append(title,hint);head.append(identity,nav,intro);
    const css=node('link','');css.rel='stylesheet';css.href=new URL('os/activity-entry.css?v=20261010-workforms',base).href;doc.head.append(css);
    const old=doc.body.dataset.osEntry,oldMode=doc.body.dataset.osEntryMode;doc.body.dataset.osEntry=kind;doc.body.dataset.osEntryMode=mode;doc.body.dataset.osEntryTheme=document.documentElement.dataset.mode||'light';
    let host=null,last='',stopped=false,queued=false;
    const join=kind==='numbers'?node('button','os-entry-join','Deelnemen met code'):null;if(join){join.type='button';join.dataset.entryJoin='';join.onclick=()=>win.NumbersSpace?.snapshot().view==='join'?win.NumbersSpace.showSetup():win.NumbersSpace?.showJoin();intro.append(join);}
    function state(){
      switch(kind){
        case 'duel': {const phase=win.LeraarBobDuo?.snapshot().phase;return visible('#lobby')?['#lobby','Kies een afgeronde wereld en nodig een klasgenoot uit. Jullie spelen vijf rondes op elk een eigen toestel.']:['invite','waiting'].includes(phase)?['#match','Jullie wachtkamer · start zodra jullie allebei klaar zijn.']:null;}
        case 'learn': return visible('#learnSetup')?['#learnSetup','Kies jullie oefening. Leer daarna samen met twee of drie leerlingen.']:win.LeraarBobLearn?.snapshot().phase==='lobby'?['#learnSession','Nodig je klasgenoten uit. Start zodra jullie klaar zijn.']:null;
        case 'class': return visible('#setup')?['#setup',role==='teacher'?'Kies de oefening en maak een sessie. Je krijgt een klascode en beslist zelf wanneer je start.':'Voer de klascode in om mee te doen.']:visible('#login')?['#login','Meld je aan met je leraarBob-account om aan te sluiten.']:(visible('#lobby')||visible('#classFlowLobby'))?['#session','Deel de code met je klas. De leerkracht start de eerste ronde.']:null;
        case 'local': return visible('#setup')?['#setup','Kies jullie namen en oefening. Jullie spelen samen op één toestel.']:null;
        case 'build': return $('#battleSetup')?.open?['#battleSetup form','Kies jullie namen en reeks. Jullie bouwen samen op één toestel.']:null;
        case 'numbers': {const s=win.NumbersSpace?.snapshot();return ['selection','join','home'].includes(s?.view)||s?.state?.phase==='lobby'?['#space',s?.view==='join'?'Voer de sessiecode in om aan te sluiten.':s?.view==='session'?'Deel de sessiecode met je medespeler. Start zodra jullie klaar zijn.':'Kies het onderwerp en de vragen. Maak daarna een sessie en deel de code.']:null;}
        case 'series':return visible('#setupScreen')?['#setupScreen',mode==='local'?'Kies jullie namen en oefening. Jullie spelen samen op één toestel.':'Kies je vraagvormen, niveau en aantal opgaven.']:null;
        case 'naval':return visible('#lobbyScreen')?['#lobbyScreen .lobbyWrap','Nodig een beschikbare klasgenoot uit. Zodra die accepteert, plaatsen jullie je vloot.']:visible('#gateScreen')?['#gateScreen .gate','Meld je aan met je leerlingaccount om een klasgenoot uit te nodigen.']:null;
        case 'clay':return visible('#lobby')?['#lobby .battleLobby','Maak een groep of sluit aan bij een open groep.']:null;
      }
    }
    function sync(){queued=false;if(stopped)return;const next=state(),target=next&&$(next[0]),signature=(next||[]).join('|');
      if(kind==='numbers'){const s=win.NumbersSpace?.snapshot().state,text=s&&s.activity==='learn'?(s.audience==='class'?'Samen leren met de klas':'Samen leren'):titles[mode]||options.label;if(title.textContent!==text)title.textContent=text;}
      if(target!==host){host?.classList.remove('os-entry-surface');host=target;if(host){host.classList.add('os-entry-surface');host.prepend(head);}else head.remove();}
      if(host&&head.parentNode!==host)host.prepend(head);
      if(join){const view=win.NumbersSpace?.snapshot().view;const hide=role!=='student'||!['learn','online'].includes(mode)||!['selection','join'].includes(view);if(join.hidden!==hide)join.hidden=hide;const label=view==='join'?'Nieuwe sessie maken':'Deelnemen met code';if(join.textContent!==label)join.textContent=label;}
      if(signature!==last){last=signature;hint.textContent=next?.[1]||'';doc.body.classList.toggle('os-entry-visible',!!target);}
    }
    // Observe phase/visibility changes, never replace a provider's inputs or handlers.
    const observer=new win.MutationObserver(()=>{if(!queued){queued=true;win.queueMicrotask(sync);}});
    observer.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','open','data-phase','data-view']});sync();
    const click=e=>{const t=e.target.closest?.('#spaceBack,#sessionBack');if(kind==='numbers'&&t){e.preventDefault();e.stopImmediatePropagation();openModes(t);}};
    doc.addEventListener('click',click,true);
    return ()=>{stopped=true;observer.disconnect();doc.removeEventListener('click',click,true);head.remove();css.remove();delete doc.body.dataset.osEntryTheme;host?.classList.remove('os-entry-surface');doc.body.classList.remove('os-entry-visible');if(old===undefined)delete doc.body.dataset.osEntry;else doc.body.dataset.osEntry=old;if(oldMode===undefined)delete doc.body.dataset.osEntryMode;else doc.body.dataset.osEntryMode=oldMode;};
  }
  window.LeraarBobActivityEntry=Object.freeze({mount,label,titles});
})();
