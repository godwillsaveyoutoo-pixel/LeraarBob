// Select the native validator using the server-owned assignment specification.
const configs={numbers:require('../games/bewerkingen-trainer/battle-config.js'),algebra:require('../games/algebra-trainer/battle-config.js'),logic:require('../games/logicawereld/battle-config.js'),rootsbuild:require('../games/wortelbouw_pro_v0.5.0/wortelbouw/battle-config.js'),systems:require('../games/stelsels/task-config.js')};
const rights=require('../shared/multiplayer/rechten-online-policy.cjs'),vectors=require('../shared/multiplayer/vector-class-policy.cjs');
module.exports={grade(spec,answer){try{
 const kind=spec.provider||'rights'; // historical Rechtenwereld specifications
 if(kind==='rights')return rights.grade(spec,answer);
 if(kind==='vectors')return vectors.grade(spec,answer);
 if(kind==='algebra'&&spec.skill==='S1')return false;
 const g=configs[kind];return !!g&&g.validate(g.generate(spec),answer).ok===true;
}catch{return false;}}};
