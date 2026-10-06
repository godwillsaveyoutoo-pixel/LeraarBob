/* Meaningful, time-based ink. Every pose can be reconstructed and replayed. */
(()=>{
 const clamp=x=>Math.min(1,Math.max(0,x));
 const ease=x=>1-Math.pow(1-clamp(x),3);
 const palettes={
  ink:{light:'#a05e35',dark:'#e5b980'},
  blue:{light:'#155fba',dark:'#83baff'},
  amber:{light:'#965100',dark:'#ffd066'},
  red:{light:'#b82e36',dark:'#ff9295'},
  teal:{light:'#076f60',dark:'#79ddc0'}
 };
 const palette=(name,dark)=>palettes[name]?.[dark?'dark':'light']||palettes.ink[dark?'dark':'light'];
 const spring=x=>x<=0?0:x>=1?1:1-Math.exp(-7*x)*Math.cos(10*x);
 function paint(ctx,art,ms,options={}){
  const {dark=false,seed=37,phase=0,silence=false,paths=[],from=[],to=[],duration=2000,installed=3,passengers=2,sailing=false,color='ink'}=options;
  const t=Math.min(10,ms/1000),p=ease(t/1.7),ink=dark?'#f3efe2':'#222b2b',accent=palette(color,dark);
  ctx.clearRect(0,0,1000,620);ctx.strokeStyle=ink;ctx.fillStyle=ink;ctx.lineWidth=2.6;ctx.lineCap='round';ctx.lineJoin='round';
  function line(points,progress=p,color=ink){
   if(!points?.length)return;ctx.strokeStyle=color;ctx.beginPath();const n=(points.length-1)*clamp(progress);ctx.moveTo(...points[0]);
   for(let i=1;i<=Math.floor(n);i++)ctx.lineTo(...points[i]);const k=Math.floor(n);
   if(k+1<points.length)ctx.lineTo(points[k][0]+(points[k+1][0]-points[k][0])*(n-k),points[k][1]+(points[k+1][1]-points[k][1])*(n-k));ctx.stroke();
  }
  function circle(x,y,r,color=ink,progress=p){const points=[];for(let i=0;i<=60;i++){const a=-Math.PI/2+i*Math.PI/30,rr=r+.45*Math.sin(a*5+seed);points.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);}line(points,progress,color);}
  function dot(x,y,r=5,color=accent){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function text(s,x,y,size=22,color=ink,{mono=false,align='left'}={}){ctx.fillStyle=color;ctx.textAlign=align;ctx.font=`${size}px ${mono?'ui-monospace, monospace':'"StageHand", Georgia, serif'}`;ctx.fillText(s,x,y);ctx.textAlign='left';}
  // Illustrated cast: shaped silhouettes, fabric, faces and hands, not skeletal symbols.
  function shape(path,fill,stroke=ink,width=2){ctx.beginPath();path(ctx);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
  function ellipse(x,y,rx,ry,fill,stroke=null){shape(c=>c.ellipse(x,y,rx,ry,0,0,Math.PI*2),fill,stroke);}
  function curls(x,y,size=1){
   ctx.save();ctx.translate(x,y);ctx.scale(size,size);
   // Interlocking locks: warm brown depth, grey curls and a few blond highlights.
   ellipse(0,-3,78,48,'#756451');
   const locks=[[-66,12,23,0],[-66,-13,25,1],[-47,-34,26,0],[-17,-44,25,2],[14,-46,26,1],[43,-36,26,0],[66,-17,25,2],[69,10,22,1],[-44,7,25,1],[-14,-3,26,0],[18,-5,27,2],[45,8,23,0]];
   const colors=['#897159','#aaa79e','#c3aa80'];
   for(const [lx,ly,r,tint] of locks){ellipse(lx,ly,r,r*.86,colors[tint]);ctx.beginPath();ctx.arc(lx-2,ly+1,r*.48,-2.5,1.1);ctx.strokeStyle='#625747';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(lx+1,ly-1,r*.73,-2.1,-.55);ctx.strokeStyle=tint===1?'#d5d1c5':'#dfc598';ctx.lineWidth=2.5;ctx.stroke();}
   ctx.restore();
  }
  function person(x,y,size=1,{arm='rest',progress=p,variant=0,facing=1,teacher=false}={}){
   const skin=teacher?'#e9b78f':['#dfab86','#af7657','#ecc4a0'][variant%3],shirt=palette(['blue','teal','amber'][variant%3],dark),hair='#29343e';
   ctx.save();ctx.translate(x,y+8*(1-progress));ctx.scale(size*facing,size);ctx.globalAlpha*=Math.min(1,progress*2);
   ellipse(0,94,35,6,dark?'#ffffff0d':'#26354112');
   // Separate trouser legs and solid shoes give the figure weight.
   shape(c=>{c.moveTo(-21,57);c.lineTo(22,57);c.lineTo(20,87);c.lineTo(7,87);c.lineTo(0,67);c.lineTo(-6,87);c.lineTo(-21,87);c.closePath();},'#354958');
   ellipse(-15,89,12,5,hair);ellipse(16,89,12,5,hair);
   shape(c=>{c.moveTo(-10,18);c.bezierCurveTo(-36,19,-34,35,-39,53);c.quadraticCurveTo(-33,60,-26,53);c.lineTo(-21,36);c.lineTo(-22,61);c.quadraticCurveTo(0,67,23,61);c.lineTo(22,35);if(arm==='point'){c.lineTo(39,29);c.lineTo(51,17);c.lineTo(45,10);c.lineTo(29,22);}else{c.lineTo(28,52);c.quadraticCurveTo(34,61,40,52);c.lineTo(32,27);}c.quadraticCurveTo(22,18,10,18);c.closePath();},shirt);
   ellipse(-33,54,6,7,skin,ink);ellipse(arm==='point'?49:34,arm==='point'?14:54,6,7,skin,ink);
   shape(c=>{c.moveTo(-8,9);c.lineTo(-8,22);c.quadraticCurveTo(0,30,9,22);c.lineTo(9,9);c.closePath();},skin);
   ellipse(-20,-1,5,8,skin,ink);ellipse(20,-1,5,8,skin,ink);
   shape(c=>{c.moveTo(-20,-11);c.bezierCurveTo(-22,-39,24,-37,21,-9);c.lineTo(19,6);c.quadraticCurveTo(2,31,-17,8);c.closePath();},skin);
   if(teacher)curls(0,-22,.28);else shape(c=>{c.moveTo(-21,-4);c.bezierCurveTo(-31,-35,7,-42,23,-24);c.lineTo(23,-6);c.lineTo(15,-17);c.quadraticCurveTo(2,-12,-12,-22);c.lineTo(-17,-3);c.closePath();},hair,null);
   dot(-7,-3,1.8,hair);dot(8,-3,1.8,hair);line([[1,0],[3,5],[0,6]],1,'#875e48');
   ctx.beginPath();ctx.arc(1,8,6,.2,2.5);ctx.strokeStyle=hair;ctx.lineWidth=1.3;ctx.stroke();
   line([[-12,33],[-13,51]],1,dark?'#ffffff55':'#ffffff80');line([[7,24],[14,29],[20,24]],1,dark?'#ffffff55':'#ffffff80');ctx.restore();
  }
  function paper(x,y,w=90,h=110,progress=p){
   ctx.save();ctx.globalAlpha*=clamp(progress*2);const fold=Math.min(22,w*.17);
   shape(c=>c.roundRect(x+7,y+8,w,h,4),dark?'#00000030':'#22344918',null);
   shape(c=>{c.moveTo(x,y);c.lineTo(x+w-fold,y);c.lineTo(x+w,y+fold);c.lineTo(x+w,y+h);c.lineTo(x,y+h);c.closePath();},dark?'#dcdccc':'#fffdf5',dark?'#acb9b5':ink,2);
   shape(c=>{c.moveTo(x+w-fold,y);c.lineTo(x+w-fold,y+fold);c.lineTo(x+w,y+fold);c.closePath();},dark?'#b3c4c7':'#d7e2e3',ink,1.5);ctx.restore();
  }
  function tick(x,y,progress=p){line([[x,y],[x+10,y+11],[x+28,y-16]],progress,accent);}
  function cross(x,y,progress=p){line([[x-12,y-12],[x+12,y+12]],progress,accent);line([[x+12,y-12],[x-12,y+12]],progress,accent);}
  // One ink impact, with a fixed trajectory. No repeating flash or random particles.
  function burst(x,y,start=0,radius=110,count=12){const q=(t-start)/.85;if(q<=0||q>=1)return;ctx.save();ctx.globalAlpha=Math.pow(1-q,1.4);ctx.lineWidth=3.5;
   for(let i=0;i<count;i++){const a=i*Math.PI*2/count+seed*.07,r=18+radius*ease(q),length=(8+i%3*7)*(1-q);line([[x+Math.cos(a)*r,y+Math.sin(a)*r],[x+Math.cos(a)*(r+length),y+Math.sin(a)*(r+length)]],1,accent);}
   circle(x,y,12+radius*ease(q)*.7,accent,1);ctx.restore();
  }
  function wash(x,y,w,h,opacity=.1){ctx.save();ctx.globalAlpha*=opacity;ctx.fillStyle=accent;ctx.beginPath();ctx.moveTo(x-5,y+5);ctx.lineTo(x+w,y);ctx.lineTo(x+w+6,y+h-4);ctx.lineTo(x,y+h);ctx.closePath();ctx.fill();ctx.restore();}
  function stamp(x,y,yes,start=.15){const q=clamp((t-start)/.6);if(!q)return;ctx.save();ctx.translate(x,y);const scale=1+(1-spring(q))*.9;ctx.scale(scale,scale);ctx.rotate((1-q)*-.18);ctx.globalAlpha=q;ctx.lineWidth=4.5;if(yes)tick(-12,0,1);else cross(0,0,1);ctx.restore();burst(x,y,start+.18,64,9);}
  function along(points,q){const n=clamp(q)*(points.length-1),i=Math.floor(n),a=points[i],b=points[Math.min(i+1,points.length-1)];return [a[0]+(b[0]-a[0])*(n-i),a[1]+(b[1]-a[1])*(n-i)];}
  const route=[[170,350],[290,350],[365,270],[470,300],[575,225],[670,245],[815,175]];
  if(art==='opening'){const q=ease(t/.9);ctx.save();ctx.lineWidth=4;line([[140,310],[870,310]],q,accent);dot(140+730*q,310,5,accent);ctx.restore();burst(870,310,.62,88,10);line([[140,326],[260,326]],ease((t-.7)/.5),accent);}
  if(art==='slope'){
   const blue=palette('blue',dark),green=palette('teal',dark),red=palette('red',dark);
   if(!phase){
    wash(165,80,680,435,.06);ctx.save();ctx.lineWidth=1;ctx.globalAlpha=.16;
    for(let x=200;x<=800;x+=200)line([[x,110],[x,490]],1,ink);
    for(let y=50;y<=450;y+=200)line([[180,y],[820,y]],1,ink);ctx.restore();
    ctx.lineWidth=3;line([[180,450],[840,450]],1,ink);line([[200,490],[200,95]],1,ink);text('x',852,461,30);text('y',186,78,30);
    ctx.lineWidth=8;line([[200,400],[800,100]],ease(t/1.4),blue);
    const q=ease((t-.7)/1.2);ctx.lineWidth=6;line([[300,350],[700,350]],q,green);line([[700,350],[700,150]],ease((t-1.5)/1.1),red);
    dot(300,350,10,blue);dot(700,150,10,blue);text('2 naar rechts',500,390,34,green,{align:'center'});text('1 omhoog',720,260,30,red);text('a = 1 / 2',500,555,54,blue,{align:'center'});
   }else{
    for(const [i,label,c,a,b] of [[0,'POSITIEF',green,390,190],[1,'NEGATIEF',red,190,390],[2,'NUL',blue,290,290]]){
     const x=45+i*320;ctx.save();ctx.fillStyle=dark?'#ffffff08':'#ffffff90';ctx.beginPath();ctx.roundRect(x,105,290,405,22);ctx.fill();ctx.lineWidth=2;line([[x+30,450],[x+260,450]],1,ink);line([[x+45,465],[x+45,145]],1,ink);ctx.lineWidth=8;line([[x+55,a],[x+245,b]],ease((t-i*.2)/1.2),c);dot(x+245,b,8,c);text(label,x+145,560,32,c,{align:'center'});ctx.restore();
    }
   }
  }
  if(art==='horizon'){line([[90,350],[230,348],[375,351],[550,347],[720,349],[910,346]]);line([[340,345],[500,165],[660,345]],p,accent);circle(500,165,9,accent);}
  if(art==='package'){
   const open=phase?1:spring((t-.35)/1.3);
   ellipse(504,469,156,17,dark?'#ffffff0d':'#26354112');
   shape(c=>{c.moveTo(385,300);c.lineTo(500,340);c.lineTo(500,462);c.lineTo(385,420);c.closePath();},'#d9a86d');
   shape(c=>{c.moveTo(500,340);c.lineTo(615,300);c.lineTo(615,420);c.lineTo(500,462);c.closePath();},'#ad7848');
   shape(c=>{c.moveTo(385,300);c.lineTo(500,258-open*60);c.lineTo(615,300);c.lineTo(500,340);c.closePath();},'#644a38');
   shape(c=>{c.moveTo(385,300);c.lineTo(335,268-open*35);c.lineTo(450,228-open*60);c.lineTo(500,258-open*60);c.closePath();},'#efca92');
   shape(c=>{c.moveTo(500,258-open*60);c.lineTo(560,216-open*25);c.lineTo(675,260);c.lineTo(615,300);c.closePath();},'#f4d8a7');
   shape(c=>{c.moveTo(418,344);c.lineTo(461,358);c.lineTo(461,397);c.lineTo(418,383);c.closePath();},'#fff2d8',null);line([[428,358],[450,365]],1,'#936542');line([[428,369],[444,374]],1,'#936542');line([[385,300],[500,340],[615,300],[615,420],[500,462],[385,420],[385,300]]);
   line([[500,340],[500,462]]);line([[385,300],[500,258-open*60],[615,300]],p,accent);
   line([[385,300],[335,268-open*35],[450,228-open*60],[500,258-open*60]]);
   line([[500,258-open*60],[560,216-open*25],[675,260],[615,300]]);
   if(open>.4){const q=ease((open-.4)/.6);ctx.save();ctx.lineWidth=4;line([[425,278],[455,198],[490,245],[535,150],[580,277]],q,accent);dot(535,150,6);ctx.restore();}if(!phase)burst(500,255,.65,160,16);
  }
  if(art==='contract'||art==='route'){
   // A full-size illustrated landscape: the destination is shared, the journey is active.
   const navy=dark?'#38637a':'#244d63',blue=palette('blue',dark),gold=dark?'#ffd066':'#d99b32',green=dark?'#47796f':'#77a797';
   ellipse(520,518,389,30,dark?'#ffffff0a':'#26354110');
   shape(c=>{c.moveTo(80,426);c.bezierCurveTo(154,334,245,410,336,305);c.bezierCurveTo(440,201,519,322,601,203);c.lineTo(749,84);c.lineTo(889,295);c.lineTo(928,474);c.bezierCurveTo(691,578,378,558,80,472);c.closePath();},navy,null);
   shape(c=>{c.moveTo(80,426);c.bezierCurveTo(187,321,267,424,381,354);c.bezierCurveTo(523,266,642,355,722,272);c.lineTo(749,84);c.lineTo(855,266);c.lineTo(899,445);c.bezierCurveTo(651,518,386,519,80,472);c.closePath();},green,null);
   shape(c=>{c.moveTo(631,216);c.lineTo(749,84);c.lineTo(820,199);c.lineTo(776,175);c.lineTo(749,143);c.lineTo(714,184);c.closePath();},dark?'#d0d9ca':'#f9f0d9',null);
   ctx.save();ctx.globalAlpha=.18;ctx.lineWidth=2;
   for(let i=0;i<4;i++)line([[110,439+i*12],[245,469+i*7],[394,453+i*8],[533,470+i*4],[678,425+i*9],[855,412+i*9]],1,'#fff8df');ctx.restore();
   const trail=[[166,449],[254,450],[339,410],[417,415],[485,378],[456,335],[536,310],[619,312],[690,268],[728,221]];
   const q=phase===0?ease(t/1.8):phase===2?ease((t-.2)/4.5):ease(t/2.1);
   ctx.save();ctx.lineWidth=30;line(trail,1,dark?'#244d56':'#518274');ctx.lineWidth=21;line(trail,phase===0?.18:1,dark?'#d8dac5':'#f8eed6');
   ctx.lineWidth=4;ctx.setLineDash([8,12]);line(trail,phase===0?.18:q,blue);ctx.restore();
   // The flag lands above a broad, lit summit rather than a tiny endpoint.
   ctx.save();ctx.translate(749,84);const rise=spring(t/1.1);ctx.scale(1,rise);line([[0,0],[0,-62]],1,ink);
   shape(c=>{c.moveTo(3,-61);c.bezierCurveTo(27,-72,43,-47,71,-61);c.lineTo(65,-22);c.bezierCurveTo(40,-9,26,-34,3,-24);c.closePath();},gold,null);ctx.restore();
   text('BEGRIJPEN',880,106,26,ink,{align:'center'});text('ZELF GEBRUIKEN',865,139,21,accent,{align:'center'});
   if(phase===0){person(206,291,1.72,{teacher:true,arm:'point',progress:ease(t/.9)});text('Ik bouw de route.',250,563,30,ink,{align:'center'});burst(749,89,.8,78,9);}
   else{
    for(const [i,x,y,label] of [[1,230,448,'UITLEG'],[2,474,367,'OEFENEN'],[3,701,259,'ZELF DOEN']]){ellipse(x,y,20,20,blue);text(String(i),x,y+8,23,dark?'#172c38':'#fff8e6',{mono:true,align:'center'});text(label,x,y+49,23,i===3?'#fff8e6':ink,{align:'center'});}
    const at=phase===2?along(trail,q):trail[0];person(at[0],at[1]-91,1,{progress:1,variant:2});
    text('Vragen. Oefenen. Een stap verder.',495,575,30,ink,{align:'center'});if(phase===2)burst(728,221,4.45,85,11);
   }
  }
  if(art==='terminal'){
   shape(c=>c.roundRect(112,99,778,392,16),dark?'#253431':'#fffcf2',dark?'#637c73':'#c8cec3',2);
   for(let i=0;i<3;i++)dot(819+i*18,125,4,palette(['red','amber','teal'][i],dark));
   text('LERAARBOB OS',145,138,27,ink,{mono:true});text('beleid laden…',145,179,18,accent,{mono:true});line([[145,202],[855,202]],1);
   const rows=[['UPLOAD DEADLINE','23:00'],['ACCOUNT','EIGEN'],['INDIVIDUELE TAAK','EIGEN WERK']];
   for(let i=0;i<installed;i++){const y=265+i*68,last=i===installed-1,q=last?ease(t/.45):1;if(last)wash(130,y-28,720,49,.13);ctx.globalAlpha=q;text(rows[i][0],145,y,21,ink,{mono:true});text('········',440,y,21,accent,{mono:true});text(rows[i][1],600,y,21,accent,{mono:true});ctx.globalAlpha=1;if(last)stamp(827,y-5,true,.15);else tick(813,y-5,1);}
   if(!installed){text('▌',145,265,24,accent,{mono:true});}
  }
  if(art==='tools'){
   const labels=['digitaal','papier','bord','duo','uitleg','zelfstandig','battle','stilte'],q=phase===1?ease(t/1.25):0;
   for(let i=0;i<labels.length;i++){
    const a=i*Math.PI/4-.2,r=phase===1?1-q:spring((t-i*.055)/.85),x=500+Math.cos(a)*310*r,y=285+Math.sin(a)*195*r;
    ctx.save();ctx.globalAlpha=1-q;line([[500,285],[x,y]],1,dark?'#63746b':'#c5cbbb');ctx.translate(x,y);ellipse(0,-10,43,43,dark?'#283c37':'#e0e7d9');
    const pigment=palette(i%2?'teal':'blue',dark);ctx.lineWidth=3;
    if(i===0){shape(c=>c.roundRect(-24,-28,48,32,4),pigment,null);line([[-30,12],[30,12]],1,pigment);line([[-18,-20],[18,-20]],1,'#fff4db');}
    if(i===1){paper(-19,-36,38,47,1);line([[-10,-19],[9,-19]],1,'#34505c');line([[-10,-8],[9,-8]],1,'#34505c');}
    if(i===2){shape(c=>c.roundRect(-29,-30,58,36,4),pigment,null);line([[-20,0],[0,-22],[21,-10]],1,'#fff4db');line([[-19,10],[-25,22]],1,pigment);line([[19,10],[25,22]],1,pigment);}
    if(i===3){ellipse(-13,-22,9,10,pigment);ellipse(14,-22,9,10,pigment);shape(c=>c.roundRect(-25,-8,23,26,9),pigment,null);shape(c=>c.roundRect(2,-8,23,26,9),pigment,null);}
    if(i===4){shape(c=>c.roundRect(-28,-29,56,32,10),pigment,null);shape(c=>{c.moveTo(-15,2);c.lineTo(-20,13);c.lineTo(0,2);c.closePath();},pigment,null);for(let j=0;j<3;j++)dot(-14+j*14,-13,3,'#fff4db');}
    if(i===5){ellipse(0,-26,10,12,pigment);shape(c=>c.roundRect(-18,-9,36,29,9),pigment,null);line([[-21,15],[0,6],[21,15]],1,'#fff4db');}
    if(i===6){shape(c=>{c.moveTo(0,-37);c.lineTo(8,-15);c.lineTo(28,-15);c.lineTo(12,-1);c.lineTo(18,20);c.lineTo(0,7);c.lineTo(-18,20);c.lineTo(-12,-1);c.lineTo(-28,-15);c.lineTo(-8,-15);c.closePath();},pigment,null);}
    if(i===7){for(let j=0;j<3;j++)line([[-24+j*19,-24],[-24+j*19,5]],1,pigment);line([[-27,15],[25,15]],1,pigment);}
    text(labels[i],0,54,25,ink,{align:'center'});ctx.restore();
   }
   ellipse(500,285,69,69,dark?'#313f35':'#efe2c5',accent);text(phase===1&&q>.8?'DOEL':'LES',500,299,40,accent,{align:'center'});if(phase===1)burst(500,285,.75,125,10);
  }
  if(art==='bandwidth'){
   const noisy=phase===1||phase===2,q=phase===2?1:clamp(Math.pow(t/3.5,1.7)),hit=phase===1?Math.max(0,1-(t-3.5)/.6):0;
   const shake=t>3.5&&t<4.1?Math.sin(t*55)*hit*3:0;
   ctx.save();ctx.translate(shake,0);
   ellipse(500,452,117,13,dark?'#ffffff0d':'#26354112');
   shape(c=>{c.moveTo(392,446);c.bezierCurveTo(388,372,428,351,476,347);c.lineTo(524,347);c.bezierCurveTo(574,351,613,372,608,446);c.closePath();},palette(noisy?'blue':'teal',dark));
   shape(c=>{c.moveTo(477,325);c.lineTo(477,365);c.quadraticCurveTo(500,387,523,365);c.lineTo(523,325);c.closePath();},'#c98f69');
   ellipse(411,269,32,43,'#dfa981',ink);ellipse(589,269,32,43,'#dfa981',ink);
   for(const x of [411,589]){ctx.beginPath();ctx.ellipse(x,269,16,26,0,-1.9,1.9);ctx.strokeStyle='#a66950';ctx.lineWidth=3;ctx.stroke();}
   shape(c=>{c.moveTo(422,228);c.bezierCurveTo(422,128,581,124,580,228);c.lineTo(573,305);c.bezierCurveTo(559,384,441,379,428,304);c.closePath();},'#e9b78f');
   curls(500,183);
   ellipse(464,253,28,32,'#fffbec');ellipse(536,253,28,32,'#fffbec');
   ellipse(466,257,7,noisy?12:8,'#29343e');ellipse(534,257,7,noisy?12:8,'#29343e');dot(468,254,2,'#fff');dot(536,254,2,'#fff');
   // Expressive eyebrows and eyelids; the teacher wears no glasses.
   for(const [x,tilt] of [[464,noisy?-5:0],[536,noisy?5:0]]){ctx.beginPath();ctx.moveTo(x-20,214+tilt);ctx.quadraticCurveTo(x,206,x+20,214-tilt);ctx.strokeStyle='#756451';ctx.lineWidth=5;ctx.stroke();}
   line([[497,268],[491,292],[505,296]],1,'#a66950');
   ctx.beginPath();ctx.moveTo(478,324);ctx.quadraticCurveTo(501,noisy?310:341,523,322);ctx.strokeStyle='#654538';ctx.lineWidth=3;ctx.stroke();
   line([[448,387],[446,430]],1,'#ffffff66');line([[518,367],[540,393],[561,366]],1,'#ffffff66');ctx.restore();
   if(noisy&&!silence){const noises=[['bro bro bro',225,130],['hebde gij…?',750,145],['wacht ff',195,280],['haha',775,290],['meneer',250,418],['wat moeten we doen?',742,427],['ping',500,82]];
    for(let i=0;i<noises.length;i++){const start=i*.37+.15,r=phase===2?1:spring((t-start)/.5);if(r<=0)continue;const [label,x,y]=noises[i];ctx.save();ctx.translate(x,y);ctx.scale(r,r);ctx.font='24px "StageHand", Georgia, serif';const w=ctx.measureText(label).width+30;shape(c=>c.roundRect(-w/2,-29,w,43,12),dark?'#432c30':'#f9dad2',accent,2);text(label,0,0,24,accent,{align:'center'});ctx.restore();}
    wash(345,493,310,22,.14);ctx.fillStyle=accent;ctx.fillRect(345,493,310*q,22);text('CPU '+Math.round(q*100)+'%',500,552,22,accent,{mono:true,align:'center'});
    if(phase===1)burst(500,270,3.5,215,18);
    if(phase===2){stamp(684,78,false);line([[671,89],[592,168],[600,148]],p,accent);}
   }else{ctx.save();ctx.lineWidth=4;line([[265,490],[735,490]],ease(t/1.6),accent);ctx.restore();if(phase===3){text('ruimte om te denken',500,538,26,accent,{align:'center'});circle(500,285,193,accent,ease(t/1.8));}}
  }
  if(art==='world'){
   // The same four visual concepts become four concrete parts of our lesson.
   const colors=['blue','amber','teal','red'],titles=['VORM','RICHTING','DATA','VERANDERING'];
   const labels=phase?['Hoe pakken we het aan?','Waar willen we naartoe?','Wat lukt al?','Wat leren we bij?']:['Patronen herkennen','Verbanden volgen','Informatie lezen','Verschillen begrijpen'];
   for(let i=0;i<4;i++){
    const x=65+i*237,q=spring((t-i*.12)/1),pigment=palette(colors[i],dark);ctx.save();ctx.translate(x+105,275);ctx.scale(q,q);
    ellipse(0,155,91,12,dark?'#ffffff0a':'#253c4910');
    if(i===0){shape(c=>{c.moveTo(-70,36);c.lineTo(0,-3);c.lineTo(70,36);c.lineTo(0,75);c.closePath();},dark?'#47758c':'#a8ceda',null);shape(c=>{c.moveTo(-70,36);c.lineTo(-70,-58);c.lineTo(0,-100);c.lineTo(0,-3);c.closePath();},pigment,null);shape(c=>{c.moveTo(0,-100);c.lineTo(70,-58);c.lineTo(70,36);c.lineTo(0,-3);c.closePath();},dark?'#c2def2':'#5794bf',null);line([[-70,-58],[0,-20],[70,-58]],1,dark?'#173140':'#e4f1f7');line([[0,-20],[0,75]],1,dark?'#173140':'#e4f1f7');}
    if(i===1){ellipse(0,-8,85,85,dark?'#514837':'#e8dbc1');ellipse(0,-8,69,69,dark?'#263630':'#fffaf0',pigment);ctx.save();ctx.rotate(-.4+ease(t/1.8)*.65);shape(c=>{c.moveTo(0,-76);c.lineTo(23,13);c.lineTo(0,-4);c.lineTo(-23,13);c.closePath();},pigment,null);shape(c=>{c.moveTo(0,62);c.lineTo(23,13);c.lineTo(0,-4);c.lineTo(-23,13);c.closePath();},dark?'#8d8263':'#d5bf8d',null);ctx.restore();dot(0,-8,7,ink);for(let j=0;j<4;j++){const angle=j*Math.PI/2;dot(Math.cos(angle)*76,-8+Math.sin(angle)*76,3,pigment);}}
    if(i===2){for(let j=0;j<4;j++){const h=[55,93,75,143][j]*ease((t-j*.12)/1.7);shape(c=>c.roundRect(-78+j*43,71-h,29,h,5),j===3?pigment:dark?'#477568':'#a0c5b2',null);}line([[-86,76],[92,76]],1,pigment);}
    if(i===3){ctx.save();ctx.lineWidth=12;line([[-77,67],[-30,18],[5,36],[72,-67]],ease(t/1.8),pigment);ctx.restore();shape(c=>{c.moveTo(72,-67);c.lineTo(29,-64);c.lineTo(76,-24);c.closePath();},pigment,null);for(const [x,y] of [[-77,67],[-30,18],[5,36]])ellipse(x,y,9,9,dark?'#1b1e1c':'#f1eee4',pigment);}
    text(titles[i],0,126,28,pigment,{mono:true,align:'center'});text(labels[i],0,198,23,ink,{align:'center'});ctx.restore();
   }
   if(phase){line([[161,533],[872,533]],ease((t-.8)/1.3),accent);text('ONZE LES',515,579,28,accent,{mono:true,align:'center'});}
  }
  if(art==='thinking'){
   person(500,260,1.25);paper(540,330,80,95);line([[420,355],[620,355]],1);
   const words=['plannen','volhouden','controleren','twijfelen','opnieuw proberen','uitleggen'];for(let i=0;i<words.length;i++){const a=-Math.PI+i*Math.PI/3,x=500+Math.cos(a)*280,y=265+Math.sin(a)*150;const q=phase?1:ease((t-i*.35)/1.3);ctx.globalAlpha=q;text(words[i],x,y,26,ink,{align:'center'});line([[x,y+10],[500+(x-500)*.4,265+(y-265)*.4]],q,accent);ctx.globalAlpha=1;}
  }
  if(art==='points'){
   line([[155,445],[855,445]]);line([[205,485],[205,115]]);ctx.globalAlpha=.12;ctx.fillStyle=accent;ctx.fillRect(690,155,125,90);ctx.globalAlpha=1;text('doelzone',750,132,22,accent,{align:'center'});
   for(let i=0;i<5;i++){const sx=270+i*62,sy=205+(i*79)%195,q=phase?ease((t-i*.25)/4):0,x=sx+(713+i*18-sx)*q,y=sy+(178+i*11-sy)*q;line([[sx,sy],[x,y]],1,i%2?ink:accent);dot(x,y,6);text('ABCDE'[i],sx-8,sy-15,19);}
  }
  if(art==='position'){
   const reveal=phase?ease(t/1.5):0,teal=palette('teal',dark),red=palette('red',dark);
   // A theatrical claim hides the real learner; setting it aside exposes an honest starting point.
   ellipse(565,511,265,21,dark?'#ffffff0a':'#253c4910');
   ctx.save();ctx.lineWidth=24;line([[449,473],[594,473],[663,415],[802,415]],1,dark?'#354c48':'#dae2d4');ctx.lineWidth=4;line([[449,473],[594,473],[663,415],[802,415]],reveal,teal);ctx.restore();
   person(451,290,1.8,{variant:2,progress:1});
   if(phase){ellipse(451,481,66,18,dark?'#477568':'#b7d8c2',teal);text('IK STA HIER',451,550,29,teal,{mono:true,align:'center'});paper(718,265,128,130,1);line([[740,318],[765,341],[822,288]],reveal,'#076f60');text('VOLGENDE STAP',793,462,24,teal,{align:'center'});burst(451,477,.8,100,12);}
   ctx.save();ctx.translate(451-220*reveal,300-34*reveal);ctx.rotate(-.28*reveal);ctx.scale(1-.28*reveal,1-.28*reveal);ctx.globalAlpha=1-.52*reveal;
   line([[81,67],[110,234]],1,dark?'#a99b82':'#89664b');
   shape(c=>{c.moveTo(-118,-103);c.quadraticCurveTo(0,-143,118,-103);c.lineTo(98,27);c.bezierCurveTo(75,134,-75,134,-98,27);c.closePath();},dark?'#d4bd92':'#f4dbad','#916949',3);
   for(const x of [-48,48]){shape(c=>{c.moveTo(x-25,-39);c.quadraticCurveTo(x,-66,x+26,-37);c.quadraticCurveTo(x,-18,x-25,-39);c.closePath();},'#3c494b',null);}
   ctx.beginPath();ctx.moveTo(-51,28);ctx.quadraticCurveTo(0,82,53,25);ctx.strokeStyle='#9f633f';ctx.lineWidth=6;ctx.stroke();
   line([[-68,-87],[-35,-97]],1,'#fff3db');line([[9,-99],[71,-83]],1,'#fff3db');ctx.restore();
   ctx.globalAlpha=1-reveal;text('“IK KAN DIT AL.”',451,141,34,red,{align:'center'});ctx.globalAlpha=1;
  }
  if(art==='help'){
   person(315,225,1.25,{arm:phase===2?'point':'rest',progress:1});person(645,225,1.25,{arm:phase?'point':'rest',progress:1,variant:1,facing:-1,teacher:true});line([[250,362],[735,362]],1);
   if(!phase){const x=570-180*ease(t/3);paper(x,295,72,92,1);line([[x+14,320],[x+50,320],[x+14,343],[x+50,343]],1);stamp(500,180,false,.6);text('HELP? NEE',500,450,24,accent,{mono:true,align:'center'});}
   else {paper(370,295,72,92,1);line([[615,240],[485,316]],p,accent);text(phase===1?'Waarom deze stap?':'Nu doe jij de laatste stap.',500,165,27,ink,{align:'center'});if(phase===1){line([[545,90],[465,90],[475,79],[465,90],[475,101]],p,accent);}else{line([[385,333],[402,345],[428,309]],ease((t-.7)/2),'#076f60');stamp(500,438,true,.8);}}
  }
  if(art==='parasite'){
   paper(230,218,160,205,1);text('eigen werk',250,250,23,'#29343e');line([[255,298],[350,273],[280,339],[354,374]],ease(t/2),'#34505c');
   const q=ease((t-.5)/3),x=620-215*q,y=360;ctx.save();ctx.translate(x,y);shape(c=>{c.moveTo(-25,9);c.bezierCurveTo(-38,-33,33,-42,29,4);c.quadraticCurveTo(33,27,13,28);c.lineTo(0,20);c.lineTo(-12,30);c.quadraticCurveTo(-28,30,-25,9);c.closePath();},dark?'#f4948e':'#d85851');for(let i=0;i<3;i++){const dx=-14+i*14;ctx.lineWidth=5;line([[dx,21],[dx+Math.sin(t*4+i)*4,34]],1,accent);}ellipse(-9,-7,9,11,'#fff8e6');ellipse(13,-9,9,11,'#fff8e6');dot(-6,-7,3,'#29343e');dot(16,-9,3,'#29343e');line([[-4,10],[9,8]],1,'#6d3438');ctx.restore();
   if(q>.5||phase){paper(665,218,160,205,1);text('andere naam',678,250,23,'#b82e36');line([[690,298],[785,273],[715,339],[789,374]],phase?1:ease((q-.5)*2),'#34505c');text('CTRL+C',450,268,20,accent,{mono:true});text('CTRL+V',525,315,20,accent,{mono:true});line([[390,395],[665,395]],1,accent);}
   if(phase){stamp(500,140,false,.2);text('geen eigen arbeid gevonden',500,495,22,accent,{mono:true,align:'center'});}
  }
  if(art==='ethics'){
   const xs=[300,500,700];xs.forEach((x,i)=>{person(x,245,1.05,{progress:1,variant:i,facing:i===2?-1:1,arm:phase&&i!==1?'point':'rest'});circle(x,280,95,ink,ease((t-i*.3)/2));});
   if(phase){paper(475,340,55,65);line([[375,245],[419,245]],1,accent);line([[580,245],[622,245]],1,accent);}else text('ruimte voor elkaar',500,450,28,accent,{align:'center'});
  }
  if(art==='boat'){
   const drift=sailing?160*ease(t/7):0,bob=sailing?Math.sin(Math.min(t,7)*1.4)*3:0;ctx.save();ctx.translate(280+drift,160+bob);ctx.scale(.48,.48);
   shape(c=>{c.moveTo(80,320);c.lineTo(155,405);c.quadraticCurveTo(395,440,650,405);c.lineTo(730,320);c.closePath();},'#345b70');shape(c=>c.roundRect(78,314,654,17,8),'#cfa269');line([[148,358],[657,358]],1,'#91c7d5');line([[505,320],[505,110]],1,ink);shape(c=>{c.moveTo(518,123);c.quadraticCurveTo(598,211,660,298);c.lineTo(518,298);c.closePath();},dark?'#f0d9a1':'#e7b960');line([[538,173],[538,278],[617,278]],p,'#fff2c8');
   for(let i=0;i<passengers;i++){const q=i<1?1:ease((t-i*.3)/.8);ctx.globalAlpha=q;person(155+i*69,262-i%2*10,.72,{progress:1,variant:i,teacher:i===0});}ctx.globalAlpha=1;ctx.restore();
   const wave=[];for(let x=125;x<890;x+=8)wave.push([x,360+Math.sin(x/55)*4]);line(wave,1);if(sailing)line([[210+drift,340],[175+drift,342]],1,accent);
  }
  if(art==='paper'){
   const drop=spring(t/1.2);ctx.save();ctx.translate(500,120+170*drop);ctx.rotate((1-drop)*-.22);paper(-90,-105,180,225,1);line([[-62,-42],[49,-42]],ease((t-.7)/1),'#34505c');line([[-62,3],[38,3]],ease((t-.9)/1),'#34505c');line([[-62,47],[54,47]],ease((t-1.1)/1),'#34505c');ctx.restore();
  }
  if(art==='clock'){circle(500,275,110);line([[500,200],[500,275],[560,302]],p,accent);}
  if(art==='paths')for(const path of paths)line(path,ease(ms/duration));
  if(art==='morph'){const q=ease(ms/duration);for(let i=0;i<from.length;i++)line(from[i].map((point,j)=>[point[0]+(to[i][j][0]-point[0])*q,point[1]+(to[i][j][1]-point[1])*q]),1);}
 }
 function mount(canvas){
  let raf=0,started=0,art='horizon',options={},silence=false,active=false,signature='';
  const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function schedule(){cancelAnimationFrame(raf);if(active)raf=requestAnimationFrame(frame);}
  function frame(now){
   raf=0;if(!active)return;const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);if(!rect.width||!rect.height)return;
   const w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
   ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);const scale=Math.min(w/1000,h/620);ctx.setTransform(scale,0,0,scale,(w-1000*scale)/2,(h-620*scale)/2);
   const elapsed=reduced.matches?10000:now-started;
   paint(ctx,art,elapsed,{...options,dark:options.tone==='night'||document.documentElement.dataset.mode==='dark',silence});
   if(!reduced.matches&&elapsed<10000)raf=requestAnimationFrame(frame);
  }
  new ResizeObserver(schedule).observe(canvas);
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-mode']});
  reduced.addEventListener('change',schedule);
  document.fonts?.addEventListener('loadingdone',schedule);
  return {start(e,signal,{continueScene=false,elapsed=0}={}){
   const next=JSON.stringify(e);if(!continueScene||next!==signature)started=performance.now()-Math.max(0,elapsed);signature=next;art=e.art||'horizon';options=e;silence=false;active=!signal.aborted;schedule();
   signal.addEventListener('abort',()=>{active=false;cancelAnimationFrame(raf);},{once:true});
  },silence(){silence=true;schedule();},paint};
 }
 window.LivingBlackboard={mount,paint,palette};
})();
