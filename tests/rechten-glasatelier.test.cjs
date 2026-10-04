'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../games/rechten/rechtenwereld/glasatelier/core.js');
test('given patterns have drawable integer points and validate every pair, including verticals',()=>{
 for(const p of C.PATTERNS)for(const l of p.lines){
  const on=[],off=[];
  for(let x=-6;x<=6;x++)for(let y=-6;y<=6;y++)(Math.abs(C.signed(l,{x,y}))<1e-9?on:off).push({x,y});
  assert(on.length>=2,C.formula(l));
  for(let i=0;i<on.length;i++)for(let j=i+1;j<on.length;j++)assert.equal(C.check(l,[on[i],on[j]]).ok,true);
  for(const q of off)assert.equal(C.check(l,[on[0],q]).ok,false);
  assert.equal(C.check(l,[on[0],on[0]]).kind,'same');assert.equal(C.check(l,[on[0],null]).kind,'missing');
 }
});
function partition(lines){
 const cells=C.cells(lines);assert(Math.abs(cells.reduce((sum,c)=>sum+C.area(c.points),0)-144)<1e-7);
 assert.equal(new Set(cells.map(c=>c.id)).size,cells.length);
 for(const c of cells){assert(C.area(c.points)>1e-8);for(const p of c.points)assert(Math.abs(p.x)<=6.00000001&&Math.abs(p.y)<=6.00000001);for(const l of lines){const signs=c.points.map(p=>C.signed(l,p));assert(signs.every(v=>v>=-1e-7)||signs.every(v=>v<=1e-7),'cell crosses a lead line');}}
 return cells;
}
test('glass partitions cover the window exactly and never cross a lead line',()=>{
 for(const p of C.PATTERNS)for(let i=0;i<=p.lines.length;i++)partition(p.lines.slice(0,i));
 let seed=371;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
 for(let run=0;run<60;run++){const lines=Array.from({length:12},()=>random()<.2?{type:'vertical',x:Math.round(random()*12-6)}:{type:'function',a:(Math.round(random()*12)-6)/2,b:Math.round(random()*12-6)});partition(lines);}
});
test('coincident, boundary and corner-touching lines do not produce empty glass pieces',()=>{
 const diagon={type:'function',a:1,b:0},v={type:'vertical',x:0};
 assert.equal(partition([diagon,diagon]).length,2);assert.equal(partition([diagon,v]).length,4);
 assert.equal(partition([{type:'vertical',x:6},{type:'function',a:0,b:-6},{type:'function',a:1,b:12}]).length,1);
 assert.deepEqual(C.segment({type:'vertical',x:-3}),[{x:-3,y:-6},{x:-3,y:6}]);assert.equal(C.segment({type:'function',a:1,b:12}),null);
});
test('formula entry accepts finite fractions and comma decimals and rejects incomplete or unsafe text',()=>{
 for(const [s,n]of [['1/2',.5],['-3/2',-1.5],['−1,5',-1.5],['.5',.5],['2/-4',-.5]])assert.equal(C.parseNumber(s),n);
 for(const s of ['', '1/0', '1/', 'NaN','Infinity','1/2/3','<script>', '1e7'])assert.equal(C.parseNumber(s),null,s);
 assert.equal(C.formula({type:'function',a:-.5,b:2}),'y = −½x + 2');assert.equal(C.formula({type:'function',a:0,b:-2}),'y = −2');assert.equal(C.formula({type:'vertical',x:-3}),'x = −3');
});
test('draft restoration preserves unfinished work, free inputs, colors and earned completions',()=>{
 const state=C.initial(),d=state.drafts.morgenlicht;d.count=2;d.points=[{x:1,y:2},null];d.coords={x:4,y:-3};d.active=1;d.colors.r01=C.PALETTE[2].hex;state.drafts.avondgloed.done=true;state.mode='design';state.light=true;state.free.lines=[{type:'function',a:.5,b:-2}];state.free.inputs={type:'function',a:'1/',b:'-2'};
 assert.deepEqual(C.restore(JSON.parse(JSON.stringify(state))),state);
 const hostile={version:1,pattern:'missing',drafts:{morgenlicht:{count:900,points:[{x:Infinity,y:0},{x:0,y:17}],colors:{'<svg>':'red',r0:'javascript:1'}}},free:{lines:[{type:'function',a:NaN,b:0},{type:'vertical',x:100}]}};
 const clean=C.restore(hostile);assert.equal(clean.drafts.morgenlicht.count,4);assert.deepEqual(clean.drafts.morgenlicht.points,[null,null]);assert.deepEqual(clean.drafts.morgenlicht.colors,{});assert.deepEqual(clean.free.lines,[]);
 assert.equal(C.colorFor({id:'r010'},{r01:C.PALETTE[4].hex},0),C.PALETTE[4].hex,'new pieces inherit the parent color');
});
test('rectangular phone windows keep exact area and line endpoints for each design',()=>{
 for(const bounds of [{x:11,y:6},{x:6,y:10},{x:16,y:6}])for(const p of C.PATTERNS){const parts=C.cells(p.lines,bounds);assert(Math.abs(parts.reduce((a,c)=>a+C.area(c.points),0)-bounds.x*bounds.y*4)<1e-7);for(const l of p.lines){const ends=C.segment(l,bounds);assert.equal(ends.length,2);for(const point of ends)assert(Math.abs(C.signed(l,point))<1e-7);}}
});
test('editing and undo retain accepted work, including after save/reload and final completion',()=>{
 let state=C.initial(),d=state.drafts.zonneroos;
 C.remember(d);d.points[0]={x:0,y:0};C.remember(d);d.points[1]={x:2,y:1};
 assert.equal(C.slot(d.points,{x:3,y:2}),1);
 C.remember(d);d.points[1]={x:2,y:2};C.remember(d);d.count++;d.points=[null,null];
 state=C.restore(JSON.parse(JSON.stringify(state)));d=state.drafts.zonneroos;
 assert(C.undo(d));assert.equal(d.count,0);assert.deepEqual(d.points,[{x:0,y:0},{x:2,y:2}]);
 assert(C.undo(d));assert.deepEqual(d.points[1],{x:2,y:1});
 d.count=6;d.done=true;d.history=[];assert(C.undo(d));assert.equal(d.count,5);assert(d.done,'previously earned completion remains');
 const free=state.free;C.remember(free,true);free.lines.push({type:'vertical',x:9});free.points=[{x:9,y:0},{x:9,y:2}];assert(C.undo(free,true));assert.deepEqual(free.lines,[]);assert.deepEqual(free.points,[null,null]);
});
test('older three-window drafts migrate without resetting their points, colors or completions',()=>{
 const old={version:1,mode:'restore',pattern:'morgenlicht',drafts:{morgenlicht:{count:2,points:[{x:2,y:2},null],active:1,coords:{x:2,y:2},colors:{r0:'#edaa44'},done:true}},free:{lines:[{type:'function',a:.5,b:-2}],colors:{},inputs:{type:'function',a:'1/2',b:'-2'}},palette:2,grid:true,light:false};
 const state=C.restore(old);assert.equal(state.pattern,old.pattern);assert.equal(state.drafts.morgenlicht.count,2);assert.deepEqual(state.drafts.morgenlicht.points,old.drafts.morgenlicht.points);assert.deepEqual(state.drafts.morgenlicht.colors,old.drafts.morgenlicht.colors);assert(state.drafts.morgenlicht.done);assert.equal(Object.keys(state.drafts).length,8);assert.deepEqual(state.free.lines,old.free.lines);
});
