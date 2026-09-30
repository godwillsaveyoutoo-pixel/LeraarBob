/* Paper tasks use the same exact RechtenWave models as the digital learning route. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../../core/wave-core.js'));else root.HellingrugWorksheet=factory(root.RechtenWave)})(globalThis,W=>{
'use strict';
const VERSION=1;
const types=Object.freeze([
 {id:'delta',label:'Δx en Δy',example:'Van A naar B'},
 {id:'slope',label:'Helling uit een grafiek',example:'a = Δy / Δx'},
 {id:'slope_from_two_points',label:'Helling uit twee punten',example:'A(x₁, y₁) en B(x₂, y₂)'},
 {id:'line_behavior',label:'Stijgend, dalend of constant',example:'Het teken van a'},
 {id:'special_lines',label:'Bijzondere rechten',example:'Horizontaal, verticaal, één punt'},
 {id:'error_analysis',label:'Een fout verklaren',example:'Welke aftrekking klopt niet?'}
]);
const modes=Object.freeze({progressive:'Opbouwend',guided:'Met tussenstappen',independent:'Zelfstandig'});
function rng(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}}
function normalize(raw={}){
 const selected=types.filter(t=>(raw.types||types.map(x=>x.id)).includes(t.id)).map(t=>t.id);
 if(!selected.length)throw Error('Kies minstens één leerdoel.');
 const count=Number(raw.count??8),seed=Number(raw.seed??1);
 if(!Number.isInteger(count)||count<selected.length||count>24)throw Error('Kies minstens één oefening per leerdoel en maximaal 24 oefeningen.');
 if(!Number.isInteger(seed)||seed<1||seed>0xffffffff)throw Error('Ongeldige reekscode.');
 if(raw.mode&&!Object.hasOwn(modes,raw.mode))throw Error('Onbekende opbouw.');
 return {types:selected,count,seed,mode:raw.mode||'progressive'};
}
function generate(raw={}){
 const config=normalize(raw),random=rng(config.seed),counts={},seen=new Set(),tasks=[];
 const variants={delta:[0,1,2,3,4],slope:[2,3,0,4],slope_from_two_points:[0,3,2,1,4],line_behavior:[1,0,4],special_lines:[0,1,2],error_analysis:[3,2,0]};
 // Complete the foundation first; later questions repeat it with less support.
 const sequence=config.types.slice();
 const repeatOrder=['slope_from_two_points','special_lines','slope','delta','line_behavior','error_analysis'].filter(id=>config.types.includes(id));
 while(sequence.length<config.count){for(const id of repeatOrder){if(sequence.length===config.count)break;sequence.push(id)}}
 for(const [index,type] of sequence.entries()){
  const occurrence=counts[type]||0;counts[type]=occurrence+1;
  const guided=config.mode==='guided'||config.mode==='progressive'&&index<Math.ceil(config.count*.4);
  const sourceSkill=['delta','slope','error_analysis'].includes(type)?'slope_from_two_points':type;
  let params,key;
  for(let attempt=0;attempt<100;attempt++){
   const seed=1+Math.floor(random()*0x7fffffff),variant=variants[type][occurrence%variants[type].length];
   params=W.generate(sourceSkill,{seed,variant,difficulty:guided?0:1});
   // Translate inside the printable grid: many fresh pairs, same mathematical case.
   for(const axis of ['x','y']){
    const lo=Math.ceil(-4-Math.min(W.num(params.A[axis]),W.num(params.B[axis]))),hi=Math.floor(4-Math.max(W.num(params.A[axis]),W.num(params.B[axis])));
    const shift=lo+Math.floor(random()*(hi-lo+1));
    params.A[axis]=W.add(params.A[axis],shift);params.B[axis]=W.add(params.B[axis],shift);
   }
   params.model=W.model(params.A,params.B);
   key=JSON.stringify([type,params.A,params.B]);if(!seen.has(key))break;
  }
  if(seen.has(key))throw Error('Deze combinatie levert te weinig verschillende opgaven. Kies minder oefeningen.');
  seen.add(key);
  const {A,B,model}=params,dx=W.sub(B.x,A.x),dy=W.sub(B.y,A.y);
  const graph=['delta','slope','line_behavior','special_lines'].includes(type);
  const t={id:`hill-paper-${VERSION}-${config.seed}-${index+1}`,number:index+1,type,skill:sourceSkill==='slope_from_two_points'&&type!=='error_analysis'?type:sourceSkill,guided,params,dx,dy,graph,span:graph||type==='error_analysis'?2:1,height:graph?100:76};
  if(type==='error_analysis')t.wrongSlope=W.mul(-1,model.a);
  tasks.push(t);
 }
 const mask=types.reduce((n,t,i)=>n+(config.types.includes(t.id)?2**i:0),0).toString(36).toUpperCase();
 return {version:VERSION,config,code:`HR${VERSION}-${config.seed.toString(36).toUpperCase()}-${config.mode[0].toUpperCase()}${config.count}-${mask}`,tasks};
}
function restore(raw){if(raw?.version!==VERSION)throw Error('Deze werkbladversie wordt niet ondersteund.');return generate(raw.config)}
return Object.freeze({VERSION,types,modes,normalize,generate,restore});
});
