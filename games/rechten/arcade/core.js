/* Arcade results are learning evidence; naval misses are strategy, never math errors. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RechtenArcadeCore=api;})(globalThis,function(){
'use strict';
const VERSION=1;
const games=Object.freeze({zeeslag:{name:'Zeeslag',path:'../zeeslag/',total:1},redding:{name:'Brandweer & kabelbaan',path:'../brandweer/',total:16},kleiduiven:{name:'Kleiduifschieten',path:'../kleiduiven/',total:7}});
const rescue=[ [5,5,1,0,null,0],[5,8,1,3,1,null],[5,5,0,5,null,5],[3,6,2,0,null,0],[6,3,.5,0,null,0],[6,9,.5,6,.5,null],[4,6,1.5,0,null,0],[4,10,1.5,4,1.5,null],[5,-5,-1,0,null,0],[5,-8,-1,-3,-1,null],[5,-5,0,-5,null,-5],[3,-6,-2,0,null,0],[6,-3,-.5,0,null,0],[6,-9,-.5,-6,-.5,null],[4,-6,-1.5,0,null,0],[4,-10,-1.5,-4,-1.5,null] ];
function rescueCorrect(level,a,b){const t=rescue[level-1];return !!t&&Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a*t[0]+b-t[1])<1e-9&&(t[4]===null||a===t[4])&&(t[5]===null||b===t[5]);}
function rescueTask(level){const t=rescue[level-1];if(!t)throw Error('Onbekende redding');return {id:String(level),x:t[0],y:t[1],aFixed:t[4],bFixed:t[5],scene:level>8?'kabelbaan':'brandweer'};}
function identity(value){return String(value||'Jij').trim().slice(0,80)||'Jij';}
function uuid(){return globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}
function newRun(game,options={}){if(!games[game])throw Error('Onbekend spel');return {version:VERSION,id:options.id||uuid(),game,actor:identity(options.actor),mode:options.mode||'solo',sessionId:options.sessionId||null,seed:options.seed||uuid(),tempo:options.tempo||0,expected:options.expected||games[game].total,startedAt:new Date().toISOString(),finishedAt:null,complete:false,events:[]};}
function append(run,event){if(!event||!event.id||run.events.some(e=>e.id===event.id))return false;if(run.events.length>=1000)return false;run.events.push({...event,at:event.at||new Date().toISOString()});return true;}
function summary(run){
 const events=run.events.filter(e=>e.kind==='attempt'),tasks=new Map();
 for(const e of events){if(!tasks.has(e.task))tasks.set(e.task,[]);tasks.get(e.task).push(e);}
 let first=0,eventually=0,wrong=0,assisted=0;const skills={};
 for(const attempts of tasks.values()){
  const independent=attempts.filter(e=>!e.modeled),correct=independent.some(e=>e.correct===true);
  if(independent[0]?.correct===true)first++;if(correct)eventually++;if(attempts.some(e=>e.modeled))assisted++;
  wrong+=independent.filter(e=>e.correct===false).length;
  const skill=attempts[0].skill||'rechte',s=skills[skill]??={total:0,first:0,eventually:0,wrong:0};s.total++;s.first+=Number(independent[0]?.correct===true);s.eventually+=Number(correct);s.wrong+=independent.filter(e=>e.correct===false).length;
 }
 const naval=run.events.filter(e=>e.kind==='naval-shot'),outcome=run.events.find(e=>e.kind==='outcome');
 return {total:run.expected,attempted:tasks.size,first,eventually,wrong,assisted,skills,score:1000*first+500*(eventually-first),elapsedMs:Math.max(0,Number(run.elapsedMs)||0),shots:naval.length,hits:naval.reduce((sum,e)=>sum+(Number(e.hits)||0),0),won:outcome?.won??null,complete:!!run.complete};
}
function rankings(runs,game,tempo=0,mode='solo'){
 const best=new Map();for(const run of runs){if(run.game!==game||run.tempo!==tempo||run.mode!==mode||!run.complete)continue;const old=best.get(run.actor),s=summary(run),o=old&&summary(old);if(!old||s.score>o.score||(s.score===o.score&&s.elapsedMs<o.elapsedMs))best.set(run.actor,run);}
 const list=[...best.values()].map(run=>({...summary(run),actor:run.actor,id:run.id})).sort((a,b)=>b.score-a.score||a.elapsedMs-b.elapsedMs);let rank=0,last='';return list.map((r,i)=>{const key=r.score+':'+r.elapsedMs;if(key!==last)rank=i+1;last=key;return {...r,rank};});
}
function csv(rows){return '\uFEFF'+rows.map(row=>row.map(value=>{let v=String(value??'');if(typeof value==='string'&&/^[\s]*[=+\-@]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';}).join(';')).join('\r\n')+'\r\n';}
function resultsCSV(runs){return csv([['Sessie','Leerling','Spel','Modus','Gestart','Afgerond','Opdrachten','Geprobeerd','Juist eerste poging','Uiteindelijk juist','Foute pogingen','Voorgedaan','Arcadepunten','Tijd (s)','Schoten zeeslag','Treffers zeeslag','Zeeslag gewonnen'],...runs.map(r=>{const s=summary(r);return [r.sessionId||r.id,r.actor,games[r.game]?.name||r.game,r.mode,r.startedAt,r.complete?'ja':'nee',s.total,s.attempted,s.first,s.eventually,s.wrong,s.assisted,s.score,(s.elapsedMs/1000).toFixed(2).replace('.',','),s.shots,s.hits,s.won===null?'':s.won?'ja':'nee'];})]);}
function attemptsCSV(runs){return csv([['Sessie','Leerling','Spel','Opgave','Vaardigheid','Poging','Antwoord','Juist','Voorgedaan','Tijdstip'],...runs.flatMap(r=>r.events.filter(e=>e.kind==='attempt'||e.kind==='naval-shot').map(e=>[r.sessionId||r.id,r.actor,r.game,e.task||'',e.skill||'zeeslagstrategie',e.attempt||'',JSON.stringify(e.answer??{}),e.kind==='naval-shot'?'strategisch schot':e.correct?'ja':'nee',e.modeled?'ja':'nee',e.at]))]);}
function scenePoint(metrics,x,y){return {x:metrics.ox+x*metrics.unit,y:metrics.oy-y*metrics.unit};}
function ladderSections(length,unit){const collapsed=Math.min(length,Math.max(unit*.9,length*.42)),extra=Math.max(0,length-collapsed);return [{offset:0,length:collapsed},{offset:extra*.5,length:collapsed},{offset:extra,length:collapsed}];}
return Object.freeze({VERSION,games,rescueTask,rescueCorrect,identity,uuid,newRun,append,summary,rankings,csv,resultsCSV,attemptsCSV,scenePoint,ladderSections});
});
