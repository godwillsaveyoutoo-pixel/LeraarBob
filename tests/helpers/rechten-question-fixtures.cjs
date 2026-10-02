// Real runtime states for every playable question and intermediate step.
const assert=require('node:assert/strict');
const R=require('../../games/rechten/rechtenwereld/mission-runtime.js'),W=require('../../games/rechten/core/wave-core.js');
const F=require('../../games/rechten/rechtenwereld/formula-core.js'),D=require('../../games/rechten/rechtenwereld/derive-core.js'),L=require('../../games/rechten/rechtenwereld/lines-core.js');
const X=require('../../games/rechten/rechtenwereld/context-core.js');
const families={Points:['point','point_plot'],Hills:['delta','slope','slope_from_two_points'],Lines:L.skills,Grens:['zeroRead','zero','positive','negative','signchart'],Formula:F.skills,Derive:D.skills,Context:['equation_from_context'],AB:['ab'],Values:['fx','table'],Checks:['input_from_output','point_on_line']};
function fill(s,wrong=false){if(R.active(s).task.table&&R.active(s).phase==='derive-fill'){s=R.selectTableColumn(s,0);s=R.selectTableColumn(s,1)}const m=R.active(s),t=D.workTask(m.task,m.values),p=m.phase;let v={};
 if(m.skill==='point')v={answer:String(t.options.findIndex(q=>W.eq(q.x,t.target.x)&&W.eq(q.y,t.target.y)))};
 if(m.skill==='point_plot')v={point:{x:W.num(t.target.x),y:W.num(t.target.y)}};
 if(p==='hill-fill'||p==='derive-fill')v={y1:'B.y',y0:'A.y',x1:'B.x',x0:'A.x'};
 if(p==='hill-calculate'||p==='derive-slope')v={a:W.text(t.model.a)};
 if(['hill-dx','hill-dy','hill-rate'].includes(p)){const key=p==='hill-dx'?'dx':p==='hill-dy'?'dy':'a';v={[key==='a'?'rateChoice':key+'Choice']:String(t.options[key].findIndex(q=>W.eq(q,key==='a'?t.model.a:t[key])))}}
 if(p==='line-plot')v=Object.fromEntries(['A','B'].map(n=>['plot'+n,{x:W.num(t.points[n].x),y:W.num(t.points[n].y)}]));
 if(p==='line-behavior')v={behavior:t.model.a.n>0?'stijgend':t.model.a.n<0?'dalend':'constant'};
 if(p==='line-special')v={lineKind:L.classification(t),isFunction:L.functionKind(t)};
 if(families.Grens.includes(m.skill)){
  if(p==='grens-chart')v={chartLeft:t.model.a.n>0?'-':'+',chartZero:'0',chartRight:t.model.a.n>0?'+':'-'};
  else if(p==='grens-inequality')v={inequality:(m.skill==='positive')===(t.model.a.n>0)?'>':'<'};
  else v={answer:String(t.options.findIndex(q=>W.eq(q,t.root)))};
 }
 const K=require('../../games/rechten/rechtenwereld/checks-core.js');if(K.skills.includes(m.skill))v=Object.fromEntries(K.fields(t,p).map(name=>{const q=K.expected(t,name);return [name,typeof q==='string'?q:W.text(q)]}));
 if(['fx-substitute','fx-calculate','table-fill'].includes(p)){const V=require('../../games/rechten/rechtenwereld/values-core.js');v=Object.fromEntries(V.fields(t,p).map(name=>[name,W.text(V.expected(t,name))]));}
 if(p==='ab-intercept')v={b:W.text(t.model.b)};
 if(p==='ab-slope')v={a:W.text(t.model.a)};
 if(p==='formula-build'||p==='ab-rule')v={factor:W.text(t.model.a),variable:'x',operator:t.model.b.n<0?'−':'+',constant:W.text(W.mul(t.model.b.n<0?-1:1,t.model.b))};
 if(p==='formula-plot')v={plotA:{x:0,y:W.num(t.model.b)},plotB:{x:1,y:W.num(W.add(t.model.a,t.model.b))}};
 if(p==='formula-read')v=m.skill==='intercept'?{x:'0',b:W.text(t.model.b)}:{a:W.text(t.model.a),b:W.text(t.model.b)};
 if(p==='formula-rewrite'){
  if(wrong)return R.operateFormula(s,1);
  let e=F.currentEquation(t,m.values);if(e.left.x.n)s=R.operateFormula(s,e.left.x.n<0?0:1);e=F.currentEquation(t,R.active(s).values);if(!W.eq(e.left.y,1))s=R.operateFormula(s,4);return s;
 }
 if(p==='derive-substitute')v={subY:'A.y',subA:'a',subX:'A.x'};
 if(p==='derive-product')v={product:W.text(W.mul(t.model.a,t.points.A.x))};
 if(p==='derive-intercept')v={b:W.text(t.model.b)};
 if(p==='derive-formula')v={answerFactor:W.text(t.model.a),answerSign:t.model.b.n<0?'−':'+',answerConstant:W.text(W.mul(t.model.b.n<0?-1:1,t.model.b))};
 if(m.skill==='equation_from_context'){
  v={'context-start':{openingCost:String(t.gateFee)},'context-add':{onePrice:String(X.total(t,1))},'context-table':{twoPrice:String(X.total(t,2)),threePrice:String(X.total(t,3))},'context-rule':{perUnit:String(t.perUnit),gateFee:String(t.gateFee)},'context-plot':{plotY1:String(X.total(t,1)),plotY2:String(X.total(t,3))},'context-check':{caravanTotal:String(X.total(t,t.groupSize))}}[p];
 }

 if(wrong){const key=Object.keys(v)[0],value=v[key];if(key==='answer'||key.endsWith('Choice'))v[key]=String((Number(value)+1)%4);else if(typeof value==='object')v[key]={x:value.x===0?1:0,y:0};else if(value==='B.y'||value==='A.y')v[key]='A.x';else if(key==='behavior')v[key]=value==='stijgend'?'dalend':'stijgend';else if(key==='lineKind')v[key]=value==='horizontal'?'vertical':'horizontal';else if(key==='inequality')v[key]='=';else if(key==='chartLeft')v[key]='0';else v[key]=W.parse(value)?W.text(W.add(W.parse(value),1)):'x';}
 for(const [k,value]of Object.entries(v))s=R.edit(s,k,value);return s;
}
function fixtures(){const rows=[];const add=(state,family,kind)=>{const m=R.active(state);rows.push({label:`${m.skill}/${m.index+1}/${m.phase}/${kind}`,family,m:structuredClone(m)})};
 for(const [family,skills]of Object.entries(families))for(const skill of skills){let s=R.start(R.initial(),skill),steps=0;
  while(!R.active(s).completed){assert(++steps<50,skill);add(s,family,'ready');if(R.active(s).phase==='hill-inspect'){s=R.beginHills(s);continue}
   add(R.commit(s),family,'missing');const bad=R.commit(fill(s,true));assert(!R.active(bad).feedback.result.ok,'incorrect fixture '+skill);add(bad,family,'wrong');
   const selected=fill(s);add(selected,family,'selected');const good=R.commit(selected);assert(R.active(good).feedback.result.ok,JSON.stringify(R.active(good).feedback));add(good,family,'correct');
   if(R.active(s).index===0){let hint=s;for(let i=0;i<5;i++){hint=R.hint(hint);add(hint,family,'hint'+(i+1))}}
   s=R.advance(good);
  }add(s,family,'completed');
 }return rows;
}
module.exports={fixtures,families,fill};
