/* Paper adaptation of Grenspas: exact roots, sign charts and strict inequalities. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../../core/wave-core.js'),require('../grens-core.js'));else root.GrenspasWorksheet=factory(root.RechtenWave,root.RechtenV2Grens)})(globalThis,(W,G)=>{
'use strict';
const VERSION=1;
const types=Object.freeze(G.skills.map(id=>({id,label:G.titles[id],example:({zeroRead:'Waar snijdt de rechte de x-as?',zero:'Los f(x) = 0 op',signchart:'Links · nulwaarde · rechts',positive:'Voor welke x is f(x) > 0?',negative:'Voor welke x is f(x) < 0?'})[id]})));
const modes=Object.freeze({progressive:'Opbouwend',guided:'Met tussenstappen',independent:'Zelfstandig'});
function rng(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}}
function normalize(raw={}){
 const selected=types.filter(t=>(raw.types||types.map(t=>t.id)).includes(t.id)).map(t=>t.id),count=Number(raw.count??8),seed=Number(raw.seed??1);
 if(!selected.length)throw Error('Kies minstens één leerdoel.');
 if(!Number.isInteger(count)||count<selected.length||count>24)throw Error('Kies minstens één oefening per leerdoel en maximaal 24 oefeningen.');
 if(!Number.isInteger(seed)||seed<1||seed>0xffffffff)throw Error('Ongeldige reekscode.');
 if(raw.mode&&!Object.hasOwn(modes,raw.mode))throw Error('Onbekende opbouw.');
 return {types:selected,count,seed,mode:raw.mode||'progressive'};
}
function generate(raw={}){
 const config=normalize(raw),random=rng(config.seed),sequence=[...config.types],counts={},seen=new Set(),tasks=[];
 const repeat=['signchart','positive','negative','zeroRead','zero'].filter(id=>config.types.includes(id));
 while(sequence.length<config.count)for(const id of repeat){if(sequence.length===config.count)break;sequence.push(id)}
 for(const [index,type] of sequence.entries()){
  const occurrence=counts[type]||0;counts[type]=occurrence+1;
  const guided=config.mode==='guided'||config.mode==='progressive'&&index<Math.ceil(config.count*.4);
  // Keep the digital slope progression; translate the root on a readable half-unit grid.
  const source=G.makeTask(type,occurrence%G.count,1),a=source.model.a;
  const pool=Array.from({length:occurrence<2?7:13},(_,i)=>W.q(i-(occurrence<2?3:6),occurrence<2?1:2));
  const candidates=pool.map(root=>({root,model:{kind:'affine',a,b:W.mul(-1,W.mul(a,root))}})).filter(p=>!seen.has(JSON.stringify([type,p.model])));
  if(!candidates.length)throw Error('Kies minder oefeningen voor deze combinatie.');
  const params=candidates[Math.floor(random()*candidates.length)];seen.add(JSON.stringify([type,params.model]));
  const graph=type!=='zero'&&(type!=='signchart'||occurrence%2===0),chart=G.expectedChart(params);
  const symbol=(params.model.a.n>0)===(type!=='negative')?'>':'<';
  tasks.push({id:`border-paper-${VERSION}-${config.seed}-${index+1}`,number:index+1,type,skill:type,guided,params,graph,chart,symbol,span:type==='zero'?1:2,height:graph?100:86,keyHeight:graph?100:86});
 }
 const mask=types.reduce((n,t,i)=>n+(config.types.includes(t.id)?2**i:0),0).toString(36).toUpperCase();
 return {version:VERSION,config,code:`GP${VERSION}-${config.seed.toString(36).toUpperCase()}-${config.mode[0].toUpperCase()}${config.count}-${mask}`,tasks};
}
function restore(raw){if(raw?.version!==VERSION)throw Error('Deze werkbladversie wordt niet ondersteund.');return generate(raw.config)}
return Object.freeze({VERSION,types,modes,normalize,generate,restore});
});
