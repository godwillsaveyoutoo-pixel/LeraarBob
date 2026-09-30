// Algebra Trainer v1.0 rekenkern, hergebruikt met veilige gehele breuken.
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.AlgebraCore=factory()})(globalThis,()=>{
'use strict';


/* ============================================================
   1. EXACTE GETALLEN
   ============================================================ */
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=a%b;a=b;b=t}return a||1}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}
class Rat{
  constructor(n,d=1){
    if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d===0)throw new Error('Ongeldige breuk');
    if(d<0){n=-n;d=-d}
    const g=gcd(n,d);this.n=n/g;this.d=d/g;
  }
  add(o){o=R(o);return new Rat(this.n*o.d+o.n*this.d,this.d*o.d)}
  sub(o){o=R(o);return new Rat(this.n*o.d-o.n*this.d,this.d*o.d)}
  mul(o){o=R(o);return new Rat(this.n*o.n,this.d*o.d)}
  div(o){o=R(o);if(o.n===0)throw new Error('Delen door nul kan niet');return new Rat(this.n*o.d,this.d*o.n)}
  neg(){return new Rat(-this.n,this.d)}
  abs(){return new Rat(Math.abs(this.n),this.d)}
  eq(o){o=R(o);return this.n===o.n&&this.d===o.d}
  isZero(){return this.n===0}
  isOne(){return this.n===this.d}
  value(){return this.n/this.d}
}
function R(n,d){if(n instanceof Rat)return n;if(d!==undefined)return new Rat(n,d);return new Rat(n,1)}
function ratKey(q){q=R(q);return `${q.n}/${q.d}`}
function reciprocal(q){q=R(q);if(q.isZero())return null;return new Rat(q.d*(q.n<0?-1:1),Math.abs(q.n))}
function terminatingPlaces(q){
  q=R(q);let d=q.d,tw=0,fi=0;
  while(d%2===0){d/=2;tw++}
  while(d%5===0){d/=5;fi++}
  return d===1?Math.max(tw,fi):null;
}

/* ============================================================
   2. EXPRESSION TREE
   ============================================================ */
const N=(q,fmt='auto')=>({t:'num',q:R(q),fmt});
const V=()=>({t:'var',name:'x'});
const Add=(...terms)=>({t:'add',terms:terms.flat()});
const Mul=(...factors)=>({t:'mul',factors:factors.flat()});
const Div=(n,d,preserve=false)=>({t:'div',n,d,preserve});
const EQ=(l,r)=>({l,r});

function cloneExpr(e){
  if(e.t==='num')return N(new Rat(e.q.n,e.q.d),e.fmt);
  if(e.t==='var')return V();
  if(e.t==='add')return {t:'add',terms:e.terms.map(cloneExpr)};
  if(e.t==='mul')return {t:'mul',factors:e.factors.map(cloneExpr)};
  if(e.t==='div')return {t:'div',n:cloneExpr(e.n),d:cloneExpr(e.d),preserve:!!e.preserve};
  throw new Error('Onbekende expressie');
}
function cloneEq(eq){return EQ(cloneExpr(eq.l),cloneExpr(eq.r))}
function isNum(e){return e?.t==='num'}
function isVar(e){return e?.t==='var'}
function num(q,fmt='auto'){return N(q,fmt)}

function linearCoeff(e){
  if(isVar(e))return R(1);
  if(e?.t==='mul'){
    let vars=0,c=R(1);
    for(const f of e.factors){
      if(isNum(f))c=c.mul(f.q);
      else if(isVar(f))vars++;
      else return null;
    }
    return vars===1?c:null;
  }
  if(e?.t==='div'&&isNum(e.d)){
    const c=linearCoeff(e.n);
    return c?c.div(e.d.q):null;
  }
  return null;
}
function makeLinearTerm(c){
  c=R(c);
  if(c.isZero())return N(0);
  if(c.eq(1))return V();
  return Mul(N(c),V());
}

