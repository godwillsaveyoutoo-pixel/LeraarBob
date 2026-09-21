(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const grid = $('grid');
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
    const categories = ['Alles', ...new Set(allGames.map(game => game.theme || game.category).filter(Boolean))];
    filters.replaceChildren();
    for (const category of [...new Set(categories)]) {
      const button = element('button', 'filter', category);
      button.type = 'button';
      button.dataset.filter = category;
      if (category !== 'Alles') button.dataset.topic = category;
      button.setAttribute('aria-pressed', String(category === active));
      button.append(element('span', 'filter-count', String(allGames.filter(game => matchesCategory(game, category)).length)));
      filters.append(button);
    }
  }
  function updateProgress() {
    const student = account?.role === 'student';
    for (const card of grid.children) {
      const game = allGames.find(item => item.id === card.dataset.gameId);
      if (!game) continue;
      const root = card.querySelector('.card-progress');
      const detail = card.querySelector('.card-detail');
      const action = card.querySelector('.card-action-label');
      root.replaceChildren();
      root.hidden = !student;
      card.classList.remove('is-complete');
      action.textContent = (kinds[game.kind] || kinds.learn)[1];
      detail.textContent = game.detail || 'Op jouw tempo';
      if (game.progressType === 'multiplayer') {
        root.hidden = true;
        detail.textContent = account ? '2 spelers · nodig iemand online uit' : 'Log in om samen te spelen · demo beschikbaar';
        continue;
      }
      if (!student) {
        if (!account && game.progressType !== 'none') detail.textContent = 'Log in voor je voortgang';
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
      const saved = game.progressType === 'trainer' ? overview?.trainer : overview?.games.find(row => row.game_id === game.id);
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
  function render() {
    const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    const list = allGames.filter(game => matchesCategory(game, active) && terms.every(term => normalize([game.title, game.subtitle, game.theme, game.category, kinds[game.kind]?.[0]].join(' ')).includes(term)));
    const fragment = document.createDocumentFragment();
    for (const game of list) {
      const card = element('a', 'card');
      card.dataset.gameId = game.id;
      card.dataset.topic = game.theme || game.category;
      card.href = localUrl(game.href);
      const visual = element('div', 'visual');
      visual.setAttribute('aria-hidden', 'true');
      const image = element('img', 'cover-img');
      image.src = localUrl(game.cover) || 'assets/covers/graph.svg';
      image.alt = '';
      image.width = 600;
      image.height = 300;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.addEventListener('error', () => { image.src = 'assets/covers/graph.svg'; }, { once: true });
      const [kind, action] = kinds[game.kind] || ['Verkennen', 'Open het onderdeel'];
      visual.append(image, element('span', 'card-kind', kind));
      const info = element('div', 'info');
      info.append(element('p', 'meta', game.category || game.theme || 'Wiskunde'), element('h3', '', game.title), element('p', 'description', game.subtitle));
      const bottom = element('div', 'card-bottom');
      const progress = element('div', 'card-progress');
      progress.hidden = true;
      const cta = element('span', 'card-action');
      cta.append(element('span', 'card-action-label', action));
      cta.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13m-5-5 5 5-5 5"/></svg>');
      bottom.append(element('span', 'card-detail', game.detail || game.theme || 'Op jouw tempo'), cta);
      info.append(progress, bottom);
      card.append(visual, info);
      fragment.append(card);
    }
    grid.replaceChildren(fragment);
    $('empty').hidden = list.length > 0;
    $('resultCount').textContent = `${list.length} ${list.length === 1 ? 'onderdeel' : 'onderdelen'}`;
    for (const button of filters.children) button.setAttribute('aria-pressed', String(button.dataset.filter === active));
    updateProgress();
  }
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
