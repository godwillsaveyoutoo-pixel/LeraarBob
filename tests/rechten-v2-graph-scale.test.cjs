const test=require('node:test'),assert=require('node:assert/strict');
const K=require('../games/rechten/rechtenwereld/components/graph-scale.js');
const {fixtures}=require('./helpers/rechten-question-fixtures.cjs');
test('nearby data gets more space, with equal units and the origin retained',()=>{
 const close=K.points({A:{x:0,y:.5},B:{x:1,y:1}}),far=K.points({A:{x:-4,y:4},B:{x:4,y:-4}});
 assert.equal(close.radius,2);assert.equal(far.radius,5);assert(close.unit>far.unit);assert.equal(close.X(0),250);assert.equal(close.Y(0),250);assert.equal(close.X(1)-close.X(0),close.Y(0)-close.Y(1));
});
test('half-unit grids preserve their value, and construction grids keep their coordinates',()=>{
 const s=K.fit([1.5],{step:.5});assert(Math.abs(s.X(.5)-s.X(0)-s.unit/2)<1e-10);assert(s.grid.includes('half-grid'));
 for(const values of [[0],[1,2],[-4,4]]){const f=K.fit(values,{fixed:true});assert.equal(f.unit,40);assert.equal(f.X(2),330);assert.equal(f.Y(4),90)}
});
test('all given points fit the adaptive frame and rendered views use the shared scale',()=>{
 for(const row of fixtures().filter(r=>r.label.endsWith('/ready'))){const t=row.m.task;
  if(t.points){const s=K.points(t.points);for(const p of Object.values(t.points))for(const n of [s.X(p.x),s.Y(p.y)])assert(n>=50&&n<=450,row.label)}
  const V=require('../games/rechten/rechtenwereld/components/'+({Points:'points',Hills:'hills',Lines:'lines',Grens:'grens',Formula:'formula',Derive:'derive',AB:'ab'}[row.family])+'-view.js'),html=V.render(row.m,'');
  if(html.includes('class="math-graph'))assert(html.includes('data-axis-radius='),row.label);
 }
});
test('a construction frame stays the same across selections and feedback',()=>{
 const P=require('../games/rechten/rechtenwereld/components/points-view.js'),F=require('../games/rechten/rechtenwereld/components/formula-view.js'),L=require('../games/rechten/rechtenwereld/components/lines-view.js');
 for(const row of fixtures().filter(r=>['point_plot','graph_from_equation','special_lines'].includes(r.m.skill)&&!r.m.completed)){
  const html=(row.family==='Points'?P:row.family==='Formula'?F:L).graph(row.m);assert(html.includes('data-axis-radius="5"'),row.label);
 }
});