function simplify(e){
  if(isNum(e)||isVar(e))return cloneExpr(e);

  if(e.t==='add'){
    let raw=[];
    for(const t of e.terms){
      const s=simplify(t);
      if(s.t==='add')raw.push(...s.terms);
      else raw.push(s);
    }
    let constant=R(0),xcoef=R(0);
    const others=[];
    let constFmt='auto';

    for(const t of raw){
      if(isNum(t)){
        constant=constant.add(t.q);
        if(constFmt==='auto'&&t.fmt!=='auto')constFmt=t.fmt;
        continue;
      }
      const c=linearCoeff(t);
      if(c!==null){xcoef=xcoef.add(c);continue}
      others.push(t);
    }

    const out=[];
    if(!xcoef.isZero())out.push(makeLinearTerm(xcoef));
    out.push(...others);
    if(!constant.isZero())out.push(N(constant,constFmt));

    if(!out.length)return N(0);
    if(out.length===1)return out[0];
    return {t:'add',terms:out};
  }

  if(e.t==='mul'){
    let raw=[];
    for(const f of e.factors){
      const s=simplify(f);
      if(s.t==='mul')raw.push(...s.factors);
      else raw.push(s);
    }

    let coef=R(1),coefFmt='auto';
    const others=[];
    for(const f of raw){
      if(isNum(f)){
        coef=coef.mul(f.q);
        if(coefFmt==='auto'&&f.fmt!=='auto')coefFmt=f.fmt;
        continue;
      }
      if(f.t==='div'&&isNum(f.d)){
        coef=coef.div(f.d.q);
        others.push(f.n);
        continue;
      }
      others.push(f);
    }

    if(coef.isZero())return N(0);
    const out=[];
    if(!coef.eq(1)||!others.length)out.push(N(coef,coefFmt));
    out.push(...others.map(simplify));

    if(out.length===1)return out[0];
    if(out.length===2&&isNum(out[0])&&out[0].q.eq(1))return out[1];
    return {t:'mul',factors:out};
  }

  if(e.t==='div'){
    const n=simplify(e.n),d=simplify(e.d);
    if(isNum(d)){
      if(d.q.isZero())throw new Error('Delen door nul kan niet');
      if(d.q.eq(1))return n;
      if(isNum(n))return N(n.q.div(d.q),n.fmt);

      /* Een expliciete samengestelde breuk uit de opgave blijft zichtbaar
         totdat de leerling de noemer werkelijk wegwerkt. */
      if(e.preserve)return {t:'div',n,d,preserve:true};

      if(n.t==='mul')return simplify(Mul(N(R(1).div(d.q)),n));
      if(n.t==='add'){
        return simplify(Add(...n.terms.map(t=>Mul(N(R(1).div(d.q)),t))));
      }
      if(n.t==='div'&&isNum(n.d)){
        return simplify(Div(n.n,N(n.d.q.mul(d.q))));
      }
      /* x / a blijft bewust als breuk zichtbaar. */
      return {t:'div',n,d,preserve:false};
    }
    return {t:'div',n,d,preserve:!!e.preserve};
  }

  throw new Error('Onbekende expressie');
}
function negExpr(e){return simplify(Mul(N(-1),e))}
function simplifyEq(eq){return EQ(simplify(eq.l),simplify(eq.r))}

function exprSig(e){
  e=simplify(e);
  if(isNum(e))return `n:${ratKey(e.q)}`;
  if(isVar(e))return 'x';
  if(e.t==='add')return `a(${e.terms.map(exprSig).join(',')})`;
  if(e.t==='mul')return `m(${e.factors.map(exprSig).join(',')})`;
  if(e.t==='div')return `d(${exprSig(e.n)},${exprSig(e.d)})`;
}
function eqSig(eq){eq=simplifyEq(eq);return `${exprSig(eq.l)}=${exprSig(eq.r)}`}
function exprNodeCount(e){
  if(isNum(e)||isVar(e))return 1;
  if(e.t==='add')return 1+e.terms.reduce((s,t)=>s+exprNodeCount(t),0);
  if(e.t==='mul')return 1+e.factors.reduce((s,t)=>s+exprNodeCount(t),0);
  if(e.t==='div')return 2+exprNodeCount(e.n)+exprNodeCount(e.d);
  return 1;
}
function equationComplexity(eq){
  eq=simplifyEq(eq);
  let score=exprNodeCount(eq.l)+exprNodeCount(eq.r);
  const lc=containsVar(eq.l),rc=containsVar(eq.r);
  if(lc&&rc)score+=5;
  score+=countType(eq.l,'div')*2+countType(eq.r,'div')*2;
  return score;
}
function containsVar(e){
  if(isVar(e))return true;
  if(isNum(e))return false;
  if(e.t==='add')return e.terms.some(containsVar);
  if(e.t==='mul')return e.factors.some(containsVar);
  if(e.t==='div')return containsVar(e.n)||containsVar(e.d);
  return false;
}
function countType(e,t){
  let n=e.t===t?1:0;
  if(e.t==='add')for(const x of e.terms)n+=countType(x,t);
  if(e.t==='mul')for(const x of e.factors)n+=countType(x,t);
  if(e.t==='div'){n+=countType(e.n,t);n+=countType(e.d,t)}
  return n;
}
function solvedEquation(eq){
  eq=simplifyEq(eq);
  return (isVar(eq.l)&&isNum(eq.r))||(isVar(eq.r)&&isNum(eq.l));
}

