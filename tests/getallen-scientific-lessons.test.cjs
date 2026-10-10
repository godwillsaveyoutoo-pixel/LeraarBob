'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const L=require('../games/getallenwereld/lessons.js'),G=require('../games/getallenwereld/guided-answer.js'),C=require('../games/bewerkingen-trainer/core.js');
const OLD_IDS=['machten-betekenis','machten-product','machten-quotient','machten-macht','machten-factoren','machten-haakjes','machten-negatief','machten-mix','wortels-factor','wortels-product','wortels-quotient','wortels-macht','wortels-vereenvoudigen','wortels-som','wortels-regels'];
const IDS=['wetenschappelijk-groot','wetenschappelijk-klein','wetenschappelijk-terug','wetenschappelijk-normaliseren'];

// Independent decimal/mantissa oracle: integer digits and powers of ten only.
// It does not use the lesson's construction helpers or floating point values.
function rational(source){
 const match=String(source).match(/^(-?)(\d+)(?:\.(\d+))?(?:\*10\^\((-?\d+)\))?$/);assert(match,'Independent numeric notation: '+source);
 const [,sign,whole,fraction='',power='0']=match,exponent=Number(power)-fraction.length;
 let numerator=BigInt(whole+fraction)*(sign?-1n:1n),denominator=1n;
 if(exponent>=0)numerator*=10n**BigInt(exponent);else denominator=10n**BigInt(-exponent);
 let a=numerator<0n?-numerator:numerator,b=denominator;while(b){[a,b]=[b,a%b];}
 return {n:numerator/a,d:denominator/a};
}
const signature=q=>'1:0,0,0,0,0='+q.n+'/'+q.d;
const fromTex=tex=>tex.replace(/\{,\}/g,'.').replace(/\\cdot/g,'*').replace(/\^\{(-?\d+)\}/g,'^($1)');
const taskSeed=(seed,index)=>(seed+Math.imul(index+1,2654435761))>>>0;

test('Scientific guided units append to the old identities and share the existing practice skill',()=>{
 assert.deepEqual(L.STOPS.slice(0,15).map(s=>s.id),OLD_IDS);
 assert.deepEqual(L.STOPS.slice(15).map(s=>s.id),IDS);
 assert.deepEqual(L.THEMES.map(t=>[t.id,t.stops.length]),[['machten',8],['wortels',7],['wetenschappelijk',4]]);
 for(const [index,id] of IDS.entries()){assert.equal(L.stop(id).theme,'wetenschappelijk');assert.deepEqual(L.practiceSkills(id),index<2?['scientific']:[]);assert.equal(L.GOAL,6);}
});

test('All 5,400 sampled historical lesson tasks are byte-identical to the existing pilot',()=>{
 const hash=createHash('sha256');
 // Fixture recorded before this additive curriculum change; editions, rules,
 // answer order, explanations and every previous step are part of the digest.
 for(const edition of[1,2])for(const id of OLD_IDS)for(let seed=1;seed<=30;seed++)for(let index=0;index<6;index++)hash.update(JSON.stringify(L.make(id,seed,index,edition))+'\n');
 assert.equal(hash.digest('hex'),'909d22e04524ac696ab8657a804beec9fffd27ecfd1e79ef04ef00036aa85ed0');
});

test('Every scientific source, displayed answer and canonical stage has the same exact rational value',()=>{
 let checked=0;
 for(const edition of[1,2])for(const id of IDS)for(let seed=0;seed<80;seed++)for(let index=0;index<6;index++){
  const task=L.make(id,taskSeed(seed,index),index,edition),expected=rational(task.expression);
  assert.deepEqual(task,L.make(id,taskSeed(seed,index),index,edition),'Reproducible history');
  assert.notEqual(expected.n,0n,'No zero scientific coefficient');
  assert.equal(C.signature(C.parse(task.expression).value),signature(expected));
  assert.equal(C.signature(C.parse(task.answer).value),signature(expected));
  assert.deepEqual(rational(fromTex(task.answerTex)),expected,'Displayed answer must preserve the source value');
  for(let i=0;i<task.stages.length;i++){
   const stage=task.stages[i],values=stage.slots.map(s=>s.answer);
   assert(L.checkStage(task,i,values).ok,JSON.stringify(task));
   assert.deepEqual(rational(fromTex(L.fill(stage.template,values))),expected,'Displayed answer slots must mean the same number');
   assert.equal(C.signature(C.parse(L.fill(stage.expression,values)).value),signature(expected));
   checked++;
  }
 }
 assert.equal(checked,3840);
});

