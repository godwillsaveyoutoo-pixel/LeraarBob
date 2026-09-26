/* Pilot presentation adapter. The production exact engine remains unchanged. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../trainer/wave-core.js'));else root.RechtenV2Math=factory(root.RechtenWave)})(globalThis,function(W){
'use strict';
if(!W)throw Error('RechtenWave is vereist.');
const {q,add,sub,mul,div,eq,num,text}=W;
const worlds=['grenspas','hellingrug','signaalstad'];
const modes=['discover','practice','evidence','fluency'];
const at=(m,x)=>add(mul(m.a,x),m.b);
const integer=(value,fallback)=>Number.isSafeInteger(value)?value:fallback;
const mod=(n,d)=>((n%d)+d)%d;
function parse(value){if(typeof value!=='string'||value.length>64)return null;const parsed=W.parse(value.trim());return parsed&&Math.abs(parsed.n)<=1000000&&parsed.d<=1000000?parsed:null;}
function result(ok,code,message,extra={}){return {ok,kind:ok?'correct':'hypothesis',code:ok?null:code,message,keep:{},probes:[],...extra};}
function syntax(message='Gebruik een getal of breuk met een noemer ongelijk aan nul.'){return result(false,'input.syntax',message,{kind:'interaction_error'});}
const allValues=(fields)=>fields.every(Boolean);
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value)}return value;}
const hintsets={
 grenspas:['Welke as bevat de gevraagde x-waarden?','Kijk naar de x-as: daar is y gelijk aan nul.','Test één x-waarde links en één rechts van je grens.','Ander voorbeeld: y = −x + 1. Bij x = 0 is y = 1. Welke zijde is daar positief?','Voorbeeld: y = x − 2. Nul bij x = 2; links ligt de lijn onder nul, rechts boven nul. Probeer daarna een nieuw geval.'],
 hellingrug:['Volgen beide verschillen dezelfde richting?','Kijk naar begin- en eindpunt van je gekozen pijl.','Bereken eind min begin voor beide coördinaten; deel Δy door Δx.','Ander voorbeeld: van (0, 1) naar (4, 3). Δx = 4. Vul Δy en de verhouding aan.','Voorbeeld: van (0, 1) naar (4, 3): Δx = 4, Δy = 2, a = 2/4 = 1/2. Omgekeerd is a = −2/−4 = 1/2.'],
 signaalstad:['Welke waarde hoort bij x = 0?','Vergelijk de y-as met de constante term van het voorschrift.','Een x=0-proef meet b; een stap van één x meet a.','Ander voorbeeld: y = 3x − 1. De uitvoer bij x = 0 is −1. Wat verandert bij één stap?','Voorbeeld: y = 3x − 1 heeft b = −1 en a = 3. Een grafiek met a = −1 en b = 3 heeft die rollen verwisseld.']
};
function makeTask(world,options={}){
 if(!worlds.includes(world))throw Error('Onbekende wereld.');
 const variant=integer(options.variant,0),seed=integer(options.seed,1),mode=modes.includes(options.mode)?options.mode:'practice';
 const features=[],t={id:`rechten-v2:1:${world}:${variant}:${seed}:${mode}`,world,world_id:world,skill_id:world==='grenspas'?'sign':world==='hellingrug'?'slope_from_two_points':'ab',family_id:world==='grenspas'?'F6':world==='hellingrug'?'F2':'F3',mode,variant,seed,features,hints:[...hintsets[world]],bounds:{xMin:-6,xMax:6,yMin:-6,yMax:6}};
 if(world==='grenspas'){
  const v=mod(variant,6),shift=mod(seed-1,3),defs=[[q(1),q(3-shift),'positive'],[q(-1),q(-2+shift),'positive'],[q(-1,2),q(1-shift),'negative'],[q(0),q(2),'positive'],[q(0),q(-2),'positive'],[q(0),q(0),'negative']];
  const [a,value,ask]=defs[v];t.model={kind:'affine',a,b:a.n?mul(-1,mul(a,value)):value};t.root=a.n?value:null;t.ask=ask;
  t.hidden={x:q(a.n?num(value)+2:3),y:at(t.model,q(a.n?num(value)+2:3))};
  features.push(a.n>0?'rising':a.n<0?'falling':'horizontal',ask,a.n?'strict-boundary':'all-or-none');
  t.contrast_case={world,variant:mod(variant+1,6),feature:v===0?'falling-negative-root':v<2?'sign-question-changed':'horizontal-orientation'};
 }else if(world==='hellingrug'){
  const v=[2,3,4,0,1,5][mod(variant,6)],params=W.generate('slope_from_two_points',{difficulty:2,variant:v,seed:mod(seed,10000)});
  t.model=params.model;t.points={A:params.A,B:params.B};t.legacy={skill:t.skill_id,difficulty:2,params};
  let x=add(params.B.x,3);if(eq(x,params.A.x))x=add(x,1);t.hidden={x,y:at(t.model,x)};
  features.push(params.variant,'two-valid-orientations',mod(variant,2)?'point-to-table-transfer':'point-pair-representation');
  t.contrast_case={world,variant:mod(variant+1,6),feature:'rate-sign-and-point-to-table-representation'};
 }else{
  const values=[[q(2),q(8)],[q(-1),q(3)],[q(1,2),q(-2)],[q(0),q(4)]][mod(variant,4)];
  t.model={kind:'affine',a:values[0],b:add(values[1],mod(seed-1,3))};t.faultModel={kind:'affine',a:t.model.b,b:t.model.a};
  t.rows=[0,1,2].map(x=>({x:q(x),y:at(t.model,q(x))}));t.hidden={x:q(10),y:at(t.model,q(10))};
  t.bounds={xMin:-2,xMax:3,yMin:-12,yMax:36};features.push('parameter-role-swap',!t.model.a.n?'horizontal':t.model.a.d>1?'fractional':t.model.a.n<0?'negative':'positive','probe-choice','hidden-input');
  t.contrast_case={world,variant:mod(variant+1,4),feature:'parameter-sign-or-constant-rate'};
 }
 const claims={grenspas:'Koppel nulwaarde en teken van f(x) aan een strikt x-interval.',hellingrug:'Construeer een exacte gerichte rate uit twee punten en voorspel een derde punt.',signaalstad:'Diagnosticeer verwisselde helling en y-afsnede met een gekozen probe en herstel de koppeling.'};
 Object.assign(t,{profile:{contentVersion:1,stage:world==='signaalstad'?'diagnose':'predict'},curriculum_claim:claims[world],primary_cognitive_action:world==='grenspas'?'construeer x-interval':world==='hellingrug'?'bouw gerichte ratio':'diagnosticeer en herstel parameterkoppeling',given_representations:world==='grenspas'?['graph']:world==='hellingrug'?(mod(variant,2)?['table']:['points','graph']):['formula','table','graph'],target_representation:world==='grenspas'?'interval-and-inequality':world==='hellingrug'?'rational-rate':'corrected-parameter-coupling',task_features:[...features],visible_case:{model:t.model,...(t.points?{points:t.points}:{}),...(t.rows?{rows:t.rows,faultModel:t.faultModel}:{})},hidden_cases:[{kind:world==='hellingrug'?'third-point':'new-input',...t.hidden}],primary_action:'Test',response_component:world==='grenspas'?['AxisAnchorPicker','IntervalSelector']:world==='hellingrug'?['DirectedDeltaBuilder','RateFractionBuilder']:['RepresentationPins','FunctionProbe','FaultLocator'],allowed_alternatives:world==='hellingrug'?['AB','BA','equivalent-rationals']:world==='signaalstad'?['zero-probe','difference-probe']:['tap-region','keyboard-region'],commit_policy:{reveal:'after-explicit-commit',liveCorrectness:false},feedback_model:'exact-causal-probes-and-first-divergence',misconception_hypotheses:world==='grenspas'?['zero.output_zero','zero.sign','sign.side_reversed','sign.boundary_included','sign.horizontal_all_none']:world==='hellingrug'?['delta.orientation_mixed','delta.swap_axes','slope.reciprocal','slope.sign']:['param.slope_intercept_swap','param.a_sign','param.b_sign'],repair_policy:{preserveCorrect:true,unit:world==='signaalstad'?'atomic-coupling':'incorrect-component'},worked_example_ref:`hints:${world}:4-5`,difficulty_features:[...features],units:{x:'x-eenheden',y:'y-eenheden',rate:'y-eenheden per x-eenheid'},language_load:{locale:'nl-BE',level:'low',instructionLimit:'one-sentence'},accessibility:{input:['keyboard','single-pointer'],targetMin:44,colorOnly:false,reducedMotion:true,maxPinnedViews:2},evidence_events:['prediction','commit','result','repair','hint','hidden-result'],asset_slots:[`${world}-semantic-workspace`],validator:'RechtenV2Math/v1 + unchanged RechtenWave'});
 return freeze(t);
}
function checkRoot(t,value){
 if(!t.model.a.n){const want=t.model.b.n?'none':'all';if(!['none','all'].includes(value)){if(!parse(value))return syntax('Kies alle x, geen x, of voer een geldige grens in.');return result(false,'sign.horizontal_all_none','Een horizontale lijn heeft hier geen losse nulwaarde. Bekijk of de hele lijn op y = 0 ligt.');}return result(value===want,'sign.horizontal_all_none',value===want?'De nulwaarden passen bij de hele horizontale lijn.':'Vergelijk de constante uitvoer met nul.',{keep:{root:value===want},probes:[{x:q(0),y:t.model.b}]});}
 const r=parse(value);if(!r)return syntax();const y=at(t.model,r),ok=eq(y,0);return result(ok,!r.n?'zero.output_zero':eq(r,mul(-1,t.root))?'zero.sign':'zero.boundary',ok?`Bij x = ${text(r)} is de uitvoer nul.`:`Bij jouw grens is f(x) = ${text(y)}. Zoek waar de lijn de x-as snijdt.`,{keep:{root:ok},probes:[{x:r,y}]});
}
function intervalExpected(t){if(!t.model.a.n){const yes=t.ask==='positive'?t.model.b.n>0:t.model.b.n<0;return {side:yes?'all':'none',symbol:yes?'all':'none',root:null};}const right=(t.ask==='positive')===(t.model.a.n>0);return {side:right?'right':'left',symbol:right?'>':'<',root:t.root};}
function checkInterval(t,r={}){
 const want=intervalExpected(t);if(!['left','right','all','none','point'].includes(r.side)||typeof r.closed!=='boolean')return syntax('Selecteer een x-gebied en kies een open of gesloten grens.');
 if(!t.model.a.n){if(!['all','none','<','>','='].includes(r.symbol))return syntax('Kies de symbolische vorm van je gebied.');const ok=r.side===want.side&&r.symbol===want.symbol;return result(ok,'sign.horizontal_all_none',ok?'De constante uitvoer geldt voor elke x; je gebied klopt.':'Test een andere x: de hoogte verandert niet. Kies alle x of geen x.',{keep:{side:r.side===want.side,symbol:r.symbol===want.symbol},probes:[{x:q(-2),y:t.model.b},{x:q(2),y:t.model.b}]});}
 const root=parse(r.boundary),symbolRoot=parse(r.symbolBoundary??r.boundary);if(!root||!symbolRoot||!['<','>','='].includes(r.symbol))return syntax();
 const rootOK=eq(root,t.root),sideOK=r.side===want.side,openOK=!r.closed,symbolOK=r.symbol===want.symbol,symbolRootOK=eq(symbolRoot,t.root),keep={root:rootOK,side:sideOK,closed:openOK,symbol:symbolOK,symbolBoundary:symbolRootOK};
 const probes=[sub(root,1),add(root,1)].map(x=>({x,y:at(t.model,x)}));
 if(!rootOK)return result(false,'zero.boundary','Je grens ligt nog niet waar de uitvoer nul is. Behoud je gekozen gebied en controleer de grens.',{keep,probes:[{x:root,y:at(t.model,root)},...probes]});
 if(r.side==='point'||r.symbol==='=')return result(false,'zero.output_zero','Op de grens is de uitvoer nul. Selecteer de x-waarden aan een zijde van die grens.',{keep,probes});
 if(!sideOK)return result(false,'sign.side_reversed','De proefwaarden tonen de hoogte aan beide zijden. Kies de zijde met het gevraagde teken.',{keep,probes});
 if(!openOK)return result(false,'sign.boundary_included','Op de grens is f(x) = 0. Bij een strikte ongelijkheid hoort de grens er niet bij.',{keep,probes});
 if(!symbolOK)return result(false,'sign.symbol_side','Je geselecteerde gebied klopt. Laat het ongelijkheidsteken naar hetzelfde x-gebied verwijzen.',{keep,probes});
 if(!symbolRootOK)return result(false,'sign.symbol_boundary','Je gebied klopt. Gebruik dezelfde grens in je ongelijkheid.',{keep,probes});
 return result(true,null,'De proefwaarden en je ongelijkheid beschrijven hetzelfde x-gebied.',{keep,probes});
}
function deltaData(t,r){if(!['AB','BA'].includes(r.direction))return null;const dx=parse(r.dx),dy=parse(r.dy);if(!allValues([dx,dy]))return null;const order=r.direction==='AB'?['B','A']:['A','B'],w=W.fresh(t.legacy);W.submit(t.legacy,w,order);W.submit(t.legacy,w,order);return {dx,dy,w,wantDx:W.expected(t.legacy,w,'dx'),wantDy:W.expected(t.legacy,w,'dy'),start:t.points[r.direction==='AB'?'A':'B']};}
function checkDeltas(t,r={}){
 const d=deltaData(t,r);if(!d)return syntax('Kies een richting en vul beide gerichte verschillen in.');
 const x=eq(d.dx,d.wantDx),y=eq(d.dy,d.wantDy),keep={direction:true,dx:x,dy:y};const probes=[{x:add(d.start.x,d.dx),y:add(d.start.y,d.dy),label:'Jouw eindpunt'}];
 if(x&&y)return result(true,null,'Beide stappen volgen dezelfde gekozen richting.',{keep,probes});
 const mixed=(x&&!y&&eq(d.dy,mul(-1,d.wantDy)))||(y&&!x&&eq(d.dx,mul(-1,d.wantDx))),swapped=eq(d.dx,d.wantDy)&&eq(d.dy,d.wantDx);
 return result(false,mixed?'delta.orientation_mixed':swapped?'delta.swap_axes':'delta.component',mixed?'Je verschillen volgen niet dezelfde richting. Behoud de juiste stap en herstel de andere.':swapped?'Δx beschrijft de horizontale verandering, Δy de verticale.':'Jouw stappen bereiken het tweede punt nog niet. Behoud de juiste component.',{keep,probes});
}
function checkSlope(t,r={}){
 const deltas=checkDeltas(t,r);if(!deltas.ok)return deltas;
 const numerator=parse(r.numerator),denominator=parse(r.denominator);if(!allValues([numerator,denominator])||!denominator.n)return {...syntax(),keep:deltas.keep};
 const d=deltaData(t,r),a=div(numerator,denominator),legacy=W.check(t.legacy,d.w,a);const probes=[{x:t.points.B.x,y:add(t.points.A.y,mul(a,sub(t.points.B.x,t.points.A.x))),label:'Jouw rate vanaf A'}];
 if(legacy.ok)return result(true,null,'Deze verhouding bereikt beide punten, in beide richtingen.',{keep:{...deltas.keep,rate:true},probes});
 const reciprocal=t.model.a.n&&eq(a,div(1,t.model.a)),sign=eq(a,mul(-1,t.model.a));return result(false,reciprocal?'slope.reciprocal':sign?'slope.sign':'slope.rate','De rate moet verticale verandering per horizontale eenheid geven. Je juiste verschillen blijven staan.',{keep:{...deltas.keep,rate:false},probes});
}
function signalProbe(t,kind,prediction={}){
 if(!['zero','difference'].includes(kind))return syntax('Kies x = 0 of de verschilproef.');const value=parse(prediction.expected);if(!value)return syntax();
 const expected=kind==='zero'?t.model.b:t.model.a,actual=kind==='zero'?t.faultModel.b:t.faultModel.a,ok=eq(value,expected);
 return result(ok,'param.probe_prediction',ok?'Je voorspelling uit de gegevens klopt. De grafiek geeft een andere waarde: onderzoek de koppeling.':'Vergelijk je voorspelling met de formule of tabel. De grafiekproef toont ook de afwijking.',{keep:{prediction:ok},expected,actual,probes:(kind==='difference'?[q(0),q(1)]:[q(0)]).map(x=>({kind,x,y:at(t.faultModel,x),expected:at(t.model,x),actual:at(t.faultModel,x)}))});
}
function checkSignal(t,r={}){
 const a=parse(r.a),b=parse(r.b);if(!a||!b||typeof r.feature!=='string')return syntax('Benoem de defecte koppeling en vul beide parameters in.');
 const aOK=eq(a,t.model.a),bOK=eq(b,t.model.b),keep={a:aOK,b:bOK,feature:r.feature==='swapped'},probes=[q(0),q(1)].map(x=>({x,y:add(mul(a,x),b),expected:at(t.model,x)}));
 if(r.feature!=='swapped')return result(false,'param.fault_location','Vergelijk de rol van de verandering en de uitvoer bij x = 0. Benoem de defecte koppeling.',{keep,probes});
 if(aOK&&bOK)return result(true,null,'De koppeling is hersteld: rate en uitvoer bij nul hebben elk hun eigen rol.',{keep,probes});
 const mismatch=probes.find(p=>!eq(p.y,p.expected));
 return result(false,eq(a,t.model.b)&&eq(b,t.model.a)?'param.slope_intercept_swap':!aOK?'param.rate':'param.intercept',`Bij x = ${text(mismatch.x)} geeft jouw koppeling y = ${text(mismatch.y)}; nodig is y = ${text(mismatch.expected)}. Behoud de juiste parameter en herstel de andere.`,{keep,probes});
}
function checkHidden(t,value){const y=parse(value);if(!y)return syntax();const ok=eq(y,t.hidden.y);return result(ok,'transfer.output',ok?`Ook bij x = ${text(t.hidden.x)} geeft je regel y = ${text(y)}.`:`Je voorspelde y = ${text(y)}. Bij x = ${text(t.hidden.x)} geeft de regel y = ${text(t.hidden.y)}. Controleer je berekening; je eerdere stappen blijven staan.`,{keep:{hidden:ok},probes:[{x:t.hidden.x,y,expected:t.hidden.y}]});}
return {makeTask,checkRoot,checkInterval,checkDeltas,checkSlope,signalProbe,checkSignal,checkHidden,intervalExpected,parse,at};
});
