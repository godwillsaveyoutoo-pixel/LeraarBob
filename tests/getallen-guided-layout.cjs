'use strict';
// Real app, fixture accounts and seeded existing save format. No production writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const L=require('../games/getallenwereld/lessons.js'),root=path.resolve(__dirname,'..'),out='/tmp/getallen-guided-proof';fs.mkdirSync(out,{recursive:true});
const fixtures=[],seen=new Set();
for(const edition of[2,1])for(const stop of L.STOPS)for(let index=0;index<6;index++){
 const seed=193,taskSeed=(seed+Math.imul(index+1,2654435761))>>>0,t=L.make(stop.id,taskSeed,index,edition);
 for(let stage=0;stage<t.stages.length;stage++){
  const template=t.stages[stage].template;if(seen.has(template))continue;seen.add(template);
  fixtures.push({version:1,screen:'play',theme:stop.theme,selected:stop.id,entries:{},runs:{},mission:{id:stop.id,seed,index,edition,stage,values:t.stages[stage].slots.map(()=>''),done:false,assisted:false,attempts:0}});
 }
}
const server=http.createServer((req,res)=>{let file=path.join(root,new URL(req.url,'http://local').pathname);try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{
 const base='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({headless:true,executablePath:process.env.ALGEBRA_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.fulfill({body:''});
  if(u.pathname==='/shared/axioma-auth.js')return r.fulfill({contentType:'text/javascript',body:`window.AxiomaAuth={ready:async()=>({account:{id:'fixture',alias:'Voorbeeld',role:'student'},pending:false}),getAccount:async()=>({id:'fixture',alias:'Voorbeeld',role:'student'}),onChange:()=>{},client:()=>({auth:{},rpc:async()=>({data:null})})};`});
  if(u.pathname==='/shared/axioma-progress.js')return r.fulfill({contentType:'text/javascript',body:`window.AxiomaProgress={load:async()=>({revision:1,state:{total:15,completed:[],storage:{'leraarbob.getallenwereld.v1':JSON.stringify((${JSON.stringify(fixtures)})[Number(new URLSearchParams(location.search).get('fixture'))])}}}),save:async(g,s,r)=>({status:'saved',revision:r+1})};`});return r.continue();});
 let checked=0;
 for(const [width,height]of [[640,360],[390,844]]){
  await page.setViewportSize({width,height});
  for(let i=0;i<fixtures.length;i++){
   await page.goto(base+'/games/getallenwereld/?fixture='+i);await page.waitForFunction(()=>window.GetallenWorld&&AxiomaGame.active);await page.evaluate(()=>document.fonts.ready);
   const issues=await page.evaluate(()=>{
    const bad=[];if(document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth+1)bad.push('page scroll');
    for(const e of document.querySelectorAll('#app button')){if(!e.getClientRects().length)continue;const r=e.getBoundingClientRect();if(r.width<43.5||r.height<43.5)bad.push('small '+e.textContent);if(r.top<0||r.bottom>innerHeight+1||r.left<0||r.right>innerWidth+1)bad.push('clipped '+e.textContent);const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(!e.disabled&&hit&&!e.contains(hit))bad.push('covered '+e.textContent);}
    if(document.querySelector('.keypad,input:not([type=hidden])'))bad.push('keyboard');return bad;
   });
   if(issues.length)await page.screenshot({path:out+'/failure-'+width+'-'+i+'.png'});
   assert.deepEqual(issues,[],width+' fixture '+i+' '+fixtures[i].mission.id);
   const task=await page.evaluate(()=>GetallenWorld.task()),stage=fixtures[i].mission.stage;
   for(let k=0;k<task.stages[stage].slots.length;k++){await page.locator('[data-slot="'+k+'"]').click();await page.locator('[data-choice='+JSON.stringify(task.stages[stage].slots[k].answer)+']').click();}
   await page.locator('[data-action=check]').click();const state=await page.evaluate(()=>GetallenWorld.snapshot());assert(state.mission.done||state.mission.stage===stage+1,'choice submission advances '+i);
   if(i<3||fixtures[i].mission.id==='wortels-regels')await page.screenshot({path:out+'/checked-'+width+'-'+i+'.png'});
   checked++;
  }
 }
 assert.deepEqual(errors,[]);console.log('PASS: '+checked+' seeded lesson stages on landscape and portrait, real choice submission, visible 44px controls');
 }finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exit(1)});
