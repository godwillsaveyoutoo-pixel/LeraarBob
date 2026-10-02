(() => {
  'use strict';
  const count = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;

  function summarize(game, saved) {
    const state = saved?.state;
    if (game.id === 'algebra-trainer') {
      const completed=new Set();
      for(const key of ['leraarbob.algebra.v1','leraarbob.stelsels.workshop.v1']){
        try{const journey=JSON.parse(state?.storage?.[key]||'null')?.journey;
          for(const [id,e] of Object.entries(journey?.topics||{}))if(/^(eq-|sys-)/.test(id)&&e.finished===true&&Array.isArray(e.evidence)&&e.evidence.length===5&&e.evidence.every(r=>r.done===true))completed.add(id);
        }catch{}
      }
      const total=count(game.progressTotal)||23,done=Math.min(total,completed.size);
      return {status:done===total?'complete':done?'started':state?'saved':'new',label:`${done} van ${total} haltes`,detail:done===total?'✓ Afgerond':state?'Nieuwe missies tellen na vijf opdrachten; eerdere oefeningen blijven bewaard.':'Begin je eerste missie.',completed:done,value:done,max:total};
    }
    if (game.progressType === 'world') {
      const savedWorld = state?.rechtenV2;
      return { status: savedWorld ? 'saved' : 'new', label: savedWorld ? 'Leerroute opgeslagen' : 'Nog niet gestart', detail: savedWorld ? 'Ga verder waar je was' : 'Ontdek je eerste eiland' };
    }
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
      completed: done,
      value: total ? done : null,
      max: total || null
    };
  }

  function savedFor(game, overview) {
    return game.progressType === 'trainer' ? overview?.trainer : overview?.games?.find(row => row.game_id === (game.progressGameId || game.id));
  }
  function earnedXP(game, saved) {
    if (['local','none','multiplayer'].includes(game.progressType)) return null;
    const state = saved?.state;
    if (game.progressType === 'trainer') return count(state?.xp);
    if (['algebra-trainer','bewerkingen-trainer'].includes(game.id)) {
      // Read actual topic awards. Older solved-form counts are never converted to XP.
      const keys=game.id==='algebra-trainer'?['leraarbob.algebra.v1','leraarbob.stelsels.workshop.v1']:['leraarbob.bewerkingen.v1'];
      const awards=new Map();let hasJourney=false;
      for(const key of keys){
        try{const journey=JSON.parse(state?.storage?.[key]||'null')?.journey;if(!journey)continue;hasJourney=true;
          for(const [id,entry] of Object.entries(journey.topics||{})){
            const answers=Array.isArray(entry.answers)?new Set(entry.answers.filter(a=>typeof a==='string'&&a.length>0)):new Set();
            const mission=entry.finished===true&&Array.isArray(entry.evidence)&&entry.evidence.length===5&&entry.evidence.every(e=>e.done===true);
            if(entry.rewarded===true&&(answers.size>=3||mission)&&Number.isFinite(entry.xp))awards.set(id,count(entry.xp));
          }
        }catch{}
      }
      return hasJourney?[...awards.values()].reduce((sum,n)=>sum+n,0):null;
    }
    if (game.id === 'vectoren-trainer') {
      try { return count(JSON.parse(state?.storage?.['axioma-vectorentrainer-v020'] || '{}').progress?.xp); }
      catch { return null; }
    }
    if (game.id === 'reele-getallen-trainer') {
      try { return count(JSON.parse(state?.storage?.['axioma-real-numbers-v1'] || '{}').progress?.xp); }
      catch { return null; }
    }
    if (game.progressType === 'world') {
      return state?.rechtenV2 && Object.hasOwn(state.rechtenV2, 'platformXp') ? count(state.rechtenV2.platformXp) : null;
    }
    if (state && Object.hasOwn(state, 'xp')) return count(state.xp);
    return state && Object.hasOwn(state, 'platformXp') ? count(state.platformXp) : null;
  }
  function aggregate(catalog, overview) {
    if (!overview || overview.errors?.games || overview.errors?.trainer) return null;
    const seen = new Set(), entries = [];
    for (const game of catalog) {
      if (['none','local','multiplayer'].includes(game.progressType)) continue;
      // A world and an older trainer may share a row but read separate, explicit records.
      const source = game.progressType === 'trainer' ? 'legacy-trainer' : (game.progressGameId || game.id) + (game.progressType === 'world' ? ':rechtenV2' : '');
      if (seen.has(source)) continue;
      seen.add(source);
      const saved = savedFor(game, overview), progress = summarize(game, saved);
      entries.push({ id: game.id, title: game.title, href: game.href, xp: earnedXP(game, saved), completed: progress.completed || 0, label: progress.label });
    }
    return { xp: entries.reduce((sum, e) => sum + (e.xp || 0), 0), completed: entries.reduce((sum, e) => sum + e.completed, 0), entries };
  }
  window.LeraarBobCatalogProgress = Object.freeze({ summarize, savedFor, earnedXP, aggregate });
})();
