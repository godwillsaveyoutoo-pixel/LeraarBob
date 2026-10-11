/* Shared personal battle report. Scores are read from the authenticated server,
   never reconstructed from a final-round snapshot or supplied by a game frame. */
(() => {
 'use strict';
 const names={rechten:'Rechtenwereld',vectoren:'Vectormissie',algebra:'Vergelijkingen',wortelbouw:'Wortelbouw',bewerkingen:'Getallenwereld',logicawereld:'Logicawereld',kleiduifschieten:'Kleiduifschieten'};
 const statuses={correct:'Juist',incorrect:'Onjuist',unanswered:'Geen antwoord','not-started':'Niet gespeeld','not-eligible':'Nog niet aangesloten',ungraded:'Niet nagekeken'};
 const style=document.createElement('style');style.textContent='.lb-battle-report{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:16px 0}.lb-battle-report button{min-height:44px;padding:10px 18px;border:1px solid currentColor;border-radius:12px;font:inherit;font-weight:600;cursor:pointer}.lb-battle-report [role=status]{flex-basis:100%;margin:0;font-size:.9em}';document.head.append(style);
 async function read(provider,id=null){
  const client=window.AxiomaAuth?.client();if(!client)throw Error('Meld je aan om je eigen resultaten te downloaden.');
  let timer;try{
   const {data,error}=await Promise.race([client.rpc('axioma_class_battle_report',{p_provider:provider,p_id:id}),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('De verbinding is onderbroken. Probeer opnieuw.')),15000))]);
   if(error)throw Error(error.code==='PGRST202'?'De resultaatdownload is op deze server nog niet aangesloten.':error.message||'Je resultaten konden niet laden.');
   if(id?(!data||data.id!==id||!Array.isArray(data.items)):!Array.isArray(data))throw Error('Je resultaten konden niet laden. Probeer opnieuw.');
   return data;
  }finally{clearTimeout(timer);}
 }
 async function pages(report,labels={}){
  if(!report?.alias||!['finished','closed','cancelled'].includes(report.phase))throw Error('De battle is nog niet afgelopen.');
  await document.fonts.ready;
  const W=1240,H=1754,M=88,BOTTOM=H-110,canvases=[];let canvas,c,y;
  function fresh(){canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;c=canvas.getContext('2d');c.fillStyle='#fffdf7';c.fillRect(0,0,W,H);c.fillStyle='#245643';c.font='bold 28px sans-serif';c.fillText('leraarBob · Mijn battleverslag',M,66);c.fillStyle='#d6ded4';c.fillRect(M,88,W-M*2,2);y=142;canvases.push(canvas);}
  function ensure(h){if(y+h>BOTTOM)fresh();}
  function text(value,size=25,bold=false,color='#243b3d',space=15){
   const font=`${bold?'bold ':''}${size}px sans-serif`;c.font=font;let line='';const lines=[];
   for(const paragraph of String(value??'').split('\n')){for(const word of paragraph.split(/\s+/).filter(Boolean)){
    if(line&&c.measureText(line+' '+word).width>W-M*2){lines.push(line);line='';}
    if(c.measureText(word).width<W-M*2){line+=(line?' ':'')+word;continue;}
    for(const char of word){if(c.measureText(line+char).width>W-M*2){lines.push(line);line='';}line+=char;}
   }lines.push(line);line='';}
   for(const l of lines){ensure(size*1.5);c.font=font;c.fillStyle=color;c.fillText(l,M,y);y+=size*1.4;}y+=space;
  }
  fresh();text(names[report.game]||report.game,40,true);text(report.activity||'Klasbattle',25,true,'#526764');text(`${report.alias} · Klas ${report.class||'onbekend'}`,28,true);
  text('Sessie van '+new Date(report.created_at).toLocaleString('nl-BE',{dateStyle:'long',timeStyle:'short'})+(report.code?' · Code '+report.code:''),22);
  const ended=report.phase==='finished';text(ended?'Battle afgerond':'Battle vroegtijdig gestopt',25,true,ended?'#245643':'#915129',24);
  const items=report.items||[];
  if(report.game==='kleiduifschieten'){
   text(`${report.correct} juiste treffers`,42,true,'#245643');
   text(`${report.attempts} verwerkte schoten · ${report.misses} missers · ${report.xp} XP`,27,true);
   text(`Laatste reeks: ${report.streak} juiste antwoorden op rij. ${report.winner?'Je won deze battle.':'Je eigen resultaten tellen ook mee wanneer iemand anders wint.'}`,25);
   text('Een misser kan een fout antwoord of een verstreken schottijd zijn. Deze spelversie bewaart de totalen, geen afzonderlijk verslag van elk schot.',23,false,'#526764');
  }else{
   const total=items.reduce((sum,r)=>sum+Number(r.points||0),0),correct=items.filter(r=>r.status==='correct').length,played=items.filter(r=>!['not-started','not-eligible'].includes(r.status)).length;
   text(`${total} battlepunten`,42,true,'#245643');text(`${correct} ${correct===1?'juist antwoord':'juiste antwoorden'} · ${played} gespeelde vragen · ${items.length} geplande vragen`,26,true);
   if(report.provider==='numbers')text(items.reduce((sum,r)=>sum+Number(r.xp||0),0)+' XP verdiend in deze sessie',25);
   text('Battlepunten volgen de puntentelling van dit spel. Dit zijn geen toetscijfers. Niet gespeelde of niet nagekeken vragen zijn afzonderlijk aangeduid.',23,false,'#526764',24);
   text('Jouw resultaten per ronde',29,true);
   for(const row of items){ensure(90);text(`Ronde ${row.round}${labels[row.skill]?' · '+labels[row.skill]:''}`,25,true,'#243b3d',4);text(`${statuses[row.status]||row.status} · ${row.points} battlepunten`,24,false,'#526764',16);}
  }
  for(const [i,page]of canvases.entries()){const g=page.getContext('2d');g.fillStyle='#687972';g.font='19px sans-serif';g.fillText(`Pagina ${i+1} van ${canvases.length} · Eigen opgeslagen resultaten`,M,H-52);}
  return canvases;
 }
 async function create(report,labels){const canvases=await pages(report,labels);return window.LeraarBobProofPDF.pdf(canvases.map(c=>({width:c.width,height:c.height,bytes:Uint8Array.from(atob(c.toDataURL('image/jpeg',.95).split(',')[1]),v=>v.charCodeAt(0))})));}
 function mount(host,{provider,id,labels={},label='Download mijn resultaten (PDF)'}={}){
  if(!host||!id)return;
  const key=provider+':'+id,previous=host.querySelector(':scope > .lb-battle-report');if(previous?.dataset.report===key)return previous;
  previous?.remove();const box=document.createElement('div');box.className='lb-battle-report';box.dataset.report=key;const button=document.createElement('button'),status=document.createElement('p');button.type='button';button.textContent=label;status.setAttribute('role','status');box.append(button,status);host.append(box);
  button.onclick=async()=>{
   if(button.disabled)return;button.disabled=true;status.textContent='Je opgeslagen resultaten ophalen…';
   try{const owner=(await AxiomaAuth.getAccount())?.id;const report=await read(provider,id);if(!box.isConnected||owner!==(await AxiomaAuth.getAccount())?.id)return;const pdf=await create(report,labels);if(!box.isConnected||owner!==(await AxiomaAuth.getAccount())?.id)return;const url=URL.createObjectURL(pdf),link=document.createElement('a');link.href=url;link.download=('Battle-'+(names[report.game]||report.game)+'-'+report.alias+'-'+report.created_at.slice(0,10)).replace(/[^\p{L}\p{N}._-]+/gu,'-').slice(0,150)+'.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);status.textContent='Je PDF is gedownload. Je vindt dit verslag ook bij Ranglijsten in het OS.';}
   catch(e){if(box.isConnected)status.textContent=e.message||'Download mislukt. Probeer opnieuw.';}
   finally{button.disabled=false;}
  };return box;
 }
 window.LeraarBobBattleReport=Object.freeze({read,mount,create,pages,names});
})();
