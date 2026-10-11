const Logic=require('../../games/logicawereld/logic.js');
async function click(f,action,data={}){let selector=`[data-action="${action}"]`;for(const [key,value]of Object.entries(data))selector+=`[data-${key}="${value}"]`;await f.locator(selector).first().click();}
function correctAnswer(t){if(t.type==='choice'||t.type==='multi')return t.correct;if(t.type==='predict')return Logic.value(t.expr,t.env);if(t.type==='table')return Logic.cases(t.vars||Logic.variables(t.columns.map(c=>c.expr).join(''))).map(e=>t.columns.map(c=>Logic.value(c.expr,e)));if(t.type==='difference')return Logic.cases([...new Set([...Logic.variables(t.expr),...Logic.variables(t.other)])]).find(e=>Logic.validate(t,e).correct);if(t.type==='counter')return t.domain.find(n=>Logic.validate(t,n).correct);if(t.type==='classify')return Logic.classify(t.expr);if(t.type==='puzzle')return t.candidates.find(c=>Logic.validate(t,c.id).correct).id;
 if(t.type==='build'){for(const left of ['p','q'])for(const right of ['p','q'])for(const op of ['∧','∨','⇒','⇔'])for(const leftNot of [false,true])for(const rightNot of [false,true])for(const outerNot of [false,true]){const a={left,right,op,leftNot,rightNot,outerNot};if(Logic.validate(t,a).correct)return a;}}
 if(t.type==='circuit'){for(const a of ['PASS','NOT'])for(const b of ['PASS','NOT'])for(const c of t.allowDerived?['AND','OR','NAND','NOR']:['AND','OR']){const g=[a,b,c];if(Logic.validate(t,g).correct)return g;}}
 throw Error(t.id);
}
async function fill(app,t,a=correctAnswer(t)){
 if(['choice','puzzle'].includes(t.type))await click(app,'choice',{id:a});
 else if(t.type==='multi')for(const id of a)await click(app,'choice',{id});
 else if(t.type==='predict')await click(app,'truth',{value:String(a)});
 else if(t.type==='classify')await click(app,'classify',{id:a});
 else if(t.type==='counter')await click(app,'number',{value:String(a)});
 else if(t.type==='difference'){for(const [v,b] of Object.entries(a))if(b)await click(app,'env',{id:v});}
 else if(t.type==='circuit')for(let i=0;i<3;i++)await click(app,'gate',{index:String(i),id:a[i]});
 else if(t.type==='build'){for(const key of ['left','right'])if(a[key]!=={left:'p',right:'q'}[key])await click(app,'build-var',{key});for(const key of ['leftNot','rightNot','outerNot'])if(a[key])await click(app,'build-not',{key});await click(app,'build-op',{id:a.op});}
 else if(t.type==='table'){for(let r=0;r<a.length;r++){if(r===4)await click(app,'table-page',{id:'1'});for(let c=0;c<a[r].length;c++){await click(app,'cell',{row:String(r),col:String(c)});if(!a[r][c])await click(app,'cell',{row:String(r),col:String(c)});}}}
}
module.exports={correctAnswer,fill,click};
