const assert=require('assert');
const G=require('../wortelbouw/geometry.js');
const goals={2:[1,1],5:[1,2],13:[2,3],18:[3,3],25:[3,4],100:[6,8],104:[10,2]};
for(const [n,[a,b]] of Object.entries(goals)){
  const idx=G.levels.findIndex(l=>l.n===Number(n));
  assert(idx>=0,`missing level ${n}`);
  const game=new G.Game(idx);
  game.commit({type:'start',k:a,x:0,y:0});
  const square=game.state.objects.find(o=>o.type==='square');
  let chosen=null;
  for(const e of G.freeEdges(game.state,square)){
    for(const flip of [false,true]){
      const p=G.plan(game.state,square.id,e.index,b,'sum',flip);
      if(p?.valid){chosen={e,flip};break}
    }
    if(chosen)break;
  }
  assert(chosen,`no valid plan for ${n}`);
  game.commit({type:'triangle',owner:square.id,edgeIndex:chosen.e.index,k:b,mode:'sum',flip:chosen.flip});
  game.commit({type:'helper'}); game.commit({type:'result'}); game.commit({type:'reveal'});
  assert.strictEqual(game.state.phase,'won',`goal ${n} did not win`);
}
console.log('battle geometry smoke ok');
