// Both battle modes use the original Logicawereld content and answer validator.
const Game=require('../../games/logicawereld/battle-config.js');
function pool(_a,_b,world){return world==='mixed'?Game.mixedSkills:Game.worlds.find(w=>w.id===world)?.skills||[];}
function grade(spec,answer){try{return Game.validate(Game.generate(spec),answer).ok;}catch{return false;}}
module.exports={pool,grade};
