// Build an isolated copy of the actual standalone Stelsels renderer, without account/XP services.
const fs=require('node:fs');
let html=fs.readFileSync('games/stelsels.html','utf8');
html=html.slice(0,html.indexOf('<style id="axioma-simple-integration-css">'));
html=html.replace(/<script src="[^"\n]*(?:axioma-platform|leraarbob-topbar)\.js"[^>]*><\/script>/g,'');
html=html.replace('src="stelsels/exercises.js"','src="exercises.js"');
html=html.replace('<script type="text/axioma-game">','<script>window.StelselsTaskIsolated=true;window.AxiomaGame={storage:{getItem:()=>null,setItem:()=>{}}};</script><script>');
html=html.replace('<header>','<header><p id="taskApproach"></p>');
html=html.replace('<script src="exercises.js">','<script src="task-draft.js"></script><script src="exercises.js">');
html=html.replace('</head>','<link rel="stylesheet" href="task-player.css"></head>');
html+='<footer class="task-controls"><span id="taskStatus" role="status"></span><button id="taskSkip">Ik pas</button><button id="taskSubmit" disabled>Uitwerking indienen</button></footer><script src="task-config.js"></script><script src="task-bridge.js"></script></body></html>';
fs.writeFileSync('games/stelsels/task-player.html',html);
