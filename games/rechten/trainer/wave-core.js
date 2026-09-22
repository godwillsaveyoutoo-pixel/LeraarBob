/* Exact mathematics, controlled tasks and pure step validation for Wave 1. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.RechtenWave=api})(globalThis,()=>{
'use strict';
function q(n,d=1){if(n&&typeof n==='object')return q(n.n,n.d);if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||!d)throw Error('Ongeldige breuk');if(d<0){n=-n;d=-d}let a=Math.abs(n),b=d;while(b)[a,b]=[b,a%b];return {n:n/(a||1)||0,d:d/(a||1)}}
const add=(a,b)=>{a=q(a);b=q(b);return q(a.n*b.d+b.n*a.d,a.d*b.d)},neg=a=>{a=q(a);return q(-a.n,a.d)},sub=(a,b)=>add(a,neg(b)),mul=(a,b)=>{a=q(a);b=q(b);return q(a.n*b.n,a.d*b.d)},div=(a,b)=>{a=q(a);b=q(b);return q(a.n*b.d,a.d*b.n)},eq=(a,b)=>{a=q(a);b=q(b);return a.n===b.n&&a.d===b.d},num=a=>{a=q(a);return a.n/a.d};
// Adapter for the bounded rational pools used by the eleven legacy generators.
function fromNumber(n){if(!Number.isFinite(n))throw Error('Geen eindig getal');for(let d=1;d<=1000;d++)if(Math.abs(n*d-Math.round(n*d))<1e-9)return q(Math.round(n*d),d);throw Error('Geen gecontroleerde rationale waarde')}
function parse(s){s=String(s).replaceAll('−','-');if(!/^-?\d+(?:[.,]\d+|\/-?\d+)?$/.test(s))return null;try{if(s.includes('/'))return q(...s.split('/').map(Number));const p=s.replace(',','.').split('.');return q(Number(p.join('')),10**(p[1]?.length||0))}catch{return null}}
const text=a=>{a=q(a);return String(a.n).replace('-','−')+(a.d===1?'':'/'+a.d)},html=a=>{a=q(a);return a.d===1?text(a):`${a.n<0?'−':''}<span class="frac"><span>${Math.abs(a.n)}</span><span>${a.d}</span></span>`};
function formula(a,b){a=q(a);b=q(b);if(!a.n)return 'y = '+html(b);return 'y = '+(eq(a,1)?'':eq(a,-1)?'−':html(a))+'x'+(b.n?' '+(b.n<0?'−':'+')+' '+html(q(Math.abs(b.n),b.d)):'')}
const catalog={
 slope_from_two_points:{label:'a uit twee punten',requires:['point','delta','slope']},
 line_behavior:{label:'stijgend, dalend of constant',requires:['slope_from_two_points']},
 special_lines:{label:'bijzondere rechten',requires:['line_behavior']},
 intercept_from_point:{label:'b uit a en een punt',requires:['ab']},
 equation_from_point_slope:{label:'voorschrift uit a en punt',requires:['intercept_from_point']},
 equation_from_two_points:{label:'voorschrift uit twee punten',requires:['slope_from_two_points','equation_from_point_slope']}
};
const order=['point','delta','slope','slope_from_two_points','line_behavior','special_lines','intercept','ab','intercept_from_point','equation_from_point_slope','equation_from_two_points','fx','table','zeroRead','zero','sign','signchart'];
const requirements={point:[],delta:['point'],slope:['delta'],intercept:['special_lines'],ab:['intercept','slope'],...Object.fromEntries(Object.entries(catalog).map(([k,v])=>[k,v.requires]))};
function legacyAccess(skills){const s=new Proxy(skills||{},{get:(s,k)=>s[k]||{seen:0,strength:0}}),a=['delta'];if(s.delta.seen>=2&&s.delta.strength>=.22)a.push('slope');if(s.slope.seen>=3&&s.slope.strength>=.30)a.push('point');if(s.point.seen>=2&&s.slope.strength>=.40)a.push('intercept');if(s.intercept.seen>=2&&s.slope.strength>=.44)a.push('ab');if(s.ab.seen>=3&&s.ab.strength>=.38)a.push('fx');if(s.fx.seen>=3&&s.fx.strength>=.36)a.push('table');if(s.table.seen>=3&&s.fx.strength>=.46)a.push('zeroRead');if(s.zeroRead.seen>=3&&s.zeroRead.strength>=.34)a.push('zero');if(s.zero.seen>=3&&s.zero.strength>=.38)a.push('sign');if(s.sign.seen>=3&&s.sign.strength>=.40)a.push('signchart');return a}
function migrate(saved){const s=structuredClone(saved||{});s.access=[...new Set([...(s.access||[]),...(s.version<701?legacyAccess(s.skills):[]),...Object.keys(s.skills||{}).filter(k=>s.skills[k].seen||s.skills[k].intro)])];s.version=701;s.catalogVersion=1;return s}
function ready(s,k){const v=s.skills[k];return v?.intro&&v.seen>=4&&v.strength>=.42&&v.recent?.slice(-4).length===4&&v.recent.slice(-4).filter(Boolean).length>=3&&!s.review.some(r=>r.skill===k&&r.kind==='repair')}
function unlock(s){const access=new Set(s.access||[]);for(const [k,rs] of Object.entries(requirements))if(rs.every(r=>ready(s,r)))access.add(k);for(const k of legacyAccess(s.skills))if(['fx','table','zeroRead','zero','sign','signchart'].includes(k))access.add(k);s.access=[...access];return order.filter(k=>access.has(k))}
function model(A,B){if(eq(A.x,B.x))return eq(A.y,B.y)?{kind:'identical'}:{kind:'vertical',c:q(A.x)};const a=div(sub(B.y,A.y),sub(B.x,A.x));return {kind:'affine',a,b:sub(A.y,mul(a,A.x))}}
function generate(skill,{difficulty=0,variant=0,seed=1}={}){
 if(!catalog[skill])throw Error('Onbekende skill');let v=((variant%12)+12)%12;
 const slopes=difficulty===0?[q(1),q(-1),q(2),q(-2),q(0),q(1),q(-1),q(2),q(-2),q(0),q(1),q(-1)]:[q(1),q(-1),q(1,2),q(-3,2),q(0),q(1,3),q(-2,3),q(2),q(-2),q(0),q(3,2),q(-1,2)];
 let a=slopes[v],b=q(seed%5-2),A,B;
 // Pick coordinates from a finite, exhaustively checked pool, never rejection loops.
 const candidates=[];for(let x=-4;x<=4;x++)for(const direction of [-1,1]){const x2=x+direction*a.d;if(Math.abs(x2)>4)continue;const y=add(mul(a,x),b),y2=add(mul(a,x2),b);if(Math.abs(num(y))<=5&&Math.abs(num(y2))<=5)candidates.push([{x:q(x),y},{x:q(x2),y:y2}])}
 [A,B]=candidates[seed%candidates.length];
 if(skill==='special_lines'){const kind=v%3;if(kind===0){A={x:q(-2),y:b};B={x:q(3),y:b}}if(kind===1){A={x:b,y:q(-2)};B={x:b,y:q(3)}}if(kind===2){A={x:b,y:q(1)};B=structuredClone(A)}}
 if(['slope_from_two_points','equation_from_two_points'].includes(skill)&&difficulty===2&&v>=10){B=v===10?{x:A.x,y:add(A.y,num(A.y)>0?-1:1)}:structuredClone(A)}
 const m=model(A,B);const variantName=m.kind==='affine'?(m.a.n===0?'horizontal':m.a.d!==1?(m.a.n<0?'negative-fraction':'positive-fraction'):(m.a.n<0?'negative':'positive')):m.kind;
 return {A,B,model:m,variant:variantName,representation:skill==='line_behavior'?['graph','slope','points'][difficulty]:skill==='special_lines'&&difficulty===0?'graph':'points',support:difficulty===0?'guided':'independent'};
}
function stages(t){const p=t.params,m=p.model,s=t.skill;if(s==='line_behavior')return ['behavior'];if(s==='special_lines'||m.kind!=='affine')return m.kind==='identical'?['classify']:['classify','property','axis','constant','function'];const slope=['ys','xs','dy','dx','a'];if(s==='slope_from_two_points')return slope;const b=['subY','subX','ax','b'];return [...(s==='equation_from_two_points'?[...slope,'point']:[]),...b,...(s==='intercept_from_point'?[]:['formulaA','formulaB']),...(s==='equation_from_two_points'?['verifyA','verifyB']:['verifyA'])]}
function fresh(t){return {index:0,values:{},tokens:[],entry:['','1'],part:0,errors:[],steps:[],help:false,done:false,history:[]}}
function expected(t,w,stage=stages(t)[w.index]){const p=t.params,m=p.model,A=p[w.values.point||'A'],rev=w.values.ys?.[0]==='A',dy=rev?sub(p.A.y,p.B.y):sub(p.B.y,p.A.y),dx=rev?sub(p.A.x,p.B.x):sub(p.B.x,p.A.x);switch(stage){case 'behavior':return m.a.n>0?'stijgend':m.a.n<0?'dalend':'constant';case 'classify':return m.kind==='identical'?'identiek':m.kind==='vertical'?'verticaal':'horizontaal';case 'property':return m.kind==='vertical'?'dx0':'a0';case 'axis':return m.kind==='vertical'?'x':'y';case 'constant':return m.kind==='vertical'?m.c:m.b;case 'function':return m.kind==='affine'?'functie':'geen functie';case 'dy':return dy;case 'dx':return dx;case 'a':case 'formulaA':return m.a;case 'subY':return A.y;case 'subX':return A.x;case 'ax':return mul(m.a,A.x);case 'b':case 'formulaB':return m.b;case 'verifyA':return p.A.y;case 'verifyB':return p.B.y}}
function check(t,w,value){const stage=stages(t)[w.index],want=expected(t,w);let ok=false,code=stage,message='';
 if(stage==='ys'||stage==='xs'){ok=Array.isArray(value)&&value.length===2&&new Set(value).size===2&&value.every(k=>k==='A'||k==='B');if(stage==='xs'&&ok){ok=value.join()===w.values.ys.join();code='direction';message=`Δy: ${w.values.ys[1]}→${w.values.ys[0]}; Δx: ${value[1]}→${value[0]}. Gebruik dezelfde richting.`}else message='Kies de twee verschillende punten voor de aftrekking.'}
 else if(stage==='point')ok=value==='A'||value==='B';
 else if(stage==='subY'||stage==='subX'){ok=value===(stage==='subY'?'y':'x');message='In y = ax + b staat y links en x bij a.'}
 else if(want&&typeof want==='object'){ok=!!value&&typeof value==='object'&&eq(value,want);message=stage==='b'?`b = y − ax. Met jouw b wordt y = ${text(add(mul(t.params.model.a,t.params[w.values.point||'A'].x),value||q(0)))}; vereist: ${text(t.params[w.values.point||'A'].y)}.`:stage==='dx'||stage==='dy'?'Trek de gekozen coördinaten in de getoonde richting af.':stage.startsWith('verify')?'Vul de oorspronkelijke x in je formule in en vergelijk met de oorspronkelijke y.':stage==='a'?'Deel Δy door Δx, met beide tekens.':stage==='ax'?'Vermenigvuldig a met de x-coördinaat.':'Gebruik de berekende coëfficiënt op de juiste plaats.'}
 else {ok=value===want;message=stage==='behavior'?'Kijk wat y doet als x toeneemt.':stage==='classify'?'Gelijke y: horizontaal. Gelijke x: verticaal, behalve als beide punten identiek zijn.':stage==='property'?'Horizontaal heeft a = 0; verticaal heeft Δx = 0 en geen hellingsgetal.':stage==='function'?'Een functie heeft bij elke x precies één y.':'Verticaal houdt x vast; horizontaal houdt y vast.'}
 return {ok,code:'wave.'+code,message};
}
function submit(t,w,value){if(w.done)return {ok:false,code:'done'};const stage=stages(t)[w.index],r=check(t,w,value);w.steps.push({stage,value,ok:r.ok,code:r.ok?null:r.code});w.steps=w.steps.slice(-32);if(!r.ok){if(!w.errors.includes(r.code))w.errors.push(r.code);return r}w.history.push({index:w.index,values:structuredClone(w.values)});w.values[stage]=value;w.index++;w.tokens=[];w.entry=['','1'];w.part=0;w.done=w.index===stages(t).length;return r}
function undo(w){const prev=w.history.pop();if(prev){w.index=prev.index;w.values=prev.values;w.done=false;w.tokens=[];w.entry=['','1'];w.part=0}}
function signature(t){return JSON.stringify([t.skill,t.difficulty,t.params])}
const required={slope_from_two_points:['positive','negative','positive-fraction','negative-fraction','horizontal','vertical','identical'],line_behavior:['positive','negative','horizontal'],special_lines:['horizontal','vertical','identical'],intercept_from_point:['positive','negative','negative-fraction','horizontal'],equation_from_point_slope:['positive','negative','negative-fraction','horizontal'],equation_from_two_points:['positive','negative','negative-fraction','horizontal','vertical','identical']};
function evidence(st,t,total,clean){if(!clean)return;st.coverage||={};st.coverage[t.params.variant]=true;st.independent||=[];if(!st.independent.some(e=>e.signature===signature(t)))st.independent.push({at:total,signature:signature(t)});st.independent=st.independent.slice(-16)}
function mastered(st,skill){const e=st.independent||[];return required[skill].every(v=>st.coverage?.[v])&&e.some((a,i)=>e.slice(i+1).some(b=>b.at-a.at>=3))}
return {q,fromNumber,add,sub,mul,div,eq,num,parse,text,html,formula,catalog,order,requirements,legacyAccess,migrate,unlock,model,generate,stages,fresh,expected,check,submit,undo,signature,evidence,mastered};
});
