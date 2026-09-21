// games.json is the only editable catalog. Keep a generated copy for file:// and offline use.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

function render(catalog) {
  if (!Array.isArray(catalog) || !catalog.length) throw Error('De catalogus moet een niet-lege lijst zijn.');
  const ids = new Set();
  for (const game of catalog) {
    if (!game || typeof game.id !== 'string' || !game.id || ids.has(game.id)) {
      throw Error('Elk onderdeel moet een unieke id hebben: ' + game?.id);
    }
    ids.add(game.id);
    for (const key of ['title', 'subtitle', 'href']) {
      if (typeof game[key] !== 'string' || !game[key]) throw Error(`${game.id}: ${key} ontbreekt.`);
    }
  }
  return '// Automatisch gegenereerd uit games.json. Wijzig de bron, niet dit bestand.\n' +
    '// Opnieuw bouwen: node scripts/build-catalog.cjs\n' +
    'window.AXIOMA_CATALOG = ' + JSON.stringify(catalog, null, 2) + ';\n';
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.some(arg => arg !== '--check')) throw Error('Gebruik: node scripts/build-catalog.cjs [--check]');
    const expected = render(JSON.parse(fs.readFileSync(path.join(root, 'games.json'), 'utf8')));
    const output = path.join(root, 'js/catalog.js');
    if (args.includes('--check')) {
      const actual = fs.existsSync(output) ? fs.readFileSync(output, 'utf8') : '';
      if (actual !== expected) throw Error('js/catalog.js loopt achter. Voer node scripts/build-catalog.cjs uit en neem het gegenereerde bestand mee in je commit.');
      console.log('Catalogus en offlinekopie zijn gelijk.');
    } else {
      fs.writeFileSync(output, expected);
      console.log('js/catalog.js gegenereerd uit games.json.');
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { render };
