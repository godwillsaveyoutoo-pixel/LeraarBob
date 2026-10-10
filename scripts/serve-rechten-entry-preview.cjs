'use strict';
// Development preview only: loopback, synthetic accounts, local databases.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {frontendFile}=require('./serve-os-preview.cjs'),{createFixture}=require('../tests/helpers/rechten-entry-fixture.cjs');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.ttf':'font/ttf','.woff2':'font/woff2'};
async function start({port=Number(process.env.RIGHTS_PREVIEW_PORT||8792),fixture}={}){
 fixture=fixture||await createFixture();
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1'),send=(body,type,status=200)=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body);};
  if(url.pathname.startsWith('/entry-fixture-api/')){
   if(req.method!=='POST')return send('','text/plain',405);
   const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`)return send('','text/plain',403);
   let body='';try{for await(const chunk of req){body+=chunk;if(body.length>1024*1024)throw Error('Too large');}const {user,input}=JSON.parse(body);return send(JSON.stringify(await fixture.invoke(user,url.pathname.split('/').pop(),input)),'application/json');}catch(e){return send(JSON.stringify({data:null,error:{message:e.message}}),'application/json',400);}
  }
  if(!['GET','HEAD'].includes(req.method))return send('','text/plain',405);
  if(url.pathname==='/')return send('<!doctype html><html lang="nl"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rechtenwereld · ontwikkelpreview</title><style>body{font:17px/1.5 system-ui;color:#1b3442;background:#d9e9e9;max-width:740px;margin:50px auto;padding:20px}a{display:block;padding:16px;margin:12px 0;background:#fffaf0;border:1px solid #93aca6;border-radius:8px;color:inherit}small{display:block}h1{font-size:30px}</style><h1>Rechtenwereld — eerste startschermen</h1><p>Ontwikkelpreview met fictieve accounts en een lokale database. Open Alex en Sam in aparte tabs om samen te leren.</p><a target="_blank" rel="noopener" href="/os/?theme=rechten&previewUser=alex&entry=learn">Samen leren · Alex<small>Oefening kiezen, groepje maken en uitnodigen</small></a><a target="_blank" rel="noopener" href="/os/?theme=rechten&previewUser=sam&entry=learn">Samen leren · Sam<small>Uitnodiging ontvangen en deelnemen</small></a><a target="_blank" rel="noopener" href="/os/?theme=rechten&previewUser=teacher&entry=classroom">Klasbattle · leerkracht<small>Instellen, wachtkamer en starten</small></a><a target="_blank" rel="noopener" href="/os/?theme=rechten&previewUser=alex&entry=classroom">Klasbattle · leerling<small>Code invoeren en aansluiten</small></a></html>','text/html; charset=utf-8');
  if(url.pathname==='/shared/axioma-auth.js')return send(fixture.authScript('alex',true),'text/javascript');
  const file=frontendFile(req.url);if(!file)return send('Niet beschikbaar','text/plain',404);
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});if(req.method==='HEAD')return res.end();fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));return {server,fixture,base:'http://127.0.0.1:'+server.address().port,close:async()=>{await new Promise(resolve=>server.close(resolve));await fixture.close();}};
}
if(require.main===module)start().then(({base})=>console.log('Rechtenwereld ontwikkelpreview: '+base+'/')).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={start};
