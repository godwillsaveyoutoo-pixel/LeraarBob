'use strict';
// Public frontend files only: no repository listing, credentials, SQL or test data.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const folders=new Set(['oefenbladen','os','assets','css','js','shared','games','lessons','klasbattle','teacher']);
const files=new Set(['index.html','games.json','oefenbladen.html','axioma-platform-game-bridge.js']);
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.ico':'image/x-icon','.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.pdf':'application/pdf'};
function frontendFile(url){
 let parts;try{parts=decodeURIComponent(new URL(url,'http://localhost').pathname).split('/').filter(Boolean);}catch{return null;}
 if(parts.some(p=>p.startsWith('.')||p.includes('\\')))return null;
 if(!parts.length)parts=['index.html'];
 if(!folders.has(parts[0])&&!files.has(parts.join('/')))return null;
 let file=path.resolve(root,...parts);
 if(!file.startsWith(root+path.sep))return null;
 try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!types[path.extname(file)]||!fs.statSync(file).isFile()||!fs.realpathSync(file).startsWith(root+path.sep))return null;
  return file;
 }catch{return null;}
}
function createServer(){return http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
 const file=frontendFile(req.url);if(!file){res.writeHead(404);return res.end('Niet beschikbaar in de frontendpreview.');}
 res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 if(req.method==='HEAD')return res.end();fs.createReadStream(file).pipe(res);
});}
if(require.main===module){const port=Number(process.env.OS_PREVIEW_PORT||8787);createServer().listen(port,'127.0.0.1',()=>console.log(`leraarBob frontendpreview: http://127.0.0.1:${port}/os/`));}
module.exports={createServer,frontendFile};
