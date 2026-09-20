(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const grid = $('grid');
  const filters = $('filters');
  const search = $('search');
  let allGames = [];
  let active = 'Alles';
  const kinds = { train: ['Oefenen', 'Start met oefenen'], learn: ['Ontdekken', 'Ontdek het leerpad'], game: ['Spelen', 'Open het spel'], arcade: ['Spelen', 'Open het spel'] };
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
    return category === 'Alles' || (category === 'Spellen' ? ['game', 'arcade'].includes(game.kind) : (game.theme || game.category) === category);
  }
  function renderFilters() {
    const categories = ['Alles', ...new Set(allGames.map(game => game.theme || game.category).filter(Boolean))];
    if (allGames.some(game => ['game', 'arcade'].includes(game.kind))) categories.push('Spellen');
    filters.replaceChildren();
    for (const category of [...new Set(categories)]) {
      const button = element('button', 'filter', category);
      button.type = 'button';
      button.dataset.filter = category;
      button.setAttribute('aria-pressed', String(category === active));
      button.append(element('span', 'filter-count', String(allGames.filter(game => matchesCategory(game, category)).length)));
      filters.append(button);
    }
  }
  function render() {
    const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    const list = allGames.filter(game => matchesCategory(game, active) && terms.every(term => normalize([game.title, game.subtitle, game.theme, game.category, kinds[game.kind]?.[0]].join(' ')).includes(term)));
    const fragment = document.createDocumentFragment();
    for (const game of list) {
      const card = element('a', 'card');
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
      const [kind, action] = kinds[game.kind] || ['Ontdekken', 'Open het onderdeel'];
      visual.append(image, element('span', 'card-kind', kind));
      const info = element('div', 'info');
      info.append(element('p', 'meta', game.category || game.theme || 'Wiskunde'), element('h3', '', game.title), element('p', 'description', game.subtitle));
      const bottom = element('div', 'card-bottom');
      const cta = element('span', 'card-action', action);
      cta.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13m-5-5 5 5-5 5"/></svg>');
      bottom.append(element('span', 'card-detail', game.detail || game.theme || 'Op jouw tempo'), cta);
      info.append(bottom);
      card.append(visual, info);
      fragment.append(card);
    }
    grid.replaceChildren(fragment);
    $('empty').hidden = list.length > 0;
    $('resultCount').textContent = `${list.length} ${list.length === 1 ? 'onderdeel' : 'onderdelen'}`;
    for (const button of filters.children) button.setAttribute('aria-pressed', String(button.dataset.filter === active));
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
  if (location.protocol !== 'file:') {
    fetch('./games.json').then(response => {
      if (!response.ok) throw new Error('Catalog unavailable');
      return response.json();
    }).then(catalog => { useCatalog(catalog); }).catch(() => { /* Keep the bundled catalog. */ });
  }
})();
