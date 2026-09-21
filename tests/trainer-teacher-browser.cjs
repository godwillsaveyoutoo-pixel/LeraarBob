// Run against a local server and an isolated Chromium profile; see tests/README.md.
const assert=require('node:assert/strict'),fs=require('node:fs');
class CDP{
 async connect(){const tabs=await(await fetch('http://127.0.0.1:9235/json')).json();this.ws=new WebSocket(tabs[0].webSocketDebuggerUrl);this.pending=new Map();this.id=0;this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);else if(m.method==='Fetch.requestPaused')this.paused?.(m.params)};await this.send('Page.enable');await this.send('Runtime.enable')}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
}

(async()=>{
 const c=new CDP();await c.connect();
 const mock=`window.testCalls=[];
 const account={id:'teacher-test',email:'teacher@example.invalid',role:'teacher'};
 const session={user:account};
 const client={rpc:async(name)=>{testCalls.push(name);return {data:name==='axioma_is_teacher'}},from(table){testCalls.push(table);const q={select:()=>q,eq:()=>q,order:()=>q,range:()=>q,maybeSingle:async()=>({data:null}),then:fn=>Promise.resolve({data:[]}).then(fn)};return q}};
 window.AxiomaAuth={ready:async()=>({session,account}),client:()=>client,onChange:()=>()=>{}};`;
 c.paused=p=>c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(p.request.url.includes('axioma-auth.js')?mock:'').toString('base64')});
 await c.send('Network.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*/shared/axioma-auth.js'},{urlPattern:'*/shared/axioma-social.js'}]});
 await c.send('Page.navigate',{url:'http://127.0.0.1:8765/games/rechten/trainer/'});
 const wait=async expr=>{for(let i=0;i<100;i++){if(await c.eval(expr))return;await new Promise(r=>setTimeout(r,50))}throw Error('Timeout: '+expr)};
 await wait(`document.querySelector('#app')?.dataset.account==='teacher'&&!document.querySelector('#start').hidden`);
 assert.equal(await c.eval(`document.querySelector('#devBtn').hidden`),true);
 assert.match(await c.eval('location.pathname'),/rechten\/trainer/);
 await c.eval(`document.querySelector('#startBtn').click()`);
 await wait(`!document.querySelector('#stage').hidden&&document.querySelector('#question').textContent.length>0`);
 assert.equal(await c.eval(`testCalls.includes('axioma_progress')`),false);
 await c.eval(`document.querySelector('#teacherBtn').click()`);
 await wait(`!document.querySelector('#teacherPanel').hidden`);
 await c.eval(`document.querySelector('#playBtn').click()`);
 await wait(`!document.querySelector('#stage').hidden`);
 assert.deepEqual(c.errors,[]);
 console.log('PASS: teacher opens trainer, starts exercise, opens follow-up and returns to exercise; no student progress fetched');
 await c.send('Fetch.disable');c.ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
