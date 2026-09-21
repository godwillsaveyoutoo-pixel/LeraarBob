(() => {
  'use strict';
  const G=window.WortelbouwGeometry,$=id=>document.getElementById(id);
  const game=new G.Game(),canvas=$('floor'),ctx=canvas.getContext('2d'),stage=$('stage');
  let ruler=3,mode='sum',flip=false,edgeIndex=null,active=null,preview=null;
  let width=0,height=0,dpr=1,camera={unit:24,x:0,y:0},revealFrame=0,revealStart=0,revealProgress=0,noticeTimer;
  let lastReveal=null,renderCount=0,manual=true,gesture=null;
  const colors={base:['#648fcd','#365f9c','#d7e5fa'],result:['#428580','#296861','#c0d7c5'],helper:['#e49d80','#bf674e','#ffe3ce'],triangle:['#f2deb5','#d8bd88','#fff7df']};
  const screen=p=>({x:camera.x+p.x*camera.unit,y:camera.y-p.y*camera.unit});
  const world=p=>({x:(p.x-camera.x)/camera.unit,y:(camera.y-p.y)/camera.unit});
  const pointBetween=(a,b,t)=>G.add(a,G.mul(G.sub(b,a),t));
  const targetLevel=()=>G.levels[game.state.level];
  const activeSquare=()=>game.state.objects.find(o=>o.id===(active||game.state.active));
  const rootLabel=n=>Number.isInteger(Math.sqrt(n))?String(Math.sqrt(n)):`√${n}`;
  function notify(text){clearTimeout(noticeTimer);$('notice').textContent=text;$('notice').hidden=false;noticeTimer=setTimeout(()=>{$('notice').hidden=true},3600)}
  function dismissNotice(){clearTimeout(noticeTimer);$('notice').hidden=true}
  function cancelReveal(){cancelAnimationFrame(revealFrame);revealFrame=0;revealProgress=0;lastReveal=null;$('cordLabel').hidden=true}
  function updatePreview(){
    preview=null;
    if(game.state.phase==='choose'&&edgeIndex!==null){const sq=activeSquare();if(sq)preview=G.plan(game.state,sq.id,edgeIndex,ruler,mode,flip)}
  }
  function futurePieces(){
    const s=game.state;
    if(manual)return gesture?.pieces||[];
    if(s.phase==='start')return [G.startSquare(ruler)];
    if(s.phase==='choose'&&preview)return [preview.triangle,preview.helper,preview.result];
    if(s.phase==='helper')return [s.pending.helper,s.pending.result];
    if(s.phase==='result')return [s.pending.result];
    return [];
  }
  function reframe(){
    const s=game.state;
    if(s.phase==='start'){
      camera.unit=Math.min(35,(height-55)/(manual?G.maxLength(s):ruler));camera.x=width/2;camera.y=height-25;return;
    }
    const pending=manual&&s.pending?[s.pending.helper,s.pending.result]:futurePieces();
    const b=G.bounds([...s.objects,...pending]);
    // Never clamp to a minimum world scale: off-screen geometry is not a collision.
    const room=manual&&s.phase==='choose'?2*Math.min(G.maxLength(s),Math.ceil(Math.sqrt(targetLevel().n/2))):0;
    const availableWidth=s.phase==='won'?width-240:width;
    const top=s.phase==='start'?0:28;
    const unit=Math.min(64,(availableWidth-60)/Math.max(1,b.maxX-b.minX+room),(height-46-top)/Math.max(1,b.maxY-b.minY+room));
    camera={unit,x:availableWidth/2-(b.minX+b.maxX)*unit/2,y:(height+top)/2+(b.minY+b.maxY)*unit/2};
  }
  function syncSize(){const r=stage.getBoundingClientRect();if(width===r.width&&height===r.height&&dpr===Math.min(devicePixelRatio||1,2))return false;width=r.width;height=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);return true}
  function resize(){syncSize();reframe();render()}
  function path(points){ctx.beginPath();points.forEach((p,i)=>{const q=screen(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.closePath()}
  function line(a,b,color='#947338',size=2,dash=[]){const A=screen(a),B=screen(b);ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.strokeStyle=color;ctx.lineWidth=size;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([])}
  function label(text,p,{color='#254a45',size=13,offset=0}={}){
    const q=screen(p);ctx.font=`600 ${size}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';
    const w=ctx.measureText(text).width;ctx.fillStyle='#f6f2e6ed';ctx.fillRect(q.x-w/2-4,q.y-size/2-3+offset,w+8,size+6);ctx.fillStyle=color;ctx.fillText(text,q.x,q.y+offset);
  }
  function marble(o,ghost=false,blocked=false){
    const t=game.state.pending?.triangle||[...game.state.objects].reverse().find(p=>p.type==='triangle');
    const role=o.type==='triangle'?'triangle':o.start||o.id===t?.owner?'base':o.role;
    const palette=colors[role],bounds=G.bounds([o]);
    const top=screen({x:bounds.minX,y:bounds.maxY}),bottom=screen({x:bounds.maxX,y:bounds.minY});
    ctx.save();path(o.points);
    const gradient=ctx.createLinearGradient(top.x,top.y,bottom.x,bottom.y);gradient.addColorStop(0,palette[0]);gradient.addColorStop(.52,palette[1]);gradient.addColorStop(1,palette[0]);
    ctx.globalAlpha=ghost ? 0.22 : 1;ctx.fillStyle=blocked?'#b86c59':gradient;ctx.fill();
    ctx.save();ctx.clip();ctx.lineWidth=.7;ctx.strokeStyle=palette[2];ctx.globalAlpha=ghost ? 0.1 : 0.19;
    // A few clipped, deterministic veins; no bitmap, noise loop or expensive blur.
    for(let i=0;i<3;i++){
      const y=top.y+(bottom.y-top.y)*(i+.4)/3;
      ctx.beginPath();ctx.moveTo(top.x-8,y);ctx.bezierCurveTo(top.x+(bottom.x-top.x)*.3,y+12,bottom.x-20,y-18,bottom.x+12,y+14);ctx.stroke();
    }
    ctx.restore();ctx.globalAlpha=ghost ? 0.7 : 1;path(o.points);ctx.lineWidth=ghost?1.3:1.8;ctx.strokeStyle=blocked?'#994c3f':ghost?'#678a7a':'#f2eedf';ctx.setLineDash(ghost?[5,4]:[]);ctx.stroke();ctx.setLineDash([]);ctx.restore();
  }
  function rightAngle(t){
    const vertex=t.right,others=t.points.filter(p=>G.len(G.sub(p,vertex))>G.EPS);
    const u=G.norm(G.sub(others[0],vertex)),v=G.norm(G.sub(others[1],vertex));
    const k=Math.min(9/camera.unit,G.len(G.sub(others[0],vertex))*.2,G.len(G.sub(others[1],vertex))*.2);
    const a=G.add(vertex,G.mul(u,k)),b=G.add(a,G.mul(v,k)),c=G.add(vertex,G.mul(v,k));line(a,b,'#68482c',1.4);line(b,c,'#68482c',1.4);
  }
  function edgeText(text,edge,triangle,options={}){
    const mid=pointBetween(edge.a,edge.b,.5),toward=G.norm(G.sub(G.center(triangle.points),mid));
    label(text,G.add(mid,G.mul(toward,14/camera.unit)),options);
  }
  function cord(edge,progress=1){
    const end=pointBetween(edge.a,edge.b,progress);ctx.lineCap='round';
    line(edge.a,end,'#f7df9a80',10);line(edge.a,end,'#a97827',4.5);line(edge.a,end,'#edd28d',1.5);
    const p=screen(end);ctx.fillStyle='#f8e4ad';ctx.beginPath();ctx.arc(p.x,p.y,3.5,0,Math.PI*2);ctx.fill();ctx.lineCap='butt';
  }
  function visibleArea(o){
    if(o.type!=='square')return null;
    if(game.state.phase==='reveal'&&o.id===game.state.pending.result.id)return '?';
    return o.area;
  }
  function triangleTarget(){
    const bounds=G.bounds([...game.state.objects,...futurePieces()]);
    const middle=screen(G.center(preview.triangle.points));
    return world({x:screen({x:bounds.minX,y:0}).x-36,y:middle.y});
  }
  function draw(){
    renderCount++;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);ctx.fillStyle='#f3efe3';ctx.fillRect(0,0,width,height);
    ctx.strokeStyle='#c6c8b733';ctx.lineWidth=1;
    for(let y=32;y<height;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke()}
    const s=game.state;
    s.objects.forEach(o=>marble(o));
    const future=futurePieces();future.forEach(o=>marble(o,true,preview&&!preview.valid));
    if(!manual&&s.phase==='choose'&&preview)line(triangleTarget(),G.center(preview.triangle.points),'#a87c5377',1,[2,3]);
    for(const o of s.objects){
      if(o.type==='triangle'){
        rightAngle(o);edgeText(String(o.known),o.helper,o,{size:12});
        if(o.revealed)cord(o.result);
        if(o.mode==='difference'&&o.id===(s.pending?.triangle.id||lastReveal?.id))alignedLabel(rootLabel(o.base.area),o.base,13);
      }else{
        let center=G.center(o.points);
        const measured=[...s.objects].reverse().find(t=>t.type==='triangle'&&t.revealed&&t.id===lastReveal?.id);
        if(measured&&o.id==='s'+s.steps){
          const mid=pointBetween(measured.result.a,measured.result.b,.5),out=G.norm(G.sub(center,mid));
          center=G.add(center,G.mul(out,Math.min(Math.sqrt(o.area)*.22,Math.max(0,34/camera.unit-Math.sqrt(o.area)/2))));
        }
        const placingId=s.phase==='reveal'?s.pending.result.id:null;
        // DOM square buttons carry these labels while selecting; avoid double text.
        if(manual||!(s.phase==='choose'&&o.id!==(active||s.active)))label(`A = ${visibleArea(o)}`,center,{color:o.role==='helper'?'#703b2b':'#164d49',size:12,offset:placingId===o.id?-18:0});
      }
    }
    if(!manual&&s.phase==='start'){
      const tile=future[0];label(`${ruler} × ${ruler}`,G.center(tile.points),{offset:-32,size:15});
      const y=screen({x:0,y:0}).y;ctx.strokeStyle='#b0ad9270';ctx.setLineDash([3,7]);ctx.beginPath();ctx.moveTo(24,y);ctx.lineTo(width-24,y);ctx.stroke();ctx.setLineDash([]);
    }
    if(!manual&&s.phase==='choose'&&preview){
      rightAngle(preview.triangle);edgeText(String(ruler),preview.triangle.helper,preview.triangle,{size:13});
      label(`A = ${ruler*ruler}`,G.center(preview.helper.points),{size:12});label('A = ?',G.center(preview.result.points),{size:13});
    }
    if(!manual&&s.phase==='helper'){label(`A = ${s.pending.helper.area}`,G.center(s.pending.helper.points),{offset:-29});label('A = ?',G.center(s.pending.result.points))}
    if(!manual&&s.phase==='result')label('A = ?',G.center(s.pending.result.points),{offset:-29});
    if(s.phase==='choose'&&!preview){
      const sq=activeSquare();if(sq)for(const e of G.freeEdges(s,sq))line(e.a,e.b,'#cbab65',3);
    }
    if(manual){
      if(s.phase==='start'){
        const origin=screen({x:gesture?.anchor?.x||0,y:0});
        ctx.strokeStyle='#a68b58';ctx.setLineDash([3,6]);ctx.beginPath();ctx.moveTo(24,origin.y);ctx.lineTo(width-24,origin.y);ctx.stroke();ctx.setLineDash([]);
        ctx.beginPath();ctx.arc(origin.x,origin.y,6,0,Math.PI*2);ctx.fillStyle='#a97827';ctx.fill();
        if(gesture?.pieces.length)label(`${ruler} × ${ruler}`,G.center(gesture.pieces[0].points));
        else label('Trek vanaf hier een vierkant', {x:0,y:1.2},{size:13});
      }
      if(s.phase==='choose'&&!gesture)for(const o of s.objects.filter(o=>o.type==='square'))for(const e of G.freeEdges(s,o))line(e.a,e.b,'#cbab65',3);
      if(gesture?.type==='triangle'&&preview){rightAngle(preview.triangle);edgeText(String(ruler),preview.triangle.helper,preview.triangle,{size:14})}
      if(['helper','result'].includes(s.phase)){
        const edge=s.pending.triangle[s.phase];line(edge.a,edge.b,'#b48935',5);
        if(gesture?.pieces.length)label(s.phase==='helper'?`A = ${s.pending.helper.area}`:'A = ?',G.center(gesture.pieces[0].points));
      }
    }
    if(s.phase==='reveal')cord(s.pending.triangle.result,revealProgress);
    if(s.phase==='won'){
      const tile=s.objects.find(o=>o.id===s.active);ctx.save();path(tile.points);ctx.strokeStyle='#f5d77c';ctx.lineWidth=6;ctx.stroke();path(tile.points);ctx.strokeStyle='#9b712c';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
    }
  }
  function buttonTarget(key,point,text,description,kind,action,disabled=false){
    const p=screen(point),button=document.createElement('button');button.className=`target ${kind}`;button.dataset.target=key;button.style.left=`${Math.max(24,Math.min(width-24,p.x))}px`;button.style.top=`${Math.max(24,Math.min(height-24,p.y))}px`;button.setAttribute('aria-label',description);button.title=description;button.disabled=disabled;
    const span=document.createElement('span');span.textContent=text;button.append(span);button.onclick=action;$('targets').append(button);
  }
  function targets(){
    const hadFocus=$('targets').contains(document.activeElement);$('targets').replaceChildren();
    if(manual)return;
    const s=game.state;
    if(s.phase==='start')buttonTarget('start',G.center(G.startSquare(ruler).points),'+',`Leg startvierkant met zijde ${ruler}`,'piece',()=>place({type:'start',k:ruler,x:0}));
    if(s.phase==='choose'){
      const sq=activeSquare();
      if(!preview){
        for(const o of s.objects.filter(o=>o.type==='square'&&o.id!==sq?.id))buttonTarget(o.id,G.center(o.points),`A = ${o.area}`,`Bouw verder op vierkant met oppervlakte ${o.area}`,'square',()=>selectSquare(o.id));
        if(sq)for(const e of G.freeEdges(s,sq)){
          const outward=G.mul(G.perp(G.norm(G.sub(e.b,e.a))),-12/camera.unit);
          buttonTarget(`edge-${e.index}`,G.add(pointBetween(e.a,e.b,.5),outward),String(e.index+1),`Bouw aan vrije zijde ${e.index+1}`,'edge',()=>selectEdge(e.index));
        }
      }else buttonTarget('triangle',triangleTarget(),'+','Leg de rechthoekige driehoek','piece triangle',()=>place({type:'triangle',owner:sq.id,edgeIndex,k:ruler,mode,flip}),!preview.valid);
    }
    if(s.phase==='helper')buttonTarget('helper',G.center(s.pending.helper.points),'+','Leg het hulpvierkant','piece',()=>place({type:'helper'}));
    if(s.phase==='result')buttonTarget('result',G.center(s.pending.result.points),'+','Leg het resultaatvierkant','piece',()=>place({type:'result'}));
    if(hadFocus)$('targets').querySelector('button:not(:disabled)')?.focus({preventScroll:true});
  }
  function instruction(title,detail){$('instruction').replaceChildren();const strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=title;span.textContent=detail;$('instruction').append(strong,span)}
  function ui(){
    const s=game.state,level=targetLevel(),sq=activeSquare();
    $('levelCount').textContent=`${s.level+1} / ${G.levels.length}`;$('goal').textContent=level.kind==='area'?`Oppervlakte ${level.n}`:`Lengte ${G.goalLabel(level)}`;$('steps').textContent=`${s.steps} ${s.steps===1?'stap':'stappen'}`;
    $('colorKey').hidden=s.phase==='start';$('lesson').hidden=s.phase!=='start';
    $('lessonTitle').textContent=level.title;$('lessonHint').textContent=level.hint;
    const won=s.phase==='won';$('success').hidden=!won;
    if(won){$('successRoot').textContent=level.kind==='area'?`A = ${level.n}`:G.goalLabel(level);$('successEquation').textContent=level.label?`√${level.n} = ${level.label}`:`${s.pending?.k||''}`;$('successLesson').textContent=level.lesson}
    const extended=G.maxLength(s)>5;$('extendedRuler').hidden=manual||!extended;
    document.querySelector('.ruler').hidden=extended;
    if($('longMeasure').options.length!==G.maxLength(s))$('longMeasure').replaceChildren(...Array.from({length:G.maxLength(s)},(_,i)=>new Option(String(i+1),String(i+1))));
    $('longMeasure').value=String(ruler);[...$('longMeasure').options].forEach(o=>o.disabled=s.phase==='choose'&&mode==='difference'&&Number(o.value)**2>=sq?.area);
    $('undo').disabled=!game.history.length&&edgeIndex===null;$('flip').disabled=!preview||s.phase!=='choose';
    const canMeasure=['start','choose'].includes(s.phase);
    document.querySelectorAll('[data-length]').forEach(b=>{const k=Number(b.dataset.length);b.setAttribute('aria-pressed',String(k===ruler));b.disabled=!canMeasure||(s.phase==='choose'&&mode==='difference'&&sq&&k*k>=sq.area)});
    document.querySelectorAll('[data-mode]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.mode===mode));b.disabled=s.phase!=='choose'||(b.dataset.mode==='difference'&&sq?.area<=1)});
    $('workTools').hidden=!canMeasure;
    $('app').classList.toggle('manual',manual);$('manual').setAttribute('aria-pressed',String(manual));$('manual').title=manual?'Handmatig bouwen · klik voor tikbediening':'Tikbediening · klik voor handmatig bouwen';$('achievement').hidden=s.phase!=='won';
    $('app').classList.toggle('compact',!canMeasure);$('app').classList.toggle('finished',s.phase==='won');
    if(s.phase==='start')instruction('Kies je eerste tegel','Kies een maat. Tik de tegel onderaan neer.');
    else if(s.phase==='choose'){
      if(preview&&!preview.valid)instruction('Hier past de hele stap niet',`Het ${preview.blocked} overlapt. Spiegel, wijzig de maat of ga terug met ↶.`);
      else if(preview)instruction('Leg je driehoek','Tik op de driehoek of haar +. De vierkanten volgen.');
      else instruction('Kies een gouden zijde',`Meet ${ruler}. Bouw aan ${mode==='sum'?'een rechthoekszijde':'de schuine zijde'}.`);
    }else if(s.phase==='helper')instruction('Leg het koraalkleurige hulpvierkant',`De bekende zijde is ${s.pending.k}. Tik op + in de koraalkleurige tegel.`);
    else if(s.phase==='result')instruction('Leg het groene resultaatvierkant','Tik op +. Daarna meet het koord de nieuwe zijde.');
    else if(s.phase==='reveal')instruction('Het koord neemt de nieuwe maat over…','Driehoek en beide vierkanten liggen op hun plek.');
    else if(s.phase==='won'){
      const t=[...s.objects].reverse().find(o=>o.type==='triangle');$('relationship').textContent=`${t.base.area} ${t.mode==='sum'?'+':'−'} ${t.helper.area} = ${t.result.area}`;
      instruction('Mooi gebouwd!',`${$('relationship').textContent} · ${s.steps} ${s.steps===1?'bouwstap':'bouwstappen'}`);
      if(!level.label)$('successEquation').textContent=$('relationship').textContent;
    }
    if(manual){
      if(s.phase==='start')instruction('Trek je eerste vierkant uit',`Begin onderaan en sleep omhoog. Laat los bij maat 1 tot ${G.maxLength(s)}.`);
      else if(s.phase==='choose')instruction(gesture?.type==='triangle'?`Bekende zijde: ${ruler}`:'Trek een driehoek aan een gouden zijde',preview&&!preview.valid?`Het ${preview.blocked} zou overlappen. Trek anders of kies een andere zijde.`:'Begin bij een uiteinde, trek naar buiten en laat los bij de gewenste maat.');
      else if(s.phase==='helper')instruction('Bouw het koraalkleurige hulpvierkant','Trek de gouden zijde naar buiten tot het vierkant staat.');
      else if(s.phase==='result')instruction('Bouw het groene resultaatvierkant','Trek de gouden zijde naar buiten. Daarna meet het koord.');
    }
  }
  function edgePlacement(edge){
    const a=screen(edge.a),b=screen(edge.b);let angle=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
    if(angle>90)angle-=180;if(angle<-90)angle+=180;
    return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,angle};
  }
  function alignedLabel(text,edge,size=16){
    const p=edgePlacement(edge);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle*Math.PI/180);
    ctx.font=`600 ${size}px system-ui`;const w=ctx.measureText(text).width;
    ctx.fillStyle='#fff7e6';ctx.fillRect(-w/2-5,-size/2-3,w+10,size+6);ctx.fillStyle='#654919';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,0,0);ctx.restore();
  }
  function positionCordLabel(){
    $('cordLabel').hidden=!lastReveal;if(!lastReveal)return;
    const edge=lastReveal.result,p=edgePlacement(edge);
    $('cordLabel').textContent=rootLabel(edge.area);$('cordLabel').style.left=`${p.x}px`;$('cordLabel').style.top=`${p.y}px`;
    $('cordLabel').style.transform=`translate(-50%,-50%) rotate(${p.angle}deg)`;
  }
  function render(){ui();if(syncSize())reframe();draw();targets();positionCordLabel()}
  function refresh(){updatePreview();reframe();render()}
  function selectSquare(id){active=id;edgeIndex=null;preview=null;cancelReveal();dismissNotice();if(mode==='difference'&&ruler*ruler>=activeSquare().area)mode='sum';refresh()}
  function selectEdge(index){edgeIndex=index;flip=false;cancelReveal();dismissNotice();updatePreview();if(preview&&!preview.valid){const other=G.plan(game.state,activeSquare().id,index,ruler,mode,true);if(other?.valid)flip=true}refresh()}
  function place(action){
    try{
      game.commit(action);dismissNotice();preview=null;edgeIndex=null;active=game.state.active;
      if(action.type==='result'){
        lastReveal=null;revealProgress=0;revealStart=performance.now();refresh();
        const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduced?80:700;
        const animate=now=>{
          if(game.state.phase!=='reveal')return;
          revealProgress=Math.min(1,(now-revealStart)/duration);draw();
          if(revealProgress<1)revealFrame=requestAnimationFrame(animate);
          else {lastReveal=game.state.pending.triangle;game.commit({type:'reveal'});active=game.state.active;revealFrame=0;refresh()}
        };
        revealFrame=requestAnimationFrame(animate);
      }else{cancelReveal();refresh()}
    }catch(error){notify(error.message)}
  }
  function undo(){
    if(gesture){cancelGesture();return}
    cancelReveal();dismissNotice();
    if(edgeIndex!==null){edgeIndex=null;preview=null;refresh();return}
    game.undo();active=game.state.active;edgeIndex=null;refresh();
  }
  function reset(level=game.state.level){cancelGesture();cancelReveal();dismissNotice();game.reset(level);active=null;edgeIndex=null;preview=null;ruler=3;mode='sum';flip=false;refresh()}
  document.querySelectorAll('[data-length]').forEach(b=>b.onclick=()=>{ruler=Number(b.dataset.length);dismissNotice();refresh()});
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{
    const sq=activeSquare();if(b.dataset.mode==='difference'&&sq.area<=1){notify('Een schuine zijde van 1 laat geen gehele rechthoekszijde over.');return}
    mode=b.dataset.mode;if(mode==='difference'&&ruler*ruler>=sq.area)ruler=Math.max(1,Math.ceil(Math.sqrt(sq.area))-1);
    dismissNotice();refresh();
  });
  $('longMeasure').onchange=()=>{ruler=Number($('longMeasure').value);dismissNotice();refresh()};
  $('flip').onclick=()=>{flip=!flip;refresh()};$('undo').onclick=undo;$('restart').onclick=()=>reset();$('overview').onclick=()=>{reframe();render()};
  $('next').onclick=$('continue').onclick=()=>reset((game.state.level+1)%G.levels.length);$('previous').onclick=()=>reset((game.state.level+G.levels.length-1)%G.levels.length);
  // A tap on a proposed piece works as well as its large semantic + button.
  function inside(p,poly){let sign=0;for(let i=0;i<poly.length;i++){const c=G.cross(G.sub(poly[(i+1)%poly.length],poly[i]),G.sub(p,poly[i]));if(Math.abs(c)<G.EPS)continue;const next=Math.sign(c);if(sign&&sign!==next)return false;sign=next}return true}
  canvas.addEventListener('click',e=>{
    if(manual)return;
    const r=canvas.getBoundingClientRect(),p=world({x:e.clientX-r.left,y:e.clientY-r.top}),s=game.state;
    if(s.phase==='start'){
      if(e.clientY-r.top<height*.55){notify('Leg je eerste tegel onderaan de vloer.');return}
      place({type:'start',k:ruler,x:p.x});
    }else if(s.phase==='choose'&&preview&&inside(p,preview.triangle.points))place({type:'triangle',owner:activeSquare().id,edgeIndex,k:ruler,mode,flip});
    else if(s.phase==='helper'&&inside(p,s.pending.helper.points))place({type:'helper'});
    else if(s.phase==='result'&&inside(p,s.pending.result.points))place({type:'result'});
    else if(s.phase==='choose'&&!preview){
      const sq=activeSquare();const edge=sq&&G.freeEdges(s,sq).find(e=>{
        const v=G.sub(e.b,e.a),t=Math.max(0,Math.min(1,G.dot(G.sub(p,e.a),v)/G.dot(v,v)));
        return G.len(G.sub(p,G.add(e.a,G.mul(v,t))))*camera.unit<20;
      });
      if(edge)selectEdge(edge.index);else{const hit=s.objects.find(o=>o.type==='square'&&inside(p,o.points));if(hit)selectSquare(hit.id)}
    }
  });
  function distanceToEdge(p,e){const v=G.sub(e.b,e.a),t=Math.max(0,Math.min(1,G.dot(G.sub(p,e.a),v)/G.dot(v,v)));return G.len(G.sub(p,G.add(e.a,G.mul(v,t))))*camera.unit}
  function pointerPoint(e){const r=canvas.getBoundingClientRect();return world({x:e.clientX-r.left,y:e.clientY-r.top})}
  function cancelGesture(){
    if(!gesture)return;const id=gesture.id;gesture=null;preview=null;edgeIndex=null;
    if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);render();
  }
  function moveGesture(e){
    if(!gesture||gesture.id!==e.pointerId)return;
    const p=pointerPoint(e),g=gesture,s=game.state;g.distance=G.len(G.sub(p,g.down))*camera.unit;
    if(g.type==='start'){
      ruler=Math.max(1,Math.min(G.maxLength(s),Math.round(Math.max(Math.abs(p.x-g.anchor.x),p.y))));
      g.x=g.anchor.x+(p.x<g.anchor.x?-1:1)*ruler/2;
      g.valid=p.y>0&&g.distance>=10;g.pieces=g.valid?[G.startSquare(ruler,g.x)]:[];
    }else if(g.type==='triangle'){
      const outward=G.mul(G.perp(G.norm(G.sub(g.edge.b,g.edge.a))),-1),delta=G.sub(p,g.anchor);
      const maximum=mode==='sum'?G.maxLength(s):Math.min(G.maxLength(s),Math.ceil(Math.sqrt(activeSquare().area))-1);
      ruler=Math.max(1,Math.min(maximum,Math.round(mode==='sum'?G.dot(delta,outward):G.len(delta))));
      preview=G.plan(s,active,g.edge.index,ruler,mode,flip);
      g.valid=G.dot(delta,outward)*camera.unit>=Math.min(10,camera.unit*.6)&&preview?.valid;
      g.pieces=preview?[preview.triangle]:[];
    }else{
      const edge=s.pending.triangle[g.type],tile=s.pending[g.type],mid=pointBetween(edge.a,edge.b,.5);
      const outward=G.norm(G.sub(G.center(tile.points),mid)),length=Math.sqrt(tile.area);
      const amount=Math.max(0,Math.min(1,G.dot(G.sub(p,g.down),outward)/length));
      // Unfold the square from its fixed side while pulling; the ruler keeps it exact.
      g.pieces=[{...tile,points:tile.points.map(v=>G.sub(v,G.mul(outward,G.dot(G.sub(v,mid),outward)*(1-amount))))}];
      g.valid=amount>=.65&&g.distance>=10;
    }
    render();
  }
  canvas.addEventListener('pointerdown',e=>{
    if(!manual||gesture||e.button!==0)return;
    const p=pointerPoint(e),s=game.state;dismissNotice();
    if(s.phase==='start'){
      if(screen(p).y<height-48){notify('Begin op de stippellijn onderaan en trek omhoog.');return}
      gesture={type:'start',anchor:{x:p.x,y:0}};
    }else if(s.phase==='choose'){
      const candidates=s.objects.filter(o=>o.type==='square').flatMap(o=>G.freeEdges(s,o)).map(edge=>({edge,d:distanceToEdge(p,edge)})).filter(h=>h.d<=24).sort((a,b)=>a.d-b.d);
      if(!candidates.length)return;
      const edge=candidates[0].edge;active=edge.owner;
      if(mode==='difference'&&activeSquare().area<=1){notify('Deze zijde is te kort voor een verschil. Kies een grotere tegel of een rechthoekszijde.');return}
      cancelReveal();edgeIndex=edge.index;flip=G.len(G.sub(p,edge.b))<G.len(G.sub(p,edge.a));
      gesture={type:'triangle',edge,anchor:flip?edge.b:edge.a};
    }else if(['helper','result'].includes(s.phase)){
      if(distanceToEdge(p,s.pending.triangle[s.phase])>24)return;
      gesture={type:s.phase};
    }else return;
    Object.assign(gesture,{id:e.pointerId,down:p,distance:0,valid:false,pieces:[]});
    canvas.setPointerCapture(e.pointerId);render();
  });
  canvas.addEventListener('pointermove',moveGesture);
  canvas.addEventListener('pointerup',e=>{
    if(!gesture||gesture.id!==e.pointerId)return;
    moveGesture(e);const g=gesture,plan=preview;gesture=null;preview=null;edgeIndex=null;
    if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    if(!g.valid){if(g.type==='triangle'&&plan&&!plan.valid)notify(`Het ${plan.blocked} overlapt. Probeer een andere maat of zijde.`);render();return}
    if(g.type==='start')place({type:'start',k:ruler,x:g.x});
    else if(g.type==='triangle')place({type:'triangle',owner:active,edgeIndex:g.edge.index,k:ruler,mode,flip});
    else place({type:g.type});
  });
  canvas.addEventListener('pointercancel',cancelGesture);
  canvas.addEventListener('lostpointercapture',cancelGesture);
  $('manual').onclick=()=>{cancelGesture();manual=!manual;edgeIndex=null;preview=null;refresh()};
  window.addEventListener('resize',()=>{cancelGesture();resize()});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&(gesture||edgeIndex!==null)){e.preventDefault();undo()}});
  // Read-only diagnostic snapshot: tests still perform all placements through the UI.
  window.Wortelbouw=Object.freeze({inspect:()=>JSON.parse(JSON.stringify({state:game.state,manual,gesture,ruler,mode,flip,edgeIndex,active,preview,camera,renderCount,revealing:!!revealFrame}))});
  resize();
})();
