const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../games/rechten/trainer/training-proof.js');
const skills={point:{label:'Coördinaten'},slope:{label:'Helling'}};
const fixture=()=>({total:18,correct:12,routeStep:1,xp:150,session:{answered:6,correct:3,xp:30,timedOut:1},skills:{point:{seen:12,correct:9},slope:{seen:6,correct:3}}});
const options={skills,phase:()=> 'lerend',place:'Punten en helling',chapter:'Hoofdstuk 1',now:1750000000000};
test('stopped round is available after the session counters are cleared and saved',()=>{
 const state=fixture(),original=structuredClone(state);
 state.lastTrainingRound=P.round(state,{status:'stopped',place:options.place,now:100});state.session={answered:0,correct:0,xp:0};
 const report=P.snapshot(JSON.parse(JSON.stringify(state)),options);
 assert.deepEqual(report.totals,{answered:18,correct:12,rounds:1,xp:150});assert.deepEqual(report.round,{at:100,status:'stopped',place:options.place,answered:6,correct:3,xp:30,timedOut:1});
 assert.equal(report.skills.length,2);assert.equal(original.skills.point.seen,12);report.round.answered=99;assert.equal(state.lastTrainingRound.answered,6);
});
test('a new in-progress round and a completed round use the correct results and timestamp',()=>{
 const state=fixture();state.lastTrainingRound={status:'stopped',answered:4,at:100};
 assert.equal(P.snapshot(state,options).round.answered,6);
 state.session.completed=true;state.lastTrainingRound=P.round(state,{status:'completed',now:200});
 assert.equal(P.snapshot(state,options).round.at,200);
 state.session={answered:0};state.journey={active:{}};assert.equal(P.snapshot(state,options).round.answered,0);
});
test('an empty learner receives an honest empty report and snapshot does not modify progress',()=>{
 const state={session:{},skills:{point:{seen:0,correct:0}}},before=JSON.stringify(state),report=P.snapshot(state,options);
 assert.deepEqual(report.totals,{answered:0,correct:0,rounds:0,xp:0});assert.deepEqual(report.skills,[]);assert.equal(report.round,null);assert.equal(JSON.stringify(state),before);
});
test('download names are safe and keep recognizable accented names',()=>{
 const name=P.filename("Élise D'Haene / ../ test",1750000000000);
 assert.match(name,/^oefenbewijs-rechten-Elise-D-Haene-test-\d{4}-\d{2}-\d{2}\.pdf$/);assert.match(P.filename('李 明',1750000000000),/rechten-leerling-/);
});
test('multi-page PDF cross references address exact byte offsets including image bytes',async()=>{
 const blob=P.pdf([{width:1240,height:1754,bytes:Uint8Array.of(255,216,128,0,255,217)},{width:1240,height:1754,bytes:Uint8Array.of(255,216,255,217)}]);
 assert.equal(blob.type,'application/pdf');const data=Buffer.from(await blob.arrayBuffer()),text=data.toString('latin1');
 assert.match(text,/\/Count 2/);const xref=Number(text.match(/startxref\n(\d+)/)[1]);assert.equal(data.subarray(xref,xref+4).toString(),'xref');
 const offsets=text.slice(xref).split('\n').slice(3,11);offsets.forEach((line,i)=>{const start=Number(line.slice(0,10));assert.equal(data.subarray(start,start+7).toString(),`${i+1} 0 obj`)});
});
