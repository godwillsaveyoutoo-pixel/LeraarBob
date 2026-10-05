const assert=require('node:assert/strict'),C=require('../games/algebra-trainer/core.js'),L=require('../games/algebra-trainer/learning-core.js');
async function put(page,name,text){
 const blocks=C.topTerms(L.parseExpression(text));await page.locator('[data-edit-field="'+name+'"]').click();await page.locator('[data-edit-action=clear]').click();
 for(const [i,block] of blocks.entries()){if(i)await page.locator('[data-term-sign="+"]').click();const key=C.exprSig(block),tiles=page.locator('#production [data-term]'),keys=await tiles.evaluateAll(es=>es.map(e=>e.dataset.term));const index=keys.indexOf(key);assert.ok(index>=0,'Contextual term missing: '+key);await tiles.nth(index).click();}await page.clock.runFor(30);
}
async function equation(page,text){const [left,right]=text.split('=');await put(page,'lhs',left);await put(page,'rhs',right);}
async function wrongEquation(page){
 await page.locator('[data-edit-field=lhs]').click();await page.locator('[data-edit-action=clear]').click();
 const index=await page.evaluate(()=>{const s=AlgebraTrainer.snapshot(),t=s.learningRun.tasks[s.trainerIndex];return AlgebraTouch.palette(t).findIndex(v=>!AlgebraLearning.sameExpr(v.expr,t.expected.l));});assert.ok(index>=0);await page.locator('#production [data-term]').nth(index).click();
 const rhs=await page.evaluate(()=>{const s=AlgebraTrainer.snapshot();return AlgebraTouch.expressionText(s.learningRun.tasks[s.trainerIndex].expected.r);});await put(page,'rhs',rhs);
}
async function verify(page){
 if(await page.locator('#substituteBtn').isVisible())await page.locator('#substituteBtn').click();
 while(await page.evaluate(()=>[1,2].includes(AlgebraTrainer.snapshot().learningRun.results[AlgebraTrainer.snapshot().trainerIndex].verifyPhase))){
  const i=await page.evaluate(()=>{const s=AlgebraTrainer.snapshot(),t=s.learningRun.tasks[s.trainerIndex],r=s.learningRun.results[s.trainerIndex],side=r.verifyPhase===1?'left':'right',target=AlgebraLearning.evaluate(t.ex.start[side==='left'?'l':'r'],t.proposed);return AlgebraTouch.valueChoices(t,side).findIndex(v=>v.expr.q.eq(target));});assert.ok(i>=0);await page.locator('[data-proof-value="'+i+'"]').click();
 }
 const equal=await page.evaluate(()=>{const s=AlgebraTrainer.snapshot(),t=s.learningRun.tasks[s.trainerIndex];return AlgebraLearning.evaluate(t.ex.start.l,t.proposed).eq(AlgebraLearning.evaluate(t.ex.start.r,t.proposed));});await page.locator('[data-answer="'+(equal?'yes':'no')+'"]').click();
}
async function submit(page){if(await page.locator('#nextBox').isVisible())return;if(await page.locator('#checkBtn').isVisible())await page.locator('#checkBtn').click();else await page.locator('#production button[type=submit]').click();}
module.exports={put,equation,wrongEquation,verify,submit};
