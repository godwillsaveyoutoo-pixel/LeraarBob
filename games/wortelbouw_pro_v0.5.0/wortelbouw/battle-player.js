(function(){
 const $=id=>document.getElementById(id);let spec,syncing=false,lastDraft='';
 const arena=new WortelbouwArena(0,$('buildBoard'),$('arenaNotice'),$('undo'),{arenaSolved(){ $('buildHint').textContent='Je bouw is klaar.';if(!BattlePlayer.singleAttempt)submit(); }});
 const oldRender=arena.render.bind(arena);arena.render=function(...args){oldRender(...args);const d=JSON.stringify(arena.game.actions);if(spec&&!syncing&&d!==lastDraft){lastDraft=d;BattlePlayer.changed({actions:structuredClone(arena.game.actions)});}$('buildHint').textContent=({start:'Sleep een startvierkant.',choose:'Sleep vanaf een gouden buitenzijde.',helper:'Trek het hulpvierkant open.',result:'Trek het resultaat open.',won:'Klaar om in te dienen.'})[arena.game.state.phase]||'Bouw verder.';};
 const submit=()=>BattlePlayer.submit({actions:structuredClone(arena.game.actions)});
 const reset=()=>{arena.reset(BattleGame.generate(spec));arena.setLocked(false);$('goal').textContent='Bouw lengte '+WortelbouwGeometry.goalLabel(arena.level())+'.';$('battleStatus').textContent='';$('submit').disabled=false;$('skip').disabled=false;};
 $('submit').onclick=submit;$('skip').onclick=()=>BattlePlayer.submit({},true);
 BattlePlayer.connect({start(s){syncing=true;spec=s;reset();lastDraft='';syncing=false;},sync(value,readOnly){syncing=true;try{reset();if(Array.isArray(value?.actions)&&value.actions.length<=150)for(const action of value.actions)arena.game.commit(action);arena.reframe();arena.setLocked(readOnly);$('submit').disabled=readOnly;$('skip').disabled=readOnly;lastDraft=JSON.stringify(arena.game.actions);}catch{reset();}finally{syncing=false;}},retry:reset,freeze(message){arena.cancel();arena.setLocked(true);$('submit').disabled=true;$('skip').disabled=true;$('battleStatus').textContent=message;}});
 WortelbouwAssets?.onChange?.(()=>arena.render());
 window.WortelbouwBattlePlayer={snapshot:()=>structuredClone(arena.game.state)};
})();