/* ============================================================
   3. GELDIGE BEWERKINGEN OP BEIDE LEDEN
   ============================================================ */
function operandIsNumeric(e){return isNum(simplify(e))}
function applyEquation(eq,op,operand){
  eq=cloneEq(eq);operand=cloneExpr(operand);
  if((op==='*'||op==='/')&&!operandIsNumeric(operand))throw new Error('Vermenigvuldigen of delen gebeurt hier met een getal.');
  const oq=operandIsNumeric(operand)?simplify(operand).q:null;
  if((op==='*'||op==='/')&&oq.isZero()){
    if(op==='*')throw new Error('× 0 bewaart de oplossingsverzameling niet.');
    throw new Error('÷ 0 kan niet.');
  }

  let l,r;
  if(op==='+'){l=Add(eq.l,operand);r=Add(eq.r,operand)}
  else if(op==='-'){l=Add(eq.l,negExpr(operand));r=Add(eq.r,negExpr(operand))}
  else if(op==='*'){
    // Apply the chosen factor to every top-level term, just as division does.
    // Keep nested brackets from the exercise until a pupil works on them.
    const scale=side=>{const s=simplify(side);return s.t==='add'?Add(...s.terms.map(t=>Mul(t,operand))):Mul(s,operand)};
    l=scale(eq.l);r=scale(eq.r);
  }
  else if(op==='/'){l=Div(eq.l,operand);r=Div(eq.r,operand)}
  else throw new Error('Onbekende bewerking');
  return simplifyEq(EQ(l,r));
}

/* ============================================================
   4. LATEX
   ============================================================ */
function decimalText(q){
  q=R(q);const p=terminatingPlaces(q);
  if(p===null||p>2)return null;
  let s=q.value().toFixed(Math.max(1,p)).replace(/\.?0+$/,'');
  return s.replace('.',',');
}
function hashRat(q){q=R(q);return Math.abs((q.n*37+q.d*101)%17)}
function autoNumberFormat(q,policy){
  q=R(q);
  if(q.d===1)return 'integer';
  if(policy.allowDecimals&&terminatingPlaces(q)!==null&&terminatingPlaces(q)<=1){
    if(!policy.allowFractions)return 'decimal';
    return hashRat(q)%2===0?'decimal':'fraction';
  }
  return 'fraction';
}
function ratLatex(q,fmt='auto',policy=currentPolicy()){
  q=R(q);
  const neg=q.n<0;
  const a=q.abs();
  const use=fmt==='auto'?autoNumberFormat(a,policy):fmt;
  let body;
  if(a.d===1)body=String(a.n);
  else if(use==='decimal'&&decimalText(a)!==null)body=decimalText(a).replace(',','{,}');
  else body=`\\frac{${a.n}}{${a.d}}`;
  return neg?`-${body}`:body;
}
function splitSign(e){
  e=simplify(e);
  if(isNum(e)&&e.q.n<0)return {neg:true,abs:N(e.q.abs(),e.fmt)};
  if(e.t==='mul'&&e.factors.length&&isNum(e.factors[0])&&e.factors[0].q.n<0){
    const fs=e.factors.map(cloneExpr);fs[0]=N(fs[0].q.abs(),fs[0].fmt);
    return {neg:true,abs:simplify(Mul(...fs))};
  }
  if(e.t==='div'){
    const s=splitSign(e.n);
    if(s.neg)return {neg:true,abs:Div(s.abs,e.d)};
  }
  return {neg:false,abs:e};
}
function latexExpr(e,policy=currentPolicy(),parentPrec=0){
  e=simplify(e);
  if(isNum(e))return ratLatex(e.q,e.fmt,policy);
  if(isVar(e))return 'x';

  if(e.t==='add'){
    let s='';
    e.terms.forEach((term,i)=>{
      const sp=splitSign(term);
      const body=latexExpr(sp.abs,policy,1);
      if(i===0)s+=(sp.neg?'-':'')+body;
      else s+=sp.neg?` - ${body}`:` + ${body}`;
    });
    return parentPrec>1?`\\left(${s}\\right)`:s;
  }

  if(e.t==='mul'){
    const sp=splitSign(e);
    if(sp.neg&&exprSig(sp.abs)!==exprSig(e))return `-${latexExpr(sp.abs,policy,parentPrec)}`;

    const fs=e.factors;
    let out='';
    fs.forEach((f,i)=>{
      const ftex=latexExpr(f,policy,2);
      const grouped=f.t==='add'?`\\left(${latexExpr(f,policy,0)}\\right)`:ftex;
      if(i===0){out+=grouped;return}
      const prev=fs[i-1];
      const implicit=(isNum(prev)&&(isVar(f)||f.t==='add'))||(isVar(prev)&&f.t==='add');
      out+=implicit?grouped:`\\,${grouped}`;
    });
    return parentPrec>2?`\\left(${out}\\right)`:out;
  }

  if(e.t==='div'){
    return `\\frac{${latexExpr(e.n,policy,0)}}{${latexExpr(e.d,policy,0)}}`;
  }
  return '?';
}
function latexEq(eq,policy=currentPolicy()){
  eq=simplifyEq(eq);
  return `${latexExpr(eq.l,policy,0)} = ${latexExpr(eq.r,policy,0)}`;
}
function operationLatex(op,operand,policy=currentPolicy()){
  const sym=op==='*'?'\\times':op==='/'?'\\div':op==='-'?'-':'+';
  return `${sym}\\;${latexExpr(operand,policy,0)}`;
}
function fallbackText(tex){
  return tex
    .replace(/\\left|\\right/g,'')
    .replace(/\\times/g,'×').replace(/\\div/g,'÷')
    .replace(/\\,/g,' ')
    .replace(/\{,\}/g,',')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g,'($1)/($2)')
    .replace(/[{}]/g,'');
}
function texHTML(tex,display=false){
  if(window.katex){
    try{return window.katex.renderToString(tex,{throwOnError:false,displayMode:display,strict:'ignore'})}
    catch(_){}
  }
  return `<span class="texFallback">${escapeHTML(fallbackText(tex))}</span>`;
}
function renderMathNodes(root=document){
  root.querySelectorAll('[data-tex]').forEach(el=>{
    el.innerHTML=texHTML(el.dataset.tex,el.dataset.display==='1');
  });
}

