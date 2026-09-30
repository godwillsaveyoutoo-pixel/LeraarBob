/* Paper tasks use the same exact models as the digital Formulewerf workbenches. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../../core/wave-core.js'),require('../formula-core.js'),require('../derive-core.js'));else root.FormulewerfWorksheet=factory(root.RechtenWave,root.RechtenV2Formula,root.RechtenV2Derive)})(globalThis,(W,F,D)=>{
'use strict';
const VERSION=1;
const types=Object.freeze([...F.skills.filter(id=>F.worldFor(id)==='formulewerf'),...D.skills].map(id=>({id,label:(F.titles[id]||D.titles[id]),example:({equation_from_ab:'Bouw y = ax + b',graph_from_equation:'Bereken punten en teken',equation_from_graph:'Lees a en b af',rewrite_linear_equation:'Isoleer y in beide leden',intercept_from_point:'Vul het gegeven punt in',equation_from_point_slope:'Van a en één punt naar de formule',equation_from_two_points:'Bereken eerst de helling',equation_from_table:'Kies twee kolommen'})[id]})));
const modes=Object.freeze({progressive:'Opbouwend',guided:'Met tussenstappen',independent:'Zelfstandig'});
function normalize(raw={}){
 const selected=types.filter(t=>(raw.types||types.map(t=>t.id)).includes(t.id)).map(t=>t.id),count=Number(raw.count??8),seed=Number(raw.seed??1);
 if(!selected.length)throw Error('Kies minstens één leerdoel.');
 if(!Number.isInteger(count)||count<selected.length||count>24)throw Error('Kies minstens één oefening per leerdoel en maximaal 24 oefeningen.');
 if(!Number.isInteger(seed)||seed<1||seed>0xffffffff)throw Error('Ongeldige reekscode.');
 if(raw.mode&&!Object.hasOwn(modes,raw.mode))throw Error('Onbekende opbouw.');
 return {types:selected,count,seed,mode:raw.mode||'progressive'};
}
function generate(raw={}){
 const config=normalize(raw);let seed=config.seed;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const tasks=[],seen=new Set(),counts={};
 for(let i=0;i<config.count;i++){
  const type=config.types[i%config.types.length],occurrence=counts[type]||0;counts[type]=occurrence+1;
  const core=D.skills.includes(type)?D:F,candidates=[];
  // Start with integer slopes, then include fractions and horizontal lines.
  // Each model has multiple exact translations; no duplicated question in a sheet.
  const indices=occurrence===0&&config.mode!=='independent'&&i<Math.ceil(config.count*.4)?[0,1]:[0,1,2,3,4,5];
  for(const index of indices)for(let run=1;run<=3;run++){
   const source=core.makeTask(type,index,run);
   for(const shift of [-2,-1,0,1,2]){
    const model={...source.model,b:W.add(source.model.b,shift)};
    if(Math.abs(W.num(model.b))>3)continue;
    const signature=JSON.stringify([type,model]);if(seen.has(signature))continue;
    const translate=p=>({x:p.x,y:W.add(p.y,shift)});
    const params={model,...(source.points?{points:Object.fromEntries(Object.entries(source.points).map(([k,p])=>[k,translate(p)]))}:{}),...(source.table?{table:source.table.map(translate)}:{})};
    if(source.equation)params.equation={left:source.equation.left,right:W.expr(0,0,W.mul(model.b,source.equation.left.y))};
    candidates.push({params,signature});
   }
  }
  if(!candidates.length)throw Error('Kies minder oefeningen voor deze combinatie.');
  const chosen=candidates[Math.floor(random()*candidates.length)];seen.add(chosen.signature);
  const guided=config.mode==='guided'||config.mode==='progressive'&&i<Math.ceil(config.count*.4),graph=['graph_from_equation','equation_from_graph'].includes(type);
  tasks.push({id:`formula-paper-${VERSION}-${config.seed}-${i+1}`,number:i+1,type,skill:type,params:chosen.params,guided,graph,span:graph||D.skills.includes(type)?2:1,height:graph?104:D.skills.includes(type)?100:86,keyHeight:graph?104:D.skills.includes(type)?94:86});
 }
 const mask=types.reduce((n,t,i)=>n+(config.types.includes(t.id)?2**i:0),0).toString(36).toUpperCase();
 return {version:VERSION,config,code:`FW${VERSION}-${config.seed.toString(36).toUpperCase()}-${config.mode[0].toUpperCase()}${config.count}-${mask}`,tasks};
}
function restore(raw){if(raw?.version!==VERSION)throw Error('Deze werkbladversie wordt niet ondersteund.');return generate(raw.config)}
return Object.freeze({VERSION,types,modes,normalize,generate,restore});
});
