(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Logic=factory();})(typeof globalThis==='object'?globalThis:this,()=>{
'use strict';
const glyph={not:'¬',and:'∧',or:'∨',imp:'⇒',iff:'⇔'};
function parse(input){
 const tokens=String(input).replace(/\s/g,'').match(/[pqrst01()¬∧∨⇒⇔]/g)||[];
 if(tokens.join('')!==String(input).replace(/\s/g,''))throw Error('Onbekend symbool');
 let i=0;
 const atom=()=>{const t=tokens[i++];if(t==='¬')return ['not',atom()];if(t==='('){const a=iff();if(tokens[i++]!==')')throw Error('Haakje ontbreekt');return a;}if(/[pqrst01]/.test(t||'')&&t?.length===1)return t;throw Error('Uitspraak ontbreekt');};
 const binary=(next,token,op)=>()=>{let a=next();while(tokens[i]===token){i++;a=[op,a,next()];}return a;};
 const and=binary(atom,'∧','and'),or=binary(and,'∨','or');
 const imp=()=>{const a=or();if(tokens[i]==='⇒'){i++;return ['imp',a,imp()];}return a;};
 const iff=binary(imp,'⇔','iff');const tree=iff();if(i!==tokens.length)throw Error('Extra symbolen');return tree;
}
function evaluate(tree,env){if(typeof tree==='string'){if(tree==='0')return false;if(tree==='1')return true;if(typeof env[tree]!=='boolean')throw Error('Waarheidswaarde ontbreekt: '+tree);return env[tree];}const [op,a,b]=tree,x=evaluate(a,env);if(op==='not')return !x;const y=evaluate(b,env);return op==='and'?x&&y:op==='or'?x||y:op==='imp'?!x||y:x===y;}
const value=(expression,env)=>evaluate(typeof expression==='string'?parse(expression):expression,env);
const variables=expression=>[...new Set(String(expression).match(/[pqrst]/g)||[])].sort();
function cases(vars=['p','q']){return Array.from({length:2**vars.length},(_,i)=>Object.fromEntries(vars.map((v,j)=>[v,!(i&(1<<(vars.length-1-j)))])));}
function equivalent(a,b){return cases([...new Set([...variables(a),...variables(b)])].sort()).every(e=>value(a,e)===value(b,e));}
function classify(expr){const v=cases(variables(expr)).map(e=>value(expr,e));return v.every(Boolean)?'altijd':v.every(x=>!x)?'nooit':'soms';}
function formatBuild(answer){const a=(answer.leftNot?'¬':'')+(answer.left||'p'),b=(answer.rightNot?'¬':'')+(answer.right||'q');const expr='('+a+(answer.op||'∧')+b+')';return answer.outerNot?'¬'+expr:expr;}
function gateExpression(gates){const a=gates[0]==='NOT'?'¬p':'p',b=gates[1]==='NOT'?'¬q':'q';const op=gates[2]||'AND';let x='('+a+(op==='OR'||op==='NOR'?'∨':'∧')+b+')';if(op==='NAND'||op==='NOR')x='¬'+x;return x;}
function validate(task,answer){
 const bad=(message,category='structure',detail={})=>({correct:false,message,category,...detail});const ok=()=>({correct:true,message:task.explanation});
 if(task.type==='choice'||task.type==='multi'){const selected=task.type==='multi'?answer:Array.isArray(answer)?answer[0]:answer;if(task.type==='multi'){if(!Array.isArray(selected))return bad('Kies alle passende antwoorden.');const got=[...new Set(selected)].sort().join('|'),want=[...task.correct].sort().join('|');return got===want?ok():bad(task.feedback||'Controleer elk gekozen antwoord afzonderlijk.',task.category||'meaning');}return selected===task.correct?ok():bad(task.feedback||'Bekijk opnieuw wat de uitspraak precies zegt.',task.category||'meaning');}
 if(task.type==='predict'){const expected=value(task.expr,task.env);return answer===expected?ok():bad(task.feedback||'Bereken eerst het deel binnen de haakjes.',task.category||'operator');}
 if(task.type==='build'||task.type==='circuit'){if(task.requireInnerNegation&&answer.outerNot)return bad('Gebruik voor dit herstel NIET bij de delen, zonder NIET rond het geheel.','negation-scope');if(task.requiredForm==='contraposition'&&!(answer.left==='q'&&answer.right==='p'&&answer.leftNot&&answer.rightNot&&answer.op==='⇒'&&!answer.outerNot))return bad('Voor de contrapositie verwissel je de delen en ontken je ze allebei.','contraposition');const expr=task.type==='build'?formatBuild(answer):gateExpression(answer);const all=cases([...new Set([...variables(task.expr),...variables(expr)])].sort()),e=all.find(env=>value(expr,env)!==value(task.expr,env));return e?bad('Bij '+Object.entries(e).map(([v,b])=>v+' = '+(b?'W':'V')).join(', ')+' werkt jouw regel anders dan gevraagd.','rule-structure',{env:e,actual:expr}):ok();}
 if(task.type==='table'){const envs=cases(task.vars||variables(task.columns.map(c=>c.expr).join('')));for(let r=0;r<envs.length;r++)for(let c=0;c<task.columns.length;c++){if(answer?.[r]?.[c]!==value(task.columns[c].expr,envs[r]))return bad('Controleer rij '+(r+1)+', kolom '+task.columns[c].label+'. Begin bij de kleinste deeluitspraak.','table-step',{row:r,column:c});}return ok();}
 if(task.type==='difference'){return value(task.expr,answer)!==value(task.other,answer)?ok():bad('In dit geval geven beide regels hetzelfde resultaat. Zoek een ander geval.','single-case');}
 if(task.type==='counter'){if(!task.domain.includes(answer))return bad('Kies een getal uit het opgegeven domein.','domain');if(!value(task.condition,task.environments[answer]))return bad('Dit getal voldoet niet aan de voorwaarde. Een tegenvoorbeeld moet die wel respecteren.','premise');if(value(task.conclusion,task.environments[answer]))return bad('Bij dit getal klopt het gevolg nog. Zoek een geval waarin het gevolg faalt.','conclusion');return ok();}
 if(task.type==='classify'){return answer===classify(task.expr)?ok():bad(task.feedback||'Altijd en nooit gelden voor álle waarheidstoekenningen.','classification');}
 if(task.type==='puzzle'){const selected=task.candidates.find(c=>c.id===answer);if(!selected)return bad('Kies één kandidaat.');const truths=task.rules.map(rule=>value(rule,selected.env));return truths.filter(Boolean).length===task.trueCount?ok():bad('Deze kandidaat geeft '+truths.filter(Boolean).length+' ware uitspraken; er moeten er '+task.trueCount+' zijn.','constraint',{truths});}
 throw Error('Onbekend vraagtype '+task.type);
}
function newRecord(task,player='solo'){return {taskId:task.id,skill:task.skill,player,attempts:0,wrongAttempts:0,hints:0,firstAnswer:null,firstCorrect:false,eventuallyCorrect:false,categories:[],transfer:!!task.transfer};}
function attempt(record,answer,result){if(record.eventuallyCorrect)return record;const r=JSON.parse(JSON.stringify(record));r.attempts++;if(r.attempts===1){r.firstAnswer=JSON.parse(JSON.stringify(answer));r.firstCorrect=result.correct&&r.hints===0;}if(result.correct)r.eventuallyCorrect=true;else{r.wrongAttempts++;if(result.category)r.categories.push(result.category);}return r;}
function stats(records){return {total:records.length,firstCorrect:records.filter(r=>r.firstCorrect).length,eventuallyCorrect:records.filter(r=>r.eventuallyCorrect).length,wrongAttempts:records.reduce((n,r)=>n+r.wrongAttempts,0),hints:records.reduce((n,r)=>n+r.hints,0)};}
function mastered(records){const good=records.filter(r=>r.firstCorrect&&r.hints===0);return new Set(good.map(r=>r.taskId)).size>=3&&good.some(r=>r.transfer);}
function sanitizeProgress(raw,taskIds=[]){const allowed=new Set(taskIds),records=Array.isArray(raw?.records)?raw.records.filter(r=>allowed.has(r?.taskId)&&r.player==='solo'&&Number.isInteger(r.attempts)&&r.attempts>=0&&typeof r.eventuallyCorrect==='boolean').slice(-1500):[];return {version:1,records,lastStop:Number.isInteger(raw?.lastStop)&&raw.lastStop>=0&&raw.lastStop<18?raw.lastStop:0,reducedMotion:raw?.reducedMotion===true};}
return {parse,evaluate,value,variables,cases,equivalent,classify,formatBuild,gateExpression,validate,newRecord,attempt,stats,mastered,sanitizeProgress,glyph};
});
