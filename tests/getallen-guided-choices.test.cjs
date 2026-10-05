'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const L=require('../games/getallenwereld/lessons.js'),G=require('../games/getallenwereld/guided-answer.js'),C=require('../games/bewerkingen-trainer/core.js');
test('Every old and new stage remains solvable with the displayed choices',()=>{
 let slots=0;
 for(const edition of[1,2])for(const stop of L.STOPS)for(let seed=1;seed<=30;seed++)for(let index=0;index<6;index++){
  const t=L.make(stop.id,seed,index,edition);
  for(let j=0;j<t.stages.length;j++){
   const stage=t.stages[j],values=stage.slots.map(s=>s.answer),html=G.formula(stage.template,i=>'SLOT'+i);
   assert.doesNotMatch(html,/\\|\[\[|undefined/);
   for(let i=0;i<values.length;i++){
    const options=G.choices(t,j,i,values);assert(options.includes(values[i]),stop.id+' '+stage.template+' '+values[i]);
    assert(options.length>=3&&options.length<=6);assert.equal(new Set(options).size,options.length);slots++;
   }
   assert(L.checkStage(t,j,values).ok);
  }
 }
 assert(slots>11000);
});
test('Choosing a different valid square factor keeps its matching rest factor available',()=>{
 for(let seed=1;seed<=80;seed++)for(let index=0;index<3;index++){
  const t=L.make('wortels-factor',seed,index),stage=t.stages[0];
  for(const factor of stage.squareChoices){if(Number(t.expression)%factor)continue;const values=[String(factor),String(Number(t.expression)/factor)];assert(G.choices(t,0,1,values).includes(values[1]));assert(L.checkStage(t,0,values).ok);}
 }
});
test('Topic links select related question forms, and do not invent unsupported equivalents',()=>{
 assert.deepEqual(L.practiceSkills('machten-product'),['power-product']);assert.deepEqual(L.practiceSkills('wortels-som'),['root-sum','root-sum-mixed']);
 assert.deepEqual(L.practiceSkills('machten-betekenis'),[]);assert.deepEqual(L.practiceSkills('wortels-regels'),[]);
 for(const stop of L.STOPS)for(const id of L.practiceSkills(stop.id))assert(C.SKILLS.some(s=>s.id===id&&s.group===stop.theme));
});
