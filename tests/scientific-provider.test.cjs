const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const C=require('../games/bewerkingen-trainer/core.js'),S=require('../games/bewerkingen-trainer/smart-answer.js');

test('scientific version 1 reproduces all 3600 frozen historical task specifications',()=>{
 const rows=[];
 for(let seed=0;seed<300;seed++)for(let level=0;level<3;level++)for(let variant=0;variant<4;variant++){
  const t=C.generate('scientific',seed,level,variant);rows.push(t);
  assert.deepEqual(C.generate(t.skill,t.seed,t.level,t.variant,1),t);
  assert(!Object.hasOwn(t,'generatorVersion'));
 }
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex'),'946c6128e46ffcaa3cb9aa4a6f8e1b60cbb5ffc5f46de09a22d155d448ad9aeb');
});

// Independent integer decimal arithmetic, without the application's parser.
function decimalFraction(text){const [whole,fraction='']=text.split('.');return [BigInt(whole+fraction),10n**BigInt(fraction.length)];}
function scientificFraction(text){const m=text.match(/^([\d.]+)\*10\^\((-?\d+)\)$/);assert(m,text);let [n,d]=decimalFraction(m[1]);const exponent=Number(m[2]);if(exponent>=0)n*=10n**BigInt(exponent);else d*=10n**BigInt(-exponent);return [n,d];}

test('3600 new tasks use three distinct progressions and exact touch answers',()=>{
 const ranges=[new Set(),new Set(),new Set()],signs=[new Set(),new Set(),new Set()];
 for(let seed=0;seed<300;seed++)for(let level=0;level<3;level++)for(let variant=0;variant<4;variant++){
  const t=C.generate('scientific',seed,level,variant,2);
  assert.deepEqual(C.generate(t.skill,t.seed,t.level,t.variant,t.generatorVersion),t);
  assert.equal(t.skill,'scientific');assert.equal(t.generatorVersion,2);assert.equal(t.id,`scientific:${seed}:${level}:${variant}:v2`);
  const [n,d]=decimalFraction(t.expression),[a,b]=scientificFraction(t.answer);assert.equal(n*b,a*d,t.expression+' = '+t.answer);
  const match=t.answer.match(/^([\d.]+)\*10\^\((-?\d+)\)$/),mantissa=match[1],exp=Number(match[2]),digits=mantissa.replace('.','').length;
  assert(Number(mantissa)>=1&&Number(mantissa)<10);ranges[level].add(exp);signs[level].add(Math.sign(exp));
  if(level===0){assert.equal(digits,1);assert(exp>=2&&exp<=6);assert(!t.expression.includes('.'));}
  if(level===1){assert(digits===2||digits===3);assert(exp>=-6&&exp<=7&&exp!==0);}
  if(level===2){assert(digits===4||digits===5);assert(mantissa.slice(2).includes('0'));assert(Math.abs(exp)>=7&&Math.abs(exp)<=20);}
  assert(C.check(t,t.answer).ok);assert(C.check(t,t.answer.replace('.',',').replace('*',' · ')).ok);
  const model=S.model(t),values=Object.fromEntries(model.slots.map(s=>{assert(s.options.includes(s.value),s.label+' '+s.value);return [s.id,s.value]}));
  assert(C.check(t,model.expression(values)).ok,'the answer is reachable using the existing touch controls');
  assert(!C.check(t,`${Number(mantissa)*10}*10^(${exp-1})`).ok,'equivalent value still needs a normalized mantissa');
  assert(!C.check(t,`${mantissa}*10^(${-exp})`).ok,'an incorrect exponent sign is rejected');
 }
 assert.deepEqual([...signs[0]],[1]);assert.deepEqual([...signs[1]].sort(),[-1,1]);assert.deepEqual([...signs[2]].sort(),[-1,1]);
 assert(ranges[2].has(-20)&&ranges[2].has(20));
});

test('version 2 does not change the other fifteen provider skills or their identities',()=>{
 for(const skill of C.SKILLS.filter(s=>s.id!=='scientific'))for(let level=0;level<3;level++)for(let seed=0;seed<25;seed++){
  assert.deepEqual(C.generate(skill.id,seed,level,seed%4,2),C.generate(skill.id,seed,level,seed%4));
 }
 assert.equal(C.SKILLS.length,16);assert.equal(C.SKILLS.filter(s=>s.id==='scientific').length,1);
});

test('unknown generator versions fail instead of silently creating a different question',()=>{
 for(const version of [0,3,-1,'2',NaN,null])assert.throws(()=>C.generate('scientific',1,1,0,version),/Ongeldige opgave/);
 assert.equal(C.SCIENTIFIC_VERSION,2);assert.equal(C.SCIENTIFIC_LEVELS.length,3);
});
