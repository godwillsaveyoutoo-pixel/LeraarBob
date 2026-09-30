const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('../games/wortelbouw_pro_v0.5.0/wortelbouw/geometry.js');
const ctx={window:{WortelbouwGeometry:G,WortelbouwArenaOnly:true},document:{getElementById(){}},localStorage:{},setTimeout,clearTimeout};vm.runInNewContext(fs.readFileSync('games/wortelbouw_pro_v0.5.0/wortelbouw/battle.js','utf8'),ctx);
const Arena=ctx.window.WortelbouwArena;
const sizes=[[680,630],[471,350],[314,272],[390,362],[320,222],[280,180]];
const goals=[2,5,13,18,25,100,104];
function arena(n,width,height,embedded=false){
 const a=Object.create(Arena.prototype);Object.assign(a,{game:new G.Game(G.levels.findIndex(l=>l.n===n)),camera:{unit:42,x:0,y:0},width,height,gesture:null,canvas:{getBoundingClientRect:()=>({left:0,right:width,top:0,bottom:height})},undoButton:{getBoundingClientRect:()=>embedded?{left:-50,right:-6,top:0,bottom:44,width:44}:{left:9,right:53,top:height-53,bottom:height-9,width:44}}});return a;
}
function fits(a,points,label){const f=a.viewFrame();for(const p of points){const q=a.screen(p);assert(q.x>=f.left-1e-6&&q.x<=f.right+1e-6&&q.y>=f.top-1e-6&&q.y<=f.bottom+1e-6,label+': '+JSON.stringify({q,f,camera:a.camera}));}}
test('every legal triangle can be drawn within each split screen, on any free edge and from either corner',()=>{
 for(const [w,h] of sizes)for(const n of goals)for(let k=1;k<=G.maxLength({level:G.levels.findIndex(l=>l.n===n)});k++){
  const a=arena(n,w,h);a.game.commit({type:'start',k,x:73,y:-29});a.reframe();const s=a.game.state;
  fits(a,s.objects.flatMap(o=>o.points),'start square');
  for(const e of G.freeEdges(s,s.objects[0]))for(const flip of [false,true])for(const mode of ['sum','difference'])for(let leg=1;leg<=G.maxLength(s);leg++){
   const p=G.plan(s,'s0',e.index,leg,mode,flip);if(p?.valid)fits(a,p.triangle.points,`${w}×${h}, square ${k}, leg ${leg}, edge ${e.index}`);
  }
 }
});
test('pending helper and result squares fit even when the grabbed corner would keep them off-screen',()=>{
 for(const [w,h] of sizes)for(const [n,aSide,bSide,mode='sum'] of [[2,1,1],[5,1,2],[13,2,3],[18,3,3],[25,3,4],[100,6,8],[104,10,2],[104,2,10],[5,3,2,'difference']])for(const edgeIndex of [0,1,2,3])for(const flip of [false,true]){
  const a=arena(n,w,h);a.game.commit({type:'start',k:aSide,x:40,y:7});a.reframe();const p=G.plan(a.game.state,'s0',edgeIndex,bSide,mode,flip);assert(p.valid);const anchor=p.triangle.base.a,lock={world:anchor,screen:a.screen(anchor)};
  a.game.commit({type:'triangle',owner:'s0',edgeIndex,k:bSide,mode,flip});a.reframe(lock);
  fits(a,[...a.game.state.objects,a.game.state.pending.helper,a.game.state.pending.result].flatMap(o=>o.points),'complete build');
  const camera=JSON.stringify(a.camera);a.gesture={camera:{...a.camera}};a.reframe();assert.equal(JSON.stringify(a.camera),camera,'camera stays stable during a drag');a.gesture=null;
  for(const type of ['helper','result','reveal'])a.game.commit({type});assert.equal(a.game.state.phase,'won');a.reframe();fits(a,a.game.state.objects.flatMap(o=>o.points),'finished');
  a.game.undo();a.reframe();fits(a,a.objectsForView().flatMap(o=>o.points),'undo');
 }
});
test('empty boards fit the full starting ruler and embedded boards do not reserve space for an external undo button',()=>{
 for(const [w,h] of sizes){const a=arena(104,w,h),b=arena(104,w,h,true);a.reframe();b.reframe();const f=a.viewFrame();assert(a.camera.unit*10<=Math.min(f.right-f.left,f.bottom-f.top));assert(b.camera.unit>a.camera.unit);}
});
test('further builds reserve room around every remaining free edge, including rotated result fields',()=>{
 const a=arena(104,320,222);a.game.commit({type:'start',k:2,x:0,y:0});a.game.commit({type:'triangle',owner:'s0',edgeIndex:2,k:3,mode:'sum',flip:false});for(const type of ['helper','result','reveal'])a.game.commit({type});a.reframe();
 for(const e of a.freeEdges())for(const flip of [false,true])for(let k=1;k<=10;k++){const p=G.plan(a.game.state,e.owner,e.index,k,'sum',flip);if(p?.valid)fits(a,p.triangle.points,'continued build');}
});
