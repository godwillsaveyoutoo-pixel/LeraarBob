// Translates the existing completion records into each engine's native save format.
// Once a full snapshot exists, the engine owns that format and it is restored verbatim.
(() => {
'use strict';
const numbers=(state,first,total)=>(state.completed||[]).map(Number).filter(n=>Number.isInteger(n)&&n>=first&&n<first+total);
const put=(state,key,value)=>{if(!Object.hasOwn(state.storage,key))state.storage[key]=JSON.stringify(value)};
const next=(done,first,total)=>{for(let i=first;i<first+total;i++)if(!done.includes(i))return i;return first+total-1};
function indexed(key,total,field='lastLevel'){
 return {keys:[key],hydrate(state){const done=numbers(state,0,total);put(state,key,{completed:done,[field]:next(done,0,total)})}};
}
const adapters={
 'wortelbouw':{keys:['axioma.wortelbouw.progress.v1']},
 'pythagoras':{keys:['axioma.pythagoras.completed.v1','axioma.pythagoras.current.v1'],hydrate(state){const done=numbers(state,1,10);put(state,this.keys[0],done);put(state,this.keys[1],next(done,1,10))}},
 'stelsels':{keys:['axioma.stelsels.completed.v1','axioma.stelsels.current.v1'],hydrate(state){const done=numbers(state,0,14);put(state,this.keys[0],done);put(state,this.keys[1],next(done,0,14))}},
 'algebra-smederij':{keys:['rf22_done','rf21_last','rf21_theme'],hydrate(state){put(state,'rf22_done',(state.completed||[]).map(String))}},
 'taartenwinkel':indexed('axioma.taartenwinkel.v05.progress',7,'lastService'),
 'kubusbouw':indexed('axioma.scaleAssembly.v0.5.progress',22),
 'verfwinkel':indexed('axioma.verfwinkel.progress.v1',16),
 'signal-lab':indexed('signalLab.v0.4.1.progress',12),
 'data-check':{keys:['evidenceDeskCompletedV06','evidenceDeskMetaV06'],hydrate(state){const done=numbers(state,1,22);put(state,this.keys[0],Array.from({length:22},(_,i)=>done.includes(i+1)));put(state,this.keys[1],{lastLevel:next(done,1,22)-1})}},
 'gravity-maze':{keys:['gravity-maze-human-v1-blind','gravity-maze-human-v1-assisted']},
 'vectoren-trainer':{keys:['axioma-vectorentrainer-v020']},
 'reele-getallen-trainer':{keys:['axioma-real-numbers-v1']},
 'brandweer':{keys:['axioma.brandweer.current.v1'],hydrate(state){const done=numbers(state,1,16);put(state,this.keys[0],next(done,1,16)-1)}},
 'kleiduifschieten':{keys:['axioma.rechten.kleiduiven.standalone.v12']},
 'rechten-trainer':{tracking:false,external:true},
 'functies-rechten':{tracking:false},
 'rechten-zeeslag':{tracking:false,multiplayer:true}
};
const readers={
 'pythagoras':['axioma.pythagoras.completed.v1',10,value=>value],
 'stelsels':['axioma.stelsels.completed.v1',14,value=>value],
 'algebra-smederij':['rf22_done',()=>window.RF?.Challenges?.length||0,value=>value],
 'taartenwinkel':['axioma.taartenwinkel.v05.progress',7,value=>value.completed],
 'kubusbouw':['axioma.scaleAssembly.v0.5.progress',22,value=>value.completed],
 'verfwinkel':['axioma.verfwinkel.progress.v1',16,value=>value.completed],
 'signal-lab':['signalLab.v0.4.1.progress',12,value=>value.completed],
 'data-check':['evidenceDeskCompletedV06',22,value=>value.map((done,i)=>done?i+1:null).filter(Boolean)]
};
for(const [id,[key,total,read]] of Object.entries(readers))adapters[id].onWrite=(changed,value)=>{
 if(changed!==key)return;
 try{const units=read(JSON.parse(value));if(Array.isArray(units))return {completed:[...new Set(units.map(String))],total:typeof total==='function'?total():total}}catch(_){}
};
adapters['gravity-maze'].onWrite=(key,value,state)=>{
 if(!adapters['gravity-maze'].keys.includes(key))return;
 let best=[];for(const k of adapters['gravity-maze'].keys){try{const units=JSON.parse(state.storage[k]||'{}').completed;if(Array.isArray(units)&&units.length>best.length)best=units}catch(_){}}
 return {completed:best.map(String),total:9};
};
window.AxiomaGameAdapters=Object.freeze(adapters);
})();
