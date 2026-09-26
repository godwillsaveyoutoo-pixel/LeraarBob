// Production route regression: real touch/keyboard, synthetic guest; no external requests.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const PORT=Number(process.env.V2_BROWSER_PORT||9245),BASE=process.env.V2_BASE_URL||'http://127.0.0.1:8775';
const ARTIFACTS=process.env.V2_SCREENSHOT_DIR||'/tmp/rechten-shell-validation/screenshots';
const ROUTE='/games/rechten/trainer-v2/';
const report={checks:[],screenshots:[],passed:false};
class CDP {
  async connect(match="") {
    const tabs=await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    const tab=tabs.find(t=>t.type==='page'&&(match?t.url.includes(match):!t.url.startsWith('chrome://')));
    this.targetId=tab?.id;assert(tab,`No page on isolated Chromium port ${PORT}`);
    this.ws=new WebSocket(tab.webSocketDebuggerUrl);this.id=0;this.pending=new Map();this.errors=[];
    await new Promise((resolve,reject)=>{this.ws.onopen=resolve;this.ws.onerror=reject});
    this.ws.onmessage=event=>{
      const m=JSON.parse(event.data);
      if(m.id){const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}
      else if(m.method==='Page.loadEventFired')this.loads=(this.loads||0)+1;
      else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);
      else if(m.method==='Fetch.requestPaused')Promise.resolve(this.paused?.(m.params)).catch(e=>this.errors.push({network:e.message}));
    };
    await this.send('Page.enable');await this.send('Runtime.enable');await this.send('Network.enable');
    await this.send('Network.setCacheDisabled',{cacheDisabled:true});
  }
  send(method,params={}) {return new Promise((resolve,reject)=>{const id=++this.id,timer=setTimeout(()=>{this.pending.delete(id);reject(Error('CDP timeout: '+method))},15000);this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,method,params}))})}
  async eval(expression) {const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
  async wait(expression) {for(let i=0;i<160;i++){if(await this.eval(expression))return;await new Promise(r=>setTimeout(r,50))}throw Error('Timeout waiting for '+expression)}
  async navigate(url){const before=this.loads||0;await this.send(url?'Page.navigate':'Page.reload',url?{url}:{});for(let i=0;i<300&&(this.loads||0)<=before;i++)await new Promise(r=>setTimeout(r,25));assert((this.loads||0)>before,'document load event');}
  frames() {return this.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')}
  async viewport(width,height,touch=false) {await this.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await this.send('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:1});await this.frames()}
  async press(key,modifiers=0) {
    const codes={Tab:9,Enter:13,' ':32,Escape:27,Home:36,ArrowDown:40,ArrowUp:38,ArrowLeft:37,ArrowRight:39,a:65};
    await this.send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key===' '?'Space':key==='a'?'KeyA':key,windowsVirtualKeyCode:codes[key]||key.charCodeAt(0),nativeVirtualKeyCode:codes[key]||key.charCodeAt(0),text:key==='Enter'?'\r':key===' '?' ':undefined,modifiers});
    await this.send('Input.dispatchKeyEvent',{type:'keyUp',key,modifiers});await this.frames();
  }
  async tap(selector,touch=false) {
    if(this.keyboardOnly){await this.keyboardTo(selector);const type=await this.eval(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});return {tag:e.tagName,type:e.type,role:e.getAttribute('role')}})()`);if(type.tag==='BUTTON'||type.tag==='A'||type.role==='button')await this.press('Enter');else if(['checkbox','radio'].includes(type.type))await this.press(' ');return;}
    const p=await this.eval(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled||!e.getClientRects().length)throw Error('Unavailable ${selector.replaceAll("'",'')}');const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    if(touch){await this.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,radiusX:3,radiusY:3}]});await this.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
    else{await this.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await this.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p})}
    await this.frames();
  }
  async keyboardTo(selector) {for(let i=0;i<80;i++){if(await this.eval(`document.activeElement?.matches(${JSON.stringify(selector)})`))return;await this.press('Tab')}throw Error('Keyboard cannot reach '+selector)}
  async fill(name,value,touch=false) {
    const selector=`[name="${name}"]`;
    const meta=await this.eval(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});return e?{tag:e.tagName,type:e.type,options:e.options?[...e.options].map(o=>o.value):null}:null})()`);
    if(!meta){await this.tap(`[data-choice="${name}"][data-value="${value}"]`,touch);return;}
    assert(meta,'Missing named answer field '+name);
    if(meta.type==='radio'||meta.type==='checkbox'){
      if(meta.type==='radio')await this.tap(`${selector}[value="${value}"]`,touch);
      else if(Boolean(await this.eval(`document.querySelector(${JSON.stringify(selector)}).checked`))!==Boolean(value))await this.tap(selector,touch);
    }else if(meta.tag==='SELECT'){
      const index=meta.options.indexOf(String(value));assert(index>=0,`${name}: missing option ${value}`);
      await this.tap(selector,touch);await this.press('Home');for(let i=0;i<index;i++)await this.press('ArrowDown');await this.press('Enter');await this.press('Tab');
    }else{await this.tap(selector,touch);await this.press('a',2);await this.send('Input.insertText',{text:String(value)});await this.press('Tab')}
    await this.frames();
  }
  async shot(name) {const out=path.join(ARTIFACTS,name+'.png');const r=await this.send('Page.captureScreenshot',{captureBeyondViewport:false});fs.writeFileSync(out,Buffer.from(r.data,'base64'));report.screenshots.push(out)}
}


module.exports={CDP,report,ARTIFACTS,BASE,ROUTE};
