'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const R=require('../games/rechten/rechtenwereld/mission-runtime.js'),S=require('../games/rechten/rechtenwereld/components/shell-view.js'),G=require('../games/rechten/rechtenwereld/components/boundary-view.js'),M=require('../games/rechten/rechtenwereld/semantic-math-core.js');
const root=path.resolve(__dirname,'..');
function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v)}return v}
test('world-shell keeps saved-evidence format and storage byte-identical',()=>{
 const files=require('../docs/rechten-v2/world-shell/PRESERVED_CORE.json');
 // The expanded engine has behavioral tests. Skill IDs are checked in the math catalog test; context activation intentionally changes skills.json.
 for(const file of ['evidence-adapter.js','storage.js']){
  const name='games/rechten/rechtenwereld/'+file;
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex'),files[name],name);
 }
});
test('map shows all five destinations while unavailable worlds cannot start exercises',()=>{
 const state=freeze(R.initial()),before=JSON.stringify(state),world=S.world(state,{});
 assert.equal((world.match(/data-world-node=/g)||[]).length,5);
 for(const id of ['grenspas','formulewerf','signaalstad'])assert(world.includes('place-'+id+' is-locked'));
 assert(world.includes('Voorkennis · vrij herhalen'));assert(world.includes('Naar Hellingrug'));
 // Catch malformed quotes that swallowed the recommendation button's content.
 assert.match(world, /id="start-recommended"[^>]*data-screen="area" data-area="hellingrug" data-zone="route">/);
 assert.equal(JSON.stringify(state),before);
 const opened=freeze(R.start(R.initial(),'grenspas')),snapshot=JSON.stringify(opened),area=S.area(opened,{});
 assert.equal((area.match(/data-skill=/g)||[]).length,5);assert.equal((area.match(/data-start="grenspas"/g)||[]).length,6);
 assert(area.includes('data-skill="zeroRead"'));assert(area.includes('data-skill="signchart"'));assert.equal(JSON.stringify(opened),snapshot);
});
test('completed map status survives replay without inventing XP or mastery',()=>{
 let state=R.start(R.initial(),'grenspas');state.events.push({taskId:R.active(state).task.id,attemptId:'symbol:3',skill:'sign',phase:'execute',variant:0,correct:true,supported:true,mastery:false});
 assert(S.progress(state).complete);assert.match(S.header(state),/data-platform-progress="xp" data-value="0" data-total="28"/);assert(S.header(state).includes('1/28 levels afgerond'));
 const before=JSON.stringify(state.events);state=R.start(state,'grenspas',true);
 assert(S.progress(state).complete);assert.match(S.header(state),/data-platform-progress="xp" data-value="0"/);assert(S.area(state,{}).includes('skill-positive is-completed'));assert.equal(JSON.stringify(state.events),before);assert.equal(state.events[0].mastery,false);
});
test('HUD reads the migrated XP ledger, without counting legacy XP twice or inventing a streak',()=>{
 const state=R.initial();assert(!S.header(state).includes('streak'));
 assert.match(S.header(state,{legacy:{state:{xp:617,streak:4}}}),/data-platform-progress="xp" data-value="0"/);
 state.platformXp=617;const hud=S.header(state,{legacy:{state:{xp:999,streak:4}}});
 assert.match(hud,/data-platform-progress="xp" data-value="617"/);assert(!hud.includes('999'));assert(!hud.includes('4 dagen'));
});
test('boundary rendering shows the learner pin, never a prefilled solution or automatic evidence hint',()=>{
 let state=R.start(R.initial(),'grenspas'),m=R.active(state);const empty=G.graph(m);assert(!empty.includes('class="pin-label"'));assert(!empty.includes('class="positive-line"'));
 state=R.edit(state,'root','2');m=freeze(R.active(state));const before=JSON.stringify(m),graph=G.graph(m);assert(graph.includes('x = 2'));assert(!graph.includes('x = 3'));assert.equal(JSON.stringify(m),before);
 const evidence={...JSON.parse(JSON.stringify(m)),task:M.makeTask('grenspas',{variant:1,mode:'evidence'}),index:1,phase:'interval'};
 const display=G.render(evidence).workspace;assert(display.includes('reminder-paper is-closed'));assert(!display.includes('Waar ligt de grafiek'));assert(display.includes('Grafiek van f'));assert(!display.includes('positive-line'));
});
