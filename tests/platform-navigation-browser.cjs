// Actual standalone document and browser input, isolated storage; no backend needed.
const fs=require('node:fs'),assert=require('node:assert/strict');
const Core=require('../games/vectoren/vector-core.js');
class CDP{
 async connect(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map();this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails)}}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 async wait(expr){for(let i=0;i<100;i++){if(await this.eval(expr))return;await new Promise(r=>setTimeout(r,30))}throw Error('Timeout '+expr)}
}

(async()=>{
 const version=await(await fetch('http://127.0.0.1:9235/json/version')).json(),browser=new CDP();await browser.connect(version.webSocketDebuggerUrl);
 const {browserContextId}=await browser.send('Target.createBrowserContext'),{targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});
 const tabs=await(await fetch('http://127.0.0.1:9235/json')).json(),c=new CDP();await c.connect(tabs.find(t=>t.id===targetId).webSocketDebuggerUrl);
 await c.send('Page.enable');await c.send('Runtime.enable');await c.send('Network.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});
 await c.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 const pages=JSON.parse(fs.readFileSync('games.json')).map(g=>g.href);
 for(const path of pages){
  await c.send('Page.navigate',{url:'http://127.0.0.1:8765/'+path});
  await c.wait(`!!document.querySelector('[data-platform-home]')`);
  const links=await c.eval(`[...document.querySelectorAll('[data-platform-home]')].map(a=>({tag:a.tagName,href:a.href,label:a.getAttribute('aria-label')}))`);
  for(const a of links){assert.equal(a.tag,'A',path);assert.equal(a.href,'http://127.0.0.1:8765/index.html',path);assert.match(a.label,/startpagina/,path)}
  await c.eval(`document.querySelector('[data-platform-home]').click()`);
  await c.wait(`location.pathname==='/index.html'`);
 }
 console.log('PASS: all '+pages.length+' catalog games have native links returning to the website');
 await browser.send('Target.disposeBrowserContext',{browserContextId});c.ws.close();browser.ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
