'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const V=require('../games/rechten/rechtenwereld/values-core.js'),K=require('../games/rechten/rechtenwereld/checks-core.js'),View=require('../games/rechten/rechtenwereld/components/values-view.js'),R=require('../games/rechten/rechtenwereld/mission-runtime.js');
test('fraction display preserves the entered numerator and denominator, including unfinished and unreduced answers',()=>{
 assert.equal(View.fractionDisplay('3'), '');
 const raw=View.fractionDisplay('-6/4');assert(raw.includes('value-fraction-sign'));assert.match(raw,/data-fraction-part="numerator"[^>]*>6<\/span>/);assert.match(raw,/data-fraction-part="denominator"[^>]*>4<\/span>/);
 for(const value of ['1/','/2','-/','2/-3','0/5'])assert(View.fractionDisplay(value).includes('value-entered-fraction'));
 assert(View.fractionDisplay('1/').includes('value-fraction-placeholder'));assert(View.fractionDisplay('<img>/2').includes('&lt;img&gt;'));
 assert(View.fractionDisplay('-6/4',0,0).includes('value-math-caret'));assert(View.fractionDisplay('-6/4',1,2).includes('value-math-selection'));
 const m=R.active(R.edit(R.start(R.initial(),'table'),'cell0','-6/4')),html=View.input(m,'cell0','Functiewaarde');assert(html.includes('value="-6/4"'));assert(html.includes('aria-hidden="true"'));assert(html.includes('has-fraction'));
});
test('numberpad edits the selected numerator or denominator and respects the caret, without calculating or normalizing the value',()=>{
 assert.deepEqual(V.editText('-6/4','3',{start:1,end:2}),{value:'-3/4',caret:2});
 assert.deepEqual(V.editText('-6/4','2',{start:3,end:4}),{value:'-6/2',caret:4});
 assert.deepEqual(V.editText('-6/4','back',{start:2,end:2}),{value:'-/4',caret:1});
 assert.deepEqual(V.editText('1/','2',{start:2,end:2}),{value:'1/2',caret:3});
 assert.deepEqual(V.editText('-6/4','7',{start:0,end:4}),{value:'7',caret:1});
 assert.deepEqual(V.editText('-6/4','minus',{start:4,end:4}),{value:'6/4',caret:3});
 assert.deepEqual(V.editText('-6/4','clear',{start:1,end:2}),{value:'',caret:0});assert.equal(V.editText('1'.repeat(16),'2'),null);assert.equal(V.editText('1/2','='),null);
 for(const [core,skill,name]of [[V,'table','cell0'],[K,'input_from_output','givenOutput']]){
  const m=R.active(R.edit(R.start(R.initial(),skill),name,'-6/4'));assert.deepEqual(core.enter(m,'3',{start:1,end:2}),{name,value:'-3/4',caret:2});m.locks[name]=true;assert.notEqual(core.enter(m,'3')?.name,name);m.feedback={};assert.equal(core.enter(m,'3'),null);
 }
});
