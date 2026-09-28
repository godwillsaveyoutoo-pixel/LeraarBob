(() => {
  'use strict';
  if(window.__WORTELBOUW_BOOTED__)return;
  window.__WORTELBOUW_BOOTED__=true;
  const G=window.WortelbouwGeometry,$=id=>document.getElementById(id);
  const P=window.WortelbouwProgress,A=window.WortelbouwAssets||null,PR=window.WortelbouwPresentation||null,C=window.WortelbouwCelebration||null;
  if(!G||!P)return;
  const storage=(()=>{try{return window.localStorage}catch{return {getItem:()=>null,setItem:()=>{}}}})();
  const AX=window.AxiomaGame||{active:true,storage,state:{completed:[]},report:()=>{}};
  let game=new G.Game(),progress=P.fresh();
  const canvas=$('floor'),ctx=canvas.getContext('2d'),stage=$('stage');
  const rootCanvas=$('rootAxisCanvas'),rootCtx=rootCanvas?.getContext('2d')||null;
  const missionCanvas=$('missionSketch'),missionCtx=missionCanvas?.getContext('2d')||null;
  let ruler=3,mode='sum',flip=false,edgeIndex=null,active=null,preview=null;
  let width=0,height=0,dpr=1,camera={unit:24,x:0,y:0},revealFrame=0,revealStart=0,revealProgress=0,noticeTimer;
  let lastReveal=null,renderCount=0,gesture=null,hoverEdge=null;
  const manual=true; // v0.4.5: one interaction language only — direct drawing, no tap mode.
  let environmentFrame=0,environmentUntil=0,rootRevealStart=0;
  let successCamera=null,successCameraFrame=0,successSequence=null,rabbitMigration=null,cameraLockOnce=null,chainFocus=null;
  let chromeCollapsed=document.body.classList.contains('topbar-collapsed'),rootAxisPinned=false,rootAxisAutoExpanded=false,rootAxisTimer=0;
  const celebrationTimers=new Set(),fieldBirth=new Map(),rabbitResidents=new Map();
  const colors={land:['#6f9f56','#42763f','#c7dfa9'],triangle:['#c8a56d','#a57e4f','#ead9b7']};
  A?.onChange(()=>{if(width)requestAnimationFrame(render)});
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const screen=p=>({x:camera.x+p.x*camera.unit,y:camera.y-p.y*camera.unit});
  const world=p=>({x:(p.x-camera.x)/camera.unit,y:(camera.y-p.y)/camera.unit});
  const screenWithCamera=(p,cam)=>({x:cam.x+p.x*cam.unit,y:cam.y-p.y*cam.unit});
  const worldWithCamera=(p,cam)=>({x:(p.x-cam.x)/cam.unit,y:(cam.y-p.y)/cam.unit});
  const pointBetween=(a,b,t)=>G.add(a,G.mul(G.sub(b,a),t));
  const isSolved=()=>['won','routeDone'].includes(game.state.phase);
  const targetLevel=()=>G.levels[game.state.level];
  const activeSquare=()=>game.state.objects.find(o=>o.id===(active||game.state.active));
  const rootLabel=n=>Number.isInteger(Math.sqrt(n))?String(Math.sqrt(n)):`√${n}`;
  const hash=id=>{let h=2166136261;for(const ch of String(id)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
  function fieldGrowth(o,now=performance.now()){
    if(o.type!=='square')return 1;
    const born=fieldBirth.get(o.id);if(born===undefined||born<0)return 1;
    const duration=o.start?720:900;
    return clamp((now-born)/duration);
  }
  function markBorn(id,delay=0){fieldBirth.set(id,performance.now()+delay);animateEnvironment(1600+delay)}
  function markChainReady(id){
    chainFocus={id,start:performance.now(),duration:1150};
    animateEnvironment(1350);
  }
  function drawChainReady(now=performance.now()){
    if(!chainFocus)return;
    const t=clamp((now-chainFocus.start)/chainFocus.duration);
    if(t>=1){chainFocus=null;return}
    const field=game.state.objects.find(o=>o.type==='square'&&o.id===chainFocus.id);if(!field)return;
    const pulse=Math.sin(Math.PI*t),alpha=(1-t)*(.28+.46*pulse);
    ctx.save();path(field.points);ctx.lineJoin='round';ctx.shadowColor=`rgba(255,221,112,${alpha})`;ctx.shadowBlur=12+10*pulse;ctx.strokeStyle=`rgba(246,209,102,${.32+.5*(1-t)})`;ctx.lineWidth=3+3*pulse;ctx.stroke();ctx.restore();
  }
  function registerExistingFields(){fieldBirth.clear();for(const o of game.state.objects)if(o.type==='square')fieldBirth.set(o.id,-1)}
  function animateEnvironment(ms=1500){
    environmentUntil=Math.max(environmentUntil,performance.now()+ms);
    if(environmentFrame)return;
    const tick=now=>{draw();if(now<environmentUntil){environmentFrame=requestAnimationFrame(tick)}else environmentFrame=0};
    environmentFrame=requestAnimationFrame(tick);
  }
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
    // v0.4.3: an empty level no longer proposes a fixed 'start here' tile.
    if(s.phase==='start')return [];
    if(s.phase==='choose'&&preview)return [preview.triangle,preview.helper,preview.result];
    if(s.phase==='helper')return [s.pending.helper,s.pending.result];
    if(s.phase==='result')return [s.pending.result];
    return [];
  }
  function compactLandscape(){return (width<900||height<520)&&width>=height}
  function viewFrame(){
    const small=width<900||height<520;
    // v0.4.5: all mobile chrome is overlay chrome. The world camera therefore
    // uses one stable safe frame whether the top bar/root axis are open or closed.
    // This removes the last UI-driven camera jumps and gives landscape its width back.
    const side=small?7:28,top=small?7:26,bottomPad=small?7:22;
    return {left:side,right:Math.max(side+160,width-side),top,bottom:Math.max(top+104,height-bottomPad)};
  }
  function cameraCenterFor(cam=camera,frame=viewFrame()){
    const sx=(frame.left+frame.right)/2,sy=(frame.top+frame.bottom)/2;
    return {x:(sx-cam.x)/cam.unit,y:(cam.y-sy)/cam.unit};
  }
  function syncChromeUI(){
    const app=$('app'),button=$('topbarToggle');
    app?.classList.toggle('chrome-collapsed',compactLandscape()&&chromeCollapsed);
    if(button){button.textContent=chromeCollapsed?'⌄':'⌃';button.setAttribute('aria-label',chromeCollapsed?'Bovenbalk tonen':'Bovenbalk inklappen');button.title=button.getAttribute('aria-label')}
  }
  function setChromeCollapsed(value){chromeCollapsed=!!value;window.LeraarBobTopbar?.setCollapsed(chromeCollapsed);syncChromeUI()}
  document.addEventListener('topbar:change',event=>{chromeCollapsed=event.detail.collapsed;syncChromeUI()});
  function rootAxisExpanded(){return !!(rootAxisPinned||rootAxisAutoExpanded)}
  function syncRootAxisUI(){
    const app=$('app'),button=$('rootAxisToggle'),expanded=rootAxisExpanded();
    app?.classList.toggle('root-axis-expanded',compactLandscape()&&expanded);
    if(button){button.textContent=expanded?'⌄':'⌃';button.setAttribute('aria-label',expanded?'Wortel-as inklappen':'Wortel-as uitklappen');button.title=button.getAttribute('aria-label')}
  }
  function clearRootAxisAuto(){clearTimeout(rootAxisTimer);rootAxisTimer=0;rootAxisAutoExpanded=false;syncRootAxisUI()}
  function autoRevealRootAxis(sequence){
    clearTimeout(rootAxisTimer);rootAxisAutoExpanded=false;syncRootAxisUI();
    if(!compactLandscape()||!sequence)return;
    const openAt=sequence.axisStart??sequence.rootStart,collapseDelay=sequence.collapseDelay??1650;
    rootAxisTimer=setTimeout(()=>{
      rootAxisTimer=0;if(rootAxisPinned)return;rootAxisAutoExpanded=true;syncRootAxisUI();render();
      rootAxisTimer=setTimeout(()=>{rootAxisTimer=0;if(!rootAxisPinned){rootAxisAutoExpanded=false;syncRootAxisUI();render()}},collapseDelay);
    },Math.max(0,openAt)+20);
  }
  function updateFullscreenButton(){const b=$('fullscreenButton');if(!b)return;const active=!!document.fullscreenElement;b.textContent=active?'×':'⛶';b.setAttribute('aria-label',active?'Volledig scherm verlaten':'Volledig scherm');b.title=b.getAttribute('aria-label')}
  async function toggleFullscreen(){
    try{
      if(!document.fullscreenElement){
        if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen({navigationUI:'hide'});
        try{await screen.orientation?.lock?.('landscape')}catch{}
      }else if(document.exitFullscreen)await document.exitFullscreen();
    }catch{notify('Volledig scherm wordt door deze browser geblokkeerd.')}
    updateFullscreenButton();
  }
  function successSnapshot(){const frame=viewFrame();return {frame:{...frame},center:cameraCenterFor(camera,frame),unit:camera.unit}}
  function celebrationAge(now=performance.now()){return successSequence?Math.max(0,now-successSequence.start):Infinity}
  function celebrationStage(now=performance.now()){
    if(!isSolved())return null;
    if(!successSequence)return 'done';
    if(C?.stage)return C.stage(successSequence,now);
    const age=celebrationAge(now);return age<430?'signal':age<760?'field':age<1300?'rabbit':age<1310?'settle':age<1680?'root':age<2110?'harvest':age<2280?'root':'done';
  }
  function celebrationRootVisible(now=performance.now()){
    if(!isSolved())return false;
    if(!successSequence)return true;
    return C?.rootVisible?C.rootVisible(successSequence,now):celebrationAge(now)>=1310;
  }
  function clearCelebrationTimers(){for(const timer of celebrationTimers)clearTimeout(timer);celebrationTimers.clear()}
  function scheduleCelebrationRenders(sequence){
    clearCelebrationTimers();
    for(const delay of [sequence.signalEnd,sequence.rabbitStart,sequence.axisStart??sequence.rootStart,sequence.rootStart,sequence.harvestStart??sequence.rootStart,sequence.settleEnd]){
      const timer=setTimeout(()=>{celebrationTimers.delete(timer);render()},Math.max(0,delay)+18);celebrationTimers.add(timer);
    }
  }
  function applySuccessCamera(now=performance.now()){
    if(!successCamera)return false;
    // Keep using the exact safe frame that existed at the moment of success. On
    // phones the mission strip disappears later; that extra room must not move the
    // construction underneath the learner.
    const frame=successCamera.frame,duration=Math.max(1,successCamera.duration),raw=clamp((now-successCamera.start)/duration),ease=1-Math.pow(1-raw,3);
    const unit=successCamera.fromUnit+(successCamera.targetUnit-successCamera.fromUnit)*ease;
    const midX=(frame.left+frame.right)/2,midY=(frame.top+frame.bottom)/2;
    camera={unit,x:midX-successCamera.center.x*unit,y:midY+successCamera.center.y*unit};
    return raw<1;
  }
  function animateSuccessCamera(){
    if(successCameraFrame||!successCamera)return;
    const tick=now=>{
      if(!successCamera||!isSolved()){successCameraFrame=0;return}
      const moving=applySuccessCamera(now);draw();positionCordLabel();
      if(moving)successCameraFrame=requestAnimationFrame(tick);else successCameraFrame=0;
    };
    successCameraFrame=requestAnimationFrame(tick);
  }
  function beginSuccessFeedback(snapshot){
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,now=performance.now();
    successSequence=C?.create?C.create(now,reduced):{start:now,reduced,signalEnd:reduced?80:430,cameraStart:reduced?0:150,cameraDuration:reduced?1:520,cameraScale:reduced?1:.985,rabbitStart:reduced?90:760,rabbitDuration:reduced?1:540,axisStart:reduced?110:1120,rootStart:reduced?125:1310,rootGrowDuration:reduced?1:560,harvestStart:reduced?145:1680,harvestDuration:reduced?1:430,messageStart:reduced?150:1760,settleEnd:reduced?190:2280,collapseDelay:reduced?600:1650};
    successCamera={frame:snapshot.frame,center:snapshot.center,fromUnit:snapshot.unit,targetUnit:snapshot.unit*successSequence.cameraScale,start:now+successSequence.cameraStart,duration:successSequence.cameraDuration};
    rootRevealStart=now+successSequence.rootStart;
    prepareRabbitMigration(successSequence);
    scheduleCelebrationRenders(successSequence);autoRevealRootAxis(successSequence);
    animateSuccessCamera();animateEnvironment(successSequence.settleEnd+500);
  }
  function clearSuccessFeedback(){
    cancelAnimationFrame(successCameraFrame);successCameraFrame=0;successCamera=null;successSequence=null;rabbitMigration=null;rootRevealStart=0;clearCelebrationTimers();clearTimeout(rootAxisTimer);rootAxisTimer=0;rootAxisAutoExpanded=false;syncRootAxisUI();
  }
  function viewObjects(){
    const s=game.state,objects=[...s.objects];
    // During a construction step the camera fits the complete mathematical step,
    // even when only one piece is being unfolded. This prevents zoom jumps between
    // triangle -> helper square -> result square.
    if(s.pending){
      for(const o of [s.pending.triangle,s.pending.helper,s.pending.result])if(o&&!objects.some(x=>x.id===o.id))objects.push(o);
    }else if(manual&&gesture?.type==='triangle'&&preview){
      objects.push(preview.triangle,preview.helper,preview.result);
    }else if(manual&&gesture?.pieces?.length){
      objects.push(...gesture.pieces);
    }else if(!manual){
      objects.push(...futurePieces());
    }
    return objects.filter(Boolean);
  }
  function reframe(lock=null,force=false){
    const s=game.state,frame=viewFrame();
    // Pointer geometry must stay in one coordinate system for the full drag. A
    // camera fit while the finger/mouse is down changes screen->world conversion
    // underneath the gesture and makes a triangle appear to jump away.
    if(!force&&gesture)return;
    // Solving is a reward moment, not a request to show the whole map. Preserve the
    // camera the learner was using and only allow the tiny success ease-out.
    if(!force&&isSolved()&&successCamera){applySuccessCamera();return}
    const frameW=Math.max(120,frame.right-frame.left),frameH=Math.max(120,frame.bottom-frame.top);
    if(s.phase==='start'&&!gesture?.pieces?.length){
      // v0.4.3 free canvas: there is no baseline and no privileged starting point.
      // Scale is neutral and only guarantees that the largest legal first field can
      // be drawn on the current screen. The learner chooses the actual location.
      const minDim=Math.max(120,Math.min(frameW,frameH)),max=G.maxLength(s);
      const unit=clamp((minDim*.72)/Math.max(1,max),16,56);
      camera={unit,x:(frame.left+frame.right)/2,y:(frame.top+frame.bottom)/2};
      return;
    }
    const objects=viewObjects();
    if(!objects.length){camera={unit:48,x:(frame.left+frame.right)/2,y:frame.bottom-8};return}
    const b=G.bounds(objects),spanX=Math.max(.01,b.maxX-b.minX),spanY=Math.max(.01,b.maxY-b.minY);
    // Pixel padding protects labels/handles. No speculative world-space "room" is
    // added anymore: that was the main reason finished constructions became tiny.
    const small=width<900||height<420,padX=small?8:52,padY=small?8:42;
    const fitW=Math.max(80,frameW-2*padX),fitH=Math.max(80,frameH-2*padY);
    let unit=Math.min(fitW/spanX,fitH/spanY);
    const onlyOneSquare=objects.length===1&&objects[0].type==='square';
    if(onlyOneSquare){
      // Every first field gets a strong, comparable presentation size regardless of
      // whether its mathematical side is 1, 3, 6 or 10. Camera zoom is presentation,
      // not a hint about the required start value.
      const targetPx=Math.max(104,Math.min(360,Math.min(frameW,frameH)*.50));
      unit=Math.min(unit,targetPx/Math.max(spanX,spanY));
    }else{
      // Once a construction grows, let it use most of the actual stage.
      unit*=small?.985:.94;
    }
    unit=Math.max(10,Math.min(unit,180));
    const cx=(b.minX+b.maxX)/2,cy=(b.minY+b.maxY)/2;
    let x=(frame.left+frame.right)/2-cx*unit,y=(frame.top+frame.bottom)/2+cy*unit;
    if(lock?.world&&lock?.screen){
      // Keep the touched construction point under the same finger while an
      // oversized preview causes auto-zoom. Clamp only when the full step would
      // otherwise leave the safe frame.
      const wantedX=lock.screen.x-lock.world.x*unit,wantedY=lock.screen.y+lock.world.y*unit;
      const minX=frame.left+padX-b.minX*unit,maxX=frame.right-padX-b.maxX*unit;
      const minY=frame.top+padY+b.maxY*unit,maxY=frame.bottom-padY+b.minY*unit;
      x=minX<=maxX?clamp(wantedX,minX,maxX):x;
      y=minY<=maxY?clamp(wantedY,minY,maxY):y;
    }
    camera={unit,x,y};
  }
  function syncSize(){const r=stage.getBoundingClientRect();if(width===r.width&&height===r.height&&dpr===Math.min(devicePixelRatio||1,2))return false;width=r.width;height=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);return true}
  function resize(){syncSize();syncChromeUI();syncRootAxisUI();reframe();render()}
  function path(points){ctx.beginPath();points.forEach((p,i)=>{const q=screen(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.closePath()}
  function line(a,b,color='#947338',size=2,dash=[]){const A=screen(a),B=screen(b);ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.strokeStyle=color;ctx.lineWidth=size;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([])}
  function label(text,p,{color='#254a45',size=13,offset=0}={}){
    const q=screen(p);ctx.font=`600 ${size}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';
    const w=ctx.measureText(text).width;ctx.fillStyle='#f6f2e6ed';ctx.fillRect(q.x-w/2-4,q.y-size/2-3+offset,w+8,size+6);ctx.fillStyle=color;ctx.fillText(text,q.x,q.y+offset);
  }
  function drawPaperGround(){
    const ground=A?.get('ground');
    if(ground){
      const pattern=ctx.createPattern(ground,'repeat');ctx.fillStyle=pattern;ctx.fillRect(0,0,width,height);
      const wash=ctx.createLinearGradient(0,0,0,height);wash.addColorStop(0,'#f4dfac44');wash.addColorStop(.65,'#e4c38b22');wash.addColorStop(1,'#b6864530');ctx.fillStyle=wash;ctx.fillRect(0,0,width,height);
    }else{const grad=ctx.createLinearGradient(0,0,0,height);grad.addColorStop(0,'#ead3a2');grad.addColorStop(1,'#d7b77f');ctx.fillStyle=grad;ctx.fillRect(0,0,width,height)}
    // Seeded edge vegetation: decoration never participates in hit testing.
    const seed=hash('garden-'+game.state.level);ctx.save();
    for(let i=0;i<28;i++){
      const r=(hash(seed+'-'+i)%1000)/1000,side=i%4,x=side<2?(side?width-7:7):18+r*(width-36),y=side>=2?(side===2?8:height-8):18+r*(height-36);
      const scale=.65+(hash('plant'+i)%50)/100;ctx.translate(x,y);ctx.scale(scale,scale);ctx.strokeStyle='#54734688';ctx.fillStyle='#71945160';ctx.lineWidth=1;
      for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(0,3);ctx.quadraticCurveTo(k*5,-4,k*7,-10-(k===0?4:0));ctx.stroke()}
      if(i%7===0){ctx.fillStyle='#f5e6b7aa';ctx.beginPath();ctx.arc(4,-6,2.2,0,Math.PI*2);ctx.fill()}ctx.setTransform(dpr,0,0,dpr,0,0);
    }ctx.restore();
  }
  function imageMapped(img,points,drawLocal){
    const a=screen(points[0]),b=screen(points[1]),d=screen(points[3]),w=img?.naturalWidth||256,h=img?.naturalHeight||256;
    ctx.save();ctx.transform((b.x-a.x)/w,(b.y-a.y)/w,(d.x-a.x)/h,(d.y-a.y)/h,a.x,a.y);drawLocal(w,h);ctx.restore();
  }
  function fieldSharedEdgeIndex(o){
    if(o.start)return 0;
    const n=o.id.slice(1),t=game.state.objects.find(x=>x.type==='triangle'&&x.id===`t${n}`)||game.state.pending?.triangle;
    if(!t)return 0;
    const target=o.role==='helper'?t.helper:t.result,es=G.edges(o);const found=es.find(e=>G.sharedBoundary(e,target));return found?found.index:0;
  }
  function clipOrganicReveal(edgeIndex,g,w,h,seed){
    // Reveal the texture from the constructed side with a slightly irregular lawn
    // edge. The jitter is deterministic per field, so redraws never make the grass
    // crawl or flicker.
    const steps=9,rough=Math.min(18,Math.min(w,h)*.065)*(0.35+Math.sin(clamp(g)*Math.PI)*.65);
    const jitter=i=>(((hash(`${seed}-grass-${i}`)%1000)/1000)-.5)*rough;
    ctx.beginPath();
    if(edgeIndex===0){
      ctx.moveTo(0,0);ctx.lineTo(w,0);
      for(let i=steps;i>=0;i--){const x=w*i/steps,y=clamp(h*g+jitter(i),0,h);ctx.lineTo(x,y)}
    }else if(edgeIndex===1){
      ctx.moveTo(w,0);ctx.lineTo(w,h);
      for(let i=steps;i>=0;i--){const y=h*i/steps,x=clamp(w*(1-g)+jitter(i),0,w);ctx.lineTo(x,y)}
    }else if(edgeIndex===2){
      ctx.moveTo(w,h);ctx.lineTo(0,h);
      for(let i=steps;i>=0;i--){const x=w*(steps-i)/steps,y=clamp(h*(1-g)+jitter(i),0,h);ctx.lineTo(x,y)}
    }else{
      ctx.moveTo(0,h);ctx.lineTo(0,0);
      for(let i=0;i<=steps;i++){const y=h*i/steps,x=clamp(w*g+jitter(i),0,w);ctx.lineTo(x,y)}
    }
    ctx.closePath();ctx.clip();
  }
  function fieldRole(){return 'land'}
  function drawFieldBorder(o,ghost=false,blocked=false){
    const edgeImg=A?.get('woodEdge'),cornerImg=A?.get('woodCorner'),pts=o.points.map(screen);
    ctx.save();ctx.globalAlpha=ghost?.55:1;
    for(let i=0;i<4;i++){
      const a=pts[i],b=pts[(i+1)%4],dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy),ang=Math.atan2(dy,dx);
      ctx.save();ctx.translate(a.x,a.y);ctx.rotate(ang);
      if(edgeImg&&!blocked)ctx.drawImage(edgeImg,0,-5,l,10);else{ctx.strokeStyle=blocked?'#904d41':ghost?'#8b7a5d':'#9b6b34';ctx.lineWidth=ghost?2:5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(l,0);ctx.stroke();ctx.strokeStyle='#e5bd73aa';ctx.lineWidth=1;ctx.stroke()}
      ctx.restore();
    }
    if(!ghost)for(const p of pts){if(cornerImg&&!blocked)ctx.drawImage(cornerImg,p.x-8,p.y-8,16,16);else{ctx.fillStyle=blocked?'#884a3d':'#97652f';ctx.strokeStyle='#65451f';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,5.5,0,Math.PI*2);ctx.fill();ctx.stroke()}}
    ctx.restore();
  }
  function localFieldPoint(o,u,v){
    const a=o.points[0],x=G.sub(o.points[1],a),y=G.sub(o.points[3],a);
    return G.add(a,G.add(G.mul(x,u),G.mul(y,v)));
  }
  function rabbitAnchors(o){
    // Keep the centre clear for the mathematical area label. Rabbits live near the
    // field edges/corners, like residents of the plot rather than UI stickers.
    return [
      {u:.22,v:.72},{u:.76,v:.72},{u:.23,v:.28},{u:.76,v:.29},{u:.50,v:.80}
    ];
  }
  function outsideEntry(edgeIndex){
    if(edgeIndex===0)return {u:.5,v:-.10};
    if(edgeIndex===1)return {u:1.10,v:.5};
    if(edgeIndex===2)return {u:.5,v:1.10};
    return {u:-.10,v:.5};
  }
  function closestAnchorToEdge(anchors,edgeIndex){
    let best=0,bestD=Infinity;anchors.forEach((a,i)=>{const d=edgeIndex===0?a.v:edgeIndex===1?1-a.u:edgeIndex===2?1-a.v:a.u;if(d<bestD){bestD=d;best=i}});return best;
  }
  function clearRabbitResidents(){for(const r of rabbitResidents.values())if(r.timer)clearTimeout(r.timer);rabbitResidents.clear()}
  function pruneRabbitResidents(){
    const live=new Set(game.state.objects.filter(o=>o.type==='square').map(o=>o.id));
    for(const [id,r] of rabbitResidents)if(!live.has(id)){if(r.timer)clearTimeout(r.timer);rabbitResidents.delete(id)}
  }
  function wakeRabbitLater(r,delay){
    if(r.timer||delay<40)return;
    r.timer=setTimeout(()=>{r.timer=null;animateEnvironment(900)},delay);
  }
  function residentFor(o,now){
    const birth=fieldBirth.get(o.id)??-1;let r=rabbitResidents.get(o.id);
    if(!r||r.birth!==birth){
      if(r?.timer)clearTimeout(r.timer);
      const anchors=rabbitAnchors(o),edge=fieldSharedEdgeIndex(o),initial=closestAnchorToEdge(anchors,edge),seed=hash('rabbit-'+o.id);
      r={birth,anchors,current:initial,from:null,to:null,hopStart:0,hopDuration:520+(seed%140),nextHopAt:0,timer:null,entering:birth>=0,entryStart:birth>=0?birth+500:0,entryFrom:outsideEntry(edge),seed};
      if(birth<0)r.nextHopAt=now+2200+(seed%2300);
      rabbitResidents.set(o.id,r);
    }
    return r;
  }
  function rabbitPosition(o,r,now){
    const initial=r.anchors[r.current];
    if(r.entering){
      if(now<r.entryStart)return null;
      const t=clamp((now-r.entryStart)/r.hopDuration),ease=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
      if(t>=1){r.entering=false;r.nextHopAt=now+1900+(r.seed%1900)}
      return {u:r.entryFrom.u+(initial.u-r.entryFrom.u)*ease,v:r.entryFrom.v+(initial.v-r.entryFrom.v)*ease,hop:Math.sin(t*Math.PI),dir:initial.u-r.entryFrom.u};
    }
    if(!r.hopStart&&now>=r.nextHopAt){
      const count=r.anchors.length,next=(r.current+1+((hash(r.seed+'-'+Math.floor(now/1000))%(count-1))))%count;
      r.from=r.anchors[r.current];r.to=r.anchors[next];r.hopStart=now;r.hopDuration=430+(hash('hop-'+r.seed+'-'+next)%170);r.current=next;
    }
    if(r.hopStart){
      const t=clamp((now-r.hopStart)/r.hopDuration),ease=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
      const pos={u:r.from.u+(r.to.u-r.from.u)*ease,v:r.from.v+(r.to.v-r.from.v)*ease,hop:Math.sin(t*Math.PI),dir:r.to.u-r.from.u};
      if(t>=1){r.hopStart=0;r.from=r.to=null;r.nextHopAt=now+2100+(hash('idle-'+r.seed+'-'+r.current)%2600)}
      return pos;
    }
    wakeRabbitLater(r,Math.max(60,r.nextHopAt-now));
    return {u:initial.u,v:initial.v,hop:Math.sin(now/780+r.seed%5)*.035,dir:(r.seed%2?1:-1)};
  }
  function drawRabbitSprite(c,scale,dir,hop=0,alpha=1){
    const img=A?.get('rabbitIdle');ctx.save();ctx.globalAlpha=alpha;ctx.translate(c.x,c.y-hop);
    if(img){const w=50*scale,h=50*scale;ctx.scale(dir,1);ctx.drawImage(img,-w/2,-h*.72,w,h);ctx.restore();return}
    ctx.scale(dir*scale,scale);ctx.rotate(dir*.04);ctx.fillStyle='#fff9e9';ctx.strokeStyle='#6d604c';ctx.lineWidth=1.15;ctx.beginPath();ctx.ellipse(-5,-5,8.5,6.5,-.2,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(3,-9,5.6,5.2,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(2,-18,2.1,7.4,-.16,0,Math.PI*2);ctx.ellipse(6,-17.8,2.0,7.2,.12,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#694f3b';ctx.beginPath();ctx.arc(5,-10,1.05,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff9e9';ctx.beginPath();ctx.arc(-13,-6,3.2,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
  }
  function prepareRabbitMigration(sequence){
    rabbitMigration=null;if(!lastReveal||!isSolved())return;
    const s=game.state,source=s.objects.find(o=>o.type==='square'&&o.id===lastReveal.owner),target=s.objects.find(o=>o.type==='square'&&o.id===s.active);
    if(!source||!target||source.id===target.id)return;
    const sourceEdge=G.edges(source).find(e=>G.sharedBoundary(e,lastReveal.base)),sourceAnchors=rabbitAnchors(source),targetAnchors=rabbitAnchors(target);
    const fromIndex=closestAnchorToEdge(sourceAnchors,sourceEdge?.index??0),toIndex=closestAnchorToEdge(targetAnchors,fieldSharedEdgeIndex(target));
    const old=rabbitResidents.get(target.id);if(old?.timer)clearTimeout(old.timer);rabbitResidents.delete(target.id);
    rabbitMigration={fromId:source.id,toId:target.id,from:localFieldPoint(source,sourceAnchors[fromIndex].u,sourceAnchors[fromIndex].v),to:localFieldPoint(target,targetAnchors[toIndex].u,targetAnchors[toIndex].v),toIndex,start:sequence.start+sequence.rabbitStart,duration:sequence.rabbitDuration,settled:false};
  }
  function settleMigratedRabbit(now=performance.now()){
    const m=rabbitMigration;if(!m||m.settled)return;
    const target=game.state.objects.find(o=>o.type==='square'&&o.id===m.toId);if(!target)return;
    const birth=fieldBirth.get(target.id)??-1,anchors=rabbitAnchors(target),seed=hash('rabbit-'+target.id);
    rabbitResidents.set(target.id,{birth,anchors,current:m.toIndex,from:null,to:null,hopStart:0,hopDuration:520+(seed%140),nextHopAt:now+1900+(seed%2100),timer:null,entering:false,entryStart:0,entryFrom:null,seed});
    m.settled=true;
  }
  function drawRabbitMigration(now=performance.now()){
    const m=rabbitMigration;if(!m||now<m.start)return;
    const t=clamp((now-m.start)/Math.max(1,m.duration)),ease=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,a=screen(m.from),b=screen(m.to),distance=Math.hypot(b.x-a.x,b.y-a.y);
    const control={x:(a.x+b.x)/2,y:(a.y+b.y)/2-Math.min(58,18+distance*.20)},u=1-ease;
    const c={x:u*u*a.x+2*u*ease*control.x+ease*ease*b.x,y:u*u*a.y+2*u*ease*control.y+ease*ease*b.y};
    const target=game.state.objects.find(o=>o.type==='square'&&o.id===m.toId),side=target?Math.sqrt(target.area)*camera.unit:86,scale=clamp(side/96,.44,.96),dir=b.x<a.x?-1:1;
    drawRabbitSprite(c,scale,dir,Math.sin(t*Math.PI)*Math.min(9,side*.055));
    if(t>=1)settleMigratedRabbit(now);
  }
  function rabbit(o,now=performance.now()){
    if(o.type!=='square')return;
    if(rabbitMigration?.toId===o.id&&!rabbitMigration.settled)return;
    const grow=fieldGrowth(o,now),side=Math.sqrt(o.area)*camera.unit;if(grow<.78||side<48)return;
    const r=residentFor(o,now),pos=rabbitPosition(o,r,now);if(!pos)return;
    const wp=localFieldPoint(o,pos.u,pos.v),c=screen(wp),scale=clamp(side/96,.42,1.0),dir=pos.dir<-.001?-1:1,hop=Math.max(0,pos.hop)*Math.min(16,side*.10);
    drawRabbitSprite(c,scale,dir,hop);
  }
  function marble(o,ghost=false,blocked=false){
    const role=o.type==='triangle'?'triangle':fieldRole(o),palette=colors[role],bounds=G.bounds([o]);
    const top=screen({x:bounds.minX,y:bounds.maxY}),bottom=screen({x:bounds.maxX,y:bounds.minY});ctx.save();ctx.globalAlpha=ghost?.42:1;
    if(o.type==='triangle'){
      path(o.points);ctx.fillStyle=blocked?'#ad6856':'#c79d68';ctx.fill();ctx.save();ctx.clip();const soil=A?.get('soil');if(soil){const p=ctx.createPattern(soil,'repeat');ctx.globalAlpha=.28;ctx.fillStyle=p;ctx.fillRect(top.x-20,top.y-20,bottom.x-top.x+40,bottom.y-top.y+40)}ctx.restore();path(o.points);ctx.strokeStyle=blocked?'#93463d':ghost?'#8d795b':'#80603d';ctx.lineWidth=ghost?1.6:2.1;ctx.setLineDash(ghost?[6,5]:[]);ctx.stroke();ctx.setLineDash([]);ctx.restore();return;
    }
    const growth=ghost?0:fieldGrowth(o),soil=A?.get('soil'),finalImg=A?.get('grass');
    imageMapped(soil||finalImg,o.points,(w,h)=>{if(soil)ctx.drawImage(soil,0,0,w,h);else{ctx.fillStyle='#ac8057';ctx.fillRect(0,0,w,h)};if(growth>0&&!blocked){ctx.save();clipOrganicReveal(fieldSharedEdgeIndex(o),growth,w,h,o.id);if(finalImg)ctx.drawImage(finalImg,0,0,w,h);else{const grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,palette[0]);grad.addColorStop(1,palette[1]);ctx.fillStyle=grad;ctx.fillRect(0,0,w,h)}ctx.restore()}});
    drawFieldBorder(o,ghost,blocked);ctx.restore();
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
  function successLengthSignal(now=performance.now()){
    if(!isSolved()||!lastReveal||!successSequence)return;
    const age=celebrationAge(now),end=Math.max(1,successSequence.signalEnd);if(age<0||age>end)return;
    const t=clamp(age/end),pulse=Math.sin(Math.min(1,t/.72)*Math.PI);
    const e=lastReveal.result,A0=screen(e.a),B0=screen(e.b);
    ctx.save();ctx.lineCap='round';ctx.shadowColor='rgba(255,224,125,.95)';ctx.shadowBlur=11+9*pulse;ctx.strokeStyle=`rgba(255,230,144,${.20+.65*pulse})`;ctx.lineWidth=6+4*pulse;ctx.beginPath();ctx.moveTo(A0.x,A0.y);ctx.lineTo(B0.x,B0.y);ctx.stroke();
    ctx.shadowBlur=0;ctx.strokeStyle=`rgba(255,249,210,${.46+.48*pulse})`;ctx.lineWidth=2.2;ctx.stroke();
    if(t<.88){const q=clamp(t/.88),x=A0.x+(B0.x-A0.x)*q,y=A0.y+(B0.y-A0.y)*q;ctx.fillStyle=`rgba(255,250,213,${1-q*.18})`;ctx.beginPath();ctx.arc(x,y,3.6+1.8*pulse,0,Math.PI*2);ctx.fill()}
    ctx.restore();
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
  function discoveredRoots(){
    const seen=new Set();return game.state.objects.filter(o=>o.type==='square'&&/^s\d+$/.test(o.id)&&o.id!=='s0').filter(o=>!seen.has(o.area)&&seen.add(o.area)).sort((a,b)=>Math.sqrt(a.area)-Math.sqrt(b.area));
  }
  function carrot(x,y,scale,grow=1,important=false){
    const g=clamp(grow);ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=clamp(g*1.35);
    ctx.strokeStyle=important?'#6b5128':'#7a6842';ctx.lineWidth=1.1;
    ctx.fillStyle=important?'#dc7a32':'#c88748';ctx.beginPath();ctx.moveTo(0,1);ctx.quadraticCurveTo(-5,8*g,-1,15*g);ctx.quadraticCurveTo(1,18*g,3,12*g);ctx.quadraticCurveTo(6,6*g,0,1);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#4f7c3c';ctx.lineWidth=1.7;for(const a of [-.55,0,.55]){ctx.beginPath();ctx.moveTo(0,1);ctx.quadraticCurveTo(7*a,-8*g,9*a,-13*g);ctx.stroke()}ctx.restore();
  }
  function drawRootAxis(now=performance.now()){
    if(!rootCtx||!rootCanvas)return;
    const r=rootCanvas.getBoundingClientRect(),rw=Math.max(1,r.width),rh=Math.max(1,r.height),rdpr=Math.min(devicePixelRatio||1,2),compact=rh<36;
    if(rootCanvas.width!==Math.round(rw*rdpr)||rootCanvas.height!==Math.round(rh*rdpr)){rootCanvas.width=Math.round(rw*rdpr);rootCanvas.height=Math.round(rh*rdpr)}
    rootCtx.setTransform(rdpr,0,0,rdpr,0,0);rootCtx.clearRect(0,0,rw,rh);
    const level=targetLevel(),roots=discoveredRoots(),values=roots.map(o=>Math.sqrt(o.area)),target=Math.sqrt(level.n),max=Math.max(4,Math.ceil(Math.max(target,...values,3))+1),x1=compact?7:15,x2=rw-(compact?8:17),y=compact?rh*.58:rh*.58;
    rootCtx.strokeStyle='#435b35';rootCtx.lineWidth=compact?2:2.5;rootCtx.beginPath();rootCtx.moveTo(x1,y);rootCtx.lineTo(x2,y);rootCtx.stroke();rootCtx.fillStyle='#435b35';rootCtx.beginPath();rootCtx.moveTo(x2,y);rootCtx.lineTo(x2-(compact?5:7),y-(compact?3:4));rootCtx.lineTo(x2-(compact?5:7),y+(compact?3:4));rootCtx.closePath();rootCtx.fill();
    rootCtx.textAlign='center';rootCtx.fillStyle='#334b2d';
    for(let n=0;n<=max;n++){
      const x=x1+(x2-x1)*(n/max);rootCtx.beginPath();rootCtx.moveTo(x,y-(compact?2.5:4));rootCtx.lineTo(x,y+(compact?2.5:4));rootCtx.stroke();
      if(!compact){rootCtx.font='600 13px system-ui';rootCtx.textBaseline='top';rootCtx.fillText(String(n),x,y+7)}
    }
    const targetWaiting=isSolved()&&!celebrationRootVisible(now),elapsed=rootRevealStart?Math.max(0,now-rootRevealStart):2400;
    function drawCarrot(x,scale,grow,important,cheer=0){const g=clamp(grow),c=clamp(cheer);rootCtx.save();rootCtx.translate(x,y-3-2.5*c);rootCtx.rotate((important?-.035:.025)*c);rootCtx.scale(scale*(1+c*(important?.13:.08)),scale*(1+c*(important?.13:.08)));rootCtx.globalAlpha=clamp(g*1.4);rootCtx.strokeStyle=important?'#674c23':'#6f613a';rootCtx.fillStyle=important?'#df7c31':'#c98a49';rootCtx.lineWidth=1.1;rootCtx.beginPath();rootCtx.moveTo(0,1);rootCtx.quadraticCurveTo(-5,8*g,-1,15*g);rootCtx.quadraticCurveTo(1,18*g,3,12*g);rootCtx.quadraticCurveTo(6,6*g,0,1);rootCtx.fill();rootCtx.stroke();rootCtx.strokeStyle='#4d7a3d';rootCtx.lineWidth=1.7;for(const a of [-.55,0,.55]){rootCtx.beginPath();rootCtx.moveTo(0,1);rootCtx.quadraticCurveTo(7*a,-8*g*(1+.12*c),9*a,-13*g*(1+.18*c));rootCtx.stroke()}rootCtx.restore()}
    roots.forEach((o,i)=>{
      const important=o.area===level.n;if(important&&targetWaiting)return;
      const v=Math.sqrt(o.area),x=x1+(x2-x1)*(v/max),growDuration=successSequence?.rootGrowDuration??560,progress=important&&isSolved()?clamp((elapsed-i*35)/growDuration):1;
      const age=celebrationAge(now),harvestStart=successSequence?.harvestStart??Infinity,harvestDuration=successSequence?.harvestDuration??1,localHarvest=clamp((age-harvestStart-i*55)/harvestDuration),cheer=(localHarvest>0&&localHarvest<1)?Math.sin(Math.PI*localHarvest):0;
      const text=Number.isInteger(v)?`√${o.area} = ${v}`:`√${o.area}`;
      if(compact){
        const bump=1+cheer*(important?.45:.25);rootCtx.strokeStyle=important?'#4d7a3d':'#6a754d';rootCtx.lineWidth=1.4;rootCtx.beginPath();rootCtx.moveTo(x,y+1);rootCtx.lineTo(x,y-6-2*cheer);rootCtx.stroke();rootCtx.fillStyle=important?'#d97b32':'#bf8850';rootCtx.beginPath();rootCtx.arc(x,y+2.5-cheer, (important?2.8:2.2)*bump,0,Math.PI*2);rootCtx.fill();
        rootCtx.font=`700 ${important?9:8}px Georgia,serif`;rootCtx.textBaseline='bottom';rootCtx.fillStyle=important?'#465d32':'#596047';rootCtx.fillText(text,x,Math.max(8,y-7-2*cheer));
      }else{
        drawCarrot(x,important?1.08:.84,progress,important,cheer);if(progress>.35){rootCtx.font=`700 ${important?15:13}px Georgia,serif`;rootCtx.textBaseline='bottom';rootCtx.fillStyle=important?'#4e602f':'#556047';rootCtx.fillText(text,x,y-14-2*cheer)}
      }
    });
  }
  function rootStoryText(){
    const n=targetLevel().n,v=Math.sqrt(n);if(Number.isInteger(v))return `√${n} ligt precies op ${v} op de getallijn.`;
    const lo=Math.floor(v),hi=Math.ceil(v);return `√${n} ligt tussen ${lo} en ${hi} op de getallijn.`;
  }
  function draw(){
    renderCount++;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);drawPaperGround();
    const s=game.state;
    s.objects.forEach(o=>marble(o));
    if(isSolved()){
      const tile=s.objects.find(o=>o.id===s.active);ctx.save();path(tile.points);ctx.strokeStyle='#f5d77c';ctx.lineWidth=6;ctx.stroke();path(tile.points);ctx.strokeStyle='#9b712c';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
    }

    const future=futurePieces();future.forEach(o=>marble(o,true,preview&&!preview.valid));
    drawChainReady();
    s.objects.forEach(o=>rabbit(o));
    drawRabbitMigration();
    if(!manual&&s.phase==='choose'&&preview)line(triangleTarget(),G.center(preview.triangle.points),'#a87c5377',1,[2,3]);
    for(const o of s.objects){
      if(o.type==='triangle'){
        rightAngle(o);alignedLabel(String(o.known),o.helper,12);
        if(o.revealed)cord(o.result);
        if(o.mode==='difference'&&o.id===(s.pending?.triangle.id||lastReveal?.id))alignedLabel(rootLabel(o.base.area),o.base,13,o);
      }else{
        let center=G.center(o.points);
        const measured=[...s.objects].reverse().find(t=>t.type==='triangle'&&t.revealed&&t.id===lastReveal?.id);
        if(measured&&o.id==='s'+s.steps){
          const mid=pointBetween(measured.result.a,measured.result.b,.5),out=G.norm(G.sub(center,mid));
          center=G.add(center,G.mul(out,Math.min(Math.sqrt(o.area)*.22,Math.max(0,34/camera.unit-Math.sqrt(o.area)/2))));
        }
        if(measured?.mode==='difference'&&o.id===measured.owner&&Math.sqrt(o.area)*camera.unit<100){
          const mid=pointBetween(measured.base.a,measured.base.b,.5),out=G.norm(G.sub(center,mid)),p=screen(G.add(mid,G.mul(out,(Math.sqrt(o.area)*camera.unit+15)/camera.unit)));
          const note=world({x:Math.max(30,Math.min(width-30,p.x)),y:Math.max(42,Math.min(height-16,p.y))});
          line(center,note,'#365f9c66',1,[2,3]);center=note;
        }
        if(o.role==='helper'&&Math.sqrt(o.area)*camera.unit<36){
          const t=s.objects.find(t=>t.type==='triangle'&&t.id==='t'+o.id.slice(1));
          if(t){
            const mid=pointBetween(t.helper.a,t.helper.b,.5),out=G.norm(G.sub(center,mid)),p=screen(G.add(center,G.mul(out,32/camera.unit)));
            const note=world({x:Math.max(30,Math.min(width-30,p.x)),y:Math.max(42,Math.min(height-16,p.y))});
            line(center,note,'#995d4366',1,[2,3]);center=note;
          }
        }
        const placingId=s.phase==='reveal'?s.pending.result.id:null;
        // DOM square buttons carry these labels while selecting; avoid double text.
        if(manual||!(s.phase==='choose'&&o.id!==(active||s.active)))label(`A = ${visibleArea(o)}`,center,{color:'#164d49',size:12,offset:placingId===o.id?-18:0});
      }
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
        if(gesture?.anchor){const origin=screen(gesture.anchor);ctx.beginPath();ctx.arc(origin.x,origin.y,5,0,Math.PI*2);ctx.fillStyle='#a97827';ctx.fill()}
        if(gesture?.pieces.length)label(`${ruler} × ${ruler}`,G.center(gesture.pieces[0].points));
      }
      if(s.phase==='choose'&&!gesture){
        for(const e of allFreeEdges())drawBuildEdge(e,sameEdge(e,hoverEdge));
      }
      if(gesture?.type==='triangle'&&preview){rightAngle(preview.triangle);edgeText(String(ruler),preview.triangle.helper,preview.triangle,{size:14})}
      if(['helper','result'].includes(s.phase)){
        const edge=s.pending.triangle[s.phase];line(edge.a,edge.b,'#b48935',5);
        if(gesture?.pieces.length)label(s.phase==='helper'?`A = ${s.pending.helper.area}`:'A = ?',G.center(gesture.pieces[0].points));
      }
    }
    if(s.phase==='reveal')cord(s.pending.triangle.result,revealProgress);
    successLengthSignal();
    drawRootAxis();
  }
  function targets(){$('targets').replaceChildren();}
  function instruction(title,detail){$('instruction').title=detail;$('instruction').replaceChildren();const strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=title;span.textContent=detail;$('instruction').append(strong,span)}
  function drawMissionSketch(){
    if(!missionCtx||!missionCanvas)return;const r=missionCanvas.getBoundingClientRect(),w=Math.max(180,r.width||260),h=Math.max(105,r.height||150),pd=Math.min(devicePixelRatio||1,2);if(missionCanvas.width!==Math.round(w*pd)||missionCanvas.height!==Math.round(h*pd)){missionCanvas.width=Math.round(w*pd);missionCanvas.height=Math.round(h*pd)}missionCtx.setTransform(pd,0,0,pd,0,0);missionCtx.clearRect(0,0,w,h);missionCtx.strokeStyle='#6d5a38';missionCtx.fillStyle='#6d5a38';missionCtx.lineWidth=2;missionCtx.lineJoin='round';
    const s=game.state;if(s.phase==='start'){
      const size=Math.min(h*.58,w*.32),x=w*.5-size*.5,y=h*.24;missionCtx.setLineDash([5,4]);missionCtx.strokeRect(x,y,size,size);missionCtx.setLineDash([]);missionCtx.font='700 24px Georgia,serif';missionCtx.textAlign='center';missionCtx.fillText('?',w*.5,y+size*.59);return;
    }
    // Schematic only: it communicates the current relation, never a hidden start size.
    const ax=w*.30,ay=h*.72,bx=w*.62,by=ay,cx=ax,cy=h*.28;missionCtx.beginPath();missionCtx.moveTo(ax,ay);missionCtx.lineTo(bx,by);missionCtx.lineTo(cx,cy);missionCtx.closePath();missionCtx.stroke();missionCtx.strokeRect(ax-42,ay-42,42,42);missionCtx.save();missionCtx.translate((ax+cx)/2,(ay+cy)/2);missionCtx.rotate(-Math.PI/2);missionCtx.strokeRect(-21,-42,42,42);missionCtx.restore();missionCtx.save();missionCtx.translate((bx+cx)/2,(by+cy)/2);missionCtx.rotate(Math.atan2(cy-by,cx-bx));missionCtx.setLineDash([5,4]);missionCtx.strokeRect(-25,-50,50,50);missionCtx.restore();missionCtx.font='700 20px Georgia,serif';missionCtx.textAlign='center';missionCtx.fillText('?',w*.68,h*.28);
  }
  function updateStoryUI(){
    const s=game.state,level=targetLevel(),cStage=celebrationStage(),poster=PR?.poster?.(s.level,s.phase,level,cStage);if(poster){$('posterTitle').textContent=poster.title;$('posterBody').textContent=poster.body;$('posterIcon').textContent=poster.icon||''}
    const rootText=rootStoryText(),speech=PR?.speech?.(s.phase,level,rootText,cStage)||'';$('speechText').textContent=speech;$('speechBubble').hidden=!speech;$('guideTitle').textContent=s.phase==='reveal'?'Even meten':s.phase==='routeDone'?'Eerste route gevonden':isSolved()?'Goed gebouwd!':'Nieuwe ontdekking';
    if(isSolved()){
      const subtitles={signal:'De nieuwe zijde klopt.',field:'Het nieuwe veld groeit dicht.',rabbit:'Een konijn springt naar het nieuwe veld.',settle:'Nog één ontdekking…',root:rootText,harvest:'Je worteltuin groeit.',done:rootText};
      $('goalSubtitle').textContent=subtitles[cStage]||rootText;
      $('missionQuestion').textContent=celebrationRootVisible()?rootText:'Kijk wat er met je nieuwe veld gebeurt.';
      const cues={signal:'De zijde licht op.',field:'Het gras groeit.',rabbit:'Hop!',settle:'Kijk naar de wortel-as.',root:'Nieuwe wortel.',harvest:'Je wortels komen even tot leven.',done:'Wortel gevonden.'};
      $('stepCue').textContent=cues[cStage]||'Wortel gevonden.';
    }else{
      $('goalSubtitle').textContent=s.phase==='start'?'Plaats je eerste veld waar jij wilt.':s.phase==='reveal'?'Kijk hoe de nieuwe lengte ontstaat.':'Bouw vanuit de gouden zijde verder.';
      $('missionQuestion').textContent=s.phase==='start'?'Kies zelf waar je eerste stuk konijnengrond komt.':'Welke oppervlakte en lengte ontstaan door jouw constructie?';
      $('stepCue').textContent=s.phase==='start'?'Sleep ergens om een veld te tekenen.':s.phase==='choose'?'Kies een gouden zijde.':s.phase==='helper'?'Bouw het tweede veld.':s.phase==='result'?'Bouw het volgende veld.':s.phase==='reveal'?'Even meten…':'Bouw rustig verder.';
    }
    drawMissionSketch();
  }
  function ui(){
    syncChromeUI();syncRootAxisUI();
    const s=game.state,level=targetLevel(),sq=activeSquare(),won=isSolved(),cStage=celebrationStage(),rootReady=celebrationRootVisible();
    $('completedCount').textContent=`${P.completed(progress).length}/${G.levels.length}`;
    $('levelCount').textContent=`${s.level+1} / ${G.levels.length}`;const goalText=level.kind==='area'?`Oppervlakte ${level.n}`:`Lengte ${G.goalLabel(level)}`,compactGoal=level.kind==='area'?`A = ${level.n}`:G.goalLabel(level);$('goal').textContent=goalText;if($('goalCrumb').textContent!==goalText)$('goalCrumb').textContent=goalText;const compactGoalEl=$('compactGoalValue');if(compactGoalEl){compactGoalEl.textContent=compactGoal;$('compactGoalReminder')?.setAttribute('aria-label',`Doel: ${goalText}`)}$('steps').textContent=`${s.steps} ${s.steps===1?'stap':'stappen'}`;
    $('colorKey').hidden=s.phase==='start';$('lesson').hidden=false;
    $('lessonTitle').textContent=level.title;$('lessonHint').textContent=level.hint;
    if(level.compareRoutes&&s.solutions.length===1)$('lessonHint').textContent=s.solutions[0].mode==='sum'?'Je vond √6 met optellen. Bouw nu een route die eindigt met aftrekken. Hint: probeer eerst √10 te maken.':'Je vond √6 met aftrekken. Bouw nu een route die eindigt met optellen. Hint: probeer eerst √5 te maken.';
    $('routeCount').hidden=!level.compareRoutes;$('routeCount').textContent=`${s.solutions.length} / 2 manieren`;
    $('success').classList.toggle('compare',!!level.compareRoutes);
    $('successTitle').textContent=s.phase==='routeDone'?'Eerste wortel gevonden!':level.compareRoutes?'Twee routes gevonden!':'Wortel gevonden!';
    $('continue').textContent=s.phase==='routeDone'?'Bouw de andere route →':'Volgende puzzel →';
    $('routeComparison').hidden=!level.compareRoutes||!isSolved();
    $('routeComparison').replaceChildren();
    if(level.compareRoutes&&isSolved())for(const mode of ['sum','difference']){
      const route=s.solutions.find(r=>r.mode===mode),card=document.createElement('div'),title=document.createElement('strong');
      title.textContent=mode==='sum'?'Optellen':'Aftrekken';card.append(title);
      if(route)for(const e of route.equations){const line=document.createElement('span');line.textContent=`${e.base} ${e.mode==='sum'?'+':'−'} ${e.helper} = ${e.result}`;card.append(line)}
      else{const line=document.createElement('span');line.textContent='Nog te ontdekken';card.append(line);card.className='pending'}
      $('routeComparison').append(card);
    }
    const showOutcome=won&&rootReady;$('success').hidden=!showOutcome;$('rootStory').hidden=!showOutcome;
    if(showOutcome){$('successRoot').textContent=level.kind==='area'?`A = ${level.n}`:G.goalLabel(level);$('successEquation').textContent=level.label?`√${level.n} = ${level.label}`:'';$('successLesson').textContent=s.phase==='routeDone'?'√6 klopt! Zoek nu een route met de andere eindbewerking. Je eerste oplossing blijft bewaard.':level.lesson;$('rootStory').textContent=rootStoryText()}else $('rootStory').textContent='';
    const extended=G.maxLength(s)>5;$('extendedRuler').hidden=manual||!extended;
    document.querySelector('.ruler').hidden=extended;
    if($('longMeasure').options.length!==G.maxLength(s))$('longMeasure').replaceChildren(...Array.from({length:G.maxLength(s)},(_,i)=>new Option(String(i+1),String(i+1))));
    $('longMeasure').value=String(ruler);[...$('longMeasure').options].forEach(o=>o.disabled=s.phase==='choose'&&mode==='difference'&&Number(o.value)**2>=sq?.area);
    $('undo').disabled=!game.history.length&&edgeIndex===null;$('flip').disabled=!preview||s.phase!=='choose';
    const canMeasure=s.phase==='choose';
    const fieldPhase=['start','helper','result'].includes(s.phase),trianglePhase=s.phase==='choose';
    $('fieldTool')?.classList.toggle('active',fieldPhase);$('triangleTool')?.classList.toggle('active',trianglePhase);
    if($('fieldTool'))$('fieldTool').disabled=!fieldPhase;if($('triangleTool'))$('triangleTool').disabled=!trianglePhase;
    document.querySelectorAll('[data-length]').forEach(b=>{const k=Number(b.dataset.length);b.setAttribute('aria-pressed',String(k===ruler));b.disabled=!canMeasure||(s.phase==='choose'&&mode==='difference'&&sq&&k*k>=sq.area)});
    document.querySelectorAll('[data-mode]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.mode===mode));b.disabled=s.phase!=='choose'||(b.dataset.mode==='difference'&&sq?.area<=1)});
    $('workTools').hidden=!canMeasure;
    $('app').classList.add('manual');$('app').dataset.phase=s.phase;$('achievement').hidden=!rootReady;
    $('app').classList.toggle('compact',!canMeasure);$('app').classList.toggle('solved',won);$('app').classList.toggle('finished',rootReady);
    if(s.phase==='start')instruction('Plaats je eerste veld vrij',`Sleep eender waar op de grond om een vierkant te maken. Maximaal ${G.maxLength(s)}.`);
    else if(s.phase==='choose'){
      if(preview&&!preview.valid)instruction('Hier past de hele stap niet',`Het ${preview.blocked} overlapt. Spiegel, wijzig de maat of ga terug met ↶.`);
      else if(preview)instruction('Leg je driehoek','Sleep vanaf de gekozen zijde; laat los wanneer de maat klopt.');
      else instruction('Kies een gouden zijde',`Meet ${ruler}. Bouw aan ${mode==='sum'?'een rechthoekszijde':'de schuine zijde'}.`);
    }else if(s.phase==='helper')instruction('Bouw het tweede veld',`Trek de gouden zijde naar buiten tot het vierkant staat.`);
    else if(s.phase==='result')instruction('Bouw het volgende veld','Trek de gouden zijde naar buiten. Daarna meet het koord de nieuwe zijde.');
    else if(s.phase==='reveal')instruction('Het koord neemt de nieuwe maat over…','Driehoek en beide vierkanten liggen op hun plek.');
    else if(won){
      const t=[...s.objects].reverse().find(o=>o.type==='triangle');$('relationship').textContent=`${t.base.area} ${t.mode==='sum'?'+':'−'} ${t.helper.area} = ${t.result.area}`;
      if(!rootReady){
        const messages={signal:['De nieuwe zijde klopt!','De gouden meetzijde licht op.'],field:['Laat het veld groeien','Het gras maakt het nieuwe stuk grond af.'],rabbit:['Daar komt het konijn','Het springt naar het nieuwe veld.'],settle:['Nog één ontdekking','De lengte krijgt zo haar plaats op de wortel-as.'],harvest:['Je worteltuin groeit','De nieuwe wortel staat tussen je eerdere ontdekkingen.']};
        const message=messages[cStage]||messages.settle;instruction(message[0],message[1]);
      }else instruction(s.phase==='routeDone'?'√6 gevonden · zoek nog een andere manier':level.compareRoutes?'Twee routes, dezelfde lengte!':'Het veld klopt!',`${$('relationship').textContent} · ${rootStoryText()}`);
      if(!level.label)$('successEquation').textContent=$('relationship').textContent;
    }
    if(manual){
      if(s.phase==='start')instruction('Teken je eerste veld waar jij wilt',`Druk ergens, sleep diagonaal en laat los bij maat 1 tot ${G.maxLength(s)}.`);
      else if(s.phase==='choose')instruction(gesture?.type==='triangle'?`Bekende zijde: ${ruler}`:'Sleep vanaf een goud oplichtende buitenzijde',preview&&!preview.valid?`Hier is te weinig ruimte. De spiegelrichting wordt automatisch geprobeerd; anders kies je een andere buitenzijde of maat.`:(s.steps>0?'Elk groen veld is nu bouwgrond. Sleep vanaf eender welke gouden buitenzijde om je keten voort te zetten.':'Je mag op elk groen veld verderbouwen. De bruikbare buitenzijden lichten goud op.'));
      else if(s.phase==='helper')instruction('Bouw het tweede veld','Trek de gouden zijde naar buiten tot het vierkant staat.');
      else if(s.phase==='result')instruction('Bouw het volgende veld','Trek de gouden zijde naar buiten. Daarna meet het koord.');
    }
    updateStoryUI();
  }
  function edgePlacement(edge){
    const a=screen(edge.a),b=screen(edge.b);let angle=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
    if(angle>90)angle-=180;if(angle<-90)angle+=180;
    return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,angle};
  }
  function alignedLabel(text,edge,size=16,triangle=null){
    const p=edgePlacement(edge);
    if(triangle){
      const mid=pointBetween(edge.a,edge.b,.5),normal=G.perp(G.norm(G.sub(edge.b,edge.a))),sign=G.dot(normal,G.sub(G.center(triangle.points),mid))>0?-1:1;
      Object.assign(p,screen(G.add(mid,G.mul(normal,sign*15/camera.unit))));
    }ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle*Math.PI/180);
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
  function save(){
    if(!AX.active)return;
    try{P.record(progress,game);progress.manual=true;(AX.storage||storage).setItem(P.KEY,JSON.stringify(progress));AX.report?.(P.completed(progress),G.levels.length,progress.current);$('completedCount').textContent=`${P.completed(progress).length}/${G.levels.length}`}catch{notify('Bewaren lukt niet. Laat deze pagina open om je bouwwerk te behouden.')}
  }
  function refresh(){updatePreview();const lock=cameraLockOnce;cameraLockOnce=null;reframe(lock);render();save()}
  function openLevel(index){
    cancelGesture();cancelReveal();dismissNotice();clearSuccessFeedback();clearRabbitResidents();chainFocus=null;
    chromeCollapsed=document.body.classList.contains('topbar-collapsed');rootAxisPinned=false;rootAxisAutoExpanded=false;syncChromeUI();syncRootAxisUI();
    const id=P.ids[index],row=progress.levels[id];
    try{game=row?.actions?P.replay(id,row.actions):new G.Game(index)}catch{game=new G.Game(index);notify('Je afgeronde opgaven zijn behouden; deze bouwpoging begint opnieuw.')}
    if(game.state.phase==='reveal')game.commit({type:'reveal'});
    registerExistingFields();rootRevealStart=isSolved()?performance.now()-2400:0;
    active=game.state.active;edgeIndex=null;preview=null;hoverEdge=null;
    lastReveal=[...game.state.objects].reverse().find(o=>o.type==='triangle'&&o.revealed)||null;
    ruler=3;mode='sum';flip=false;refresh();
  }
  function showProgress(){
    cancelGesture();save();
    const count=P.completed(progress).length,current=G.levels[game.state.level],currentId=P.ids[game.state.level],currentRow=progress.levels[currentId];
    $('progressSummary').textContent=`${count} / ${G.levels.length}`;
    $('menuProgressLabel').textContent=`${count} / ${G.levels.length}`;
    $('menuProgressFill').style.width=`${Math.round(count/G.levels.length*100)}%`;
    $('menuCurrentGoal').textContent=current.kind==='area'?`A = ${current.n}`:G.goalLabel(current);
    $('menuCurrentTitle').textContent=current.title;
    $('menuCurrentStatus').textContent=currentRow?.completed?`Afgerond${currentRow.bestSteps?` · beste: ${currentRow.bestSteps} ${currentRow.bestSteps===1?'bouwstap':'bouwstappen'}`:''}`:currentRow?.routes?.length?`${currentRow.routes.length} van 2 manieren gevonden`:currentRow?.actions?.length?'Je bouwwerk staat klaar om verder te gaan.':'Begin waar je wilt en bouw vanuit je eigen grond.';
    $('progressLevels').replaceChildren();
    G.levels.forEach((level,index)=>{
      const id=P.ids[index],row=progress.levels[id],button=document.createElement('button'),mark=document.createElement('span'),text=document.createElement('span'),title=document.createElement('strong'),detail=document.createElement('small');
      button.className='progressLevel'+(row?.completed?' done':'');button.setAttribute('aria-current',String(index===game.state.level));mark.className='mark';mark.textContent=row?.completed?'✓':String(index+1);
      const goal=level.kind==='area'?`A = ${level.n}`:G.goalLabel(level);
      title.textContent=`${goal} · ${level.title}`;
      detail.textContent=row?.completed?`Afgerond${row.bestSteps?' · '+row.bestSteps+' '+(row.bestSteps===1?'stap':'stappen'):''}`:row?.routes?.length?`${row.routes.length}/2 routes`:row?.actions?.length?'Bezig':'Nieuw';
      text.append(title,detail);button.append(mark,text);button.onclick=()=>{$('progressDialog').close();openLevel(index)};$('progressLevels').append(button);
    });
    $('progressDialog').showModal();
    requestAnimationFrame(()=>document.querySelector('.progressLevel[aria-current="true"]')?.scrollIntoView({block:'nearest'}));
  }

  function place(action){
    try{
      game.commit(action);dismissNotice();preview=null;edgeIndex=null;active=game.state.active;
      if(action.type==='start')markBorn('s0');
      if(action.type==='helper')markBorn(game.state.pending.helper.id);
      if(action.type==='result')markBorn(game.state.pending.result.id,matchMedia('(prefers-reduced-motion: reduce)').matches?0:180);
      if(action.type==='result'){
        lastReveal=null;revealProgress=0;revealStart=performance.now();refresh();
        const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduced?80:700;
        const animate=now=>{
          if(game.state.phase!=='reveal')return;
          revealProgress=Math.min(1,(now-revealStart)/duration);draw();
          if(revealProgress<1)revealFrame=requestAnimationFrame(animate);
          else {
            const snapshot=successSnapshot();lastReveal=game.state.pending.triangle;game.commit({type:'reveal'});active=game.state.active;revealFrame=0;
            if(isSolved())beginSuccessFeedback(snapshot);else markChainReady(game.state.active);
            refresh();
          }
        };
        revealFrame=requestAnimationFrame(animate);
      }else{cancelReveal();refresh()}
    }catch(error){notify(error.message)}
  }
  function undo(){
    if(gesture){cancelGesture();return}
    cancelReveal();dismissNotice();
    if(edgeIndex!==null){edgeIndex=null;preview=null;refresh();return}
    game.undo();active=game.state.active;edgeIndex=null;clearSuccessFeedback();chainFocus=null;pruneRabbitResidents();refresh();
  }
  function reset(level=game.state.level){cancelGesture();cancelReveal();dismissNotice();clearSuccessFeedback();clearRabbitResidents();chainFocus=null;cameraLockOnce=null;game.reset(level);fieldBirth.clear();active=null;edgeIndex=null;preview=null;hoverEdge=null;ruler=3;mode='sum';flip=false;refresh()}
  document.querySelectorAll('[data-length]').forEach(b=>b.onclick=()=>{ruler=Number(b.dataset.length);dismissNotice();refresh()});
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{
    const sq=activeSquare();if(b.dataset.mode==='difference'&&sq.area<=1){notify('Een schuine zijde van 1 laat geen gehele rechthoekszijde over.');return}
    mode=b.dataset.mode;if(mode==='difference'&&ruler*ruler>=sq.area)ruler=Math.max(1,Math.ceil(Math.sqrt(sq.area))-1);
    dismissNotice();refresh();
  });
  $('longMeasure').onchange=()=>{ruler=Number($('longMeasure').value);dismissNotice();refresh()};
  $('flip').onclick=()=>{flip=!flip;refresh()};$('undo').onclick=undo;$('restart').onclick=()=>reset();$('overview').onclick=()=>{clearSuccessFeedback();reframe(null,true);render()};
  $('next').onclick=()=>{save();openLevel((game.state.level+1)%G.levels.length)};
  $('previousCompact').onclick=()=>$('previous').click();
  $('nextCompact').onclick=()=>$('next').click();
  $('continue').onclick=()=>{if(game.state.phase==='routeDone'){cancelReveal();clearSuccessFeedback();clearRabbitResidents();game.commit({type:'nextRoute'});fieldBirth.clear();active=null;edgeIndex=null;preview=null;hoverEdge=null;ruler=3;mode='sum';flip=false;refresh()}else $('next').onclick()};$('previous').onclick=()=>{save();openLevel((game.state.level+G.levels.length-1)%G.levels.length)};
  function inside(p,poly){let sign=0;for(let i=0;i<poly.length;i++){const c=G.cross(G.sub(poly[(i+1)%poly.length],poly[i]),G.sub(p,poly[i]));if(Math.abs(c)<G.EPS)continue;const next=Math.sign(c);if(sign&&sign!==next)return false;sign=next}return true}

  function distanceToEdge(p,e){const v=G.sub(e.b,e.a),t=Math.max(0,Math.min(1,G.dot(G.sub(p,e.a),v)/G.dot(v,v)));return G.len(G.sub(p,G.add(e.a,G.mul(v,t))))*camera.unit}
  function allFreeEdges(){
    const s=game.state;return s.objects.filter(o=>o.type==='square').flatMap(o=>G.freeEdges(s,o));
  }
  function nearestFreeEdge(p,threshold=42){
    const hits=allFreeEdges().map(edge=>({edge,d:distanceToEdge(p,edge)})).filter(h=>h.d<=threshold).sort((a,b)=>a.d-b.d);
    return hits[0]||null;
  }
  function sameEdge(a,b){return !!a&&!!b&&a.owner===b.owner&&a.index===b.index}
  function drawBuildEdge(edge,hot=false){
    const A0=screen(edge.a),B0=screen(edge.b),mid={x:(A0.x+B0.x)/2,y:(A0.y+B0.y)/2};
    ctx.save();ctx.lineCap='round';
    ctx.strokeStyle=hot?'rgba(255,225,111,.42)':'rgba(244,203,91,.25)';ctx.lineWidth=hot?16:11;ctx.beginPath();ctx.moveTo(A0.x,A0.y);ctx.lineTo(B0.x,B0.y);ctx.stroke();
    ctx.strokeStyle=hot?'#ffe28a':'#d4ad50';ctx.lineWidth=hot?5.5:4;ctx.beginPath();ctx.moveTo(A0.x,A0.y);ctx.lineTo(B0.x,B0.y);ctx.stroke();
    ctx.fillStyle=hot?'#fff1ad':'#eed27f';ctx.strokeStyle='#8b682e';ctx.lineWidth=1.25;ctx.beginPath();ctx.arc(mid.x,mid.y,hot?7:5.5,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.restore();
  }
  function pointerScreen(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
  function pointerPoint(e){return world(pointerScreen(e))}
  function startGestureStep(){
    // On an empty canvas one mathematical unit follows the neutral camera scale.
    // After release the camera may enlarge the finished field, so a 1-square never
    // stays tiny even though 10 must still be drawable on a short phone screen.
    return clamp(camera.unit,16,56);
  }
  function screenDirection(a,b){const A=screen(a),B=screen(b),dx=B.x-A.x,dy=B.y-A.y,l=Math.hypot(dx,dy)||1;return {x:dx/l,y:dy/l}}
  function screenDirectionWithCamera(a,b,cam){const A=screenWithCamera(a,cam),B=screenWithCamera(b,cam),dx=B.x-A.x,dy=B.y-A.y,l=Math.hypot(dx,dy)||1;return {x:dx/l,y:dy/l}}
  function cancelGesture(){
    if(!gesture)return;const id=gesture.id;gesture=null;preview=null;edgeIndex=null;hoverEdge=null;canvas.style.cursor='default';
    if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);reframe();render();
  }
  function moveGesture(e){
    if(!gesture){
      if(manual&&game.state.phase==='choose'){
        const hit=nearestFreeEdge(pointerPoint(e),46),next=hit?.edge||null;
        if(!sameEdge(next,hoverEdge)){hoverEdge=next;canvas.style.cursor=next?'grab':'default';render()}
      }else if(hoverEdge){hoverEdge=null;canvas.style.cursor='default';render()}
      return;
    }
    if(gesture.id!==e.pointerId)return;
    const sp=pointerScreen(e),g=gesture,s=game.state,p=worldWithCamera(sp,g.camera);
    g.distance=Math.hypot(sp.x-g.downScreen.x,sp.y-g.downScreen.y);
    if(g.type==='start'){
      const dx=sp.x-g.anchorScreen.x,dy=sp.y-g.anchorScreen.y,travel=Math.max(Math.abs(dx),Math.abs(dy)),step=startGestureStep();
      ruler=Math.max(1,Math.min(G.maxLength(s),Math.round(travel/step)));
      const sx=dx<0?-1:1,syWorld=dy>0?-1:1;
      g.x=g.anchor.x+sx*ruler/2;g.y=g.anchor.y+syWorld*ruler/2;
      const snapped={x:g.anchorScreen.x+sx*ruler*step,y:g.anchorScreen.y-syWorld*ruler*step};
      g.centerScreen={x:(g.anchorScreen.x+snapped.x)/2,y:(g.anchorScreen.y+snapped.y)/2};
      g.valid=travel>=10;g.pieces=g.valid?[G.startSquare(ruler,g.x,g.y)]:[];
    }else if(g.type==='triangle'){
      const outward=G.mul(G.perp(G.norm(G.sub(g.edge.b,g.edge.a))),-1);
      const outwardScreen=screenDirectionWithCamera(g.anchor,G.add(g.anchor,outward),g.camera);
      const ds={x:sp.x-g.anchorScreen.x,y:sp.y-g.anchorScreen.y};
      const outwardPx=ds.x*outwardScreen.x+ds.y*outwardScreen.y;
      const maximum=mode==='sum'?G.maxLength(s):Math.min(G.maxLength(s),Math.ceil(Math.sqrt(activeSquare().area))-1);
      const measure=Math.max(16,g.measureUnit);
      const magnitude=mode==='sum'?outwardPx:Math.hypot(ds.x,ds.y);
      ruler=Math.max(1,Math.min(maximum,Math.round(magnitude/measure)));
      let chosenFlip=g.flip;
      let candidate=G.plan(s,active,g.edge.index,ruler,mode,chosenFlip);
      if(candidate&&!candidate.valid){
        const mirrored=G.plan(s,active,g.edge.index,ruler,mode,!chosenFlip);
        if(mirrored?.valid){chosenFlip=!chosenFlip;candidate=mirrored}
      }
      g.flip=chosenFlip;flip=chosenFlip;preview=candidate;
      g.valid=outwardPx>=10&&preview?.valid;g.pieces=preview?[preview.triangle]:[];
      // Deliberately no reframe here. The preview may extend outside the current
      // frame while dragging; only after release may the camera make room for the
      // next construction phase. This keeps the ruler and pointer mapping stable.
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
    if(compactLandscape())setChromeCollapsed(true);
    const sp=pointerScreen(e),gestureCamera={...camera},p=worldWithCamera(sp,gestureCamera),s=game.state;dismissNotice();
    if(s.phase==='start'){
      const anchor={x:p.x,y:p.y};gesture={type:'start',anchor,anchorScreen:{...sp}};
    }else if(s.phase==='choose'){
      const hit=nearestFreeEdge(p,46);
      if(!hit){
        const field=s.objects.filter(o=>o.type==='square').find(o=>inside(p,o.points));
        if(field){active=field.id;hoverEdge=null;notify('Dit veld is gekozen. Sleep nu vanaf een goud oplichtende buitenzijde.');refresh()}
        return;
      }
      const edge=hit.edge;active=edge.owner;hoverEdge=edge;
      if(mode==='difference'&&activeSquare().area<=1){notify('Deze zijde is te kort voor een verschil. Kies een grotere tegel of een rechthoekszijde.');return}
      cancelReveal();edgeIndex=edge.index;flip=G.len(G.sub(p,edge.b))<G.len(G.sub(p,edge.a));
      const anchor=flip?edge.b:edge.a;gesture={type:'triangle',edge,anchor,anchorScreen:screenWithCamera(anchor,gestureCamera),measureUnit:gestureCamera.unit,flip};
      canvas.style.cursor='grabbing';
    }else if(['helper','result'].includes(s.phase)){
      if(distanceToEdge(p,s.pending.triangle[s.phase])>24)return;
      gesture={type:s.phase};
    }else return;
    Object.assign(gesture,{id:e.pointerId,down:p,downScreen:sp,distance:0,valid:false,pieces:[],camera:gestureCamera});
    canvas.setPointerCapture(e.pointerId);render();
  });
  canvas.addEventListener('pointermove',moveGesture);
  canvas.addEventListener('pointerup',e=>{
    if(!gesture||gesture.id!==e.pointerId)return;
    moveGesture(e);const g=gesture,plan=preview;gesture=null;preview=null;edgeIndex=null;hoverEdge=null;canvas.style.cursor='default';
    if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    if(!g.valid){if(g.type==='triangle'&&plan&&!plan.valid)notify(`Hier past de stap niet: het ${plan.blocked} overlapt. Probeer dezelfde zijde verderop, een andere buitenzijde of een andere maat.`);reframe();render();return}
    if(g.type==='start'){cameraLockOnce={world:{x:g.x,y:g.y},screen:g.centerScreen||g.anchorScreen};place({type:'start',k:ruler,x:g.x,y:g.y})}
    else if(g.type==='triangle'){
      // Now that the pointer is up, the camera may fit the complete next step. Keep
      // the side the learner grabbed visually anchored so that this post-drag fit is
      // a small, comprehensible adjustment instead of a jump to a new location.
      cameraLockOnce={world:g.anchor,screen:g.anchorScreen};
      place({type:'triangle',owner:active,edgeIndex:g.edge.index,k:ruler,mode,flip});
    }
    else place({type:g.type});
  });
  canvas.addEventListener('pointercancel',cancelGesture);
  canvas.addEventListener('lostpointercapture',cancelGesture);
  $('fieldTool').onclick=()=>notify(game.state.phase==='start'?'Sleep vanaf eender welke plek om je eerste vierkant te tekenen.':['helper','result'].includes(game.state.phase)?'Sleep vanaf de gouden zijde om het vierkant open te vouwen.':'Het volgende stuk is nu een driehoek.');
  $('triangleTool').onclick=()=>notify(game.state.phase==='choose'?'Sleep vanaf een gouden zijde om een rechthoekige driehoek te bouwen.':'Eerst het huidige veld afwerken.');
  $('topbarToggle').onclick=()=>setChromeCollapsed(!chromeCollapsed);
  $('fullscreenButton').onclick=toggleFullscreen;document.addEventListener('fullscreenchange',()=>{updateFullscreenButton();requestAnimationFrame(resize)});
  $('rootAxisToggle').onclick=e=>{e.stopPropagation();const expanded=rootAxisExpanded();clearTimeout(rootAxisTimer);rootAxisTimer=0;rootAxisAutoExpanded=false;rootAxisPinned=!expanded;syncRootAxisUI();render()};
  $('progressButton').onclick=showProgress;$('gameMenuCrumb').onclick=showProgress;$('closeProgress').onclick=()=>$('progressDialog').close();
  $('menuResume').onclick=()=>$('progressDialog').close();
  $('menuOverview').onclick=()=>{$('progressDialog').close();clearSuccessFeedback();reframe(null,true);render()};
  $('menuRestart').onclick=()=>{$('progressDialog').close();reset()};
  window.addEventListener('pagehide',save);
  window.addEventListener('resize',()=>{cancelGesture();resize()});
  if(window.visualViewport)visualViewport.addEventListener('resize',()=>{cancelGesture();resize()});
  if(window.ResizeObserver)new ResizeObserver(()=>resize()).observe(stage);
  window.addEventListener('keydown',e=>{if($('progressDialog').open)return;if(e.key==='Escape'&&(gesture||edgeIndex!==null)){e.preventDefault();undo()}});
  // Read-only diagnostic snapshot: tests still perform all placements through the UI.
  window.Wortelbouw=Object.freeze({inspect:()=>JSON.parse(JSON.stringify({state:game.state,progress,manual,gesture,ruler,mode,flip,edgeIndex,active,preview,camera,gestureCamera:gesture?.camera||null,successCamera,successSequence,rabbitMigration,celebrationStage:celebrationStage(),rootVisible:celebrationRootVisible(),chainFocus,viewFrame:viewFrame(),renderCount,revealing:!!revealFrame}))});
  let recovered=false;
  try{const loaded=P.read(JSON.parse((AX.storage||storage).getItem(P.KEY)||'null'),AX.state?.completed||[]);progress=loaded.progress;progress.manual=true;recovered=loaded.recovered}catch{progress=P.read(null,AX.state?.completed||[]).progress;progress.manual=true;recovered=true}
  updateFullscreenButton();openLevel(P.ids.indexOf(progress.current));resize();
  if(recovered)notify('Je afgeronde opgaven zijn behouden. Een oude bouwpoging kon niet worden hervat.');
})();
