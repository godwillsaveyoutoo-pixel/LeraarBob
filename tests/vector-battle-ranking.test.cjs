const {test}=require('node:test'),assert=require('node:assert/strict'),R=require('../games/vectoren/vector-battle-ranking.js');
const match=(id,scores,names=['Alex','Sam'],rounds=5)=>({id,at:1000,names,scores,rounds});
test('ranking awards three for a win and one for a draw regardless of match length',()=>{
 let s=R.record({},match('a',[3,2]));s=R.record(s,match('b',[2,2]));s=R.record(s,match('c',[1,8],['Alex','Sam'],10));
 const rows=R.standings(s);assert.deepEqual(rows.map(r=>[r.name,r.points,r.wins,r.draws,r.played,r.rank]),[['Alex',4,1,1,3,1],['Sam',4,1,1,3,1]]);
});
test('duplicate results cannot count twice; names match across casing and spacing',()=>{
 let s=R.record({},match('a',[4,1]));s=R.record(s,match('a',[0,5]));s=R.record(s,match('b',[3,0],[' alex ',' SAM ']));
 assert.equal(s.matches.length,2);assert.equal(R.standings(s).length,2);assert.equal(R.standings(s)[0].points,6);
});
test('malformed and impossible results are excluded',()=>{
 for(const m of [match('a',[-1,3]),match('b',[5,5]),match('c',[1.2,2]),match('d',[1,2],['Alex',' alex ']),match('e',[1,0],['','Sam']),match('f',[1,2],['Alex','Sam'],8),null])assert.equal(R.record({},m).matches.length,0);
 assert.deepEqual(R.sanitize({matches:'bad'}),{matches:[]});
});
test('bounded match history keeps recent completed battles',()=>{
 const s=R.sanitize({matches:Array.from({length:510},(_,i)=>match(String(i),[3,1]))});assert.equal(s.matches.length,R.LIMIT);assert.equal(s.matches[0].id,'10');assert.equal(R.standings(s)[0].played,R.LIMIT);
});
