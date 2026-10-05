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

test('algebra XP reads topic awards across the separate trainers once, without converting old forms', () => {
  const api=context.window.LeraarBobCatalogProgress;
  const awarded={answers:['one','two','three'],rewarded:true,xp:30};
  const games=[{id:'algebra-trainer',progressType:'levels'},{id:'bewerkingen-trainer',progressType:'levels'}];
  const overview={errors:{games:false,trainer:false},games:[
    {game_id:'algebra-trainer',state:{storage:{
      'leraarbob.algebra.v1':JSON.stringify({solvedTypes:['A1','A2'],journey:{topics:{'eq-A2':awarded}}}),
      'leraarbob.stelsels.workshop.v1':JSON.stringify({journey:{topics:{'sys-unique':awarded}}})
    }}},
    {game_id:'bewerkingen-trainer',state:{storage:{'leraarbob.bewerkingen.v1':JSON.stringify({journey:{topics:{'op-power-power':awarded,'op-power-product':{answers:['one'],rewarded:false,xp:0}}}})}}}
  ]};
  assert.equal(api.aggregate(games,overview).xp,90);
  assert.equal(api.earnedXP(games[0],{state:{completed:['A1','A2'],storage:{'leraarbob.algebra.v1':JSON.stringify({solvedTypes:['A1','A2']})}}}),null);
  assert.equal(api.earnedXP(games[1],{state:{storage:{'leraarbob.bewerkingen.v1':'invalid'}}}),null);
});

test('new algebra missions contribute actual XP only after all five tasks', () => {
  const api=context.window.LeraarBobCatalogProgress,game={id:'algebra-trainer',progressType:'levels'};
  const evidence=Array.from({length:5},(_,i)=>({done:true,supported:i<2,kind:'solve'}));
  const record=entry=>({state:{storage:{'leraarbob.algebra.v1':JSON.stringify({journey:{topics:{'eq-B1':entry}}})}}});
  assert.equal(api.earnedXP(game,record({answers:[],finished:true,evidence,rewarded:true,xp:30})),30);
  assert.equal(api.earnedXP(game,record({answers:[],finished:true,evidence:evidence.slice(0,4),rewarded:true,xp:30})),0);
  assert.equal(api.earnedXP(game,record({answers:[],finished:true,evidence:evidence.map((e,i)=>({...e,done:i!==4})),rewarded:true,xp:30})),0);
});

test('algebra route completion excludes earlier practiced-form counts', () => {
  const game={id:'algebra-trainer',progressType:'levels',progressTotal:23};
  const evidence=Array.from({length:5},()=>({done:true}));
  const legacy={state:{completed:['A1','A2'],total:17,storage:{'leraarbob.algebra.v1':JSON.stringify({solvedTypes:['A1','A2'],journey:{topics:{'eq-A2':{answers:['a','b','c'],rewarded:true,xp:30}}}})}}};
  assert.equal(summary(game,legacy).completed,0);
  legacy.state.storage['leraarbob.stelsels.workshop.v1']=JSON.stringify({journey:{topics:{'sys-graphic':{finished:true,evidence}}}});
  assert.equal(summary(game,legacy).completed,1);assert.equal(summary(game,legacy).max,23);
});

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

test('Wortelbouw shows tracked puzzle completion and reaches the gold completion state',()=>{
 const catalog=JSON.parse(script('games.json')),entry=catalog.find(g=>g.id==='wortelbouw');
 assert.equal(entry.tracking,'progress');assert.equal(entry.teacherVisible,true);
 assert.equal(summary(entry,null).label,'0 van 14 opgaven');
 assert.equal(summary(entry,{state:{completed:['length-2'],total:14}}).label,'1 van 14 opgaven');
 const ids=require('../games/wortelbouw/progress.js').ids;
 assert.equal(summary(entry,{state:{completed:ids,total:14}}).status,'complete');
});

test('central XP uses saved totals once and keeps completed puzzles separate', () => {
  const api=context.window.LeraarBobCatalogProgress;
  const catalog=JSON.parse(script('games.json'));
  const overview={errors:{},trainer:{state:{xp:140,total:24,correct:18}},games:[
    {game_id:'vectoren-trainer',state:{storage:{'axioma-vectorentrainer-v020':JSON.stringify({progress:{xp:320},draft:{session:{xp:90}}})},completed:['a','a','b'],total:20}},
    {game_id:'wortelbouw',state:{completed:['one','two'],total:14,platformXp:20}},
    {game_id:'gravity-maze',state:{completed:[1,2,3],total:9,platformXp:30}},
    {game_id:'rechten-trainer',state:{rechtenV2:{events:[],missions:{},platformXp:50}}}
  ]};
  const total=api.aggregate([...catalog,catalog.find(g=>g.id==='vectoren-trainer')],overview);
  assert.equal(total.xp,560);assert.equal(total.completed,7);
  assert.equal(total.entries.find(e=>e.id==='wortelbouw').xp,20);
  assert.equal(total.entries.find(e=>e.id==='rechtenwereld').label,'Leerroute opgeslagen');
  assert.equal(api.aggregate(catalog,{...overview,errors:{trainer:true}}),null);
  assert.equal(api.aggregate(catalog,{...overview,errors:{games:true}}),null);
  assert.equal(api.aggregate(catalog,null),null);
  assert.equal(api.earnedXP({id:'vectoren-trainer'},{state:{storage:{'axioma-vectorentrainer-v020':'invalid'}}}),null);
  assert.equal(api.earnedXP({id:'reele-getallen-trainer',progressType:'levels'},{state:{storage:{'axioma-real-numbers-v1':JSON.stringify({progress:{xp:75}})}}}),75);
});

test('Getallenwereld keeps its guided route and historical series separate while preserving earned XP', () => {
  const api=context.window.LeraarBobCatalogProgress,catalog=JSON.parse(script('games.json'));
  const family=catalog.filter(g=>g.id==='getallenwereld'||g.parentId==='getallenwereld');
  const overview={errors:{},games:[
    {game_id:'getallenwereld',state:{completed:['machten-product','wortels-factor'],total:15}},
    {game_id:'bewerkingen-trainer',state:{completed:['power-power','power-product','scientific'],total:16,storage:{'leraarbob.bewerkingen.v1':JSON.stringify({journey:{topics:{'op-power-power':{answers:['a','b','c'],rewarded:true,xp:30}}}})}}}
  ]};
  const totals=api.aggregate([...family,family[1]],overview);
  assert.equal(totals.xp,30);assert.equal(totals.entries.length,2);
  assert.equal(totals.entries[0].label,'2 van 15 onderdelen');assert.equal(totals.entries[1].label,'3 van 16 vraagvormen');
  assert.equal(totals.entries[1].title,'Getallenwereld · Reeksen');assert(!totals.entries.some(e=>e.label.includes('31')));
  assert.equal(api.savedFor(family[0],overview).game_id,'getallenwereld');assert.equal(api.savedFor(family[1],overview).game_id,'bewerkingen-trainer');
  overview.games[0].state.completed.push('machten-macht');assert.equal(api.summarize(family[1],api.savedFor(family[1],overview)).completed,3,'Guided work never rewrites the historical series total');
});
