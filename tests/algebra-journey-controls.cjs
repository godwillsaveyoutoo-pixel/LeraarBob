'use strict';
const assert=require('node:assert/strict'),C=require('../games/algebra-trainer/core.js'),L=require('../games/algebra-trainer/learning-core.js'),Touch=require('./algebra-v04-touch-controls.cjs');
const expression=e=>e.t==='num'?e.q.n+'/'+e.q.d:e.t==='var'?'x':e.t==='add'?'('+e.terms.map(expression).join('+')+')':e.t==='mul'?'('+e.factors.map(expression).join('*')+')':'('+expression(e.n)+')/('+expression(e.d)+')';
const eq=e=>expression(e.l)+'='+expression(e.r),val=q=>q.n+'/'+q.d;
const revive=s=>JSON.parse(JSON.stringify(s),(k,v)=>v&&typeof v==='object'&&Object.keys(v).length===2&&Number.isSafeInteger(v.n)&&Number.isSafeInteger(v.d)?new C.Rat(v.n,v.d):v);
async function solveTask(page){
 let snap=revive(await page.evaluate(()=>AlgebraTrainer.snapshot())),t=snap.learningRun.tasks[snap.trainerIndex];
 if(t.kind==='fractions'){await require('./algebra-v045-fraction-controls.cjs').solve(page);}else if(t.kind==='solve'){
  for(const step of t.ex.steps){
   if(await page.locator('#nextBox').isVisible())break;
   const label=(step.op==='*'?'·':step.op==='/'?'÷':step.op==='-'?'−':'+')+' '+C.fallbackText(C.latexExpr(step.operand,t.ex.policy))+' op beide leden';
   const direct=page.locator('.contextOp').filter({hasText:'__never__'}); // Manual choices also test operand pagination.
   if(!await page.locator('#manualOperations').isVisible())await page.locator('#moreOperationsBtn').click();
   await page.locator('.opBtn[data-op="'+step.op+'"]').click();
   for(let p=0;p<12;p++){
    const choice=page.locator('#valueGrid button[aria-label="'+label.replace(/"/g,'\\"')+'"]');
    if(await choice.count()){await choice.click();await page.clock.runFor(5000);break;}
    assert.equal(await page.locator('#nextValuesBtn').isEnabled(),true,'Canonical operand missing: '+label);await page.locator('#nextValuesBtn').click();
   }
  }
 }else if(['predict','repair','expand'].includes(t.kind)){
  if(t.kind==='repair')await page.locator('[data-location="'+t.location+'"]').click();
  await Touch.equation(page,eq(t.expected));await Touch.submit(page);
 }else if(t.kind==='build'){
  await Touch.put(page,'input',val(t.expectedNumber));await Touch.submit(page);
 }else if(t.kind==='verify'){
  await Touch.verify(page);
 }else if(t.kind==='routes'){
  const i=t.routes.findIndex((s,i)=>L.validate(t,{choice:String(i)}).ok);assert.ok(i>=0);await page.locator('[data-route="'+i+'"]').click();await page.locator('#production button[type=submit]').click();
 }
 assert.equal(await page.locator('#nextBox').isVisible(),true,t.kind+' should be complete');
}
module.exports={solveTask};
