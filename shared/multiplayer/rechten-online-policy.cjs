// Shared by the trusted Edge worker and tests. No alternate mathematics engine.
const Game=require('../../games/rechten/rechtenwereld/battle-config.js');
const Areas=require('../../games/rechten/rechtenwereld/content/area-maps.js');
function learned(state,worldId){
 if(!state||!state.missions||!Array.isArray(state.events))return [];
 const skills=[];
 for(const world of Game.worlds.filter(w=>w.id!=='puntenbaai')){
  const status=Areas.statuses(state,world.id);
  if(!status.unlocked||!status.complete||(worldId&&world.id!==worldId))continue;
  for(const skill of world.skills)if(status.nodes.some(n=>n.key===skill&&n.state==='completed'))skills.push(skill);
 }
 return skills;
}
function pool(a,b,worldId){const other=new Set(learned(b,worldId));return learned(a,worldId).filter(s=>other.has(s));}
function grade(spec,answer){try{return Game.validate(Game.generate(spec),answer).ok===true;}catch{return false;}}
module.exports={pool,learned,grade};
