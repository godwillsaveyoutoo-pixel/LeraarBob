const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.join(__dirname,'../games/reele-getallen');let html=fs.readFileSync(path.join(dir,'real-shell.html'),'utf8');
for(const [token,file] of [['REAL_STYLE','real-style.css'],['REAL_CORE','real-core.js'],['REAL_LESSONS','real-lessons.js'],['REAL_APP','real-app.js'],['REAL_PLATFORM','../../shared/axioma-platform.js'],['GAME_ADAPTERS','../../shared/axioma-game-adapters.js'],['GAME_RUNTIME','../../shared/axioma-game.js']]){const source=fs.readFileSync(path.join(dir,file),'utf8');if(file.endsWith('.js'))new vm.Script(source,{filename:file});html=html.replace('/* '+token+' */',()=>source)}
fs.writeFileSync(path.join(dir,'index.html'),html);console.log('Built Reële Getallen trainer');
