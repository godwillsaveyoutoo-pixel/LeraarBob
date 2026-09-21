const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync(require.resolve('../games/verfwinkel.html'),'utf8');
const levels=JSON.parse(html.match(/const LEVELS=(\[.*?\]);/s)[1]);
const gcd=(a,b)=>b?gcd(b,a%b):a;
// Independent enumeration uses the actual tap sizes: whole simplified ratio groups.
function recipes(l,stock,orderIndex=0,reserve=true){
 const o=l.orders[orderIndex],out=[];
 function visit(i,pick){
  if(i===l.sources.length){
   const volume=pick.reduce((a,b)=>a+b,0),blue=pick.reduce((sum,n,i)=>sum+n*l.sources[i].b/(l.sources[i].b+l.sources[i].y),0);
   if(volume!==o.vol||Math.abs(blue-o.vol*o.b/(o.b+o.y))>1e-8)return;
   if(reserve&&l.rule&&stock[l.rule.source]-pick[l.rule.source]<l.rule.amount)return;
   out.push(pick);return;
  }
  const s=l.sources[i],step=(s.b+s.y)/gcd(s.b,s.y);
  for(let n=0;n<=stock[i];n+=step)visit(i+1,[...pick,n]);
 }
 visit(0,[]);return out;
}
function routes(l,stock=l.sources.map(s=>s.total),index=0){
 if(index===l.orders.length)return [[]];
 return recipes(l,stock,index).flatMap(p=>routes(l,stock.map((n,i)=>n-p[i]),index+1).map(rest=>[p,...rest]));
}
test('all 16 orders can be completed with legal taps, whole pigment litres and all reserves',()=>{
 assert.equal(levels.length,16);
 for(const [i,l] of levels.entries()){
  for(const o of l.orders)assert.equal(Number.isInteger(o.vol*o.b/(o.b+o.y)),true,`level ${i+1}: whole pigment slots`);
  assert(routes(l).length>0,`level ${i+1}: solvable whole sequence`);
 }
});
test('progression distinguishes scaling, unequal mixtures and different consecutive orders',()=>{
 assert.deepEqual(recipes(levels[1],[12,12]),[[4,2]]);
 assert.deepEqual(recipes(levels[2],[12,12]),[[6,3]]);
 assert.deepEqual(routes(levels[6]),[[[8,4]]]);
 assert.deepEqual(routes(levels[7]),[[[8,4],[4,6]]]);
 assert.equal(new Set(levels.flatMap(l=>l.orders.map(o=>`${o.b}:${o.y}`))).size,6);
});
test('open recipes, limited stock, reserves and advance planning change what is possible',()=>{
 for(const i of [8,9,10,11])assert(recipes(levels[i],levels[i].sources.map(s=>s.total)).length>1,`level ${i+1}: multiple recipes`);
 const stock=levels[12];assert.equal(recipes(stock,stock.sources.map(s=>s.total)).length,1);
 assert(recipes(stock,[20,20,20]).length>1);
 const reserve=levels[13],s=reserve.sources.map(s=>s.total);assert(recipes(reserve,s,0,false).length>recipes(reserve,s).length);
 const plan=levels[14],first=recipes(plan,plan.sources.map(s=>s.total));assert(first.length>routes(plan).length,'a correct first recipe can block the next order');
 const master=levels[15];assert(routes(master).length>0);assert(routes({...master,rule:null}).length>routes(master).length,'reserve changes the final sequence');
});
module.exports={levels,recipes,routes};
