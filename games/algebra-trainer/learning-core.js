/* Five-task missions and exact symbolic answer checks. No sampling is used as proof. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));else root.AlgebraLearning=factory(root.AlgebraCore)})(globalThis,C=>{
'use strict';
const {R,N,V,Add,Mul,Div,EQ,simplify,applyEquation}=C;
const goals={A1:'Maak een factor ongedaan door beide leden te delen.',A2:'Maak een optelling ongedaan op beide leden.',A3:'Maak een aftrekking ongedaan op beide leden.',A4:'Maak een deling ongedaan door beide leden te vermenigvuldigen.',B1:'Plan twee stappen: losse term en factor.',B2:'Plan twee stappen bij een negatieve losse term.',B3:'Behoud het teken van de x-term; deel door de juiste factor.',C1:'Behandel de haakjes als één groep.',C2:'Werk een factor met een minteken correct uit.',D1:'Onderscheid de buitenfactor en de factor bij x.',D2:'De noemer deelt de volledige teller.',D3:'Onderscheid de losse term buiten en binnen de groep.',B4:'Onderscheid x gedeeld door a van de losse term.',B5:'Werk een aftrekking buiten de breuk weg.',E1:'Verzamel x-termen met een geldige bewerking op beide leden.',E2:'Kies aan welk lid je de x-termen verzamelt.',E3:'Vergelijk routes naar dezelfde oplossing.'};
function affine(e){
 if(e.t==='num')return {a:R(0),b:R(e.q.n,e.q.d)};
 if(e.t==='var')return {a:R(1),b:R(0)};
 if(e.t==='add')return e.terms.map(affine).reduce((p,q)=>({a:p.a.add(q.a),b:p.b.add(q.b)}),{a:R(0),b:R(0)});
 if(e.t==='div'){const n=affine(e.n),d=affine(e.d);if(!d.a.isZero())throw Error('De noemer moet hier een getal zijn.');return {a:n.a.div(d.b),b:n.b.div(d.b)}}
 if(e.t==='mul')return e.factors.map(affine).reduce((p,q)=>{if(!p.a.isZero()&&!q.a.isZero())throw Error('Gebruik hier een lineaire uitdrukking.');return {a:p.a.mul(q.b).add(q.a.mul(p.b)),b:p.b.mul(q.b)}},{a:R(0),b:R(1)});
 throw Error('Onbekende uitdrukking.');
}
const fromAffine=e=>simplify(Add(Mul(N(e.a),V()),N(e.b)));
function expandEquation(eq){return EQ(fromAffine(affine(eq.l)),fromAffine(affine(eq.r)))}
function parseExpression(text){
 text=String(text).replace(/[−–]/g,'-').replace(/×|·/g,'*').replace(/÷/g,'/').replace(/,/g,'.').replace(/\s/g,'');
 if(!text||text.length>140||/[^0-9x+*/().-]/.test(text))throw Error('Gebruik x, getallen en + − × / ( ).');
 const tokens=text.match(/\d+(?:\.\d+)?|[x+*/().-]/g)||[];let i=0;
 function atom(){const t=tokens[i++];if(t==='+'||t==='-')return t==='-'?Mul(N(-1),atom()):atom();if(t==='x')return V();if(t==='('){const e=sum();if(tokens[i++]!==')')throw Error('Sluit de haakjes.');return e;}if(/^\d+(?:\.\d+)?$/.test(t||'')){const [n,d='']=t.split('.');if(n.length+d.length>7)throw Error('Gebruik kleinere getallen.');return N(R(Number(n+d),10**d.length));}throw Error('Vul een volledige uitdrukking in.');}
 function product(){let e=atom();while(i<tokens.length){const t=tokens[i];if(t==='*'||t==='/'){i++;const r=atom();e=t==='*'?Mul(e,r):Div(e,r);}else if(t==='x'||t==='('||/^\d/.test(t)){e=Mul(e,atom());}else break;}return e;}
 function sum(){let e=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],r=product();e=Add(e,op==='-'?Mul(N(-1),r):r);}return e;}
 const e=sum();if(i!==tokens.length)throw Error('Controleer de notatie.');affine(e);return simplify(e);
}
function parseEquation(text){const parts=String(text).split('=');if(parts.length!==2)throw Error('Schrijf beide leden met één gelijkteken.');return EQ(parseExpression(parts[0]),parseExpression(parts[1]));}
const sameExpr=(a,b)=>{const p=affine(a),q=affine(b);return p.a.eq(q.a)&&p.b.eq(q.b)};
const sameEquation=(a,b)=>sameExpr(a.l,b.l)&&sameExpr(a.r,b.r)||sameExpr(a.l,b.r)&&sameExpr(a.r,b.l);
function evaluate(e,x){x=typeof x==='object'?R(x.n,x.d):R(x);const q=affine(e);return q.a.mul(x).add(q.b)}
function operationText(step,policy){return (step.op==='*'?'×':step.op==='/'?'÷':step.op==='-'?'−':'+')+' '+C.fallbackText(C.latexExpr(step.operand,policy));}
function mission(skill,seed=Date.now()){
 if(!goals[skill])throw Error('Onbekende halte.');
 const policy={allowFractions:['B4','B5','D2'].includes(skill),allowDecimals:false,allowNegative:['B3','C2','D3','E1','E2','E3'].includes(skill)};
 const ex=i=>C.generateSeeded(skill,{...policy,allowFractions:i===4&&policy.allowFractions&&skill!=='B5',allowDecimals:i===4&&skill==='B5'},i,(seed+i*7219)>>>0);
 const tasks=[0,1,2,3,4].map(i=>({id:seed+':'+i,kind:'solve',ex:ex(i),stage:['Ontdekken','Begeleid','Zelf produceren','Zelfstandig','Toepassen'][i],goal:goals[skill],guided:i<2}));
 tasks[0].prompt='Maak x vrij. Kijk wat jouw bewerking op beide leden doet.';
 const guided=tasks[1],predict=tasks[2],transfer=tasks[4];
 if(['C1','C2','D1','D3'].includes(skill)){
  guided.kind='repair';guided.expected=expandEquation(guided.ex.start);const l=affine(guided.expected.l),group=findGroup(guided.ex.start.l);const delta=group?affine(group.inside).b.mul(R(1).sub(group.factor)):R(1);guided.fault=EQ(fromAffine({a:l.a,b:l.b.add(delta)}),guided.expected.r);guided.location='group';guided.prompt='Een term in de groep is fout uitgewerkt. Herstel de volledige regel.';guided.goal='De buitenfactor vermenigvuldigt elke term in de groep.';
 }else{
  guided.kind='routes';const st=guided.ex.steps[0],other={op:st.op==='/'?'*':st.op==='*'?'/':st.op==='-'?'+':'-',operand:st.operand};
  guided.routes=[st,other];guided.prompt='Welke eerste stap maakt de structuur eenvoudiger?';guided.goal='Kies een doelgerichte stap; beide bewerkingen zijn geldig.';
 }
 predict.kind='predict';predict.operation=predict.ex.steps[0];predict.expected=applyEquation(predict.ex.start,predict.operation.op,predict.operation.operand);predict.prompt='Bouw de regel na '+operationText(predict.operation,predict.ex.policy)+' op beide leden.';predict.goal='Produceer beide leden van de volgende regel.';
 tasks[3].prompt='Los op via een geldige route die jij kiest.';
 if(['B1','B2','A1','A2','A3'].includes(skill)){
  transfer.kind='build';transfer.x=R(2+seed%4);transfer.factor=R(2+Math.floor(seed/4)%4);transfer.sign=['B2','A3'].includes(skill)?-1:1;transfer.expectedNumber=R(1+Math.floor(seed/16)%9);transfer.rhs=transfer.factor.mul(transfer.x).add(transfer.expectedNumber.mul(R(transfer.sign)));transfer.prompt='Vul het vak zodat x = '+transfer.x.n+' de oplossing is.';transfer.display=transfer.factor.n+'x '+(transfer.sign===-1?'−':'+')+' \\square = '+transfer.rhs.n;transfer.goal='Bouw een vergelijking met de gevraagde oplossing.';
 }else if(['C1','C2','D1','D3'].includes(skill)){
  transfer.kind='expand';transfer.expected=expandEquation(transfer.ex.start);transfer.prompt='Werk de haakjes uit. Bouw de volledige nieuwe regel.';transfer.goal='Voer distributiviteit zelf uit; alleen oplossen is hier onvoldoende.';
 }else{
  transfer.kind='verify';transfer.proposed=transfer.ex.solution.add(R(seed%2?1:0));transfer.prompt='Is deze x-waarde een oplossing? Vul haar in en vergelijk links en rechts.';transfer.goal='Controleer een oplossing door exact in te vullen.';
 }
 if(['E1','E2','E3'].includes(skill)){
  const a=3+seed%4,b=1+Math.floor(seed/4)%(a-1),left=1+Math.floor(seed/16)%8,x=R(2+Math.floor(seed/128)%5);
  const start=EQ(Add(Mul(N(a),V()),N(left)),Add(Mul(N(b),V()),N(R(a-b).mul(x).add(R(left)))));
  const steps=[{op:'-',operand:Mul(N(b),V())},{op:'-',operand:N(left)},{op:'/',operand:N(a-b)}],states=[start];for(const st of steps)states.push(applyEquation(states.at(-1),st.op,st.operand));
  guided.ex={...guided.ex,start,steps,states,solution:x};guided.routes=[{op:'/',operand:N(a)},{op:'-',operand:Mul(N(b),V())}];guided.goal='Kies een eerste stap die breuken vermijdt.';guided.prompt='Welke route houdt alle coëfficiënten geheel?';guided.strategy='integers';
 }
 return {version:2,skill,seed,index:0,tasks,results:tasks.map(t=>({kind:t.kind,goal:t.goal,done:false,supported:t.guided,errors:0,hints:0,input:'',left:'',right:'',choice:''})),completed:false};
}
function validate(task,values){
 if(['predict','repair','expand'].includes(task.kind)){
  if(task.kind==='repair'&&values.location!==task.location)return {ok:false,message:'De fout zit bij het vermenigvuldigen van de volledige groep.'};
  const answer=parseEquation(values.input);if(!sameEquation(answer,task.expected))return {ok:false,message:'Controleer elke term en beide leden van deze stap.'};
  if(['expand','repair'].includes(task.kind)&&(hasGroup(answer.l)||hasGroup(answer.r)))return {ok:false,message:'Werk de groep uit: vermenigvuldig elke term met de buitenfactor.'};
  return {ok:true,message:task.kind==='predict'?causal(task.ex.start,task.expected,task.operation.op,task.operation.operand): 'Juist. Elke term van de groep is correct vermenigvuldigd.'};
 }
 if(task.kind==='routes'){
  if(!/^[01]$/.test(String(values.choice)))return {ok:false,message:'Kies een route.'};const st=task.routes[Number(values.choice)];if(!st)return {ok:false,message:'Kies een route.'};const after=applyEquation(task.ex.start,st.op,st.operand);
  const integral=eq=>[...Object.values(affine(eq.l)),...Object.values(affine(eq.r))].every(q=>q.d===1);
  const ok=task.strategy==='integers'?integral(after):C.equationComplexity(after)<C.equationComplexity(task.ex.start);
  return {ok,valid:true,message:ok?'Deze geldige stap past bij je doel.':'Dit is een geldige bewerking. Ze past minder goed bij het gevraagde doel.'};
 }
 if(task.kind==='build'){const q=affine(parseExpression(values.input));if(!q.a.isZero())throw Error('Vul een getal in het vak.');const ok=task.factor.mul(task.x).add(q.b.mul(R(task.sign||1))).eq(task.rhs);return {ok,message:ok?'Juist. Met jouw getal voldoen beide leden aan de gevraagde oplossing.':'Vul de gegeven x-waarde in en bepaal welk getal nog ontbreekt.'};}
 if(task.kind==='verify'){
  const a=affine(parseExpression(values.left)),b=affine(parseExpression(values.right));if(!a.a.isZero()||!b.a.isZero())throw Error('Bereken de twee getalwaarden.');
  const left=evaluate(task.ex.start.l,task.proposed),right=evaluate(task.ex.start.r,task.proposed);const ok=a.b.eq(left)&&b.b.eq(right)&&values.choice===(left.eq(right)?'yes':'no');return {ok,message:ok?(left.eq(right)?'De twee leden zijn gelijk: de oplossing klopt.':'De twee leden verschillen: dit is geen oplossing.'):'Vul dezelfde x-waarde in beide leden in en vergelijk de resultaten.'};
 }
 return {ok:false,message:'Werk verder tot x vrijstaat.'};
}
function findGroup(e){if(e.t==='mul'){const inside=e.factors.find(f=>f.t==='add');if(inside)return {inside,factor:e.factors.filter(f=>f!==inside).map(f=>affine(f).b).reduce((p,q)=>p.mul(q),R(1))};}if(e.t==='add')return e.terms.map(findGroup).find(Boolean);if(e.t==='div')return findGroup(e.n);return null;}
function hasGroup(e){return e.t==='mul'&&e.factors.some(f=>f.t==='add')||e.t==='add'&&e.terms.some(hasGroup)||e.t==='div'&&hasGroup(e.n)}
function hint(task,eq,level){
 if(level<2)return task.kind==='repair'||task.kind==='expand'?'De buitenfactor werkt op elke term binnen de haakjes.':task.kind==='predict'?'Voer de gekozen bewerking uit op links én rechts.':task.kind==='build'?'Vul de gegeven x-waarde in. Wat ontbreekt nog?':task.kind==='verify'?'Bereken links en rechts afzonderlijk met dezelfde x.':'Bekijk wat bij x staat of waarmee x vermenigvuldigd wordt.';
 if(task.kind==='solve'){const q=affine(eq.l),r=affine(eq.r);if(!q.a.isZero()&&!r.a.isZero())return 'Trek een x-term af van beide leden.';const side=!q.a.isZero()?q:r;if(!side.b.isZero())return 'Werk de losse term weg met de inverse bewerking.';return 'Maak de factor bij x ongedaan.';}
 if(task.expected)return 'Een correcte regel is '+C.fallbackText(C.latexEq(task.expected,task.ex.policy))+'.';
 if(task.kind==='routes')return 'Kijk of de losse term of een x-term verdwijnt, en of er breuken bijkomen.';
 if(task.kind==='build')return task.factor.n+' × '+task.x.n+' = '+task.factor.mul(task.x).n+'. Het ontbrekende getal is '+task.expectedNumber.n+'.';
 return 'Vervang elke x door '+C.fallbackText(C.ratLatex(task.proposed,task.ex.policy))+'.';
}
function causal(before,after,op,operand){
 if(C.solvedEquation(after))return 'Juist. x staat vrij.';
 const a=affine(before.l),b=affine(after.l),r=affine(before.r),s=affine(after.r);
 if(!a.b.isZero()&&b.b.isZero())return 'De '+(a.b.n>0?'+':'')+C.fallbackText(C.ratLatex(a.b,{}))+' verdwijnt. Alleen de term met x blijft links.';
 if(!r.b.isZero()&&s.b.isZero())return 'De losse term rechts verdwijnt. Dezelfde bewerking is op beide leden uitgevoerd.';
 if(!a.a.isZero()&&b.a.isZero()||!r.a.isZero()&&s.a.isZero())return 'De x-term verdwijnt aan één lid. De gelijkheid blijft behouden.';
 if(hasGroup(before.l)&&!hasGroup(after.l))return 'De buitenfactor is weggewerkt. De groep wordt zichtbaar.';
 return 'Geldige stap op beide leden. '+(C.equationComplexity(after)>C.equationComplexity(before)?'De vorm is voorlopig complexer.':'De gelijkheid blijft behouden.');
}
return Object.freeze({goals,affine,parseExpression,parseEquation,sameExpr,sameEquation,evaluate,expandEquation,mission,validate,hint,causal,operationText});
});
