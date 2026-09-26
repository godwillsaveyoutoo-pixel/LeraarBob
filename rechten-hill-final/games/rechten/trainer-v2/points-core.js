/* Coordinate tasks adapt the existing exact point validator; no mastery or storage writes. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../trainer/wave-core.js'));else root.RechtenV2Points=factory(root.RechtenWave)})(globalThis,function(W){
'use strict';
const skills=['point','point_plot'],count=6;
const pair=p=>`(${W.text(p.x)}, ${W.text(p.y)})`;
function options(target,seed){
 const x=W.num(target.x),y=W.num(target.y),pairs=[[x,y],[y,x],[-x,y],[x,-y],[-x,-y],[x===5?x-1:x+1,y],[x,y===5?y-1:y+1],[1,1],[-1,1]];
 const unique=[];for(const [a,b] of pairs)if(!unique.some(p=>W.eq(p.x,a)&&W.eq(p.y,b)))unique.push({x:W.q(a),y:W.q(b)});
 const result=unique.slice(0,4);for(let i=3;i>0;i--){seed=(seed*1664525+1013904223)>>>0;const j=seed%(i+1);[result[i],result[j]]=[result[j],result[i]]}return result;
}
function makeTask(skill,index=0,run=1){
 if(!skills.includes(skill))throw Error('Onbekende puntenvaardigheid');
 // First run: positive, three signed quadrants, an axis, then the origin.
 const seed=index===0?(skill==='point'?0:1)+run-1:0;
 const variant=index===0?0:([0,1,2,4,6][(index-1)%5]+(run-1)*3)%8;
 const params=W.generate('point_plot',{difficulty:index===0?0:1,variant,seed});
 const t={id:`rechten-v2:puntenbaai:${skill}:${run}:${index}`,world:'puntenbaai',skill_id:skill,family_id:'F1',mode:index===0?'discover':'practice',variant:params.variant,index,target:params.target,bounds:{xMin:-5,xMax:5,yMin:-5,yMax:5},legacy:{skill:'point_plot',params},given_representations:skill==='point'?['graph']:['coordinates'],options:options(params.target,run*17+index*11),hints:[
 'Lees eerst x op de horizontale as, daarna y op de verticale as.',
 'Positieve x ligt rechts van 0; negatieve x ligt links.',
 'Positieve y ligt boven 0; negatieve y ligt onder 0. Op een as is één coördinaat 0.',
 'Ander voorbeeld: (−2, 3) ligt twee stappen links en drie stappen omhoog vanaf de oorsprong.',
 'Voorbeeld: bij (−2, 3) is x = −2 en y = 3. De volgorde is altijd (x, y). Probeer een nieuw punt.'
 ]};return t;
}
function check(t,values){
 const read=t.skill_id==='point';let response=read&&/^\d$/.test(String(values.answer??''))?t.options[Number(values.answer)]:!read?values.point:null;
 const valid=response&&['x','y'].every(k=>{try{return Number.isInteger(W.num(response[k]))&&Math.abs(W.num(response[k]))<=5}catch{return false}});
 if(!valid)return {ok:false,kind:'interaction_error',code:'point.missing',message:read?'Kies eerst een antwoord.':'Plaats eerst een punt op het rooster.',keep:{}};
 const result=W.constructionCheck(t.legacy,response);
 return {...result,kind:result.ok?'correct':'hypothesis',keep:{},message:result.ok?`Juist! Eerst x, daarna y: ${pair(t.target)}.`:read?result.message.replace('Verplaats alleen y.','Lees y opnieuw.').replace('Verplaats alleen x.','Lees x opnieuw.'):result.message};
}
return Object.freeze({skills,count,makeTask,check,pair});
});
