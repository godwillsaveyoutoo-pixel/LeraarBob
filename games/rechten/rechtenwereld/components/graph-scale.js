/* Equal units on both axes; fit the given data, never a learner's draft. */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.RechtenV2GraphScale=factory()})(globalThis,function(){
'use strict';
const num=q=>typeof q==='number'?q:q.n/q.d;
function fit(values,{step=1,fixed=false,labelEvery=1}={}){
 const extent=Math.max(0,...values.map(num).filter(Number.isFinite).map(Math.abs));
 const radius=fixed?5:Math.min(5,Math.max(2,Math.ceil(extent+1)));
 const unit=200/radius,X=q=>250+unit*num(q),Y=q=>250-unit*num(q);
 let grid='';for(let i=-radius/step;i<=radius/step;i++){const q=i*step,n=X(q),half=!Number.isInteger(q);grid+=`<path class="${half?'half-grid':''}" d="M${n} 50V450M50 ${Y(q)}H450"/>`;if(q&&!half&&(q%labelEvery===0||Math.abs(q)===radius))grid+=`<text x="${n}" y="274" text-anchor="middle">${q}</text><text x="233" y="${Y(q)+7}" text-anchor="end">${q}</text>`}
 if(step===.5)for(let i=-radius+.5;i<radius;i++)grid+=`<path class="half-tick" d="M${X(i)} 246V254M246 ${Y(i)}H254"/>`;
 return {radius,unit,step,X,Y,grid,attributes:`data-axis-radius="${radius}" data-axis-unit="${unit}" data-axis-step="${step}"`};
}
function points(points,options){return fit(Object.values(points).flatMap(p=>[p.x,p.y]),options)}
function line(model,options){const a=num(model.a),b=num(model.b),run=model.a.d||1;return fit([b,run,a*run+b,...(a?[Math.max(-5,Math.min(5,-b/a))]:[])],options)}
return Object.freeze({fit,points,line});
});
