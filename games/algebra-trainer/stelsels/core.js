/* Exact linear systems. The single-equation trainer supplies rational arithmetic. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../core.js'));else root.StelselsCore=factory(root.AlgebraCore)})(globalThis,C=>{
'use strict';
const {R,Rat}=C;
const expr=(x=0,y=0,c=0)=>({x:R(x),y:R(y),c:R(c)});
const copy=e=>expr(e.x,e.y,e.c), equation=(l,r)=>({l:copy(l),r:copy(r)});
const clone=s=>s.map(e=>equation(e.l,e.r));
const add=(a,b)=>expr(a.x.add(b.x),a.y.add(b.y),a.c.add(b.c));
const scale=(a,k)=>expr(a.x.mul(k),a.y.mul(k),a.c.mul(k));
const sub=(a,b)=>add(a,scale(b,R(-1)));
const reduced=e=>sub(e.l,e.r);
function parse(s){s=String(s).trim().replace(',','.');if(!/^[+-]?(?:\d{1,6}(?:\.\d{1,4})?|\d{1,6}\s*\/\s*[+-]?\d{1,6})$/.test(s))throw Error('Gebruik een getal, bijvoorbeeld −2, 0,5 of 1/2.');if(s.includes('/')){const [n,d]=s.split('/').map(Number);return R(n,d)}const n=Number(s),d=s.includes('.')?10**s.split('.')[1].length:1;return R(Math.round(n*d),d)}
const text=q=>q.d===1?String(q.n):`${q.n}/${q.d}`;
function format(e,tex=false){let out='';for(const k of ['x','y','c']){const q=e[k];if(q.isZero())continue;const a=q.abs();let term=k==='c'||!a.isOne()?(tex?C.ratLatex(a,{}):text(a)):'';if(k!=='c')term+=k;out+=(out?(q.n<0?' − ':' + '):(q.n<0?'−':''))+term}return out||'0'}
const eqText=(e,tex=false)=>format(e.l,tex)+' = '+format(e.r,tex);
const systemTex=(s,raw)=>'\\left\\{\\begin{aligned}'+s.map((e,i)=>raw&&raw.row===i?raw.tex:eqText(e,true)).join('\\\\')+'\\end{aligned}\\right.';
function solution(s){const [a,b]=s.map(reduced),det=a.x.mul(b.y).sub(b.x.mul(a.y));if(det.isZero()){const impossible=[a,b].some(e=>e.x.isZero()&&e.y.isZero()&&!e.c.isZero());const inconsistent=!a.x.mul(b.c).eq(b.x.mul(a.c))||!a.y.mul(b.c).eq(b.y.mul(a.c));return {kind:impossible||inconsistent?'none':'infinite'}}return {kind:'unique',x:a.y.mul(b.c).sub(b.y.mul(a.c)).div(det),y:a.c.mul(b.x).sub(b.c.mul(a.x)).div(det)}}
function bounded(s){for(const e of s)for(const side of [e.l,e.r])for(const q of Object.values(side))if(Math.abs(q.n)>1e7||q.d>1e6)throw Error('Deze getallen worden te groot. Maak eerst eenvoudiger of doe een stap terug.');return s}
function operate(s,row,op,value,term='c'){if(![0,1].includes(row)||!['x','y','c'].includes(term))throw Error('Kies een vergelijking.');value=R(value);const out=clone(s),e=out[row];if(['+','-'].includes(op)){const v=expr();v[term]=op==='-'?value.neg():value;e.l=add(e.l,v);e.r=add(e.r,v)}else{if(value.isZero())throw Error('Vermenigvuldigen of delen door nul behoudt het stelsel niet.');if(!['*','/'].includes(op)||term!=='c')throw Error('Vermenigvuldig of deel door een getal.');const factor=op==='/'?R(1).div(value):value;e.l=scale(e.l,factor);e.r=scale(e.r,factor)}return bounded(out)}
function isolated(e){for(const [l,r] of [[e.l,e.r],[e.r,e.l]])for(const v of ['x','y'])if(l[v].isOne()&&l[v==='x'?'y':'x'].isZero()&&l.c.isZero()&&r[v].isZero())return {variable:v,value:copy(r)};return null}
function substitute(s,source){const found=isolated(s[source]);if(!found)throw Error('Maak eerst x of y vrij in de gekozen vergelijking.');const row=1-source,v=found.variable,out=clone(s),target=out[row];if(target.l[v].isZero()&&target.r[v].isZero())throw Error('Die onbekende staat niet meer in de andere vergelijking.');const replace=e=>{const base=copy(e),coef=base[v];base[v]=R(0);return add(base,scale(found.value,coef))};const rawSide=(e,tex)=>{const base=copy(e),coef=base[v];base[v]=R(0);if(coef.isZero())return format(base,tex);const magnitude=coef.abs();const factor=magnitude.isOne()?'':(tex?C.ratLatex(magnitude,{}):text(magnitude))+(tex?'\\cdot ':' × ');const term=(coef.n<0?'−':'')+factor+(tex?'\\bigl(':'(')+format(found.value,tex)+(tex?'\\bigr)':')');const tail=format(base,tex);return term+(tail==='0'?'':tail.startsWith('−')?' − '+tail.slice(1):' + '+tail)};const raw={row,tex:rawSide(target.l,true)+' = '+rawSide(target.r,true),text:rawSide(target.l,false)+' = '+rawSide(target.r,false)};target.l=replace(target.l);target.r=replace(target.r);return {system:bounded(out),raw,variable:v}}
function combine(s,f1,f2,op,target){if(![0,1].includes(target)||!['+','-'].includes(op))throw Error('Kies de te vervangen vergelijking.');f1=R(f1);f2=R(f2);if(f1.isZero()||f2.isZero())throw Error('Beide factoren moeten verschillen van nul.');const out=clone(s),sign=op==='-'?R(-1):R(1);out[target]=equation(add(scale(s[0].l,f1),scale(s[1].l,f2.mul(sign))),add(scale(s[0].r,f1),scale(s[1].r,f2.mul(sign))));return bounded(out)}
function solved(s){const values=s.map(isolated);return values.every(Boolean)&&new Set(values.map(v=>v.variable)).size===2&&values.every(v=>v.value.x.isZero()&&v.value.y.isZero())}
function containsPoint(e,x,y){const r=reduced(e);return r.x.mul(x).add(r.y.mul(y)).add(r.c).isZero()}
function generate(seed,level='beginner',kind='unique'){
 if(!['beginner','basis','advanced'].includes(level)||!['unique','none','infinite'].includes(kind))throw Error('Onbekend oefentype.');let z=seed>>>0;const rnd=()=>{z+=0x6D2B79F5;let t=z;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296};const pick=a=>a[Math.floor(rnd()*a.length)];
 const x=R(pick([-4,-3,-2,-1,1,2,3,4]),level==='advanced'?2:1),y=R(pick([-4,-3,-2,-1,1,2,3,4]),level==='advanced'?2:1);
 let a,b,c,d;if(level==='beginner'){a=R(1);b=R(pick([-2,-1,1,2]));c=R(1);d=R(pick([-3,-2,-1,1,2,3].filter(n=>n!==b.n)))}else{do{a=R(pick([-4,-3,-2,2,3,4]));b=R(pick([-4,-3,-2,2,3,4]));c=R(pick([-4,-3,-2,2,3,4]));d=R(pick([-4,-3,-2,2,3,4]))}while(a.mul(d).eq(b.mul(c)))}
 let s=[equation(expr(a,b),expr(0,0,a.mul(x).add(b.mul(y)))),equation(expr(c,d),expr(0,0,c.mul(x).add(d.mul(y))))];
 if(kind!=='unique'){const f=R(pick([2,3,-2]));s[1]=equation(scale(s[0].l,f),scale(s[0].r,f));if(kind==='none')s[1].r.c=s[1].r.c.add(R(pick([1,2,3])))}
 if(level==='advanced'){s=operate(s,0,'+',R(pick([1,2])),'y');s=operate(s,1,'-',R(pick([1,2])),'x')}
 return {id:`${seed>>>0}-${level}-${kind}`,seed:seed>>>0,level,kind,start:s,solution:solution(s)};
}
function canonical(ex,method='substitution'){
 let s=clone(ex.start);const steps=[{system:clone(s),label:'Start'}];const push=(label,raw)=>steps.push({system:clone(s),label,...(raw?{raw}:{})});
 const op=(row,o,q,term='c')=>{s=operate(s,row,o,q,term);push(`Vergelijking ${row+1}: ${o==='*'?'×':o==='/'?'÷':o==='-'?'−':'+'} ${(q.n<0?'('+text(q)+')':text(q))}${term==='c'?'':term} aan beide leden`)};
 const normalize=row=>{const e=s[row];if(!e.r.x.isZero())op(row,'-',e.r.x,'x');if(!s[row].r.y.isZero())op(row,'-',s[row].r.y,'y');if(!s[row].l.c.isZero())op(row,'-',s[row].l.c)};
 if(method==='combination'){
  normalize(0);normalize(1);const a=s[0].l.x,b=s[1].l.x;s=combine(s,b,a,'-',1);push(`Vervang II door (${text(b)}) × I − (${text(a)}) × II`);
 }else{
  normalize(0);const y=s[0].l.y;if(!y.isZero())op(0,'-',y,'y');if(!s[0].l.x.isOne())op(0,'/',s[0].l.x);const r=substitute(s,0);s=r.system;push('Vul x in vergelijking II in',r.raw);push('Werk de haakjes uit en neem samen');
 }
 normalize(1);const e=s[1],v=e.l.x.isZero()?'y':'x',k=e.l[v];if(k.isZero()){push(ex.solution.kind==='none'?'Onmogelijke gelijkheid: geen oplossing.':'Identiteit: oneindig veel oplossingen.');return steps}
 if(!k.isOne())op(1,'/',k);const r=substitute(s,1);s=r.system;push(`Vul ${r.variable} in vergelijking I in`,r.raw);push('Werk de haakjes uit en neem samen');normalize(0);const w=v==='x'?'y':'x';if(!s[0].l[w].isOne())op(0,'/',s[0].l[w]);return steps;
}
function graphPoints(e){const points=[];for(let x=-8;x<=8;x++){const r=reduced(e);if(!r.y.isZero()){const y=r.x.mul(R(x)).add(r.c).neg().div(r.y);if(Math.abs(y.value())<=8)points.push({x:R(x),y})}}if(!points.length){const r=reduced(e);if(!r.x.isZero()){const x=r.c.neg().div(r.x);points.push({x,y:R(-3)},{x,y:R(3)})}}return [points[0],points.at(-1)]}
function revive(s){return JSON.parse(s,(k,v)=>v&&typeof v==='object'&&Object.keys(v).length===2&&Number.isSafeInteger(v.n)&&Number.isSafeInteger(v.d)?R(v.n,v.d):v)}
return {R,Rat,expr,equation,clone,add,scale,sub,reduced,parse,text,format,eqText,systemTex,solution,operate,isolated,substitute,combine,solved,containsPoint,generate,canonical,graphPoints,revive};
});
