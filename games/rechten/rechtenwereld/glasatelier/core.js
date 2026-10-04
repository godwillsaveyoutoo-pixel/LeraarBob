/* Geometry and draft validation for the optional Glasatelier. No XP or mastery writes. */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.GlasatelierCore=factory();})(globalThis,function(){
'use strict';
const LIMIT=6,MAX_COORD=16,EPS=1e-8,MAX_LINES=12;
const DEFAULT_BOUNDS=Object.freeze({x:LIMIT,y:LIMIT});
const PALETTE=Object.freeze([
 {hex:'#edaa44',name:'Amber'}, {hex:'#db6380',name:'Rozenrood'},
 {hex:'#69b6ca',name:'Hemelblauw'}, {hex:'#8d79b9',name:'Amethist'},
 {hex:'#79ab81',name:'Saliegroen'}, {hex:'#e38251',name:'Koper'}
]);
const line=(a,b)=>Object.freeze({type:'function',a,b}),vertical=x=>Object.freeze({type:'vertical',x});
const PATTERNS=Object.freeze([
 Object.freeze({id:'morgenlicht',name:'Morgenlicht',subtitle:'4 lijnen · eerste licht',scheme:'sun',colors:['#f6c963','#f3a458','#e77863','#fce7ad','#b989ac','#80bfb3'],lines:Object.freeze([line(1,0),line(-1,0),line(0,2),vertical(-3)])}),
 Object.freeze({id:'kleurenpoort',name:'Kleurenpoort',subtitle:'6 lijnen · speelse facetten',scheme:'mosaic',colors:['#da7a8c','#efb866','#73b8bc','#818cb8','#bfa0c6','#a4c7a4'],lines:Object.freeze([line(.5,-2),line(-1,3),line(0,1),vertical(2),line(1,-4),line(-.5,-3)])}),
 Object.freeze({id:'avondgloed',name:'Avondgloed',subtitle:'8 lijnen · violet & koper',scheme:'rays',colors:['#514c87','#8974b8','#c893bb','#e27a71','#f7b96e','#73a7bc'],lines:Object.freeze([line(2,1),line(-2,-1),line(.5,3),line(-.5,-3),line(0,2),line(0,-2),vertical(-3),vertical(3)])}),
 Object.freeze({id:'zonneroos',name:'Zonneroos',subtitle:'6 lijnen · een gouden rozet',scheme:'rose',colors:['#ffe5a1','#f9bd54','#eb8059','#b65371','#744c83','#cf8f98'],lines:Object.freeze([line(1,0),line(-1,0),line(1,4),line(-1,4),line(1,-4),line(-1,-4)])}),
 Object.freeze({id:'noorderlicht',name:'Noorderlicht',subtitle:'8 lijnen · licht over de fjord',scheme:'sky',colors:['#304d78','#557ea4','#88c6cb','#b9dfcd','#75b598','#ebd8a1'],lines:Object.freeze([line(.5,0),line(-.5,0),line(.5,3),line(-.5,3),line(.5,-3),line(-.5,-3),vertical(-4),vertical(4)])}),
 Object.freeze({id:'pauwenveer',name:'Pauwenveer',subtitle:'8 lijnen · jade & saffier',scheme:'rays',colors:['#256d75','#48a6a2','#82c9b0','#326192','#6b75b4','#e5b763'],lines:Object.freeze([line(2,0),line(-2,0),line(2,4),line(-2,4),line(2,-4),line(-2,-4),line(0,2),line(0,-2)])}),
 Object.freeze({id:'kristaltuin',name:'Kristaltuin',subtitle:'10 lijnen · heldere kristallen',scheme:'rose',colors:['#e6e9cf','#a9cfc7','#72acbd','#9d9bcc','#d6afd1','#e8bf89'],lines:Object.freeze([line(1,2),line(-1,2),line(1,-2),line(-1,-2),line(1,5),line(-1,5),line(1,-5),line(-1,-5),vertical(0),line(0,0)])}),
 Object.freeze({id:'artdeco',name:'Art deco',subtitle:'8 lijnen · smaragd & goud',scheme:'deco',colors:['#245c57','#458c77','#86b6a0','#ecd28b','#bd9159','#e8e1c0'],lines:Object.freeze([line(2,0),line(-2,0),line(2,4),line(-2,4),line(2,-4),line(-2,-4),vertical(-3),vertical(3)])})
]);
function parseNumber(raw){
 const s=String(raw??'').trim().replace(/,/g,'.').replace(/−/g,'-');
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:\/[+-]?(?:\d+(?:\.\d*)?|\.\d+))?$/.test(s))return null;
 const [p,q]=s.split('/').map(Number),value=q===undefined?p:p/q;
 return Number.isFinite(value)?value:null;
}
function isPoint(p){return !!p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&Math.abs(p.x)<=MAX_COORD&&Math.abs(p.y)<=MAX_COORD;}
function validLine(l){return !!l&&(l.type==='vertical'?Number.isFinite(l.x)&&Math.abs(l.x)<=MAX_COORD:l.type==='function'&&Number.isFinite(l.a)&&Number.isFinite(l.b)&&Math.abs(l.a)<=32&&Math.abs(l.b)<=528);}
function signed(l,p){return l.type==='vertical'?p.x-l.x:p.y-l.a*p.x-l.b;}
function sameLine(a,b){return a.type===b.type&&(a.type==='vertical'?Math.abs(a.x-b.x)<EPS:Math.abs(a.a-b.a)<EPS&&Math.abs(a.b-b.b)<EPS);}
function check(l,points){
 if(!Array.isArray(points)||points.length!==2||points.some(p=>!isPoint(p)))return {ok:false,kind:'missing',text:'Tik twee punten aan in het glas.'};
 if(points[0].x===points[1].x&&points[0].y===points[1].y)return {ok:false,kind:'same',text:'Twee verschillende punten bepalen een rechte. Verplaats één van je punten.'};
 const wrong=points.map((p,i)=>Math.abs(signed(l,p))>EPS?i:-1).filter(i=>i>=0);
 if(wrong.length)return {ok:false,kind:'off-line',wrong,text:'Nog niet de juiste lijn. Sleep een punt of tik het weg.'};
 return {ok:true,kind:'correct',text:'Goed! Jouw rechte wordt een loodrand.'};
}
function numberText(n){if(Number.isInteger(n))return String(n).replace('-','−');if(Math.abs(n*2-Math.round(n*2))<1e-12)return (n<0?'−':'')+(Math.abs(n)===.5?'½':String(Math.floor(Math.abs(n)))+'½');for(let d=3;d<=32;d++)if(Math.abs(n*d-Math.round(n*d))<1e-12)return (n<0?'−':'')+Math.abs(Math.round(n*d))+'/'+d;return String(n).replace('.',',').replace('-','−');}
function formula(l){
 if(l.type==='vertical')return 'x = '+numberText(l.x);
 if(l.a===0)return 'y = '+numberText(l.b);
 const coefficient=numberText(l.a),term=l.a===1?'x':l.a===-1?'−x':(coefficient.includes('/')?'('+coefficient+')':coefficient)+'x';
 return 'y = '+term+(l.b===0?'':(l.b<0?' − ':' + ')+numberText(Math.abs(l.b)));
}
function tidy(poly){
 const clean=[];
 for(const p of poly)if(!clean.length||Math.hypot(p.x-clean.at(-1).x,p.y-clean.at(-1).y)>EPS)clean.push(p);
 if(clean.length>1&&Math.hypot(clean[0].x-clean.at(-1).x,clean[0].y-clean.at(-1).y)<EPS)clean.pop();
 return clean;
}
function area(poly){return Math.abs(poly.reduce((sum,p,i)=>{const q=poly[(i+1)%poly.length];return sum+p.x*q.y-q.x*p.y;},0))/2;}
function clip(poly,l,side){
 const out=[];
 for(let i=0;i<poly.length;i++){
  const p=poly[i],q=poly[(i+1)%poly.length],dp=side*signed(l,p),dq=side*signed(l,q),inside=dp>=-EPS,next=dq>=-EPS;
  if(inside)out.push(p);
  if(inside!==next){const t=dp/(dp-dq);out.push({x:p.x+t*(q.x-p.x),y:p.y+t*(q.y-p.y)});}
 }
 return tidy(out);
}
function cells(lines,bounds=DEFAULT_BOUNDS){
 const {x,y}=bounds;
 let result=[{id:'r',points:[{x:-x,y:-y},{x,y:-y},{x,y},{x:-x,y}]}];
 for(const l of lines){
  result=result.flatMap(cell=>{
   const halves=[clip(cell.points,l,1),clip(cell.points,l,-1)].filter(p=>p.length>=3&&area(p)>EPS);
   return halves.length<2?[cell]:halves.map((points,i)=>({id:cell.id+i,points}));
  });
 }
 return result;
}
function segment(l,bounds=DEFAULT_BOUNDS){
 const {x,y}=bounds,square=[{x:-x,y:-y},{x,y:-y},{x,y},{x:-x,y}],hits=[];
 const add=p=>{if(!hits.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<EPS))hits.push(p);};
 square.forEach((p,i)=>{const q=square[(i+1)%4],dp=signed(l,p),dq=signed(l,q);if(Math.abs(dp)<EPS)add(p);if(dp*dq<0){const t=dp/(dp-dq);add({x:p.x+t*(q.x-p.x),y:p.y+t*(q.y-p.y)});}});
 return hits.length>=2?[hits[0],hits[1]]:null;
}
function fromPoints([p,q]){if(!p||!q||p.x===q.x&&p.y===q.y)return null;if(p.x===q.x)return {type:'vertical',x:p.x};const a=(q.y-p.y)/(q.x-p.x);return {type:'function',a,b:p.y-a*p.x};}
function blank(){return {count:0,points:[null,null],active:0,coords:{x:0,y:0},history:[],colors:{},done:false};}
function initial(){return {version:1,mode:'restore',pattern:'zonneroos',drafts:Object.fromEntries(PATTERNS.map(p=>[p.id,blank()])),free:{lines:[],points:[null,null],history:[],colors:{},inputs:{type:'function',a:'1/2',b:'-2'}},palette:0,tool:'draw',grid:true,light:false};}
function cleanColors(raw){const result={};if(raw&&typeof raw==='object')for(const [key,value]of Object.entries(raw).slice(0,500))if(/^r[01]{0,12}$/.test(key)&&/^#[0-9a-f]{6}$/i.test(value))result[key]=value;return result;}
const cleanPoints=points=>[0,1].map(i=>isPoint(points?.[i])?{x:points[i].x,y:points[i].y}:null);
const copyLines=lines=>(Array.isArray(lines)?lines:[]).slice(0,MAX_LINES).filter(validLine).map(l=>l.type==='vertical'?{type:l.type,x:l.x}:{type:l.type,a:l.a,b:l.b});
function cleanHistory(raw,total,design=false){return (Array.isArray(raw)?raw:[]).filter(h=>h&&typeof h==='object').slice(-32).map(h=>design?{lines:copyLines(h.lines),points:cleanPoints(h.points)}:{count:Number.isInteger(h.count)?Math.max(0,Math.min(total,h.count)):0,points:cleanPoints(h.points)});}
function restore(raw){
 const state=initial();if(!raw||raw.version!==1)return state;
 state.mode=raw.mode==='design'?'design':'restore';state.pattern=PATTERNS.some(p=>p.id===raw.pattern)?raw.pattern:state.pattern;
 state.palette=Number.isInteger(raw.palette)&&raw.palette>=0&&raw.palette<PALETTE.length?raw.palette:0;
 state.grid=raw.grid!==false;state.light=raw.light===true;
 state.tool=raw.tool==='paint'?'paint':'draw';
 for(const p of PATTERNS){const d=raw.drafts?.[p.id];if(!d)continue;const count=Number.isInteger(d.count)?Math.max(0,Math.min(p.lines.length,d.count)):0;state.drafts[p.id]={count,points:cleanPoints(d.points),active:d.active===1?1:0,coords:isPoint(d.coords)?{x:d.coords.x,y:d.coords.y}:{x:0,y:0},history:cleanHistory(d.history,p.lines.length),colors:cleanColors(d.colors),done:d.done===true||count===p.lines.length};}
 const lines=[];for(const l of Array.isArray(raw.free?.lines)?raw.free.lines.slice(0,MAX_LINES):[]){if(validLine(l)&&!lines.some(x=>sameLine(x,l)))lines.push(l.type==='vertical'?{type:l.type,x:l.x}:{type:l.type,a:l.a,b:l.b});}
 const inputs=raw.free?.inputs||{},text=value=>typeof value==='string'?value.slice(0,16):'';
 state.free={lines,points:cleanPoints(raw.free?.points),history:cleanHistory(raw.free?.history,MAX_LINES,true),colors:cleanColors(raw.free?.colors),inputs:{type:inputs.type==='vertical'?'vertical':'function',a:typeof inputs.a==='string'?text(inputs.a):'1/2',b:typeof inputs.b==='string'?text(inputs.b):'-2'}};return state;
}
function colorFor(cell,colors,index,preset){
 let key=cell.id;while(key){if(colors[key])return colors[key];key=key.slice(0,-1);}
 if(!preset)return PALETTE[index%PALETTE.length].hex;
 const x=cell.points.reduce((s,p)=>s+p.x,0)/cell.points.length,y=cell.points.reduce((s,p)=>s+p.y,0)/cell.points.length,r=Math.hypot(x,y),angle=Math.atan2(y,x);
 const which=preset.scheme==='rose'?Math.floor(r/2)+Math.round(Math.abs(angle)*2):preset.scheme==='sky'?Math.floor((y+12)/2)+Math.floor(Math.abs(x)/4):preset.scheme==='deco'?(Math.abs(x)<2&&Math.abs(y)<3?3:Math.abs(y)>3&&Math.abs(x)<3?4:Math.floor(Math.abs(x)/2)%3):preset.scheme==='sun'?Math.floor((y+12)/3)+Math.round(Math.abs(x)/3):preset.scheme==='rays'?Math.floor((angle+Math.PI)*3)+Math.floor(r/3):index*5+Math.floor(r);
 return preset.colors[((which%6)+6)%6];
}
function remember(d,design=false){d.history||=[];d.history.push(design?{lines:copyLines(d.lines),points:cleanPoints(d.points)}:{count:d.count,points:cleanPoints(d.points)});d.history=d.history.slice(-32);}
function undo(d,design=false){const previous=d.history?.pop();if(previous){d.points=cleanPoints(previous.points);if(design)d.lines=copyLines(previous.lines);else d.count=previous.count;return true;}if(design&&d.lines.length){d.lines.pop();d.points=[null,null];return true;}if(!design&&d.count){d.count--;d.points=[null,null];return true;}return false;}
function slot(points,p){const empty=points.findIndex(x=>!x);if(empty>=0)return empty;return Math.hypot(points[0].x-p.x,points[0].y-p.y)<Math.hypot(points[1].x-p.x,points[1].y-p.y)?0:1;}
return Object.freeze({LIMIT,MAX_COORD,DEFAULT_BOUNDS,MAX_LINES,PALETTE,PATTERNS,parseNumber,isPoint,validLine,signed,sameLine,check,numberText,formula,area,cells,segment,fromPoints,initial,restore,colorFor,remember,undo,slot});
});
