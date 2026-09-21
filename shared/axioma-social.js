(() => {
  'use strict';
  // One shared service per top-level page; catalog previews never go online.
  if (window !== window.top || window.AxiomaSocial || new URLSearchParams(location.search).get('demo') === '1') return;
  const base = new URL('../', document.currentScript.src);
  const gameURL = new URL('games/rechten/zeeslag/', base);
  let tabId;
  try {
    tabId = sessionStorage.getItem('axioma-social-tab') || crypto.randomUUID();
    sessionStorage.setItem('axioma-social-tab', tabId);
  } catch { tabId = crypto.randomUUID(); }
  let account = null, token = null, epoch = 0, timer = null, queue = Promise.resolve();
  let matchId = null, snapshot = { players: [], invitations: [] }, connected = false;
  let note = '', pending = false, navigating = false, dock, panel, toggle, content, live;
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
  function open() { panel.showPopover(); toggle.setAttribute('aria-expanded','true'); refresh(); }
  function mount() {
    if (!dock || !account) return;
    const header = [...document.querySelectorAll('.header-actions'), ...document.querySelectorAll('header')].find(el => {
      const r = el.getBoundingClientRect();
      return r.width && r.height && r.top >= -5 && r.bottom <= innerHeight && !el.closest('[inert]') && getComputedStyle(el).visibility !== 'hidden';
    });
    const parent = header || document.body;
    if (dock.parentNode !== parent) parent.append(dock);
    if (dock.classList.contains('floating') === !!header) dock.classList.toggle('floating', !header);
  }
  function render() {
    if (!dock) return;
    dock.hidden = !account;
    if (!account) { if (panel.matches(':popover-open')) panel.hidePopover(); return; }
    mount();
    const incoming = activeInvites().filter(i => !mine(i));
    const players = snapshot.players.filter(p => p.id !== account.id);
    const label = incoming.length ? 'Uitnodiging!' : connected ? `${players.length} online` : 'Offline';
    toggle.textContent = incoming.length ? '✉ ' + label : '● ' + label;
    toggle.setAttribute('aria-label', incoming.length ? 'Nieuwe speluitnodiging. Open om te accepteren of weigeren.' : `${players.length} andere spelers online. Bekijk spelers en uitnodigingen.`);
    toggle.classList.toggle('notice', !!incoming.length);
    const announcement = incoming.length ? `${incoming[0].sender_alias} nodigt je uit voor Rechten Zeeslag. Klik op Uitnodiging in de bovenste balk.` : '';
    if (live.textContent !== announcement) live.textContent = announcement;
    // Keep focused controls intact during the regular background poll.
    const disabled = pending || !connected ? 'disabled' : '';
    const active = snapshot.invitations.some(i => ['pending','accepted'].includes(i.status));
    const invites = snapshot.invitations.map(i => {
      const name = esc(other(i));
      if (i.status === 'pending') return `<div class="invite"><p><strong>${name}</strong> ${mine(i) ? 'is uitgenodigd voor' : 'wil met je spelen:'} Rechten Zeeslag.</p><div class="actions">${mine(i) ? `<span>Wachten op antwoord…</span><button data-action="cancel" data-id="${i.id}" ${disabled}>Intrekken</button>` : `<button data-action="accept" data-id="${i.id}" class="primary" ${disabled}>Accepteren</button><button data-action="decline" data-id="${i.id}" ${disabled}>Weigeren</button>`}</div></div>`;
      if (i.status === 'accepted') return `<p class="result">Partij met <strong>${name}</strong> ${matchId === i.id ? 'bezig.' : 'geaccepteerd. Open het tabblad van je uitnodiging.'}</p>`;
      const text = { declined:'Uitnodiging geweigerd', cancelled:'Uitnodiging ingetrokken', expired:'Uitnodiging verlopen', finished:'Partij afgelopen' }[i.status];
      return text ? `<p class="result">${name} · ${text}</p>` : '';
    }).join('');
    const html = `<p class="intro">Nodig iemand uit voor <strong>Rechten Zeeslag</strong>, ook vanuit een ander spel.</p>${!connected ? '<p class="error" role="status">Verbinding herstellen… <button data-action="retry">Opnieuw proberen</button></p>' : ''}${note ? `<p class="feedback" role="status">${esc(note)}</p>` : ''}${invites}<h3>Online op leraarBob</h3>${players.length ? players.map(p => `<div class="player"><div><strong>${esc(p.alias)}</strong><small>${esc(p.class_code)}${p.class_code ? ' · ' : ''}${p.status === 'playing' ? 'In Zeeslag' : 'Beschikbaar'}</small></div><button data-action="invite" data-id="${p.id}" ${disabled || active || p.status === 'playing' ? 'disabled' : ''}>Uitnodigen</button></div>`).join('') : '<p class="empty">Nog niemand anders online.</p>'}<p class="foot">Uitnodigingen vervallen na 90 seconden.</p>`;
    if (content.innerHTML !== html) content.innerHTML = html;
  }
  function buildUI() {
    const style = `<style>
      :host{font:14px/1.45 system-ui,sans-serif;color:#293e47;color-scheme:light}
      *{box-sizing:border-box}button{font:inherit;cursor:pointer;border:1px solid #cdd8d5;border-radius:8px;padding:8px 12px;background:#faf9f4;color:#293e47;min-height:38px}button:disabled{opacity:.5;cursor:default}button:focus-visible{outline:3px solid #987839;outline-offset:2px}
      .toggle{white-space:nowrap;font-weight:650;font-size:13px;padding:7px 10px}.notice,.primary{background:#294f66;color:white;border-color:#294f66}.notice{box-shadow:0 0 0 3px #eee2bd}
      #panel{position:fixed;inset:70px 12px auto auto;margin:0;width:min(410px,calc(100vw - 24px));max-height:calc(100dvh - 90px);overflow:auto;border:1px solid #cdd8d5;border-radius:14px;padding:20px;background:#faf9f4;color:#293e47;box-shadow:0 16px 55px #20313b33;font:14px/1.45 system-ui,sans-serif}
      .head{display:flex;align-items:center;justify-content:space-between;gap:12px}h2{margin:0;font-size:21px}h3{font-size:14px;margin:22px 0 8px}.close{font-size:22px;padding:0 10px}.intro,.foot,.empty,.result{color:#657a80}.foot{font-size:12px;margin-bottom:0}.invite{padding:12px;border:1px solid #9ab6ad;border-radius:10px;margin:12px 0;background:#eef4ed}.invite p{margin:0 0 12px}.actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.player{display:flex;justify-content:space-between;align-items:center;gap:12px;border-top:1px solid #cdd8d5;padding:12px 0}.player div{min-width:0;overflow-wrap:anywhere}.player small{display:block;color:#657a80}.result{font-size:12px;margin:8px 0}.error,.feedback{padding:10px;background:#eee2bd;border-radius:8px}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
      @media(max-width:420px){.toggle{font-size:11px;padding:5px 7px;min-height:34px}}
    </style>`;
    dock = document.createElement('span'); dock.id = 'axioma-social-dock'; dock.hidden = true;
    // Only host positioning escapes the shadow root; existing games keep their styles.
    const css = document.createElement('style');
    css.textContent = '#axioma-social-dock{display:inline-flex;flex:0 0 auto;margin-inline:6px;vertical-align:middle;position:relative;z-index:10001}#axioma-social-dock[hidden]{display:none!important}#axioma-social-dock.floating{position:fixed;top:10px;right:10px}';
    document.head.append(css);
    const root = dock.attachShadow({mode:'open'});
    root.innerHTML = `${style}<button class="toggle" aria-expanded="false" aria-haspopup="dialog">Online</button><span class="sr" aria-live="polite" aria-atomic="true"></span>`;
    toggle = root.querySelector('button'); live = root.querySelector('.sr');
    // Separate host keeps the popover alive if a game replaces/hides its header.
    const host = document.createElement('div'); host.id = 'axioma-social-panel';
    const pRoot = host.attachShadow({mode:'open'});
    pRoot.innerHTML = `${style}<section id="panel" popover="auto" role="dialog" aria-label="Online spelers en uitnodigingen"><div class="head"><h2>Samen spelen</h2><button class="close" aria-label="Sluiten" autofocus>×</button></div><div class="content"></div></section>`;
    document.body.append(dock, host);
    panel = pRoot.querySelector('#panel'); content = pRoot.querySelector('.content');
    toggle.onclick = () => panel.matches(':popover-open') ? panel.hidePopover() : open();
    pRoot.querySelector('.close').onclick = () => { panel.hidePopover(); toggle.focus(); };
    panel.addEventListener('toggle', e => toggle.setAttribute('aria-expanded', String(e.newState === 'open')));
    content.onclick = e => {
      const b = e.target.closest('button[data-action]'); if (!b || b.disabled) return;
      if (b.dataset.action === 'retry') { refresh(); return; }
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
})();
