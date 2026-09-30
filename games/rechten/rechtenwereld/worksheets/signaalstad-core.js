/* Released Signaalstad content only: exact table-to-line construction. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../../core/wave-core.js'),require('../formula-core.js'));else root.SignaalstadWorksheet=factory(root.RechtenWave,root.RechtenV2Formula)})(globalThis,(W,F)=>{
'use strict';
const VERSION=1,types=Object.freeze([{id:'graph_from_table',label:'Rechte tekenen uit een tabel',example:'Lees punten, plaats ze en teken de rechte'}]);
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
 const seen=new Set(),tasks=[];
 for(let i=0;i<config.count;i++){
  const guided=config.mode==='guided'||config.mode==='progressive'&&i<Math.ceil(config.count*.4),candidates=[];
  // Keep first guided encounters integer-valued, then introduce half units and constants.
  const indices=i<2&&config.mode!=='independent'?[0,1,2]:[0,1,2,3,4,5];
  for(const index of indices)for(let run=1;run<=3;run++){
   const source=F.makeTask('graph_from_table',index,run);
   for(const shift of [-1,0,1]){
    const model={...source.model,b:W.add(source.model.b,shift)};
    if(Math.abs(W.num(model.b))>3)continue;
    const signature=JSON.stringify(model);if(seen.has(signature))continue;
    // All three given points fit inside the printed frame, including after translation.
    const xs=Array.from({length:9},(_,j)=>j-4).filter(x=>Math.abs(W.num(W.add(W.mul(model.a,x),model.b)))<=4);
    if(xs.length<3)continue;
    const middle=model.a.d>1?xs.slice(1,-1).find(x=>Math.abs(x%2)===1):xs[Math.floor(xs.length/2)];
    const table=[xs[0],middle??xs[Math.floor(xs.length/2)],xs.at(-1)].map(x=>({x:W.q(x),y:W.add(W.mul(model.a,x),model.b)}));
    candidates.push({model,table,signature});
   }
  }
  if(!candidates.length)throw Error('Kies minder oefeningen voor deze combinatie.');
  const selected=candidates[Math.floor(random()*candidates.length)];seen.add(selected.signature);
  tasks.push({id:`signal-paper-${VERSION}-${config.seed}-${i+1}`,number:i+1,type:'graph_from_table',skill:'graph_from_table',params:{model:selected.model,table:selected.table},guided,graph:true,span:2,height:110,keyHeight:110});
 }
 return {version:VERSION,config,code:`SS${VERSION}-${config.seed.toString(36).toUpperCase()}-${config.mode[0].toUpperCase()}${config.count}-1`,tasks};
}
function restore(raw){if(raw?.version!==VERSION)throw Error('Deze werkbladversie wordt niet ondersteund.');return generate(raw.config)}
return Object.freeze({VERSION,types,modes,normalize,generate,restore});
});
