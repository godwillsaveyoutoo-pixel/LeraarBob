const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../games/rechten/rechtenwereld/worksheets/hellingrug-core.js'),W=require('../games/rechten/core/wave-core.js'),V=require('../games/rechten/rechtenwereld/worksheets/hellingrug-view.js'),L=require('../shared/worksheet-layout.js');
test('papieropgaven zijn reproduceerbaar en blijven exact op de bestaande rechtenkern steunen',()=>{
 for(const mode of Object.keys(C.modes))for(let seed=1;seed<=120;seed++){
  const d=C.generate({seed,mode,count:24});assert.deepEqual(C.restore(JSON.parse(JSON.stringify(d))),d);
  assert.equal(new Set(d.tasks.map(t=>JSON.stringify([t.type,t.params.A,t.params.B]))).size,24);
  for(const t of d.tasks){const {A,B,model}=t.params;assert.deepEqual(W.model(A,B),model);for(const p of [A,B])for(const q of [p.x,p.y])assert(Math.abs(W.num(q))<=4);
   assert(W.eq(t.dx,W.sub(B.x,A.x)));assert(W.eq(t.dy,W.sub(B.y,A.y)));
   if(model.kind==='affine'){
    assert(W.eq(model.a,W.div(t.dy,t.dx)));
    assert(W.check({skill:'slope_from_two_points',params:t.params},{index:2,values:{}},model.a).ok);
   }
   if(t.type==='error_analysis')assert(!W.eq(t.wrongSlope,model.a),'diagnosevraag moet echt fout zijn');
   if(t.type==='special_lines')assert(['vertical','identical'].includes(model.kind)||model.a.n===0);
  }
 }
});
test('iedere leerdoelselectie en opbouw levert passende pagina’s zonder herschikking',()=>{
 for(let mask=1;mask<64;mask++)for(const mode of Object.keys(C.modes)){
  const types=C.types.filter((_,i)=>mask&(1<<i)).map(t=>t.id),d=C.generate({types,mode,count:24,seed:mask});
  assert(types.every(id=>d.tasks.some(t=>t.type===id)));
  if(mode==='guided')assert(d.tasks.every(t=>t.guided));if(mode==='independent')assert(d.tasks.every(t=>!t.guided));
  const pages=L.paginate(d.tasks);assert.deepEqual(pages.flatMap(p=>p.flatMap(r=>r.items.map(t=>t.id))),d.tasks.map(t=>t.id));
  for(const page of pages){assert(page.reduce((n,r)=>n+r.height,0)+6*(page.length-1)<=228);for(const row of page)assert(row.span<=2)}
  for(const kind of ['questions','key']){const out=V.render(d,kind);assert.equal((out.html.match(/data-question=/g)||[]).length,24);assert.equal((out.html.match(/class="worksheet-page"/g)||[]).length,out.count)}
 }
});
test('basisreeks bouwt op, oefent bijzondere gevallen en bewaart een afzonderlijke sleutel',()=>{
 const d=C.generate({seed:91});assert.notEqual(d.code,C.generate({seed:91,mode:'independent'}).code);assert.notEqual(d.code,C.generate({seed:91,count:12}).code);assert(d.tasks.some(t=>t.guided)&&d.tasks.some(t=>!t.guided));
 assert(d.tasks.some(t=>t.type==='special_lines'&&t.params.model.kind==='vertical'));
 assert(d.tasks.some(t=>t.type==='special_lines'&&t.params.model.kind==='affine'));
 assert.match(V.render(d,'key').html,/niet gedefinieerd/);
 assert(!V.render(d).html.includes('Delen door nul kan niet'));
 const cases=C.generate({types:['special_lines'],count:6,seed:7});assert(cases.tasks.some(t=>t.params.model.kind==='identical'));assert.match(V.render(cases,'key').html,/geen unieke rechte/);
});
test('ongeldige selecties en onverenigbare bewaargegevens worden afgewezen',()=>{
 for(const config of [{types:[]},{seed:-1},{count:100},{count:2},{mode:'anything'}])assert.throws(()=>C.generate(config));
 assert.throws(()=>C.restore({version:99}));assert.throws(()=>L.paginate([{height:999,span:2}]));
});
