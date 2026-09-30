const {test}=require('node:test'),assert=require('node:assert/strict');
const Game=require('../games/rechten/rechtenwereld/battle-config.js'),R=require('../games/rechten/rechtenwereld/mission-runtime.js'),W=require('../games/rechten/core/wave-core.js'),V=require('../games/rechten/rechtenwereld/components/grens-view.js');
const policy=require('../shared/multiplayer/rechten-online-policy.cjs');
const fixtures=require('./helpers/rechten-question-fixtures.cjs').fixtures();
function completed(worlds){const s=R.initial();for(const {m} of fixtures)if(m.completed&&worlds.includes(m.world))s.missions[m.skill]=structuredClone(m);return s;}
test('pool requires whole completed released worlds and never requires optional Puntenbaai',()=>{
 const hills=completed(['hellingrug']),all=completed(['hellingrug','grenspas','formulewerf','signaalstad']);
 assert.deepEqual(policy.pool(all,hills),Game.worlds.find(w=>w.id==='hellingrug').skills);
 assert.deepEqual(policy.pool(R.initial(),all),[]);assert(!policy.pool(all,all).includes('point'));assert(policy.pool(all,all).includes('graph_from_table'));
 const onlySlope={...R.initial(),missions:{slope:{world:'hellingrug',completed:true}}};assert.deepEqual(policy.pool(onlySlope,all),[]);
 const partial=R.start(R.initial(),'positive');assert(!policy.pool(partial,all).includes('positive'));
 const before=JSON.stringify(all);policy.pool(all,hills);assert.equal(JSON.stringify(all),before);
});
test('online input advances without checking a wrong intermediate answer',()=>{
 let s=Game.generate({skill:'delta',seed:17,variant:2});s=R.edit(s,'dxChoice','invalid');const before=JSON.stringify(s);const next=Game.nextInput(s);assert.equal(R.active(next).phase,'hill-dy');assert.equal(R.active(next).feedback,null);assert.deepEqual(next.events,[]);assert.equal(JSON.stringify(s),before);
});
test('inequality second step retains own hypothesis and never reveals the correct root',()=>{
 for(const skill of ['positive','negative'])for(let variant=0;variant<4;variant++){
  let s=Game.generate({skill,seed:17,variant});let m=R.active(s);m.blindBattle=true;const wrong=m.task.options.findIndex(q=>!W.eq(q,m.task.root));s=R.edit(s,'answer',String(wrong));s=Game.nextInput(s);m=R.active(s);const html=V.render(m,'');
  assert(!html.includes('class="grens-root-label"'));assert(!html.includes('grens-step is-done'));assert(html.includes('<strong class="grens-retained">x = '+W.html(m.task.options[wrong])+'</strong>'));
 }
});
test('worker bundle agrees with native validators for every battle skill and seed',async()=>{
 const bundled=(await import('../supabase/functions/rechten-duo/policy.js')).default;
 assert.deepEqual(bundled.pool(completed(['hellingrug']),completed(['hellingrug'])),policy.pool(completed(['hellingrug']),completed(['hellingrug'])));
 for(const {id:skill} of Game.skills)for(let variant=0;variant<4;variant++)for(const seed of [0,17,891234]){
  const spec={skill,seed,variant};assert.equal(bundled.grade(spec,{correct:true}),false);
  const state=Game.generate(spec),m=R.active(state);const candidate={steps:[{phase:m.phase,values:skill==='slope'?{rateChoice:String(m.task.options.a.findIndex(a=>W.eq(a,m.task.model.a)))}:{}}]};
  assert.equal(bundled.grade(spec,candidate),policy.grade(spec,candidate));
 }
});
test('Edge worker authenticates before RPC and never trusts a supplied user identity or correctness',async()=>{
 const {createHandler}=await import('../supabase/functions/rechten-duo/handler.js');const calls=[];
 const handler=createHandler({url:'https://test.invalid',anonKey:'anon-test',serviceKey:'service-test',policy,fetcher:async(url,opts)=>{
  calls.push({url,opts});if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify(opts.headers.Authorization==='Bearer valid'?{id:'verified-user'}:{}),{status:opts.headers.Authorization==='Bearer valid'?200:401});
  const args=JSON.parse(opts.body);
  if(url.endsWith('_worker')){assert.equal(args.p_data.user_id,'verified-user');assert.equal(opts.headers.Authorization,'Bearer service-test');return new Response(JSON.stringify(args.p_action==='work'?{phase:'resolve',round:1,task:{skill:'slope',seed:17,variant:0},a:{correct:true},b:null}:{}));}
  return new Response(JSON.stringify({id:'match',phase:calls.length===2?'resolving':'round_result'}));
 }});
 const req=(token,body)=>new Request('https://test.invalid',{method:'POST',headers:{Authorization:token},body:JSON.stringify(body)});
 assert.equal((await handler(req('',{}))).status,401);assert.equal(calls.length,0);assert.equal((await handler(req('Bearer invalid',{}))).status,401);assert.equal(calls.length,1);calls.length=0;
 const r=await handler(req('Bearer valid',{action:'submit',data:{user_id:'forged-user',correct:true}}));assert.equal(r.status,200);
 const resolve=calls.find(c=>c.opts.body&&JSON.parse(c.opts.body).p_action==='resolve');const data=JSON.parse(resolve.opts.body).p_data;assert.equal(data.a,false);assert.equal(data.b,false);assert.equal(data.user_id,'verified-user');
 assert(!JSON.stringify(await r.json()).includes('service-test'));
});
