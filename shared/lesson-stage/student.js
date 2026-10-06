(()=>{
 const $=id=>document.getElementById(id),art=LivingBlackboard.mount($('blackboard'));let busy=false,signature='',sceneKey='',sceneAbort,frameKey='',clockTimer;
 const notice=e=>$('notice').textContent=e?.message||e||'';
 const live=LessonLive.create(render,notice);
 const invite=new URLSearchParams(location.search).get('code');if(/^[a-f\d]{6}$/i.test(invite||''))$('joinCode').value=invite.toUpperCase();
 async function act(fn){if(busy)return;busy=true;render(live.state);try{notice('');await fn();}catch(e){notice(e);}finally{busy=false;render(live.state);}}
 $('joinForm').onsubmit=e=>{e.preventDefault();act(()=>live.join($('joinCode').value.trim().toUpperCase()));};
 function show(id){for(const name of ['stage','studentTask','studentActivity','studentPoll'])$(name).hidden=name!==id;}
 function task(title,note){show('studentTask');$('taskTitle').textContent=title;$('taskNote').textContent=note;}
 function follow(room,state){
  if(room.phase==='closed'){task('De lessessie is afgesloten.','Je antwoorden zijn bewaard.');$('studentActivity').replaceChildren();frameKey='';return;}
  if(state?.mode==='poll'&&state.poll){show('studentPoll');return;}
  const activity=state?.mode==='clay'?state.activity:null;
  if(activity||state?.mode==='battle'){
   show('studentActivity');const key=activity?'clay:'+activity.id:'battle:'+room.id;if(frameKey!==key){frameKey=key;const frame=document.createElement('iframe');frame.title=activity?'Kleiduifschieten · deze lessessie':'Klasbattle · deze lessessie';const url=new URL(activity?'../../games/rechten/kleiduiven/':'../../games/rechten/rechtenwereld/classroom.html',location.href);url.searchParams.set(activity?'lesson':'code',activity?room.id:room.code);frame.src=url.href;$('studentActivity').replaceChildren(frame);}return;
  }
  if(frameKey.startsWith('clay:')){$('studentActivity').replaceChildren();frameKey='';}
  const presentation=state?.presentation,step=LessonStageContent.steps.find(s=>s.id===presentation?.step),scene=step?.events.find(e=>e.type==='scene'),text=step?.events.find(e=>e.type==='text');
  if(!step){task('Je bent aangesloten.','De leerkracht start zo het lesverhaal.');return;}
  if(!scene){const e=step.events[0];task(step.title,e.type==='pdf'?'Volg de correctie op het klasbord. Het PDF-document staat op het toestel van de leerkracht.':e.type==='liveJoin'?'Je bent al aangesloten. Even wachten op de rest van de klas.':'Volg de bespreking op het klasbord.');return;}
  show('stage');$('stage').dataset.art=scene.art;$('stage').dataset.tone=scene.tone||'paper';$('stage').dataset.color=scene.color||'ink';$('readingNames').textContent=presentation.speaker||'LeraarBob';$('readingRole').textContent=step.reading?.lead==='teacher'?'LERAAR':'LEEST';$('words').textContent=text?.text||'';$('sceneNote').textContent=(presentation.reply?presentation.reply+' · ':'')+(text?.note||'');$('eyebrow').textContent=(step.chapter||step.title).toUpperCase();
  const key=step.id+':'+presentation.replay;if(key!==sceneKey){sceneKey=key;sceneAbort?.abort();sceneAbort=new AbortController();clearInterval(clockTimer);const elapsed=Math.max(0,Date.parse(state.server_time||new Date().toISOString())-Date.parse(presentation.started_at||new Date().toISOString()));art.start(scene,sceneAbort.signal,{elapsed});const pause=step.events.find(e=>e.type==='pause');$('clock').hidden=!pause;if(pause){const end=Date.now()+pause.duration-elapsed,tick=()=>{const s=Math.max(0,Math.ceil((end-Date.now())/1000));$('clock').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};tick();clockTimer=setInterval(tick,500);}}
 }
 function render({account,room,lesson}){
  if(invite&&room&&room.code!==invite.toUpperCase()){room=null;lesson=null;}
  $('signIn').hidden=!!account;$('joinForm').hidden=!account||!!room;$('joinIntro').hidden=!!room;$('studentMain').classList.toggle('following',!!room);
  $('joinStatus').textContent=!account?'Gebruik je bestaande leraarBob-aanmelding.':!room?'Vul de code op het klasbord in.':`Je doet mee · ${account.alias||'Leerling'} · ${room.code}`;
  if(room&&account){localStorage.setItem(`rechten-class-session:${account.id}`,JSON.stringify(room.id));$('actualProgress').dataset.value=Math.max(0,room.round+(['results','finished','closed'].includes(room.phase)?1:0));follow(room,lesson);}else{show(null);sceneAbort?.abort();sceneKey='';clearInterval(clockTimer);$('studentActivity').replaceChildren();frameKey='';}
  $('openBattle').hidden=!room||lesson?.mode!=='battle';if(room){const url=new URL('../../games/rechten/rechtenwereld/classroom.html',location.href);url.searchParams.set('code',room.code);$('openBattle').href=url.href;}
  const p=lesson?.poll,sig=JSON.stringify([p,busy]);if(sig===signature)return;signature=sig;if(!p)return;
  $('question').textContent=p.question;$('privacy').textContent=p.anonymous?'Anoniem: alleen groepstotalen. Je keuze wordt niet bij je account opgeslagen.':'Antwoord per alias: je leerkracht ziet jouw antwoord in het lesverslag.';
  $('choices').replaceChildren();p.options.forEach((text,i)=>{const b=document.createElement('button');b.textContent=text;b.disabled=busy||p.closed||p.voted;b.onclick=()=>act(()=>live.act('vote',{poll:p.id,choice:i}));$('choices').append(b);});
  $('voteStatus').textContent=p.closed?'Je antwoord is bewaard. De stemming is gesloten.':p.voted?'Je antwoord is ontvangen.':'Kies één antwoord.';
 }
 $('themeBtn').onclick=()=>{const dark=document.documentElement.dataset.mode!=='dark';document.documentElement.dataset.mode=dark?'dark':'light';$('themeBtn').setAttribute('aria-pressed',String(dark));};
})();
