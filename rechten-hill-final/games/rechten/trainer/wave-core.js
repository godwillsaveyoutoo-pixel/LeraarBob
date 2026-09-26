/* Exact mathematics, controlled tasks and pure step validation for Waves 1–4. */
(function(root,factory){const api=factory();if(typeof module==='object'){require('./transfer-core.js')(api);module.exports=api}else{root.RechtenTransferInstall(api);root.RechtenWave=api}})(globalThis,()=>{
'use strict';
function q(n,d=1){if(n&&typeof n==='object')return q(n.n,n.d);if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||!d)throw Error('Ongeldige breuk');if(d<0){n=-n;d=-d}let a=Math.abs(n),b=d;while(b)[a,b]=[b,a%b];return {n:n/(a||1)||0,d:d/(a||1)}}
const add=(a,b)=>{a=q(a);b=q(b);return q(a.n*b.d+b.n*a.d,a.d*b.d)},neg=a=>{a=q(a);return q(-a.n,a.d)},sub=(a,b)=>add(a,neg(b)),mul=(a,b)=>{a=q(a);b=q(b);return q(a.n*b.n,a.d*b.d)},div=(a,b)=>{a=q(a);b=q(b);return q(a.n*b.d,a.d*b.n)},eq=(a,b)=>{a=q(a);b=q(b);return a.n===b.n&&a.d===b.d},num=a=>{a=q(a);return a.n/a.d};
// Adapter for the bounded rational pools used by the eleven legacy generators.
function fromNumber(n){if(!Number.isFinite(n))throw Error('Geen eindig getal');for(let d=1;d<=1000;d++)if(Math.abs(n*d-Math.round(n*d))<1e-9)return q(Math.round(n*d),d);throw Error('Geen gecontroleerde rationale waarde')}
function parse(s){s=String(s).replaceAll('−','-');if(!/^-?\d+(?:[.,]\d+|\/-?\d+)?$/.test(s))return null;try{if(s.includes('/'))return q(...s.split('/').map(Number));const p=s.replace(',','.').split('.');return q(Number(p.join('')),10**(p[1]?.length||0))}catch{return null}}
const text=a=>{a=q(a);return String(a.n).replace('-','−')+(a.d===1?'':'/'+a.d)},html=a=>{a=q(a);return a.d===1?text(a):`${a.n<0?'−':''}<span class="frac"><span>${Math.abs(a.n)}</span><span>${a.d}</span></span>`};
function formula(a,b){a=q(a);b=q(b);if(!a.n)return 'y = '+html(b);return 'y = '+(eq(a,1)?'':eq(a,-1)?'−':html(a))+'x'+(b.n?' '+(b.n<0?'−':'+')+' '+html(q(Math.abs(b.n),b.d)):'')}
const catalog={
 rewrite_linear_equation:{label:'vergelijking herleiden',requires:['ab']},
 input_from_output:{label:'x uit een functiewaarde',requires:['fx','rewrite_linear_equation']},
 point_on_line:{label:'punt op de rechte controleren',requires:['fx','point']},
 point_plot:{label:'punt op het rooster plaatsen',requires:['point']},
 equation_from_ab:{label:'voorschrift uit a en b',requires:['ab','signchart']},
 graph_from_equation:{label:'rechte uit voorschrift tekenen',requires:['point_plot','slope','intercept','ab']},
 slope_from_two_points:{label:'a uit twee punten',requires:['point','delta','slope']},
 line_behavior:{label:'stijgend, dalend of constant',requires:['slope_from_two_points']},
 special_lines:{label:'bijzondere rechten',requires:['line_behavior']},
 intercept_from_point:{label:'b uit a en een punt',requires:['equation_from_ab']},
 equation_from_point_slope:{label:'voorschrift uit a en punt',requires:['intercept_from_point']},
 equation_from_two_points:{label:'voorschrift uit twee punten',requires:['slope_from_two_points','equation_from_point_slope']}
};
const order=['point','point_plot','delta','slope','slope_from_two_points','line_behavior','special_lines','intercept','ab','fx','table','graph_from_equation','rewrite_linear_equation','input_from_output','point_on_line','zeroRead','zero','sign','signchart','equation_from_ab','intercept_from_point','equation_from_point_slope','equation_from_two_points'];
const requirements={point:[],delta:['point_plot'],slope:['delta'],intercept:['special_lines'],ab:['intercept','slope'],...Object.fromEntries(Object.entries(catalog).map(([k,v])=>[k,v.requires]))};
function legacyAccess(skills){const s=new Proxy(skills||{},{get:(s,k)=>s[k]||{seen:0,strength:0}}),a=['delta'];if(s.delta.seen>=2&&s.delta.strength>=.22)a.push('slope');if(s.slope.seen>=3&&s.slope.strength>=.30)a.push('point');if(s.point.seen>=2&&s.slope.strength>=.40)a.push('intercept');if(s.intercept.seen>=2&&s.slope.strength>=.44)a.push('ab');if(s.ab.seen>=3&&s.ab.strength>=.38)a.push('fx');if(s.fx.seen>=3&&s.fx.strength>=.36)a.push('table');if(s.table.seen>=3&&s.fx.strength>=.46)a.push('zeroRead');if(s.zeroRead.seen>=3&&s.zeroRead.strength>=.34)a.push('zero');if(s.zero.seen>=3&&s.zero.strength>=.38)a.push('sign');if(s.sign.seen>=3&&s.sign.strength>=.40)a.push('signchart');return a}
function migrate(saved){
 const s=structuredClone(saved||{});
 s.access=[...new Set([...(s.access||[]),...(s.version<701?legacyAccess(s.skills):[]),...Object.keys(s.skills||{}).filter(k=>s.skills[k]?.seen||s.skills[k]?.intro)])];
 if(s.version===701){
  const oldRequirements={point:[],delta:['point'],slope:['delta'],slope_from_two_points:['point','delta','slope'],line_behavior:['slope_from_two_points'],special_lines:['line_behavior'],intercept:['special_lines'],ab:['intercept','slope'],intercept_from_point:['ab'],equation_from_point_slope:['intercept_from_point'],equation_from_two_points:['slope_from_two_points','equation_from_point_slope']};
  for(const [k,rs] of Object.entries(oldRequirements))if(rs.every(r=>ready({...s,skills:s.skills||{},review:s.review||[]},r)))s.access.push(k);
  s.access=[...new Set([...s.access,...legacyAccess(s.skills).filter(k=>['fx','table','zeroRead','zero','sign','signchart'].includes(k))])];
 }
 for(const [k,v] of Object.entries(s.skills||{}))if(catalog[k]&&Array.isArray(v.independent))v.independent=v.independent.map(e=>typeof e.signature==='string'?{...e,signature:compactSignature(e.signature)}:e);
 s.version=704;s.catalogVersion=4;
 return s;
}
function ready(s,k){const v=s.skills[k];return v?.intro&&v.seen>=4&&v.strength>=.42&&v.recent?.slice(-4).length===4&&v.recent.slice(-4).filter(Boolean).length>=3&&!s.review.some(r=>r.skill===k&&r.kind==='repair')}
function unlock(s){const access=new Set(s.access||[]);for(const [k,rs] of Object.entries(requirements))if(rs.every(r=>ready(s,r)))access.add(k);for(const k of legacyAccess(s.skills))if(['fx','table','zeroRead','zero','sign','signchart'].includes(k))access.add(k);s.access=[...access];return order.filter(k=>access.has(k))}
function model(A,B){if(eq(A.x,B.x))return eq(A.y,B.y)?{kind:'identical'}:{kind:'vertical',c:q(A.x)};const a=div(sub(B.y,A.y),sub(B.x,A.x));return {kind:'affine',a,b:sub(A.y,mul(a,A.x))}}
// Construction tasks use grid ticks for interaction and exact coordinates for assessment.
const constructionSkills=['point_plot','equation_from_ab','graph_from_equation'];
function constructionGenerate(skill,{difficulty=0,variant=0,seed=1}={}){
 const v=((variant%12)+12)%12;
 if(skill==='point_plot'){
  const scales=difficulty===2?[q(1),q(2),q(1,2)]:[q(1)];
  const scaleX=scales[v%scales.length],scaleY=scales[(v+1)%scales.length];
  const ticks=difficulty===0?[[1,2],[2,4],[3,1],[4,3]]:[[-3,2],[2,-3],[-2,-4],[4,1],[0,3],[-3,0],[0,0],[1,-4]];
  const [x,y]=ticks[(v+seed)%ticks.length],target={x:mul(x,scaleX),y:mul(y,scaleY)};
  return {target,scaleX,scaleY,variant:difficulty===2?'scale':!x||!y?'axis':x<0||y<0?'signed':'positive',representation:'grid',support:difficulty===0?'guided':'independent'};
 }
 const slopes=difficulty===0?[q(1),q(2),q(1),q(2)]:difficulty===1?[q(1),q(-1),q(2),q(-2),q(0)]:[q(1,2),q(-3,2),q(1,3),q(-2,3),q(0),q(-1),q(1),q(2)];
 const a=slopes[v%slopes.length],b=q(difficulty===0?seed%3:(seed%5)-2);
 const m={kind:'affine',a,b};
 const variantName=!a.n?'horizontal':a.d!==1?(a.n<0?'negative-fraction':'positive-fraction'):a.n<0?'negative':'positive';
 return {model:m,scaleX:q(1),scaleY:q(1),variant:variantName,representation:skill==='equation_from_ab'?'coefficients':'equation',support:difficulty===0?'guided':'independent'};
}
function gridPoint(t,tick){return {x:mul(tick.x,t.params.scaleX),y:mul(tick.y,t.params.scaleY)}}
function onLine(p,m){return eq(p.y,add(mul(m.a,p.x),m.b))}
function validPoint(p){try{return p&&Number.isFinite(num(p.x))&&Number.isFinite(num(p.y))}catch{return false}}
function constructionCheck(t,value){
 const fail=(code,message,extra={})=>({ok:false,code:'wave.'+code,message,...extra});
 const ok={ok:true,code:null,message:'Goed gecontroleerd.'};
 if(t.skill==='point_plot'){
  if(!validPoint(value))return fail('point.missing','Kies eerst een punt op het rooster.');
  const x=eq(value.x,t.params.target.x),y=eq(value.y,t.params.target.y);
  if(x&&y)return ok;
  const swapped=eq(value.x,t.params.target.y)&&eq(value.y,t.params.target.x);
  return fail(swapped?'point.swapped':x?'point.y':y?'point.x':'point.both',swapped?'Je hebt x en y verwisseld. Eerst horizontaal x, dan verticaal y.':x?'De x-coördinaat klopt. Verplaats alleen y.':y?'De y-coördinaat klopt. Verplaats alleen x.':'Lees de assenschaal: eerst x, daarna y.',{correctAxes:{x,y}});
 }
 const m=t.params.model;
 if(t.skill==='equation_from_ab'){
  if(!value||!value.a||!value.b||!['+','−'].includes(value.sign)||value.variable!=='x')return fail('formula.incomplete','Plaats een getal bij x, het x-token, een teken en de constante term.');
  try{
   if(!eq(value.a,m.a))return fail('formula.slope','Het getal vóór x bepaalt de helling a. De constante term blijft staan.');
   if(!eq(mul(value.sign==='−'?-1:1,value.b),m.b))return fail('formula.intercept','Teken en constante term moeten samen b vormen. Je helling blijft staan.');
   return ok;
  }catch{return fail('formula.invalid','Kies geldige getaltokens.')}
 }
 if(!Array.isArray(value)||value.length!==2||!value.every(validPoint))return fail('graph.missing','Plaats twee punten voordat je de rechte controleert.');
 if(eq(value[0].x,value[1].x)&&eq(value[0].y,value[1].y))return fail('graph.identical','Twee identieke punten bepalen geen rechte. Verplaats één punt.');
 const good=value.map(p=>onLine(p,m));
 if(!good[0]||!good[1])return fail(!good[0]?'graph.first':'graph.second',!good[0]?'Punt A voldoet niet aan het voorschrift. Controleer zijn y bij deze x.':'Punt A klopt. Verplaats B zodat Δy / Δx gelijk is aan a.',{point:!good[0]?0:1});
 return ok;
}


// Each member is an exact linear expression x*xCoefficient + y*yCoefficient + c.
const algebraSkills=['rewrite_linear_equation','input_from_output','point_on_line'];
const expr=(x=0,y=0,c=0)=>({x:q(x),y:q(y),c:q(c)});
function equationHTML(e){
 const member=m=>{let out='';for(const k of ['x','y','c']){const v=m[k];if(!v.n)continue;const abs=q(Math.abs(v.n),v.d);out+=(out?(v.n<0?' − ':' + '):v.n<0?'−':'')+(k!=='c'&&eq(abs,1)?'':html(abs))+(k==='c'?'':k)}return out||'0'};
 return member(e.left)+' = '+member(e.right);
}
function equivalent(e,f){
 const a=['x','y','c'].map(k=>sub(e.left[k],e.right[k])),b=['x','y','c'].map(k=>sub(f.left[k],f.right[k]));
 const i=a.findIndex(v=>v.n);if(i<0)return b.every(v=>!v.n);if(!b[i].n)return false;
 return a.every((v,j)=>eq(mul(v,b[i]),mul(b[j],a[i])));
}
function operate(e,op){
 if(!op||!['add','subtract','divide'].includes(op.kind))throw Error('Kies optellen, aftrekken of delen.');
 const value=q(op.value);if(!value.n)throw Error(op.kind==='divide'?'Delen door nul mag niet.':'Nul toevoegen verandert de vergelijking niet.');
 if(op.kind!=='divide'&&!['x','y','c'].includes(op.term))throw Error('Kies x, y of een getal.');
 const next=structuredClone(e);
 for(const side of ['left','right']){
  if(op.kind==='divide')for(const k of ['x','y','c'])next[side][k]=div(next[side][k],value);
  else next[side][op.term]=add(next[side][op.term],op.kind==='subtract'?mul(-1,value):value);
 }
 if(Object.values(next).some(m=>Object.values(m).some(v=>Math.abs(v.n)>9999||v.d>9999)))throw Error('Houd de getallen klein: maak de vorige bewerking ongedaan.');
 return next;
}
function isolated(e,axis){const other=axis==='x'?'y':'x';return eq(e.left[axis],1)&&eq(e.left[other],0)&&eq(e.left.c,0)&&eq(e.right[axis],0)&&(axis!=='x'||eq(e.right.y,0))}
function algebraGenerate(skill,{difficulty=0,variant=0,seed=1}={}){
 const v=((variant%12)+12)%12;
 let a=(difficulty===0?[q(1),q(2),q(3)]:[q(2),q(-2),q(1,2),q(-3,2)])[v%(difficulty===0?3:4)],b=q(seed%5-2);
 if(skill==='rewrite_linear_equation'){
  if(difficulty===0){b=q(1+seed%4);const e={left:expr(-a.n,1),right:expr(0,0,b)};return {model:{kind:'affine',a,b},equation:e,variant:'one-step',representation:'equation',support:'guided'}}
  const vertical=difficulty===2&&v>=10;
  if(vertical){const c=q(seed%5-2),factor=q(v===10?2:-3),e={left:expr(factor,0,seed%2),right:expr(0,0,add(mul(factor,c),seed%2))};return {model:{kind:'vertical',c},equation:e,variant:'vertical',representation:'equation',support:'independent'}}
  if(v===8)a=q(0);
  const factor=q(v%2?-4:3),e={left:expr(mul(-1,mul(a,factor)),factor),right:expr(0,0,mul(b,factor))};
  if(difficulty===2&&v%3===0){e.left.y=add(e.left.y,2);e.right.y=q(2);e.left.c=q(1);e.right.c=add(e.right.c,1)}
  return {model:{kind:'affine',a,b},equation:e,variant:!a.n?'horizontal':a.d>1?'fraction':'multiple',representation:'equation',support:'independent'};
 }
 const x=difficulty===0?q(1+seed%4):difficulty===1?q(seed%7-3):q(seed%7-3,2);
 if(difficulty===2&&v>=8)a=q(0);
 const model={kind:'affine',a,b},y=add(mul(a,x),b);
 if(skill==='input_from_output'){
  const target=!a.n&&v%2?add(b,1):y;
  return {model,target,solution:a.n?x:null,variant:a.n?(x.d>1?'fraction':x.n<0?'negative':'integer'):eq(target,b)?'all':'none',representation:difficulty===2&&v%2?'table':'equation',support:difficulty===0?'guided':'independent'};
 }
 const on=difficulty===0||v%2===0,P={x,y:on?y:add(y,v%3===0?q(-1,2):q(1))};
 return {model,P,value:y,variant:!a.n?(on?'constant-on':'constant-off'):on?'on':'off',representation:difficulty===2?['equation','table','graph'][v%3]:'equation',support:difficulty===0?'guided':'independent'};
}
function algebraStages(t){
 if(t.skill==='rewrite_linear_equation')return ['algebra','modelKind'];
 if(t.skill==='point_on_line')return ['subPoint','pointValue','pointVerdict'];
 return t.params.model.a.n?['subOutput','algebra','verifyInput']:['subOutput','constantSolutions','constantVerify'];
}
function algebraEquation(t,w){return w.equation||t.params.equation||{left:expr(t.params.model.a,0,t.params.model.b),right:expr(0,0,t.params.target)}}
function algebraExpected(t,w,stage=algebraStages(t)[w.index]){
 const p=t.params;
 switch(stage){case 'subPoint':return 'x';case 'subOutput':return 'output';case 'pointValue':return p.value;case 'pointVerdict':return eq(p.value,p.P.y)?'on':'off';case 'verifyInput':return p.target;case 'constantSolutions':return eq(p.target,p.model.b)?'all':'none';case 'constantVerify':return p.model.b;case 'modelKind':return p.model.kind==='vertical'?'vertical':'function'}
 return null;
}
function algebraCheck(t,w,value){
 const stage=algebraStages(t)[w.index],p=t.params,fail=(code,message)=>({ok:false,code:'wave.'+code,message});
 if(stage==='algebra'){
  const e=algebraEquation(t,w),axis=t.skill==='input_from_output'||p.model.kind==='vertical'?'x':'y';
  if(value?.kind==='finish')return isolated(e,axis)?{ok:true}:{...fail('algebra.unfinished',`Maak eerst ${axis} vrij: links alleen ${axis}, rechts geen ${axis}.`)};
  try{const next=operate(e,value);if(!equivalent(e,next))return fail('algebra.equivalence','Pas dezelfde bewerking toe op beide volledige leden.');return {ok:true,next,message:(value.kind==='divide'?'Delen door ':value.kind==='subtract'?'Aftrekken: ':'Optellen: ')+text(value.value)+(value.kind!=='divide'&&value.term!=='c'?value.term:'')+' aan beide kanten.'}}catch(err){return fail('algebra.operation',err.message)}
 }
 const want=algebraExpected(t,w),ok=typeof want==='object'?!!value&&typeof value==='object'&&(()=>{try{return eq(want,value)}catch{return false}})():value===want;
 const messages={subPoint:'Vervang x door de x-coördinaat van P; y is de waarde waarmee je vergelijkt.',subOutput:'Vervang f(x) door de gegeven uitvoer; x blijft onbekend.',pointValue:'Bereken eerst a × x + b met de x-coördinaat. De gegeven y is nog geen berekening.',pointVerdict:`Berekend: ${p.value?text(p.value):''}; gegeven y: ${p.P?text(p.P.y):''}. Alleen gelijke waarden betekenen dat P op de rechte ligt.`,verifyInput:'Vul je gevonden x terug in de oorspronkelijke formule in.',constantSolutions:'Een constante functie heeft altijd dezelfde uitvoer: de gevraagde waarde lukt voor alle x of voor geen enkele x.',constantVerify:'Bij a = 0 is de uitvoer altijd b, ook als x = 2.',modelKind:'y = ax + b heeft bij elke x één y. Een verticale rechte x = c is geen functie y = f(x).'};
 return ok?{ok:true}:fail(stage,messages[stage]);
}
function algebraSubmit(t,w,value){
 if(w.done)return {ok:false,code:'done'};const stage=algebraStages(t)[w.index],r=algebraCheck(t,w,value);
 w.steps.push({stage,value,ok:r.ok,code:r.ok?null:r.code});w.steps=w.steps.slice(-32);
 if(!r.ok){if(!w.errors.includes(r.code))w.errors.push(r.code);return r}
 w.history.push({index:w.index,values:structuredClone(w.values),equation:structuredClone(w.equation||null)});w.history=w.history.slice(-24);
 if(r.next){w.equation=r.next;w.lastOperation=r.message}else{w.values[stage]=value;w.index++}
 w.entry=['','1'];w.part=0;w.replace=false;w.operation=null;
 w.done=w.index===algebraStages(t).length;return r;
}
function generate(skill,{difficulty=0,variant=0,seed=1}={}){
 if(algebraSkills.includes(skill))return algebraGenerate(skill,{difficulty,variant,seed});
 if(constructionSkills.includes(skill))return constructionGenerate(skill,{difficulty,variant,seed});
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
function stages(t){if(algebraSkills.includes(t.skill))return algebraStages(t);if(constructionSkills.includes(t.skill))return [t.skill];const m=t.params.model,s=t.skill;if(s==='line_behavior')return ['behavior'];if(s==='special_lines'||m.kind!=='affine')return m.kind==='identical'?['classify']:['classify','property','axis','constant','function'];const slope=['ys','xs','a'];if(s==='slope_from_two_points')return slope;return [...(s==='equation_from_two_points'?[...slope,'point']:['subA','subPoint']),'ax','b','formulaA','formulaB',...(s==='equation_from_two_points'?['verifyA','verifyB']:[])]}
function fresh(t){return {routeVersion:4,index:0,values:{},tokens:[],entry:['','1'],part:0,errors:[],steps:[],help:false,done:false,history:[]}}
function resumeWork(t){
 const w=t.work||(t.work=fresh(t));if(w.routeVersion===4)return w;
 if(!algebraSkills.includes(t.skill)&&!constructionSkills.includes(t.skill)&&t.params.model.kind==='affine'&&!['special_lines','line_behavior'].includes(t.skill)){
  const version=w.routeVersion||1,two=t.skill==='equation_from_two_points',slope=version>=2?['ys','xs','a']:['ys','xs','dy','dx','a'];
  const b=version===3&&!two?['subA','subY','subX','b']:version>=2?['subA','subY','subX','ax','b']:['subY','subX','ax','b'];
  const old=t.skill==='slope_from_two_points'?slope:[...(two?[...slope,'point']:[]),...b,...(version===1&&t.skill==='intercept_from_point'?[]:['formulaA','formulaB']),...(two?['verifyA','verifyB']:version===3?[]:['verifyA'])];
  const next=stages(t),map=i=>{
   let stage=old[i];if(['dy','dx'].includes(stage))stage='a';
   if(['subY','subX'].includes(stage)||two&&stage==='subA')stage=two?'point':'subPoint';
   if(stage==='verifyA'&&!next.includes(stage))stage='formulaB';
   return Math.max(0,next.indexOf(stage));
  };
  w.index=w.done?next.length:map(w.index);w.history=w.history.map(h=>({...h,index:map(h.index)}));
 }
 w.routeVersion=4;return w;
}
function expected(t,w,stage=stages(t)[w.index]){if(algebraSkills.includes(t.skill))return algebraExpected(t,w,stage);if(constructionSkills.includes(t.skill))return null;const p=t.params,m=p.model,A=p[w.values.point||'A'],rev=w.values.ys?.[0]==='A',dy=rev?sub(p.A.y,p.B.y):sub(p.B.y,p.A.y),dx=rev?sub(p.A.x,p.B.x):sub(p.B.x,p.A.x);switch(stage){case 'behavior':return m.a.n>0?'stijgend':m.a.n<0?'dalend':'constant';case 'classify':return m.kind==='identical'?'identiek':m.kind==='vertical'?'verticaal':'horizontaal';case 'property':return m.kind==='vertical'?'dx0':'a0';case 'axis':return m.kind==='vertical'?'x':'y';case 'constant':return m.kind==='vertical'?m.c:m.b;case 'function':return m.kind==='affine'?'functie':'geen functie';case 'dy':return dy;case 'dx':return dx;case 'subA':case 'a':case 'formulaA':return m.a;case 'subPoint':case 'point':return 'A';case 'subY':return A.y;case 'subX':return A.x;case 'ax':return mul(m.a,A.x);case 'b':case 'formulaB':return m.b;case 'verifyA':return p.A.y;case 'verifyB':return p.B.y}}
function pointEquation(t,w){const A=t.params[w.values.point||'A'];return w.bEquation||{left:expr(0,1,mul(t.params.model.a,A.x)),right:expr(0,0,A.y)}}
function check(t,w,value,stageOverride){if(algebraSkills.includes(t.skill))return algebraCheck(t,w,value);if(constructionSkills.includes(t.skill))return constructionCheck(t,value);const stage=stageOverride||stages(t)[w.index],want=expected(t,w,stage);let ok=false,code=stage,message='';
 if(stage==='b'&&['moveConstant','combineConstants'].includes(value?.kind)){
  const moved=!!w.bArithmetic?.moved;
  if(value.kind==='moveConstant')return moved?{ok:false,code:'wave.b',message:'Reken nu de getallen samen.'}:{ok:true,nextArithmetic:{moved:true}};
  return moved?{ok:true,completeArithmetic:true}:{ok:false,code:'wave.b',message:'Breng eerst de losse term naar het andere lid.'};
 }
 if(stage==='b'&&value?.kind){try{return {ok:true,nextB:operate(pointEquation(t,w),value)}}catch(e){return {ok:false,code:'wave.b',message:e.message}}}
 if(stage==='ys'||stage==='xs'){ok=Array.isArray(value)&&value.length===2&&new Set(value).size===2&&value.every(k=>k==='A'||k==='B');if(stage==='xs'&&ok){ok=value.join()===w.values.ys.join();code='direction';message=`Δy: ${w.values.ys[1]}→${w.values.ys[0]}; Δx: ${value[1]}→${value[0]}. Gebruik dezelfde richting.`}else message='Kies de twee verschillende punten voor de aftrekking.'}
 else if(stage==='point'||stage==='subPoint')ok=stage==='subPoint'?value==='A':value==='A'||value==='B';
 else if(stage==='subY'||stage==='subX'){ok=value===(stage==='subY'?'y':'x');message='In y = ax + b staat y links en x bij a.'}
 else if(want&&typeof want==='object'){ok=!!value&&typeof value==='object'&&eq(value,want);message=stage==='b'?`b = y − ax. Met jouw b wordt y = ${text(add(mul(t.params.model.a,t.params[w.values.point||'A'].x),value||q(0)))}; vereist: ${text(t.params[w.values.point||'A'].y)}.`:stage==='dx'||stage==='dy'?'Trek de gekozen coördinaten in de getoonde richting af.':stage.startsWith('verify')?'Vul de oorspronkelijke x in je formule in en vergelijk met de oorspronkelijke y.':stage==='a'?'Deel Δy door Δx, met beide tekens.':stage==='ax'?'Vermenigvuldig a met de x-coördinaat.':'Gebruik de berekende coëfficiënt op de juiste plaats.'}
 else {ok=value===want;message=stage==='behavior'?'Kijk wat y doet als x toeneemt.':stage==='classify'?'Gelijke y: horizontaal. Gelijke x: verticaal, behalve als beide punten identiek zijn.':stage==='property'?'Horizontaal heeft a = 0; verticaal heeft Δx = 0 en geen hellingsgetal.':stage==='function'?'Een functie heeft bij elke x precies één y.':'Verticaal houdt x vast; horizontaal houdt y vast.'}
 return {ok,code:'wave.'+code,message};
}
function submit(t,w,value){if(algebraSkills.includes(t.skill))return algebraSubmit(t,w,value);if(w.done)return {ok:false,code:'done'};const stage=stages(t)[w.index],r=check(t,w,value);w.steps.push({stage,value,ok:r.ok,code:r.ok?null:r.code});w.steps=w.steps.slice(-32);if(!r.ok){if(!w.errors.includes(r.code))w.errors.push(r.code);return r}w.history.push({index:w.index,values:structuredClone(w.values),bEquation:structuredClone(w.bEquation||null),bArithmetic:structuredClone(w.bArithmetic||null)});if(r.nextArithmetic){w.bArithmetic=r.nextArithmetic}else if(r.completeArithmetic){w.values.b=t.params.model.b;w.index++}else if(r.nextB){w.bEquation=r.nextB;if(isolated(r.nextB,'y')){w.values.b=r.nextB.right.c;w.index++}}else{w.values[stage]=value;if(stage==='point'||stage==='subPoint'){w.values.point=value;w.values.subY='y';w.values.subX='x'}w.index++;}delete w.slopeEntry;w.tokens=[];w.entry=['','1'];w.part=0;w.fraction=false;w.replace=false;w.done=w.index===stages(t).length;return r}
function undo(w){const prev=w.history.pop();if(prev){w.index=prev.index;w.values=prev.values;w.bEquation=prev.bEquation||null;w.bArithmetic=prev.bArithmetic||null;delete w.pointGesture;delete w.selectedTerm;delete w.coordinateSlot;delete w.formulaBuild;delete w.slopeEntry;w.fraction=false;w.replace=false;if(prev.cursor){w.cursor=prev.cursor;w.gridEdits=[]}if(Object.hasOwn(prev,'equation')){w.equation=prev.equation;w.lastOperation='';w.operation=null}w.done=false;w.tokens=[];w.entry=['','1'];w.part=0}}
function signature(t){return JSON.stringify([t.skill,t.difficulty,t.params])}
const required={rewrite_linear_equation:['one-step','multiple','fraction','horizontal','vertical'],input_from_output:['integer','negative','fraction','all','none'],point_on_line:['on','off','constant-on','constant-off'],point_plot:['positive','signed','axis','scale'],equation_from_ab:['positive','negative','positive-fraction','negative-fraction','horizontal'],graph_from_equation:['positive','negative','positive-fraction','negative-fraction','horizontal'],slope_from_two_points:['positive','negative','positive-fraction','negative-fraction','horizontal','vertical','identical'],line_behavior:['positive','negative','horizontal'],special_lines:['horizontal','vertical','identical'],intercept_from_point:['positive','negative','negative-fraction','horizontal'],equation_from_point_slope:['positive','negative','negative-fraction','horizontal'],equation_from_two_points:['positive','negative','negative-fraction','horizontal','vertical','identical']};
// Two 32-bit hashes plus source length bound evidence size; full recent task data
// remains in telemetry and drafts. Accept the versioned key unchanged on reload.
function compactSignature(source){if(/^sig1:[0-9a-f]{16}:\d+$/.test(source))return source;let a=2166136261,b=0x9e3779b9;for(let i=0;i<source.length;i++){const c=source.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,2246822507)}return 'sig1:'+(a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0')+':'+source.length}
function evidence(st,t,total,clean){if(!clean)return;st.coverage||={};st.coverage[t.params.variant]=true;st.independent||=[];const key=compactSignature(signature(t));if(!st.independent.some(e=>compactSignature(e.signature)===key))st.independent.push({at:total,signature:key});st.independent=st.independent.slice(-16)}
function mastered(st,skill){const e=st.independent||[];return required[skill].every(v=>st.coverage?.[v])&&e.some((a,i)=>e.slice(i+1).some(b=>b.at-a.at>=3))}
return {resumeWork,pointEquation,compactSignature,required,algebraSkills,expr,equationHTML,equivalent,operate,isolated,algebraEquation,constructionSkills,gridPoint,onLine,constructionCheck,q,fromNumber,add,sub,mul,div,eq,num,parse,text,html,formula,catalog,order,requirements,legacyAccess,migrate,ready,unlock,model,generate,stages,fresh,expected,check,submit,undo,signature,evidence,mastered};
});
