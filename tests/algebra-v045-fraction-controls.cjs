const assert=require('node:assert/strict'),F=require('../games/algebra-trainer/fraction-core.js');
async function fractionState(page){return page.evaluate(()=>{const s=AlgebraTrainer.snapshot();return s.learningRun.results[s.trainerIndex].fraction;});}
async function fill(page){
 for(const side of ['lhs','rhs']){
  await page.locator('[data-fraction-field="'+side+'"]').click();await page.locator('[data-fraction-clear]').click();
  const target=(await fractionState(page)).build.target[side];
  for(let i=0;i<target.length;i++){if(i)await page.locator('[data-fraction-sign="+"]').click();await page.locator('[data-fraction-term="'+F.key(target[i])+'"]').click();}
 }
}
async function solve(page,route='clear',multiple=1){
 for(let i=0;i<20;i++){
  const s=await fractionState(page);
  if(s.phase==='done')return;
  if(s.phase==='route')await page.locator('[data-fraction-route="'+(s.steps.length?'clear':route)+'"]').click();
  else if(s.phase==='number'){const d=F.common(s.current)*(s.steps.length?1:multiple);await page.locator('[data-fraction-number="'+d+'"]').click();}
  else if(s.phase==='build'){await fill(page);await page.locator('#checkBtn').click();}
  else if(s.phase==='operation')await page.locator('[data-fraction-operation="0"]').click();
 }
 assert.fail('Fraction workflow failed to finish');
}
module.exports={fractionState,fill,solve};
