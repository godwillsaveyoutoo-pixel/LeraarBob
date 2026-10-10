'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const catalog=require('../games.json'),createRegistry=require('../shared/game-registry.js'),createDesktop=require('../os/desktop-model.js');
const registry=createRegistry(catalog,{baseURL:'https://school.example/LeraarBob/'}),M=createDesktop(registry),root=path.resolve(__dirname,'..');
test('Every public build has a theme and its own work form; historical identities stay intact',()=>{
  assert.equal(M.apps().length,25);assert.equal(M.themes.length,8);
  for(const g of M.apps()){assert(M.theme(g.desktopTheme),g.id);assert(M.types[g.type],g.id);}
  assert.equal(M.app('pythagoras').type,'learn');assert.equal(M.app('rechtenwereld').type,'train');assert.equal(M.app('rechten-zeeslag').type,'game');assert.equal(M.app('glasraam').type,'atelier');
  assert.equal(M.app('rechtenwereld').progressId,'rechten-trainer');assert.equal(M.app('getallenwereld').progressId,'getallenwereld');
  assert.equal(M.app('bewerkingen-trainer'),null);assert(M.find({themeId:'rechten',type:'learn'}).length>=2);
});
test('All app, mode, worksheet and artwork routes exist, including project subdirectory deployment',()=>{
  for(const g of M.apps())for(const href of [g.href,g.cover,...M.modes(g.id,'teacher').map(m=>m.href),...M.worksheets(g.id).map(s=>s.href)]){
    const local=path.join(root,href.split(/[?#]/)[0]);assert(fs.existsSync(local),href);if(fs.statSync(local).isDirectory())assert(fs.existsSync(path.join(local,'index.html')),href);
  }
  assert.equal(new URL(M.destination('glasraam','solo',{returnTo:'/LeraarBob/os/'})).pathname,'/LeraarBob/games/rechten/rechtenwereld/glasatelier.html');
  assert.equal(new URL(M.destination('pythagoras','solo')).searchParams.get('v'),'20260920-3');
  assert.equal(new URL(M.destination('rechten-zeeslag','solo')).searchParams.get('solo'),'1','Solo enters the existing computer game directly');
  assert.equal(new URL(M.destination('rechten-zeeslag','online',{role:'student'})).searchParams.get('solo'),null,'Online keeps its existing lobby');
});
test('Learners participate in classes but cannot create them through startup options or direct launch',()=>{
  const host=new Set(['classroom','classlearn','teacher','live']);
  for(const g of M.apps())for(const role of ['guest','student']){
    assert(M.modes(g.id,role).every(m=>!host.has(m.id)),`${role}: ${g.id}`);
    for(const mode of host)assert.equal(M.destination(g.id,mode,{role}),null,`${role}: ${g.id}/${mode}`);
  }
  assert(M.modes('getallenwereld','teacher').some(m=>m.id==='classlearn'));
  assert(M.modes('rechtenwereld','teacher').some(m=>m.id==='classroom'));
  assert.equal(new URL(M.destination('rechtenwereld','classroom',{role:'teacher'})).searchParams.get('create'),'1');
  assert.equal(M.modes('pythagoras','teacher').length,1,'Do not invent future Battle or paper providers');
  assert.equal(M.worksheets('rechten-zeeslag').length,0);
});
test('Search distinguishes work forms and tolerates accents',()=>{
  assert.equal(M.find({query:'pythagoras les'}).some(g=>g.id==='pythagoras'),true);
  assert.equal(M.find({query:'rechte spel'}).some(g=>g.id==='rechten-zeeslag'),true);
  assert.equal(M.find({query:'reele'}).some(g=>g.id==='reele-getallen-trainer'),true);
  assert.equal(M.find({themeId:'rechten',type:'atelier'})[0].id,'glasraam');
});
test('Desktop preferences are per account and never overwrite a learning progress key',()=>{
  const map=new Map([['axioma_game_progress','untouched']]),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)},a={id:'student-a'},b={id:'student-b'};
  const first=M.read(storage,a);first.pins=['pythagoras'];first.saved=[{id:'pythagoras',mode:'solo',href:'https://school.example/LeraarBob/games/pythagoras.html'}];M.write(storage,a,first);
  assert.deepEqual(M.read(storage,a).pins,['pythagoras']);assert.equal(M.read(storage,b).saved.length,0);assert.deepEqual(M.read(storage,null).pins,M.defaults.pins);assert.equal(map.get('axioma_game_progress'),'untouched');
  const invalid=M.sanitize({pins:['missing','pythagoras','pythagoras'],saved:[{id:'pythagoras',href:'https://evil.example/'}]});assert.deepEqual(invalid.pins,['pythagoras']);assert.equal(invalid.saved.length,0);
  for(const bad of ['https://evil.example/','javascript:alert(1)','/outside/','https://user:secret@school.example/LeraarBob/'])assert.equal(M.safeURL(bad),null);
});
