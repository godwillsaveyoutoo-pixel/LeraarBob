/* Adapted from Speel-Getallenwereld-v0.2.html supplied by the user.
   Curriculum and reproducible exercises. All displayed results are checked by the
   existing exact BewerkingenCore engine; no floating point answer comparison. */
(function(root,factory){const api=factory(typeof module==='object'?require('../bewerkingen-trainer/core.js'):root.BewerkingenCore);if(typeof module==='object')module.exports=api;else root.GetallenLessons=api;})(typeof globalThis==='object'?globalThis:this,function(C){
'use strict';
const THEMES=[
 {id:'machten',title:'Machten',intro:'Van betekenis naar rekenregel. Eerst herkennen, dan herschrijven.',example:'x^3\\cdot x^4=x^7',stops:[
  ['betekenis','Betekenis & nulmacht','Betekenis','3^4=3\\cdot3\\cdot3\\cdot3','Een macht lezen; ook exponent 0 en negatieve grondtallen.'],
  ['product','Machten vermenigvuldigen','Productregel','x^3\\cdot x^4=x^{3+4}','Zelfde grondtal: tel de exponenten op.'],
  ['quotient','Machten delen','Delen','\\frac{x^7}{x^2}=x^{7-2}','Zelfde grondtal: trek de exponenten af.'],
  ['macht','Macht van een macht','Macht van macht','(x^3)^2=x^{3\\cdot2}','Vermenigvuldig de exponenten.'],
  ['factoren','Macht van een product','Macht van product','(2\\cdot x)^3=8x^3','Geef elke factor tussen de haakjes dezelfde exponent.'],
  ['haakjes','Breuken & eentermen verheffen','Breuk & eenterm','\\left(\\frac{2}{3}\\right)^2=\\frac{2^2}{3^2}','Verhef teller en noemer, of alle factoren van een eenterm.'],
  ['negatief','Negatieve exponenten','Negatieve macht','x^{-3}=\\frac{1}{x^3}','Neem het omgekeerde en gebruik positieve exponenten.'],
  ['mix','Rekenregels combineren','Combineren','\\frac{x^2\\cdot x^5}{x^3}=x^4','Kies de volgorde en combineer de rekenregels.']
 ]},
 {id:'wortels',title:'Vierkantswortels',intro:'Zoek kwadraten. Vereenvoudig en houd de worteltermen uit elkaar.',example:'\\sqrt{12}+\\sqrt{27}=5\\sqrt{3}',stops:[
  ['factor','Kwadraatfactor zoeken','Kwadraatfactor','12=4\\cdot3','Begin met kleine getallen; zoek daarna de grootste kwadraatfactor.'],
  ['product','Wortels vermenigvuldigen','Wortelproduct','\\sqrt{2}\\cdot\\sqrt{8}=\\sqrt{16}','Breng een product onder één wortel en vereenvoudig.'],
  ['quotient','Wortels delen','Delen','\\frac{\\sqrt{18}}{\\sqrt{9}}=\\sqrt{\\frac{18}{9}}','Deel de getallen onder de wortel; noemer positief.'],
  ['macht','Wortels, machten & letters','Machten & letters','\\sqrt{x^6}=x^3\\quad(x>0)','Herken kwadraten en let op de voorwaarde bij letters.'],
  ['vereenvoudigen','Wortels vereenvoudigen','Vereenvoudigen','\\sqrt{48}=4\\sqrt{3}','Haal de grootste kwadraatfactor uit de wortel.'],
  ['som','Worteltermen samenvoegen','Samenvoegen','2\\sqrt{3}+4\\sqrt{3}=6\\sqrt{3}','Vereenvoudig eerst; tel alleen gelijksoortige wortels op.'],
  ['regels','Mag deze rekenregel?','Regel of valkuil?','\\sqrt{9+16}\\ne\\sqrt{9}+\\sqrt{16}','Product en quotiënt mogen; som en verschil niet zomaar.']
 ]},
 {id:'wetenschappelijk',title:'Wetenschappelijke schrijfwijze',intro:'Schrijf grote en kleine getallen met machten van tien. Houd de waarde gelijk.',example:'320\\,000=3{,}2\\cdot10^5',stops:[
  ['groot','Grote getallen schrijven','Grote getallen','320\\,000=3{,}2\\cdot10^5','Maak een factor van 1 tot 10 en tel hoeveel plaatsen de komma naar links schuift.'],
  ['klein','Kleine getallen schrijven','Kleine getallen','0{,}00032=3{,}2\\cdot10^{-4}','Een klein getal krijgt een negatieve exponent. De factor blijft tussen 1 en 10.'],
  ['terug','Terug naar een gewoon getal','Terugschrijven','3{,}2\\cdot10^{-4}=0{,}00032','Een positieve exponent schuift de komma naar rechts; een negatieve naar links.'],
  ['normaliseren','De factor goed zetten','Normaliseren','32\\cdot10^4=3{,}2\\cdot10^5','Staat de factor buiten het interval van 1 tot 10? Pas factor en exponent samen aan.']
 ]}
];
const stops=THEMES.flatMap(t=>t.stops.map((s,i)=>({id:t.id+'-'+s[0],theme:t.id,kind:s[0],title:s[1],short:s[2],example:s[3],intro:s[4],number:i+1})));
const stop=id=>stops.find(s=>s.id===id),theme=id=>THEMES.find(t=>t.id===id);
// Shared learning goals, without merging the two historical progress records.
const PRACTICE={
 'machten-product':['power-product'],'machten-quotient':['power-quotient'],
 'machten-macht':['power-power'],'machten-factoren':['power-monomial'],
 'machten-haakjes':['power-monomial','power-negative'],'machten-negatief':['power-negative'],
 'machten-mix':['power-mixed'],'wortels-factor':['square-factor'],
 'wortels-product':['root-product'],'wortels-quotient':['root-quotient','root-fraction'],
 'wortels-macht':['root-power','root-letters'],'wortels-vereenvoudigen':['root-simplify'],
 'wortels-som':['root-sum','root-sum-mixed'],
 'wetenschappelijk-groot':['scientific'],'wetenschappelijk-klein':['scientific'],
 'wetenschappelijk-terug':[],'wetenschappelijk-normaliseren':[]
};
const practiceSkills=id=>PRACTICE[id]?[...PRACTICE[id]]:[];
const rule=(id,label,tex)=>({id,label,tex});
const R={
 meaning:rule('meaning','Schrijf de herhaalde vermenigvuldiging','a^n=\\underbrace{a\\cdot\\ldots\\cdot a}_{n\\text{ factoren}}'),
 zero:rule('zero','Een niet-nul grondtal tot de macht nul','a^0=1\\quad(a\\ne0)'),
 product:rule('product','Zelfde grondtal: exponenten optellen','a^m\\cdot a^n=a^{m+n}'),
 quotient:rule('quotient','Zelfde grondtal: exponenten aftrekken','\\frac{a^m}{a^n}=a^{m-n}\\quad(a\\ne0)'),
 power:rule('power','Macht van een macht: exponenten vermenigvuldigen','(a^m)^n=a^{m\\cdot n}'),
 distribute:rule('distribute','Verhef iedere factor tot de macht','(a\\cdot b)^n=a^n\\cdot b^n'),
 fraction:rule('fraction','Verhef teller én noemer tot de macht','\\left(\\frac{a}{b}\\right)^n=\\frac{a^n}{b^n}'),
 reciprocal:rule('reciprocal','Neem het omgekeerde','a^{-n}=\\frac{1}{a^n}\\quad(a\\ne0)'),
 square:rule('square','Ontbind met een kwadraatfactor','\\sqrt{k^2\\cdot r}=k\\sqrt r\\quad(k\\ge0)'),
 rootproduct:rule('rootproduct','Product onder één wortel','\\sqrt a\\cdot\\sqrt b=\\sqrt{a\\cdot b}'),
 rootquotient:rule('rootquotient','Quotiënt onder één wortel','\\frac{\\sqrt a}{\\sqrt b}=\\sqrt{\\frac ab}'),
 rootpower:rule('rootpower','Een kwadraat en een wortel heffen elkaar op','\\sqrt{a^2}=|a|'),
 rootlike:rule('rootlike','Tel de coëfficiënten van gelijke wortels op','p\\sqrt r+q\\sqrt r=(p+q)\\sqrt r'),
 invalidsum:rule('invalidsum','Bij een som mag je niet zomaar splitsen','\\sqrt{a+b}\\not\\equiv\\sqrt a+\\sqrt b'),
 invaliddifference:rule('invaliddifference','Bij een verschil mag je niet zomaar splitsen','\\sqrt{a-b}\\not\\equiv\\sqrt a-\\sqrt b'),
 scientificlarge:rule('scientificlarge','Komma naar links: positieve exponent','320\\,000=3{,}2\\cdot10^5'),
 scientificsmall:rule('scientificsmall','Komma naar rechts: negatieve exponent','0{,}00032=3{,}2\\cdot10^{-4}'),
 decimalright:rule('decimalright','Positieve exponent: komma naar rechts','3{,}2\\cdot10^3=3200'),
 decimalleft:rule('decimalleft','Negatieve exponent: komma naar links','3{,}2\\cdot10^{-3}=0{,}0032'),
 normalizelarge:rule('normalizelarge','Factor delen door 10: exponent 1 groter','32\\cdot10^4=3{,}2\\cdot10^5'),
 normalizesmall:rule('normalizesmall','Factor maal 10: exponent 1 kleiner','0{,}32\\cdot10^4=3{,}2\\cdot10^3')
};
function rng(seed){let v=seed>>>0;return()=>{v=(Math.imul(v,1664525)+1013904223)>>>0;return v/4294967296;};}
function radical(n){let k=1,r=n;for(let f=2;f*f<=r;f++)while(r%(f*f)===0){r/=f*f;k*=f;}return[k,r];}
const slot=(label,value)=>({label,answer:String(value)});
// Decimal digits stay separate integer choices. This preserves the saved answer
// format and lets the existing rational engine grade without rounding a float.
const digitSlot=(label,value)=>({...slot(label,value),choices:Array.from({length:5},(_,i)=>String((value+i+8)%10)).sort((a,b)=>Number(a)-Number(b))});
const stage=(prompt,template,slots,expression,explanation)=>({prompt,template,slots,expression,explanation});
function make(id,seed,index=0,edition=2){
 const s=stop(id);if(!s)throw Error('Onbekend onderdeel');
 const random=rng(seed),pick=a=>a[Math.floor(random()*a.length)],int=(a,b)=>a+Math.floor(random()*(b-a+1));
 const a=int(2,5),b=int(2,4),m=int(2,5),n=int(2,4),r=pick([2,3,5,6,7]),v=((index%6)+6)%6;
 let expression,correct,choices,stages=[],condition='',note='',finalExpression,finalTex,rulePrompt;
 const set=(key,others)=>{correct=key;choices=[R[key],...others.map(k=>R[k])];};
 const positivePower=e=>e<0?stage('Schrijf met een positieve exponent.','\\frac{1}{x^{[[0]]}}',[slot('Exponent in noemer',-e)],'1/(x^([[0]]))','Een negatieve exponent betekent het omgekeerde.'):stage('Maak de nulmacht af.','[[0]]',[slot('Uitkomst',1)],'[[0]]','Een niet-nul grondtal tot de macht nul is 1.');
 if(s.theme==='machten'){
  switch(s.kind){
   case 'betekenis':
    if(v%3===1){expression=`${a}^0`;condition='Het grondtal is niet nul.';set('zero',['meaning','reciprocal']);stages=[stage('Welke waarde heeft deze macht?','[[0]]',[slot('Waarde',1)],'[[0]]','Elke niet-nul macht met exponent nul is 1.')];}
    else {const base=v%3===2?-a:a;const exp=v%3===2?pick([2,3]):pick([2,3,4]);expression=`(${base})^${exp}`;set('meaning',['power','product']);note='De haakjes horen bij het grondtal.';const product=Array(exp).fill(base<0?'('+base+')':String(base)).join('\\cdot');stages=[stage('Uit hoeveel gelijke factoren bestaat deze macht?',`\\underbrace{${product}}_{[[0]]\\text{ factoren}}`,[slot('Aantal factoren',exp)],null,'De exponent vertelt hoeveel keer het grondtal als factor voorkomt.'),stage('Reken de herhaalde vermenigvuldiging uit.','[[0]]',[slot('Uitkomst',base**exp)],'[[0]]',`${exp} factoren met hetzelfde grondtal. Een even aantal mintekens geeft een positief product.`)];}break;
   case 'product':
    if(edition>=2&&v>=4){const left=v===4?m:-m,right=-n,e=left+right;expression=`x^(${left})*x^(${right})`;condition='x ≠ 0';set('product',['power','quotient']);stages=[stage('Tel ook negatieve exponenten gewoon op.','x^{[[0]]}',[slot('Exponent',e)],'x^([[0]])',`Het grondtal blijft x. De exponent wordt ${left} + (${right}).`)];if(e<=0)stages.push(positivePower(e));}
    else{expression=`x^${m}*x^${n}`;set('product',['power','quotient']);stages=[stage('Tel de exponenten op.','x^{[[0]]}',[slot('Exponent',m+n)],'x^([[0]])',`Het grondtal blijft x. De exponent wordt ${m} + ${n}.`)];}break;
   case 'quotient':{
    const k=edition>=2&&v>=4?-m:v%2?m+n:m,d=edition>=2&&v>=4?(v===4?n:-n):v%2?m:m+n,e=k-d;expression=edition>=2&&v>=4?`x^(${k})/x^(${d})`:`x^${k}/x^${d}`;condition='x ≠ 0';set('quotient',['product','power']);
    stages=[stage('Trek de exponent van de noemer af.','x^{[[0]]}',[slot('Exponent',e)],'x^([[0]])',`De exponent wordt ${k} − ${d}.`)];
    if(edition>=2&&v>=4)stages[0].explanation=`Trek de volledige exponent af: ${k} − (${d}).`;
    if(e<0)stages.push(positivePower(e));else if(edition>=2&&e===0)stages.push(positivePower(0));break;}
   case 'macht':
    if(edition>=2&&v>=4){const inner=v===4?-m:m,outer=v===4?n:-n,e=inner*outer;expression=`(x^(${inner}))^(${outer})`;condition='x ≠ 0';set('power',['product','quotient']);stages=[stage('Vermenigvuldig de exponenten, met hun teken.','x^{[[0]]}',[slot('Exponent',e)],'x^([[0]])',`De exponent wordt (${inner}) · (${outer}).`),positivePower(e)];}
    else{expression=`(x^${m})^${n}`;set('power',['product','quotient']);stages=[stage('Vermenigvuldig de exponenten.','x^{[[0]]}',[slot('Exponent',m*n)],'x^([[0]])',`De exponent wordt ${m} · ${n}, niet ${m} + ${n}.`)];}break;
   case 'factoren':{
    const p=pick([2,3]),q=pick([2,3]),power=v>=4?-2:v===1?3:2,left=v===1?-p:p,letter=v===2||v===3||v===5,inside=letter?(v===3?`x^${m}`:'x'):String(q),insideTex=letter?(v===3?`x^{${m}}`:'x'):String(q);
    expression=`(${left}*${inside})^(${power})`;set('distribute',['power','product']);rulePrompt='Welke regel geeft iedere factor dezelfde exponent?';if(power<0&&letter)condition='x ≠ 0';
    const leftTex=left<0?'('+left+')':String(left);
    stages=[stage('Geef beide factoren de exponent van de haakjes.',leftTex+'^{[[0]]}\\cdot '+(v===3?'('+insideTex+')':insideTex)+'^{[[1]]}',[slot('Exponent eerste factor',power),slot('Exponent tweede factor',power)],`(${left})^([[0]])*(${inside})^([[1]])`,'De macht hoort bij het hele product: elke factor krijgt dezelfde exponent.')];
    if(letter){const exponent=(v===3?m:1)*Math.abs(power),coefficient=p**Math.abs(power);stages.push(power<0?stage('Zet de positieve machten in de noemer.','\\frac{1}{[[0]]\\,x^{[[1]]}}',[slot('Coëfficiënt noemer',coefficient),slot('Exponent in noemer',exponent)],'1/(([[0]])*x^([[1]]))','Een negatieve exponent betekent het omgekeerde van het hele product.'):stage('Reken de macht van elke factor uit.','[[0]]\\,x^{[[1]]}',[slot('Coëfficiënt',coefficient),slot('Exponent van x',exponent)],'([[0]])*x^([[1]])','Verhef het getal en vermenigvuldig, indien nodig, de exponenten van x.'));}
    else stages.push(power<0?stage('Reken de positieve macht in de noemer uit.','\\frac{1}{[[0]]}',[slot('Noemer',(p*q)**Math.abs(power))],'1/([[0]])','Neem het omgekeerde en reken de positieve machten uit.'):stage('Reken beide machten en hun product uit.','[[0]]',[slot('Uitkomst',(left*q)**power)],'[[0]]','Vermenigvuldig de twee machten. Let ook op een negatief grondtal.'));break;}
   case 'haakjes':
    if(edition>=2&&v>=4){rulePrompt='Welke regel maakt deze negatieve exponent positief?';set('reciprocal',['power','zero']);
     if(v===4){const [p,q]=pick([[2,3],[3,4],[2,5]]),k=pick([2,3]);expression=`(${p}/${q})^(-${k})`;stages=[stage('Neem eerst het omgekeerde van de breuk.',`\\left(\\frac{[[0]]}{[[1]]}\\right)^{${k}}`,[slot('Nieuwe teller',q),slot('Nieuwe noemer',p)],`(([[0]])/([[1]]))^${k}`,'Een negatieve exponent keert de volledige breuk om.'),stage('Verhef teller en noemer tot de positieve macht.','\\frac{[[0]]}{[[1]]}',[slot('Teller',q**k),slot('Noemer',p**k)],'([[0]])/([[1]])','Nu krijgen teller en noemer elk de positieve exponent.')];}
     else{const k=pick([2,3]);expression=`(${a}*x^${m})^(-${k})`;condition='x ≠ 0';stages=[stage('Zet het hele product in de noemer.',`\\frac{1}{(${a}x^{${m}})^{[[0]]}}`,[slot('Positieve exponent',k)],`1/((${a}*x^${m})^([[0]]))`,'Het omgekeerde geldt voor alle factoren tussen de haakjes.'),stage('Werk de macht in de noemer uit.','\\frac{1}{[[0]]\\,x^{[[1]]}}',[slot('Coëfficiënt noemer',a**k),slot('Exponent in noemer',m*k)],'1/(([[0]])*x^([[1]]))','Verhef de coëfficiënt en vermenigvuldig de exponenten van x.')];}
    }
    else if(v%2===0){const pairs=pick([[2,3],[3,4],[2,5]]),[p,q]=pairs,k=pick([2,3]);expression=`(${p}/${q})^${k}`;set('fraction',['power','reciprocal']);stages=[stage('Bereken teller en noemer apart.','\\frac{[[0]]}{[[1]]}',[slot('Teller',p**k),slot('Noemer',q**k)],'([[0]])/([[1]])',`Verhef zowel ${p} als ${q} tot de macht ${k}.`)];}
    else{const coeff=v===3?-a:a,k=pick([2,3]);expression=`(${coeff}*x^${m})^${k}`;set('distribute',['power','product']);stages=[stage('Verhef ook de coëfficiënt tot de macht.','[[0]]\\,x^{[[1]]}',[slot('Coëfficiënt',coeff**k),slot('Exponent',m*k)],'([[0]])*x^([[1]])','De macht werkt op iedere factor tussen de haakjes.')];}break;
   case 'negatief':condition='Het grondtal is niet nul.';set('reciprocal',['fraction','zero']);
    if(v%2===0){expression=`x^(-${n})`;condition='x ≠ 0';stages=[stage('Zet de macht in de noemer.','\\frac{1}{x^{[[0]]}}',[slot('Positieve exponent',n)],'1/(x^([[0]]))','Het omgekeerde van xⁿ is 1 gedeeld door xⁿ.')];}
    else{const [p,q]=pick([[2,3],[3,4],[2,5]]),k=pick([2,3]);expression=`(${p}/${q})^(-${k})`;stages=[stage('Keer de breuk om en verhef tot de positieve macht.','\\frac{[[0]]}{[[1]]}',[slot('Teller',q**k),slot('Noemer',p**k)],'([[0]])/([[1]])','Wissel teller en noemer; het minteken is geen negatieve uitkomst.')];}break;
   case 'mix':
    if(edition>=2&&v>=4){condition='x ≠ 0';
     if(v===4){const k=m+1;expression=`(x^${m}*x^(-${n}))/x^${k}`;set('product',['power','distribute']);rulePrompt='Welke regel neemt de factoren in de teller samen?';stages=[stage('Neem het product in de teller samen.','\\frac{x^{[[0]]}}{x^{'+k+'}}',[slot('Exponent teller',m-n)],`x^([[0]])/x^${k}`,`Tel de exponenten op: ${m} + (−${n}).`),stage('Trek daarna de exponent van de noemer af.','x^{[[0]]}',[slot('Exponent',-n-1)],'x^([[0]])',`Trek ${k} af van de exponent in de teller.`),positivePower(-n-1)];}
     else{const k=int(1,3);expression=`(x^${m})^(-${n})*x^${k}`;set('power',['product','quotient']);rulePrompt='Welke regel werkt eerst de macht tussen haakjes uit?';stages=[stage('Werk eerst de macht van een macht uit.','x^{[[0]]}\\cdot x^{'+k+'}',[slot('Exponent eerste macht',-m*n)],`x^([[0]])*x^${k}`,`Vermenigvuldig de exponenten: ${m} · (−${n}).`),stage('Neem nu het product van machten samen.','x^{[[0]]}',[slot('Exponent',-m*n+k)],'x^([[0]])',`Tel vervolgens ${k} bij de exponent op.`),positivePower(-m*n+k)];}
    }
    else if(v%2===0){const k=int(1,m+n-1);expression=`(x^${m}*x^${n})/x^${k}`;condition='x ≠ 0';set('product',['power','distribute']);stages=[stage('Neem eerst het product in de teller samen.','\\frac{x^{[[0]]}}{x^{'+k+'}}',[slot('Exponent teller',m+n)],`x^([[0]])/x^${k}`,'Tel de exponenten in het product op.'),stage('Deel nu de machten.','x^{[[0]]}',[slot('Exponent',m+n-k)],'x^([[0]])',`Trek daarna ${k} af van de exponent in de teller.`)];}
    else{expression=`(${a}*x^${m})^2*${b}*x^${n}`;set('distribute',['quotient','product']);stages=[stage('Werk eerst de haakjes uit.','[[0]]\\,x^{[[1]]}\\cdot '+b+'x^{'+n+'}',[slot('Coëfficiënt',a*a),slot('Exponent',2*m)],`([[0]])*x^([[1]])*${b}*x^${n}`,'Kwadrateer de coëfficiënt en verdubbel de exponent.'),stage('Neem de factoren samen.','[[0]]\\,x^{[[1]]}',[slot('Coëfficiënt',a*a*b),slot('Exponent',2*m+n)],'([[0]])*x^([[1]])','Vermenigvuldig de coëfficiënten en tel de exponenten op.')];}break;
  }
 }else if(s.theme==='wetenschappelijk'){
  const whole=int(1,9),tenth=v%3===0?0:int(1,9),digits=10*whole+tenth,negative=edition>=2&&v>=4,sign=negative?'-':'',coefficient=sign+whole+'.'+tenth;
  const decimal=exponent=>exponent>=1?sign+String(digits)+'0'.repeat(exponent-1):sign+'0.'+'0'.repeat(-exponent-1)+String(digits);
  const normalized=(exponent,prompt,explanation)=>stage(prompt,sign+'[[0]]{,}[[1]]\\cdot10^{[[2]]}',[digitSlot('Cijfer vóór de komma',whole),digitSlot('Cijfer na de komma',tenth),slot('Exponent van tien',exponent)],sign+'(([[0]])+([[1]])/10)*10^([[2]])',explanation);
  condition='De absolute waarde van de factor is minstens 1 en kleiner dan 10.';
  if(negative)note='Het minteken blijft bij het getal; de komma verplaatsen verandert het teken niet.';
  rulePrompt='Welke regel houdt de waarde van het getal gelijk?';
  switch(s.kind){
   case 'groot':{
    const exponent=int(2,6);expression=decimal(exponent);set('scientificlarge',['scientificsmall','normalizesmall']);
    stages=[normalized(exponent,'Kies de twee cijfers van de factor en de exponent van tien.',`De komma schuift ${exponent} plaatsen naar links. Compenseer dat met 10 tot de positieve macht ${exponent}.`)];break;}
   case 'klein':{
    const exponent=-int(2,6);expression=decimal(exponent);set('scientificsmall',['scientificlarge','normalizelarge']);
    stages=[normalized(exponent,'Kies de factor tussen 1 en 10 en de negatieve exponent.',`De komma schuift ${-exponent} plaatsen naar rechts. Compenseer dat met 10 tot de macht ${exponent}.`)];break;}
   case 'terug':{
    const exponent=(v%2?-1:1)*int(2,5);expression=coefficient+'*10^('+exponent+')';set(exponent>0?'decimalright':'decimalleft',exponent>0?['decimalleft','normalizelarge']:['decimalright','normalizesmall']);
    condition='Behoud alle cijfers en het teken van het getal.';
    if(exponent>0)stages=[stage('Schuif de komma naar rechts en maak het getal af.',sign+'[[0]]',[slot(negative?'Grootte van het getal; het minteken staat vast':'Gewoon getal',Number(String(digits)+'0'.repeat(exponent-1)))],sign+'([[0]])',`Vermenigvuldigen met 10 tot de macht ${exponent} schuift de komma ${exponent} plaatsen naar rechts.`)];
    else stages=[stage('Schuif de komma naar links. De benodigde nullen staan al klaar.',sign+'0{,}'+'0'.repeat(-exponent-1)+'[[0]][[1]]',[digitSlot('Eerste cijfer na de nullen',whole),digitSlot('Laatste cijfer',tenth)],sign+'(10*([[0]])+([[1]]))/'+String(10**(1-exponent)),`Delen door 10 tot de macht ${-exponent} schuift de komma ${-exponent} plaatsen naar links. De twee gekozen cijfers blijven in dezelfde volgorde.`)];
    finalExpression=decimal(exponent);finalTex=C.tex(finalExpression);break;}
   case 'normaliseren':{
    const large=v%2===0,originalExponent=int(-4,5),exponent=originalExponent+(large?1:-1);expression=sign+(large?String(digits):'0.'+String(digits))+'*10^('+originalExponent+')';set(large?'normalizelarge':'normalizesmall',large?['normalizesmall','decimalright']:['normalizelarge','decimalleft']);
    stages=[normalized(exponent,'Zet de factor tussen 1 en 10 en pas de exponent mee aan.',large?'Je deelt de factor door 10. Maak de exponent daarom 1 groter: de waarde blijft gelijk.':'Je vermenigvuldigt de factor met 10. Maak de exponent daarom 1 kleiner: de waarde blijft gelijk.')];break;}
  }
  if(!finalTex)finalTex=fillScientific(stages.at(-1));
 }else{
  switch(s.kind){
   case 'factor':case 'vereenvoudigen':{
    const small=edition>=2,pool=v<2?[8,12,18,20]:v<4?[24,27,28,32,45,50]:[48,63,72,75,80,98],value=small?pick(pool):null,oldFactor=small?null:int(2,12),target=small?value:oldFactor*oldFactor*r,[f,rest]=small?radical(target):[oldFactor,r];expression=s.kind==='factor'?String(target):`sqrt(${target})`;set('square',['rootproduct','rootlike']);
    const beginner=small&&s.kind==='factor'&&v<3;
    const decomposition=stage(beginner?'Kies een kwadraatfactor en zoek de andere factor.':'Zoek de grootste kwadraatfactor.','[[0]]\\cdot[[1]]',[slot('Kwadraatfactor',f*f),slot('Restfactor',rest)],'([[0]])*([[1]])',beginner?'Een kwadraatfactor is een volkomen kwadraat. De twee factoren vormen samen het oorspronkelijke getal.':`De grootste kwadraatfactor is ${f*f} = ${f}².`);
    if(small){decomposition.squareChoices=[4,9,16,25,36,49];if(beginner)decomposition.accept='square-factor';note=v<2?'Start met een klein getal. Gebruik een kwadraat uit de knoppen.':'';}
    if(s.kind==='factor')stages=[decomposition];
    else{const first=stage('Ontbind onder de wortel.','\\sqrt{[[0]]\\cdot[[1]]}',decomposition.slots,'sqrt(([[0]])*([[1]]))',decomposition.explanation);if(small)first.squareChoices=decomposition.squareChoices;stages=[first,stage('Haal het kwadraat uit de wortel.','[[0]]\\sqrt{[[1]]}',[slot('Voor de wortel',f),slot('Onder de wortel',rest)],'([[0]])*sqrt([[1]])','Alleen de kwadraatfactor verdwijnt uit de wortel.')];}break;}
   case 'product':{
    const p=v%2?r:a*a*r,q=v%2?b*b*r:pick([2,3,5]),[f,rest]=radical(p*q);expression=`sqrt(${p})*sqrt(${q})`;condition='Beide getallen onder de wortel zijn niet negatief.';set('rootproduct',['rootlike','rootquotient']);stages=[stage('Vermenigvuldig onder de wortel.','\\sqrt{[[0]]}',[slot('Onder de wortel',p*q)],'sqrt([[0]])','Bij een product mag je de wortels samenbrengen.')];
    stages.push(rest===1?stage('Reken de volkomen kwadraatwortel uit.','[[0]]',[slot('Uitkomst',f)],'[[0]]','Dit getal is een volkomen kwadraat.'):stage('Vereenvoudig de wortel.','[[0]]\\sqrt{[[1]]}',[slot('Voor de wortel',f),slot('Onder de wortel',rest)],'([[0]])*sqrt([[1]])','Haal de grootste kwadraatfactor uit de wortel.'));break;}
   case 'quotient':{
    const p=a*a*(v%2?r:1),q=b*b,g=(x,y)=>y?g(y,x%y):x,d=g(a,b);expression=v%3===0?`sqrt(${p}/${q})`:`sqrt(${p})/sqrt(${q})`;condition='De teller is niet negatief; de noemer is positief.';set('rootquotient',['rootproduct','rootlike']);
    stages=[stage('Schrijf als één wortel van een breuk.','\\sqrt{\\frac{[[0]]}{[[1]]}}',[slot('Teller onder wortel',p),slot('Noemer onder wortel',q)],'sqrt(([[0]])/([[1]]))','Voor een wortel van een breuk geldt dezelfde regel.')];
    stages.push(v%2?stage('Vereenvoudig de wortels en de breuk.','\\frac{[[0]]}{[[1]]}\\sqrt{'+r+'}',[slot('Teller',a/d),slot('Noemer',b/d)],`(([[0]])/([[1]]))*sqrt(${r})`,'Haal de kwadraatfactoren uit de wortel en verkort de breuk.'):stage('Reken uit en verkort de breuk.','\\frac{[[0]]}{[[1]]}',[slot('Teller',a/d),slot('Noemer',b/d)],'([[0]])/([[1]])','Wortel teller en noemer apart; verkort daarna.'));break;}
   case 'macht':set('rootpower',['power','reciprocal']);
    if(v%3===0){expression=`sqrt(x^${2*n})`;condition='x > 0';stages=[stage('Schrijf als een macht van x.','x^{[[0]]}',[slot('Exponent',n)],'x^([[0]])','Omdat x positief is, is de wortel van x²ⁿ gelijk aan xⁿ.')];}
    else if(v%3===1){expression=`sqrt(x^${2*n+1})`;condition='x > 0';stages=[stage('Laat één factor x onder de wortel.','x^{[[0]]}\\sqrt{x}',[slot('Exponent buiten wortel',n)],'x^([[0]])*sqrt(x)','Splits de exponent in een even deel plus 1.')];}
    else{expression=`sqrt((-${a})^2)`;note='Een vierkantswortel geeft de niet-negatieve uitkomst.';stages=[stage('Let op het teken van de uitkomst.','[[0]]',[slot('Uitkomst',a)],'[[0]]','De wortel van a² is |a|. Ook bij een negatief getal is de uitkomst niet negatief.')];}break;
   case 'som':{
    if(v>=4){
     expression=v===4?`${a}sqrt(2)+${b}sqrt(3)+${n}sqrt(2)-sqrt(3)`:`sqrt(${a*a*2})+sqrt(${b*b*3})+${n}sqrt(2)-sqrt(3)`;
     set(v===4?'rootlike':'square',v===4?['rootproduct','invalidsum']:['rootproduct','rootlike']);
     if(v===5)stages.push(stage('Vereenvoudig eerst de wortels.','[[0]]\\sqrt2+[[1]]\\sqrt3+'+n+'\\sqrt2-\\sqrt3',[slot('Voor √2',a),slot('Voor √3',b)],`([[0]])*sqrt(2)+([[1]])*sqrt(3)+${n}sqrt(2)-sqrt(3)`,'Je krijgt twee soorten worteltermen: √2 en √3.'));
     stages.push(stage('Houd de twee soorten worteltermen apart.','[[0]]\\sqrt2+[[1]]\\sqrt3',[slot('Coëfficiënt √2',a+n),slot('Coëfficiënt √3',b-1)],'([[0]])*sqrt(2)+([[1]])*sqrt(3)','Neem alleen de termen met dezelfde wortel samen. √2 en √3 blijven aparte termen.'));break;
    }
    const p=int(2,5),q=int(2,5),c=int(1,6);expression=v%2?`${a}sqrt(${p*p*r})+${b}sqrt(${q*q*r})-${c}sqrt(${r})`:`${a}sqrt(${r})+${b}sqrt(${r})-${c}sqrt(${r})`;set(v%2?'square':'rootlike',v%2?['rootproduct','rootlike']:['rootproduct','invalidsum']);
    if(v%2)stages.push(stage('Vereenvoudig eerst de twee wortels.','[[0]]\\sqrt{'+r+'}+[[1]]\\sqrt{'+r+'}-'+c+'\\sqrt{'+r+'}',[slot('Eerste coëfficiënt',a*p),slot('Tweede coëfficiënt',b*q)],`([[0]])*sqrt(${r})+([[1]])*sqrt(${r})-${c}sqrt(${r})`,'Pas na het vereenvoudigen zie je de gelijksoortige wortels.'));
    const coeff=v%2?a*p+b*q-c:a+b-c;
    stages.push(stage('Neem de gelijksoortige worteltermen samen.','[[0]]\\sqrt{'+r+'}',[slot('Coëfficiënt',coeff)],`([[0]])*sqrt(${r})`,'De wortel blijft staan. Tel alleen de coëfficiënten op.'));break;}
   case 'regels':{
    if(v%3===0){const k=int(1,5),p=9*k*k,q=16*k*k;expression=`sqrt(${p}+${q})`;set('invalidsum',['rootproduct','rootlike']);note='Kun je deze wortel splitsen in twee wortels?';stages=[stage('Bereken beide kanten om te vergelijken.',`\\begin{aligned}\\sqrt{${p}+${q}}&=[[0]]\\\\\\sqrt{${p}}+\\sqrt{${q}}&=[[1]]\\end{aligned}`,[slot('Linkerkant',5*k),slot('Rechterkant',7*k)],null,`${5*k} ≠ ${7*k}. Je mag een wortel van een som dus niet zomaar splitsen.`)];finalExpression=String(5*k);}
    else if(v%3===1){const k=int(1,5),p=25*k*k,q=9*k*k;expression=`sqrt(${p}-${q})`;set('invaliddifference',['rootquotient','rootlike']);note='Kun je deze wortel splitsen in een verschil?';stages=[stage('Bereken beide kanten om te vergelijken.',`\\begin{aligned}\\sqrt{${p}-${q}}&=[[0]]\\\\\\sqrt{${p}}-\\sqrt{${q}}&=[[1]]\\end{aligned}`,[slot('Linkerkant',4*k),slot('Rechterkant',2*k)],null,`${4*k} ≠ ${2*k}. Ook bij een verschil mag je niet zomaar splitsen.`)];finalExpression=String(4*k);}
    else{expression=`sqrt(${a*a}*${b*b})`;set('rootproduct',['invalidsum','rootlike']);condition='De factoren onder de wortel zijn niet negatief.';stages=[stage('Bij een product mag je wél splitsen.','\\sqrt{'+a*a+'}\\cdot\\sqrt{'+b*b+'}=[[0]]',[slot('Uitkomst',a*b)],'[[0]]','Bij een product van niet-negatieve getallen geldt de productregel.')];}break;}
  }
 }
 // Deterministic shuffle, so answer position never teaches the rule.
 for(let i=choices.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
 const fill=(template,values)=>template.replace(/\[\[(\d+)\]\]/g,(_,i)=>values[i]);
 const final=finalExpression||fill(stages.at(-1).expression,stages.at(-1).slots.map(x=>x.answer));
 const answerTex=finalTex||(s.kind==='factor'?C.tex(final):C.tex(C.plain(C.parse(final).value)));
 return {id:s.id,seed:seed>>>0,index:v,expression,tex:C.tex(expression),condition,note,correct,choices,stages,answer:final,answerTex,...(rulePrompt?{rulePrompt}:{})};
}
function fill(template,values){return template.replace(/\[\[(\d+)\]\]/g,(_,i)=>values[i]);}
function fillScientific(s){return fill(s.template,s.slots.map(x=>x.answer));}
function checkStage(t,index,values){
 const s=t.stages[index];if(!s||!Array.isArray(values)||values.length!==s.slots.length)return{ok:false,message:'Vul elk vak in.'};
 if(values.some(v=>!/^[-]?\d{1,7}$/.test(String(v))))return{ok:false,message:'Vul elk vak in met een geheel getal.'};
 if(s.slots.some((x,i)=>x.choices&&!x.choices.includes(String(values[i]))))return{ok:false,message:'Kies één cijfer per cijfervak.'};
 if(s.accept==='square-factor'){
  const [factor,rest]=values.map(BigInt),root=BigInt(Math.floor(Math.sqrt(Math.max(0,Number(factor)))));
  if(factor<=1n||rest<=0n||root*root!==factor)return{ok:false,message:'De eerste factor moet een volkomen kwadraat groter dan 1 zijn. Kies een kwadraat uit de knoppen.'};
  if(factor*rest!==BigInt(t.expression))return{ok:false,message:'Het product klopt nog niet. Bereken de andere factor bij je gekozen kwadraat.'};
  return{ok:true,message:`Juist: ${factor} is een volkomen kwadraat en ${factor} · ${rest} = ${t.expression}.`};
 }
 if(s.slots.some((x,i)=>BigInt(values[i])!==BigInt(x.answer)))return{ok:false,message:'Kijk nog eens naar deze stap. '+s.explanation.replace(/\d+/g,'…')};
 if(s.expression){try{const actual=C.parse(fill(s.expression,values)),expected=C.parse(t.expression);if(C.signature(actual.value)!==C.signature(expected.value))return{ok:false,message:'Deze stap is niet gelijkwaardig.'};}catch{return{ok:false,message:'Deze waarden passen niet in de uitwerking.'};}}
 return{ok:true,message:s.explanation};
}
return Object.freeze({THEMES,STOPS:stops,stop,theme,make,fill,checkStage,practiceSkills,GOAL:6});
});
