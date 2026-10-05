/* Local, teacher-only classroom rehearsal. This module never contacts the server. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LeraarBobClassSimulation=factory();})(globalThis,function(){
'use strict';
const names=['Noor','Sami','Lina','Milan','Aya','Jules','Nora','Adam','Lou','Yara','Omar','Ella'];
const copy=value=>JSON.parse(JSON.stringify(value));
function create({game,deck,seconds=60,count=6,now=Date.now,saved=null}){
 if(!game?.generate||!game?.validate)throw Error('Het werkbord van dit spel is niet beschikbaar.');
 if(!saved&&(!Array.isArray(deck)||!deck.length||deck.some(spec=>{try{game.generate(spec);return false;}catch{return true;}})))throw Error('Kies geldige oefeningen voor de simulatie.');
 const total=Math.min(12,Math.max(1,Number(count)||6));
 const basePoints=game.id==='wortelbouw'?500:1000,speedBonus=game.id==='wortelbouw'?500:250;
 let data=saved?copy(saved):{id:'simulation-'+game.id+'-'+now()+'-'+Math.random().toString(36).slice(2,10),game:game.id,simulation:true,owner:true,code:'DEMO',phase:'lobby',round:-1,total:deck.length,deck:copy(deck),seconds:Math.max(10,Number(seconds)||60),members:Array.from({length:total},(_,i)=>({user_id:'virtual-'+i,alias:names[i]+' · virtueel',points:0,previous_points:0,eligible_from_round:0,answered:false,correct:false,plan:i===0?'none':i%4===3?'wrong':'correct',pace:['fast','normal','slow'][i%3]}))};
 if(data.game!==game.id||!data.simulation||!Array.isArray(data.deck)||!data.deck.length||!Array.isArray(data.members)||!data.members.length)throw Error('Deze simulatie hoort bij een ander spel.');
 // Older saved rehearsals also open as a learner. View choice is local presentation.
 data.studentView=data.studentView!==false;
 const trying=()=>data.studentView&&data.phase==='question'&&!data.members[0].answered;
 function snapshot(){return copy({...data,server_time:new Date(now()).toISOString(),spec:data.round>=0?data.deck[data.round]:null,trying:trying()});}
 function begin(){data.round++;data.phase='question';data.started=now();data.deadline=new Date(data.started+data.seconds*1000).toISOString();for(const p of data.members){p.previous_points=p.points;p.answered=false;p.correct=false;p.round_points=0;}return snapshot();}
 function results(){data.phase='results';return snapshot();}
 function answer(id,correct,time=now()){
  const p=data.members.find(m=>m.user_id===id);if(data.phase!=='question'||!p||p.answered)return snapshot();
  p.answered=true;p.correct=!!correct;const elapsed=Math.max(0,Math.min(1,(time-data.started)/(data.seconds*1000)));p.round_points=correct?basePoints+Math.max(0,speedBonus-Math.floor(speedBonus*elapsed)):0;p.points+=p.round_points;
  if(data.members.every(m=>m.answered))results();return snapshot();
 }
 function advance(){
  if(data.phase!=='question')return false;let changed=false;const time=now();
  for(const [i,p]of data.members.entries()){
   if(p.answered||p.plan==='none'||(trying()&&i===0))continue;
   const fraction=({fast:.16,normal:.44,slow:.76})[p.pace]||.44,at=data.started+data.seconds*1000*fraction;
   if(time>=at){answer(p.user_id,p.plan==='correct',at);changed=true;}
  }
  if(data.phase==='question'&&time>=Date.parse(data.deadline)){results();changed=true;}return changed;
 }
 return Object.freeze({snapshot,serialize:()=>copy(data),advance,answer,
  action(name){if(name==='start'&&data.phase==='lobby')return begin();if(name==='end_round'&&data.phase==='question')return results();if(name==='next'&&data.phase==='results'){if(data.round+1<data.total)return begin();data.phase='finished';return snapshot();}if(name==='close'){data.phase='closed';return snapshot();}throw Error('Deze actie past niet bij de huidige simulatiestap.');},
  configure(id,plan,pace){const p=data.members.find(m=>m.user_id===id);if(p){if(['correct','wrong','none'].includes(plan))p.plan=plan;if(['fast','normal','slow'].includes(pace))p.pace=pace;}return snapshot();},
  tryBoard(){if(data.phase!=='question')return snapshot();data.studentView=!data.studentView;return snapshot();},
  submit(answerValue,skipped=false){advance();if(!trying())return snapshot();let correct=false;try{correct=!skipped&&game.validate(game.generate(data.deck[data.round]),answerValue).ok;}catch{}const next=answer(data.members[0].user_id,correct);return {...next,tryResult:correct?'Juist antwoord op het echte werkbord.':'Dit antwoord was niet juist.'};}
 });
}
return Object.freeze({create});
});
