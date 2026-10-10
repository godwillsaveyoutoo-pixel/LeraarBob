/* Personal OS surface. Native games and their existing providers own learning,
   sessions and scores. No account, invitation or progress store is duplicated. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const node = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const button = (label, action, cls = '') => { const b = node('button', cls, label); b.type = 'button'; b.addEventListener('click', action); return b; };
  let initialClassCode = new URLSearchParams(location.search).get('classCode');
  let initialAppPicker = new URLSearchParams(location.search).get('place') === 'all';
  let ctx, owner, epoch = 0, social, socialStop, snapshot = null, board = null, boardState = 'loading', boardRequest = 0, selectedClass = '', selectedGame = 'rechten';
  let lastBoardFetch = 0;
  let dialog, dialogBody, dialogTitle, dialogKind = '', dialogVersion = 0, returnFocus, polling, busy = false;
  const signatures = new Map();
  const identity = account => `${account?.id || 'guest'}:${account?.role || 'guest'}`;
  const games = { rechten: 'Rechtenwereld', vector: 'Vectormissie', vectoren: 'Vectormissie', equations: 'Vergelijkingen', systems: 'Stelsels' };
  const safeState = () => snapshot?.account?.id === ctx?.account?.id && ctx?.account && !ctx.authPending ? snapshot : null;
  const invitations = () => (safeState()?.invitations || []).filter(i => i.status === 'pending' && (!i.expires_at || Date.parse(i.expires_at) > Date.now()));
  const incoming = () => invitations().filter(i => i.recipient_id === ctx.account.id);
  function replace(id, signature, build) {
    const root = $(id); if (!root || signatures.get(id) === signature) return;
    signatures.set(id, signature);
    const key = root.contains(document.activeElement) ? document.activeElement.dataset.focusKey : null;
    root.replaceChildren(...build());
    if (key) root.querySelectorAll('[data-focus-key]').forEach(n => { if (n.dataset.focusKey === key) n.focus(); });
  }
  function small(text) { return node('p', 'personal-muted', text); }
  function closeDialog() { dialog?.close(); }
  function ensureDialog() {
    if (dialog) return;
    dialog = node('dialog', 'personal-dialog'); dialog.id = 'personalDialog'; dialog.setAttribute('aria-labelledby', 'personalDialogTitle');
    const heading = node('div', 'personal-dialog-heading'); dialogTitle = node('h2'); dialogTitle.id = 'personalDialogTitle';
    const close = button('×', closeDialog, 'personal-close'); close.setAttribute('aria-label', 'Sluiten');
    heading.append(dialogTitle, close); dialogBody = node('div', 'personal-dialog-body'); dialogBody.id = 'personalDialogBody'; dialog.append(heading, dialogBody); document.body.append(dialog);
    dialog.addEventListener('close', () => { const wasPicker = dialogKind === 'add'; dialogKind = ''; dialogVersion++; if (wasPicker && !$('homeView').hidden) $('pinnedApps').querySelector('.personal-add')?.focus(); else if (returnFocus?.isConnected && returnFocus.getClientRects().length && !returnFocus.closest('[hidden],[inert]')) returnFocus.focus(); else $('startButton')?.focus(); });
  }
  function openDialog(kind, title, opener) {
    ensureDialog(); if (!dialog.open) returnFocus = opener || document.activeElement;
    dialogKind = kind; dialog.dataset.kind = kind; dialogVersion++; dialogTitle.textContent = title; dialogBody.replaceChildren(); signatures.delete('personalDialogBody');
    if (!dialog.open) dialog.showModal();
  }
  function openInbox(opener) { openDialog('inbox', 'Uitnodigingen', opener); renderInbox(); social?.refresh(); }
  function renderInbox() {
    if (dialogKind !== 'inbox') return;
    const list = invitations(), s = safeState();
    replace('personalDialogBody', JSON.stringify([owner, list, busy, s?.connected]), () => {
      if (!ctx.account) return [small('Meld je aan om uitnodigingen van je klas te ontvangen.'), button('Inloggen', () => { closeDialog(); ctx.openAccount(); }, 'personal-primary')];
      const nodes = [small('Kies één uitnodiging om samen verder te gaan. De sessie controleert bij het accepteren of er nog plaats is.')];
      if (!s?.connected) nodes.push(small('Verbinding herstellen… Uitnodigingen worden opnieuw gecontroleerd zodra je verbonden bent.'));
      if (!list.length) nodes.push(node('div', 'personal-empty', 'Je hebt geen openstaande uitnodigingen.'));
      for (const i of list) {
        const mine = i.sender_id === ctx.account.id, row = node('article', 'personal-invitation');
        const name = mine ? i.recipient_alias : i.sender_alias;
        row.append(node('strong', '', `${mine ? 'Verstuurd aan' : 'Van'} ${name || 'een klasgenoot'}`), small(i.game === 'rechten-learn' ? 'Rechtenwereld · Samen leren' : i.game === 'rechten-duo' ? 'Rechtenwereld · Duo Battle' : 'Rechten Zeeslag · Duo Battle'));
        const actions = node('div', 'personal-inline-actions');
        for (const [action, label] of mine ? [['cancel', 'Intrekken']] : [['accept', 'Deelnemen'], ['decline', 'Weigeren']]) {
          const b = button(label, () => answer(i.id, action), action === 'accept' ? 'personal-primary' : '');
          b.disabled = busy || !s?.connected; b.dataset.focusKey = `${i.id}:${action}`; actions.append(b);
        }
        row.append(actions); nodes.push(row);
      }
      return nodes;
    });
  }
  async function answer(id, action) {
    if (busy || !social || !invitations().some(i => i.id === id)) return;
    const version = epoch; busy = true; renderInbox();
    try {
      const result = await social.answerInvitation(id, action);
      if (version !== epoch) return;
      if (result) {
        if (action === 'accept') closeDialog();
        else ctx.toast(action === 'cancel' ? 'Uitnodiging ingetrokken.' : 'Uitnodiging geweigerd.');
      } else ctx.toast(social.state().note || 'Dit verzoek kon niet worden verwerkt. Controleer de uitnodiging en probeer opnieuw.');
    } catch { if (version === epoch) ctx.toast('Verbinding onderbroken. Probeer opnieuw.'); }
    finally { if (version === epoch) { busy = false; snapshot = social.state(); renderSocial(); renderInbox(); } }
  }
  function renderSocial() {
    if (!ctx) return;
    const s = safeState(), count = incoming().length;
    $('invitationCount').textContent = String(count); $('invitationCount').hidden = !count;
    $('personalInbox').setAttribute('aria-label', `Uitnodigingen${count ? `, ${count} ontvangen` : ''}`);
    $('personalInbox').dataset.unread = count ? 'true' : 'false';
    $('personalClass').textContent = ctx.authPending ? 'Account controleren…' : ctx.account?.role === 'teacher' ? 'Je klasactiviteiten beginnen bij de app.' : ctx.account?.class_code ? `Klas ${ctx.account.class_code}` : 'Samen begint bij je klas.';
    $('personalConnection').textContent = !ctx.account ? 'Gast' : ctx.account.role === 'teacher' ? 'Leerkracht' : s?.connected ? 'Online' : 'Verbinden';
    $('personalConnection').dataset.online = s?.connected ? 'true' : 'false';
    const players = (s?.players || []).filter(p => p.id !== ctx.account?.id);
    replace('personalPeople', JSON.stringify([owner, players, !!s?.connected]), () => {
      if (!ctx.account) return [small('Log in om je klasgenoten te zien.'), button('Inloggen', ctx.openAccount, 'personal-wide')];
      if (ctx.account.role === 'teacher') return [small('Kies Klasbattle bij Rechtenwereld. Leerlingen sluiten aan met jouw code.')];
      if (!s?.connected) return [small('Je online klasgenoten worden opgehaald. Je kunt alvast solo oefenen.')];
      if (!players.length) return [small('Er zijn nu geen andere klasgenoten online.')];
      const rows = players.slice(0, 5).map(p => {
        const row = node('div', 'personal-person'), avatar = node('span', 'personal-initial', Array.from(p.alias || '?')[0].toUpperCase()); avatar.setAttribute('aria-hidden', 'true');
        const copy = node('span'); copy.append(node('strong', '', p.alias), node('small', '', p.status === 'playing' ? 'In een activiteit' : 'Online')); row.append(avatar, copy, node('span', `personal-presence ${p.status === 'playing' ? 'occupied' : ''}`)); return row;
      });
      if (players.length > 5) rows.push(small(`En ${players.length - 5} andere klasgenoten online.`));
      rows.push(button('Samen leren in Rechtenwereld', () => ctx.openApp('rechtenwereld', 'learn'), 'personal-wide'));
      return rows;
    });
    renderInbox();
  }
  function bindSocial() {
    if (!window.AxiomaSocial || social === window.AxiomaSocial) return;
    socialStop?.(); social = window.AxiomaSocial;
    socialStop = social.onChange(s => { snapshot = s; renderSocial(); });
    snapshot = social.state(); renderSocial();
  }
  function renderApps() {
    const M = ctx.model, cards = ctx.pins.map(M.app).filter(Boolean).map(g => {
      const card = node('article', 'personal-app'); card.dataset.appId = g.id; card.style.setProperty('--world-tint', M.theme(g.desktopTheme).color); card.dataset.world = g.desktopTheme;
      const opener = button('', () => ctx.openApp(g.id), 'personal-app-open');
      const img = node('img', 'personal-app-icon'); img.src = new URL(g.cover || 'assets/covers/graph.svg', ctx.base).href; img.alt = ''; img.loading = 'lazy';
      const name = node('div', 'personal-card-heading'); name.append(node('span', 'personal-card-kind', M.types[g.type].label), node('h3', '', g.title)); opener.append(name, img); opener.setAttribute('aria-label', `Open ${g.title}`);
      const summary = ctx.summary(g); const status = node('p', 'personal-app-status', ctx.isOpen(g) ? 'Geopend · hervatten' : summary && ['started', 'complete', 'saved'].includes(summary.status) ? summary.label : M.theme(g.desktopTheme).title);
      const actions = node('div', 'personal-app-actions'), modes = M.modes(g.id, ctx.account?.role || 'guest');
      const direct = ['solo', 'learn', ctx.account?.role === 'teacher' ? 'classroom' : 'online'];
      for (const id of direct) {
        const mode = modes.find(m => m.id === id); if (!mode) continue;
        const label = { solo: 'Solo', learn: 'Samen leren', online: 'Duo Battle', classroom: 'Klasbattle' }[id];
        const b = button(label, () => ctx.openApp(g.id, id)); b.dataset.mode = id; b.setAttribute('aria-label', `${label} · ${g.title}`); actions.append(b);
      }
      actions.dataset.modeCount = String(actions.children.length); if (actions.children.length === 1) actions.dataset.singleMode = 'true';
      if (M.worksheets(g.id).length) { const b = button('Oefenbladen', () => ctx.showView({ kind: 'worksheets', themeId: g.desktopTheme })); b.dataset.worksheets = g.id; actions.append(b); }
      const more = button('•••', () => openAppMenu(g, more), 'personal-app-more'); more.setAttribute('aria-label', `Meer opties voor ${g.title}`); more.setAttribute('aria-haspopup', 'dialog');
      card.addEventListener('contextmenu', e => { if (e.target.closest('a,input,textarea')) return; e.preventDefault(); openAppMenu(g, more); });
      card.addEventListener('keydown', e => { if (e.key === 'ContextMenu' || e.shiftKey && e.key === 'F10') { e.preventDefault(); openAppMenu(g, more); } });
      card.append(opener, status, actions, more); return card;
    });
    const add = button('', () => openAppPicker(add), 'personal-add'); add.setAttribute('aria-haspopup', 'dialog'); add.append(node('span', 'personal-add-symbol', '+'), node('strong', '', 'Toevoegen'), node('small', '', 'Kies je volgende wereld')); cards.push(add);
    $('pinnedApps').replaceChildren(...cards);
  }
  function openAppPicker(opener) {
    openDialog('add', 'Apps toevoegen', opener);
    const list = node('div', 'personal-picker-list'); list.tabIndex = 0; list.setAttribute('role', 'region'); list.setAttribute('aria-label', 'Apps per thema');
    const apps = ctx.model.apps();
    for (const theme of ctx.model.themes) {
      const choices = apps.filter(g => g.desktopTheme === theme.id); if (!choices.length) continue;
      const section = node('section', 'personal-picker-theme'), heading = node('h3', '', theme.title), rows = node('ul', 'personal-picker-apps');
      heading.id = 'picker-theme-' + theme.id; section.setAttribute('aria-labelledby', heading.id); section.style.setProperty('--picker-tint', theme.color);
      for (const g of choices) {
        const row = node('li', 'personal-picker-app'), img = node('img'); img.src = new URL(g.cover || 'assets/covers/graph.svg', ctx.base).href; img.alt = ''; img.loading = 'lazy'; img.width = 56; img.height = 56;
        const add = button('+', () => { if (!ctx.authPending && !ctx.pins.includes(g.id) && ctx.pins.length < 12) ctx.togglePin(g.id); }, 'personal-picker-add'); add.dataset.pickApp = g.id;
        const copy = node('span', 'personal-picker-copy'), kind = node('small', 'personal-picker-type', ctx.model.types[g.type].label); kind.id = 'picker-type-' + g.id; add.setAttribute('aria-describedby', kind.id);
        copy.append(node('strong', '', g.title), kind); row.append(img, copy, add); rows.append(row);
      }
      section.append(heading, rows); list.append(section);
    }
    const footer = node('div', 'personal-picker-footer'), status = node('p', 'personal-muted'); status.id = 'pickerStatus'; status.setAttribute('role', 'status');
    footer.append(status, button('Klaar', closeDialog, 'personal-primary')); dialogBody.append(list, footer); syncAppPicker();
  }
  function syncAppPicker() {
    if (dialogKind !== 'add') return;
    const full = ctx.pins.length >= 12;
    dialogBody.querySelectorAll('[data-pick-app]').forEach(b => {
      const added = ctx.pins.includes(b.dataset.pickApp), title = ctx.model.app(b.dataset.pickApp).title;
      b.textContent = added ? '✓' : '+'; b.dataset.added = String(added); b.setAttribute('aria-disabled', String(added || full || ctx.authPending));
      b.setAttribute('aria-label', added ? `${title} staat op je bureaublad` : `${title} toevoegen`); b.title = added ? 'Toegevoegd' : full ? 'Je bureaublad is vol' : 'Toevoegen';
    });
    $('pickerStatus').textContent = full ? 'Je hebt 12 apps. Verwijder eerst een app van je bureaublad om plaats te maken.' : `${ctx.pins.length} ${ctx.pins.length === 1 ? 'app' : 'apps'} op je bureaublad`;
  }
  function openAppMenu(g, opener) {
    openDialog('app', g.title, opener); dialogBody.append(small(g.subtitle));
    for (const m of ctx.model.modes(g.id, ctx.account?.role || 'guest')) dialogBody.append(button(ctx.model.modeLabel(m), () => { closeDialog(); ctx.openApp(g.id, m.id); }, 'personal-menu-action'));
    if (ctx.model.worksheets(g.id).length) dialogBody.append(button('Oefenbladen maken & terugvinden', () => { closeDialog(); ctx.showView({ kind: 'worksheets', themeId: g.desktopTheme }); }, 'personal-menu-action'));
    dialogBody.append(button('Van mijn bureaublad verwijderen', () => { closeDialog(); ctx.togglePin(g.id); $('pinnedApps').querySelector('.personal-add').focus(); }, 'personal-menu-action personal-remove'));
  }
  async function refreshBoards() {
    if (!ctx?.account || ctx.authPending || !['student', 'teacher'].includes(ctx.account.role)) return;
    const version = epoch, turn = ++boardRequest; lastBoardFetch = Date.now();
    try {
      const api = window.AxiomaAuth?.client(); if (!api) throw Error('Geen verbinding');
      let timeout; const query = api.rpc('axioma_class_battle_hub', { p_action: 'overview', p_data: { class: selectedClass || undefined } });
      let response; try { response = await Promise.race([query, new Promise((_, reject) => { timeout = setTimeout(() => reject(Error('Geen verbinding')), 15000); })]); } finally { clearTimeout(timeout); }
      const { data, error } = response;
      if (version !== epoch || turn !== boardRequest) return;
      if (error || !Array.isArray(data?.leaderboards) || !Array.isArray(data?.rooms)) throw Error('Geen ranglijst');
      board = data; boardState = 'ready';
    } catch { if (version !== epoch || turn !== boardRequest) return; board = null; boardState = 'error'; }
    renderBoards(); renderSession();
  }
  function rankingRows(rows) {
    const list = node('ol', 'personal-ranking');
    rows.forEach(r => { const item = node('li', r.mine ? 'is-mine' : ''); item.append(node('span', 'personal-place', String(r.place)), node('strong', '', r.alias), node('span', 'personal-points', `${r.points} pt`)); if (r.mine) item.setAttribute('aria-label', `${r.place}. ${r.alias}, jij, ${r.points} punten`); list.append(item); }); return list;
  }
  function renderBoards() {
    if (!ctx) return;
    const rows = (board?.leaderboards || []).filter(r => r.game === 'rechten');
    replace('personalRankingPreview', JSON.stringify([owner, boardState, board?.class, rows]), () => {
      if (!ctx.account) return [small('Meld je aan om de ranglijst van je klas te bekijken.')];
      if (boardState === 'loading') return [small('Ranglijsten ophalen…')];
      if (boardState === 'error') return [small('Ranglijsten zijn even niet bereikbaar. Je resultaten blijven bij de bestaande spellen.')];
      if (ctx.account.role === 'teacher' && !board?.class) return [small('Kies een klas om de echte resultaten te bekijken.')];
      return rows.length ? [node('p', 'personal-ranking-world', 'Rechtenwereld'), rankingRows(rows.slice(0, 3))] : [small('Nog geen afgeronde klasbattle in Rechtenwereld. Elke wereld houdt zijn eigen score.')];
    });
    if (dialogKind === 'rankings') renderRankingDialog();
  }
  function openRankings() { openDialog('rankings', 'Ranglijsten'); renderRankingDialog(); refreshBoards(); }
  function renderRankingDialog() {
    replace('personalDialogBody', JSON.stringify([owner, boardState, board, selectedClass, selectedGame]), () => {
      const nodes = [small('Punten uit afgeronde klasbattles. Werelden hebben elk hun eigen ranglijst; dit is geen XP-omrekening.')];
      if (!ctx.account) return [...nodes, button('Inloggen', () => { closeDialog(); ctx.openAccount(); }, 'personal-primary')];
      if (boardState === 'loading') return [...nodes, small('Ranglijsten ophalen…')];
      if (boardState === 'error') return [...nodes, small('De ranglijst kon niet laden.'), button('Opnieuw proberen', refreshBoards, 'personal-primary')];
      const filters = node('div', 'personal-ranking-filters');
      if (ctx.account.role === 'teacher') {
        const label = node('label', '', 'Klas'), select = node('select'); select.setAttribute('aria-label', 'Klas voor ranglijst'); select.dataset.focusKey = 'ranking-class';
        select.append(new Option('Kies een klas', '')); (board.classes || []).filter(Boolean).forEach(c => select.append(new Option(c, c))); select.value = selectedClass;
        select.addEventListener('change', () => { selectedClass = select.value; boardState = 'loading'; board = null; renderBoards(); refreshBoards(); }); label.append(select); filters.append(label);
      } else nodes.push(node('p', 'personal-ranking-world', board.class ? `Klas ${board.class}` : 'Geen klas gekoppeld'));
      const label = node('label', '', 'Wereld'), select = node('select'); select.setAttribute('aria-label', 'Wereld voor ranglijst'); select.dataset.focusKey = 'ranking-game';
      const ids = [...new Set(['rechten', ...(board.leaderboards || []).map(r => r.game)])]; ids.forEach(id => select.append(new Option(games[id] || id, id))); select.value = selectedGame;
      select.addEventListener('change', () => { selectedGame = select.value; renderRankingDialog(); }); label.append(select); filters.append(label); nodes.push(filters);
      const rows = (board.leaderboards || []).filter(r => r.game === selectedGame);
      nodes.push(rows.length ? rankingRows(rows) : small(ctx.account.role === 'teacher' && !selectedClass ? 'Kies eerst je klas.' : 'Nog geen afgeronde klasbattles voor deze wereld.'));
      nodes.push(button('Vernieuwen', refreshBoards, 'personal-wide')); return nodes;
    });
  }
  function renderSession() {
    const room = board?.rooms?.find(r => r.active && r.game === 'rechten');
    $('personalSession').hidden = !room;
    replace('personalSession', JSON.stringify([owner, room]), () => {
      if (!room) return [];
      const copy = node('div'); copy.append(node('strong', '', room.owner ? 'Jouw klasbattle staat klaar' : 'Je klasbattle is nog open'), node('span', '', `Rechtenwereld · code ${room.code || ''}`));
      return [node('span', 'personal-session-dot'), copy, button('Terug naar de klasbattle →', () => ctx.joinClass(room), 'personal-primary')];
    });
  }
  function openCode(code = '') {
    openDialog('code', 'Deelnemen met klascode');
    if (!ctx.account) { dialogBody.append(small('Meld je aan met je leerlingaccount om deel te nemen.'), button('Inloggen', () => { closeDialog(); ctx.openAccount(); }, 'personal-primary')); return; }
    if (ctx.account.role === 'teacher') { dialogBody.append(small('Een klasbattle starten doe je bij Rechtenwereld. Leerlingen gebruiken de klascode om deel te nemen.'), button('Klasbattle starten', () => { closeDialog(); ctx.openApp('rechtenwereld', 'classroom'); }, 'personal-primary')); return; }
    dialogBody.append(small('Vul de code van je Rechtenwereld-klasbattle in. Je gaat rechtstreeks naar de wachtkamer.'));
    const form = node('form', 'personal-code'), label = node('label', '', 'Klascode'), input = node('input'); input.name = 'code'; input.autocomplete = 'off'; input.maxLength = 6; input.required = true; input.pattern = '[A-Fa-f0-9]{6}'; input.placeholder = 'A1B2C3'; input.value = typeof code === 'string' && /^[a-f0-9]{6}$/i.test(code) ? code : ''; input.setAttribute('aria-label', 'Klascode'); label.append(input);
    const submit = node('button', 'personal-primary', 'Deelnemen'); submit.type = 'submit'; const status = node('p', 'personal-muted'); status.setAttribute('role', 'status'); form.append(label, submit, status); dialogBody.append(form);
    form.addEventListener('submit', async e => {
      e.preventDefault(); if (submit.disabled) return; const version = epoch, opened = dialogVersion; submit.disabled = true; status.textContent = 'Code controleren…';
      try {
        const { data, error } = await window.AxiomaAuth.client().rpc('axioma_class_battle_hub', { p_action: 'code', p_data: { code: input.value.trim().toUpperCase() } });
        if (version !== epoch || opened !== dialogVersion || dialogKind !== 'code') return;
        if (error || !data?.game) throw Error(error?.message || 'Deze code is niet meer beschikbaar.');
        if (data.game !== 'rechten') { status.textContent = 'Dit is een andere wereld. Open Samen & live via Start om daar deel te nemen.'; return; }
        if (ctx.joinClass(data)) closeDialog(); else status.textContent = 'Sluit eerst een geopende app om deel te nemen.';
      } catch (error) { if (version === epoch) status.textContent = error.message || 'Controleer je verbinding en probeer opnieuw.'; }
      finally { if (version === epoch) submit.disabled = false; }
    });
    input.focus();
  }
  function render(context) {
    ctx = context; const nextOwner = identity(ctx.account);
    if (owner !== nextOwner) {
      owner = nextOwner; epoch++; boardRequest++; busy = false; board = null; boardState = 'loading'; selectedClass = ''; selectedGame = 'rechten'; signatures.clear(); closeDialog(); snapshot = null;
      refreshBoards();
    }
    if (!$('homeView').hidden && Date.now() - lastBoardFetch > 5000) refreshBoards();
    renderApps(); syncAppPicker(); bindSocial(); if (social) snapshot = social.state(); renderSocial(); renderBoards(); renderSession();
    $('personalInbox').onclick = () => openInbox($('personalInbox'));
    $('personalRankings').onclick = openRankings; $('personalClassCode').onclick = () => openCode(); $('personalClassCode').hidden = ctx.account?.role === 'teacher';
    if (!ctx.authPending && initialAppPicker) { initialAppPicker = false; openAppPicker(); }
    if (!ctx.authPending && /^[a-f0-9]{6}$/i.test(initialClassCode || '')) { const code = initialClassCode; initialClassCode = null; openCode(code); }
    if (!polling) polling = setInterval(() => { bindSocial(); if (!document.hidden && (!$('homeView').hidden || dialogKind === 'rankings')) refreshBoards(); }, 30000);
  }
  // Topbar, native Learn and the desktop all open this same invitation surface.
  document.addEventListener('leraarbob:social-open', e => { if (!ctx) return; e.preventDefault(); openInbox(e.detail?.opener); });
  document.addEventListener('load', e => { if (e.target.tagName === 'SCRIPT') bindSocial(); }, true);
  window.addEventListener('focus', () => { bindSocial(); if (ctx && !$('homeView').hidden) refreshBoards(); });
  window.addEventListener('pageshow', e => { if (e.persisted && ctx) render(ctx); });
  window.addEventListener('pagehide', () => { clearInterval(polling); polling = null; socialStop?.(); social = null; });
  window.LeraarBobPersonalHome = Object.freeze({ render, openAppPicker, openRankings, openClassCode: openCode, refreshClasses: refreshBoards });
})();
