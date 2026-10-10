const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const C=require('../games/logicawereld/content.js'),L=require('../games/logicawereld/logic.js'),W=require('../games/logicawereld/worksheet.js');
test('Every task can be printed with a nonempty key; alternatives and contraposition remain mathematically valid',()=>{
 for(const t of C.tasks){assert.ok(W.question(t).length>0,t.id);assert.ok(W.solution(t).length>0,t.id);if(t.type==='build'||t.type==='circuit')assert.ok(L.equivalent(W.solution(t),t.expr),t.id);}
 const table=C.tasks.find(t=>t.type==='table'&&t.vars?.length===3);assert.equal((W.solution(table).match(/<tr>/g)||[]).length,9);
 const counter=C.tasks.find(t=>t.type==='counter'&&t.domain.filter(n=>L.validate(t,n).correct).length>1);assert.ok(counter);assert.equal(W.solution(counter).split(', ').length,counter.domain.filter(n=>L.validate(counter,n).correct).length);
 const unsafe={...C.tasks[0],prompt:'<script>bad()</script>',stem:'<img onerror=bad()>',options:[{id:'0',label:'<iframe>'}],correct:'0'};assert.ok(!W.question(unsafe).includes('<img'));const content={...C,stops:[{...C.stops[0],tasks:[unsafe]}]};const html=W.render(content,{solutions:true});assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>bad'));
});
test('OS bridge offers registered capabilities with teacher gating, never a query-string role',()=>{
 const calls=[],state={role:'student',accountId:'p1'},modes=[{id:'classlearn',participation:'group'},{id:'online',participation:'duo'},{id:'teacher',participation:'solo'}];
 const host={location:{origin:'https://school.test'},LeraarBobDesktop:{state:()=>state,openApp:(...a)=>{calls.push(a);return true;},showView:v=>calls.push(v)},LeraarBobGameRegistry:{modes:()=>modes}};
 const win={parent:host,location:{origin:'https://school.test',search:'?previewUser=teacher'}};const ctx={window:win};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../games/logicawereld/os-bridge.js'),'utf8'),ctx);
 const B=win.LogicaOS;assert.deepEqual(Array.from(B.sessionModes(),m=>m.id),['online']);assert.equal(B.openMode('classlearn',0),false);state.role='teacher';assert.equal(B.openMode('classlearn',4),true);assert.equal(calls[0][2].topicId,'halte-5');host.location.origin='https://other.test';assert.equal(B.context().embedded,false);assert.equal(B.openMode('online',0),false);
});