/* ============================================================
   5. OEFENVORMEN
   ============================================================ */
const TYPES=[
  {level:'beginner',id:'A1',label:'ax = b',desc:'factor wegwerken'},
  {level:'beginner',id:'A2',label:'x + a = b',desc:'optelling wegwerken'},
  {level:'beginner',id:'A3',label:'x − a = b',desc:'aftrekking wegwerken'},
  {level:'beginner',id:'A4',label:'x / a = b',desc:'deling wegwerken'},

  {level:'basis',id:'B1',label:'ax + b = c',desc:'twee stappen'},
  {level:'basis',id:'B2',label:'ax − b = c',desc:'twee stappen'},
  {level:'basis',id:'B3',label:'b − ax = c',desc:'negatieve x-term'},
  {level:'basis',id:'B4',label:'x / a + b = c',desc:'breukvorm + constante'},
  {level:'basis',id:'B5',label:'x / a − b = c',desc:'breukvorm − constante'},

  {level:'advanced',id:'C1',label:'a(x + b) = c',desc:'buitenfactor + haakjes'},
  {level:'advanced',id:'C2',label:'a(x − b) = c',desc:'buitenfactor + aftrekking'},
  {level:'advanced',id:'D1',label:'a(bx + c) = d',desc:'drie structurele stappen'},
  {level:'advanced',id:'D2',label:'(ax + b) / c = d',desc:'volledige teller in breuk'},
  {level:'advanced',id:'D3',label:'a(bx − c) + d = e',desc:'vier stappen'},
  {level:'advanced',id:'E1',label:'ax + b = cx + d',desc:'x aan beide kanten'},
  {level:'advanced',id:'E2',label:'ax − b = cx',desc:'x aan beide kanten, één constante'},
  {level:'advanced',id:'E3',label:'ax = cx + d',desc:'x aan beide kanten, één constante'}
];
const LEVEL_META={
  beginner:{label:'Beginner',subtitle:'Één inverse bewerking. Ideaal voor remediëring.'},
  basis:{label:'Basis',subtitle:'Twee stappen, tekeninzicht en eenvoudige breukvormen.'},
  advanced:{label:'Verdieping',subtitle:'Haakjes, samengestelde breuken en x aan beide kanten.'}
};

/* ============================================================
   6. GENERATOR
   ============================================================ */
const INT_COEFF=[2,3,4,5,6,7].map(n=>R(n));
const INT_SHIFT=[1,2,3,4,5,6,7,8,9].map(n=>R(n));
const FRAC_COEFF=[R(1,2),R(2,3),R(3,2),R(4,3),R(5,2),R(5,3)].map(R);
const FRAC_SHIFT=[R(1,2),R(1,3),R(2,3),R(3,2),R(3,4),R(5,2)].map(R);
const DEC_COEFF=[R(1,2),R(4,5),R(6,5),R(3,2),R(9,5),R(5,2)].map(R);
const DEC_SHIFT=[R(1,2),R(3,2),R(5,2),R(7,2),R(6,5),R(12,5)].map(R);

