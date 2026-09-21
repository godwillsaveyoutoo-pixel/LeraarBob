const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {randomUUID}=require('node:crypto');
function game(){
  let now=100000,timerId=0;const timers=new Map(),frames=new Map(),nodes=new Map(),speeds=[];
  class Element{
    constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.style={};this.attributes={};this.hidden=false;this.disabled=false;this.value='';this.innerHTML='';this.textContent='';this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle:(c,on)=>{if(on??!this.classes.has(c))this.classes.add(c);else this.classes.delete(c)},contains:c=>this.classes.has(c)}}
    append(...items){this.children.push(...items)}replaceChildren(...items){this.children=items}
    setAttribute(k,v){this.attributes[k]=v;if(k==='class')this.className=v}getAttribute(k){return this.attributes[k]}
    querySelectorAll(selector){return selector==='button'?this.children.filter(c=>c.tagName==='button'):[]}
    showModal(){this.open=true}close(){this.open=false}matches(){return false}
  }
  const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id)};
  get('teamName').value='Duo Test';get('groupSpeed').value='5';get('groupRankSpeed').value='5';
  for(const speed of [3,5,8]){const b=new Element('button');b.dataset.speed=String(speed);speeds.push(b)}
  const document={getElementById:get,createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag),querySelectorAll:()=>speeds};
  const account={id:'player-a',alias:'Testspeler'},tabId='tab-a';let snapshot,listener;
  const copies=x=>structuredClone(x);
  const answerCalls=[];
  const emit=()=>{snapshot.server_time=new Date(now).toISOString();snapshot.clockOffset=0;listener?.(copies(snapshot))};
  const api={state:()=>copies(snapshot),ready:async()=>copies(snapshot),onChange:fn=>{listener=fn},refresh:async()=>{emit()},answer:async packet=>{
    answerCalls.push(packet);const m=snapshot.member;
    assert.equal(packet.version,m.version);const correct=packet.answer===[1,-1,2,-.5,.5,-2,0][m.streak];
    m.streak=correct?m.streak+1:0;m.misses+=correct?0:1;m.version++;m.last_event_id=packet.eventId;m.last_correct=correct;m.next_at=new Date(now+800).toISOString();
    snapshot.members[0]={...snapshot.members[0],streak:m.streak,misses:m.misses};
    if(m.streak===7){snapshot.current.status='finished';snapshot.current.winner_id=account.id;snapshot.current.winner_alias=account.alias;snapshot.current.elapsed_ms=now-Date.parse(snapshot.current.starts_at)}
    emit();return copies(snapshot);
  }};
  snapshot={account,tabId,connected:true,clockOffset:0,server_time:new Date(now).toISOString(),sessions:[],current:null,member:null,members:[]};
  const ctx={document,console,performance:{now:()=>now},Date:class extends Date{static now(){return now}},crypto:{randomUUID},
    matchMedia:()=>({matches:true}),localStorage:{getItem:()=>null,setItem:()=>{}},location:{search:''},URLSearchParams,
    setTimeout:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,at:now+ms});return id},clearTimeout:id=>timers.delete(id),
    requestAnimationFrame:fn=>{const id=++timerId;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),
    addEventListener:()=>{},AxiomaGame:{state:{},storage:{getItem:()=>null,setItem:()=>{}},report:()=>{}},AxiomaGroups:api,AxiomaProgress:{completeUnit:async()=>{}}};
  ctx.window=ctx;vm.createContext(ctx);
  let script=fs.readFileSync('games/rechten/kleiduiven/kleiduiven.js','utf8');
  script=script.replace('initField();readHistory();',`window.testGame={updateGroup,startGame,stopGame,fire,fail,groupState:()=>({groupMode,groupVersion,state,streak:mastered.size,attempt:attempt?.id}),renderGroupMenu};initField();readHistory();`);
  vm.runInContext(script,ctx);
  async function tick(ms){const until=now+ms;while(now<until){now=Math.min(until,now+20);for(const [id,t]of[...timers])if(t.at<=now){timers.delete(id);t.fn()}const fs=[...frames];frames.clear();for(const[,fn]of fs)fn(now);await Promise.resolve();await Promise.resolve()}}
  function startGroup(){snapshot.current={id:'session-a',status:'running',speed:5,host_id:account.id,host_alias:account.alias,starts_at:new Date(now+5000).toISOString()};snapshot.member={user_id:account.id,tab_id:tabId,left_at:null,streak:0,misses:0,version:0,next_at:snapshot.current.starts_at};snapshot.members=[{...snapshot.member,alias:account.alias,online:true}];emit()}
  async function choose(value){const b=get('choices').children.find(b=>Number(b.dataset.a)===value);assert(b,'answer choice exists');b.onclick();await tick(1200)}
  return {ctx,get,tick,startGroup,choose,snapshot,answerCalls,emit};
}
test('group race starts together, resets the entire streak on a miss and finishes on seven correct answers',async()=>{
 const g=game();await Promise.resolve();await Promise.resolve();g.startGroup();
 assert.equal(g.ctx.testGame.groupState().state,'groupwait');assert.equal(g.get('countdown').hidden,false);
 await g.tick(5100);assert.equal(g.ctx.testGame.groupState().attempt,'p1');
 await g.choose(1);assert.equal(g.snapshot.member.streak,1);assert.equal(g.ctx.testGame.groupState().attempt,'n1');
 await g.choose(1);assert.equal(g.snapshot.member.streak,0);assert.equal(g.snapshot.member.misses,1);assert.equal(g.ctx.testGame.groupState().attempt,'p1');
 for(const a of [1,-1,2,-.5,.5,-2,0])await g.choose(a);
 assert.equal(g.snapshot.current.status,'finished');assert.equal(g.snapshot.current.winner_id,'player-a');assert.equal(g.ctx.testGame.groupState().state,'groupdone');
 assert.equal(g.answerCalls.length,9);assert.equal(new Set(g.answerCalls.map(p=>p.eventId)).size,9);
 assert.match(g.get('groupContent').innerHTML,/Testspeler wint/);
});
test('a timeout submits one miss and a remote winner stops the remaining animation and timers',async()=>{
 const g=game();await Promise.resolve();await Promise.resolve();g.startGroup();await g.tick(10300);
 assert.equal(g.answerCalls.length,1);assert.equal(g.answerCalls[0].answer,null);assert.equal(g.snapshot.member.streak,0);
 g.snapshot.current.status='finished';g.snapshot.current.winner_id='other';g.snapshot.current.winner_alias='Andere speler';g.snapshot.current.elapsed_ms=5500;g.emit();
 await g.tick(6000);assert.equal(g.answerCalls.length,1);assert.equal(g.ctx.testGame.groupState().state,'groupdone');assert.match(g.get('groupContent').innerHTML,/Andere speler wint/);
});
test('standalone still runs and restart cancels its delayed countdown',async()=>{
 const g=game();await Promise.resolve();await Promise.resolve();g.ctx.testGame.startGame();assert.equal(g.ctx.testGame.groupState().state,'countdown');
 g.get('restart').onclick();await g.tick(4000);assert.equal(g.ctx.testGame.groupState().state,'lobby');assert.equal(g.ctx.testGame.groupState().attempt,undefined);
 g.ctx.testGame.startGame();await g.tick(3100);assert.equal(g.ctx.testGame.groupState().state,'playing');assert.equal(g.ctx.testGame.groupState().attempt,'p1');
});
