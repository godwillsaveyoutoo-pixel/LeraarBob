/* Presentation-only routes. Exercises stay in their account-bound engines. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.LeraarBobRoutes = factory(new URL('../', document.currentScript.src));
})(globalThis, function (base) {
  'use strict';
  const root = new URL(base || 'https://example.test/');
  if (!root.pathname.endsWith('/')) root.pathname += '/';
  const fields = {
    gameId: 'game', world: 'world', topic: 'topic', level: 'level',
    runLevel: 'activeLevel', screen: 'screen', returnTo: 'returnTo'
  };
  const clean = value => typeof value === 'string' ? value.trim().slice(0, 512) : '';

  function safeReturn(value, fallback = root.href) {
    function safe(raw) {
      try {
        // Reject encoded path separators, while allowing encoded query values.
        if (!raw || /[\\]|%2f|%5c/i.test(raw.split(/[?#]/)[0])) return null;
        const url = new URL(raw, root);
        if (url.origin !== root.origin || url.username || url.password ||
            !['http:', 'https:'].includes(url.protocol)) return null;
        if (url.pathname !== root.pathname.slice(0, -1) &&
            !url.pathname.startsWith(root.pathname)) return null;
        return url.pathname + url.search + url.hash;
      } catch { return null; }
    }
    return safe(clean(value)) || safe(clean(fallback)) || root.pathname;
  }

  function read(value, defaults = {}) {
    const url = new URL(value || root.href, root), context = {...defaults};
    for (const [field, key] of Object.entries(fields)) {
      if (url.searchParams.has(key)) context[field] = clean(url.searchParams.get(key));
    }
    if (context.returnTo) context.returnTo = safeReturn(context.returnTo);
    return context;
  }

  function href(path, context = {}) {
    const url = new URL(safeReturn(path, root.href), root);
    for (const [field, key] of Object.entries(fields)) {
      if (!Object.hasOwn(context, field)) continue;
      const value = field === 'returnTo'
        ? context[field] && safeReturn(context[field]) : clean(context[field]);
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    // Unknown bookmark parameters and battle codes remain unchanged.
    return url.pathname + url.search + url.hash;
  }

  function mount(options) {
    const win = options.window || globalThis;
    let applying = false, current = {gameId: options.gameId, ...options.read()};
    const enabled = () => options.enabled?.() !== false;

    function update(context = {}, settings = {}) {
      if (!enabled()) return current;
      current = {...current, ...options.read(), ...context, gameId: options.gameId};
      if (current.returnTo) current.returnTo = safeReturn(current.returnTo);
      options.onChange?.({...current});
      if (applying) return {...current};
      const url = href(win.location.href, current);
      const historyState = {...(win.history.state || {}), leraarbobRoute: {...current}};
      if (settings.replace || url === win.location.pathname + win.location.search + win.location.hash) {
        win.history.replaceState(historyState, '', url);
      } else win.history.pushState(historyState, '', url);
      return {...current};
    }

    function pop() {
      if (!enabled()) return;
      applying = true;
      try {
        const stored = win.history.state?.leraarbobRoute;
        current = stored?.gameId === options.gameId ? {...stored} : read(win.location.href, current);
        // The engine may only resume an existing run; apply never starts one.
        options.apply({...current});
      } finally { applying = false; }
      // Normalize a rejected/missing saved run back to the actual menu screen.
      update({}, {replace: true});
    }

    win.addEventListener('popstate', pop);
    update({}, {replace: true});
    return Object.freeze({
      snapshot: () => ({...current}), update,
      returnTo: screen => href(win.location.href, {
        ...current, ...(screen ? {screen} : {}), returnTo: ''
      }),
      destroy: () => win.removeEventListener('popstate', pop)
    });
  }
  return Object.freeze({root: root.href, safeReturn, href, read, mount});
});
