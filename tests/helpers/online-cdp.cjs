const fs=require('node:fs'),path=require('node:path');const OUT=path.resolve('/tmp/leraarbob-v10-screenshots');fs.mkdirSync(OUT,{recursive:true});
class CDP{
 async connect(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map();this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;clearTimeout(p.timer);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}else if(m.method==='Fetch.requestPaused')this.route(m.params).catch(e=>{if(!/Invalid InterceptionId/.test(e.message))this.errors.push(e);});else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);};}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id,timer=setTimeout(()=>reject(Error('Timeout '+method)),20000);this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,method,params}));});}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 async wait(expression){for(let i=0;i<220;i++){if(await this.eval(expression))return;await new Promise(r=>setTimeout(r,50));}throw Error('Timeout '+expression+'; '+await this.eval('document.getElementById("notice")?.textContent'));}
 async click(id){await this.eval(`document.getElementById(${JSON.stringify(id)}).click()`);}
 async size(width,height){await this.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});}
 async shot(name){const r=await this.send('Page.captureScreenshot',{captureBeyondViewport:false});fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(r.data,'base64'));}
}
module.exports={CDP};
