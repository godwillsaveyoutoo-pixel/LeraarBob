/* The current table/graph routes; legacy drafts retain their original exact engine. */
(function(root,factory){if(typeof module==='object')module.exports=factory;else root.RechtenTransferWorkbenchInstall=factory})(globalThis,function(C){
'use strict';
const old={generate:C.generate,stages:C.stages,expected:C.expected,check:C.check,submit:C.submit},legacy=C.transfer;
const active=['graph_from_table','equation_from_graph','equation_from_table'];
C.activeTransferSkills=active;C.disabledSkills=['equation_from_context'];
C.order.splice(C.order.indexOf('equation_from_context'),1);
delete C.requirements.equation_from_context;
C.required.graph_from_table=['positive','negative','horizontal','fraction'];C.required.equation_from_table=['positive','negative','horizontal','fraction'];
const modern=t=>active.includes(t.skill)&&t.params.transferVersion===2;
const zeroColumn=t=>t.params.rows.findIndex(p=>C.eq(p.x,0));
function generate(skill,opt={}){
 const p=old.generate(skill,opt);if(!active.includes(skill))return p;
 if(skill!=='equation_from_graph'){
  const candidates=[];for(let x=-5;x<=5;x++){const X=C.mul(x,p.scaleX),y=C.add(C.mul(p.model.a,X),p.model.b),tick=C.div(y,p.scaleY);if(tick.d===1&&Math.abs(tick.n)<=5)candidates.push({x:X,y})}
  const others=candidates.filter(P=>P.x.n),zero=candidates.find(P=>!P.x.n);
  p.rows=(opt.variant||0)%2===0&&zero?[others[0],zero,others.at(-1)]:[others[0],others[1],others.at(-1)];
  if(skill==='graph_from_table'&&!opt.difficulty)p.rows=p.rows.slice(0,2);
  p.variant=!p.model.a.n?'horizontal':p.model.a.d>1?'fraction':p.model.a.n<0?'negative':'positive';
 }
 return {...p,transferVersion:2};
}
function stages(t){
 if(t.skill==='graph_from_table')return ['drawTable'];if(t.skill==='equation_from_graph')return ['matchGraph'];
 return [...(zeroColumn(t)>=0?['tableB']:[]),'slopeFraction','tableA','installA',...(zeroColumn(t)<0?['pointX','pointY','pointProduct',...(t.params.model.a.n?['solveB']:[]),'installB']:[])];
}
function selectedPoint(t,w){return t.params.rows[w.values.pointX?.column??0]}
function equation(t,w){const P=selectedPoint(t,w);return w.bEquation||{left:C.expr(0,1,C.mul(t.params.model.a,P.x)),right:C.expr(0,0,P.y)}}
function expected(t,w,stage=stages(t)[w.index]){
 const m=t.params.model;
 switch(stage){
  case 'tableB':return {column:zeroColumn(t),axis:'y'};
  case 'slopeFraction':return {ys:[{column:1,axis:'y'},{column:0,axis:'y'}],xs:[{column:1,axis:'x'},{column:0,axis:'x'}]};
  case 'tableA':return m.a;case 'installA':return 'a';case 'installB':return 'b';
  case 'pointX':return {column:0,axis:'x'};case 'pointY':return {column:w.values.pointX.column,axis:'y'};
  case 'pointProduct':return C.mul(m.a,selectedPoint(t,w).x);
  case 'solveB':{const e=equation(t,w);if(e.right.y.n)return {kind:'subtract',term:'y',value:e.right.y};if(e.left.c.n)return {kind:'subtract',term:'c',value:e.left.c};return {kind:'divide',value:e.left.y}}
  case 'matchGraph':return {a:m.a,b:m.b};
  case 'drawTable':return t.params.rows.slice(0,2);
 }
}
function check(t,w,value){
 const stage=stages(t)[w.index],p=t.params,fail=(code,message)=>({ok:false,code:'wave.transfer.'+code,message}),ok={ok:true,message:'Dit klopt.'};
 const cell=(v,axis)=>v?.axis===axis&&Number.isInteger(v.column)&&!!p.rows[v.column];
 try{
  if(stage==='tableB')return cell(value,'y')&&C.eq(p.rows[value.column].x,0)?ok:fail('tableB','Neem f(x) uit de kolom waar x = 0. Die functiewaarde is b.');
  if(stage==='slopeFraction'){
   const ys=value?.ys,xs=value?.xs;
   if(!Array.isArray(ys)||!Array.isArray(xs)||ys.length!==2||xs.length!==2||!ys.every(v=>cell(v,'y'))||!xs.every(v=>cell(v,'x')))return fail('fractionAxes','Boven staan twee f(x)-waarden; onder staan de bijbehorende x-waarden.');
   if(ys[0].column===ys[1].column||C.eq(p.rows[ys[0].column].x,p.rows[ys[1].column].x))return fail('fractionPoints','Gebruik twee verschillende punten.');
   if(ys.some((v,i)=>v.column!==xs[i].column))return fail('fractionOrder','Gebruik boven en onder dezelfde kolommen, in dezelfde volgorde.');return ok;
  }
  if(stage==='pointX')return cell(value,'x')?ok:fail('pointX','Sleep een x-waarde uit de tabel naar x.');
  if(stage==='pointY')return cell(value,'y')&&value.column===w.values.pointX.column?ok:fail('pointY','Neem f(x) uit dezelfde kolom als de gekozen x.');
  if(stage==='solveB'){
   const e=equation(t,w),next=C.operate(e,value);if(!C.equivalent(e,next))return fail('equivalence','Dezelfde bewerking moet op beide leden gebeuren.');return {...ok,nextB:next};
  }
  if(stage==='drawTable'){
   if(!Array.isArray(value)||value.length!==2||value.some(P=>!P||!['x','y'].every(k=>{const v=C.div(P[k],p[k==='x'?'scaleX':'scaleY']);return v.d===1&&Math.abs(v.n)<=5})))return fail('drawPoints','Plaats twee punten op het rooster.');
   const m=C.model(...value);if(m.kind==='identical')return fail('drawSame','Plaats twee verschillende punten.');
   if(m.kind!=='affine'||!p.rows.every(P=>C.onLine(P,m)))return fail('drawLine','Je rechte past nog niet bij alle tabelpunten. Verplaats een punt en kijk opnieuw.');return ok;
  }
  if(stage==='matchGraph'){
   if(!value?.a||!value?.b)return fail('coefficients','Stel a en b in door te scrollen of te vegen.');
   if(!C.eq(value.a,p.model.a))return fail('graphA','De helling klopt nog niet. Kijk hoeveel f(x) verandert als x toeneemt.');
   return C.eq(value.b,p.model.b)?ok:fail('graphB','Het snijpunt met de y-as klopt nog niet. Pas b aan.');
  }
  const want=expected(t,w);return typeof want==='string'?value===want?ok:fail('install','Sleep de gevonden waarde naar de juiste letter.'):C.eq(value,want)?ok:fail(stage,stage==='tableA'?'Bereken het verschil van de functiewaarden gedeeld door het verschil van de x-waarden.':'Vermenigvuldig a met de gekozen x-waarde.');
 }catch{return fail('value','Controleer je invoer. De noemer of deler mag niet nul zijn.')}
}
function submit(t,w,value){
 if(w.done)return {ok:false,code:'done'};const stage=stages(t)[w.index],r=check(t,w,value);
 w.steps.push({stage,value:structuredClone(value),ok:r.ok,code:r.ok?null:r.code});w.steps=w.steps.slice(-32);
 if(!r.ok){if(!w.errors.includes(r.code))w.errors.push(r.code);return r}
 w.history.push({index:w.index,values:structuredClone(w.values),bEquation:structuredClone(w.bEquation||null)});w.history=w.history.slice(-32);
 if(r.nextB){w.bEquation=r.nextB;if(C.isolated(r.nextB,'y')){w.values.b=r.nextB.right.c;w.values.solveB=true;w.index++}}
 else{w.values[stage]=structuredClone(value);if(stage==='tableB')w.values.b=pValue(t,value);if(stage==='tableA')w.values.a=C.q(value);if(stage==='pointProduct'&&!t.params.model.a.n)w.values.b=selectedPoint(t,w).y;w.index++}
 w.entry=['','1'];w.part=0;w.replace=false;w.fraction=false;delete w.selectedTerm;w.done=w.index===stages(t).length;return r;
}
const pValue=(t,cell)=>t.params.rows[cell.column][cell.axis];
const coefficientValues=axis=>axis==='a'?[-4,-3,-2,-1.5,-1,-.75,-2/3,-.5,-1/3,-.25,0,.25,1/3,.5,2/3,.75,1,1.5,2,3,4].map(C.fromNumber):Array.from({length:33},(_,i)=>C.q(i-16,2));
C.transferWorkbench={modern,generate,stages,zeroColumn,selectedPoint,equation,expected,check,submit,coefficientValues};
C.generate=generate;
C.stages=t=>modern(t)?stages(t):old.stages(t);
C.expected=(t,w,s)=>modern(t)?expected(t,w,s):old.expected(t,w,s);
C.check=(t,w,v)=>modern(t)?check(t,w,v):old.check(t,w,v);
C.submit=(t,w,v)=>modern(t)?submit(t,w,v):old.submit(t,w,v);
C.transfer={...legacy,legacyGenerate:legacy.generate,generate:(skill,opt)=>generate(skill,opt),stages:(t,w)=>modern(t)?stages(t):legacy.stages(t,w),expected:(t,w,s)=>modern(t)?expected(t,w,s):legacy.expected(t,w,s)};
});
