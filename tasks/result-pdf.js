/* Scores come from the immutable server result, including partial submissions. */
(()=>{
'use strict';
const names={glass:'Glasraam',clay:'Kleiduifschieten',rights:'Rechtenwereld'};
async function pages(task,work){
 if(!work.result||!['submitted','reviewed'].includes(work.status))throw Error('Dien je opdracht eerst in om je puntenoverzicht te downloaden.');
 await document.fonts.ready;
 const result=work.result,canvases=[],W=1240,H=1754,M=88,BOTTOM=H-100;
 let canvas,ctx,y;
 function fresh(){canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;ctx=canvas.getContext('2d');ctx.fillStyle='#fffdf7';ctx.fillRect(0,0,W,H);ctx.fillStyle='#24493f';ctx.font='bold 28px sans-serif';ctx.fillText('leraarBob · Puntenoverzicht',M,70);ctx.fillStyle='#d6ded4';ctx.fillRect(M,88,W-2*M,2);y=138;canvases.push(canvas);}
 function ensure(h){if(y+h>BOTTOM)fresh();}
 function text(value,size=25,bold=false,color='#243b3d',space=12){
  const font=`${bold?'bold ':''}${size}px sans-serif`,width=W-2*M;ctx.font=font;
  const lines=[];
  for(const paragraph of String(value??'').split('\n')){
   let line='';for(const word of paragraph.split(/\s+/).filter(Boolean)){
    if(line&&ctx.measureText(line+' '+word).width>width){lines.push(line);line='';}
    if(ctx.measureText(word).width<=width){line+=(line?' ':'')+word;continue;}
    // Only an unbroken token wider than the page is split within a word.
    for(const c of word){if(ctx.measureText(line+c).width>width){lines.push(line);line='';}line+=c;}
   }lines.push(line);
  }
  for(const l of lines){ensure(size*1.5);ctx.font=font;ctx.fillStyle=color;ctx.fillText(l,M,y);y+=size*1.4;}y+=space;
 }
 fresh();text(task.title,38,true);text(`${work.alias} · Klas ${work.class_code||'—'}`,26,true);
 text('Ingediend op '+new Date(work.submitted_at).toLocaleString('nl-BE',{dateStyle:'long',timeStyle:'short'}),22,false,'#243b3d',20);
 text(`${result.total} / ${result.maximum} punten`,42,true,'#245643',20);
 text('1 punt per verschillende geldige lijn, juist geraakt doel en juist antwoord. Niet gemaakt, fout of te laat: 0 punten.',23);
 text('Ook gedeeltelijk werk is meegerekend. Dit overzicht hoort bij je definitieve inzending.',23,false,'#526764',24);
 for(const [i,p]of result.parts.entries()){
  ensure(155);text(`${i+1}. ${names[p.kind]}${p.label?' · '+p.label:''}`,29,true);
  text(`${p.score} / ${p.maximum} punten · ${p.done?'afgerond':'gedeeltelijk of niet gemaakt'}`,25,true);
  if(p.kind==='glass'&&!p.items.length)text('Geen geldige lijnen ingeleverd: 0 punten.',23);
  const items=p.items.map((v,j)=>`${p.kind==='glass'?'Lijn '+(j+1)+' ('+v.label+')':v.label}: ${v.correct?'1 punt':v.answered===false?'0 punten (niet beantwoord)':'0 punten'}`);
  // Readable item-by-item evidence, with page breaks before any clipped line.
  for(const item of items)text(item,22,false,'#3f5352',3);
  y+=22;
 }
 if(work.feedback){ensure(110);text('Feedback van je leerkracht',28,true);text(work.feedback,23);}
 for(const [i,c]of canvases.entries()){const g=c.getContext('2d');g.fillStyle='#687972';g.font='19px sans-serif';g.fillText(`Pagina ${i+1} van ${canvases.length} · ${work.alias}`,M,H-52);}
 return canvases;
}
async function create(task,work){const canvases=await pages(task,work);return LeraarBobProofPDF.pdf(canvases.map(canvas=>({width:canvas.width,height:canvas.height,bytes:Uint8Array.from(atob(canvas.toDataURL('image/jpeg',.95).split(',')[1]),c=>c.charCodeAt(0))})));}
function filename(task,work){return ('Punten-'+task.title+'-'+work.alias).replace(/[^\p{L}\p{N}._-]+/gu,'-').slice(0,150)+'.pdf';}
window.LeraarBobTaskReport=Object.freeze({create,pages,filename});
})();
