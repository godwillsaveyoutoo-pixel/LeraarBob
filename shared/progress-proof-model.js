/* A read-only receipt from the same saved values used on the central homepage. */
(function(root){
'use strict';
const clean=value=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
const worlds={puntenbaai:'Puntenbaai',hellingrug:'Hellingrug',grenspas:'Grenspas',formulewerf:'Formulewerf',signaalstad:'Signaalstad'};
function build({account,overview,catalog,selected='all',name='',now=Date.now()},progress){
 if(account?.role!=='student'||overview?.accountId!==account.id)throw Error('Je account is gewijzigd. Open je profiel opnieuw.');
 const total=progress.aggregate(catalog,overview);
 if(!total)throw Error('Je opgeslagen voortgang kon niet volledig worden geladen. Probeer opnieuw.');
 const rows=total.entries.map(entry=>{
  const game=catalog.find(g=>g.id===entry.id),saved=progress.savedFor(game,overview),summary=progress.summarize(game,saved);
  const row={id:entry.id,title:entry.title,label:entry.label,xp:entry.xp,updatedAt:saved?.updated_at||null,details:[],saved:!!saved?.state,featured:!!game.featured};
  if(game.progressType==='world'&&saved?.state?.rechtenV2){
   const missions=Object.values(saved.state.rechtenV2.missions||{}).filter(m=>m&&typeof m==='object'),done=missions.filter(m=>m.completed===true).length;
   row.label=missions.length?`${done} ${done===1?'oefenreeks':'oefenreeksen'} afgerond · ${missions.length-done} bezig`:'Leerroute opgeslagen';
   for(const [id,label] of Object.entries(worlds)){
    const entries=missions.filter(m=>m.world===id);if(entries.length)row.details.push(`${label}: ${entries.filter(m=>m.completed===true).length} afgerond, ${entries.filter(m=>m.completed!==true).length} bezig`);
   }
  }else if(game.progressType==='trainer'&&summary.status==='started')row.details.push(summary.detail);
  return row;
 });
 const entries=selected==='all'?rows.filter(row=>row.saved||row.xp>0):rows.filter(row=>row.id===selected);
 if(selected!=='all'&&!entries.length)throw Error('Kies een spel uit de lijst.');
 return {createdAt:now,name:clean(name).slice(0,100)||clean(account.alias),alias:clean(account.alias),className:clean(account.class_code),selection:selected,
  xp:entries.reduce((sum,row)=>sum+(row.xp||0),0),entries,choices:rows.map(({id,title})=>({id,title}))};
}
function pendingGames({account,catalog,selected='all',project,storage}){
 if(account?.role!=='student')return [];
 const result=[],seen=new Set();
 for(const game of catalog){
  if(selected!=='all'&&game.id!==selected)continue;
  const id=game.progressGameId||game.id;
  const keys=game.progressType==='world'?['axioma:rechten:v2:'+encodeURIComponent(project)+':student:'+account.id]:
   game.progressType==='trainer'?[':wave4',':wave3',':wave2',':wave1',''].map(s=>'axioma-trainer-rechten-v0700:'+project+':'+account.id+s):
   ['axioma:progress:v2:'+encodeURIComponent(project)+':student:'+account.id+':'+id];
  for(const key of keys){try{if(JSON.parse(storage.getItem(key)||'null')?.dirty===true&&!seen.has(game.id)){result.push(game.title);seen.add(game.id);}}catch{/* Unreadable local storage never replaces cloud values. */}}
 }
 return result;
}
function filename(report){
 const name=clean(report.name).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||'leerling';
 const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(report.createdAt));
 return `leraarBob-voortgang-${name}-${date}.pdf`;
}
const api=Object.freeze({build,pendingGames,filename,clean});if(typeof module==='object'&&module.exports)module.exports=api;else root.LeraarBobProofModel=api;
})(globalThis);
