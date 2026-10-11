'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
async function mount(t,id,stored=null,role='student'){
 const dom=new JSDOM('<!doctype html><body><header></header></body>',{url:'https://fixture.example/',runScripts:'dangerously',pretendToBeVisual:true});t.after(()=>dom.window.close());const w=dom.window,saves=[];
 let actor={id:'one',role},listeners=[];
 w.AxiomaAuth={ready:async()=>({account:actor}),getAccount:async()=>actor,onChange:fn=>listeners.push(fn)};
 w.AxiomaProgress={load:async()=>({state:stored,revision:0}),save:async(game,state)=>{saves.push(JSON.parse(JSON.stringify(state)));return {status:'saved',revision:1};}};
 w.eval(fs.readFileSync('shared/axioma-game-adapters.js','utf8'));
 const script=w.document.createElement('script');script.dataset.gameId=id;script.textContent=fs.readFileSync('shared/axioma-game.js','utf8');w.document.body.append(script);await w.AxiomaGame.ready;
 return {api:w.AxiomaGame,saves,switch(){actor={id:'two',role:'student'};listeners.forEach(fn=>fn({account:actor}));}};
}
for(const [id,first,total]of [['brandweer',1,16],['stelsels',0,14]])test(id+': new completion awards once, never converts historical levels and remains in account progress',async t=>{
 const f=await mount(t,id,{storage:{},completed:[String(first)],total});assert.equal(f.api.practiceXP,0,'No retroactive conversion');
 assert.equal(f.api.rewardUnit(first+1),0,'Cannot reward an incomplete unit');
 f.api.report([String(first),String(first+1)],total);assert.equal(f.api.rewardUnit(first+1),10);assert.equal(f.api.rewardUnit(String(first+1)),0);assert.equal(f.api.practiceXP,10);
 for(const invalid of [-1,first+total,NaN,1.5,'__proto__',null,undefined,''])assert.equal(f.api.rewardUnit(invalid),0);
 await f.api.flush();assert.equal(f.saves.at(-1).practiceRewards.awards[first+1],10);assert.deepEqual(f.saves.at(-1).completed,[String(first),String(first+1)]);
 f.switch();assert.equal(f.api.rewardUnit(first),0,'Old account cannot receive a new reward');
});
test('Teacher rehearsal grants no student XP; other apps keep their existing rewards',async t=>{
 const teacher=await mount(t,'brandweer',null,'teacher');teacher.api.report(['1'],16);assert.equal(teacher.api.rewardUnit(1),0);assert.equal(teacher.api.practiceXP,0);
 const other=await mount(t,'getallenwereld');assert.equal(other.api.practiceXP,null);assert.equal(other.api.rewardUnit(1),0);
});
test('Saved awards reload without granting them a second time',async t=>{
 const state={storage:{},completed:['0'],total:14,practiceRewards:{version:1,awards:{'0':10,'01':10,'14':10,'3':1000}}};
 const f=await mount(t,'stelsels',state);assert.equal(f.api.practiceXP,10);assert.equal(f.api.rewardUnit(0),0);
});
