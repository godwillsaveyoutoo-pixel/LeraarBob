// Application-state verification with a small DOM stub. This is not a browser layout test.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),test=require('node:test'),assert=require('node:assert/strict');
const Logic=require('../games/logicawereld/logic.js'),Content=require('../games/logicawereld/content.js');
function createApp(storage=new Map(),query=''){
 const listeners={},nodes={};let context,blobText='',destination='';const classes=new Set();
 const node=id=>nodes[id]||(nodes[id]={id,hidden:false,innerHTML:'',textContent:'',dataset:{},href:'https://leraarbob-bureaublad.ilovejezuschristus.chatgpt.site',addEventListener:(name,fn)=>listeners[id+':'+name]=fn,focus(){context.document.activeElement=this;},contains:()=>false,querySelectorAll:()=>[],append(){},remove(){},click(){}});
 const store={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 context={Logic,LogicContent:Content,console,structuredClone,URLSearchParams,innerHeight:360,location:{pathname:'/games/logicawereld/',href:'https://school.test/games/logicawereld/'+query,search:query,assign:v=>destination=String(v),replace:v=>destination=String(v)},localStorage:store,setTimeout:fn=>fn(),Event:class{constructor(type){this.type=type;}},Blob:class{constructor(parts){blobText=parts.join('');}},URL:class extends URL{static createObjectURL(){return 'blob:test'}static revokeObjectURL(){}},document:{getElementById:node,activeElement:null,body:{dataset:{},classList:{contains:v=>classes.has(v),add:v=>classes.add(v),toggle(v,on){on?classes.add(v):classes.delete(v);}},append(){}},createElement:()=>node('exportLink'),documentElement:{requestFullscreen:async()=>{}},fullscreenElement:null},dispatchEvent(){},addEventListener:(n,f)=>listeners['window:'+n]=f};
 context.window=context;context.parent=context;vm.createContext(context);for(const file of ['worksheet.js','os-bridge.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../games/logicawereld/',file),'utf8'),context);
 const click=async(action,d={})=>listeners['app:click']({target:{closest:()=>({disabled:false,dataset:{action,...d}})}});
 return {context,nodes,storage,click,state:()=>context.Logicawereld.state(),html:()=>node('app').innerHTML,exportText:()=>blobText,destination:()=>destination};
}
function correctAnswer(t){if(t.type==='choice'||t.type==='multi')return t.correct;if(t.type==='predict')return Logic.value(t.expr,t.env);if(t.type==='table')return Logic.cases(t.vars||Logic.variables(t.columns.map(c=>c.expr).join(''))).map(e=>t.columns.map(c=>Logic.value(c.expr,e)));if(t.type==='difference')return Logic.cases([...new Set([...Logic.variables(t.expr),...Logic.variables(t.other)])]).find(e=>Logic.validate(t,e).correct);if(t.type==='counter')return t.domain.find(n=>Logic.validate(t,n).correct);if(t.type==='classify')return Logic.classify(t.expr);if(t.type==='puzzle')return t.candidates.find(c=>Logic.validate(t,c.id).correct).id;
 if(t.type==='build'){for(const left of ['p','q'])for(const right of ['p','q'])for(const op of ['∧','∨','⇒','⇔'])for(const leftNot of [false,true])for(const rightNot of [false,true])for(const outerNot of [false,true]){const a={left,right,op,leftNot,rightNot,outerNot};if(Logic.validate(t,a).correct)return a;}}
 if(t.type==='circuit'){for(const a of ['PASS','NOT'])for(const b of ['PASS','NOT'])for(const c of t.allowDerived?['AND','OR','NAND','NOR']:['AND','OR']){const g=[a,b,c];if(Logic.validate(t,g).correct)return g;}}
 throw Error(t.id);
}
async function fill(app,t,a=correctAnswer(t)){
 if(['choice','puzzle'].includes(t.type))await app.click('choice',{id:a});
 else if(t.type==='multi')for(const id of a)await app.click('choice',{id});
 else if(t.type==='predict')await app.click('truth',{value:String(a)});
 else if(t.type==='classify')await app.click('classify',{id:a});
 else if(t.type==='counter')await app.click('number',{value:String(a)});
 else if(t.type==='difference'){for(const [v,b] of Object.entries(a))if(b)await app.click('env',{id:v});}
 else if(t.type==='circuit')for(let i=0;i<3;i++)await app.click('gate',{index:String(i),id:a[i]});
 else if(t.type==='build'){for(const key of ['left','right'])if(a[key]!=={left:'p',right:'q'}[key])await app.click('build-var',{key});for(const key of ['leftNot','rightNot','outerNot'])if(a[key])await app.click('build-not',{key});await app.click('build-op',{id:a.op});}
 else if(t.type==='table'){for(let r=0;r<a.length;r++){if(r===4)await app.click('table-page',{id:'1'});for(let c=0;c<a[r].length;c++){await app.click('cell',{row:String(r),col:String(c)});if(!a[r][c])await app.click('cell',{row:String(r),col:String(c)});}}}
}
test('Every core task can be played through the real event handler and 18 solo rounds persist/export 90 records',async()=>{
 const app=createApp();assert.equal(app.state().screen,'world');
 for(const stop of Content.stops){await app.click('select-stop',{id:String(stop.id)});await app.click('start',{mode:'solo'});for(const t of stop.tasks){assert.equal(app.state().taskId,t.id);await fill(app,t);await app.click('test');assert.match(app.html(),/✓ Gelukt/);await app.click('next');}assert.equal(app.state().screen,'summary');await app.click('finish-world');}
 assert.deepEqual({...app.state().progress},{total:90,firstCorrect:90,eventuallyCorrect:90,wrongAttempts:0,hints:0});assert.match(app.html(),/18<span>\/18/);
 await app.click('export-all');assert.equal(app.exportText().split('\r\n').length,91);assert.match(app.exportText(),/"L18-5"/);
 const reload=createApp(app.storage);assert.equal(reload.state().progress.total,90);
});
test('Wrong response, hint, correction, resume and skip keep their separate evidence',async()=>{
 const app=createApp();await app.click('start',{mode:'solo'});await app.click('choice',{id:'0'});await app.click('test');assert.match(app.html(),/Denk nog eens/);await app.click('hint');assert.equal(app.state().screen,'hint');await app.click('back-play');await app.click('choice',{id:'1'});await app.click('test');await app.click('route-back');
 const reloaded=createApp(app.storage);await reloaded.click('resume');assert.match(reloaded.html(),/✓ Gelukt/);await reloaded.click('next');await reloaded.click('skip');assert.equal(reloaded.state().progress.total,2);assert.equal(reloaded.state().progress.firstCorrect,0);assert.equal(reloaded.state().progress.eventuallyCorrect,1);assert.equal(reloaded.state().progress.hints,1);
});
test('Cooperation waits for partner assessment; approval cannot mark a wrong answer correct',async()=>{
 const app=createApp();await app.click('start',{mode:'duo-learn'});await app.click('choice',{id:'0'});await app.click('test');assert.equal(app.state().screen,'review');assert.ok(!app.html().includes('Denk nog eens'));await app.click('peer',{value:'true'});assert.equal(app.state().screen,'play');assert.match(app.html(),/Denk nog eens/);assert.match(app.html(),/Je partner keurde goed, maar/);await app.click('choice',{id:'1'});await app.click('test');await app.click('peer',{value:'true'});await app.click('next');assert.equal(app.state().progress.total,0);assert.match(app.html(),/Speler B/);
});
test('Optional gates and two-player Battle have complete rounds without fake online data',async()=>{
 const app=createApp();await app.click('start-bonus');for(const t of Content.bonus){await fill(app,t);await app.click('test');assert.match(app.html(),/✓ Gelukt/);await app.click('next');}assert.equal(app.state().screen,'summary');await app.click('finish-world');await app.click('start',{mode:'local'});for(let i=0;i<10;i++){const t=Content.tasks.find(t=>t.id===app.state().taskId);await fill(app,t);await app.click('test');await app.click('next');}assert.match(app.html(),/Gelijk gespeeld/);await app.click('export');const lines=app.exportText().split('\r\n').slice(1);assert.equal(lines.filter(l=>l.startsWith('"A"')).length,5);assert.equal(lines.filter(l=>l.startsWith('"B"')).length,5);
});
test('Menu, intro and eight-row table states are complete and restore the round',async()=>{
 const app=createApp();await app.click('lesson');assert.match(app.html(),/Een uitspraak zegt iets/);await app.click('lesson-page',{id:'2'});await app.click('modes');assert.match(app.html(),/Duo op één toestel/);app.nodes.menuBtn.onclick();await app.click('bonus');assert.match(app.html(),/NAND = AND gevolgd door NOT/);await app.click('world');await app.click('select-stop',{id:'7'});await app.click('start',{mode:'solo'});for(let i=0;i<3;i++){const t=Content.tasks.find(t=>t.id===app.state().taskId);await fill(app,t);await app.click('test');await app.click('next');}assert.match(app.html(),/p = V/);await app.click('test');assert.match(app.html(),/Vul eerst alle cellen/);await app.click('table-page',{id:'1'});assert.equal(app.state().screen,'play');
});