function pick(a){return a[Math.floor(Math.random()*a.length)]}
function chance(p){return Math.random()<p}
function currentPolicy(){
  return {
    allowFractions:!!globalThis.document?.getElementById('allowFractions')?.checked,
    allowDecimals:!!globalThis.document?.getElementById('allowDecimals')?.checked,
    allowNegative:!!globalThis.document?.getElementById('allowNegative')?.checked
  };
}
function pickFmt(policy){
  const bag=['integer','integer','integer'];
  if(policy.allowFractions)bag.push('fraction','fraction');
  if(policy.allowDecimals)bag.push('decimal','decimal');
  return pick(bag);
}
function pickParam(policy,kind='coeff'){
  let fmt=pickFmt(policy),q;
  if(fmt==='fraction')q=pick(kind==='coeff'?FRAC_COEFF:FRAC_SHIFT);
  else if(fmt==='decimal')q=pick(kind==='coeff'?DEC_COEFF:DEC_SHIFT);
  else q=pick(kind==='coeff'?INT_COEFF:INT_SHIFT);
  return {q,fmt};
}
function pickSolution(policy){
  let q=R(pick([2,3,4,5,6,7,8]));
  if(policy.allowFractions&&chance(.18))q=pick([R(3,2),R(5,2),R(7,2),R(4,3),R(5,3)]);
  if(policy.allowDecimals&&chance(.18))q=pick([R(3,2),R(5,2),R(7,2),R(6,5),R(12,5)]);
  if(policy.allowNegative&&chance(.28))q=q.neg();
  return q;
}
function numNodeFromParam(p){return N(p.q,p.fmt)}
function nice(q,max=90){q=R(q);return Math.abs(q.value())<=max&&q.d<=12&&Math.abs(q.n)<=180}
function rhsFmt(q,policy){
  q=R(q);
  if(q.d===1)return 'integer';
  if(policy.allowDecimals&&terminatingPlaces(q)!==null&&terminatingPlaces(q)<=1&&chance(.5))return 'decimal';
  return policy.allowFractions?'fraction':'auto';
}
function positiveDifferentCoeffs(policy){
  for(let i=0;i<100;i++){
    const a=pickParam(policy,'coeff'),c=pickParam(policy,'coeff');
    if(!a.q.eq(c.q)&&a.q.value()>c.q.value())return {a,c};
  }
  return {a:{q:R(5),fmt:'integer'},c:{q:R(2),fmt:'integer'}};
}
function step(op,operand){return {op,operand:simplify(operand)}}

