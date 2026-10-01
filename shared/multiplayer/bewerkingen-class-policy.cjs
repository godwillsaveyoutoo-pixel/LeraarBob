const Game=require('../../games/bewerkingen-trainer/battle-config.js');
module.exports={grade(spec,answer){try{return Game.validate(Game.generate(spec),answer).ok;}catch{return false;}}};
