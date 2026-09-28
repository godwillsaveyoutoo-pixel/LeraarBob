// Route chooser for tests only: operates on the visible equation, never a hidden solution.
function nextAnswer(C,t,w,divideFirst=false){
 const stage=C.stages(t)[w.index];if(stage!=='algebra')return C.expected(t,w);
 const e=C.algebraEquation(t,w),axis=t.skill==='input_from_output'||t.params.model.kind==='vertical'?'x':'y',other=axis==='x'?'y':'x';
 if(C.isolated(e,axis))return {kind:'finish'};
 if(divideFirst&&e.left[axis].n&&!C.eq(e.left[axis],1))return {kind:'divide',value:e.left[axis]};
 if(e.right[axis].n)return {kind:'subtract',term:axis,value:e.right[axis]};
 if(e.left[other].n)return {kind:'subtract',term:other,value:e.left[other]};
 if(e.left.c.n)return {kind:'subtract',term:'c',value:e.left.c};
 return {kind:'divide',value:e.left[axis]};
}
function solve(C,t,divideFirst=false){const w=C.fresh(t);for(let i=0;!w.done&&i<20;i++){const r=C.submit(t,w,nextAnswer(C,t,w,divideFirst));if(!r.ok)throw Error(JSON.stringify({t,w,r}))}if(!w.done)throw Error('unfinished');return w}
module.exports={nextAnswer,solve};