function generateExercise(typeId,policy,index=0){
  for(let tries=0;tries<1200;tries++){
    const A=pickParam(policy,'coeff'),B=pickParam(policy,'shift'),C=pickParam(policy,'coeff'),D=pickParam(policy,'shift');
    const x=pickSolution(policy);
    const a=A.q.abs(),b=B.q.abs(),c=C.q.abs(),d=D.q.abs();
    let eq,steps=[];

    if(typeId==='A1'){
      const rhs=a.mul(x); if(!nice(rhs))continue;
      eq=EQ(Mul(numNodeFromParam(A),V()),N(rhs,rhsFmt(rhs,policy)));
      steps=[step('/',numNodeFromParam(A))];
    }
    if(typeId==='A2'){
      const rhs=x.add(b);if(!nice(rhs))continue;
      eq=EQ(Add(V(),numNodeFromParam(B)),N(rhs,rhsFmt(rhs,policy)));
      steps=[step('-',numNodeFromParam(B))];
    }
    if(typeId==='A3'){
      const rhs=x.sub(b);if(!nice(rhs))continue;
      eq=EQ(Add(V(),N(b.neg(),B.fmt)),N(rhs,rhsFmt(rhs,policy)));
      steps=[step('+',numNodeFromParam(B))];
    }
    if(typeId==='A4'){
      const q=pickSolution({...policy,allowNegative:false});
      const xx=a.mul(q);if(!nice(xx))continue;
      eq=EQ(Div(V(),numNodeFromParam(A)),N(q,rhsFmt(q,policy)));
      steps=[step('*',numNodeFromParam(A))];
    }

    if(typeId==='B1'){
      const rhs=a.mul(x).add(b);if(!nice(rhs))continue;
      eq=EQ(Add(Mul(numNodeFromParam(A),V()),numNodeFromParam(B)),N(rhs,rhsFmt(rhs,policy)));
      steps=[step('-',numNodeFromParam(B)),step('/',numNodeFromParam(A))];
    }
    if(typeId==='B2'){
      const rhs=a.mul(x).sub(b);if(!nice(rhs))continue;
      eq=EQ(Add(Mul(numNodeFromParam(A),V()),N(b.neg(),B.fmt)),N(rhs,rhsFmt(rhs,policy)));
      steps=[step('+',numNodeFromParam(B)),step('/',numNodeFromParam(A))];
    }
    if(typeId==='B3'){
      const rhs=b.sub(a.mul(x));if(!nice(rhs))continue;
      eq=EQ(Add(numNodeFromParam(B),Mul(N(a.neg(),A.fmt),V())),N(rhs,rhsFmt(rhs,policy)));
      steps=[step('-',numNodeFromParam(B)),step('/',N(a.neg(),A.fmt))];
    }
    if(typeId==='B4'){
      const q=pickSolution(policy),xx=a.mul(q),rhs=q.add(b);if(!nice(xx)||!nice(rhs))continue;
      eq=EQ(Add(Div(V(),numNodeFromParam(A)),numNodeFromParam(B)),N(rhs,rhsFmt(rhs,policy)));
      steps=[step('-',numNodeFromParam(B)),step('*',numNodeFromParam(A))];
    }
    if(typeId==='B5'){
      const q=pickSolution(policy),xx=a.mul(q),rhs=q.sub(b);if(!nice(xx)||!nice(rhs))continue;
      eq=EQ(Add(Div(V(),numNodeFromParam(A)),N(b.neg(),B.fmt)),N(rhs,rhsFmt(rhs,policy)));
      steps=[step('+',numNodeFromParam(B)),step('*',numNodeFromParam(A))];
    }

    if(typeId==='C1'){
      const rhs=a.mul(x.add(b));if(!nice(rhs))continue;
      eq=EQ(Mul(numNodeFromParam(A),Add(V(),numNodeFromParam(B))),N(rhs,rhsFmt(rhs,policy)));
      steps=[step('/',numNodeFromParam(A)),step('-',numNodeFromParam(B))];
    }
    if(typeId==='C2'){
      const rhs=a.mul(x.sub(b));if(!nice(rhs))continue;
      eq=EQ(Mul(numNodeFromParam(A),Add(V(),N(b.neg(),B.fmt))),N(rhs,rhsFmt(rhs,policy)));
      steps=[step('/',numNodeFromParam(A)),step('+',numNodeFromParam(B))];
    }
    if(typeId==='D1'){
      const rhs=a.mul(c.mul(x).add(b));if(!nice(rhs))continue;
      eq=EQ(Mul(numNodeFromParam(A),Add(Mul(numNodeFromParam(C),V()),numNodeFromParam(B))),N(rhs,rhsFmt(rhs,policy)));
      steps=[step('/',numNodeFromParam(A)),step('-',numNodeFromParam(B)),step('/',numNodeFromParam(C))];
    }
    if(typeId==='D2'){
      /* Kies de rechterzijde eerst en bereken b achterwaarts; zo blijft de breuk netjes. */
      const target=pickSolution(policy);
      const bb=c.mul(target).sub(a.mul(x));
      if(bb.isZero()||bb.n<0||!nice(bb,35))continue;
      const bNode=N(bb,rhsFmt(bb,policy));
      eq=EQ(Div(Add(Mul(numNodeFromParam(A),V()),bNode),numNodeFromParam(C),true),N(target,rhsFmt(target,policy)));
      steps=[step('*',numNodeFromParam(C)),step('-',bNode),step('/',numNodeFromParam(A))];
    }
    if(typeId==='D3'){
      const rhs=a.mul(c.mul(x).sub(b)).add(d);if(!nice(rhs))continue;
      eq=EQ(Add(Mul(numNodeFromParam(A),Add(Mul(numNodeFromParam(C),V()),N(b.neg(),B.fmt))),numNodeFromParam(D)),N(rhs,rhsFmt(rhs,policy)));
      steps=[step('-',numNodeFromParam(D)),step('/',numNodeFromParam(A)),step('+',numNodeFromParam(B)),step('/',numNodeFromParam(C))];
    }

    if(typeId==='E1'||typeId==='E2'||typeId==='E3'){
      const pair=positiveDifferentCoeffs(policy),aa=pair.a.q,cc=pair.c.q;
      const diff=aa.sub(cc);
      if(diff.isZero())continue;

      if(typeId==='E1'){
        const bb=pickParam(policy,'shift');const bv=bb.q.abs();
        const dd=diff.mul(x).add(bv);
        if(!nice(dd)||dd.isZero())continue;
        eq=EQ(
          Add(Mul(numNodeFromParam(pair.a),V()),numNodeFromParam(bb)),
          Add(Mul(numNodeFromParam(pair.c),V()),N(dd,rhsFmt(dd,policy)))
        );
        steps=[step('-',Mul(numNodeFromParam(pair.c),V())),step('-',numNodeFromParam(bb)),step('/',N(diff))];
      }
      if(typeId==='E2'){
        /* ax - b = cx  =>  (a-c)x = b. Werkt ook zonder negatieve waarden. */
        const xpos=pickSolution({...policy,allowNegative:false}).abs();
        const bv2=diff.mul(xpos);
        if(bv2.n<=0||!nice(bv2,40))continue;
        const bnode=N(bv2,rhsFmt(bv2,policy));
        eq=EQ(Add(Mul(numNodeFromParam(pair.a),V()),N(bv2.neg(),bnode.fmt)),Mul(numNodeFromParam(pair.c),V()));
        steps=[step('-',Mul(numNodeFromParam(pair.c),V())),step('+',bnode),step('/',N(diff))];
      }
      if(typeId==='E3'){
        const dd=diff.mul(x);if(!nice(dd)||dd.isZero())continue;
        eq=EQ(Mul(numNodeFromParam(pair.a),V()),Add(Mul(numNodeFromParam(pair.c),V()),N(dd,rhsFmt(dd,policy))));
        steps=[step('-',Mul(numNodeFromParam(pair.c),V())),step('/',N(diff))];
      }
    }

    if(!eq)continue;
    eq=EQ(cloneExpr(eq.l),cloneExpr(eq.r)); // behoud vraagstructuur, nog niet simplificeren
    const states=[cloneEq(eq)];
    let cur=cloneEq(eq),ok=true;
    try{
      for(const st of steps){cur=applyEquation(cur,st.op,st.operand);states.push(cloneEq(cur))}
    }catch(_){ok=false}
    if(!ok||!solvedEquation(cur))continue;
    // A derived constant can require more decimal places than the chosen level.
    // Keep the full standard route within the selected number types, otherwise
    // the operand picker would hide a value needed to solve this exercise.
    if(!operandRepresentable(eq.l,policy,false)||!operandRepresentable(eq.r,policy,false)||steps.some(s=>!operandRepresentable(s.operand,policy))||!operandRepresentable(cur.l,policy)||!operandRepresentable(cur.r,policy))continue;

    return {
      id:`${typeId}-${index}-${Math.random().toString(36).slice(2,7)}`,
      type:typeId,policy:{...policy},start:eq,steps,states,solution:(states.at(-1).l.t==='var'?states.at(-1).r.q:states.at(-1).l.q)
    };
  }
  throw new Error(`Geen nette oefening gevonden voor ${typeId}`);
}

