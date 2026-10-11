// Equations only: the original seven routes and original exact grader.
const Game=require('../../games/algebra-trainer/battle-config.js');
const Journey=require('../../games/algebra-trainer/journey-core.js');
function pool(_a,_b,world){return world==='mixed'?[...new Set(Journey.stops.flatMap(s=>s.skills))]:[...(Journey.stops.find(s=>s.id===world)?.skills||[])];}
function grade(spec,answer){try{return pool(null,null,'mixed').includes(spec?.skill)&&Game.validate(Game.generate(spec),answer).ok;}catch{return false;}}
module.exports={pool,grade};
