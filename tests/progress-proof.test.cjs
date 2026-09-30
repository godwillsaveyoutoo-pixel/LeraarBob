const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const P=require('../shared/progress-proof-model.js'),context={window:{}};vm.runInNewContext(fs.readFileSync('js/catalog-progress.js','utf8'),context);const progress=context.window.LeraarBobCatalogProgress,catalog=JSON.parse(fs.readFileSync('games.json'));
const account={id:'student-a',role:'student',alias:'muis',class_code:'4TMW'};
const overview={accountId:account.id,errors:{},trainer:{state:{xp:90,total:12,correct:8}},games:[
 {game_id:'rechten-trainer',state:{rechtenV2:{platformXp:35,missions:{point:{world:'puntenbaai',completed:true},delta:{world:'hellingrug',completed:false}}}}},
 {game_id:'vectoren-trainer',state:{completed:['a'],total:24,storage:{'axioma-vectorentrainer-v020':JSON.stringify({progress:{xp:120}})}}},
 {game_id:'gravity-maze',state:{completed:[1,2],total:9}}
]};
test('receipt reuses central XP, reports actual world rounds and excludes unsaved games',()=>{
 const before=JSON.stringify({account,overview}),r=P.build({account,overview,catalog,name:'  Élodie\nD’Haene  ',now:123},progress);
 assert.equal(r.xp,245);assert.equal(r.entries.length,4);assert.equal(r.name,'Élodie D’Haene');assert.equal(r.alias,'muis');assert.equal(r.className,'4TMW');
 const world=r.entries.find(e=>e.id==='rechtenwereld');assert.equal(world.xp,35);assert.equal(world.label,'1 oefenreeks afgerond · 1 bezig');assert.deepEqual(world.details,['Puntenbaai: 1 afgerond, 0 bezig','Hellingrug: 0 afgerond, 1 bezig']);
 assert.equal(r.entries.find(e=>e.id==='gravity-maze').xp,null);assert.equal(JSON.stringify({account,overview}),before);assert(!JSON.stringify(r).includes(account.id));
});
test('one-game export uses only that game; empty confirmed accounts remain honestly empty',()=>{
 const r=P.build({account,overview,catalog,selected:'rechtenwereld'},progress);assert.equal(r.xp,35);assert.equal(r.entries.length,1);assert.equal(r.name,'muis');
 const empty=P.build({account,overview:{accountId:account.id,errors:{},games:[],trainer:null},catalog},progress);assert.equal(empty.entries.length,0);assert.equal(empty.xp,0);
 assert.throws(()=>P.build({account,overview,catalog,selected:'injected'},progress),/Kies/);
});
test('partial failures and account replacement never export a misleading zero or another pupil',()=>{
 for(const broken of [{...overview,errors:{games:true}},{...overview,errors:{trainer:true}},{...overview,accountId:'other'}])assert.throws(()=>P.build({account,overview:broken,catalog},progress));
 assert.throws(()=>P.build({account:{...account,role:'teacher'},overview,catalog},progress));
});
test('unsynced warnings only inspect the same project, pupil and selected game',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)},project='https://test.invalid';
 data.set('axioma:rechten:v2:'+encodeURIComponent(project)+':student:'+account.id,JSON.stringify({dirty:true}));
 data.set('axioma:progress:v2:'+encodeURIComponent(project)+':student:other:gravity-maze',JSON.stringify({dirty:true}));
 const args={account,catalog,storage,project};assert.deepEqual(P.pendingGames(args),['Rechtenwereld']);assert.deepEqual(P.pendingGames({...args,selected:'gravity-maze'}),[]);assert.deepEqual(P.pendingGames({...args,project:'elsewhere'}),[]);
});
test('PDF filenames are safe, accented names recognizable, Belgian date used',()=>{
 const report={name:"Élodie D’Haene / ../test",createdAt:Date.parse('2026-09-29T23:30:00Z')};assert.equal(P.filename(report),'leraarBob-voortgang-Elodie-D-Haene-test-2026-09-30.pdf');assert.match(P.filename({...report,name:'李 明'}),/leerling/);
});
