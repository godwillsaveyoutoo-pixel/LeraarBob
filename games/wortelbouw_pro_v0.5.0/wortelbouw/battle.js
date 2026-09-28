(() => {
  'use strict';
  const G=window.WortelbouwGeometry,A=window.WortelbouwAssets||null;
  if(!G)return;
  const $=id=>document.getElementById(id),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const add=G.add,sub=G.sub,mul=G.mul,len=G.len,center=G.center;
  const BATTLE_POOLS={
    basis:[2,5,13,25],
    groot:[18,25,100,104],
    mix:[2,5,13,18,25,100,104]
  };
  const LEVEL_BY_N=new Map(G.levels.map((l,i)=>[l.n,{...l,index:i}]));
  const storage=(()=>{try{return localStorage}catch{return {getItem:()=>null,setItem:()=>{}}}})();
  let audioEnabled=true,audioCtx=null;
  function ensureAudio(){if(!audioEnabled)return null;try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}catch{return null}}
  function tone(freq=440,duration=.08,gain=.035,delay=0){const ac=ensureAudio();if(!ac)return;const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+delay;o.type='sine';o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+duration+.02)}
  function successSound(){tone(523,.11,.03,0);tone(659,.14,.028,.045);tone(784,.18,.025,.09)}
  function countSound(n){tone(n===1?660:440+(3-n)*70,.075,.025)}

  class Arena{
    constructor(index,canvas,notice,undo,controller){
      this.index=index;this.canvas=canvas;this.ctx=canvas.getContext('2d');this.notice=notice;this.undoButton=undo;this.controller=controller;
      this.game=new G.Game(0);this.camera={unit:42,x:0,y:0};this.width=0;this.height=0;this.dpr=1;this.gesture=null;this.preview=null;this.hoverEdge=null;this.active=null;this.locked=true;this.winPulse=0;this.noticeTimer=0;this.renderFrame=0;
      this.boundMove=e=>this.move(e);this.bind();
      this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);
    }
    bind(){
      this.canvas.addEventListener('pointerdown',e=>this.down(e));this.canvas.addEventListener('pointermove',this.boundMove);this.canvas.addEventListener('pointerup',e=>this.up(e));this.canvas.addEventListener('pointercancel',e=>this.cancel(e));this.canvas.addEventListener('lostpointercapture',e=>this.cancel(e));
      this.undoButton.addEventListener('click',()=>this.undo());
    }
    reset(levelIndex){this.cancel();this.game.reset(levelIndex);this.active=null;this.preview=null;this.hoverEdge=null;this.locked=true;this.reframe();this.render()}
    setLocked(value){this.locked=!!value;this.canvas.style.cursor=this.locked?'default':this.canvas.style.cursor;this.render()}
    level(){return G.levels[this.game.state.level]}
    notify(text){clearTimeout(this.noticeTimer);this.notice.textContent=text;this.notice.hidden=false;this.noticeTimer=setTimeout(()=>this.notice.hidden=true,1700)}
    resize(){const r=this.canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);if(r.width===this.width&&r.height===this.height&&d===this.dpr)return false;this.width=r.width;this.height=r.height;this.dpr=d;this.canvas.width=Math.max(1,Math.round(r.width*d));this.canvas.height=Math.max(1,Math.round(r.height*d));this.ctx.setTransform(d,0,0,d,0,0);if(!this.game.state.objects.length){this.camera.x=this.width/2;this.camera.y=this.height*.62}this.reframe(null,true);this.render();return true}
    screen(p,cam=this.camera){return {x:cam.x+p.x*cam.unit,y:cam.y-p.y*cam.unit}}
    world(p,cam=this.camera){return {x:(p.x-cam.x)/cam.unit,y:(cam.y-p.y)/cam.unit}}
    pointerScreen(e){const r=this.canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
    pointerPoint(e,cam=this.camera){return this.world(this.pointerScreen(e),cam)}
    objectsForView(){const s=this.game.state,arr=[...s.objects];if(s.phase==='helper'&&s.pending)arr.push(s.pending.helper,s.pending.result);else if(s.phase==='result'&&s.pending)arr.push(s.pending.result);return arr}
    reframe(lock=null,force=false){
      if(this.gesture&&!force)return;
      const objects=this.objectsForView();if(!objects.length){this.camera.unit=Math.min(50,Math.max(34,Math.min(this.width,this.height)/9));this.camera.x=this.width/2;this.camera.y=this.height*.62;return}
      const b=G.bounds(objects),pad=32,w=Math.max(.4,b.maxX-b.minX),h=Math.max(.4,b.maxY-b.minY),usableW=Math.max(160,this.width-pad*2),usableH=Math.max(140,this.height-pad*2);
      const target=Math.min(82,Math.max(18,Math.min(usableW/w,usableH/h)*.82));
      this.camera.unit=target;const cx=(b.minX+b.maxX)/2,cy=(b.minY+b.maxY)/2;this.camera.x=this.width/2-cx*target;this.camera.y=this.height/2+cy*target;
      if(lock?.world&&lock?.screen){this.camera.x=lock.screen.x-lock.world.x*target;this.camera.y=lock.screen.y+lock.world.y*target}
    }
    path(points){const c=this.ctx;c.beginPath();points.forEach((p,i)=>{const q=this.screen(p);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y)});c.closePath()}
    polygonCenter(points){return center(points)}
    fieldLocal(o,u,v){const p0=o.points[0],vx=sub(o.points[1],p0),vy=sub(o.points[3],p0);return add(p0,add(mul(vx,u),mul(vy,v)))}
    drawField(o,ghost=false){
      const c=this.ctx,pts=o.points,grow=ghost?.grow??1;this.path(pts);c.save();c.globalAlpha=ghost?0.45:1;c.fillStyle=ghost?'#ccb67b':'#79a85e';c.fill();c.clip();
      const grass=A?.get('grass');if(grass&&!ghost){const p0=this.screen(pts[0]),p1=this.screen(pts[1]),p3=this.screen(pts[3]),w=len(sub(p1,p0)),h=len(sub(p3,p0)),angle=Math.atan2(p1.y-p0.y,p1.x-p0.x);c.save();c.translate(p0.x,p0.y);c.rotate(angle);c.globalAlpha=.48;c.drawImage(grass,0,-h,w,h);c.restore()}
      c.restore();
      this.path(pts);c.strokeStyle=ghost?'#bda36d':'#72572c';c.lineWidth=ghost?2:3;c.lineJoin='round';c.stroke();
      if(!ghost){const area=Math.round(o.area),p=this.screen(this.polygonCenter(pts));c.save();c.fillStyle='#f7eac8e8';c.strokeStyle='#a78f5d';c.lineWidth=1;c.font='800 13px Georgia,serif';const txt=`A=${area}`,m=c.measureText(txt),bw=m.width+12;c.beginPath();c.roundRect(p.x-bw/2,p.y-11,bw,22,7);c.fill();c.stroke();c.fillStyle='#31543a';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,p.x,p.y);c.restore();this.drawRabbit(o)}
    }
    drawRabbit(o){const img=A?.get('rabbitIdle');if(!img)return;const p=this.screen(this.fieldLocal(o,.23,.72)),side=Math.sqrt(o.area)*this.camera.unit,size=clamp(side*.18,17,34);this.ctx.save();this.ctx.globalAlpha=.88;this.ctx.drawImage(img,p.x-size/2,p.y-size*.72,size,size);this.ctx.restore()}
    drawTriangle(t,ghost=false){const c=this.ctx;this.path(t.points);c.save();c.globalAlpha=ghost?.alpha??(ghost?.valid===false?.35:1);c.fillStyle=ghost?.valid===false?'#b66c59':'#c9a870';c.fill();c.strokeStyle=ghost?.valid===false?'#8b4436':'#8d6b38';c.lineWidth=ghost?2:2.5;c.stroke();c.restore();const rp=this.screen(t.right),a=this.screen(t.points[0]);c.save();c.fillStyle='#f6e8c6';c.strokeStyle='#806b41';c.lineWidth=1;c.fillRect(rp.x-4,rp.y-4,8,8);c.strokeRect(rp.x-4,rp.y-4,8,8);c.restore()}
    freeEdges(){const out=[];for(const sq of this.game.state.objects.filter(o=>o.type==='square'))for(const e of G.freeEdges(this.game.state,sq))out.push(e);return out}
    distanceToEdge(p,e){const v=sub(e.b,e.a),t=clamp(G.dot(sub(p,e.a),v)/G.dot(v,v)),q=add(e.a,mul(v,t));return len(sub(p,q))*this.camera.unit}
    nearestEdge(p,threshold=44){let best=null;for(const e of this.freeEdges()){const d=this.distanceToEdge(p,e);if(d<=threshold&&(!best||d<best.d))best={edge:e,d}}return best}
    sameEdge(a,b){return !!a&&!!b&&a.owner===b.owner&&a.index===b.index}
    drawEdge(e,hot=false){const c=this.ctx,A0=this.screen(e.a),B0=this.screen(e.b),m={x:(A0.x+B0.x)/2,y:(A0.y+B0.y)/2};c.save();c.strokeStyle=hot?'#fff0a3':'#e2c46e';c.shadowColor=hot?'#ffeaa0':'#e5c673';c.shadowBlur=hot?14:7;c.lineWidth=hot?5:4;c.beginPath();c.moveTo(A0.x,A0.y);c.lineTo(B0.x,B0.y);c.stroke();c.fillStyle=hot?'#fff0a3':'#e2c46e';c.beginPath();c.arc(m.x,m.y,hot?6:4.5,0,Math.PI*2);c.fill();c.restore()}
    drawGround(){const c=this.ctx,g=A?.get('ground');if(g){const pat=c.createPattern(g,'repeat');c.fillStyle=pat}else c.fillStyle='#d6c48d';c.fillRect(0,0,this.width,this.height);c.fillStyle='rgba(255,250,220,.11)';for(let x=19;x<this.width;x+=53)for(let y=31;y<this.height;y+=61){c.beginPath();c.arc(x,y,1.2,0,Math.PI*2);c.fill()}}
    render(now=performance.now()){
      if(!this.width||!this.height)return;const c=this.ctx;c.clearRect(0,0,this.width,this.height);this.drawGround();
      for(const o of this.game.state.objects){if(o.type==='triangle')this.drawTriangle(o);else this.drawField(o)}
      const g=this.gesture;if(g?.pieces)for(const p of g.pieces){if(p.type==='triangle')this.drawTriangle(p,{valid:g.valid,alpha:.7});else this.drawField(p,{grow:g.amount||1})}
      if(!this.locked&&this.game.state.phase==='choose')for(const e of this.freeEdges())this.drawEdge(e,this.sameEdge(e,this.hoverEdge));
      if(this.winPulse&&now-this.winPulse<850){const t=clamp((now-this.winPulse)/850),a=Math.sin(Math.PI*t);c.save();c.fillStyle=`rgba(255,229,112,${.14*a})`;c.fillRect(0,0,this.width,this.height);c.restore();requestAnimationFrame(ts=>this.render(ts))}
      this.undoButton.disabled=this.locked||!this.game.history.length;
    }
    startAnimation(){this.winPulse=performance.now();this.canvas.closest('.arena')?.classList.remove('roundWinner');void this.canvas.offsetWidth;this.canvas.closest('.arena')?.classList.add('roundWinner');this.render()}
    down(e){
      if(this.locked||this.gesture||e.button!==0)return;const sp=this.pointerScreen(e),cam={...this.camera},p=this.world(sp,cam),s=this.game.state;
      let g=null;
      if(s.phase==='start')g={type:'start',anchor:p,anchorScreen:sp};
      else if(s.phase==='choose'){
        const hit=this.nearestEdge(p,46);if(!hit){const field=s.objects.filter(o=>o.type==='square').find(o=>this.inside(p,o.points));if(field){this.active=field.id;this.notify('Kies een gouden buitenzijde.');this.render()}return}
        const edge=hit.edge;this.active=edge.owner;const flip=len(sub(p,edge.b))<len(sub(p,edge.a)),anchor=flip?edge.b:edge.a;g={type:'triangle',edge,anchor,anchorScreen:this.screen(anchor,cam),measureUnit:cam.unit,flip};
      }else if(['helper','result'].includes(s.phase)){
        if(this.distanceToEdge(p,s.pending.triangle[s.phase])>28)return;g={type:s.phase};
      }
      if(!g)return;Object.assign(g,{id:e.pointerId,down:p,downScreen:sp,distance:0,valid:false,pieces:[],camera:cam,amount:0});this.gesture=g;this.canvas.setPointerCapture(e.pointerId);this.render();
    }
    move(e){
      if(!this.gesture){if(!this.locked&&this.game.state.phase==='choose'){const next=this.nearestEdge(this.pointerPoint(e),46)?.edge||null;if(!this.sameEdge(next,this.hoverEdge)){this.hoverEdge=next;this.canvas.style.cursor=next?'grab':'default';this.render()}}return}
      const g=this.gesture;if(g.id!==e.pointerId)return;const sp=this.pointerScreen(e),p=this.world(sp,g.camera),s=this.game.state;g.distance=Math.hypot(sp.x-g.downScreen.x,sp.y-g.downScreen.y);
      if(g.type==='start'){
        const dx=sp.x-g.anchorScreen.x,dy=sp.y-g.anchorScreen.y,travel=Math.max(Math.abs(dx),Math.abs(dy)),step=clamp(g.camera.unit,18,52),k=clamp(Math.round(travel/step),1,G.maxLength(s));g.k=k;const sx=dx<0?-1:1,sy=dy>0?-1:1;g.x=g.anchor.x+sx*k/2;g.y=g.anchor.y+sy*k/2;g.valid=travel>=12;g.pieces=g.valid?[G.startSquare(k,g.x,g.y)]:[];
      }else if(g.type==='triangle'){
        const edge=g.edge,out=mul(G.perp(G.norm(sub(edge.b,edge.a))),-1),a=this.screen(g.anchor,g.camera),b=this.screen(add(g.anchor,out),g.camera),ol=Math.hypot(b.x-a.x,b.y-a.y)||1,od={x:(b.x-a.x)/ol,y:(b.y-a.y)/ol},ds={x:sp.x-g.anchorScreen.x,y:sp.y-g.anchorScreen.y},outPx=ds.x*od.x+ds.y*od.y,k=clamp(Math.round(Math.max(0,outPx)/Math.max(18,g.measureUnit)),1,G.maxLength(s));g.k=k;let cand=G.plan(s,this.active,edge.index,k,'sum',g.flip);if(cand&&!cand.valid){const m=G.plan(s,this.active,edge.index,k,'sum',!g.flip);if(m?.valid){g.flip=!g.flip;cand=m}}g.plan=cand;this.preview=cand;g.valid=outPx>=11&&!!cand?.valid;g.pieces=cand?[cand.triangle]:[];
      }else{
        const edge=s.pending.triangle[g.type],tile=s.pending[g.type],mid=add(edge.a,mul(sub(edge.b,edge.a),.5)),out=G.norm(sub(center(tile.points),mid)),L=Math.sqrt(tile.area),amount=clamp(G.dot(sub(p,g.down),out)/L);g.amount=amount;g.pieces=[{...tile,points:tile.points.map(v=>sub(v,mul(out,G.dot(sub(v,mid),out)*(1-amount))))}];g.valid=amount>=.62&&g.distance>=10;
      }
      this.render();
    }
    up(e){
      const g=this.gesture;if(!g||g.id!==e.pointerId)return;this.move(e);this.gesture=null;this.preview=null;this.hoverEdge=null;this.canvas.style.cursor='default';if(this.canvas.hasPointerCapture(e.pointerId))this.canvas.releasePointerCapture(e.pointerId);
      if(!g.valid){if(g.type==='triangle'&&g.plan&&!g.plan.valid)this.notify('Hier overlapt de bouw. Kies een andere zijde of maat.');this.render();return}
      try{
        if(g.type==='start'){this.game.commit({type:'start',k:g.k,x:g.x,y:g.y});this.active='s0';this.reframe()}
        else if(g.type==='triangle'){this.game.commit({type:'triangle',owner:this.active,edgeIndex:g.edge.index,k:g.k,mode:'sum',flip:g.flip});this.reframe({world:g.anchor,screen:g.anchorScreen})}
        else if(g.type==='helper'){this.game.commit({type:'helper'})}
        else if(g.type==='result'){this.game.commit({type:'result'});this.reframe();setTimeout(()=>this.reveal(),180)}
      }catch(err){this.notify(err.message||'Deze stap lukt hier niet.')}
      this.render();
    }
    reveal(){if(this.game.state.phase!=='reveal'||this.locked)return;try{this.game.commit({type:'reveal'});this.reframe();this.render();if(this.game.state.phase==='won')this.controller.arenaSolved(this)}catch(err){this.notify(err.message||'Controle mislukt.')}
    }
    cancel(){if(!this.gesture)return;const id=this.gesture.id;this.gesture=null;this.preview=null;this.hoverEdge=null;if(this.canvas.hasPointerCapture?.(id))try{this.canvas.releasePointerCapture(id)}catch{};this.render()}
    undo(){if(this.locked)return;this.cancel();this.game.undo();this.active=this.game.state.active;this.reframe();this.render()}
    inside(p,poly){let sign=0;for(let i=0;i<poly.length;i++){const cr=G.cross(sub(poly[(i+1)%poly.length],poly[i]),sub(p,poly[i]));if(Math.abs(cr)<G.EPS)continue;const n=Math.sign(cr);if(sign&&sign!==n)return false;sign=n}return true}
  }

  window.WortelbouwArena=Arena;
  if(window.WortelbouwArenaOnly)return;

  class BattleController{
    constructor(){
      this.arenas=[new Arena(0,$('battleCanvas1'),$('arenaNotice1'),$('undo1'),this),new Arena(1,$('battleCanvas2'),$('arenaNotice2'),$('undo2'),this)];
      this.names=['Speler 1','Speler 2'];this.scores=[0,0];this.round=0;this.roundCount=3;this.goals=[];this.started=false;this.roundLive=false;this.pendingWinner=null;this.tieWindow=150;this.series='mix';this.setupWasLive=false;
      this.setupEvents();this.resize();window.addEventListener('resize',()=>this.resize());window.visualViewport?.addEventListener('resize',()=>this.resize());
      this.openSetup();
    }
    setupEvents(){
      $('battleMenu').onclick=()=>this.openSetup();$('battleFullscreen').onclick=()=>this.toggleFullscreen();document.addEventListener('fullscreenchange',()=>this.syncFullscreen());
      $('battleSound').onclick=()=>{audioEnabled=!audioEnabled;$('battleSound').textContent=audioEnabled?'♪':'×';$('battleSound').setAttribute('aria-label',audioEnabled?'Geluid uitzetten':'Geluid aanzetten')};
      $('startBattleButton').onclick=()=>this.startFromSetup();
      $('nextRoundButton').onclick=()=>this.advanceRound();
      $('battleSetup').addEventListener('close',()=>{if(this.started&&this.setupWasLive&&$('battleSetup').returnValue!=='default'){this.roundLive=true;for(const a of this.arenas)a.setLocked(false)}this.setupWasLive=false});
    }
    resize(){for(const a of this.arenas)a.resize()}
    openSetup(){const d=$('battleSetup');this.setupWasLive=!!this.roundLive;if(this.setupWasLive){this.roundLive=false;for(const a of this.arenas)a.setLocked(true)}$('name1Input').value=this.names[0];$('name2Input').value=this.names[1];$('roundCountSelect').value=String(this.roundCount);$('battleSeriesSelect').value=this.series;if(!d.open)d.showModal()}
    sanitizeName(v,fallback){return String(v||'').trim().slice(0,18)||fallback}
    startFromSetup(){ensureAudio();this.names=[this.sanitizeName($('name1Input').value,'Speler 1'),this.sanitizeName($('name2Input').value,'Speler 2')];this.roundCount=Number($('roundCountSelect').value)||3;this.series=$('battleSeriesSelect').value in BATTLE_POOLS?$('battleSeriesSelect').value:'mix';storage.setItem('wortelbouw-battle-names',JSON.stringify(this.names));this.scores=[0,0];this.round=0;this.goals=this.pickGoals(this.roundCount,this.series);this.started=true;$('battleSetup').close();this.updateNames();this.prepareRound()}
    pickGoals(count,series){const pool=[...BATTLE_POOLS[series]],out=[];let seed=Date.now()%2147483647;const rnd=()=>{seed=(seed*48271)%2147483647;return seed/2147483647};while(out.length<count){if(!pool.length)pool.push(...BATTLE_POOLS[series]);const i=Math.floor(rnd()*pool.length);out.push(pool.splice(i,1)[0])}return out}
    currentLevel(){return LEVEL_BY_N.get(this.goals[this.round])||LEVEL_BY_N.get(5)}
    goalText(){const l=this.currentLevel();return l.label||`√${l.n}`}
    prepareRound(){
      clearTimeout(this.pendingWinner);this.pendingWinner=null;this.roundLive=false;$('nextRoundButton').hidden=true;const level=this.currentLevel();for(const a of this.arenas){a.reset(level.index);a.setLocked(true)}this.updateHUD();this.countdown();
    }
    countdown(){
      const overlay=$('battleCountdown');document.body.classList.add('counting');let n=3;overlay.textContent='3';countSound(3);this.setCenter(`RONDE ${this.round+1}/${this.roundCount}`,`3`);
      const step=()=>{n--;if(n>0){overlay.textContent=String(n);countSound(n);this.setCenter(`RONDE ${this.round+1}/${this.roundCount}`,String(n));setTimeout(step,620)}else{overlay.textContent='BOUW';tone(760,.12,.035);this.setCenter(`RONDE ${this.round+1}/${this.roundCount}`,`MAAK ${this.goalText()}`);setTimeout(()=>{document.body.classList.remove('counting');overlay.textContent='';this.roundLive=true;for(const a of this.arenas)a.setLocked(false)},430)}};setTimeout(step,620)
    }
    arenaSolved(arena){if(!this.roundLive)return;const when=performance.now();if(!this.pendingWinner){this.pendingWinner={arena,when,timer:setTimeout(()=>this.awardPending(),this.tieWindow)}}else if(this.pendingWinner.arena!==arena&&when-this.pendingWinner.when<=this.tieWindow){clearTimeout(this.pendingWinner.timer);this.pendingWinner={tie:true};this.finishRound(null,true)}}
    awardPending(){if(!this.pendingWinner||this.pendingWinner.tie)return;const winner=this.pendingWinner.arena;this.pendingWinner=null;this.finishRound(winner,false)}
    finishRound(winner,tie=false){
      this.roundLive=false;for(const a of this.arenas)a.setLocked(true);if(winner){this.scores[winner.index]++;winner.startAnimation();successSound();this.setCenter(`RONDE ${this.round+1}/${this.roundCount}`,`PUNT · ${this.names[winner.index]}`)}else{tone(392,.12,.025);tone(392,.12,.02,.07);this.setCenter(`RONDE ${this.round+1}/${this.roundCount}`,`GELIJK`)}this.updateScores();
      const final=this.round+1>=this.roundCount;if(final){setTimeout(()=>this.finishMatch(),1050)}else setTimeout(()=>{const b=$('nextRoundButton');b.hidden=false;b.textContent='Volgende ronde →'},850)
    }
    advanceRound(){if(this.round+1>=this.roundCount)return;this.round++;this.prepareRound()}
    finishMatch(){
      const [a,b]=this.scores;let message=a===b?'GELIJKSPEL':`${this.names[a>b?0:1]} WINT`;this.setCenter(`${a} – ${b}`,message);$('nextRoundButton').hidden=false;$('nextRoundButton').textContent='Nog eens →';$('nextRoundButton').onclick=()=>{this.scores=[0,0];this.round=0;this.goals=this.pickGoals(this.roundCount,this.series);this.updateScores();$('nextRoundButton').onclick=()=>this.advanceRound();this.prepareRound()}
    }
    updateNames(){$('playerOneName').textContent=this.names[0];$('playerTwoName').textContent=this.names[1];this.updateScores()}
    dots(score){return Array.from({length:this.roundCount},(_,i)=>i<score?'●':'○').join(' ')}
    updateScores(){const a=$('playerOneScore'),b=$('playerTwoScore');a.textContent=this.dots(this.scores[0]);b.textContent=this.dots(this.scores[1]);a.setAttribute('aria-label',`${this.scores[0]} punten`);b.setAttribute('aria-label',`${this.scores[1]} punten`)}
    updateHUD(){this.setCenter(`RONDE ${this.round+1}/${this.roundCount}`,`MAAK ${this.goalText()}`);this.updateScores()}
    setCenter(round,msg){const el=$('roundMessage');el.replaceChildren();const s=document.createElement('span'),dot=document.createElement('b'),strong=document.createElement('strong');s.textContent=round;dot.textContent='·';strong.textContent=msg;strong.dataset.round=String(this.round+1);el.append(s,dot,strong)}
    async toggleFullscreen(){try{if(!document.fullscreenElement){await document.documentElement.requestFullscreen?.({navigationUI:'hide'});try{await screen.orientation?.lock?.('landscape')}catch{}}else await document.exitFullscreen?.()}catch{}this.syncFullscreen()}
    syncFullscreen(){$('battleFullscreen').textContent=document.fullscreenElement?'×':'⛶'}
  }
  const names=(()=>{try{return JSON.parse(storage.getItem('wortelbouw-battle-names')||'null')}catch{return null}})();
  const controller=new BattleController();if(Array.isArray(names)&&names.length===2){controller.names=[String(names[0]),String(names[1])];controller.updateNames();$('name1Input').value=controller.names[0];$('name2Input').value=controller.names[1]}
  window.WortelbouwBattle=Object.freeze({inspect:()=>({round:controller.round,roundCount:controller.roundCount,scores:[...controller.scores],goal:controller.goals[controller.round]||null,roundLive:controller.roundLive,players:controller.arenas.map(a=>({phase:a.game.state.phase,steps:a.game.state.steps,objects:a.game.state.objects.length,bounds:a.game.state.objects.length?G.bounds(a.game.state.objects):null,viewport:{width:a.width,height:a.height},camera:{...a.camera},locked:a.locked}))})});
})();
