const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../games/reele-getallen/real-core.js'),L=require('../games/reele-getallen/real-lessons.js'),P=C.Progress;
function solution(t){const a=C.freshAnswer(t);switch(t.skill){case 'fraction':a.values=[String(Math.abs(t.target.n)),String(t.target.d)];a.sign=Math.sign(t.target.n)||1;break;case 'compare':a.relation=t.target;break;case 'line':a.tick=t.tick;break;case 'root':a.values=(t.source.sign<0?[-t.k-1,-t.k]:[t.k,t.k+1]).map(String);a.stage=1;break;case 'interval':a.values=[t.lo===null?'-inf':String(t.lo),t.hi===null?'inf':String(t.hi)];a.closedLo=t.closedLo;a.closedHi=t.closedHi;break;case 'sets':a.placements=[...t.target];break;case 'decimaltype':a.decimalType=t.target;break;case 'classify':a.labels=t.target;break;case 'period':Object.assign(a,t.target);break;case 'group':a.groups=t.tokens.map(e=>C.equal(C.value(e),C.value(t.tokens[0]))?'A':'B');break;}return a}
test('exact number model: decimal commas, signs, equivalent fractions, percentages and roots',()=>{
 assert.deepEqual(C.value(C.percent(75)),C.rational(3,4));assert.deepEqual(C.parse('−0,75'),C.rational(-3,4));assert(C.equal(C.value(C.sqrt(16)),C.rational(4)));
 assert(C.compare(C.value(C.sqrt(10)),C.parse('3,2'))<0);assert(C.compare(C.value(C.sqrt(2,-1)),C.parse('-1,5'))>0);
 assert.equal(C.compare(C.value(C.sqrt(2,-1)),C.value(C.sqrt(3,-1))),1);
 assert.deepEqual(C.value({kind:'period',whole:0,lead:'1',repeat:'6'}),C.rational(1,6));assert.deepEqual(C.value({kind:'period',whole:0,repeat:'9'}),C.rational(1));
 for(const input of ['', '-', '1,', 'NaN','1/0','1e3'])assert.equal(C.parse(input),null);
 assert.throws(()=>C.rational(1,0));assert.throws(()=>C.value(C.sqrt(-1)));
});
test('every task and worked example has a mathematically correct answer',()=>{
 let n=0;for(const s of C.skills)for(let level=0;level<3;level++)for(let seed=1;seed<=60;seed++){
  const t=C.generate(s.id,{seed,level,variant:seed%12}),a=solution(t);assert(C.validate(t,a).ok,s.id);n++;
  const steps=L.build(t);assert(steps.length>=3);assert(C.validate(t,steps.at(-1).answer).ok,'lesson '+s.id);
  if(t.skill==='root'){const degree=t.degree||2;assert(t.k**degree<t.n&&t.n<(t.k+1)**degree);const first={...a,stage:0,values:[String(t.k**degree),String((t.k+1)**degree)]};assert(C.validate(t,first).ok)}
  if(t.skill==='line')assert.equal(t.min+t.tick*C.number(t.step),C.number(t.target));
  assert(!/undefined|NaN/.test(JSON.stringify(steps)));
 }assert.equal(n,1800);
});
test('diagnoses distinguish equivalent form, wrong value, invalid input, interval inclusion and grouping labels',()=>{
 const t={skill:'fraction',target:C.rational(3,4)};
 assert.match(C.validate(t,{values:['1','3'],sign:1}).message,/ongeveer/);assert(C.validate(t,{values:['6','8'],sign:1}).partial);assert(C.validate(t,{values:['3','0'],sign:1}).input);assert.equal(C.validate(t,{values:['3','5'],sign:1}).code,'value');
 const i=C.generate('interval',{seed:3,variant:3});const a=solution(i);a.closedHi=!i.closedHi;assert.equal(C.validate(i,a).code,'inclusion');
 const g=C.generate('group',{seed:4});const ga=solution(g);ga.groups=ga.groups.map(x=>x==='A'?'B':'A');assert(C.validate(g,ga).ok);
 const p=C.generate('period',{seed:5});const pa=solution(p);pa.end+=p.repeat.length;assert.equal(C.validate(p,pa).code,'period');
});
test('adaptive route unlocks all families and needs varied, delayed evidence for mastery',()=>{
 const p=P.fresh();assert.equal(P.choose(p),'fraction');
 for(let n=0;n<260;n++){
  const id=P.choose(p),s=p.skills[id];if(!s.intro)s.intro=true;
  const t=C.generate(id,{seed:n+1,variant:s.seen,level:s.seen<2?0:s.seen<5?1:2});P.record(p,t,{clean:true,solved:true});
 }
 for(const s of C.skills){assert(P.unlocked(p,s.id));assert(P.mastered(p,s.id),'master '+s.id)}
 const state=P.fresh(),task=C.generate('fraction');P.record(state,task,{clean:true,solved:true});P.record(state,task,{clean:true,solved:true});assert(!P.mastered(state,'fraction'));
 const before=state.xp;assert.equal(P.record(state,task,{clean:false,solved:false}),0);assert.equal(state.xp,before);assert(state.skills.fraction.repair);
 assert.equal(P.record(state,task,{clean:false,solved:true}),5);assert.equal(P.record(state,task,{clean:true,solved:true}),15);
 assert.deepEqual(P.sanitize(JSON.parse(JSON.stringify(state))),state);
});
module.exports={solution};
test('interval endpoints retain their inclusion regardless of construction order',()=>{
 for(let variant=0;variant<4;variant++){
  const t=C.generate('interval',{seed:7,variant}),a=solution(t);
  a.values.reverse();[a.closedLo,a.closedHi]=[a.closedHi,a.closedLo];
  assert(C.validate(t,a).ok,'right-to-left with inclusion attached');
  assert.equal(C.orderInterval(a),true);assert.deepEqual(a,solution(t));
 }
 const a=C.freshAnswer({skill:'interval'});a.values=['4',''];a.closedLo=true;
 assert.equal(C.orderInterval(a),false,'unfinished right endpoint is retained');
 a.values[1]='-2';C.orderInterval(a);assert.deepEqual(a.values,['-2','4']);assert.equal(a.closedHi,true);assert.equal(a.closedLo,false);
});
test('period instructions name the shortest repeating block, including single digits',()=>{
 for(const [input,expected] of [['33','3'],['272727','27'],['0909','09'],['125125','125'],['001001','001']])assert.equal(C.shortestPeriod(input),expected);
 for(let seed=1;seed<100;seed++){
  const t=C.generate('period',{seed,level:1});assert.equal(C.shortestPeriod(t.repeat),t.repeat);
  assert(t.rule.includes('het blok '+t.repeat+' zich'));
  assert.equal(t.digits.slice(t.target.start,t.target.end+1),t.repeat);
 }
});
test('signed square and cube roots use exact values and ordered bounds',()=>{
 assert.deepEqual(C.value(C.sqrt(9,-1)),C.rational(-3));assert.deepEqual(C.value(C.cbrt(-8)),C.rational(-2));assert.deepEqual(C.value(C.cbrt(27)),C.rational(3));
 assert.equal(C.compare(C.value(C.sqrt(2)),C.value(C.cbrt(2))),1);assert.equal(C.compare(C.value(C.cbrt(-2)),C.rational(-1)),-1);assert.equal(C.compare(C.value(C.cbrt(-2)),C.rational(-2)),1);
 const signs=new Set();for(let seed=1;seed<40;seed++)for(let variant=0;variant<3;variant++){
  const t=C.generate('root',{seed,variant,level:1}),a=solution(t);const x=C.number(C.value(t.source));assert(Number(a.values[0])<x&&x<Number(a.values[1]));signs.add(t.degree===3?'cube'+Math.sign(t.n):'square'+t.source.sign);
 }assert.deepEqual([...signs].sort(),['cube-1','cube1','square-1','square1']);assert.throws(()=>C.value(C.sqrt(-9)));
});
test('unbounded intervals include the whole real line and preserve open infinite ends',()=>{
 const seen=new Set();for(let variant=0;variant<12;variant++){
  const t=C.generate('interval',{level:1,variant,seed:9}),a=solution(t);assert(C.validate(t,a).ok);assert(t.sourceText);seen.add(t.lo===null?'-infinity':t.hi===null?'infinity':'bounded');
  if(t.lo===null){assert.equal(t.closedLo,false);assert.equal(C.validate(t,{...a,closedLo:true}).code,'inclusion')}
  if(t.hi===null){assert.equal(t.closedHi,false);assert.equal(C.validate(t,{...a,closedHi:true}).code,'inclusion')}
  a.values.reverse();[a.closedLo,a.closedHi]=[a.closedHi,a.closedLo];assert(C.validate(t,a).ok,'reverse construction');
 }assert.equal(seen.size,3);assert.equal(C.intervalLabel(null,null,false,false),']−∞; +∞[');
});
test('decimal type and nested-set membership depend on value rather than notation',()=>{
 const cases=[[C.fraction(1,8),'finite'],[C.fraction(1,3),'pure'],[C.fraction(1,6),'mixed'],[C.sqrt(16),'finite'],[C.sqrt(9,-1),'finite'],[C.cbrt(-8),'finite'],[C.cbrt(-2),'irr'],[{kind:'pi'},'irr']];
 for(const [e,kind] of cases)assert.equal(C.decimalType(e),kind,C.label(e));
 assert.deepEqual(C.numberSets(C.cbrt(27)),['N','Z','Q','R']);assert.deepEqual(C.numberSets(C.cbrt(-8)),['Z','Q','R']);assert.deepEqual(C.numberSets(C.cbrt(-2)),['irr','R']);
 const t=C.generate('sets'),a=solution(t);assert.equal(new Set(t.target).size,4);const natural=t.target.indexOf('N');a.placements[natural]='R';assert.equal(C.validate(t,a).code,'sets','larger containing set is not the requested smallest');
});
test('old learning states retain XP and answers while newly introduced skills start fresh',()=>{
 const p=P.fresh();delete p.skills.sets;delete p.skills.decimaltype;p.xp=42;p.skills.root.clean=3;
 const restored=P.sanitize(p);assert.equal(restored.xp,42);assert.equal(restored.skills.root.clean,3);assert.equal(restored.skills.sets.seen,0);assert.equal(restored.skills.decimaltype.seen,0);
 const t=C.generate('root',{contentVersion:1,level:1,variant:2});assert.equal(t.source.sign,1);assert.equal(t.degree,undefined);
});
