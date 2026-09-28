// Build offline HTML entrypoints (with local artwork assets) from reviewable source layers. No dependencies.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.join(__dirname,'../games/vectoren');
let html=fs.readFileSync(path.join(dir,'vector-shell.html'),'utf8');
for(const [token,file] of [['VECTOR_PLATFORM','../../shared/axioma-platform.js'],['VECTOR_STYLE','vector-style.css'],['MISSION_SHELL_STYLE','styles/mission-shell.css'],['MISSION_WORLD_STYLE','styles/mission-world.css'],['MISSION_STATION_STYLE','styles/mission-station.css'],['MISSION_PROGRESS_STYLE','styles/mission-progress.css'],['MISSION_EXERCISE_STYLE','styles/mission-exercise.css'],['MISSION_ARCHITECTURE_STYLE','styles/mission-architecture.css'],['MISSION_COCKPIT_STYLE','styles/mission-cockpit.css'],['PLATFORM_UI_STYLE','styles/platform-ui.css'],['TOPBAR_STYLE','../../shared/collapsible-topbar.css'],['TOPBAR_SCRIPT','../../shared/collapsible-topbar.js'],['VECTOR_FLIGHT','vector-flight.js'],['VECTOR_MISSION','vector-mission.js'],['VECTOR_CORE','vector-core.js'],['VECTOR_APP','vector-app.js'],['VECTOR_LESSONS','vector-lessons.js'],['GAME_ADAPTERS','../../shared/axioma-game-adapters.js'],['GAME_RUNTIME','../../shared/axioma-game.js']]){const source=fs.readFileSync(path.join(dir,file),'utf8');if(file.endsWith('.js'))new vm.Script(source,{filename:file});html=html.replace('/* '+token+' */',()=>source);}
for(const filename of ['Axioma_Vectorentrainer_v0.2.html','Axioma_Vectorentrainer_v0.4_vectormissie.html'])fs.writeFileSync(path.join(dir,filename),html);
console.log('Built Vectormissie v0.4 and the existing platform entrypoint');

// Battle panes reuse the renderer and validators without loading account/storage services.
const read=file=>fs.readFileSync(path.join(dir,file),'utf8');
let player=html.slice(0,html.indexOf('<script data-platform-root'));
player=player.replace(/<script src="[^"]*leraarbob-topbar\.js"[^>]*><\/script>/g,'');
player=player.replace(/ autofocus(?=[ >])/g,'');
player=player.replace('</head>','<style>'+read('styles/battle-player.css')+'</style></head>');
for(const file of ['vector-core.js','vector-lessons.js','vector-mission.js','vector-battle-player.js','vector-flight.js','vector-app.js']){
 const source=read(file);new vm.Script(source,{filename:file});player+='<script>'+source+'</script>';
}
player+='</body></html>';
fs.writeFileSync(path.join(dir,'battle-player.html'),player);
console.log('Built isolated battle player from the same trainer sources');
