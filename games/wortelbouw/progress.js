/* Compact account save: stable puzzle IDs and replayable construction actions. */
(function(root,factory){const api=factory(typeof module==='object'?require('./geometry.js'):root.WortelbouwGeometry);if(typeof module==='object')module.exports=api;else root.WortelbouwProgress=api})(globalThis,G=>{
  'use strict';
  const KEY='axioma.wortelbouw.progress.v1',clone=v=>JSON.parse(JSON.stringify(v));
  const ids=G.levels.map(G.levelId),fresh=()=>({version:1,current:ids[0],levels:{}});
  function replay(id,actions){
    if(!ids.includes(id)||!Array.isArray(actions)||actions.length>1000)throw Error('Ongeldige bouwpoging');
    const g=new G.Game(ids.indexOf(id));for(const a of actions){if(!a||typeof a!=='object')throw Error('Ongeldige bouwstap');g.commit(a)}return g;
  }
  function routes(raw){return Array.isArray(raw)?raw.filter((r,i,a)=>r&&['sum','difference'].includes(r.mode)&&a.findIndex(x=>x?.mode===r.mode)===i&&Array.isArray(r.equations)&&r.equations.length<=100&&r.equations.length>0&&r.equations.at(-1)?.result===6&&r.equations.at(-1).mode===r.mode&&r.equations.every(e=>e&&[e.base,e.helper,e.result].every(n=>Number.isSafeInteger(n)&&n>0)&&['sum','difference'].includes(e.mode)&&e.base+(e.mode==='sum'?1:-1)*e.helper===e.result)).map(clone):[]}
  function read(raw,summary=[]){
    const p=fresh();let recovered=false;
    for(const [i,id] of ids.entries()){
      const row=raw?.version===1?raw.levels?.[id]:null;
      const old=summary.includes(id),entry={completed:row?.completed===true||old,routes:G.levels[i].compareRoutes?routes(row?.routes):[]};
      if(entry.routes.length===2)entry.completed=true;
      if(Number.isInteger(row?.bestSteps)&&row.bestSteps>0)entry.bestSteps=row.bestSteps;
      if(typeof row?.completedAt==='string')entry.completedAt=row.completedAt.slice(0,40);
      if(row?.actions){try{const game=replay(id,row.actions);entry.actions=game.actions}catch{recovered=true}}
      if(row||old)p.levels[id]=entry;
    }
    p.manual=raw?.manual!==false;
    p.current=ids.includes(raw?.current)?raw.current:ids.find(id=>!p.levels[id]?.completed)||ids[0];
    return {progress:p,recovered};
  }
  function record(p,game,now=new Date().toISOString()){
    const id=G.levelId(G.levels[game.state.level]),entry=p.levels[id]||{completed:false,routes:[]};
    p.current=id;entry.actions=clone(game.actions);
    if(['routeDone','won'].includes(game.state.phase)){
      for(const r of game.state.solutions){const i=entry.routes.findIndex(old=>old.mode===r.mode);if(i<0)entry.routes.push(clone(r));else if(r.equations.length<entry.routes[i].equations.length)entry.routes[i]=clone(r)}
      if(game.state.phase==='won'||entry.routes.length===2){
        entry.completed=true;entry.completedAt ||= now;
        const steps=G.levels[game.state.level].compareRoutes?entry.routes.reduce((n,r)=>n+r.equations.length,0):game.state.steps;
        entry.bestSteps=Math.min(entry.bestSteps||Infinity,steps);
      }
    }
    p.levels[id]=entry;return p;
  }
  const completed=p=>ids.filter(id=>p.levels[id]?.completed);
  return {KEY,ids,fresh,read,replay,record,completed};
});
