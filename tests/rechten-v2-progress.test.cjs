'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const R=require('../games/rechten/rechtenwereld/mission-runtime.js'),S=require('../games/rechten/rechtenwereld/components/shell-view.js'),W=require('../games/rechten/core/wave-core.js'),M=require('../games/rechten/rechtenwereld/semantic-math-core.js');
const node=(p,area,key)=>p.areas.find(a=>a.id===area).nodes.find(n=>n.key===key);
function point(s){const t=R.active(s).task;return R.commit(R.edit(s,'answer',String(t.options.findIndex(p=>W.eq(p.x,t.target.x)&&W.eq(p.y,t.target.y)))))}
function sign(s){const m=R.active(s);return R.advance(R.commit(R.edit(s,m.phase==='grens-root'?'answer':'inequality',m.phase==='grens-root'?String(m.task.options.findIndex(q=>W.eq(q,m.task.root))):M.intervalExpected(m.task).symbol)))}
test('guest overview lists all five islands and 28 available levels and 0 future stops without invented progress',()=>{
 const s=R.initial(),p=S.journeyProgress(s);assert.equal(p.total,28);assert.equal(p.areas.flatMap(a=>a.nodes).length,28);assert.equal(p.completed,0);assert.equal(p.started,0);assert.equal(p.areas.length,5);
 for(const a of p.areas)for(const n of a.nodes)assert.equal(n.done,false);
 const html=S.book(s,{status:'Bewaard op dit toestel'});for(const a of p.areas)assert(html.includes(`data-progress-island="${a.id}"`));assert(html.includes('bewaard in deze browser op dit toestel'));
 assert(S.profile(s,{}).includes('data-screen="book"'));assert(!S.profile(s,{}).includes('id="sync"'));assert(S.profile(s,{account:{role:'student'}}).includes('id="sync"'));
});
test('unfinished tasks are distinct from completed stops, including the last checked answer',()=>{
 let s=R.start(R.initial(),'point');s=R.advance(point(s));s=R.advance(point(s));let n=node(S.journeyProgress(s),'puntenbaai','point');assert.equal(n.count,2);assert.equal(n.index,2);assert(n.started);assert(!n.done);
 while(R.active(s).index<5)s=R.advance(point(s));s=point(s);assert.equal(node(S.journeyProgress(s),'puntenbaai','point').count,6);
 s=R.advance(s);const p=S.journeyProgress(s);n=node(p,'puntenbaai','point');assert(n.done);assert(!n.started);assert.equal(n.count,6);assert.equal(p.completed,1);assert.equal(p.supported+p.independent,6);
});
test('replay retains earned completion while its current round starts at zero',()=>{
 let s=R.start(R.initial(),'point');while(!R.active(s).completed)s=R.advance(point(s));s=R.start(s,'point',true);
 const p=S.journeyProgress(s),n=node(p,'puntenbaai','point');assert(n.done);assert(n.started);assert.equal(n.count,0);assert.equal(n.action,'Verder');assert.equal(p.completed,1);assert.equal(p.started,1);
});
test('a sign root is a step, not a finished sign task or a separate zeroRead stop',()=>{
 let s=sign(R.start(R.initial(),'positive')),p=S.journeyProgress(s);assert.equal(p.completed,0);assert.equal(node(p,'grenspas','positive').count,0);assert.equal(node(p,'grenspas','zeroRead').started,false);
 while(!R.active(s).completed)s=sign(s);p=S.journeyProgress(s);assert.equal(p.completed,1);assert.equal(node(p,'grenspas','positive').count,6);assert(!node(p,'grenspas','negative').done);assert(!node(p,'grenspas','zeroRead').done);
 assert(S.book(s).includes('data-grens-skill="negative"'));
});
test('legacy completion and guest work combine read-only, and survive serialization',()=>{
 const s=R.advance(point(R.start(R.initial(),'point'))),legacy={version:704,skills:{point_plot:{intro:true,seen:6,strength:1,recent:[true,true,true,true]}},review:[],total:6};
 const before=JSON.stringify({s,legacy}),p=S.journeyProgress(s,legacy);assert.equal(p.completed,1);assert.equal(p.started,1);assert(node(p,'puntenbaai','point_plot').done);assert.equal(node(p,'puntenbaai','point_plot').count,0);
 S.book(s,{legacy});S.profile(s,{legacy});assert.equal(JSON.stringify({s,legacy}),before);assert.deepEqual(S.journeyProgress(JSON.parse(JSON.stringify(s)),legacy),p);
});
