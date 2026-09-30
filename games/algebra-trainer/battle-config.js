(function(root,factory){if(typeof module==='object')module.exports=factory(require('./core.js'));else root.BattleGame=factory(root.AlgebraCore)})(globalThis,C=>{
 const skills=C.TYPES.map(t=>({id:t.id,label:t.label,level:t.level,description:t.desc}));
 const worlds=Object.entries(C.LEVEL_META).map(([id,m])=>({id,name:m.label,skills:skills.filter(s=>s.level===id).map(s=>s.id)}));
 function generate(s){if(!skills.some(t=>t.id===s.skill)||!Number.isInteger(s.seed)||s.seed<0||s.seed>4294967295||!Number.isInteger(s.variant)||s.variant<0||s.variant>3)throw Error('Ongeldige algebra-opgave');return C.generateSeeded(s.skill,{allowFractions:s.fractions===true,allowDecimals:s.decimals===true,allowNegative:s.negative===true},s.variant,s.seed);}
 function parse(value){if(typeof value!=='string'||value.length>40)return null;const s=value.trim().replace('−','-').replace(',','.');if(!/^[+-]?\d+(?:\.\d{1,6})?(?:\s*\/\s*[+-]?\d+(?:\.\d{1,6})?)?$/.test(s))return null;const decimal=x=>{const [a,b='']=x.trim().split('.');return new C.Rat(Number(a+b),10**b.length);};try{const [n,d]=s.split('/');return d===undefined?decimal(n):decimal(n).div(decimal(d));}catch{return null;}}
 function validate(task,answer){const q=parse(answer?.value);return {ok:!!q&&q.eq(task.solution)};}
 return Object.freeze({id:'algebra',title:'Algebra Trainer',rpc:'axioma_game_class',classFunction:'algebra-class',classReview:true,multiSelect:true,playerURL:'battle-player.html',skills,worlds,mixedSkills:skills.map(s=>s.id),generate,parse,validate});
});
