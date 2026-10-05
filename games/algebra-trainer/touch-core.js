/* Whole mathematical terms and plausible errors, never a character keyboard. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('./core.js'),require('./learning-core.js'));else root.AlgebraTouch=factory(root.AlgebraCore,root.AlgebraLearning)})(globalThis,(C,L)=>{
'use strict';
const expressionText=e=>e.t==='num'?e.q.n+'/'+e.q.d:e.t==='var'?'x':e.t==='add'?'('+e.terms.map(expressionText).join('+')+')':e.t==='mul'?'('+e.factors.map(expressionText).join('*')+')':'('+expressionText(e.n)+')/('+expressionText(e.d)+')';
const terms=e=>C.topTerms(C.simplify(e));
function shuffle(items,id){let seed=2166136261;for(const c of String(id))seed=Math.imul(seed^c.charCodeAt(0),16777619);const out=[...items];for(let i=out.length-1;i>0;i--){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;const j=(seed>>>0)%(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}
function choices(required,extras,policy,id){
 const pool=[],seen=new Set();function add(e){e=C.simplify(e);const key=C.exprSig(e);if(seen.has(key))return;seen.add(key);pool.push({key,expr:e,text:expressionText(e),tex:C.latexExpr(e,policy)});}
 required.forEach(add);for(const e of extras){if(pool.length>=6)break;add(e);}return shuffle(pool,id);
}
function palette(t){
 const p=t.ex.policy;
 if(t.kind==='build'){
  const n=t.expectedNumber,product=t.factor.mul(t.x);
  return choices([C.N(n)],[C.N(n.neg()),C.N(t.rhs),C.N(product),C.N(t.rhs.add(product)),C.N(product.sub(t.rhs)),C.N(n.add(t.factor))],p,t.id);
 }
 const target=L.expandEquation(t.expected),required=[...terms(target.l),...terms(target.r)],extras=[];
 required.filter(C.containsVar).forEach(e=>extras.push(C.negExpr(e)));
 if(t.operation){try{const op=({'+':'-','-':'+','*':'/','/':'*'})[t.operation.op],wrong=C.applyEquation(t.ex.start,op,t.operation.operand),ts=[...terms(L.expandEquation(wrong).l),...terms(L.expandEquation(wrong).r)];extras.push(...ts.filter(e=>!C.containsVar(e)),...ts.filter(C.containsVar));}catch{}}
 if(t.fault){const f=L.expandEquation(t.fault);extras.push(...terms(f.l).filter(e=>!C.containsVar(e)),...terms(f.r));}
 const source=L.expandEquation(t.ex.start),original=[...terms(source.l),...terms(source.r)];extras.push(...original.filter(e=>!C.containsVar(e)),...original.filter(C.containsVar));
 required.forEach(e=>extras.push(C.negExpr(e)));
 // A retained source term or a sign error is useful; unrelated digits are not.
 return choices(required,extras,p,t.id);
}
function blockTex(blocks,policy){return blocks.map((e,i)=>{const s=C.splitSign(e);return (s.neg?(i?' - ':'-'):(i?' + ':''))+C.latexExpr(s.abs,policy);}).join('')||'\\square';}
function blockText(blocks){return blocks.map(expressionText).join('+');}
function blocksFromText(text){if(!text)return [];try{return terms(L.parseExpression(text)).map(C.cloneExpr);}catch{return [];}}
function substitution(e,x,policy){
 if(e.t==='var')return '\\htmlClass{motion-new}{'+(x.n<0?'\\left('+C.ratLatex(x,'auto',policy)+'\\right)':C.ratLatex(x,'auto',policy))+'}';
 if(e.t==='num')return C.latexExpr(e,policy);
 if(e.t==='add')return e.terms.map((t,i)=>{const s=C.splitSign(t);return (s.neg?(i?' - ':'-'):(i?' + ':''))+substitution(s.abs,x,policy);}).join('');
 if(e.t==='mul')return e.factors.map(f=>f.t==='add'?'\\left('+substitution(f,x,policy)+'\\right)':substitution(f,x,policy)).join('\\cdot ');
 if(e.t==='div')return '\\frac{'+substitution(e.n,x,policy)+'}{'+substitution(e.d,x,policy)+'}';
 return '?';
}
function valueChoices(t,side){
 const e=t.ex.start[side==='left'?'l':'r'],q=L.affine(e),x=C.R(t.proposed.n,t.proposed.d),actual=q.a.mul(x).add(q.b),other=L.evaluate(t.ex.start[side==='left'?'r':'l'],x);
 return choices([C.N(actual)],[C.N(q.a.mul(x.neg()).add(q.b)),C.N(q.a.mul(x)),C.N(other),C.N(q.a.mul(x).sub(q.b)),C.N(x.add(q.b)),C.N(actual.neg()),C.N(actual.add(q.a))],t.ex.policy,t.id+':'+side);
}
function verifyPrompt(t,phase){const x=C.fallbackText(C.ratLatex(t.proposed,'auto',t.ex.policy));return phase===0?'Is x = '+x+' een oplossing? Vul '+x+' in voor x.':phase===1?'Reken links uit. Welk getal krijg je?':phase===2?'Reken rechts uit. Welk getal krijg je?':phase===3?'Zijn de twee waarden gelijk of verschillend?':'Vergelijk de waarden: is dit een oplossing?';}
// Reduce children before their parent: a product stays visible as a term in
// the following sum. Never flatten the full calculation into one answer.
function numericTree(e,x){
 if(e.t==='var')return C.N(x);
 if(e.t==='num')return C.cloneExpr(e);
 if(e.t==='add')return C.Add(e.terms.map(t=>numericTree(t,x)));
 if(e.t==='mul')return C.Mul(e.factors.map(f=>numericTree(f,x)));
 return C.Div(numericTree(e.n,x),numericTree(e.d,x),e.preserve);
}
function reduceNumbers(e){
 if(e.t==='num')return C.cloneExpr(e);
 const children=e.t==='add'?e.terms:e.t==='mul'?e.factors:[e.n,e.d];
 if(children.every(c=>c.t==='num'))return C.N(L.evaluate(e,C.R(0)));
 const reduced=children.map(reduceNumbers);
 return e.t==='add'?C.Add(reduced):e.t==='mul'?C.Mul(reduced):C.Div(...reduced);
}
function numericStages(ex,x){
 let left=numericTree(ex.start.l,x),right=numericTree(ex.start.r,x);const stages=[];
 for(let i=0;i<12&&(left.t!=='num'||right.t!=='num');i++){left=reduceNumbers(left);right=reduceNumbers(right);stages.push({left,right});}
 if(left.t!=='num'||right.t!=='num')throw Error('De berekening is te diep.');return stages;
}
function numericSign(e){
 if(e.t==='num'&&e.q.n<0)return {neg:true,abs:C.N(e.q.abs(),e.fmt)};
 if(e.t==='mul'&&e.factors[0]?.t==='num'&&e.factors[0].q.n<0)return {neg:true,abs:C.Mul(C.N(e.factors[0].q.abs(),e.factors[0].fmt),...e.factors.slice(1))};
 if(e.t==='div'){const sign=numericSign(e.n);if(sign.neg)return {neg:true,abs:C.Div(sign.abs,e.d)};}
 return {neg:false,abs:e};
}
function numericTex(e,p){
 if(e.t==='num')return C.ratLatex(e.q,e.fmt||'auto',p);
 if(e.t==='add')return e.terms.map((t,i)=>{const s=numericSign(t),tex=numericTex(s.abs,p);return (s.neg?(i?' - ':'-'):(i?' + ':''))+(s.abs.t==='add'?'\\left('+tex+'\\right)':tex);}).join('');
 if(e.t==='mul')return e.factors.map(f=>{const tex=numericTex(f,p);return f.t==='add'||f.t==='num'&&f.q.n<0?'\\left('+tex+'\\right)':tex;}).join('\\cdot ');
 return '\\frac{'+numericTex(e.n,p)+'}{'+numericTex(e.d,p)+'}';
}
function verifyDemo(ex,x){
 const p=ex.policy,l=L.evaluate(ex.start.l,x),r=L.evaluate(ex.start.r,x),sub='\\begin{aligned}L &= '+substitution(ex.start.l,x,p)+'\\\\R &= '+substitution(ex.start.r,x,p)+'\\end{aligned}';
 const relation=C.ratLatex(l,'auto',p)+(l.eq(r)?' = ':' \\ne ')+C.ratLatex(r,'auto',p);
 const frames=[{tex:C.latexEq(ex.start,p),previous:null,caption:'Test x = '+C.fallbackText(C.ratLatex(x,'auto',p))+'. We vullen die waarde in voor elke x.',step:0,delay:1700},{tex:sub,previous:C.latexEq(ex.start,p),caption:'Elke x is vervangen door de testwaarde.',step:1,shift:true,delay:2200}];
 numericStages(ex,x).forEach(({left,right})=>frames.push({tex:'\\begin{aligned}L &= '+numericTex(left,p)+'\\\\R &= '+numericTex(right,p)+'\\end{aligned}',previous:frames.at(-1).tex,caption:left.t==='num'&&right.t==='num'?'Links en rechts zijn nu uitgerekend. Vergelijk de waarden.':'Reken in volgorde: haakjes, maal of gedeeld, dan plus of min.',step:frames.length,shift:true,delay:1800}));
 frames.push({tex:relation,previous:frames.at(-1).tex,caption:l.eq(r)?'De waarden zijn gelijk. Deze x-waarde is een oplossing.':'De waarden verschillen. Deze x-waarde is geen oplossing.',step:frames.length,shift:true,delay:1600});return frames;
}
function history(t,r){
 const p=t.ex.policy,entries=[{tex:t.display||C.latexEq(t.ex.start,p),caption:'Oorspronkelijke opgave'}];
 if(t.kind==='verify'){
  const phase=r.done?4:r.verifyPhase||0,left=L.evaluate(t.ex.start.l,t.proposed),right=L.evaluate(t.ex.start.r,t.proposed),row=(l,rr)=>'\\begin{aligned}L &= '+l+'\\\\R &= '+rr+'\\end{aligned}';
  const subL=substitution(t.ex.start.l,t.proposed,p),subR=substitution(t.ex.start.r,t.proposed,p),l=C.ratLatex(left,'auto',p),rr=C.ratLatex(right,'auto',p);
  if(phase>=1)entries.push({tex:row(subL,subR),caption:'x = '+C.fallbackText(C.ratLatex(t.proposed,'auto',p))+' ingevuld'});
  if(phase===2)entries.push({tex:row(l,subR),caption:'Links uitgerekend; rechts moet nog'});
  if(phase>=3)entries.push({tex:row(l,rr),caption:'Links en rechts uitgerekend'});
  if(r.done)entries.push({tex:l+(left.eq(right)?' = ':' \\ne ')+rr,caption:left.eq(right)?'Gelijk: deze x-waarde is een oplossing':'Verschillend: deze x-waarde is geen oplossing'});
 }else{
  if(t.kind==='repair')entries.push({tex:C.latexEq(t.fault,p),caption:'Foute regel om te herstellen'});
  if(r.input&&r.input!=='=')try{
   const tex=t.kind==='build'?t.display.replace('\\square',C.latexExpr(L.parseExpression(r.input),p)):r.blocks?blockTex(r.blocks.lhs||[],p)+' = '+blockTex(r.blocks.rhs||[],p):C.latexEq(L.parseEquation(r.input),p);
   entries.push({tex,caption:r.done?'Jouw gecontroleerde regel':'Jouw regel — nog niet goedgekeurd'});
  }catch{} // A legacy unfinished text is still editable on the workboard.
 }
 return entries;
}
function preview(text,cursor=null){
 text=String(text||'').replace(/\s/g,'').replace(/[−–]/g,'-').replace(/[×·⋅]/g,'*').replace(/÷/g,'/');
 if(/[^0-9x,+*/().-]/.test(text))return '\\text{?}';
 const tokens=[...text.matchAll(/\d+(?:[.,]\d*)?|[x,+*/().-]/g)].map(m=>({value:m[0],start:m.index}));
 let i=0,placed=false;
 const caret='\\mathrel{\\vert}',prefix=t=>{if(cursor===t.start&&!placed){placed=true;return caret}return ''};
 function atom(){
  const t=tokens[i];if(!t){if(cursor===text.length&&!placed){placed=true;return '\\square'+caret;}return '\\square';}
  if(['+','-'].includes(t.value)){i++;return prefix(t)+t.value+atom()}
  if(t.value==='('){i++;const p=prefix(t),s=sum();if(tokens[i]?.value===')'){const end=tokens[i++];return p+'\\left('+s+prefix(end)+'\\right)'}return p+'\\left('+s+'\\right)';}
  if(t.value==='x'){i++;const p=prefix(t);if(cursor===t.start+1&&cursor===text.length&&!placed){placed=true;return p+'x'+caret;}return p+'x'}
  if(/^\d/.test(t.value)){
   i++;let v=t.value,p=prefix(t);
   if(!placed&&cursor>t.start&&(cursor<t.start+v.length||cursor===text.length&&cursor===t.start+v.length)){const n=cursor-t.start;v=v.slice(0,n)+caret+v.slice(n);placed=true;}
   return p+v.replace(/[.,]/g,'{,}');
  }
  return '\\square';
 }
 function product(){let s=atom();while(i<tokens.length){const t=tokens[i];if(t.value==='*'||t.value==='/'){i++;const p=prefix(t),r=atom();s=t.value==='/'?'\\frac{'+s+p+'}{'+r+'}':s+p+'\\cdot '+r;}else if(t.value==='x'||t.value==='('||/^\d/.test(t.value))s+=atom();else break;}return s;}
 function sum(){let s=product();while(tokens[i]?.value==='+'||tokens[i]?.value==='-'){const t=tokens[i++];s+=prefix(t)+' '+t.value+' '+product();}return s;}
 let tex=sum();while(i<tokens.length){const t=tokens[i++];tex+=prefix(t)+(t.value==='*'?'\\cdot':t.value==='/'?'\\div':t.value.replace(',','{,}'));}
 if(cursor===text.length&&!placed)tex+=caret;
 return tex;
}
return Object.freeze({palette,valueChoices,blockTex,blockText,blocksFromText,expressionText,substitution,verifyPrompt,verifyDemo,numericStages,history,preview});
});
