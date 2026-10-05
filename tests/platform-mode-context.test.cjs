'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const create=require('../shared/game-registry.js'),catalog=require('../games.json');
function modes(source='/LeraarBob/games/getallenwereld/?topic=machten&level=machten-product&screen=chapter'){
 const base='https://school.example/LeraarBob/',R=create(catalog,{baseURL:base}),location=new URL(source,base),window={LeraarBobGameRegistry:R};
 vm.runInNewContext(fs.readFileSync('shared/play-modes.js','utf8'),{window,URL,location,document:{currentScript:{src:base+'shared/play-modes.js'},body:null,querySelectorAll:()=>[]},Promise});return window.LeraarBobPlayModes;
}
test('Mode descriptions reflect the actual provider and access method',()=>{
 const P=modes(),entries=P.modes('getallenwereld',{role:'teacher'});
 const duo=entries.find(m=>m.id==='learn'),battle=entries.find(m=>m.id==='online'),klass=entries.find(m=>m.id==='classlearn');
 assert.match(duo.devices,/2 spelers/);assert.doesNotMatch(duo.access,/alias|uitnodiging/);assert.match(battle.access,/sessiecode/);assert.match(klass.devices,/klas/);
 assert.equal(P.modes('getallenwereld',{role:'student'}).some(m=>['classlearn','teacher'].includes(m.id)),false);
 assert.equal(P.modes('algebra',{role:'student'}).some(m=>m.id==='learn'),false);
 assert.match(P.modes('rechtenwereld',{role:'student'}).find(m=>m.id==='online').access,/uitnodiging/);
});
test('Routes to reports and worksheets cannot be relabelled as a play mode',()=>{
 const P=modes(),node=href=>({id:'',href:'https://school.example/LeraarBob/'+href});
 assert.equal(P.navigation(node('games/bewerkingen-trainer/start.html?view=rankings'),'getallenwereld'),null);
 assert.equal(P.navigation(node('games/bewerkingen-trainer/start.html?view=students'),'getallenwereld'),null);
 assert.equal(P.navigation(node('games/bewerkingen-trainer/?intent=worksheet'),'getallenwereld'),null);
 assert.equal(P.navigation(node('games/bewerkingen-trainer/start.html?view=learn&audience=duo'),'getallenwereld').id,'learn');
 assert.equal(P.navigation(node('games/bewerkingen-trainer/start.html?view=battle&audience=duo'),'getallenwereld').id,'online');
});
test('Central learning and rankings preserve world, topic and the exact return route',()=>{
 const P=modes();for(const view of ['learn','rankings']){const u=new URL(P.hubDestination(view));assert.equal(u.pathname,'/LeraarBob/klasbattle/');assert.equal(u.searchParams.get('game'),'getallenwereld');assert.equal(u.searchParams.get('view'),view);assert.equal(u.searchParams.get('world'),'machten');assert.equal(u.searchParams.get('level'),'machten-product');assert.equal(u.searchParams.get('returnTo'),'/LeraarBob/games/getallenwereld/?topic=machten&level=machten-product&screen=chapter');}
 assert.equal(new URL(P.hubDestination('learn',{returnTo:'https://evil.invalid/'})).searchParams.has('returnTo'),false);
});
