'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const R=require('../games/rechten/trainer-v2/mission-runtime.js'),S=require('../games/rechten/trainer-v2/components/shell-view.js'),G=require('../games/rechten/trainer-v2/components/boundary-view.js'),M=require('../games/rechten/trainer-v2/semantic-math-core.js');
const root=path.resolve(__dirname,'..');
function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v)}return v}
test('world-shell refactor preserves the exact v2 validators, IDs, adapters and storage bytes',()=>{
 const files=require('../docs/rechten-v2/world-shell/PRESERVED_CORE.json');assert.equal(Object.keys(files).length,7);
 for(const [file,hash] of Object.entries(files).filter(([file])=>!file.endsWith('/mission-runtime.js')))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hash,file);
});
test('all areas open and the positive Grenspas stop still starts its exercise, without mutating progress or unlocks',()=>{
 const state=freeze(R.start(R.initial(),'grenspas')),before=JSON.stringify(state),world=S.world(state,{}),area=S.area(state,{});
 assert.equal((world.match(/data-world-node=/g)||[]).length,5);assert.equal((world.match(/data-screen="area" data-area=/g)||[]).length,7);
 assert.equal((area.match(/data-skill=/g)||[]).length,5);assert.equal((area.match(/data-start="grenspas"/g)||[]).length,2);
 assert.equal(JSON.stringify(state),before);
 assert(world.includes('haltes · ontdek'));assert(area.includes('data-skill="zeroRead"'));assert(area.includes('data-skill="signchart"'));
});
test('completed map status uses existing evidence and survives explicit mission replay without granting mastery',()=>{
 let state=R.start(R.initial(),'grenspas');state.events.push({taskId:R.active(state).task.id,attemptId:'symbol:3',skill:'sign',phase:'execute',variant:0,correct:true,supported:true,mastery:false});
 assert(S.progress(state).complete);const before=JSON.stringify(state.events);state=R.start(state,'grenspas',true);
 assert(S.progress(state).complete);assert(S.area(state,{}).includes('skill-positive is-completed'));assert.equal(JSON.stringify(state.events),before);assert.equal(state.events[0].mastery,false);
});
test('HUD uses only actual legacy values; unknown XP/streak are not filled with mockup numbers',()=>{
 const state=R.initial();assert(!S.header(state).includes('xp-stat'));assert(!S.header(state).includes('streak'));
 const hud=S.header(state,{legacy:{state:{xp:617,streak:4}}});assert(hud.includes('617'));assert(hud.includes('4 dagen'));assert(!hud.includes('596'));assert(!hud.includes('2 dagen'));
});
test('boundary rendering shows the learner pin, never a prefilled solution or automatic evidence hint',()=>{
 let state=R.start(R.initial(),'grenspas'),m=R.active(state);const empty=G.graph(m);assert(!empty.includes('class="pin-label"'));assert(!empty.includes('class="positive-line"'));
 state=R.edit(state,'root','2');m=freeze(R.active(state));const before=JSON.stringify(m),graph=G.graph(m);assert(graph.includes('x = 2'));assert(!graph.includes('x = 3'));assert.equal(JSON.stringify(m),before);
 const evidence={...JSON.parse(JSON.stringify(m)),task:M.makeTask('grenspas',{variant:1,mode:'evidence'}),index:1,phase:'interval'};
 const display=G.render(evidence).workspace;assert(display.includes('reminder-paper is-closed'));assert(!display.includes('Waar ligt de grafiek'));assert(display.includes('Grafiek van f'));assert(!display.includes('positive-line'));
});
