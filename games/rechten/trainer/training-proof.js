/* A local training receipt: no login request, upload or external PDF dependency. */
(function(root){
'use strict';
const count=n=>Math.max(0,Math.floor(Number(n)||0));
const clean=value=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
function round(state,{status,place='',now=Date.now()}={}){
 const s=state.session||{};
 return {at:now,status:status||(s.completed?'completed':'paused'),place,answered:count(s.answered),correct:count(s.correct),xp:count(s.xp),timedOut:count(s.timedOut)};
}
function snapshot(state,{skills,phase,place='',chapter='',now=Date.now()}={}){
 const s=state.session||{},live=!!state.journey?.active||s.answered>0;
 return {createdAt:now,chapter,totals:{answered:count(state.total),correct:count(state.correct),rounds:count(state.routeStep),xp:count(state.xp)},
  round:s.completed&&state.lastTrainingRound?.status==='completed'?{...state.lastTrainingRound}:live?round(state,{place,now}):state.lastTrainingRound?{...state.lastTrainingRound}:null,
  skills:Object.entries(skills).filter(([key])=>count(state.skills?.[key]?.seen)>0).map(([key,item])=>({label:item.label,seen:count(state.skills[key].seen),correct:count(state.skills[key].correct),phase:phase(key)}))};
}
function filename(name,at){
 const safe=clean(name).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||'leerling';
 const date=new Date(at),pad=n=>String(n).padStart(2,'0');
 return `oefenbewijs-rechten-${safe}-${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}.pdf`;
}
// Each page is drawn locally, so accents, mathematical symbols and entered names
// use the browser's fonts. The PDF embeds these JPEG pages at A4 size.
function pdf(pages){
 const encoder=new TextEncoder(),chunks=[],offsets=[0];let length=0;
 const add=data=>{const bytes=typeof data==='string'?encoder.encode(data):data;chunks.push(bytes);length+=bytes.length};
 const object=(id,body)=>{offsets[id]=length;add(`${id} 0 obj\n`);add(body);add('\nendobj\n')};
 const stream=(id,dict,bytes)=>{offsets[id]=length;add(`${id} 0 obj\n<< ${dict} /Length ${bytes.length} >>\nstream\n`);add(bytes);add('\nendstream\nendobj\n')};
 add('%PDF-1.4\n');object(1,'<< /Type /Catalog /Pages 2 0 R >>');
 object(2,`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`);
 pages.forEach((page,i)=>{
  const id=3+i*3;
  object(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Image ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);
  stream(id+1,`/Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,page.bytes);
  stream(id+2,'',encoder.encode('q\n595.28 0 0 841.89 0 0 cm\n/Image Do\nQ'));
 });
 const start=length;add(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
 for(const offset of offsets.slice(1))add(`${String(offset).padStart(10,'0')} 00000 n \n`);
 add(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`);
 return new Blob(chunks,{type:'application/pdf'});
}
function renderPages(report,identity){
 const width=1240,height=1754,margin=88,right=width-margin,bottom=height-132;
 const pages=[];let canvas,ctx,y;
 const ink='#203e45',muted='#597079',green='#256b56',pale='#eef4f0';
 function text(value,x,top,size=25,color=ink,weight=400){ctx.font=`${weight} ${size}px Arial, sans-serif`;ctx.fillStyle=color;ctx.textBaseline='top';ctx.fillText(String(value),x,top)}
 function lines(value,maxWidth,size=25,weight=400){
  ctx.font=`${weight} ${size}px Arial, sans-serif`;const result=[];let line='';
  for(const word of clean(value).split(' ')){
   const joined=line?line+' '+word:word;if(ctx.measureText(joined).width<=maxWidth){line=joined;continue}
   if(line)result.push(line);line='';
   for(const char of word){if(line&&ctx.measureText(line+char).width>maxWidth){result.push(line);line=''}line+=char}
  }
  if(line)result.push(line);return result;
 }
 function paragraph(value,size=25,color=ink,weight=400){for(const line of lines(value,right-margin,size,weight)){text(line,margin,y,size,color,weight);y+=size*1.45}}
 function newPage(){
  canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;ctx=canvas.getContext('2d');pages.push(canvas);
  ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle=green;ctx.fillRect(margin,68,54,6);
  text('leraarBob · Rechten',margin,96,24,green,700);y=152;
 }
 function heading(label){text(label,margin,y,28,ink,700);y+=48}
 newPage();paragraph('Bewijs van training',52,ink,700);y+=22;
 paragraph(identity.name,40,ink,700);if(identity.className)paragraph('Klas: '+identity.className,25,muted);y+=10;
 paragraph(new Date(report.createdAt).toLocaleString('nl-BE',{dateStyle:'long',timeStyle:'short'}),23,muted);
 if(identity.alias)paragraph('Account: '+identity.alias,22,muted);else paragraph('Geoefend zonder account',22,muted);
 y+=28;heading('Jouw opgeslagen voortgang');
 const metrics=[[report.totals.answered,'Opgaven beoordeeld'],[report.totals.correct,'Inhoudelijk juist'],[report.totals.rounds,'Rondes afgerond'],[report.totals.xp,'XP verdiend']];
 const gap=16,card=(right-margin-3*gap)/4;
 metrics.forEach(([value,label],i)=>{const x=margin+i*(card+gap);ctx.fillStyle=pale;ctx.fillRect(x,y,card,120);text(value,x+18,y+16,42,green,700);text(label,x+18,y+77,19,muted)});y+=154;
 if(report.chapter){paragraph(report.chapter,25,ink,700);y+=15}
 const r=report.round;
 if(r){
  const title=r.status==='completed'?'Laatste ronde · afgerond':r.status==='stopped'?'Laatste ronde · gestopt':'Huidige ronde · gepauzeerd';
  heading(title);if(r.place)paragraph(r.place,24,muted);
  paragraph(`${r.answered} van 12 opgaven beoordeeld · ${r.correct} inhoudelijk juist · ${r.xp} XP`,24);
  if(r.timedOut)paragraph(`${r.timedOut} opgaven met verstreken tijd.`,22,muted);
  if(r.status==='stopped')paragraph('De onafgewerkte opgave telt niet mee.',22,muted);
  paragraph('Rondemoment: '+new Date(r.at).toLocaleString('nl-BE'),21,muted);y+=24;
 }
 function tableHeader(){heading('Geoefende onderwerpen');ctx.fillStyle=pale;ctx.fillRect(margin,y,right-margin,40);text('Onderwerp',margin+10,y+10,19,muted,700);text('Opgaven',720,y+10,19,muted,700);text('Juist',837,y+10,19,muted,700);text('Voortgang',925,y+10,19,muted,700);y+=52}
 if(y>bottom-130){newPage();paragraph(identity.name,28,ink,700);y+=18}tableHeader();
 const phases={nieuw:'Nieuw',begeleid:'Begeleid',herstel:'Herhaling nodig',stevig:'Stevig',lerend:'In opbouw'};
 if(!report.skills.length)paragraph('Er zijn nog geen opgaven beoordeeld.',24,muted);
 for(const skill of report.skills){
  const wrapped=lines(skill.label,600,23),rowHeight=Math.max(46,wrapped.length*31+16);
  if(y+rowHeight>bottom){newPage();paragraph(identity.name,28,ink,700);y+=18;tableHeader()}
  wrapped.forEach((line,i)=>text(line,margin+10,y+i*31,23));text(skill.seen,740,y,23);text(skill.correct,850,y,23);text(phases[skill.phase]||'In opbouw',925,y,19,skill.phase==='stevig'?green:muted);
  y+=rowHeight;ctx.strokeStyle='#dce6e0';ctx.beginPath();ctx.moveTo(margin,y-10);ctx.lineTo(right,y-10);ctx.stroke();
 }
 pages.forEach((page,i)=>{canvas=page;ctx=page.getContext('2d');text('Overzicht van alle opgeslagen oefeningen, inclusief eerdere rondes.',margin,height-96,19,muted);text('Upload dit PDF-bestand in de uploadzone van Smartschool.',margin,height-67,19,muted);text(`${i+1} / ${pages.length}`,right-64,height-67,19,muted)});
 return pages;
}
function documentPDF(report,identity){
 const canvases=renderPages(report,identity);
 return pdf(canvases.map(canvas=>{const raw=atob(canvas.toDataURL('image/jpeg',.94).split(',')[1]);return {width:canvas.width,height:canvas.height,bytes:Uint8Array.from(raw,c=>c.charCodeAt(0))}}));
}
let dialog=null,remembered=null;
function close({reset=false}={}){if(dialog?.open)dialog.close();if(reset){dialog?.remove();dialog=null;remembered=null}}
function open(report,{account=null}={}){
 close();dialog?.remove();dialog=document.createElement('dialog');dialog.id='trainingProofDialog';dialog.className='training-proof-dialog';dialog.setAttribute('aria-labelledby','trainingProofTitle');
 dialog.innerHTML=`<form class="training-proof-form"><div class="proof-heading"><div><p class="eyebrow">Voor Smartschool</p><h2 id="trainingProofTitle">Jouw oefenbewijs</h2></div><button type="button" class="proof-close" aria-label="Sluiten">×</button></div><p>Vul je naam in zoals je leerkracht die kent. Download daarna je PDF en upload die in Smartschool.</p><div class="proof-fields"><label>Voor- en achternaam<input name="name" type="text" autocomplete="name" maxlength="100" required></label><label>Klas (optioneel)<input name="className" type="text" maxlength="40"></label></div><p class="proof-summary"></p><div class="proof-actions"><button type="submit" class="primary">Download bewijsje (PDF)</button><button type="button" data-proof-close>Terug</button></div><p class="proof-message" role="status" aria-live="polite"></p></form>`;
 document.body.append(dialog);const form=dialog.querySelector('form'),name=form.elements.name,className=form.elements.className,message=dialog.querySelector('.proof-message');
 const owner=account?.id||'guest';name.value=remembered?.owner===owner?remembered.name:account?.alias||'';className.value=remembered?.owner===owner?remembered.className:account?.class_code||'';
 dialog.querySelector('.proof-summary').textContent=`Op het bewijs: ${report.totals.answered} beoordeelde opgaven, ${report.totals.rounds} afgeronde rondes, je laatste ronde en je voortgang per onderwerp.`;
 dialog.querySelector('.proof-close').onclick=()=>close();dialog.querySelector('[data-proof-close]').onclick=()=>close();name.oninput=()=>name.setCustomValidity('');
 form.onsubmit=e=>{
  e.preventDefault();const identity={name:clean(name.value),className:clean(className.value),alias:clean(account?.alias)};
  name.setCustomValidity(identity.name?'':'Vul je naam in voor je het bewijsje downloadt.');if(!form.reportValidity())return;
  const button=form.querySelector('[type=submit]');button.disabled=true;message.textContent='Je PDF wordt gemaakt…';
  try{
   const blob=documentPDF(report,identity),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename(identity.name,report.createdAt);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
   remembered={owner,name:identity.name,className:identity.className};message.textContent='Je PDF is klaargezet om te downloaden. Upload het bestand daarna in Smartschool.';
  }catch(error){console.error('Oefenbewijs maken mislukt',error);message.textContent='Het PDF-bestand kon niet worden gemaakt. Probeer nog eens; je voortgang blijft bewaard.'}
  finally{button.disabled=false}
 };
 dialog.showModal();name.focus();
}
const api={round,snapshot,filename,pdf,renderPages,documentPDF,open,close};
if(typeof module==='object'&&module.exports)module.exports=api;else root.RechtenTrainingProof=api;
})(globalThis);
