const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { render } = require('../scripts/build-catalog.cjs');
const root = path.join(__dirname, '..');

test('online and offline catalogs expose exactly the same entries and progress totals', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'games.json'), 'utf8'));
  const offline = fs.readFileSync(path.join(root, 'js/catalog.js'), 'utf8');
  assert.equal(offline, render(catalog), 'Run node scripts/build-catalog.cjs');
  const context = { window: {} };
  vm.runInNewContext(offline, context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.window.AXIOMA_CATALOG)), catalog);
  const real = catalog.find(game => game.id === 'reele-getallen-trainer');
  assert.equal(real.progressTotal, require('../games/reele-getallen/real-core.js').skills.length);
});

test('catalog generation rejects duplicate identities instead of mixing saved progress', () => {
  const game = { id: 'example', title: 'Voorbeeld', subtitle: 'Oefenen', href: 'games/example/' };
  assert.throws(() => render([game, game]), /unieke id/);
  assert.throws(() => render([{ ...game, href: '' }]), /href ontbreekt/);
});
