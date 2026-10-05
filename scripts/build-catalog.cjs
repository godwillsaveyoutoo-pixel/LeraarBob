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
    if (game.featured !== undefined && typeof game.featured !== 'boolean') throw Error(`${game.id}: featured moet een boolean zijn.`);
    if (game.featured) {
      for (const key of ['subject', 'cover', 'coverSmall', 'presentation']) {
        if (typeof game[key] !== 'string' || !game[key].trim()) throw Error(`${game.id}: ${key} ontbreekt voor de startpagina.`);
      }
      if (!Number.isInteger(game.featureOrder) || game.featureOrder < 1) throw Error(`${game.id}: featureOrder moet een positief geheel getal zijn.`);
    }
    for (const key of ['title', 'subtitle', 'href']) {
      if (typeof game[key] !== 'string' || !game[key]) throw Error(`${game.id}: ${key} ontbreekt.`);
    }
  }
  validateRegistry(catalog);
  return '// Automatisch gegenereerd uit games.json. Wijzig de bron, niet dit bestand.\n' +
    '// Opnieuw bouwen: node scripts/build-catalog.cjs\n' +
    'window.AXIOMA_CATALOG = ' + JSON.stringify(catalog, null, 2) + ';\n';
}

function validateRegistry(catalog) {
 const ids=new Set(catalog.map(g=>g.id)),aliases=new Set(ids);
 const href=(value,label)=>{if(typeof value!=='string'||!value||value!==value.trim()||value.startsWith('/')||value.includes(String.fromCharCode(92))||/^[a-z]+:/i.test(value)||value.split(/[?#]/)[0].split('/').includes('..'))throw Error(label+': een relatieve platformroute is vereist.');};
 for(const g of catalog){
  if(g.parentId){const parent=catalog.find(p=>p.id===g.parentId);if(!parent||parent.active===false||parent.id===g.id)throw Error(g.id+': onbekende of ongeldige hoofdwereld');if(g.featured)throw Error(g.id+': een component mag geen aparte startpaginakaart hebben');if(typeof g.componentTitle!=='string'||!g.componentTitle.trim())throw Error(g.id+': componentTitle ontbreekt');}
  if(typeof g.active!=='boolean'||typeof g.progressId!=='string'||!g.progressId)throw Error(g.id+': active/progressId ontbreekt.');
  href(g.href,g.id);href(g.route?.entry,g.id+' route');
  if(g.route.prefix)href(g.route.prefix,g.id+' prefix');
  for(const alias of g.modeAliases||[]){if(!alias||aliases.has(alias))throw Error('Dubbele spelalias: '+alias);aliases.add(alias);}
  const topics=new Set();
  for(const t of g.topics||[]){if(!t.id||topics.has(t.id))throw Error(g.id+': dubbel onderwerp');topics.add(t.id);href(t.href,g.id+'/'+t.id);if(t.levelIds&&new Set(t.levelIds).size!==t.levelIds.length)throw Error(g.id+': dubbele level-id');}
  for(const kind of ['modes','worksheets']){
   if(!Array.isArray(g.capabilities?.[kind]))throw Error(g.id+': mogelijkheden ontbreken.');
   const seen=new Set();
   for(const c of g.capabilities[kind]){
    if(!c.id||seen.has(c.id))throw Error(g.id+': dubbele mogelijkheid '+c.id);seen.add(c.id);
    if(c.reference){if(c.href||c.providerId)throw Error(g.id+': verwijzing heeft een eigen provider');const target=catalog.find(x=>x.id===c.reference.gameId);if(!target?.capabilities?.[kind]?.some(x=>x.id===c.reference[kind==='modes'?'modeId':'worksheetId']))throw Error(g.id+': onbekende verwijzing');}
    else {href(c.href,g.id+'/'+c.id);if(!c.providerId)throw Error(g.id+': providerId ontbreekt');}
    if(kind==='modes'&&(!['solo','duo','group'].includes(c.participation)||!['learn','battle'].includes(c.purpose)))throw Error(g.id+': deelname/doel ontbreekt');
    if(!c.reference&&kind==='modes'&&(!Array.isArray(c.roles)||!c.roles.length||c.roles.some(r=>!['guest','student','teacher'].includes(r))))throw Error(g.id+': ongeldige rollen');
    if(c.topicId&&!topics.has(c.topicId)||c.topics?.some(id=>!topics.has(id)))throw Error(g.id+': onbekend onderwerp bij mogelijkheid');
   }
  }
 }
 const registry=require('../shared/game-registry.js')(catalog);
 for(const g of catalog){registry.presentation(g.id);registry.modes(g.id);registry.worksheets(g.id);}
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

module.exports = { render, validateRegistry };
