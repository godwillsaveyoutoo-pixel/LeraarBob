(function(){
'use strict';
const $=id=>document.getElementById(id),Core=VectorTrainerCore,frames=[$('pane0'),$('pane1')],ready=[false,false];
// Local files have an opaque messaging origin even when location.origin says file://.
const opaque=location.protocol==='file:'||location.origin==='null';
const target=opaque?'*':location.origin,peerOrigin=opaque?'null':location.origin;
let rankingMessage='';
let match=null,index=0,deck=[],scores=[0,0],passed=[false,false],resolved=false,names=[],active=false;
const send=(i,data)=>frames[i].contentWindow.postMessage(data,target);
$('world').append(new Option('Mixed · meerdere werelden','mixed'));
for(const world of VectorMission.STATIONS){const option=document.createElement('option');option.value=world.id;option.textContent=world.name;$('world').append(option);}
$('world').value='mixed';
function selectedPool(){return $('world').value==='mixed'?VectorMission.BATTLE_MIXED_SKILLS:VectorMission.STATIONS.find(s=>s.id===$('world').value).skills;}
function skills(){const mixed=$('world').value==='mixed';$('skill').replaceChildren(new Option(mixed?'Mixed constructies':'Mix van deze wereld','mix'));for(const id of selectedPool())$('skill').append(new Option(Core.TaskGenerator.skills.find(s=>s.id===id).label,id));$('mixedHint').hidden=!mixed;}
$('world').onchange=skills;skills();
function show(id){for(const name of ['setup','arena','result'])$(name).hidden=name!==id;$('openRanking').hidden=id==='arena';}
function freshMatch(){
 if(!ready.every(Boolean))return;
 names=[$('name0').value.trim()||'Leerling 1',$('name1').value.trim()||'Leerling 2'].map(VectorBattleRanking.name);
 if(VectorBattleRanking.identity(names[0])===VectorBattleRanking.identity(names[1])){$('name1').setCustomValidity('Kies twee verschillende spelersnamen voor de ranglijst.');$('name1').reportValidity();return;}
 rankingMessage='';
 const seeds=crypto.getRandomValues(new Uint32Array(12));match=Array.from(seeds.slice(10)).join('-');index=0;scores=[0,0];active=true;
 const pool=$('skill').value==='mix'?selectedPool():[$('skill').value],count=Number($('rounds').value);
 deck=Array.from({length:count},(_,i)=>({skill:pool[i%pool.length],seed:seeds[i],variant:i%4,level:1}));
 for(let i=0;i<2;i++){$('playerName'+i).textContent=names[i];frames[i].title='Werkbord van '+names[i];$('score'+i).textContent='0';}
 show('arena');startRound();
}
function startRound(){
 resolved=false;passed=[false,false];$('roundLabel').textContent=`Ronde ${index+1} / ${deck.length}`;$('roundStatus').textContent='Wie antwoordt als eerste juist?';$('nextRound').disabled=true;$('nextRound').hidden=true;$('nextRound').textContent=index===deck.length-1?'Bekijk eindstand →':'Volgende ronde →';
 for(let i=0;i<2;i++){$('state'+i).textContent='Aan zet';send(i,{type:'vector-battle-question',match,index,...deck[index]});}
}
function resolve(winner){
 if(resolved)return;resolved=true;
 const message=winner===null?'Allebei gepast. Deze ronde levert geen punt op.':`${names[winner]} is als eerste juist: +1 punt!`;
 if(winner!==null)scores[winner]++;
 $('roundStatus').textContent=message;$('nextRound').disabled=false;$('nextRound').hidden=false;$('nextRound').focus({preventScroll:true});
 if(index===deck.length-1)recordRanking();
 for(let i=0;i<2;i++){$('score'+i).textContent=scores[i];$('state'+i).textContent=winner===i?'+1 punt':'Afgerond';send(i,{type:'vector-battle-resolved',match,index,message});}
}
function finish(){active=false;show('result');$('winner').textContent=scores[0]===scores[1]?'Gelijkspel!':`${names[scores[0]>scores[1]?0:1]} wint!`;$('finalScore').textContent=`${names[0]}: ${scores[0]}\n${names[1]}: ${scores[1]}`;$('resultDetail').textContent=`${deck.length} rondes gespeeld. ${rankingMessage||'Klaar voor een revanche?'}`;}
function readRanking(){return VectorBattleRanking.sanitize(JSON.parse(localStorage.getItem(VectorBattleRanking.KEY)||'{}'));}
function recordRanking(){
 try{const state=VectorBattleRanking.record(readRanking(),{id:match,at:Date.now(),names,scores,rounds:deck.length});localStorage.setItem(VectorBattleRanking.KEY,JSON.stringify(state));rankingMessage='Opgenomen in de ranglijst op dit toestel.';}
 catch{rankingMessage='De ranglijst kon niet worden bewaard op dit toestel.';}
}
function renderRanking(){
 $('rankingRows').replaceChildren();let rows=[];
 try{rows=VectorBattleRanking.standings(readRanking());$('rankingStatus').textContent='';}
 catch{$('rankingStatus').textContent='De opgeslagen ranglijst kan niet worden gelezen.';}
 $('rankingEmpty').hidden=rows.length>0;$('rankingTableWrap').hidden=!rows.length;
 for(const row of rows){const tr=document.createElement('tr');for(const value of [row.rank,row.name,row.points,row.wins,row.played]){const cell=document.createElement('td');cell.textContent=value;tr.append(cell);}$('rankingRows').append(tr);}
}
$('name1').addEventListener('input',()=>$('name1').setCustomValidity(''));
$('name0').addEventListener('input',()=>$('name1').setCustomValidity(''));
$('openRanking').onclick=()=>{renderRanking();$('rankingDialog').showModal();};
$('closeRanking').onclick=()=>$('rankingDialog').close();
addEventListener('storage',event=>{if(event.key===VectorBattleRanking.KEY&&$('rankingDialog').open)renderRanking();});
addEventListener('message',event=>{
 const player=frames.findIndex(f=>f.contentWindow===event.source);if(player<0||event.origin!==peerOrigin)return;
 const data=event.data;if(!data||typeof data!=='object')return;
 if(data.type==='vector-battle-ready'){
  ready[player]=true;if(ready.every(Boolean)){$('startBattle').disabled=false;$('startBattle').textContent='Start de battle →';$('loadStatus').textContent='';}
  if(active&&!resolved)send(player,{type:'vector-battle-question',match,index,...deck[index]});return;
 }
 if(data.type!=='vector-battle-answer'||!active||resolved||data.match!==match||data.index!==index||passed[player])return;
 if(data.skipped){passed[player]=true;$('state'+player).textContent='Gepast';if(passed.every(Boolean))resolve(null);return;}
 // The shared core checks the submitted answer again; only one point is possible per round.
 try{const task=Core.TaskGenerator.generate(deck[index].skill,deck[index]);if(Core.TaskValidator.validate(task,data.answer||{}).ok)resolve(player);}catch{}
});
for(let i=0;i<2;i++){frames[i].addEventListener('load',()=>send(i,{type:'vector-battle-ping'}));send(i,{type:'vector-battle-ping'});}
$('battleForm').onsubmit=event=>{event.preventDefault();freshMatch();};
$('nextRound').onclick=()=>{if(!active||!resolved)return;if(index===deck.length-1)finish();else{index++;startRound();}};
$('rematch').onclick=freshMatch;$('newBattle').onclick=()=>show('setup');
$('stopBattle').onclick=()=>$('stopDialog').showModal();$('keepPlaying').onclick=()=>$('stopDialog').close();$('confirmStop').onclick=()=>{active=false;for(let i=0;i<2;i++)send(i,{type:'vector-battle-resolved',match,index,message:'Battle gestopt.'});$('stopDialog').close();show('setup');};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('fullscreen').textContent='Niet beschikbaar';}};
setTimeout(()=>{if(!ready.every(Boolean))$('loadStatus').textContent='Een speelhelft kon nog niet laden. Vernieuw de pagina om opnieuw te proberen.';},12000);
// Read-only state for checking score isolation and simultaneous play.
window.VectorBattle=Object.freeze({inspect:()=>structuredClone({match,index,deck,scores,passed,resolved,names,active})});
})();
