(function(){
 const $=id=>document.getElementById(id);let spec;
 const arena=new WortelbouwArena(0,$('buildBoard'),$('arenaNotice'),$('undo'),{arenaSolved(){ $('buildHint').textContent='Je bouw is klaar.';if(!BattlePlayer.singleAttempt)submit(); }});
 const oldRender=arena.render.bind(arena);arena.render=function(...args){oldRender(...args);$('buildHint').textContent=({start:'Sleep een startvierkant.',choose:'Sleep vanaf een gouden buitenzijde.',helper:'Trek het hulpvierkant open.',result:'Trek het resultaat open.',won:'Klaar om in te dienen.'})[arena.game.state.phase]||'Bouw verder.';};
 const submit=()=>BattlePlayer.submit({actions:structuredClone(arena.game.actions)});
 const reset=()=>{arena.reset(BattleGame.generate(spec));arena.setLocked(false);$('goal').textContent='Bouw lengte '+WortelbouwGeometry.goalLabel(arena.level())+'.';$('battleStatus').textContent='';$('submit').disabled=false;$('skip').disabled=false;};
 $('submit').onclick=submit;$('skip').onclick=()=>BattlePlayer.submit({},true);
 BattlePlayer.connect({start(s){spec=s;reset();},retry:reset,freeze(message){arena.cancel();arena.setLocked(true);$('submit').disabled=true;$('skip').disabled=true;$('battleStatus').textContent=message;}});
 WortelbouwAssets?.onChange?.(()=>arena.render());
 window.WortelbouwBattlePlayer={snapshot:()=>structuredClone(arena.game.state)};
})();