test('Every canonical answer can be selected with the existing touch-choice model',()=>{
 for(const edition of[1,2])for(const id of IDS)for(let seed=1;seed<=40;seed++)for(let index=0;index<6;index++){
  const task=L.make(id,seed,index,edition);assert(task.choices.some(c=>c.id===task.correct));assert.equal(new Set(task.choices.map(c=>c.id)).size,3);
  for(let i=0;i<task.stages.length;i++){
   const stage=task.stages[i],values=stage.slots.map(s=>s.answer);
   const html=G.formula(stage.template,n=>'SLOT'+n);assert.doesNotMatch(html,/\\|\[\[|undefined/);
   for(let n=0;n<values.length;n++){
    const options=G.choices(task,i,n,values);assert(options.includes(values[n]));assert.equal(options.length,5);assert.equal(new Set(options).size,5);
    if(stage.slots[n].choices)assert(options.every(value=>/^\d$/.test(value)),'A digit slot only displays individual digits');
    assert.match(G.render(task,i,values,n),/data-choice=/);
   }
  }
 }
});

test('Scientific coefficients stay normalized and signed depth tasks keep their sign',()=>{
 const seen=new Set();
 for(const id of IDS.filter(id=>!id.endsWith('-terug')))for(const edition of[1,2])for(let seed=1;seed<=30;seed++)for(let index=0;index<6;index++){
  const task=L.make(id,seed,index,edition),match=task.answerTex.match(/^(-?)([1-9])\{,\}([0-9])\\cdot10\^\{(-?\d+)\}$/);assert(match,task.answerTex);
  const negative=edition===2&&index>=4;assert.equal(match[1]==='-',negative);assert.equal(task.expression.startsWith('-'),negative);
  const exponent=Number(match[4]);if(id.endsWith('-groot'))assert(exponent>0);if(id.endsWith('-klein'))assert(exponent<0);
  seen.add(match[2]+match[3]);
 }
 assert(seen.has('10'),'The boundary coefficient 1 is represented');assert([...seen].some(s=>s[1]==='0'),'Whole coefficients are represented');
});

test('Reverse scientific writing exercises both decimal directions and fixed negative signs',()=>{
 for(let index=0;index<6;index++){
  const task=L.make('wetenschappelijk-terug',193,index,2),stage=task.stages[0];
  assert.equal(task.correct,index%2?'decimalleft':'decimalright');assert.equal(stage.slots.length,index%2?2:1);
  assert.equal(task.answerTex.startsWith('-'),index>=4);
  if(index%2)assert.match(task.answerTex,/0\{,\}0/);else assert.doesNotMatch(task.answerTex,/\{,\}/);
 }
});

test('Normalization compensates both an oversized and an undersized coefficient',()=>{
 for(let index=0;index<6;index++){
  const task=L.make('wetenschappelijk-normaliseren',993,index,2),sourceExponent=Number(task.expression.match(/\^\((-?\d+)\)/)[1]),answerExponent=Number(task.answerTex.match(/\^\{(-?\d+)\}/)[1]);
  assert.equal(task.correct,index%2?'normalizesmall':'normalizelarge');
  assert.equal(answerExponent,sourceExponent+(index%2?-1:1));
 }
});

test('Malformed digit answers cannot change the rendered decimal place while passing exact grading',()=>{
 for(const id of IDS)for(let index=0;index<6;index++){
  const task=L.make(id,9,index),stage=task.stages[0],values=stage.slots.map(s=>s.answer);
  for(let i=0;i<values.length;i++){
   for(const bad of ['', '-', '1.5','1,5','1e2','99999999']){const attempt=[...values];attempt[i]=bad;assert(!L.checkStage(task,0,attempt).ok);}
   if(stage.slots[i].choices)for(const bad of ['0'+values[i],'-'+values[i],'10']){const attempt=[...values];attempt[i]=bad;assert(!L.checkStage(task,0,attempt).ok,'Only one selected digit can be accepted');}
   const wrong=G.choices(task,0,i,values).find(value=>value!==values[i]);assert(wrong!==undefined);const attempt=[...values];attempt[i]=wrong;assert(!L.checkStage(task,0,attempt).ok);
  }
 }
});

test('Each unit and edition can start six different questions within the existing bounded seed search',()=>{
 for(const id of IDS)for(const edition of[1,2]){
  let found=false;
  for(let probe=0;probe<4096;probe++){
   const seed=Math.imul(probe+1,2654435761)>>>0;
   if(new Set(Array.from({length:6},(_,index)=>L.make(id,taskSeed(seed,index),index,edition).expression)).size===6){found=true;break;}
  }
  assert(found,id+' edition '+edition);
 }
});

test('Boundary seeds remain exactly reproducible without producing an unsupported exponent',()=>{
 for(const id of IDS)for(const seed of [0,1,4294967295])for(const edition of[1,2])for(let index=0;index<6;index++){
  const task=L.make(id,seed,index,edition);assert.deepEqual(task,L.make(id,seed,index,edition));
  assert.equal(C.signature(C.parse(task.expression).value),C.signature(C.parse(task.answer).value));
  assert(L.checkStage(task,0,task.stages[0].slots.map(slot=>slot.answer)).ok);
 }
});
