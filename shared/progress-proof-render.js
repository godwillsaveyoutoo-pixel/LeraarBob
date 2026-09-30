/* A4 receipt using the shared, locally generated PDF pages. */
(function(root){
'use strict';
function renderPages(report){
 const width=1240,height=1754,margin=88,right=width-margin,bottom=height-136,pages=[];
 const ink='#203e45',muted='#526962',green='#285d4a',pale='#edf3ef';let ctx,y;
 function text(value,x,top,size=24,color=ink,weight=400){ctx.font=`${weight} ${size}px Arial, sans-serif`;ctx.fillStyle=color;ctx.textBaseline='top';ctx.fillText(String(value),x,top);}
 function lines(value,maxWidth,size=24,weight=400){
  ctx.font=`${weight} ${size}px Arial, sans-serif`;const result=[];let line='';
  for(const word of String(value).split(/\s+/)){const joined=line?line+' '+word:word;if(ctx.measureText(joined).width<=maxWidth){line=joined;continue;}if(line)result.push(line);line='';for(const char of word){if(line&&ctx.measureText(line+char).width>maxWidth){result.push(line);line='';}line+=char;}}
  if(line)result.push(line);return result;
 }
 const date=value=>new Date(value).toLocaleString('nl-BE',{dateStyle:'long',timeStyle:'short',timeZone:'Europe/Brussels'});
 function newPage(){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;ctx=canvas.getContext('2d');pages.push(canvas);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);text('leraarBob',margin,70,31,green,700);text('VOORTGANGSBEWIJS',right-278,80,21,muted,700);ctx.fillStyle='#c5a052';ctx.fillRect(margin,126,right-margin,5);y=174;}
 function paragraph(value,size=24,color=ink,weight=400){for(const line of lines(value,right-margin,size,weight)){text(line,margin,y,size,color,weight);y+=size*1.45;}}
 function rule(){ctx.strokeStyle='#d8e2dc';ctx.beginPath();ctx.moveTo(margin,y);ctx.lineTo(right,y);ctx.stroke();}
 newPage();paragraph(report.name,46,ink,700);y+=8;paragraph(`Alias: ${report.alias}${report.className?'   ·   Klas: '+report.className:''}`,23,muted);paragraph('Gemaakt op '+date(report.createdAt),22,muted);y+=34;
 ctx.fillStyle=pale;ctx.fillRect(margin,y,right-margin,112);text(report.xp+' XP',margin+24,y+18,41,green,700);text(report.selection==='all'?'Totaal van de opgenomen spellen':'Verdiend in dit spel',margin+24,y+72,21,muted);text(report.entries.length+' '+(report.entries.length===1?'spel':'spellen'),right-186,y+37,27,green,700);y+=150;
 function tableHead(){text('SPEL EN VOORTGANG',margin,y,20,muted,700);text('XP',right-80,y,20,muted,700);y+=38;rule();y+=22;}
 tableHead();
 if(!report.entries.length){paragraph('Er is nog geen voortgang opgeslagen.',26);y+=14;paragraph('Speel een oefening en maak daarna een nieuw bewijs.',23,muted);}
 for(const entry of report.entries){
  const title=lines(entry.title,right-margin-170,29,700),body=[entry.label,...entry.details].flatMap(line=>lines(line,right-margin-155,23));
  const saved=entry.updatedAt&&Number.isFinite(Date.parse(entry.updatedAt))?'Bewaard: '+date(entry.updatedAt):null;
  const rowHeight=title.length*38+body.length*32+(saved?31:0)+33;
  if(y+rowHeight>bottom){newPage();paragraph(report.name,27,ink,700);y+=20;tableHead();}
  const start=y;for(const line of title){text(line,margin,y,29,ink,700);y+=38;}
  const xp=entry.xp===null?'—':String(entry.xp);text(xp,right-80,start,28,green,700);
  for(const line of body){text(line,margin,y,23,muted);y+=32;}
  if(saved){text(saved,margin,y+3,19,muted);y+=31;}y+=18;rule();y+=15;
 }
 pages.forEach((canvas,i)=>{ctx=canvas.getContext('2d');text('Momentopname van de voortgang opgeslagen bij je leraarBob-account.',margin,height-94,19,muted);text('XP en afgeronde onderdelen worden apart bijgehouden. — = geen XP-score.',margin,height-65,18,muted);text(`${i+1} / ${pages.length}`,right-64,height-65,19,muted);});
 return pages;
}
function documentPDF(report){const pages=renderPages(report);return root.LeraarBobProofPDF.pdf(pages.map(canvas=>{const raw=atob(canvas.toDataURL('image/jpeg',.94).split(',')[1]);return {width:canvas.width,height:canvas.height,bytes:Uint8Array.from(raw,c=>c.charCodeAt(0))};}));}
root.LeraarBobProofRender=Object.freeze({renderPages,documentPDF});
})(globalThis);
