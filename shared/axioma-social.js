(() => {
  'use strict';
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
  function state() { return { ...snapshot, account, connected, matchId, tabId }; }
  function route(invite) {
    if (matchId || navigating || routed.has(invite.id)) return;
    try { if (sessionStorage.getItem(`axioma-social-opened:${invite.id}`)) return; } catch {}
    if ((mine(invite) ? invite.sender_tab : invite.recipient_tab) !== tabId) return;
    // The game consumes the URL itself after validating membership server-side.
    if (location.pathname === gameURL.pathname && new URLSearchParams(location.search).get('match') === invite.id) return;
    routed.add(invite.id);
    try { sessionStorage.setItem(`axioma-social-opened:${invite.id}`, '1'); } catch {}
    navigating = true;
    const url = new URL(gameURL); url.searchParams.set('match', invite.id);
    location.assign(url.href);
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
  async function refresh() {
    clearTimeout(timer);
    if (!account) return;
    const version = epoch;
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
    matchId = null; snapshot = { players:[], invitations:[] }; connected = false; note = ''; navigating = false;
    emit();
    if (account) refresh();
  }
  async function act(action, args = {}) {
    if (pending || !account) return null;
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
    returnFocus = opener || document.querySelector('leraarbob-topbar')?.shadowRoot?.querySelector('.menu') || document.activeElement;
    panel.showPopover();
    panel.querySelector('.close').focus();
    refresh();
  }
  function mount() {
    // Presence never occupies the header or playfield. Collapsing closes its panel.
    if (panel && document.body.classList.contains('topbar-collapsed') && panel.matches(':popover-open')) panel.hidePopover();
  }
  const modernGames = [
    {name:'Rechtenwereld',subject:'Rechten',path:'games/rechten/rechtenwereld/',cover:'rechtenwereld'},
    {name:'Wortelbouw',subject:'Pythagoras & wortels',path:'games/wortelbouw_pro_v0.5.0/wortelbouw/',cover:'wortelbouw'},
    {name:'Vectormissie',subject:'Vectoren',path:'games/vectoren/',cover:'vectormissie'}
  ];
  function updateSection(selector, html) {
    const section=content.querySelector(selector);
    if(section.innerHTML===html)return;
    const focused=content.getRootNode().activeElement;
    const restore=section.contains(focused)?{action:focused.dataset.action,id:focused.dataset.id,href:focused.getAttribute('href')}:null;
    const scroll=panel.scrollTop;
    section.innerHTML=html;
    if(restore){
      const next=[...section.querySelectorAll('button,a')].find(n=>restore.action?n.dataset.action===restore.action&&n.dataset.id===restore.id:restore.href&&n.getAttribute('href')===restore.href);
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
    const announcement = incoming.length ? `${incoming[0].sender_alias} nodigt je uit voor Rechten Zeeslag. Open 'Samen spelen' in het menu om te antwoorden.` : '';
    if (live.textContent !== announcement) live.textContent = announcement;
    // Keep focused controls intact during the regular background poll.
    const disabled = pending || !connected ? 'disabled' : '';
    const active = snapshot.invitations.some(i => ['pending','accepted'].includes(i.status));
    const invites = snapshot.invitations.filter(i=>['pending','accepted'].includes(i.status)).map(i => {
      const name = esc(other(i));
      if (i.status === 'pending') return `<div class="invite"><p><strong>${name}</strong> ${mine(i) ? 'is uitgenodigd voor' : 'wil met je spelen:'} Rechten Zeeslag.</p><div class="actions">${mine(i) ? `<span>Wachten op antwoord…</span><button data-action="cancel" data-id="${i.id}" ${disabled}>Intrekken</button>` : `<button data-action="accept" data-id="${i.id}" class="primary" ${disabled}>Accepteren</button><button data-action="decline" data-id="${i.id}" ${disabled}>Weigeren</button>`}</div></div>`;
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
    const groupLabel=account.role==='teacher'?'Start groepsbattle':'Meedoen met code';
    const modern=modernGames.map(game=>`<article class="modern-game"><img src="${esc(new URL('assets/covers/modern/'+game.cover+'-small.webp',base).href)}" alt=""><div class="modern-copy"><span class="subject">${game.subject}</span><h3>${game.name}</h3></div><div class="mode-links"><a href="${esc(new URL(game.path+'battle.html',base).href)}" aria-label="${game.name}: duo op één scherm"><span>Duo</span><span aria-hidden="true">↗</span></a><a href="${esc(new URL(game.path+'classroom.html',base).href)}" aria-label="${game.name}: ${groupLabel}"><span>${groupLabel}</span><span aria-hidden="true">↗</span></a></div></article>`).join('');
    updateSection('.social-notifications',`${!connected ? '<p class="error" role="status">Verbinding herstellen… <button data-action="retry">Opnieuw proberen</button></p>' : ''}${note ? `<p class="feedback" role="status">${esc(note)}</p>` : ''}${invites}${groupExit}`);
    updateSection('.modern-games',modern);
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
      .mode-guide{display:flex;flex-wrap:wrap;gap:4px 18px;font-size:12px;margin:0 0 14px;opacity:.9}.mode-guide strong{font-weight:750}.modern-games{display:grid;gap:12px}.modern-game{display:grid;grid-template-columns:68px minmax(0,1fr);gap:10px 14px;padding:12px;border:1px solid var(--lb-line,#cdd8d5);background:var(--lb-hover,#284d3808)}.modern-game img{width:68px;height:56px;object-fit:cover;grid-row:1}.modern-copy{align-self:center;min-width:0}.subject{font-size:10px;font-weight:750;letter-spacing:.07em;text-transform:uppercase}.modern-copy h3{margin:3px 0 0;font-size:19px;line-height:1.2}.mode-links{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:10px}.mode-links a{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:44px;padding:8px 12px;border:1px solid var(--lb-line,#cdd8d5);background:var(--lb-surface,#faf9f4);font-size:13px;font-weight:700;text-decoration:none}.mode-links a:hover{background:var(--lb-hover,#284d3810)}
      .presence{margin:16px 0 6px;font-size:12px;opacity:.85}.legacy{border-top:1px solid var(--lb-line,#cdd8d5)}.legacy summary{display:flex;align-items:center;gap:8px;min-height:44px;cursor:pointer;font-size:13px;font-weight:700;list-style:none}.legacy summary::before{content:'+';font-size:18px}.legacy[open] summary::before{content:'−'}.legacy summary::-webkit-details-marker{display:none}
      .game-card{padding:14px 0;border-top:1px solid var(--lb-line,#cdd8d5)}.game-card h3{font-size:17px;margin:3px 0 6px}.game-card h4{font-size:13px;margin:12px 0 4px}.mode{font-size:10px;font-weight:750;text-transform:uppercase;letter-spacing:.08em}.intro,.empty{font-size:13px;margin:6px 0 10px;opacity:.85}.game-link{display:inline-flex;align-items:center;min-height:44px;font-weight:650;text-underline-offset:3px}.actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.player{display:flex;justify-content:space-between;align-items:center;gap:12px;border-top:1px solid var(--lb-line,#cdd8d5);padding:10px 0}.player div{min-width:0;overflow-wrap:anywhere}.player small{display:block;opacity:.85;font-size:12px}.player button{flex-shrink:0}.foot,.result{font-size:12px;opacity:.85;margin:8px 0}
      .invite,.error,.feedback{padding:12px;margin:0 0 12px;background:var(--lb-hover,#eef4ed);border:1px solid var(--lb-line,#9ab6ad);overflow-wrap:anywhere}.invite p{margin:0 0 10px}.primary{background:#294f66;color:#fff;border-color:#294f66}.social-notifications:empty{display:none}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
      @media(max-width:420px){#panel{inset:8px 8px auto;width:calc(100vw - 16px);max-height:calc(100dvh - 16px)}.head{padding:12px}.content{padding:12px}.modern-game{padding:10px;gap:8px 10px;grid-template-columns:54px minmax(0,1fr)}.modern-game img{width:54px;height:48px}.modern-copy h3{font-size:17px}.mode-links{gap:8px}.mode-links a{padding:8px;font-size:12px}.subject{font-size:9px}.mode-guide{font-size:11px;gap:3px 12px}h2{font-size:22px}}
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
    pRoot.innerHTML = `${style}<section id="panel" popover="auto" role="dialog" aria-label="Samen spelen"><div class="head"><h2>Samen spelen</h2><button class="close" aria-label="Sluiten" autofocus>×</button></div><div class="content"><div class="social-notifications"></div><p class="mode-guide"><span><strong>Duo</strong> · samen op één scherm</span><span><strong>Groepsbattle</strong> · elk een toestel</span></p><div class="modern-games"></div><p class="presence"></p><details class="legacy"><summary>Eerdere spellen &amp; online uitnodigen</summary><div class="legacy-games"></div></details></div></section>`;
    document.body.append(dock, host);
    panel = pRoot.querySelector('#panel'); content = pRoot.querySelector('.content');
    pRoot.querySelector('.close').onclick = () => panel.hidePopover();
    panel.addEventListener('toggle', e => {
      if (e.newState === 'closed' && returnFocus?.isConnected && !returnFocus.closest('[inert]')) returnFocus.focus();
    });
    content.onclick = e => {
      const b = e.target.closest('button[data-action]'); if (!b || b.disabled) return;
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
    buildUI();
    AxiomaAuth.onChange(authChanged);
    try { await AxiomaAuth.ready(); authChanged({ account:await AxiomaAuth.getAccount(), session:await AxiomaAuth.getSession() }); } catch { /* Guests can still play. */ }
    return state();
  })();
  window.AxiomaSocial = Object.freeze({
    ready: () => ready, state, refresh, open,
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    async invite(id) { await ready; open(); return act('invite',{p_target_id:id}); },
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
