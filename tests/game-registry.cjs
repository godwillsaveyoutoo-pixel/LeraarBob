'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const create=require('../shared/game-registry.js'),catalog=require('../games.json'),{render}=require('../scripts/build-catalog.cjs');
const R=create(catalog,{baseURL:'https://school.example/LeraarBob/'});
assert.equal(R.list().length,22);assert.equal(R.list({featured:true}).length,6);
for(const [alias,id] of [['rechten','rechtenwereld'],['vectoren','vectoren-trainer'],['algebra','algebra-trainer'],['bewerkingen','bewerkingen-trainer']])assert.equal(R.game(alias).id,id);
assert.equal(R.game('rechtenwereld').progressId,'rechten-trainer');assert.equal(R.game('getallenwereld').progressId,'getallenwereld');
assert.equal(R.list().flatMap(g=>R.modes(g.id,{includeReferences:false})).filter(m=>m.id==='classroom').length,5);
assert.deepEqual(R.modes('algebra',{topicId:'systems'}).map(m=>m.id),['solo','classroom']);
assert.equal(R.modes('algebra',{role:'guest'}).some(m=>m.id==='classroom'),false);
assert.equal(R.modes('bewerkingen',{role:'student'}).some(m=>m.id==='teacher'),false);
assert.equal(R.modes('bewerkingen',{role:'teacher'}).some(m=>m.id==='teacher'),true);
for(const [id,file] of [['bewerkingen-trainer','games/bewerkingen-trainer/battle-config.js'],['wortelbouw','games/wortelbouw_pro_v0.5.0/wortelbouw/battle-config.js'],['rechtenwereld','games/rechten/rechtenwereld/battle-config.js'],['algebra-trainer','games/algebra-trainer/battle-config.js']])assert.deepEqual(R.game(id).topics.map(t=>t.id),require('../'+file).worlds.map(w=>w.id),'Battle topics match existing provider '+id);
assert.deepEqual(R.game('vectoren').topics.map(t=>t.id),require('../games/vectoren/vector-mission.js').STATIONS.map(w=>w.id));
assert.equal(new URL(R.destination('getallenwereld','classroom',{hub:true,topicId:'wortels'})).searchParams.get('world'),'wortels');
assert.equal(new URL(R.destination('wortelbouw','solo',{topicId:'basis'})).pathname,'/LeraarBob/games/wortelbouw_pro_v0.5.0/wortelbouw/index.html');
const ref=R.modes('getallenwereld').find(m=>m.id==='classroom');assert.equal(ref.isReference,true);assert.equal(ref.providerGameId,'bewerkingen-trainer');assert.equal(ref.providerId,'bewerkingen');assert.equal(ref.providerTitle,'Bewerkingentrainer');
assert.deepEqual(R.modes('getallenwereld',{includeReferences:false}).map(m=>m.id),['solo']);assert.equal(R.worksheets('getallenwereld',{includeReferences:false}).length,0);
let u=new URL(R.destination('algebra','classroom',{topicId:'systems'}));assert.equal(u.pathname,'/LeraarBob/games/algebra-trainer/classroom.html');assert.equal(u.searchParams.get('world'),'systems');
u=new URL(R.destination('getallenwereld','classroom',{hub:true,returnTo:'/LeraarBob/games/getallenwereld/?world=machten&level=machten-product&screen=menu'}));assert.equal(u.searchParams.get('game'),'bewerkingen-trainer');assert.equal(u.searchParams.get('view'),'create');assert.match(u.searchParams.get('returnTo'),/machten-product/);
assert.equal(new URL(R.destination('algebra','solo',{topicId:'systems'})).pathname,'/LeraarBob/games/algebra-trainer/stelsels.html');assert.equal(R.destination('gravity-maze','classroom'),null);
assert.equal(R.current('/LeraarBob/games/algebra-trainer/stelsels.html').id,'algebra-trainer');assert.equal(R.current('/LeraarBob/games/rechten/zeeslag/').id,'rechten-zeeslag');assert.equal(R.current('https://evil.example/LeraarBob/games/getallenwereld/'),null);
for(const bad of ['https://evil.example/','//evil.example/','/outside/','javascript:alert(1)'])assert.equal(new URL(R.destination('getallenwereld','local',{returnTo:bad})).searchParams.has('returnTo'),false);
const root=path.resolve(__dirname,'..');let routes=0;
for(const g of R.list()){
 for(const href of [g.href,g.route.entry,...(g.topics||[]).map(t=>t.href),...R.modes(g.id).map(m=>m.href),...R.worksheets(g.id).map(m=>m.href)]){const rel=href.split(/[?#]/)[0],file=path.resolve(root,rel);assert(file.startsWith(root+path.sep));assert(fs.existsSync(file),'Missing registered route '+href);if(fs.statSync(file).isDirectory())assert(fs.existsSync(path.join(file,'index.html')));routes++;}
 for(const module of g.engine?.modules||[])assert(fs.existsSync(path.join(root,module)),'Missing engine '+module);
}
const J=require('../games/algebra-trainer/journey-core.js'),G=require('../games/getallenwereld/lessons.js');
for(const topic of R.game('algebra').topics)assert.deepEqual(topic.levelIds,J.world(topic.id).stops.map(s=>s.id));
for(const topic of R.game('getallenwereld').topics)assert.deepEqual(topic.levelIds,G.STOPS.filter(s=>s.theme===topic.id).map(s=>s.id));
const copy=()=>structuredClone(catalog);let invalid=copy();invalid[1].modeAliases=['algebra'];assert.throws(()=>render(invalid),/alias/);
invalid=copy();invalid[0].capabilities.modes[0].href='javascript:alert(1)';assert.throws(()=>render(invalid),/platformroute/);
invalid=copy();invalid.find(g=>g.id==='getallenwereld').capabilities.worksheets[0].reference.worksheetId='missing';assert.throws(()=>render(invalid),/verwijzing/);
assert.equal(fs.readFileSync(path.join(root,'js/catalog.js'),'utf8'),render(catalog));
console.log('Register: aliases, progress identities, actual providers, references, roles, topic/level contracts and '+routes+' active routes verified.');
