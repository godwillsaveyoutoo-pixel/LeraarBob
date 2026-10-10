(() => {
  'use strict';
  // OS frames share the top-level service and tab reservation. No second presence
  // client; subscriptions are detached when a native app window is destroyed.
  if(window!==window.top){
    try{if(window.parent.location.origin===location.origin&&window.parent.LeraarBobDesktop){
      const service=()=>window.parent.AxiomaSocial,stops=new Set();let closed=false;
      const ready=async()=>{for(let i=0;i<100&&!closed;i++){if(service())return service().ready();await new Promise(r=>setTimeout(r,100));}throw Error('Uitnodigingen zijn nog niet bereikbaar. Probeer opnieuw.');};
      const forward=name=>async(...args)=>{await ready();return service()[name](...args);};
      window.AxiomaSocial=Object.freeze({ready,state:()=>service()?.state()||{players:[],invitations:[],account:null,connected:false},refresh:forward('refresh'),open:forward('open'),invite:forward('invite'),join:forward('join'),finish:forward('finish'),answerInvitation:forward('answerInvitation'),onChange(fn){let stopped=false,off;ready().then(()=>{if(!stopped&&!closed)off=service().onChange(fn);}).catch(()=>{});const stop=()=>{stopped=true;off?.();stops.delete(stop);};stops.add(stop);return stop;}});
      addEventListener('pagehide',()=>{closed=true;stops.forEach(stop=>stop());},{once:true});
    }}catch{/* Cross-origin previews do not get access to the account service. */}
    return;
  }
  // One shared service per top-level page; catalog previews never go online.
  if (window !== window.top || window.AxiomaSocial || new URLSearchParams(location.search).get('demo') === '1') return;
  const base = new URL('../', document.currentScript.src);
  const gameURL = new URL('games/rechten/zeeslag/', base);
  const clayURL = new URL('games/rechten/kleiduiven/', base);
  let tabId;
  try {
    tabId = sessionStorage.getItem('axioma-social-tab') || crypto.randomUUID();
    sessionStorage.setItem('axioma-social-tab', tabId);
  } catch { tabId = crypto.randomUUID(); }
  let account = null, token = null, epoch = 0, timer = null, queue = Promise.resolve();
  let matchId = null, snapshot = { players: [], invitations: [] }, connected = false;
  let note = '', pending = false, navigating = false, dock, panel, content, live, returnFocus;
  const listeners = new Set(), routed = new Set();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const activeInvites = () => snapshot.invitations.filter(i => i.status === 'pending');
  const mine = i => i.sender_id === account?.id;
  const other = i => mine(i) ? i.recipient_alias : i.sender_alias;

  function emit() {
    render();
    for (const fn of listeners) { try { fn(state()); } catch (error) { console.error(error); } }
  }
  function state() { return { ...snapshot, account, connected, matchId, tabId, pending, note }; }
  const invitationLabel = i => i.game==='rechten-learn'?'Samen leren in Rechtenwereld':i.game==='rechten-duo'?'een online duel in Rechtenwereld':'Rechten Zeeslag';
  function invitationURL(invite) {
    const learn=invite.game==='rechten-learn';
    const url=new URL(learn?'games/rechten/rechtenwereld/learn.html':invite.game==='rechten-duo'?'games/rechten/rechtenwereld/online.html':gameURL,base);
    url.searchParams.set(learn?'session':'match',learn?invite.learn_room_id:invite.id);return url;
  }
  function rememberRoute(id) {
    routed.add(id);try { sessionStorage.setItem(`axioma-social-opened:${id}`, '1'); } catch {}
  }
  function openInvitation(invite) {
    const url = invitationURL(invite);
    const navigation=new CustomEvent('leraarbob:social-route',{cancelable:true,detail:{href:url.href,game:invite.game,invitationId:invite.id,handled:false}});
    document.dispatchEvent(navigation);
    if(navigation.defaultPrevented){if(navigation.detail.handled)rememberRoute(invite.id);return;}
    rememberRoute(invite.id);
    navigating = true;
    location.assign(url.href);
  }
  function route(invite) {
    // The creator already owns a lobby; another pupil accepting must never pull
    // them out of solo work or a different screen.
    if(invite.game==='rechten-learn'&&mine(invite))return;
    if (matchId || navigating || routed.has(invite.id)) return;
    try { if (sessionStorage.getItem(`axioma-social-opened:${invite.id}`)) return; } catch {}
    if ((mine(invite) ? invite.sender_tab : invite.recipient_tab) !== tabId) return;
    // The game consumes the URL itself after validating membership server-side.
    if (location.pathname===invitationURL(invite).pathname && new URLSearchParams(location.search).get(invite.game==='rechten-learn'?'session':'match') === (invite.game==='rechten-learn'?invite.learn_room_id:invite.id)) {rememberRoute(invite.id);return;}
    // An OS host can open the invitation in a native window without leaving it.
    openInvitation(invite);
  }
  function request(action, args = {}) {
    const version = epoch, id = account?.id;
    const task = queue.catch(() => {}).then(async () => {
      if (!id || version !== epoch) return null;
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const { data, error } = await AxiomaAuth.client().rpc('axioma_social', {
          p_action: action, p_tab_id: tabId, p_match_id: matchId, ...args
        }).abortSignal(controller.signal);
        if (error) throw error;
        if (version !== epoch) return null;
        snapshot = { players: data.players || [], invitations: data.invitations || [] };
        // A finished party must no longer block accepting a new invitation.
        if (matchId && snapshot.invitations.some(i => i.id === matchId && i.status === 'finished')) matchId = null;
        connected = true;
        emit();
        if (action !== 'join' && action !== 'finish') snapshot.invitations.filter(i => i.status === 'accepted').forEach(route);
        return data;
      } catch (error) {
        if (version === epoch) { connected = false; emit(); }
        throw error;
      } finally { clearTimeout(timeout); }
    });
    queue = task;
    return task;
  }
  async function finishSoloExit(version) {
    // An account-scoped leave intent survives navigation and temporary network loss.
    if (location.pathname.endsWith('/rechtenwereld/learn.html')) return;
    const key=`rechten-learn:${account?.id}`,pendingKey=key+':pending';
    let saved,op;try { saved=localStorage.getItem(pendingKey);op=JSON.parse(saved||'null'); } catch { return; }
    if(op?.action!=='leave'||!op.data?.id)return;
    try {
      const invoke=(action,data)=>AxiomaAuth.client().functions.invoke('rechten-learn',{timeout:4000,body:{action,data:{...data,tab_id:tabId}}});
      const current=await invoke('state',{id:op.data.id});
      if(version!==epoch||current.error||current.data?.error||!current.data)return;
      let result=current;
      if(current.data.participating)result=await invoke('leave',{...op.data,version:current.data.version,revision:current.data.revision});
      if(version!==epoch||result.error||result.data?.error||result.data?.stale||result.data?.participating!==false)return;
      if(localStorage.getItem(pendingKey)===saved){localStorage.removeItem(pendingKey);localStorage.removeItem(key+':draft');if(JSON.parse(localStorage.getItem(key)||'null')===op.data.id)localStorage.removeItem(key);}
    } catch { /* Retry on the next presence refresh; solo learning stays usable. */ }
  }
  async function refresh() {
    clearTimeout(timer);
    if (!account) return;
    const version = epoch;
    await finishSoloExit(version);
    if(version!==epoch)return;
    try { await request('sync'); } catch { /* Keep the page usable while offline. */ }
    if (version === epoch && account) timer = setTimeout(refresh, document.hidden ? 15000 : 4000);
  }
  function offline() {
    if (!account || !token) return;
    const cfg = window.AXIOMA_CONFIG;
    // keepalive lets navigation/logout remove only this tab's presence.
    fetch(`${cfg.url}/rest/v1/rpc/axioma_social`, {
      method: 'POST', keepalive: true,
      headers: { 'Content-Type':'application/json', apikey:cfg.publicKey, Authorization:`Bearer ${token}` },
      body: JSON.stringify({ p_action:'offline', p_tab_id:tabId })
    }).catch(() => {});
  }
  function authChanged(detail) {
    const next = detail.account?.role !== 'unknown' ? detail.account : null;
    if (next?.id === account?.id) { token = detail.session?.access_token || token; return; }
    offline();
    epoch++; clearTimeout(timer); queue = Promise.resolve();
    account = next || null; token = detail.session?.access_token || null;
    matchId = null; snapshot = { players:[], invitations:[] }; connected = false; note = ''; navigating = false; pending = false;
    emit();
    if (account) refresh();
  }
  async function act(action, args = {}) {
    if (pending || !account) return null;
    const invitation=snapshot.invitations.find(i=>i.id===args.p_invite_id);
    if(['rechten-duo','rechten-learn'].includes(invitation?.game)){
      pending=true;note='';render();const version=epoch;
      try{
        const {data,error}=await AxiomaAuth.client().functions.invoke(invitation.game,{body:{action,data:{[invitation.game==='rechten-learn'?'invite':'id']:invitation.id,tab_id:tabId}}});
        if(version!==epoch)return null;
        let detail;if(error)try{detail=await error.context?.json();}catch{}
        if(error||data?.error)throw Error(detail?.error||data?.error||'Antwoorden op de uitnodiging lukte niet. Probeer opnieuw.');
        if(action==='accept')openInvitation(invitation);
        else await request('sync');
        return data;
      }catch(error){if(version===epoch)note=error.message;}finally{if(version===epoch){pending=false;render();}}
      return null;
    }
    pending = true; note = ''; render();
    try {
      const data = await request(action, args);
      if (data) note = ({ invite:'Uitnodiging verstuurd. Je opent samen Zeeslag zodra de ander accepteert.', decline:'Uitnodiging geweigerd.', cancel:'Uitnodiging ingetrokken.' })[action] || '';
      return data;
    } catch (error) {
      note = error.message || 'Dat lukte niet. Controleer je verbinding en probeer opnieuw.';
      return null;
    } finally { pending = false; render(); }
  }
  async function open(opener) {
    await ready;
    if (!account) return;
    const request=new CustomEvent('leraarbob:social-open',{cancelable:true,detail:{opener}});
    document.dispatchEvent(request);if(request.defaultPrevented){refresh();return;}
    returnFocus = opener || document.querySelector('leraarbob-topbar')?.shadowRoot?.querySelector('.menu') || document.activeElement;
    panel.showPopover();
    panel.querySelector('.close').focus();
    refresh();
  }
  function mount() {
    // Presence never occupies the header or playfield. Collapsing closes its panel.
    if (panel && document.body.classList.contains('topbar-collapsed') && panel.matches(':popover-open')) panel.hidePopover();
  }
  let selectedGame = null;
  const modesReady = window.LeraarBobPlayModes ? Promise.resolve() : new Promise(resolve => {
    const script=document.createElement('script');script.src=new URL('shared/play-modes.js?v=20261006-platform',base).href;
    script.onload=resolve;script.onerror=resolve;document.head.append(script);
  });
  function modernChooser() {
    const modes=window.LeraarBobPlayModes;
    if(!modes)return '<p>Spelkeuzes konden niet laden. <a href="'+esc(new URL('games/rechten/rechtenwereld/play.html',base).href)+'">Open leren en spelen</a></p>';
    selectedGame ||= modes.current()?.id || 'rechten';
    const game=modes.game(selectedGame)||modes.game('rechtenwereld');selectedGame=game.id;
    const picker=modes.games.map(g=>`<button type="button" data-action="choose-game" data-id="${g.id}" aria-pressed="${g.id===selectedGame}" aria-controls="selected-game-modes">${g.name}</button>`).join('');
    const select=`<label class="game-picker-mobile">Spel<select data-action="choose-game" aria-controls="selected-game-modes">${modes.games.map(g=>`<option value="${g.id}" ${g.id===selectedGame?'selected':''}>${g.name}</option>`).join('')}</select></label>`;
    return `${select}<div class="game-picker" role="group" aria-label="Kies een spel">${picker}</div><section id="selected-game-modes" aria-label="Spelvormen voor ${game.name}"><div class="modern-game"><img src="${esc(new URL(game.coverSmall||game.cover,base).href)}" alt=""><div class="modern-copy"><span class="subject">${game.subject}</span><h3>${game.name}</h3></div></div>${modes.cards(game.id,{solo:true,role:account?.role})}</section>`;
  }
  function updateSection(selector, html) {
    const section=content.querySelector(selector);
    if(section.innerHTML===html)return;
    const focused=content.getRootNode().activeElement;
    const restore=section.contains(focused)?{action:focused.dataset.action,id:focused.dataset.id,href:focused.getAttribute('href')}:null;
    const scroll=panel.scrollTop;
    section.innerHTML=html;
    if(restore){
      const next=[...section.querySelectorAll('button,a,select')].find(n=>restore.action?n.dataset.action===restore.action&&n.dataset.id===restore.id:restore.href&&n.getAttribute('href')===restore.href);
      (next||panel.querySelector('.close')).focus({preventScroll:true});
    }
    panel.scrollTop=scroll;
  }
  function render() {
    if (!dock) return;
    dock.hidden = !account;
    if (!account) { if (panel.matches(':popover-open')) panel.hidePopover(); return; }
    mount();
    const incoming = activeInvites().filter(i => !mine(i));
    const players = snapshot.players.filter(p => p.id !== account.id);
    const announcement = incoming.length ? `${incoming[0].sender_alias} nodigt je uit voor ${invitationLabel(incoming[0])}. Open 'Samen spelen' in het menu om te antwoorden.` : '';
    if (live.textContent !== announcement) live.textContent = announcement;
    // Keep focused controls intact during the regular background poll.
    const disabled = pending || !connected ? 'disabled' : '';
    const active = snapshot.invitations.some(i => ['pending','accepted'].includes(i.status));
    const invites = snapshot.invitations.filter(i=>['pending','accepted'].includes(i.status)).map(i => {
      const name = esc(other(i));
      if (i.status === 'pending') return `<div class="invite"><p><strong>${name}</strong> ${mine(i) ? 'is uitgenodigd voor' : 'wil met je spelen:'} ${invitationLabel(i)}.</p><div class="actions">${mine(i) ? `<span>Wachten op antwoord…</span><button data-action="cancel" data-id="${i.id}" ${disabled}>Intrekken</button>` : `<button data-action="accept" data-id="${i.id}" class="primary" ${disabled}>Meedoen</button><button data-action="decline" data-id="${i.id}" ${disabled}>Niet nu</button>`}</div></div>`;
      if (i.status === 'accepted' && i.game==='rechten-learn') return `<p class="result">Samen leren met <strong>${name}</strong> · <a class="game-link" href="${esc(invitationURL(i).href)}">Open groepje →</a></p>`;
      if (i.status === 'accepted') return `<p class="result">Partij met <strong>${name}</strong> ${matchId === i.id ? 'bezig.' : 'geaccepteerd. Open het tabblad van je uitnodiging.'}</p>`;
      return '';
    }).join('');
    const history=snapshot.invitations.filter(i=>!['pending','accepted'].includes(i.status)).map(i=>{
      const text={declined:'Uitnodiging geweigerd',cancelled:'Uitnodiging ingetrokken',expired:'Uitnodiging verlopen',finished:'Partij afgelopen'}[i.status];
      return text?`<p class="result">${esc(other(i))} · ${text}</p>`:'';
    }).join('');
    const g=window.AxiomaGroups?.state();
    const inGroup=g?.member&&!g.member.left_at&&['waiting','running'].includes(g.current?.status);
    const groupDisabled=pending||g?.pending||!g?.connected||inGroup||active?'disabled':'';
    const ownGroupTab = g?.member?.tab_id === tabId;
    const groupExitLabel = g?.current?.host_id === account.id && g.current.status === 'waiting' ? 'Groep beëindigen' : 'Groep verlaten';
    const groupExit = inGroup ? `<div class="actions"><a class="game-link" href="${esc(clayURL.href)}">Terug naar je sessie</a><button data-action="group-leave" ${pending||g.pending||!g.connected||!ownGroupTab?'disabled':''}>${groupExitLabel}</button></div>${!ownGroupTab?'<p class="result">Verlaat de sessie in het tabblad waarin je deelnam.</p>':''}` : '';
    const playersHTML = players.length ? players.map(p => `<div class="player"><div><strong>${esc(p.alias)}</strong><small>${esc(p.class_code)}${p.class_code ? ' · ' : ''}${p.status === 'playing' ? 'In spel' : 'Beschikbaar'}</small></div><button data-action="invite" data-id="${p.id}" ${disabled || active || inGroup || p.status === 'playing' ? 'disabled' : ''}>Uitnodigen</button></div>`).join('') : '<p class="empty">Nog niemand anders online.</p>';
    const naval = `<section class="game-card" aria-labelledby="naval-title"><span class="mode">1 tegen 1</span><h3 id="naval-title">Rechten Zeeslag</h3><p class="intro">Nodig een online speler uit voor Zeeslag.</p><a class="game-link" href="${esc(gameURL.href)}">Open Zeeslag</a><h4>Tegenstander voor Zeeslag</h4>${playersHTML}<p class="foot">Uitnodigingen vervallen na 90 seconden.</p></section>`;
    const groups = `<section class="game-card" aria-labelledby="clay-title"><span class="mode">Groepsrace</span><h3 id="clay-title">Kleiduifschieten</h3><p class="intro">Speel een groepsrace: zeven juiste antwoorden op rij.</p><div class="actions"><button data-action="group-create" ${groupDisabled}>Groep starten · 5 s</button><a class="game-link" href="${esc(clayURL.href)}">Open Kleiduifschieten</a></div>${inGroup?`<p class="result">Je doet mee met ${esc(g.current.host_alias)}.</p>`:''}<h4>Open groepen</h4>${g?.sessions.length ? g.sessions.map(s=>`<div class="player"><div><strong>${esc(s.host_alias)}</strong><small>${s.player_count} spelers · ${s.speed} s per doel</small></div><button data-action="group-join" data-id="${s.id}" ${groupDisabled}>Meedoen</button></div>`).join('') : `<p class="empty">${g?.connected ? 'Er staat nog geen groep open. Je kunt er zelf een starten.' : 'Groepen ophalen…'}</p>`}</section>`;
    updateSection('.social-notifications',`${!connected ? '<p class="error" role="status">Verbinding herstellen… <button data-action="retry">Opnieuw proberen</button></p>' : ''}${note ? `<p class="feedback" role="status">${esc(note)}</p>` : ''}${invites}${groupExit}`);
    updateSection('.modern-games',modernChooser());
    updateSection('.legacy-games',history+naval+groups);
    const presence=content.querySelector('.presence');
    const presenceText=connected?(players.length?`${players.length} ${players.length===1?'andere speler':'andere spelers'} online`:'Nog niemand anders online'):'Even verbinding maken…';
    if(presence.textContent!==presenceText)presence.textContent=presenceText;
  }

  function buildUI() {
    const style = `<style>
      :host{font:14px/1.45 system-ui,sans-serif;color:var(--lb-ink,#293e47)}
      *{box-sizing:border-box}button,a{font:inherit;color:inherit}button{cursor:pointer;min-width:44px;min-height:44px;padding:8px 12px;border:1px solid var(--lb-line,#cdd8d5);border-radius:2px;background:var(--lb-surface,#faf9f4)}button:disabled{opacity:.5;cursor:default}button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid #c6a24f;outline-offset:2px}
      #panel{position:fixed;inset:12px 12px auto auto;margin:0;width:min(600px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;border:1px solid var(--lb-line,#cdd8d5);border-radius:2px;padding:0;background:var(--lb-surface,#faf9f4);color:var(--lb-ink,#293e47);box-shadow:0 16px 55px #0004;font:14px/1.45 system-ui,sans-serif;overscroll-behavior:contain}
      .head{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;border-bottom:1px solid var(--lb-line,#cdd8d5);background:var(--lb-surface,#faf9f4)}h2{margin:0;font-size:24px}.close{font-size:24px;width:44px;height:44px;padding:0;flex-shrink:0}.content{padding:16px 20px 20px}
      .game-picker-mobile{display:none}.game-picker-mobile select{width:100%;min-height:44px;padding:8px;font:inherit;color:var(--lb-ink,#183b3d);background:var(--lb-surface,#faf9f4);border:1px solid var(--lb-line,#c2cfca);border-radius:0}.game-picker-mobile select:focus-visible{outline:3px solid #c6a24f;outline-offset:2px}.mode-guide{margin:0 0 12px;font-size:13px}.game-picker{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.game-picker button{min-width:0;overflow-wrap:anywhere;padding:8px 4px;font-size:12px;font-weight:700}.game-picker button[aria-pressed="true"]{border-bottom:3px solid currentColor;background:var(--lb-hover,#e8f0e9)}.modern-game{display:flex;align-items:center;gap:12px;margin:16px 0 4px}.modern-game img{width:58px;height:46px;object-fit:cover}.modern-copy{min-width:0}.subject{font-size:10px;font-weight:750;letter-spacing:.07em;text-transform:uppercase}.modern-copy h3{margin:2px 0 0;font-size:20px;line-height:1.2}
      ${window.LeraarBobPlayModes?.css||''}
      .presence{margin:16px 0 6px;font-size:12px;opacity:.85}.legacy{border-top:1px solid var(--lb-line,#cdd8d5)}.legacy summary{display:flex;align-items:center;gap:8px;min-height:44px;cursor:pointer;font-size:13px;font-weight:700;list-style:none}.legacy summary::before{content:'+';font-size:18px}.legacy[open] summary::before{content:'−'}.legacy summary::-webkit-details-marker{display:none}
      .game-card{padding:14px 0;border-top:1px solid var(--lb-line,#cdd8d5)}.game-card h3{font-size:17px;margin:3px 0 6px}.game-card h4{font-size:13px;margin:12px 0 4px}.mode{font-size:10px;font-weight:750;text-transform:uppercase;letter-spacing:.08em}.intro,.empty{font-size:13px;margin:6px 0 10px;opacity:.85}.game-link{display:inline-flex;align-items:center;min-height:44px;font-weight:650;text-underline-offset:3px}.actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.player{display:flex;justify-content:space-between;align-items:center;gap:12px;border-top:1px solid var(--lb-line,#cdd8d5);padding:10px 0}.player div{min-width:0;overflow-wrap:anywhere}.player small{display:block;opacity:.85;font-size:12px}.player button{flex-shrink:0}.foot,.result{font-size:12px;opacity:.85;margin:8px 0}
      .invite,.error,.feedback{padding:12px;margin:0 0 12px;background:var(--lb-hover,#eef4ed);border:1px solid var(--lb-line,#9ab6ad);overflow-wrap:anywhere}.invite p{margin:0 0 10px}.primary{background:#294f66;color:#fff;border-color:#294f66}.social-notifications:empty{display:none}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
      @media(max-width:480px){.game-picker{display:none}.game-picker-mobile{display:grid;gap:5px;font-size:12px;font-weight:700}}
      @media(max-width:420px){#panel{inset:8px 8px auto;width:calc(100vw - 16px);max-height:calc(100dvh - 16px)}.head,.content{padding:12px}h2{font-size:22px}.game-picker button{font-size:11px}}
    </style>`;
    dock = document.createElement('span'); dock.id = 'axioma-social-dock'; dock.hidden = true;
    // Only an invisible live region remains outside the menu.
    const css = document.createElement('style');
    css.textContent = '#axioma-social-dock{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip-path:inset(50%);pointer-events:none}#axioma-social-dock[hidden]{display:none!important}';
    document.head.append(css);
    const root = dock.attachShadow({mode:'open'});
    root.innerHTML = `${style}<span class="sr" aria-live="polite" aria-atomic="true"></span>`;
    live = root.querySelector('.sr');
    // Separate host keeps the popover alive if a game replaces/hides its header.
    const host = document.createElement('div'); host.id = 'axioma-social-panel';
    const pRoot = host.attachShadow({mode:'open'});
    pRoot.innerHTML = `${style}<section id="panel" popover="auto" role="dialog" aria-label="Samen spelen"><div class="head"><h2>Samen spelen</h2><button class="close" aria-label="Sluiten" autofocus>×</button></div><div class="content"><div class="social-notifications"></div><p class="mode-guide">Kies je spel. Werk samen of speel een battle.</p><div class="modern-games"></div><p class="presence"></p><details class="legacy"><summary>Eerdere spellen &amp; online uitnodigen</summary><div class="legacy-games"></div></details></div></section>`;
    document.body.append(dock, host);
    panel = pRoot.querySelector('#panel'); content = pRoot.querySelector('.content');
    pRoot.querySelector('.close').onclick = () => panel.hidePopover();
    panel.addEventListener('toggle', e => {
      if (e.newState === 'closed' && returnFocus?.isConnected && !returnFocus.closest('[inert]')) returnFocus.focus();
    });
    content.onchange = e => { if(e.target.matches('select[data-action=choose-game]')){selectedGame=e.target.value;render();} };
    content.onclick = e => {
      const b = e.target.closest('button[data-action]'); if (!b || b.disabled) return;
      if (b.dataset.action === 'choose-game') { selectedGame=b.dataset.id;render();return; }
      if (b.dataset.action === 'retry') { refresh(); return; }
      if(b.dataset.action.startsWith('group-')){
        const action=b.dataset.action==='group-leave'?AxiomaGroups.leave():b.dataset.action==='group-create'?AxiomaGroups.create(5):AxiomaGroups.join(b.dataset.id);
        action.catch(error=>{note=error.message;render()});return;
      }
      act(b.dataset.action, b.dataset.action === 'invite' ? {p_target_id:b.dataset.id} : {p_invite_id:b.dataset.id});
    };
    // Some lesson headers slide away or are replaced as levels change.
    new MutationObserver(() => { if (account) mount(); }).observe(document.body, {subtree:true,childList:true,attributes:true,attributeFilter:['hidden','inert','class','style']});
  }
  const ready = (async () => {
    // Browsers copy sessionStorage when a tab is duplicated. Claim the tab id
    // so the copy cannot accept/open the same match as its original.
    if (navigator.locks) await new Promise(resolve => {
      navigator.locks.request(`axioma-social:${tabId}`, {ifAvailable:true}, lock => {
        if (!lock) {
          tabId = crypto.randomUUID();
          try { sessionStorage.setItem('axioma-social-tab',tabId); } catch {}
          resolve();
          return navigator.locks.request(`axioma-social:${tabId}`, () => new Promise(() => {}));
        }
        resolve();
        return new Promise(() => {});
      }).catch(resolve);
    });
    if (document.readyState === 'loading') await new Promise(resolve => document.addEventListener('DOMContentLoaded',resolve,{once:true}));
    await modesReady;
    await window.LeraarBobPlayModes?.ready();
    buildUI();
    AxiomaAuth.onChange(authChanged);
    try { await AxiomaAuth.ready(); authChanged({ account:await AxiomaAuth.getAccount(), session:await AxiomaAuth.getSession() }); } catch { /* Guests can still play. */ }
    return state();
  })();
  window.AxiomaSocial = Object.freeze({
    ready: () => ready, state, refresh, open,
    async answerInvitation(id, action) {
      await ready;if(!['accept','decline','cancel'].includes(action))return null;
      return act(action,{p_invite_id:id});
    },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    async invite(id, {showPanel=true}={}) { await ready; if(showPanel)open(); return act('invite',{p_target_id:id}); },
    async join(id) {
      await ready;
      const data = await request('join',{p_invite_id:id});
      const invite = data?.invitations.find(i => i.id === id && i.status === 'accepted');
      if (!invite) throw new Error('Deze partij is niet beschikbaar.');
      matchId = id; routed.add(id); emit();
      return { matchId:id, hostId:invite.sender_id, opponent:{id:mine(invite)?invite.recipient_id:invite.sender_id,alias:other(invite)} };
    },
    async finish() {
      const id = matchId; if (!id) return;
      await request('finish',{p_invite_id:id,p_match_id:null}); matchId = null; emit();
    }
  });
  window.addEventListener('pagehide', () => { clearTimeout(timer); offline(); });
  window.addEventListener('pageshow', e => { if (e.persisted) refresh(); });
  window.addEventListener('online', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('axioma:groups',render);
  const groupsScript=document.createElement('script');
  groupsScript.src=new URL('shared/axioma-groups.js',base).href;
  document.head.append(groupsScript);
})();
