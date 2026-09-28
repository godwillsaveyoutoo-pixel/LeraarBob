// Keep multiplayer entrypoints aligned with the solo dependencies and shared shells.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),write=(p,s)=>fs.writeFileSync(path.join(root,p),s);
const rechten='games/rechten/rechtenwereld',wortel='games/wortelbouw_pro_v0.5.0/wortelbouw';
const dependencies=['../core/transfer-workbench-core.js','../core/transfer-core.js','../core/wave-core.js','semantic-math-core.js','evidence-adapter.js','points-core.js','lines-core.js','hills-core.js','grens-core.js','formula-core.js','derive-core.js','mission-runtime.js'];
for(const [folder,title,id,deps,modes] of [[rechten,'Rechtenwereld','rechten',dependencies,['classroom','battle']],[wortel,'Wortelbouw','wortelbouw',['geometry.js'],['classroom']]])for(const mode of modes){
 let s=read('games/vectoren/'+mode+'.html').replaceAll('../../shared/','../../../shared/').replaceAll('../../js/','../../../js/');
 s=s.replace(/href="styles\/([^"]+)"/g,'href="../../vectoren/styles/$1"').replaceAll('Vectormissie',title).replaceAll('Axioma_Vectorentrainer_v0.4_vectormissie.html','index.html');
 s=s.replace('data-game-href="games/vectoren/index.html"',`data-game-href="${folder}/index.html"`).replace('body class="',`body data-battle-game="${id}" class="`);
 s=s.replace('<script src="vector-core.js"></script><script src="vector-mission.js"></script>',deps.map(p=>`<script src="${p}"></script>`).join('')).replace('src="vector-battle-ranking.js"','src="../../vectoren/vector-battle-ranking.js"');
 s=s.replaceAll('Vectorwerkbord','Werkbord').replace('VECTOR<span>BATTLE','DUO<span>BATTLE').replace('KLAS<span>MISSIE','GROEPS<span>BATTLE').replace('Wie zet de juiste koers?','Wie lost de opgave het eerst op?').replace('Klaar voor de lancering?','Klaar om samen te spelen?').replace('ÉÉN KLAS · ÉÉN MISSIE','SAMEN LEREN · SAMEN SPELEN').replace('SAMEN OP KOERS','SPEEL MET JE KLAS').replace('De hele klas aan boord.','De hele klas doet mee.').replace('Mixed combineert ontbinden, vectoren in een figuur, kop-staart, optellen en aftrekken. De gegeven vectoren staan getekend.','Mixed combineert onderdelen uit de verschillende werelden. Kies een wereld of onderdeel voor een gerichte battle.').replace('style="--night-sky:url(../assets/vector-night-sky.svg)"','');
 write(folder+'/'+mode+'.html',s);
}
let player=read(rechten+'/index.html').replace(/<script src="[^"]*(?:supabase|axioma-|leraarbob-topbar|storage\.js)[^"]*"[^>]*><\/script>/g,'');
player=player.replace('<script src="app-shell.js" defer></script>','<script src="battle-config.js" defer></script><script src="../../../shared/multiplayer/player.js" defer></script><script src="app-shell.js" defer></script>').replace('</head>','<link rel="stylesheet" href="battle-player.css"></head>').replace('<body>','<body class="battle-player"><p id="battleStatus" role="status"></p>');
write(rechten+'/battle-player.html',player);console.log('Built Rechtenwereld and Wortelbouw multiplayer entrypoints');
