/* Read-only XP badge for standalone modes. Sessions never write solo progress. */
(() => {
  'use strict';
  let account = null, epoch = 0, pending = true;
  const output = document.createElement('output');
  output.hidden = true;
  output.dataset.platformProgress = 'xp';
  const owner = value => value ? value.role + ':' + value.id : 'guest';
  const cacheKey = () => 'axioma:rechten:v2:' + encodeURIComponent(window.AXIOMA_CONFIG?.url || 'offline') + ':' + owner(account);
  function cached() {
    try {
      const record = JSON.parse(localStorage.getItem(cacheKey()) || 'null');
      return record?.schemaVersion === 1 && record.owner === owner(account) && record.state?.schema === 1 ? record : null;
    } catch { return null; }
  }
  function show(state) {
    const value = Math.max(0, Number(window.RechtenV2XP.update(state || {}).platformXp) || 0);
    output.dataset.value = String(value);
    output.textContent = value + ' XP';
    if (!output.isConnected) document.querySelector('header')?.append(output);
  }
  async function refresh() {
    const turn = ++epoch;
    if (pending) return;
    if (account && account.role !== 'student') { output.remove(); return; }
    const local = cached();
    if (local) show(local.state);
    if (!account) { if (!local) show(null); return; }
    try {
      const saved = await window.AxiomaProgress.load('rechten-trainer', account.id);
      if (turn !== epoch) return;
      // Pending local work is the same account's actual progress, not an XP copy.
      show(local?.dirty ? local.state : saved.state?.rechtenV2);
    } catch { /* Keep this owner's cached score; unknown is never fabricated as zero. */ }
  }
  function change(detail) {
    ++epoch;
    pending = Boolean(detail?.pending);
    if (pending) { output.remove(); return; }
    if (owner(account) !== owner(detail?.account)) output.remove();
    account = detail?.account || null;
    void refresh();
  }
  window.AxiomaAuth.onChange(change);
  const initial = epoch;
  window.AxiomaAuth.ready().then(detail => { if (epoch === initial) change(detail); }).catch(() => {});
  addEventListener('focus', () => void refresh());
  addEventListener('online', () => void refresh());
  addEventListener('storage', event => { if (event.key === cacheKey()) void refresh(); });
})();
