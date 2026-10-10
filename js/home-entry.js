(() => {
  'use strict';
  const source = new URL(location.href);
  // Keep the original account entry point and callback URL boundary intact.
  // The catalog remains an explicit destination, rather than the default home.
  const accountQuery = ['return', 'code', 'token_hash', 'type', 'error', 'error_description'];
  const accountHash = /(?:^|[&#])(?:access_token|refresh_token|token_hash|type|error|error_description)=/;
  if (source.searchParams.get('view') === 'catalog'
      || source.searchParams.get('login') === '1'
      || accountQuery.some(key => source.searchParams.has(key))
      || accountHash.test(source.hash)) return;

  const desktop = new URL('os/', source);
  desktop.search = source.search;
  desktop.hash = source.hash;
  const places = {'#ontdek': 'all', '#reserve': 'all', '#playerProgress': 'profile'};
  if (places[source.hash]) {
    desktop.searchParams.set('place', places[source.hash]);
    desktop.hash = '';
  }
  location.replace(desktop.href);
})();
