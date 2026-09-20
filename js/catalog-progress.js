(() => {
  'use strict';
  const count = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;

  function summarize(game, saved) {
    const state = saved?.state;
    if (game.progressType === 'none') return { status: 'untracked', label: 'Vrij verkennen', detail: 'Zonder voortgangsopslag' };
    if (game.progressType === 'trainer') {
      const questions = count(state?.total);
      return questions ? {
        status: 'started', label: `${questions} ${questions === 1 ? 'vraag' : 'vragen'} geoefend`,
        detail: `${Math.min(questions, count(state.correct))} juist · ${count(state.xp)} XP`
      } : { status: 'new', label: 'Nog niet gestart', detail: 'Oefen je eerste vragen' };
    }
    const raw = state?.completed;
    const completed = Array.isArray(raw)
      ? new Set(raw.filter(v => (typeof v === 'string' && v.trim()) || (typeof v === 'number' && Number.isFinite(v))).map(String)).size
      : count(raw);
    const total = count(state?.total) || count(state?.totalLevels) || count(state?.levelCount) || count(game.progressTotal);
    const done = total ? Math.min(completed, total) : completed;
    const finished = total > 0 && done >= total;
    const unit = total === 1 ? (game.progressUnitSingular || 'onderdeel') : (game.progressUnitPlural || 'onderdelen');
    return {
      status: finished ? 'complete' : done > 0 ? 'started' : state ? 'saved' : 'new',
      label: total ? `${done} van ${total} ${unit}` : done ? `${done} afgerond` : state ? 'Voortgang opgeslagen' : 'Nog niet gestart',
      detail: finished ? '✓ Afgerond' : done > 0 ? 'Ga verder waar je was' : state ? 'Ga verder waar je was' : 'Nog niet gestart',
      value: total ? done : null,
      max: total || null
    };
  }

  window.LeraarBobCatalogProgress = Object.freeze({ summarize });
})();