/* ============================================================
   7. KANDIDATEN UIT DE ACTUELE VERGELIJKING
   ============================================================ */
function topTerms(e){e=simplify(e);return e.t==='add'?e.terms:[e]}
function absExpr(e){const s=splitSign(e);return s.abs}
function exprIsZero(e){return isNum(simplify(e))&&simplify(e).q.isZero()}
function collectNumericDenominators(e,out=[]){
  e=simplify(e);
  if(isNum(e)){if(e.q.d>1)out.push(e.q.d);return out}
  if(e.t==='div'&&isNum(e.d)){if(e.d.q.d===1&&Math.abs(e.d.q.n)>1)out.push(Math.abs(e.d.q.n))}
  if(e.t==='add')e.terms.forEach(x=>collectNumericDenominators(x,out));
  if(e.t==='mul')e.factors.forEach(x=>collectNumericDenominators(x,out));
  if(e.t==='div'){collectNumericDenominators(e.n,out);collectNumericDenominators(e.d,out)}
  return out;
}
function outerScalar(e){
  e=simplify(e);
  if(e.t==='mul'&&e.factors.length&&isNum(e.factors[0]))return e.factors[0].q;
  if(e.t==='div'&&isNum(e.d))return R(1).div(e.d.q);
  const c=linearCoeff(e);
  return c;
}
function operandRepresentable(e,policy,simplifyInput=true){
  if(simplifyInput)e=simplify(e);
  const nums=[];
  (function walk(x){
    if(isNum(x))nums.push(x.q);
    else if(x.t==='add')x.terms.forEach(walk);
    else if(x.t==='mul')x.factors.forEach(walk);
    else if(x.t==='div'){walk(x.n);walk(x.d)}
  })(e);
  return nums.every(q=>{
    if(q.d===1)return true;
    if(policy.allowFractions)return true;
    return policy.allowDecimals&&terminatingPlaces(q)!==null&&terminatingPlaces(q)<=1;
  });
}
function canonicalStepAt(ex,eq){
  const sig=eqSig(eq);
  for(let i=0;i<ex.states.length-1;i++){
    if(eqSig(ex.states[i])===sig)return ex.steps[i];
  }
  return null;
}
function candidateOperands(ex,eq,op){
  const policy=ex.policy;
  const important=[],extra=[];
  const seen=new Set();
  function add(arr,e){
    e=simplify(e);
    const k=exprSig(e);
    if(exprIsZero(e))return;
    if((op==='*'||op==='/')&&!operandIsNumeric(e))return;
    // Number settings constrain generated exercises, never a required choice
    // introduced by a pupil's own equivalent intermediate step.
    if(arr!==important&&!operandRepresentable(e,policy))return;
    if(seen.has(k)){
      if(arr===important){
        const i=extra.findIndex(v=>exprSig(v)===k);
        if(i>=0){extra.splice(i,1);important.push(e)}
      }
      return;
    }
    seen.add(k);arr.push(e);
  }

  const canon=canonicalStepAt(ex,eq);
  if(canon){
    if(canon.op===op)add(important,canon.operand);
    if(canon.op==='/'&&op==='*'){
      const q=simplify(canon.operand);
      if(isNum(q)){const inv=reciprocal(q.q);if(inv)add(important,N(inv))}
    }
    if(canon.op==='*'&&op==='/'){
      const q=simplify(canon.operand);
      if(isNum(q)){const inv=reciprocal(q.q);if(inv)add(important,N(inv))}
    }
  }

  if(op==='+'||op==='-'){
    for(const side of [eq.l,eq.r]){
      for(const t of topTerms(side)){
        const sp=splitSign(t);
        if(op==='-'&&!sp.neg)add(important,sp.abs);
        if(op==='+'&&sp.neg)add(important,sp.abs);
        add(extra,sp.abs);
      }
    }
  }

  if(op==='*'||op==='/'){
    for(const side of [eq.l,eq.r]){
      for(const term of [side,...topTerms(side)]){
        const s=outerScalar(term);
        if(s&&!s.isZero()&&!s.eq(1)){
          if(op==='*'){const inv=reciprocal(s);if(inv)add(important,N(inv))}
          else add(important,N(s));
        }
      }
    }
    if(op==='*'){
      const dens=[...collectNumericDenominators(eq.l),...collectNumericDenominators(eq.r)];
      if(dens.length){
        const common=dens.reduce((a,d)=>lcm(a,d),1);
        if(common>1&&Number.isSafeInteger(common))add(important,N(common));
      }
    }
  }

  /* Current literals first; original literals and neutral choices remain useful extras. */
  const literals=[];
  function collectLiterals(x){
    if(isNum(x)){if(!x.q.isZero())literals.push(x)}
    else if(x.t==='add')x.terms.forEach(collectLiterals);
    else if(x.t==='mul')x.factors.forEach(collectLiterals);
    else if(x.t==='div'){collectLiterals(x.n);collectLiterals(x.d)}
  }
  [eq.l,eq.r,ex.start.l,ex.start.r].forEach(collectLiterals);

  literals.forEach(x=>add(extra,absExpr(x)));
  if(op==='*'||op==='/'){
    literals.forEach(x=>{
      const s=simplify(x);
      if(isNum(s)){const inv=reciprocal(s.q);if(inv)add(extra,N(inv))}
    });
  }
  [1,2,3,4,5,6].forEach(n=>add(extra,N(n)));

  // Keep the usual compact picker, but never cut off a necessary current term.
  return [...important,...extra.slice(0,Math.max(0,8-important.length))];
}

/* ============================================================
   8. SETUP
   ============================================================ */

function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}

return Object.freeze({gcd,lcm,Rat,R,ratKey,reciprocal,terminatingPlaces,N,V,Add,Mul,Div,EQ,cloneExpr,cloneEq,isNum,isVar,num,linearCoeff,makeLinearTerm,simplify,negExpr,simplifyEq,exprSig,eqSig,exprNodeCount,equationComplexity,containsVar,countType,solvedEquation,operandIsNumeric,applyEquation,decimalText,hashRat,autoNumberFormat,ratLatex,splitSign,latexExpr,latexEq,operationLatex,fallbackText,texHTML,renderMathNodes,TYPES,LEVEL_META,INT_COEFF,INT_SHIFT,FRAC_COEFF,FRAC_SHIFT,DEC_COEFF,DEC_SHIFT,pick,chance,currentPolicy,pickFmt,pickParam,pickSolution,numNodeFromParam,nice,rhsFmt,positiveDifferentCoeffs,step,generateExercise,topTerms,absExpr,exprIsZero,collectNumericDenominators,outerScalar,operandRepresentable,canonicalStepAt,candidateOperands,escapeHTML});
});
