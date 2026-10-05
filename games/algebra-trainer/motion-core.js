/* Presentation only: every committed equation still comes from AlgebraCore. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('./core.js'));else root.AlgebraMotion=factory(root.AlgebraCore)})(globalThis,C=>{
'use strict';
const mark=(name,tex)=>'\\htmlClass{motion-'+name+'}{'+tex+'}';
const group=tex=>'\\left('+tex+'\\right)';
const terms=e=>{const s=C.simplify(e);return s.t==='add'?s.terms:[s]};
function join(items,policy){return items.map((item,i)=>{
 if(item.zero)return (i?' + ':'')+mark(items.length===1?'zero-kept':'zero','0');
 const s=C.splitSign(item),body=C.latexExpr(s.abs,policy);
 return (s.neg?(i?' - ':'-'):(i?' + ':''))+body;
}).join('');}
function cancellation(side,delta,after,policy){
 const kind=C.isNum(delta)?'number':C.linearCoeff(delta)!==null?'x':null;
 if(!kind)return C.latexExpr(after,policy);
 const d=kind==='number'?delta.q:C.linearCoeff(delta),items=terms(side);
 const i=items.findIndex(e=>{const q=kind==='number'?(C.isNum(e)?e.q:null):C.linearCoeff(e);return q&&q.add(d).isZero()});
 if(i<0)return C.latexExpr(after,policy);
 return join(items.map((e,j)=>i===j?{zero:true}:e),policy);
}
function distributed(side,op,operand,policy){
 const parts=terms(side),o=C.latexExpr(operand,policy);
 return parts.map((e,i)=>{const s=C.splitSign(e),t=C.latexExpr(s.abs,policy),sign=s.neg?(i?' - ':'-'):(i?' + ':'');
 return sign+(op==='/'?'\\frac{'+t+'}{'+mark('new',o)+'}':group(t)+mark('new','\\cdot '+group(o)));
 }).join('');
}
function frames(before,op,operand,policy){
 const after=C.applyEquation(before,op,operand),l=C.latexExpr(before.l,policy),r=C.latexExpr(before.r,policy),o=C.latexExpr(operand,policy);
 let raw,partial,label,combine;
 if(op==='+'||op==='-'){
  const negative=C.splitSign(operand).neg,term=(negative||operand.t==='add')?group(o):o;
  raw=l+' '+mark('new',op+' '+term)+' = '+r+' '+mark('new',op+' '+term);
  const delta=op==='-'?C.negExpr(operand):C.simplify(operand);
  partial=cancellation(before.l,delta,after.l,policy)+' = '+cancellation(before.r,delta,after.r,policy);
  label=(op==='-'?'Trek ':'Tel ')+C.fallbackText(o)+(op==='-'?' af van':' op bij')+' beide leden.';
  combine=partial.includes('motion-zero')?'Tegengestelde termen worden nul.':'Voeg gelijksoortige termen samen.';
 }else{
  raw=op==='/'?'\\frac{'+l+'}{'+mark('new',o)+'} = \\frac{'+r+'}{'+mark('new',o)+'}':group(l)+mark('new','\\cdot '+group(o))+' = '+group(r)+mark('new','\\cdot '+group(o));
  partial=distributed(before.l,op,operand,policy)+' = '+distributed(before.r,op,operand,policy);
  label=(op==='/'?'Deel':'Vermenigvuldig')+' beide volledige leden '+(op==='/'?'door ':'met ')+C.fallbackText(o)+'.';
  combine='Voer de bewerking uit bij elke term.';
 }
 const final=C.latexEq(after,policy);
 const out=[{tex:raw,caption:label,delay:1500}];
 if(partial!==final&&partial!==raw)out.push({tex:partial,caption:combine,delay:1100});
 out.push({tex:final,caption:partial.includes('motion-zero-kept')?'Een volledig lid dat nul wordt, blijft nul.':partial.includes('motion-zero')?'De optelterm nul mag weg.':'De nieuwe vergelijking blijft gelijkwaardig.',delay:850});
 return {after,frames:out};
}
class Player{
 constructor(onFrame,onFinish,clock={now:()=>performance.now(),set:(f,t)=>setTimeout(f,t),clear:id=>clearTimeout(id)}){this.onFrame=onFrame;this.onFinish=onFinish;this.clock=clock;this.cancel()}
 cancel(){if(this.timer!=null)this.clock.clear(this.timer);this.timer=null;this.active=false;this.paused=false;this.serial=(this.serial||0)+1;}
 start(items){this.cancel();this.items=items;this.index=0;this.active=items.length>0;if(this.active)this.display();else this.onFinish();}
 display(){this.onFrame(this.items[this.index],this.index);this.arm(this.items[this.index].delay);}
 arm(ms){this.remaining=Math.max(0,ms);this.due=this.clock.now()+this.remaining;const serial=this.serial;this.timer=this.clock.set(()=>{this.timer=null;if(serial!==this.serial||!this.active||this.paused)return;if(++this.index>=this.items.length){this.active=false;this.onFinish();}else this.display();},this.remaining);}
 pause(){if(!this.active||this.paused)return;this.remaining=Math.max(0,this.due-this.clock.now());this.clock.clear(this.timer);this.timer=null;this.paused=true;}
 resume(){if(!this.active||!this.paused)return;this.paused=false;this.arm(this.remaining);}
}
return Object.freeze({frames,Player});
});
