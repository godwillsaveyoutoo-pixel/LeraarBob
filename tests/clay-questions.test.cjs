const {test}=require('node:test');
const assert=require('node:assert/strict');
const Q=require('../shared/axioma-clay-questions.js');
const core=new Set([0,.5,-.5,1,-1,2,-2]);
test('mixed streams keep 80% core questions with readable, unambiguous options',()=>{
 const seen=new Set(),positions=new Set(),sides=new Set(),notations=new Set();
 for(let seed=1;seed<=100;seed++){
  const id=seed.toString(16).padStart(8,'0')+'-1111-4111-8111-111111111111';
  for(let block=0;block<100;block++){
   let extras=0;
   for(let slot=0;slot<5;slot++){
    const index=block*5+slot,q=Q.question(id,index),value=q.n/q.d;
    assert.deepEqual(q,Q.question(id,index));
    assert.equal(q.choices.length,3);
    assert.equal(q.choices.filter(c=>c.n/c.d===value).length,1);
    for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert(Math.abs(Math.atan(q.choices[i].n/q.choices[i].d)-Math.atan(q.choices[j].n/q.choices[j].d))*180/Math.PI>=18);
    const round=Q.round(q);assert.equal(round.a,value);assert.equal(Math.sign(round.x),q.side);
    q.choices.forEach((c,i)=>{assert.equal(round.choices[i],c.n/c.d);if(c.d===3)assert.match(round.labels[i],/⅓/);if(round.labels[i].includes(','))assert.equal(Number(round.labels[i].replace('−','-').replace(',','.')),c.n/c.d)});
    extras+=!core.has(value);seen.add(value);positions.add(q.choices.findIndex(c=>c.n/c.d===value));sides.add(q.side);notations.add(q.decimal);
    if(slot===0)assert(core.has(value));
   }
   assert.equal(extras,1);
  }
 }
 assert.equal(seen.size,11);assert.equal(positions.size,3);assert.equal(sides.size,2);assert.equal(notations.size,2);
});
test('fractions remain exact and new sessions get different streams',()=>{
 assert.equal(Q.label({n:-1,d:4},true),'−0,25');assert.equal(Q.label({n:1,d:3},true),'⅓');assert.equal(Q.label({n:1,d:2}),'½');
 assert.notDeepEqual(Array.from({length:10},(_,i)=>Q.question('12345678-1111-4111-8111-111111111111',i)),Array.from({length:10},(_,i)=>Q.question('87654321-1111-4111-8111-111111111111',i)));
 assert.throws(()=>Q.question('invalid',0));assert.throws(()=>Q.question('12345678',-1));
});
