// Trust coordinates, never the client-supplied dx/dy or correctness flags.
const {TaskGenerator,TaskValidator,VectorMath:M}=require('../../games/vectoren/vector-core.js');
function point(p){if(!p||![p.x,p.y].every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1000))throw Error('Invalid point');return {x:p.x,y:p.y};}
function normalize(a){
 if(!a||typeof a!=='object'||Array.isArray(a))throw Error('Invalid answer');
 const strokes=a.strokes||[];if(!Array.isArray(strokes)||strokes.length>24)throw Error('Invalid strokes');
 const values=a.values||[];if(!Array.isArray(values)||values.length>2||values.some(v=>typeof v!=='string'||v.length>40))throw Error('Invalid values');
 return {strokes:strokes.map(s=>M.stroke(point(s.start),point(s.end),s.role==='result'?'result':'vector')),values,point:a.point?point(a.point):null,choice:Number.isInteger(a.choice)?a.choice:null};
}
function grade(spec,answer){try{return TaskValidator.validate(TaskGenerator.generate(spec.skill,{seed:spec.seed,variant:spec.variant,level:1}),normalize(answer)).ok===true;}catch{return false;}}
module.exports={grade,normalize};
