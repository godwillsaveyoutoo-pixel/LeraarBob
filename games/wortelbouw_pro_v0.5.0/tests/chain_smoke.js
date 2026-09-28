'use strict';
const assert=require('assert');
const path=require('path');
const G=require(path.join(__dirname,'..','wortelbouw','geometry.js'));

function finishStep(state,owner,edgeIndex,k,mode='sum',flip=false){
  const plan=G.plan(state,owner,edgeIndex,k,mode,flip);
  assert(plan&&plan.valid,`invalid planned step ${owner} e${edgeIndex} ${mode} ${k}`);
  state=G.apply(state,{type:'triangle',owner,edgeIndex,k,mode,flip});
  state=G.apply(state,{type:'helper'});
  state=G.apply(state,{type:'result'});
  state=G.apply(state,{type:'reveal'});
  return state;
}

// Free placement must preserve the learner's chosen position.
let s=G.initial(11);
s=G.apply(s,{type:'start',k:1,x:7.25,y:-3.5});
const c=G.center(s.objects[0].points);
assert(Math.abs(c.x-7.25)<1e-9 && Math.abs(c.y+3.5)<1e-9,'free start position changed');

// √14 chain: 1² + 2² = 5, then 5 + 3² = 14.
s=finishStep(s,'s0',0,2,'sum',false);
assert.equal(s.phase,'choose');
assert.equal(s.objects.find(o=>o.id==='s1').area,5);

// A completed helper field must itself be reusable as land.
const helper=s.objects.find(o=>o.id==='h1');
assert(helper,'helper field missing');
const helperHasBuild=G.freeEdges(s,helper).some(e=>{
  for(let k=1;k<=G.maxLength(s);k++)for(const mode of ['sum','difference'])for(const flip of [false,true]){
    if(G.plan(s,helper.id,e.index,k,mode,flip)?.valid)return true;
  }
  return false;
});
assert(helperHasBuild,'completed second field cannot be reused');

// Continue from the newly created result field.
s=finishStep(s,'s1',1,3,'sum',true);
assert.equal(s.phase,'won');
assert.equal(s.objects.find(o=>o.id==='s2').area,14);

console.log('v0.4.3 chain smoke: OK');
