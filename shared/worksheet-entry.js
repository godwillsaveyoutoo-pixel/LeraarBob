/* Compatibility for old paper URLs. New sheets live in the central composer. */
(()=>{
'use strict';const script=document.currentScript,base=new URL('../',script.src),game=script.dataset.worksheetGame,p=new URLSearchParams(location.search);
function href(level){const url=new URL('oefenbladen/maken.html',base);let source,topic;
 if(game==='rights'){topic=p.get('world')||'hellingrug';source='rechtenwereld:'+topic;}
 else if(game==='numbers'){source='bewerkingen-trainer:operations';topic=p.get('world')||p.get('group')||'machten';if(!['machten','wortels','wetenschappelijk'].includes(topic))topic='machten';}
 else{topic=game==='systems'?'systems':'equations';source='algebra-trainer:'+topic;}
 url.searchParams.set('source',source);url.searchParams.set('topic',topic);if(p.get('skills'))url.searchParams.set('skills',p.get('skills'));if(level||p.get('level'))url.searchParams.set('level',level||p.get('level'));return url.href;
}
function open(level){const url=href(level),event=new CustomEvent('leraarbob:worksheet-route',{cancelable:true,detail:{href:url}});document.dispatchEvent(event);if(!event.defaultPrevented)location.assign(url);return true;}
window.LeraarBobWorksheetEntry=Object.freeze({open,href});
if(game!=='rights'){const style=document.createElement('style');style.textContent='#navigationWorksheet,#makeSheetBtn,#generatePaper,[data-screen="sheet"],label:has(>#includeKey){display:none!important}';document.head.append(style);}
if(game==='rights'||game==='numbers'&&(p.get('intent')==='worksheet'||p.get('screen')==='sheet')||['systems','equations'].includes(game)&&['paper','preview'].includes(p.get('screen')))location.replace(href());
})();
