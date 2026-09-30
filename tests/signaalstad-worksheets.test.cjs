const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../games/rechten/rechtenwereld/worksheets/signaalstad-core.js'),V=require('../games/rechten/rechtenwereld/worksheets/signaalstad-view.js'),W=require('../games/rechten/core/wave-core.js'),F=require('../games/rechten/rechtenwereld/formula-core.js'),A=require('../games/rechten/rechtenwereld/content/area-maps.js'),L=require('../shared/worksheet-layout.js');
test('paper exactly covers released Signaalstad content and matches digital drawing checks',()=>{
 assert.deepEqual(C.types.map(t=>t.id),A.all(A.get('signaalstad')).filter(n=>n.playable).map(n=>n.key));
 let halves=0,horizontal=0,positive=0,negative=0;
 for(let seed=1;seed<=120;seed++)for(const mode of Object.keys(C.modes)){
  const doc=C.generate({seed,mode,count:24});assert.deepEqual(C.restore({version:1,config:doc.config}),doc);const seen=new Set();
  for(const t of doc.tasks){const {model,table}=t.params,sig=JSON.stringify(model);assert(!seen.has(sig));seen.add(sig);assert.equal(new Set(table.map(p=>W.text(p.x))).size,3);
   for(const p of table){assert(W.onLine(p,model));assert(Math.abs(W.num(p.x))<=4&&Math.abs(W.num(p.y))<=4);if(p.y.d>1)halves++;}
   const task={...F.makeTask('graph_from_table'),model,table,gridStep:.5,legacy:{skill:'graph_from_table',params:{model,table}}};
   for(const [i,j] of [[0,1],[1,2],[2,0]])assert(F.check(task,{plotA:{x:W.num(table[i].x),y:W.num(table[i].y)},plotB:{x:W.num(table[j].x),y:W.num(table[j].y)}},'formula-plot').ok);
   if(!model.a.n)horizontal++;else if(model.a.n>0)positive++;else negative++;
  }
  assert.equal(doc.tasks.filter(t=>t.guided).length,mode==='guided'?24:mode==='progressive'?10:0);
  assert(L.paginate(doc.tasks).every(rows=>rows.reduce((s,r)=>s+r.height,0)+6*(rows.length-1)<=228));
 }
 assert(halves&&horizontal&&positive&&negative);
});
test('empty student graphs have no solution; separate keys contain the line and all three points',()=>{
 for(const t of C.generate().tasks){assert(!V.graph(t).includes('<circle'));assert(!V.graph(t).includes('stroke-width="1.8"'));assert.equal((V.graph(t,true).match(/<circle/g)||[]).length,3);assert(!V.student(t).includes('f(x) ='));assert(V.answer(t).includes('f(x) ='));}
 assert.throws(()=>C.generate({types:[]}),/leerdoel/);assert.throws(()=>C.generate({count:25}),/maximaal/);assert.throws(()=>C.restore({version:2}),/werkbladversie/);
});