// New integration paths execute the same app event handler.
test('Old worksheet URLs and in-game paper action open the central maker with stop context',async()=>{
 const app=createApp(new Map(),'?stop=10&view=worksheet');assert.match(app.destination(),/oefenbladen\/maken.html/);assert.equal(new URL(app.destination()).searchParams.get('level'),'halte-10');assert.equal(new URL(app.destination()).searchParams.get('topic'),'gebied-4');
 const game=createApp();await game.click('select-stop',{id:'3'});await game.click('worksheet');assert.equal(new URL(game.destination()).searchParams.get('level'),'halte-4');
});
test('OS mode deep link restores an existing duo round instead of showing the world',async()=>{
 const app=createApp(new Map(),'?stop=4&mode=duo-learn');assert.equal(app.state().screen,'play');assert.equal(app.state().mode,'duo-learn');await app.click('truth',{value:'true'});await app.click('test');const reloaded=createApp(app.storage,'?stop=4&mode=duo-learn');assert.equal(reloaded.state().screen,'review');assert.match(reloaded.html(),/SPELER B BEOORDEELT/);
});
test('Old class-screen URLs return to the route without advertising absent online providers',()=>{const app=createApp(new Map(),'?view=connections');assert.equal(app.state().screen,'world');assert.ok(!app.html().includes('Klas & online'));});
test('Parallel OS windows keep separate drafts by mode and stop',async()=>{
 const storage=new Map(),solo=createApp(storage,'?stop=1&mode=solo');await solo.click('choice',{id:'1'});
 const other=createApp(storage,'?stop=4&mode=solo');await other.click('truth',{value:'true'});
 const duo=createApp(storage,'?stop=1&mode=duo-learn');await duo.click('choice',{id:'0'});await duo.click('test');
 const a=createApp(storage,'?stop=1&mode=solo'),b=createApp(storage,'?stop=4&mode=solo'),d=createApp(storage,'?stop=1&mode=duo-learn');
 assert.equal(a.state().taskId,'L01-1');assert.match(a.html(),/data-id="1"[^>]*aria-pressed="true"/);
 assert.equal(b.state().taskId,'L04-1');assert.match(b.html(),/data-value="true"[^>]*aria-pressed="true"/);assert.equal(d.state().screen,'review');
});
test('Parallel solo runs merge completion evidence and retain old unscoped draft compatibility',async()=>{
 const storage=new Map(),a=createApp(storage,'?stop=1&mode=solo'),b=createApp(storage,'?stop=4&mode=solo');
 await fill(a,Content.stops[0].tasks[0]);await a.click('test');await a.click('next');
 await fill(b,Content.stops[3].tasks[0]);await b.click('test');await b.click('next');
 const records=JSON.parse(storage.get('logicawereld:v1:guest')).records;assert.equal(records.length,2);assert.equal(new Set(records.map(r=>r.eventId)).size,2);
 storage.set('logicawereld:v1:guest:run',storage.get('logicawereld:v1:guest:run:solo:0'));storage.delete('logicawereld:v1:guest:run:solo:0');
 const old=createApp(storage,'?stop=1&mode=solo');assert.equal(old.state().taskId,'L01-2');assert.equal(old.state().progress.total,2);
});

test('Counterexample hints describe the current claim instead of an unrelated claim from the same stop',async()=>{const app=createApp(new Map(),'?stop=13&mode=solo');await app.click('skip');await app.click('hint');assert.match(app.html(),/oneven/);assert.match(app.html(),/priem/);assert.ok(!app.html().includes('Bijvoorbeeld 12'));});
