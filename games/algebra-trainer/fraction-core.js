/* Keep unreduced denominators visible: representation is part of this task. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));else root.AlgebraFractions=factory(root.AlgebraCore)})(globalThis,C=>{
'use strict';
const token=(n,d=1,x=false)=>({n,d,x}),copy=v=>JSON.parse(JSON.stringify(v));
const key=t=>`${t.n}/${t.d}:${t.x?'x':'1'}`;
function tex(t){const n=Math.abs(t.n),numerator=t.x?(n===1?'x':n+'x'):String(n);return (t.n<0?'-':'')+(t.d===1?numerator:'\\frac{'+numerator+'}{'+t.d+'}');}
function sideTex(terms){return terms.map((t,i)=>(i&&t.n>=0?' + ':i?' - ':'')+tex(i&&t.n<0?{...t,n:-t.n}:t)).join('')||'\\square';}
const equationTex=eq=>sideTex(eq.lhs)+' = '+sideTex(eq.rhs);
const node=t=>C.Div(t.x?C.makeLinearTerm(C.R(t.n)):C.N(t.n),C.N(t.d),t.d!==1);
const equation=eq=>C.EQ(C.Add(...eq.lhs.map(node)),C.Add(...eq.rhs.map(node)));
function common(eq){return [...eq.lhs,...eq.rhs].reduce((n,t)=>C.lcm(n,t.d),1);}
function sameDenominator(eq){return new Set([...eq.lhs,...eq.rhs].map(t=>t.d)).size===1;}
function task(seed,intro=false){
 let a=1,b=1,da=3,db=2,x=1;
 if(!intro){const u=seed>>>0;a=1+(u%2);b=1+Math.floor(u/2)%3;da=2+Math.floor(u/6)%4;if(a===da)da=3;db=2+Math.floor(u/24)%3;if(db===da)db=db===4?2:db+1;if(C.gcd(b,db)>1)b=1;x=1+Math.floor(u/72)%6;}
 const d=C.lcm(da,db),rhs=a*x*(d/da)+b*(d/db),source={lhs:[token(a,da,true),token(b,db)],rhs:[token(rhs,d)]};
 const start=equation(source),steps=[{op:'*',operand:C.N(d)},{op:'-',operand:C.N(b*d/db)}];
 if(a*d/da!==1)steps.push({op:'/',operand:C.N(a*d/da)});
 const states=[start];for(const st of steps)states.push(C.applyEquation(states.at(-1),st.op,st.operand));
 return {kind:'fractions',seed,stage:'Kies je aanpak',guided:true,goal:'Maak losse breuken gelijknamig of werk elke noemer weg, en los op.',prompt:'Kies je aanpak voor de losse breuken.',display:equationTex(source),fractions:source,ex:{type:'B4',policy:{allowFractions:true,allowDecimals:false,allowNegative:false},start,steps,states,solution:C.R(x)}};
}
function init(t,r){if(!r.fraction)r.fraction={phase:'route',current:copy(t.fractions),blocks:{lhs:[],rhs:[]},field:'lhs',signs:{},steps:[]};return r.fraction;}
function numberChoices(eq){const d=common(eq);return [...new Set([...eq.lhs,...eq.rhs].map(t=>t.d).concat([d,d*2,2,3]))].filter(n=>n>1).slice(0,4).sort((a,b)=>a-b);}
function numberCheck(eq,n){
 if(!Number.isSafeInteger(n)||n<1)return {ok:false,message:'Kies een positief geheel getal.'};
 const bad=[...eq.lhs,...eq.rhs].find(t=>n%t.d!==0);
 if(bad)return {ok:false,message:n+' is niet deelbaar door '+bad.d+'. Kies een veelvoud van alle noemers.'};
 const d=common(eq);return {ok:true,message:n===d?'Bouw nu zelf de nieuwe regel.':n+' werkt ook. '+d+' is het kleinste gemeenschappelijke veelvoud. Bouw de nieuwe regel.'};
}
function prepare(s,kind,n){
 const source=copy(s.current),change=t=>kind==='common'?token(t.n*n/t.d,n,t.x):token(t.n*n/t.d,1,t.x);
 return {kind,number:n,source,target:{lhs:source.lhs.map(change),rhs:source.rhs.map(change)}};
}
function coefficients(terms){return terms.reduce((o,t)=>{const name=t.x?'a':'b';o[name]=o[name].add(C.R(t.n,t.d));return o;},{a:C.R(0),b:C.R(0)});}
function normalTerms(a,b){const terms=[];if(!a.isZero())terms.push(token(a.n,a.d,true));if(!b.isZero()||!terms.length)terms.push(token(b.n,b.d));return terms;}
function operationChoices(eq){
 const l=coefficients(eq.lhs),choices=[];
 if(!l.b.isZero())choices.push({op:'-',value:{n:l.b.n,d:l.b.d}},{op:'+',value:{n:l.b.n,d:l.b.d}});
 if(!l.a.isZero()&&!l.a.eq(1))choices.push({op:'/',value:{n:l.a.n,d:l.a.d}},{op:'*',value:{n:l.a.n,d:l.a.d}});
 return choices;
}
function operationTex(st){return ({'-':'-','+':'+','/':'\\div','*':'\\cdot'})[st.op]+'\\;'+tex(token(st.value.n,st.value.d));}
function prepareOperation(s,st){
 const q=C.R(st.value.n,st.value.d),change=terms=>{let {a,b}=coefficients(terms);if(st.op==='-')b=b.sub(q);if(st.op==='+')b=b.add(q);if(st.op==='/'){a=a.div(q);b=b.div(q);}if(st.op==='*'){a=a.mul(q);b=b.mul(q);}return normalTerms(a,b);};
 return {kind:'operation',operation:copy(st),source:copy(s.current),target:{lhs:change(s.current.lhs),rhs:change(s.current.rhs)}};
}
function palette(s){
 const side=s.field,required=s.build.target[side],source=s.build.source[side],pool=[],seen=new Set();
 function add(t){if(!Number.isSafeInteger(t.n)||!Number.isSafeInteger(t.d)||t.d<1)return;const k=key(t);if(!seen.has(k)){seen.add(k);pool.push(copy(t));}}
 required.forEach(add);source.forEach(add);
 if(s.build.kind==='common')source.forEach(t=>add(token(t.n,s.build.number,t.x)));
 if(s.build.kind==='clear')source.forEach(t=>add(token(t.n*s.build.number,t.d,t.x)));
 required.forEach(t=>add({...t,n:t.n+1}));
 // A stable mixed order prevents the position from revealing the answer.
 return pool.slice(0,6).sort((a,b)=>((a.n*17+a.d*11+(a.x?7:0))%29)-((b.n*17+b.d*11+(b.x?7:0))%29));
}
function sorted(terms){return terms.map(key).sort().join('|');}
function validate(t,r){
 const s=init(t,r);if(s.phase!=='build'||!s.build)return {ok:false,incomplete:true,message:'Kies eerst een aanpak en een getal.'};
 if(Object.values(s.signs).some(Boolean))return {ok:false,incomplete:true,message:'Kies nog een term, of neem het teken terug met ↶.'};
 for(const side of ['lhs','rhs']){
  const own=s.blocks[side],expected=s.build.target[side],label=side==='lhs'?'links':'rechts';
  if(!own.length)return {ok:false,incomplete:true,message:'Bouw ook het '+(side==='lhs'?'linker':'rechter')+' lid.'};
  if(sorted(own)===sorted(expected))continue;
  if(own.length<expected.length)return {ok:false,message:'Er ontbreekt een term '+label+'. Neem elke term mee in de nieuwe regel.'};
  if(s.build.kind==='common'){
   const denominator=own.find(v=>v.d!==s.build.number);
   if(denominator)return {ok:false,message:'Maak ook deze breuk '+label+' gelijknamig: gebruik noemer '+s.build.number+'.'};
   return {ok:false,message:'Bij een grotere noemer verandert de teller mee. Vermenigvuldig teller en noemer met hetzelfde getal.'};
  }
  if(s.build.kind==='clear'){
   const unchanged=own.find(v=>s.build.source[side].some(w=>key(w)===key(v)));
   return {ok:false,message:unchanged?'Een term '+label+' bleef onveranderd. Vermenigvuldig elke term in beide leden met '+s.build.number+'.':'De factor '+s.build.number+' werkt op elke volledige breuk. Reken daarna de deling uit.'};
  }
  return {ok:false,message:'Voer dezelfde bewerking '+label+' uit en reken dit volledige lid uit.'};
 }
 return {ok:true,message:s.build.kind==='common'?'Juist. De waarde van elke breuk bleef gelijk.':s.build.kind==='clear'?'Juist. Elke term in beide leden is vermenigvuldigd.':'Juist. Dezelfde bewerking is op beide leden uitgevoerd.'};
}
function solved(eq){const l=coefficients(eq.lhs),r=coefficients(eq.rhs);return l.a.eq(1)&&l.b.isZero()&&r.a.isZero();}
function commit(s){
 const b=copy(s.build);s.steps.push(b);s.current=copy(b.target);s.lastKind=b.kind;s.blocks={lhs:[],rhs:[]};s.signs={};s.field='lhs';delete s.build;
 s.phase=solved(s.current)?'done':b.kind==='common'?'route':'operation';return s.phase==='done';
}
function prompt(s){return s.phase==='route'?'Kies je aanpak voor de losse breuken.':s.phase==='number'?(s.route==='common'?'Kies een gemeenschappelijke noemer.':'Kies een factor voor élke term in beide leden.'):s.phase==='build'?(s.build.kind==='common'?'Maak elke breuk gelijknamig. Bouw links én rechts.':s.build.kind==='clear'?'Vermenigvuldig elke term met '+s.build.number+'. Bouw de nieuwe regel.':'Voer '+C.fallbackText(operationTex(s.build.operation))+' op beide leden uit. Bouw de nieuwe regel.'):s.phase==='done'?'x staat vrij.':'Kies een bewerking op beide leden om x vrij te maken.';}
function demo(t,s,seed){
 let example;for(let i=0;i<12;i++){example=task((seed+i*104729)>>>0);if(equationTex(example.fractions)!==equationTex(t.fractions))break;}
 const kind=s.build?.kind||(s.phase==='operation'?'operation':s.route||'common');let current=copy(example.fractions),b;
 if(kind==='operation'){
  const reference=s.build?.source||s.current,hasFractions=[...reference.lhs,...reference.rhs].some(v=>v.d>1);
  current=prepare({current},hasFractions?'common':'clear',common(current)).target;
  if(coefficients(reference.lhs).b.isZero()){
   const a=coefficients(current.lhs).a;
   current={lhs:normalTerms(a,C.R(0)),rhs:normalTerms(C.R(0),a.mul(example.ex.solution))};
  }
  const choices=operationChoices(current),wanted=s.build?.operation?.op;
  const operation=choices.find(st=>st.op===wanted)||choices[0];b=prepareOperation({current},operation);
 }else b=prepare({current},kind,common(current));
 const start=equation(current),before=equationTex(current),after=equationTex(b.target);let middle,caption;
 if(kind==='common'){
  const term=v=>{const f=b.number/v.d;return f===1?tex(v):'\\frac{'+(v.x?(v.n===1?'x':v.n+'x'):v.n)+'\\cdot '+f+'}{'+v.d+'\\cdot '+f+'}';};
  middle=current.lhs.map(term).join(' + ')+' = '+current.rhs.map(term).join(' + ');caption='Noemer '+b.number+': vermenigvuldig bij elke breuk teller én noemer met hetzelfde getal.';
 }else if(kind==='clear'){
  const term=v=>'\\htmlClass{motion-new}{'+b.number+'}\\cdot '+tex(v);
  middle=current.lhs.map(term).join(' + ')+' = '+current.rhs.map(term).join(' + ');caption='De factor '+b.number+' vermenigvuldigt elke term links én rechts.';
 }else{const op=operationTex(b.operation);middle='\\left('+sideTex(current.lhs)+'\\right) '+op+' = \\left('+sideTex(current.rhs)+'\\right) '+op;caption='Dezelfde bewerking werkt op het volledige linker én rechter lid.';}
 return {ex:{...example.ex,start},total:1,timeline:[{tex:before,previous:null,caption:kind==='common'?'We maken deze losse breuken gelijknamig.':kind==='clear'?'We werken alle noemers weg.':'We maken x verder vrij.',step:0,delay:1500},{tex:middle,previous:before,caption,step:1,delay:3000},{tex:after,previous:before,caption:kind==='common'?'De noemers zijn gelijk. De waarde van elke breuk is behouden.':'Reken alle termen uit. De gelijkheid blijft behouden.',step:1,delay:2200}]};
}
return Object.freeze({token,key,tex,sideTex,equationTex,equation,common,sameDenominator,task,init,numberChoices,numberCheck,prepare,operationChoices,operationTex,prepareOperation,palette,validate,solved,commit,prompt,demo,copy});
});
