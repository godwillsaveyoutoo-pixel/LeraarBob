(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const grid = $('grid');
  const featuredGrid = $('featuredGrid');
  const reserve = $('reserve');
  const reserveGames = () => allGames.filter(game => !game.featured);
  const filters = $('filters');
  const search = $('search');
  let allGames = [];
  let active = 'Alles';
  let account = null;
  let overview = null;
  let progressState = 'guest';
  let progressRequest = 0;
  let progressController = null;
  let accountResolved = false;
  const kinds = { train: ['Oefenen', 'Start met oefenen'], learn: ['Verkennen', 'Start met verkennen'], game: ['Spelen', 'Open het spel'], arcade: ['Spelen', 'Open het spel'] };
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function localUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const base = new URL('./', location.href);
      const url = new URL(value, base);
      return url.origin === base.origin && url.protocol === base.protocol && url.pathname.startsWith(base.pathname) ? url.href : null;
    } catch { return null; }
  }
  function matchesCategory(game, category) {
    return category === 'Alles' || (game.theme || game.category) === category;
  }
  function renderFilters() {
    const categories = ['Alles', ...new Set(reserveGames().map(game => game.theme || game.category).filter(Boolean))];
    filters.replaceChildren();
    for (const category of [...new Set(categories)]) {
      const button = element('button', 'filter', category);
      button.type = 'button';
      button.dataset.filter = category;
      if (category !== 'Alles') button.dataset.topic = category;
      button.setAttribute('aria-pressed', String(category === active));
      button.append(element('span', 'filter-count', String(reserveGames().filter(game => matchesCategory(game, category)).length)));
      filters.append(button);
    }
  }
  function updatePlayerProgress() {
    const student = account?.role === 'student';
    $('playerTotals').hidden = !student;
    $('progressLogin').hidden = !!account;
    const totals = student && progressState === 'ready' ? window.LeraarBobCatalogProgress.aggregate(allGames, overview) : null;
    $('totalXP').textContent = totals ? totals.xp.toLocaleString('nl-BE') : '—';
    $('totalCompleted').textContent = totals ? totals.completed.toLocaleString('nl-BE') : '—';
    $('playerProgressStatus').textContent = !account ? 'Met je centrale leraarBob-account.' : !student ? 'Je bent aangemeld als leerkracht.' : progressState === 'loading' ? 'Je voortgang wordt geladen…' : !totals ? 'Je totaalscore is tijdelijk niet beschikbaar.' : 'Bewaard bij je leraarBob-account.';
    $('playerProgress').setAttribute('aria-busy', String(student && progressState === 'loading'));
    $('progressBreakdown').hidden = !totals;
    $('progressGames').replaceChildren();
    $('progressReserveGames').replaceChildren();
    for (const entry of totals?.entries || []) {
      const game = allGames.find(g => g.id === entry.id);
      const row = element('li', 'progress-game');
      if (game?.featured) {
        const cover = element('img', 'progress-cover'); cover.src = localUrl(game.coverSmall || game.cover); cover.alt = ''; cover.loading = 'lazy'; row.append(cover);
        row.append(element('span', 'progress-subject', game.subject));
      }
      const link = element('a', 'progress-game-link', entry.title); link.href = localUrl(entry.href);
      row.append(link, element('span', 'progress-game-label', entry.label), element('span', 'progress-game-xp', entry.xp === null ? '' : entry.xp.toLocaleString('nl-BE') + ' XP'));
      if (game?.featured) {
        const progress = window.LeraarBobCatalogProgress.summarize(game, window.LeraarBobCatalogProgress.savedFor(game, overview));
        if (progress.max) { const meter = element('progress', ''); meter.max = progress.max; meter.value = progress.value; meter.setAttribute('aria-label', entry.title + ': ' + entry.label); row.append(meter); }
      }
      $(game?.featured ? 'progressGames' : 'progressReserveGames').append(row);
    }
  }
  function updateProgress() {
    updatePlayerProgress();
    const student = account?.role === 'student';
    for (const card of document.querySelectorAll('.card[data-game-id]')) {
      const game = allGames.find(item => item.id === card.dataset.gameId);
      if (!game) continue;
      const root = card.querySelector('.card-progress');
      const detail = card.querySelector('.card-detail');
      const action = card.querySelector('.card-action-label');
      root.replaceChildren();
      root.hidden = !student;
      card.classList.remove('is-complete');
      action.textContent = game.featured ? 'Open spel' : (kinds[game.kind] || kinds.learn)[1];
      detail.textContent = game.detail || 'Op jouw tempo';
      if (game.progressType === 'local') {
        root.hidden = true;
        root.removeAttribute('aria-busy');
        detail.textContent = game.detail || 'Voortgang in deze browser';
        continue;
      }
      if (game.progressType === 'multiplayer') {
        root.hidden = true;
        detail.textContent = account ? '2 spelers · nodig iemand online uit' : 'Log in om samen te spelen · demo beschikbaar';
        continue;
      }
      if (!student) {
        if (!game.featured && !account && game.progressType !== 'none') detail.textContent = 'Log in voor je voortgang';
        continue;
      }
      if (game.progressType !== 'none' && progressState === 'loading') {
        root.append(element('span', 'progress-label', 'Voortgang laden…'));
        root.setAttribute('aria-busy', 'true');
        detail.textContent = 'Jouw voortgang';
        continue;
      }
      root.removeAttribute('aria-busy');
      if (game.progressType !== 'none' && (progressState === 'error' || overview?.errors[game.progressType === 'trainer' ? 'trainer' : 'games'])) {
        root.append(element('span', 'progress-label', 'Voortgang niet beschikbaar'));
        detail.textContent = 'Probeer opnieuw';
        continue;
      }
      const saved = window.LeraarBobCatalogProgress.savedFor(game, overview);
      const summary = window.LeraarBobCatalogProgress.summarize(game, saved);
      const heading = element('div', 'progress-heading');
      heading.append(element('span', 'progress-label', summary.label));
      if (summary.max) {
        const percent = Math.floor(100 * summary.value / summary.max);
        const percentage = element('span', 'progress-percent', `${percent}%`);
        percentage.setAttribute('aria-hidden', 'true');
        heading.append(percentage);
        const meter = element('progress', 'progress-meter');
        meter.max = summary.max;
        meter.value = summary.value;
        meter.setAttribute('aria-label', `${game.title}: ${summary.label} afgerond`);
        root.append(heading, meter);
      } else root.append(heading);
      detail.textContent = summary.detail;
      if (summary.status === 'started' || summary.status === 'saved') action.textContent = 'Ga verder';
      if (summary.status === 'complete') {
        card.classList.add('is-complete');
        action.textContent = game.kind === 'learn' ? 'Opnieuw bekijken' : game.kind === 'train' ? 'Opnieuw oefenen' : 'Opnieuw spelen';
      }
    }
    const failed = student && (progressState === 'error' || overview?.errors.games || overview?.errors.trainer);
    $('progressNotice').hidden = !failed;
    $('progressMessage').textContent = failed ? 'Een deel van je voortgang kon niet worden geladen. Je kunt de onderdelen wel openen.' : '';
  }

  async function refreshProgress() {
    const request = ++progressRequest;
    progressController?.abort();
    if (account?.role !== 'student') return;
    const studentId = account.id;
    const controller = new AbortController();
    progressController = controller;
    progressState = 'loading';
    overview = null;
    updateProgress();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const result = await window.AxiomaProgress.loadOverview({ signal: controller.signal });
      if (request !== progressRequest || account?.id !== studentId || result.accountId !== studentId) return;
      overview = result;
      progressState = 'ready';
    } catch {
      if (request !== progressRequest || account?.id !== studentId) return;
      progressState = 'error';
    } finally {
      clearTimeout(timeout);
      if (request === progressRequest) {
        progressController = null;
        updateProgress();
      }
    }
  }

  function accountChanged({ account: next }) {
    const unchanged = accountResolved && account?.id === next?.id && account?.role === next?.role;
    accountResolved = true;
    account = next || null;
    if (unchanged) return;
    ++progressRequest;
    progressController?.abort();
    overview = null;
    progressState = account?.role === 'student' ? 'loading' : 'guest';
    updateProgress();
    if (account?.role === 'student') refreshProgress();
  }
  function createCard(game, featured = false) {
    const card = element('a', featured ? 'card featured-card' : 'card');
    card.dataset.gameId = game.id;
    card.dataset.topic = game.theme || game.category;
    if (featured) card.dataset.world = game.presentation || 'islands';
    card.href = localUrl(game.href);
    const visual = element('div', 'visual');
    visual.setAttribute('aria-hidden', 'true');
    const image = element('img', 'cover-img');
    image.src = localUrl(game.cover) || 'assets/covers/graph.svg';
    image.alt = '';
    image.width = featured ? 1536 : 600;
    image.height = featured ? 1024 : 300;
    image.loading = featured && game.featureOrder === 1 ? 'eager' : 'lazy';
    if (featured && game.featureOrder === 1) image.fetchPriority = 'high';
    image.decoding = 'async';
    if (featured && localUrl(game.coverSmall)) {
      image.srcset = `${localUrl(game.coverSmall)} 768w, ${localUrl(game.cover)} 1536w`;
      image.sizes = '(max-width: 700px) calc(100vw - 32px), (max-width: 1400px) 62vw, 830px';
    }
    image.addEventListener('error', () => { image.removeAttribute('srcset'); image.src = 'assets/covers/graph.svg'; }, { once: true });
    visual.append(image);
    if (featured) {
      const diagram = game.presentation === 'islands'
        ? '<svg class="cover-diagram island-diagram" viewBox="0 0 240 180" aria-hidden="true"><path class="diagram-grid" d="M20 20V160M60 20V160M100 20V160M140 20V160M180 20V160M220 20V160M20 40H220M20 80H220M20 120H220M20 160H220"/><path class="diagram-line" d="M20 150 220 30"/><circle cx="70" cy="120" r="5"/><circle cx="170" cy="60" r="5"/></svg>'
        : game.presentation === 'space'
          ? '<svg class="cover-diagram vector-diagram" viewBox="0 0 240 180" aria-hidden="true"><path class="diagram-grid" d="M20 20V160M60 20V160M100 20V160M140 20V160M180 20V160M220 20V160M20 40H220M20 80H220M20 120H220M20 160H220"/><path class="vector-cyan" d="M40 130 190 30m-19 4 19-4-8 18"/><path class="vector-pink" d="M40 130 200 160m-14-12 14 12-18 5"/><circle cx="40" cy="130" r="4"/></svg>'
          : '';
      visual.insertAdjacentHTML('beforeend', diagram);
      if (game.presentation === 'garden') {
        const formula = element('span', 'cover-formula');
        formula.innerHTML = 'a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup>';
        visual.append(formula);
      }
    }
    const [kind, action] = kinds[game.kind] || ['Verkennen', 'Open het onderdeel'];
    if (!featured) visual.append(element('span', 'card-kind', kind));
    const info = element('div', 'info');
    info.append(element('p', 'meta', game.subject || game.category || game.theme || 'Wiskunde'), element(featured ? 'h2' : 'h3', '', game.title), element('p', 'description', game.subtitle));
    const bottom = element('div', 'card-bottom');
    const progress = element('div', 'card-progress');
    progress.hidden = true;
    const cta = element('span', 'card-action');
    cta.append(element('span', 'card-action-label', featured ? 'Open spel' : action));
    cta.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13m-5-5 5 5-5 5"/></svg>');
    bottom.append(cta, element('span', 'card-detail', game.detail || 'Op jouw tempo'));
    info.append(progress, bottom);
    card.append(visual, info);
    return card;
  }
  function render() {
    const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    const list = reserveGames().filter(game => matchesCategory(game, active) && terms.every(term => normalize([game.title, game.subtitle, game.theme, game.category, kinds[game.kind]?.[0]].join(' ')).includes(term)));
    featuredGrid.replaceChildren(...allGames.filter(game => game.featured).sort((a,b) => (a.featureOrder || 0) - (b.featureOrder || 0)).map(game => createCard(game, true)));
    grid.replaceChildren(...list.map(game => createCard(game)));
    $('empty').hidden = list.length > 0;
    $('reserveCount').textContent = `${reserveGames().length} spellen`;
    $('resultCount').textContent = `${list.length} ${list.length === 1 ? 'spel' : 'spellen'} in de reserve`;
    for (const button of filters.children) button.setAttribute('aria-pressed', String(button.dataset.filter === active));
    updateProgress();
  }
  function showSection(section) {
    if (section === reserve) reserve.open = true;
    (section === reserve ? section.querySelector('summary') : section).focus({ preventScroll: true });
    section.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  $('homeGames').addEventListener('click', () => showSection($('ontdek')));
  $('progressLogin').addEventListener('click', () => $('accountBtn').click());
  $('homeProgress').addEventListener('click', () => showSection($('playerProgress')));
  $('homeReserve').addEventListener('click', () => showSection(reserve));
  if (location.hash === '#reserve') reserve.open = true;
  document.addEventListener('click', event => {
    if (event.target.closest('#browseGamesBtn')) reserve.open = true;
  });
  filters.addEventListener('click', event => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    active = button.dataset.filter;
    render();
  });
  search.addEventListener('input', render);
  search.addEventListener('search', render);
  $('resetFilters').addEventListener('click', () => {
    active = 'Alles';
    search.value = '';
    render();
    search.focus();
  });
  function setMode(mode) {
    document.documentElement.dataset.mode = mode;
    const dark = mode === 'dark';
    $('modeBtn').setAttribute('aria-pressed', String(dark));
    $('modeBtn').setAttribute('aria-label', dark ? 'Lichte weergave' : 'Donkere weergave');
    $('modeBtn').title = dark ? 'Lichte weergave' : 'Donkere weergave';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#14231e' : '#f7f8f4';
  }
  setMode(document.documentElement.dataset.mode || 'light');
  $('modeBtn').addEventListener('click', () => {
    const mode = document.documentElement.dataset.mode === 'dark' ? 'light' : 'dark';
    setMode(mode);
    try { localStorage.setItem('axioma-mode', mode); } catch {}
  });
  function useCatalog(catalog) {
    if (!Array.isArray(catalog)) return false;
    const valid = catalog.filter(game => game && typeof game.title === 'string' && typeof game.subtitle === 'string' && localUrl(game.href));
    if (catalog.length && !valid.length) return false;
    allGames = valid;
    renderFilters();
    render();
    return true;
  }
  // Render immediately, also when opening index.html directly from disk.
  useCatalog(window.AXIOMA_CATALOG || []);
  if (window.AxiomaAuth) {
    window.AxiomaAuth.onChange(accountChanged);
    window.AxiomaAuth.ready().then(result => {
      if (!accountResolved) accountChanged(result);
    }).catch(() => { /* Keep the catalogue available when account access fails. */ });
  }
  $('retryProgress').addEventListener('click', refreshProgress);
  // Refresh on return from a game, including browser back/forward cache and another tab.
  window.addEventListener('pageshow', event => { if (event.persisted) refreshProgress(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshProgress(); });
  window.addEventListener('online', refreshProgress);
  if (location.protocol !== 'file:') {
    fetch('./games.json').then(response => {
      if (!response.ok) throw new Error('Catalog unavailable');
      return response.json();
    }).then(catalog => { useCatalog(catalog); }).catch(() => { /* Keep the bundled catalog. */ });
  }
})();
