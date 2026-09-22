/* Wave 4 adds representation transfer to the existing exact step engine. */
(function(root,factory){if(typeof module==='object')module.exports=factory;else root.RechtenTransferInstall=factory})(globalThis,function(C){
'use strict';
const {q,add,sub,mul,div,eq,num,model}=C;
const skills=['graph_from_table','equation_from_graph','equation_from_table','equation_from_context'];
Object.assign(C.catalog,{
 graph_from_table:{label:'rechte uit tabel tekenen',requires:['point_plot','table']},
 equation_from_graph:{label:'voorschrift uit grafiek',requires:['ab','slope_from_two_points','equation_from_point_slope']},
 equation_from_table:{label:'voorschrift uit tabel',requires:['table','equation_from_two_points']},
 equation_from_context:{label:'voorschrift uit context',requires:['equation_from_ab','fx']}
});
for(const k of skills)C.requirements[k]=C.catalog[k].requires;
C.order.splice(C.order.indexOf('zeroRead'),0,...skills);
Object.assign(C.required,{
 graph_from_table:['positive','negative','horizontal','fraction','inconsistent'],
 equation_from_graph:['positive','negative','horizontal','fraction','offscreen'],
 equation_from_table:['positive','negative','horizontal','fraction','inconsistent'],
 equation_from_context:['increase','decrease','constant','two-situations']
});
const base={generate:C.generate,stages:C.stages,check:C.check,expected:C.expected,submit:C.submit,signature:C.signature,evidence:C.evidence};
const is=t=>skills.includes(t.skill),point=(x,y)=>({x:q(x),y:q(y)}),at=(m,x)=>add(mul(m.a,x),m.b);
function generate(skill,{difficulty=0,variant=0,seed=1}={}){
 const v=((variant%12)+12)%12;
 if(skill==='equation_from_context'){
  const kind=difficulty===0?'taxi':['taxi','tank','parking'][v%3];
  const a=kind==='parking'?q(0):kind==='tank'?(difficulty===2?q(-1,2):q(-2)):(difficulty===2?q(3,2):q(2+seed%2)),b=q(kind==='tank'?12+seed%3:3+seed%3);
  const m={kind:'affine',a,b},max=kind==='tank'?div(b,mul(-1,a)):q(kind==='taxi'?10:8),xs=difficulty===2?[q(2),q(4)]:[q(0),q(2)],rows=xs.map(x=>({x,y:at(m,x)}));
  return {model:m,rows,context:{kind,xUnit:kind==='taxi'?'km':kind==='tank'?'min':'uur',yUnit:kind==='tank'?'liter':'€',domain:{min:q(0),max},testX:q(3)},variant:difficulty===2?'two-situations':kind==='taxi'?'increase':kind==='tank'?'decrease':'constant',representation:'context',support:difficulty===0?'guided':'independent'};
 }
 const tickSlope=difficulty===0?q(v%2?1:-1):[q(1),q(-1),q(1,2),q(-1,2),q(0),q(1),q(-1),q(1,2),q(-1,2),q(0),q(1),q(-1)][v];
 const scaleX=difficulty===2?q(v%2?2:1):q(1),scaleY=q(1),tickB=q(seed%3-1);
 if(skill==='equation_from_graph'&&difficulty===2&&v>=10)tickB.n=6*(seed%2?1:-1);
 const m={kind:'affine',a:div(mul(tickSlope,scaleY),scaleX),b:mul(tickB,scaleY)};
 const candidates=[];for(let x=-5;x<=5;x++){const y=add(mul(tickSlope,x),tickB);if(y.d===1&&Math.abs(y.n)<=5)candidates.push(point(mul(x,scaleX),mul(y,scaleY)))}
 let rows;
 if(skill==='equation_from_graph')rows=[candidates[1],candidates.at(-2)];
 else{
  // Two unequal x intervals at levels 2/3, and a non-unit interval at level 1.
  const indices=difficulty===0?[0,2,4]:[0,1,3];rows=indices.map(i=>structuredClone(candidates[i]));
  if(skill==='graph_from_table'&&difficulty===0)rows=rows.slice(0,2);
  if(difficulty===2&&v>=10)rows[2].y=add(rows[2].y,rows[2].y.n>=4?-1:1);
 }
 const inconsistent=skill!=='equation_from_graph'&&difficulty===2&&v>=10;
 return {model:m,rows,scaleX,scaleY,variant:inconsistent?'inconsistent':Math.abs(num(tickB))>5?'offscreen':!m.a.n?'horizontal':m.a.d>1?'fraction':m.a.n<0?'negative':'positive',representation:skill==='equation_from_graph'?'graph':'table',support:difficulty===0?'guided':'independent'};
}
function points(t,w){const v=w.values;return t.skill==='equation_from_graph'?[v.pickA,v.pickB]:[t.params.rows[v.colA??0],t.params.rows[v.colB??1]]}
function candidate(t,w){const [A,B]=points(t,w);return A&&B?model(A,B):t.params.model}
function rest(t,w){return t.params.rows?.find((_,i)=>i!==w.values.colA&&i!==w.values.colB)}
function stages(t,w=t.work||C.fresh(t)){
 const slope=['ys','xs','dy','dx','a'],b=['point','subY','subX','ax','b'],finish=['formulaA','formulaB','verifyA','verifyB'];
 if(t.skill==='graph_from_table')return ['colA','plotA','colB','plotB','draw',...(t.params.rows.length===3?['plotRest','tableVerdict']:[])];
 if(t.skill==='equation_from_graph')return ['pickA','pickB',...slope,'bRoute',...(w.values.bRoute==='read'?['readB']:b),...finish];
 if(t.skill==='equation_from_table')return ['colA','colB',...slope,...b,...finish,'verifyRest','tableVerdict'];
 return [...(t.difficulty===2?['colA','colB',...slope,...b,...finish]:['roleA','contextA','roleB','contextB','formulaA','formulaB']), 'contextZero','contextTest','contextDomain'];
}
function proxy(t,w,stage){const [A,B]=points(t,w),m=t.skill==='equation_from_context'?t.params.model:candidate(t,w),task={...t,skill:'equation_from_two_points',params:{A,B,model:m}},work={...w,index:base.stages(task).indexOf(stage)};return {task,work}}
function expected(t,w,stage=stages(t,w)[w.index]){
 const p=t.params,m=candidate(t,w);
 if(stage==='plotA')return p.rows[w.values.colA];if(stage==='plotB')return p.rows[w.values.colB];if(stage==='plotRest')return rest(t,w);
 if(stage==='verifyRest')return at(m,rest(t,w).x);
 if(stage==='tableVerdict')return C.onLine(rest(t,w),m)?'fits':'none';
 if(stage==='readB'||stage==='contextB')return p.model.b;if(stage==='contextA')return p.model.a;
 if(stage==='roleA')return 'rate';if(stage==='roleB')return 'start';
 if(stage==='draw')return 'draw';if(stage==='contextZero')return p.model.b;if(stage==='contextTest')return at(p.model,p.context.testX);if(stage==='contextDomain')return 'inside';
 if(['colA','colB','pickA','pickB','bRoute'].includes(stage))return null;
 const z=proxy(t,w,stage);return base.expected(z.task,z.work,stage);
}
function check(t,w,value){
 const stage=stages(t,w)[w.index],p=t.params,fail=(code,message,extra={})=>({ok:false,code:'wave.transfer.'+code,message,...extra}),ok={ok:true,message:'Stap klopt.'};
 if(stage==='colA'||stage==='colB')return Number.isInteger(value)&&p.rows[value]&&!(stage==='colB'&&value===w.values.colA)?ok:fail('columns','Kies twee verschillende tabelkolommen.');
 if(stage==='pickA'||stage==='pickB'){
  try{if(!value||!['x','y'].every(k=>{const tick=div(value[k],p[k==='x'?'scaleX':'scaleY']);return tick.d===1&&Math.abs(tick.n)<=5}))return fail('grid','Kies een zichtbaar roosterpunt.');
   if(stage==='pickB'&&eq(value.x,w.values.pickA.x)&&eq(value.y,w.values.pickA.y))return fail('identical','Kies een ander punt: twee identieke punten bepalen geen rechte.');
   if(!C.onLine(value,p.model))return fail('point','Dit punt ligt naast de getekende rechte. Je andere punt blijft behouden.');return ok;
  }catch{return fail('grid','Kies een geldig roosterpunt.')}
 }
 if(stage.startsWith('plot')){const target=expected(t,w,stage);try{const x=eq(value.x,target.x),y=eq(value.y,target.y);return x&&y?ok:fail(x?'plotY':y?'plotX':'plotBoth',x?'x klopt. Verbeter alleen y volgens de gekozen kolom.':y?'y klopt. Verbeter alleen x volgens de gekozen kolom.':'Neem x en y uit dezelfde gekozen tabelkolom.',{correctAxes:{x,y}})}catch{return fail('plotBoth','Plaats het punt uit de gekozen kolom.')}}
 if(stage==='bRoute')return value==='point'||value==='read'&&Math.abs(num(div(p.model.b,p.scaleY)))<=5?ok:fail('interceptView','Het y-snijpunt ligt buiten het venster. Bereken b met één van je punten.');
 if(['ys','xs','dy','dx','a','point','subY','subX','ax','b','formulaA','formulaB','verifyA','verifyB'].includes(stage)){const z=proxy(t,w,stage);return base.check(z.task,z.work,value)}
 const want=expected(t,w,stage);let valid=false;try{valid=want&&typeof want==='object'?eq(value,want):value===want}catch{}
 const messages={readB:'Lees b af op de y-as. De assenschaal telt mee.',roleA:'De verandering per eenheid bepaalt a, inclusief het teken bij afname.',roleB:'De waarde bij x = 0 bepaalt b.',contextA:'Gebruik de verandering per eenheid. Bij afname is a negatief.',contextB:'Neem de startwaarde: de uitvoer bij x = 0.',contextZero:'Vul x = 0 in je voorschrift in; de uitvoer heeft dezelfde eenheid als y.',contextTest:'Vul de gevraagde invoer in je formule in en behoud de eenheden.',contextDomain:'Gebruik een niet-negatieve invoer binnen het gegeven bereik.',verifyRest:'Bereken de uitvoer van je formule bij de x uit de overblijvende kolom.',tableVerdict:'Vergelijk de derde y met je rechte of berekende uitvoer. Eén afwijkend punt betekent dat geen affine formule door alle tabelpunten gaat.',draw:'Trek de rechte door de twee geplaatste punten.'};
 return valid?ok:fail(stage,messages[stage]||'Controleer deze stap.');
}
function submit(t,w,value){
 if(w.done)return {ok:false,code:'done'};const stage=stages(t,w)[w.index],r=check(t,w,value);
 w.steps.push({stage,value,ok:r.ok,code:r.ok?null:r.code});w.steps=w.steps.slice(-32);if(!r.ok){if(!w.errors.includes(r.code))w.errors.push(r.code);return r}
 w.history.push({index:w.index,values:structuredClone(w.values),cursor:structuredClone(w.cursor||{x:0,y:0})});w.history=w.history.slice(-32);
 w.values[stage]=structuredClone(value);w.index++;w.tokens=[];w.entry=['','1'];w.part=0;w.replace=false;w.gridEdits=[];
 w.done=w.index===stages(t,w).length;return r;
}
C.transferSkills=skills;C.transfer={generate,stages,points,candidate,rest,proxy,expected,check,submit};
C.generate=(skill,opt)=>skills.includes(skill)?generate(skill,opt):base.generate(skill,opt);
C.stages=t=>is(t)?stages(t):base.stages(t);
C.expected=(t,w,stage)=>is(t)?expected(t,w,stage):base.expected(t,w,stage);
C.check=(t,w,v)=>is(t)?check(t,w,v):base.check(t,w,v);
C.submit=(t,w,v)=>is(t)?submit(t,w,v):base.submit(t,w,v);
const selectedTask=t=>is(t)?{...t,params:{...t.params,selected:t.work?points(t,t.work):null}}:t;
C.signature=t=>base.signature(selectedTask(t));
C.evidence=(st,t,total,clean)=>base.evidence(st,selectedTask(t),total,clean);
});
