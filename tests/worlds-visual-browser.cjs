'use strict';
// Real interface, original questions; remote authentication is not exercised here.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const host=require('../scripts/serve-os-preview.cjs').createServer(),out=process.env.WORLDS_VISUAL_PROOF||'/tmp/lb-world-redesign/visual';
const report={screens:[],errors:[],contrast:[],viewports:[{width:1366,height:768},{width:390,height:844},{width:640,height:360}],passed:false};
function contrast(){
 const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),over=(a,b)=>a.slice(0,3).map((n,i)=>n*(a[3]??1)+b[i]*(1-(a[3]??1)));
 const lum=c=>c.map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0);
 const fails=[];let tested=0;
 for(const e of document.body.querySelectorAll('*')){
  if(e.closest('[hidden],.hidden,.katex-mathml,svg,button:disabled,select:disabled,input:disabled')||!e.getClientRects().length||['OPTION','SCRIPT','STYLE'].includes(e.tagName))continue;
  const s=getComputedStyle(e),r=e.getBoundingClientRect();if(s.visibility==='hidden'||s.opacity==='0'||r.bottom<=0||r.top>=innerHeight||r.right<=0||r.left>=innerWidth)continue;
  const text=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ');if(!text)continue;
  let bg=[255,255,255];const chain=[];for(let n=e;n;n=n.parentElement)chain.unshift(n);for(const n of chain){const c=rgb(getComputedStyle(n).backgroundColor);if(c.length>=3)bg=over(c,bg);}
  const c=rgb(s.webkitTextFillColor||s.color);if(c.length<3)continue;const fg=over(c,bg),a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),min=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&parseInt(s.fontWeight)>=700)?3:4.5;tested++;
  if(ratio<min-.02)fails.push({element:e.tagName+'#'+e.id+'.'+e.className,text:text.slice(0,65),ratio:+ratio.toFixed(2),min,ink:s.color,fill:s.webkitTextFillColor,bg});
 }
 return {tested,fails};
}
(async()=>{let browser,page,base;try{
 fs.mkdirSync(out,{recursive:true});await new Promise(r=>host.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+host.address().port;
 browser=await chromium.launch({headless:true,executablePath:process.env.LB_CHROMIUM||(fs.existsSync('/opt/brave.com/brave/brave')?'/opt/brave.com/brave/brave':undefined),args:['--no-sandbox','--disable-dev-shm-usage']});page=await browser.newPage({viewport:report.viewports[0],deviceScaleFactor:1});page.setDefaultTimeout(15000);await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());page.on('pageerror',e=>report.errors.push(e.message));await page.goto(base+'/os/');await page.waitForFunction(()=>LeraarBobDesktop&&document.querySelector('leraarbob-topbar')?.shadowRoot);
 const active=async()=>(await page.locator('.frame-wrapper:not([hidden])>iframe').elementHandle()).contentFrame();
 async function screen(f,name){await f.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});const result=await f.evaluate(contrast);report.contrast.push({name,...result});if(name.includes('algebra-trainer-home'))assert.deepEqual(await f.locator('.menuStop').evaluateAll(es=>es.filter(e=>e.querySelector('.menuStopStatus').getBoundingClientRect().bottom>e.getBoundingClientRect().bottom-3).map(e=>e.textContent)),[],'Progress labels fit within every level card');await page.screenshot({path:path.join(out,name+'.png')});report.screens.push(name);console.log(name,JSON.stringify(result.fails));}
 for(const id of ['getallenwereld','algebra-trainer']){
  await page.evaluate(id=>LeraarBobDesktop.openApp(id,'solo'),id);const f=await active();await f.locator(id==='getallenwereld'?'.theme':'.menuStop').first().waitFor();
  for(const dark of [false,true]){if(await page.evaluate(()=>document.documentElement.dataset.mode==='dark')!==dark)await page.locator('leraarbob-topbar .theme-toggle').click();await screen(f,id+'-home-'+(dark?'dark':'light'));}
  if(id==='getallenwereld'){await f.locator('.theme[data-theme=machten]').first().click();await screen(f,'getallen-pad-dark');await f.locator('[data-action=start]').click();}else await f.locator('.menuContinue').click();
  for(const dark of [true,false]){if(await page.evaluate(()=>document.documentElement.dataset.mode==='dark')!==dark)await page.locator('leraarbob-topbar .theme-toggle').click();await screen(f,id+'-work-'+(dark?'dark':'light'));}
  await page.locator('leraarbob-topbar .theme-toggle').click();
  if(id==='algebra-trainer'){
   await f.locator('#moreOperationsBtn').click();await screen(f,'vergelijkingen-eigen-bewerking-dark');await f.locator('.opBtn').first().click();await screen(f,'vergelijkingen-getallenkeuze-dark');
   await f.locator('#watchDemoBtn').click();await screen(f,'vergelijkingen-hulp-dark');await f.locator('#lessonReturnBtn').click();await f.locator('#historyBtn').click();await screen(f,'vergelijkingen-stappen-dark');await f.locator('#closeHistoryBtn').click();
   await f.evaluate(()=>AlgebraShell.navigate('tools'));await screen(f,'vergelijkingen-werkvormen-dark');await f.locator('[data-nav=setup]').click();await screen(f,'vergelijkingen-reeks-dark');await f.evaluate(()=>AlgebraShell.navigate('menu'));
  }else{await f.locator('[data-action=help]:visible').click();await screen(f,'getallen-hulp-dark');await f.getByRole('button',{name:'Mijn opgave',exact:true}).click();
   for(const topic of ['wortels','wetenschappelijk']){await f.locator('.workshop-nav [data-action=chapter]').click();await f.locator('.workshop-nav [data-action=home]').click();await f.locator('.theme[data-theme='+topic+']').click();await screen(f,topic+'-pad-dark');await f.locator('[data-action=start]').click();await screen(f,topic+'-regel-dark');const correct=await f.evaluate(()=>GetallenWorld.task().correct);await f.locator('[data-rule="'+correct+'"]').click();await screen(f,topic+'-antwoord-dark');}
  }
  for(const vp of report.viewports.slice(1)){
   await page.setViewportSize(vp);for(const fold of [false,true]){await page.evaluate(v=>LeraarBobTopbar.setCollapsed(v,true),fold);await screen(f,id+'-'+vp.width+'-'+(fold?'collapsed':'expanded'));assert.equal(await f.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'no horizontal page overflow');if(fold){const restore=page.locator('.lb-restore:not([hidden])'),r=await restore.boundingBox();assert(r.width>=44&&r.height>=44);assert.equal(await restore.getAttribute('aria-expanded'),'false');await restore.click();assert.equal(await page.locator('leraarbob-topbar .collapse').getAttribute('aria-expanded'),'true');}}
  }
  await page.setViewportSize(report.viewports[0]);await page.evaluate(()=>LeraarBobTopbar.setCollapsed(false,true));
 }
 assert.deepEqual(report.contrast.filter(x=>x.fails.length),[],'Every visible native text/active control meets 4.5:1 (large text 3:1)');assert.deepEqual(report.errors,[]);report.passed=true;
 }catch(e){report.failure=e.stack;await page?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e;}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();host.close();}
 console.log('PASS visual/contrast '+report.screens.length+' screens');
})().catch(e=>{console.error(e);process.exitCode=1});
