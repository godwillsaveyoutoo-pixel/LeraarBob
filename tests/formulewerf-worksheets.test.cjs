const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../games/rechten/rechtenwereld/worksheets/formulewerf-core.js'),V=require('../games/rechten/rechtenwereld/worksheets/formulewerf-view.js'),W=require('../games/rechten/core/wave-core.js'),L=require('../shared/worksheet-layout.js');
test('Formulewerf paper: reproducible exact equations, points and tables; no repeated question',()=>{
 for(let seed=1;seed<=60;seed++)for(const mode of Object.keys(C.modes)){
  const doc=C.generate({seed,count:24,mode});assert.deepEqual(C.restore({version:1,config:doc.config}),doc);
  const seen=new Set();for(const t of doc.tasks){const {model,points,table,equation}=t.params,signature=JSON.stringify([t.type,model]);assert(!seen.has(signature));seen.add(signature);
   for(const p of Object.values(points||{}).concat(table||[]))assert(W.onLine(p,model));
   if(equation)assert(W.equivalent(equation,{left:W.expr(0,1),right:W.expr(model.a,0,model.b)}));
   if(t.type==='graph_from_equation'){assert(!V.graph(t).includes('stroke-width="1.8"'));assert(V.graph(t,true).includes('stroke-width="1.8"'));}
  }
 }
});
test('every selection can generate a full sheet; pages preserve order and room',()=>{
 for(let mask=1;mask<256;mask++){
  const types=C.types.filter((_,i)=>mask&(1<<i)).map(t=>t.id),doc=C.generate({seed:21,count:24,types});
  assert.equal(doc.tasks.length,24);assert.deepEqual([...new Set(doc.tasks.map(t=>t.type))],types);
  assert(L.paginate(doc.tasks).every(rows=>rows.reduce((s,r)=>s+r.height,0)+6*(rows.length-1)<=228));
  assert(V.render(doc).count>0);assert(V.render(doc,'key').html.includes('verbetersleutel'));
 }
 assert.throws(()=>C.generate({count:6}),/minstens/);assert.throws(()=>C.generate({types:[]}),/leerdoel/);
});
