const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../games/rechten/rechtenwereld/worksheets/grenspas-core.js'),V=require('../games/rechten/rechtenwereld/worksheets/grenspas-view.js'),W=require('../games/rechten/core/wave-core.js'),G=require('../games/rechten/rechtenwereld/grens-core.js'),M=require('../games/rechten/rechtenwereld/semantic-math-core.js'),L=require('../shared/worksheet-layout.js');
test('Grenspas paper uses exact roots and the existing digital sign/interval validators',()=>{
 const cases=new Set();for(const mode of Object.keys(C.modes))for(let seed=1;seed<=120;seed++){
  const doc=C.generate({seed,mode,count:24});assert.deepEqual(C.restore(JSON.parse(JSON.stringify(doc))),doc);assert.equal(new Set(doc.tasks.map(t=>JSON.stringify([t.type,t.params.model]))).size,24);
  for(const t of doc.tasks){const {root,model}=t.params;assert(Math.abs(W.num(root))<=3);assert([1,2].includes(root.d));assert(model.a.n!==0);assert(M.checkRoot(t.params,W.text(root)).ok);assert(!M.checkRoot(t.params,W.text(W.add(root,1))).ok);assert.deepEqual(t.chart,G.expectedChart(t.params));
   cases.add(root.n<0?'negative':root.n===0?'zero':'positive');cases.add(root.d>1?'fraction':'integer');cases.add(model.a.n>0?'rising':'falling');
   if(['positive','negative'].includes(t.type)){const task={...t.params,ask:t.type},response={boundary:W.text(root),symbolBoundary:W.text(root),side:t.symbol==='>'?'right':'left',symbol:t.symbol,closed:false};assert(M.checkInterval(task,response).ok);assert(!M.checkInterval(task,{...response,closed:true}).ok);assert(!M.checkInterval(task,{...response,side:response.side==='left'?'right':'left'}).ok);}
  }
 }
 assert.deepEqual([...cases].sort(),['negative','zero','positive','fraction','integer','rising','falling'].sort());
});
test('all 31 skill selections support 24 unique ordered tasks in every guidance mode',()=>{
 for(let mask=1;mask<32;mask++)for(const mode of Object.keys(C.modes)){
  const types=C.types.filter((_,i)=>mask&(1<<i)).map(t=>t.id),doc=C.generate({types,mode,count:24,seed:mask});assert(types.every(id=>doc.tasks.some(t=>t.type===id)));assert.equal(new Set(doc.tasks.map(t=>JSON.stringify([t.type,t.params.model]))).size,24);
  if(mode==='guided')assert(doc.tasks.every(t=>t.guided));if(mode==='independent')assert(doc.tasks.every(t=>!t.guided));
  const pages=L.paginate(doc.tasks);assert.deepEqual(pages.flatMap(p=>p.flatMap(r=>r.items.map(t=>t.id))),doc.tasks.map(t=>t.id));for(const page of pages)assert(page.reduce((n,r)=>n+r.height,0)+6*(page.length-1)<=228);
  for(const kind of ['questions','key']){const out=V.render(doc,kind);assert.equal((out.html.match(/data-question=/g)||[]).length,24);assert.equal((out.html.match(/class="worksheet-page"/g)||[]).length,out.count)}
 }
});
test('paper leaves responses blank, keeps its key separate and fades guidance',()=>{
 const doc=C.generate({seed:17});assert(doc.tasks.some(t=>t.guided)&&doc.tasks.some(t=>!t.guided));assert(doc.tasks.some(t=>t.type==='signchart'&&t.graph));assert(doc.tasks.some(t=>t.type==='signchart'&&!t.graph));
 const questions=V.render(doc).html,key=V.render(doc,'key').html;assert(!questions.includes('De nulwaarde hoort er <strong>niet</strong> bij'));assert(key.includes('De nulwaarde hoort er <strong>niet</strong> bij'));assert(questions.includes('answer-blank'));assert(!questions.includes('Ingevuld tekenschema'));
 assert.match(doc.code,/^GP1-/);assert.notEqual(doc.code,C.generate({seed:17,mode:'independent'}).code);assert.notEqual(doc.code,C.generate({seed:17,count:12}).code);
 for(const raw of [{types:[]},{count:1},{count:25},{seed:0},{mode:'unknown'}])assert.throws(()=>C.generate(raw));assert.throws(()=>C.restore({version:99}));
});
