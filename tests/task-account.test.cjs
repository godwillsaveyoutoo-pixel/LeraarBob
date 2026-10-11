const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
test('Tasks shows the signed-out state on first load, then follows login and logout without duplicate requests',async()=>{
 const root=path.resolve(__dirname,'..'),dom=new JSDOM(fs.readFileSync(path.join(root,'tasks/index.html'),'utf8'),{url:'https://leraarbob.test/tasks/',runScripts:'outside-only'}),w=dom.window;let changed,calls=0;
 w.LeraarBobTaskCatalog=require('../tasks/catalog.js');w.AxiomaAuth={onChange(fn){changed=fn},ready:async()=>({account:null,pending:false}),client:()=>({rpc:async()=>{calls++;return {data:{tasks:[]}};}})};
 try{await w.eval(fs.readFileSync(path.join(root,'tasks/tasks.js'),'utf8'));assert.match(w.document.querySelector('#main').textContent,/Meld je aan/);assert.equal(calls,0);
 await changed({account:{id:'student',role:'student'},pending:false});assert.match(w.document.querySelector('#main').textContent,/Jouw opdrachten/);assert.equal(calls,1);
 await changed({account:{id:'student',role:'student'},pending:false});assert.equal(calls,1);
 await changed({account:null,pending:true});assert.match(w.document.querySelector('#main').textContent,/Jouw opdrachten/);
 await changed({account:null,pending:false});assert.match(w.document.querySelector('#main').textContent,/Meld je aan/);assert.equal(w.LeraarBobTasks.state().accountId,undefined);
 }finally{w.close();}
});
