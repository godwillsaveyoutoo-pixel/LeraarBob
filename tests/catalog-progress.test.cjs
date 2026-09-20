const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const script = name => fs.readFileSync(path.join(root, name), 'utf8');
const context = { window: {} };
vm.runInNewContext(script('js/catalog-progress.js'), context);
const summary = context.window.LeraarBobCatalogProgress.summarize;
const game = { progressType: 'levels', progressTotal: 10, progressUnitSingular: 'stap', progressUnitPlural: 'stappen' };

test('counts distinct completed units and distinguishes new, active and finished', () => {
  assert.equal(summary(game, null).label, '0 van 10 stappen');
  assert.equal(summary(game, null).status, 'new');
  const active = summary(game, { state: { completed: [1, '1', 2, 3, '', null, {}], total: 10 } });
  assert.equal(active.value, 3);
  assert.equal(active.status, 'started');
  assert.equal(active.label, '3 van 10 stappen');
  assert.equal(summary(game, { state: { completed: 20, total: 10 } }).value, 10);
  assert.equal(summary(game, { state: { completed: 10, total: 10 } }).status, 'complete');
  assert.equal(summary(game, { state: { completed: 3, total: 10, finished: true } }).status, 'started');
});

test('handles missing totals and malformed values without making up a percentage', () => {
  assert.equal(summary({ progressType: 'levels' }, { state: { completed: ['one'] } }).max, null);
  assert.equal(summary({ progressType: 'levels' }, { state: { completed: ['one'] } }).label, '1 afgerond');
  assert.equal(summary(game, { state: { completed: -5, total: 'invalid' } }).value, 0);
  assert.equal(summary(game, { state: { completed: Infinity, total: 10 } }).value, 0);
  assert.equal(summary(game, { state: { completed: [] } }).status, 'saved');
  assert.equal(summary({ ...game, progressTotal: 1, progressUnitSingular: 'reeks' }, null).label, '0 van 1 reeks');
});

test('trainer statistics are not misrepresented as course completion', () => {
  const saved = summary({ progressType: 'trainer' }, { state: { total: 24, correct: 18, xp: 140 } });
  assert.equal(saved.label, '24 vragen geoefend');
  assert.equal(saved.detail, '18 juist · 140 XP');
  assert.equal(saved.max, undefined);
  assert.equal(summary({ progressType: 'none' }, null).status, 'untracked');
});

function service({ account = { id: 'student-a', role: 'student' }, failures = {}, blocked = false } = {}) {
  let current = account;
  const queries = [];
  const pending = [];
  const sb = {
    from(table) {
      const record = { table }; queries.push(record);
      const query = {
        select(fields) { record.fields = fields; return query; },
        eq(field, value) { record[field] = value; return query; },
        maybeSingle() { record.single = true; return query; },
        abortSignal(signal) { record.signal = signal; return query; },
        then(resolve, reject) {
          const respond = () => {
            if (failures[table] === 'reject') return reject(Error('Network unavailable'));
            resolve(failures[table] ? { error: Error('Offline') } : {
              data: table === 'axioma_progress' ? { state: { total: 24 } } : [{ game_id: 'pythagoras', state: { completed: [1, 2, 3] } }]
            });
          };
          if (blocked) pending.push(respond); else respond();
        }
      };
      return query;
    }
  };
  const sandbox = { window: { AxiomaAuth: { getAccount: async () => current, client: () => sb } } };
  vm.runInNewContext(script('shared/axioma-progress.js'), sandbox);
  return { api: sandbox.window.AxiomaProgress, queries, pending, switchTo: account => { current = account; } };
}

test('overview queries explicitly scope both storage formats to the student', async () => {
  const s = service();
  const signal = new AbortController().signal;
  const result = await s.api.loadOverview({ signal });
  assert.equal(result.accountId, 'student-a');
  assert.equal(result.games[0].game_id, 'pythagoras');
  assert.equal(result.trainer.state.total, 24);
  assert.equal(s.queries.length, 2);
  assert(s.queries.every(q => q.user_id === 'student-a' && q.signal === signal));
});

test('each failed query is distinguished from no saved progress', async () => {
  for (const failure of ['error', 'reject']) {
    const s = service({ failures: { axioma_game_progress: failure } });
    const result = await s.api.loadOverview();
    assert.equal(result.errors.games, true);
    assert.equal(result.errors.trainer, false);
    assert.equal(result.trainer.state.total, 24);
  }
});

test('guests and teachers never fetch the student overview', async () => {
  for (const account of [null, { id: 'teacher', role: 'teacher' }]) {
    const s = service({ account });
    await assert.rejects(s.api.loadOverview(), /Leerlingaccount vereist/);
    assert.equal(s.queries.length, 0);
  }
});

test('late responses cannot deliver the previous student’s overview after account change', async () => {
  const s = service({ blocked: true });
  const request = s.api.loadOverview();
  await new Promise(resolve => setImmediate(resolve));
  s.switchTo({ id: 'student-b', role: 'student' });
  s.pending.forEach(resolve => resolve());
  await assert.rejects(request, /Leerlingaccount gewijzigd/);
});
