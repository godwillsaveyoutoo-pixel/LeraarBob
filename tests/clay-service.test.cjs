const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function service(){
 let account={id:'a',alias:'Leerling'},authListener,block=null;const calls=[];
 const client={rpc(name,args){calls.push({name,args});const result={sessions:[],current:null,member:null,members:[],server_time:new Date().toISOString()};const promise=block?new Promise(resolve=>block.push(()=>resolve({data:result}))):Promise.resolve({data:result});promise.abortSignal=()=>promise;return promise}};
 const context={URL,Date,Promise,AbortController,console,location:{pathname:'/games/rechten/kleiduiven/',assign:()=>{throw Error('Unexpected navigation')}},
  document:{currentScript:{src:'https://school.example/shared/axioma-groups.js'},hidden:false,addEventListener:()=>{}},
  setTimeout:()=>1,clearTimeout:()=>{},CustomEvent:class{constructor(name,opts){this.type=name;this.detail=opts?.detail}},Event:class{},
  sessionStorage:{getItem:()=>null,setItem:()=>{}},addEventListener:()=>{},dispatchEvent:()=>{},
  AxiomaSocial:{ready:async()=>{},state:()=>({tabId:'tab-a'})},
  AxiomaAuth:{client:()=>client,getAccount:async()=>account,onChange:fn=>{authListener=fn}}};
 context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync('shared/axioma-groups.js','utf8'),context);
 return {api:context.AxiomaGroups,calls,block(){block=[];return block},logout(){account=null;authListener({account})}};
}
test('group requests use the shared tab identity and send answers with a stable event id and revision',async()=>{
 const s=service();await s.api.ready();await s.api.refresh();
 await s.api.create(8);await s.api.join('session');
 const answer={sessionId:'session',answer:-.5,eventId:'answer-1',version:3};
 await s.api.answer(answer);await s.api.answer(answer);
 assert(s.calls.every(c=>c.name==='axioma_clay_v2'&&c.args.p_tab_id==='tab-a'));
 const answers=s.calls.filter(c=>c.args.p_action==='answer');
 assert.equal(answers.length,2);assert.equal(answers[0].args.p_event_id,answers[1].args.p_event_id);
 assert.equal(answers[0].args.p_version,3);assert.equal(answers[0].args.p_answer,-.5);
 assert.equal(s.calls.find(c=>c.args.p_action==='create').args.p_speed,8);
});
test('logout discards an in-flight group response and clears participant data',async()=>{
 const s=service();await s.api.ready();await s.api.refresh();const pending=s.block();
 const request=s.api.refresh();await Promise.resolve();await Promise.resolve();
 s.logout();pending.forEach(fn=>fn());await request;
 assert.equal(s.api.state().account,null);assert.equal(s.api.state().current,null);assert.equal(s.api.state().connected,false);
 await assert.rejects(s.api.create(5),/Log eerst in/);
});
