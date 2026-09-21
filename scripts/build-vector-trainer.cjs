// Build a portable, offline HTML from reviewable source layers. No dependencies.
const fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'../games/vectoren');
let html=fs.readFileSync(path.join(dir,'vector-shell.html'),'utf8');
for(const [token,file] of [['VECTOR_PLATFORM','../../shared/axioma-platform.js'],['VECTOR_STYLE','vector-style.css'],['VECTOR_CORE','vector-core.js'],['VECTOR_APP','vector-app.js']])html=html.replace('/* '+token+' */',()=>fs.readFileSync(path.join(dir,file),'utf8'));
fs.writeFileSync(path.join(dir,'Axioma_Vectorentrainer_v0.2.html'),html);
console.log('Built Axioma_Vectorentrainer_v0.2.html');
