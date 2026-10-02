/* Contextual controls for the solo paper workbench. Shared battle math stays in core.js. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));else root.AlgebraWorkbench=factory(root.AlgebraCore);})(globalThis,function(C){
'use strict';
const {R,N,isNum,simplify,exprSig,exprIsZero,containsVar,linearCoeff,topTerms,absExpr,outerScalar,candidateOperands}=C;
// Paired choices describe the current equation, without ranking a solution path.
// The full operand picker remains available for every equivalent detour.
function contextOperations(ex,eq){
  const choices=[],seen=new Set();
  const available=Object.fromEntries(['+','-','/','*'].map(op=>[op,new Set(candidateOperands(ex,eq,op).map(exprSig))]));
  function add(op,operand){
    operand=simplify(operand);const key=op+exprSig(operand);
    if(seen.has(key)||!available[op].has(exprSig(operand)))return;
    seen.add(key);choices.push({op,operand});
  }
  const left=topTerms(eq.l),right=topTerms(eq.r);
  const constants=[...left,...right].filter(t=>!containsVar(t)&&!exprIsZero(t)).map(absExpr);
  const variables=left.some(containsVar)&&right.some(containsVar)?[...right,...left].filter(t=>containsVar(t)&&linearCoeff(t)!==null).map(absExpr):[];
  const shifts=[...(variables.length?[variables[0]]:[]),...constants,...variables.slice(1)];
  const usedShifts=new Set();
  for(const operand of shifts){
    const key=exprSig(operand);if(usedShifts.has(key))continue;
    usedShifts.add(key);add('+',operand);add('-',operand);
    if(usedShifts.size===2)break;
  }
  const scalars=[...left,...right].filter(containsVar).map(outerScalar).filter(q=>q&&!q.isZero()&&!q.eq(1));
  const scalar=scalars[0]||R(2);
  add('/',N(scalar));add('*',N(scalar));
  for(const op of ['/','*','-','+'])for(const operand of candidateOperands(ex,eq,op)){
    if(choices.length>=6)break;
    if(isNum(operand)&&operand.q.eq(1))continue;
    add(op,operand);
  }
  return choices.slice(0,6);
}

// Describe the current equation without selecting the pupil's next operation.
function checkProgress(eq){
  eq=C.simplifyEq(eq);
  if(C.solvedEquation(eq))return {solved:true,message:'Juist. x staat vrij.'};
  const left=containsVar(eq.l),right=containsVar(eq.r);
  if(left&&right)return {solved:false,message:'x staat nog aan beide kanten.'};
  const side=left?eq.l:right?eq.r:null;
  if(!side)return {solved:false,message:'Er staat geen x meer. Bekijk je laatste stap.'};
  if(side.t==='add')return {solved:false,message:'x staat nog niet alleen: er staat nog iets bij.'};
  if(side.t==='div')return {solved:false,message:'x staat nog in een breuk.'};
  if(side.t==='mul')return {solved:false,message:'x staat nog in een product.'};
  return {solved:false,message:'Werk verder tot x alleen staat.'};
}

return Object.freeze({contextOperations,checkProgress});
});
