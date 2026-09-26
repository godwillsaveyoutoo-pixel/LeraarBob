/* Shared deterministic question stream. Keep the SQL clay_question_v2 in sync. */
(function(root){
  'use strict';
  const bank=[{n:0,d:1},{n:1,d:2},{n:-1,d:2},{n:1,d:1},{n:-1,d:1},{n:2,d:1},{n:-2,d:1},{n:1,d:3},{n:-1,d:3},{n:1,d:4},{n:-1,d:4}];
  const prime=2147483647, minAngle=18;
  function seed(id){return parseInt(String(id).replace(/-/g,'').slice(0,8),16)%2147483646+1}
  function random(value){let state=value;return()=>state=state*48271%prime}
  function shuffle(list,next){for(let i=list.length-1;i>0;i--){const j=next()%(i+1);[list[i],list[j]]=[list[j],list[i]]}return list}
  const angle=q=>Math.atan(q.n/q.d)*180/Math.PI;
  function question(id,index){
    const start=seed(id);
    if(!Number.isFinite(start)||!Number.isInteger(index)||index<0||index>1000000)throw Error('Ongeldige vragenreeks.');
    const core=shuffle([0,1,2,3,4,5,6],random(start));
    const block=Math.floor(index/5),offset=index%5,blockRandom=random((start+block*104729)%prime);
    const specialAt=1+blockRandom()%4,special=7+blockRandom()%4;
    const ordinal=block*4+offset-(offset>specialAt?1:0);
    const chosen=offset===specialAt?special:core[ordinal%7];
    const next=random((start+index*8191+17)%prime),side=next()%2?1:-1,decimal=next()%4===0;
    const choices=[chosen];
    for(const candidate of shuffle([0,1,2,3,4,5,6],next)){
      if(choices.every(i=>Math.abs(angle(bank[i])-angle(bank[candidate]))>=minAngle))choices.push(candidate);
      if(choices.length===3)break;
    }
    return {id:'mixed-'+index,...bank[chosen],side,decimal,choices:shuffle(choices,next).map(i=>({...bank[i]}))};
  }
  function label(q,decimal=false){
    if(q.d===1)return String(q.n).replace('-','−');
    if(decimal&&q.d!==3)return String(q.n/q.d).replace('.',',').replace('-','−');
    return (q.n<0?'−':'')+({2:'½',3:'⅓',4:'¼'}[q.d]);
  }
  function round(q){return {id:q.id,a:q.n/q.d,x:q.side*2.3,choices:q.choices.map(c=>c.n/c.d),labels:q.choices.map(c=>label(c,q.decimal))}}
  const api=Object.freeze({question,round,label,minAngle});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.AxiomaClayQuestions=api;
})(typeof window==='object'?window:globalThis);
