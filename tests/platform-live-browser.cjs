const assert=require('node:assert/strict'),{chromium}=require('playwright');
const BASE=process.env.VECTOR_BASE_URL||'http://127.0.0.1:8775';
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.LB_CHROMIUM||'/opt/brave.com/brave/brave',args:['--no-sandbox']});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.pathname.endsWith('/axioma-auth.js'))return route.fulfill({contentType:'text/javascript',body:`window.AxiomaAuth={CLASSES:[],ready:async()=>({account:null}),getAccount:async()=>null,onChange:()=>()=>{},configured:()=>true,client:()=>({rpc:async()=>({data:[],error:null})})}`});return url.origin===BASE?route.continue():route.abort();});
 for(const path of ['/index.html','/games/rechten/rechtenwereld/play.html']){
  await page.goto(BASE+path);await page.locator('leraarbob-topbar').waitFor();const bar=page.locator('leraarbob-topbar'),live=bar.locator('.live-entry');assert(!(await live.isVisible()));
  for(const role of ['student','teacher']){
   await page.evaluate(role=>dispatchEvent(new CustomEvent('axioma:login-complete',{detail:{account:{id:'live-test',alias:'Leerling',role}}})),role);
   assert((await live.getAttribute('href')).endsWith(role==='student'?'join.html':'index.html'));
   for(const width of [320,390,844,1440]){
    await page.setViewportSize({width,height:844});await page.waitForTimeout(80);
    const issues=await bar.evaluate(host=>[...host.shadowRoot.querySelectorAll('.row button,.row a')].filter(e=>e.getClientRects().length).flatMap(e=>{const b=e.getBoundingClientRect();return b.width<44||b.height<44||b.x<0||b.right>innerWidth+1?[e.className+': '+JSON.stringify(b)]:[]}));assert.deepEqual(issues,[],path+' '+role+' '+width);
   }
  }
  await bar.locator('.collapse').click();await page.reload();await page.locator('.lb-restore').waitFor();assert(await page.locator('.lb-restore').isVisible());await page.locator('.lb-restore').click();assert(await bar.isVisible());
 }
 assert.deepEqual(errors,[]);console.log('PASS shared Live entry on home/game, guest/student/teacher destinations, four widths, collapse/reopen/reload');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
