// Build a portable, offline HTML from reviewable source layers. No dependencies.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.join(__dirname,'../games/vectoren');
let html=fs.readFileSync(path.join(dir,'vector-shell.html'),'utf8');
for(const [token,file] of [['VECTOR_PLATFORM','../../shared/axioma-platform.js'],['VECTOR_STYLE','vector-style.css'],['VECTOR_CORE','vector-core.js'],['VECTOR_APP','vector-app.js'],['VECTOR_LESSONS','vector-lessons.js'],['GAME_ADAPTERS','../../shared/axioma-game-adapters.js'],['GAME_RUNTIME','../../shared/axioma-game.js']]){const source=fs.readFileSync(path.join(dir,file),'utf8');if(file.endsWith('.js'))new vm.Script(source,{filename:file});html=html.replace('/* '+token+' */',()=>source);}
fs.writeFileSync(path.join(dir,'Axioma_Vectorentrainer_v0.2.html'),html);
console.log('Built Axioma_Vectorentrainer_v0.2.html');
