const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../games/bewerkingen-trainer/core.js'),P=require('../shared/multiplayer/bewerkingen-class-policy.cjs');
const same=(a,b)=>assert.equal(C.signature(C.parse(a).value),C.signature(C.parse(b).value),a+' = '+b);
test('the supplied powers, scientific notation and roots have exact expected results',()=>{
 for(const [a,b]of [
 ['(x^5)^3','x^15'],['x^4*x^(-6)','1/x^2'],['x^9/x^3','x^6'],['(-3x^4)^2','9x^8'],['(3x/5)^(-2)','25/(9x^2)'],['4x^8/(-2x^2)','-2x^6'],['x^(-4)/x^(-6)','x^2'],['(3x^2y)^3','27x^6y^3'],['x*x^5/x^4','x^2'],['-4x^4*3x^3','-12x^7'],
 ['170000000','1.7*10^8'],['0.00000082','8.2*10^(-7)'],['400000','4*10^5'],['0.000214','2.14*10^(-4)'],['0.499','4.99*10^(-1)'],['1084500000','1.0845*10^9'],['0.0000000000000332','3.32*10^(-14)'],['430000000000000','4.3*10^14'],
 ['sqrt(4*36)','12'],['sqrt(16/25)','4/5'],['sqrt(3)*sqrt(12)','6'],['sqrt(28)/sqrt(7)','2'],['sqrt(9*81)','27'],['sqrt(100/121)','10/11'],['sqrt(10)*sqrt(40)','20'],['sqrt(98)/sqrt(2)','7'],['sqrt(32)*sqrt(2)','8'],['sqrt(30)/sqrt(15)','sqrt(2)'],
 ['sqrt(36^2)','36'],['(sqrt(3))^2','3'],['sqrt(16^3)','64'],['sqrt(4^10)','1024'],['sqrt(9^4)','81'],['sqrt(6^3)','6sqrt(6)'],
 ['sqrt(a^7)','a^3sqrt(a)'],['sqrt(a^8b^6)','a^4b^3'],['sqrt(9a^3)','3a*sqrt(a)'],['sqrt(b)*sqrt(b^4)*sqrt(b^3)','b^4'],['sqrt(121a^3b^7c^2)','11ab^3c*sqrt(ab)'],['sqrt(16a^5)','4a^2sqrt(a)'],
 ['sqrt(27)','3sqrt(3)'],['sqrt(45)','3sqrt(5)'],['sqrt(24)','2sqrt(6)'],['sqrt(175)','5sqrt(7)'],['sqrt(294)','7sqrt(6)'],['sqrt(80)','4sqrt(5)'],
 ['9sqrt(5)-3sqrt(5)+5sqrt(5)+sqrt(5)','12sqrt(5)'],['3sqrt(3)-sqrt(12)-sqrt(3)','0'],['3sqrt(14)-4sqrt(7)+2sqrt(14)+3sqrt(7)','5sqrt(14)-sqrt(7)'],['sqrt(75)+sqrt(50)-3sqrt(18)+sqrt(48)','9sqrt(3)-4sqrt(2)']])same(a,b);
});
// An independent JS evaluation is used only for trusted generator strings.
function numeric(expression,values){const code=expression.replace(/(\d|\))(?=[abcxy(]|sqrt)/g,'$1*').replace(/\^/g,'**').replace(/sqrt/g,'Math.sqrt');return Function('a','b','c','x','y','return '+code)(...values);}
function polynomial(poly,values){let sum=0;for(const[key,c]of poly){const[r,e]=key.split(':');sum+=Number(c.n)/Number(c.d)*Math.sqrt(Number(r))*e.split(',').reduce((v,k,i)=>v*values[i]**(Number(k)/2),1);}return sum;}
test('4800 deterministic generated questions agree with independent arithmetic and trusted grading',()=>{
 for(const s of C.SKILLS)for(let level=0;level<3;level++)for(let seed=0;seed<100;seed++){
 const t=C.generate(s.id,seed,level,seed%4),spec={skill:s.id,seed,level,variant:seed%4};assert.deepEqual(t,C.generate(s.id,seed,level,seed%4));assert(P.grade(spec,{value:t.answer}),t.answer);assert(!P.grade(spec,{value:'1234567',correct:true}));
 for(const values of [[2,3,5,7,11],[3,2,7,5,13]]){const expected=numeric(t.expression,values),answer=polynomial(C.parse(t.answer).value,values);assert(Math.abs(expected-answer)<=Math.max(1e-12,Math.abs(expected)*1e-12),t.expression+' → '+t.answer);}
 }
});
test('input accepts equivalent reduced notation and rejects unfinished or unsafe answers',()=>{
 const t={skill:'root-simplify',answer:'4sqrt(5)',hint:'Haal kwadraatfactoren buiten de wortel.'};
 for(const v of ['4√5','4*sqrt(5)','4 · √(5)'])assert(C.check(t,v).ok,v);
 for(const v of ['sqrt(80)','2sqrt(20)','sqrt(5)+3sqrt(5)','4.000001sqrt(5)','alert(1)','1/0','sqrt(-1)','x^999','sqrt()',''])assert(!C.check(t,v).ok,v);
 assert(C.check({skill:'power-power',answer:'x^15'},'x¹⁵').ok);
 assert(C.check({skill:'scientific',answer:'1.7*10^8'},'1,7 · 10^8').ok);
 assert(!C.check({skill:'scientific',answer:'1.7*10^8'},'17*10^7').ok);
 assert(!P.grade({skill:'missing',seed:0,level:1,variant:0},{value:'0'}));
 assert(!P.grade({skill:'root-simplify',seed:-1,level:1,variant:0},{value:'0'}));
});

test('square-factor decomposition accepts all valid two-factor answers from the reference',()=>{
 for(const [value,answer]of [[12,'3*2^2'],[63,'7*3^2'],[48,'3*4^2'],[72,'2*6^2'],[500,'5*10^2'],[275,'11*5^2'],[80,'5*4^2'],[128,'2*8^2']]){
 const t={skill:'square-factor',answer:String(value),hint:'Zoek een kwadraatfactor.'};assert(C.check(t,answer).ok,answer);assert(C.check(t,answer.split('*').reverse().join('*')).ok);const square=C.parse(answer).args[1];assert(C.check(t,answer.split('*')[0]+'*'+C.plain(square.value)).ok);
 assert(!C.check(t,String(value)).ok,'a bare value is not a product');
 }
 const t={skill:'square-factor',answer:'48',hint:'Zoek een kwadraatfactor.'};
 for(const input of ['4*12','12*4','16*3','3*16','2² · 12','(4)*(12)','1*48'])assert(C.check(t,input).ok,input);
 for(const input of ['6*8','2*24','2*2*12','4*(6+6)','(-4)*(-12)','48/1','4*13','sqrt(16)*12','x*48/x','NaN',''])assert(!C.check(t,input).ok,input);
});
