/* Exact Signaalstad function evaluation and table completion. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../core/wave-core.js'),require('./semantic-math-core.js'));else root.RechtenV2Values=factory(root.RechtenWave,root.RechtenV2Math)})(globalThis,function(W,M){
'use strict';
const skills=['fx','table'],count=6,firstPhase=skill=>skill==='fx'?'fx-calculate':'table-fill';
const output=(t,x)=>W.add(W.mul(t.model.a,x),t.model.b);
function makeTask(skill,index=0,run=1){
 if(!skills.includes(skill))throw Error('Onbekende functiewaardevaardigheid');
 const [a,b,x]=[[2,1,3],[-1,3,-2],[3,-2,0],[.5,-1,-3],[-.5,0,3],[0,-2,-4]][index%count];
 const model={kind:'affine',a:W.fromNumber(a),b:W.q(b+[0,1,-1][(run-1)%3])};
 const inputs=[[-2,-1,0,1,2],[-3,-1,0,2,4],[-2,-1,0,3,5],[-3,-1,0,2,4],[-4,-2,0,1,3],[-3,-1,0,2,5]][index%count].map(W.fromNumber);
 const task={id:`rechten-v2:signaalstad:${skill}:${run}:${index}`,world:'signaalstad',skill_id:skill,family_id:'F4',index,count,model,x:W.q(x),inputs,givenColumn:2,mode:index===0?'discover':'practice',variant:!a?'constant':Math.abs(a)<1?(a<0?'negative-fraction':'positive-fraction'):a<0?'negative':'positive',given_representations:skill==='fx'?['formula','input']:['formula','table'],hints:skill==='fx'?[
  'Vervang x door de gegeven invoer. Bereken eerst het product en daarna de functiewaarde.',
  'f(x) is de uitvoer van de functie bij invoer x. Het betekent niet f maal x.',
  'Vermenigvuldig eerst de coëfficiënt van x met de invoer. Verwerk daarna de constante term.',
  'Let op de tekens: min maal min wordt plus. Een breuk of decimaal mag ook.',
  'Ander voorbeeld: f(x) = 2x − 1. Bij x = 4 is het product 8 en f(4) = 7. Probeer een nieuw geval.'
 ]:[
  'Gebruik het voorschrift voor elke lege cel. Elke kolom heeft haar eigen x-waarde.',
  'Lees x in de bovenste rij. De onderste rij bevat de bijbehorende functiewaarde f(x).',
  'Vermenigvuldig elke x met de coëfficiënt en verwerk daarna de constante term.',
  'Niet alle x-waarden staan één stap uit elkaar. Bereken elke cel met het voorschrift.',
  'Ander voorbeeld: bij f(x) = 2x + 1 horen x = −1, 0 en 3 bij f(x) = −1, 1 en 7. Probeer een nieuw geval.'
 ]};
 return task;
}
const fields=t=>t.skill_id==='fx'?['product','answer']:t.inputs.map((_,i)=>'cell'+i).filter((_,i)=>i!==t.givenColumn);
const expected=(t,name)=>name==='product'?W.mul(t.model.a,t.x):name==='answer'?output(t,t.x):output(t,t.inputs[Number(name.slice(4))]);
function check(t,v,phase){
 if(phase!==firstPhase(t.skill_id))return {ok:false,kind:'interaction_error',code:'input.phase',message:'Deze stap is niet beschikbaar.',keep:{}};
 const names=fields(t),parsed=Object.fromEntries(names.map(name=>[name,M.parse(v[name])])),keep=Object.fromEntries(names.map(name=>[name,!!parsed[name]&&W.eq(parsed[name],expected(t,name))]));
 if(names.some(name=>!parsed[name]))return {ok:false,kind:'interaction_error',code:'input.missing',message:t.skill_id==='fx'?'Vul het product en de functiewaarde in. Een breuk of decimaal mag ook.':'Vul elke lege tabelcel in. Een breuk of decimaal mag ook.',keep};
 const wrong=names.find(name=>!keep[name]);let message,code=null;
 if(!wrong)message=t.skill_id==='fx'?`Juist: f(${W.text(t.x)}) = ${W.text(output(t,t.x))}.`:'Juist: alle ingevulde functiewaarden passen bij het voorschrift.';
 else if(t.skill_id==='fx'){
  code=wrong==='product'?'fx.product':'fx.output';
  message=wrong==='product'?`Controleer het product: ${W.text(t.model.a)} maal (${W.text(t.x)}). Let op de tekens.`:`Het product klopt. Verwerk nu de constante term ${W.text(t.model.b)} om f(${W.text(t.x)}) te vinden.`;
 }else{
  const x=t.inputs[Number(wrong.slice(4))];code='table.output';
  message=`Controleer de cel bij x = ${W.text(x)}. Gebruik het voorschrift voor juist deze x-waarde. Correcte cellen blijven staan.`;
 }
 return {ok:!wrong,kind:wrong?'hypothesis':'correct',code,message,keep};
}
function selected(m){const names=fields(m.task),name=m.values.valueField;return names.includes(name)&&!m.locks[name]?name:names.find(name=>!m.locks[name])||null}
function enter(m,key){
 if(m.feedback||m.completed)return null;const name=selected(m);if(!name)return null;
 let value=String(m.values[name]??'');
 if(key==='clear')value='';else if(key==='back')value=value.slice(0,-1);else if(key==='minus')value=value.startsWith('-')||value.startsWith('−')?value.slice(1):'-'+value;else if(/^[0-9]$/.test(key)||key==='/'||key===',')value+=key;else return null;
 return value.length<=16?{name,value}:null;
}
return Object.freeze({skills,count,firstPhase,makeTask,fields,output,expected,check,selected,enter});
});
