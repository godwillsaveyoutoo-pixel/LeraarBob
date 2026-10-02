const test=require('node:test'),assert=require('node:assert/strict');
const Flow=require('../games/rechten/rechtenwereld/answer-flow.js');
const {fixtures}=require('./helpers/rechten-question-fixtures.cjs');
const state=m=>({screen:'mission',active:m.skill,missions:{[m.skill]:structuredClone(m)},settings:{}});
const all=fixtures();
test('only correct feedback in each released exercise can advance; mistakes and unsubmitted work stay',()=>{
 const skills=new Set();for(const {m}of all){const s=state(m),ms=Flow.delay(s);if(m.feedback?.result.ok&&!m.completed){assert(ms>=1800&&ms<=6000);skills.add(m.skill)}else assert.equal(ms,0)}assert.equal(skills.size,27);
 const s=state(all.find(r=>r.m.feedback?.result.ok).m);s.settings.autoAdvance=false;assert.equal(Flow.delay(s),0);s.settings.autoAdvance=true;s.screen='profile';assert.equal(Flow.delay(s),0);
});
test('one advance per fresh submission; pause, stale callbacks and navigation cannot skip work',()=>{
 let s=state(all.find(r=>r.m.feedback?.result.ok).m),enabled=true,advances=0,shown=false;const calls=[];
 const flow=Flow.create({getState:()=>s,canRun:()=>enabled,advance:()=>advances++,waiting:v=>shown=v,setTimer:fn=>{calls.push(fn);return calls.length},clearTimer:()=>{}});
 assert.equal(calls.length,0,'saved feedback does not arm itself');flow.start();assert(shown);flow.stop();calls[0]();assert.equal(advances,0);assert(!shown);
 flow.start();flow.start();calls[1]();assert(shown,'old callback cannot clear the new feedback UI');assert.equal(advances,0);calls[2]();assert.equal(advances,1);assert(!shown);
 flow.start();s.screen='world';calls[3]();assert.equal(advances,1);
 s.screen='mission';flow.start();s.missions[s.active].attempt++;calls[4]();assert.equal(advances,1);
 flow.start();enabled=false;calls[5]();assert.equal(advances,1);
});
