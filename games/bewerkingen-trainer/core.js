/* Exact arithmetic for rational coefficients, positive letters and square roots.
   No floating point answer comparison and no evaluation of user-supplied code. */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.BewerkingenCore=factory();})(globalThis,()=>{
'use strict';
const letters=['a','b','c','x','y'];
const gcd=(a,b)=>{a=a<0n?-a:a;while(b){[a,b]=[b,a%b];}return a;};
function q(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)throw Error('Delen door nul kan niet.');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};}
const plus=(a,b)=>q(a.n*b.d+b.n*a.d,a.d*b.d),times=(a,b)=>q(a.n*b.n,a.d*b.d),inv=a=>q(a.d,a.n);
function powq(a,k){return k<0?powq(inv(a),-k):q(a.n**BigInt(k),a.d**BigInt(k));}
function factor(n){if(n<0n||n>10000000000n)throw Error('Deze wortel is te groot of niet reëel.');if(n===0n)return[0n,1n];let outer=1n,inner=1n;for(let p=2n;p*p<=n;p++){let k=0;while(n%p===0n){n/=p;k++;}outer*=p**BigInt(Math.floor(k/2));if(k%2)inner*=p;}return[outer,inner*n];}
const key=(r=1n,e=[0,0,0,0,0])=>r+':'+e.join(',');
function term(c=q(1),r=1n,e=[0,0,0,0,0]){return new Map(c.n?[[key(r,e),c]]:[]);}
function unpack(k){const [r,e]=k.split(':');return {r:BigInt(r),e:e.split(',').map(Number)};}
function add(a,b,sign=1){const out=new Map(a);for(const[k,c]of b){const v=plus(out.get(k)||q(0),times(c,q(sign)));if(v.n)out.set(k,v);else out.delete(k);}if(out.size>20)throw Error('Houd het antwoord kort.');return out;}
function mul(a,b){let out=new Map();for(const[k,c]of a)for(const[l,d]of b){const u=unpack(k),v=unpack(l),g=gcd(u.r,v.r);out=add(out,term(times(times(c,d),q(g)),u.r/g*(v.r/g),u.e.map((x,i)=>x+v.e[i])));}return out;}
function invert(a){if(a.size!==1)throw Error('Gebruik één term in de noemer.');const[k,c]=[...a][0],{r,e}=unpack(k);return term(times(inv(c),q(1,r)),r,e.map(x=>-x));}
function power(a,n){if(!Number.isInteger(n)||Math.abs(n)>60)throw Error('Gebruik een gehele exponent van −60 tot 60.');if(n<0)return power(invert(a),-n);let out=term();for(let i=0;i<n;i++)out=mul(out,a);return out;}
function root(a){if(!a.size)return new Map();if(a.size!==1)throw Error('Gebruik één term onder de wortel.');const[k,c]=[...a][0],{r,e}=unpack(k);if(r!==1n||e.some(x=>x%2)||c.n<0n)throw Error('Deze wortelvorm wordt hier niet gebruikt.');const[o,s]=factor(c.n*c.d);return term(q(o,c.d),s,e.map(x=>x/2));}
function normalize(s){
 return String(s).trim().replace(/[−–]/g,'-').replace(/[×·⋅]/g,'*').replace(/:/g,'/').replace(/,/g,'.').replace(/\s+/g,'').replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)/g,v=>'^('+[...v].map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹⁻'.indexOf(c)===10?'-':String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c))).join('')+')');
}
function parse(input){
 const s=normalize(input);if(!s||s.length>180)throw Error('Vul een kort antwoord in.');let i=0,nodes=0;
 function node(type,value,args=[]){if(++nodes>80)throw Error('Houd het antwoord kort.');return {type,value,args};}
 function sum(){let a=product();while(s[i]==='+'||s[i]==='-'){const op=s[i++],b=product();a=node(op,add(a.value,b.value,op==='+'?1:-1),[a,b]);}return a;}
 function product(){let a=unary();while(i<s.length){const op=s[i];if(op==='*'||op==='/'){i++;const b=unary();a=node(op,op==='*'?mul(a.value,b.value):mul(a.value,invert(b.value)),[a,b]);}else if(/[a-z0-9(√]/.test(op)){const b=unary();a=node('*',mul(a.value,b.value),[a,b]);}else break;}return a;}
 function unary(){if(s[i]==='+'||s[i]==='-'){const op=s[i++],a=unary();return node('sign',op==='-'?mul(term(q(-1)),a.value):a.value,[a]);}return powered();}
 function powered(){let a=atom();if(s[i]==='^'){i++;const paren=s[i]==='(';if(paren)i++;const hit=s.slice(i).match(/^[+-]?\d{1,2}/);if(!hit)throw Error('Schrijf de exponent als een geheel getal.');i+=hit[0].length;if(paren&&s[i++]!==')')throw Error('Sluit de exponent met ).');a=node('^',power(a.value,Number(hit[0])),[a]);a.exponent=Number(hit[0]);}return a;}
 function atom(){
  if(s.startsWith('sqrt',i)||s[i]==='√'){i+=s[i]==='√'?1:4;let a;if(s[i]==='('){i++;a=sum();if(s[i++]!==')')throw Error('Sluit de wortel met ).');}else a=powered();return node('root',root(a.value),[a]);}
  if(s[i]==='('){i++;const a=sum();if(s[i++]!==')')throw Error('Sluit de haakjes met ).');return a;}
  const hit=s.slice(i).match(/^\d+(?:\.\d+)?/);if(hit){i+=hit[0].length;const [a,b='']=hit[0].split('.');if((a+b).length>28)throw Error('Getal te lang.');return node('number',term(q(a+b,10n**BigInt(b.length))));}
  const at=letters.indexOf(s[i]);if(at>=0){i++;const e=[0,0,0,0,0];e[at]=2;const a=node('letter',term(q(1),1n,e));a.letter=letters[at];return a;}
  throw Error('Gebruik getallen, a, b, c, x, y, machten, breuken en sqrt(...).');
 }
 const ast=sum();if(i!==s.length)throw Error('Controleer je notatie bij '+s.slice(i)+'.');return ast;
}
function signature(poly){return [...poly].sort(([a],[b])=>a.localeCompare(b)).map(([k,c])=>k+'='+c.n+'/'+c.d).join(';');}
function cost(ast){return 1+ast.args.reduce((n,a)=>n+cost(a),0);}
function reduced(ast){
 if(ast.type==='root'){
  if(ast.value.size!==1)return false;
  const [k,c]=[...ast.value][0],{r,e}=unpack(k);
  if(c.n!==1n||c.d!==1n||e.some(v=>v!==0&&v!==1)||(r===1n&&e.every(v=>v===0)))return false;
 }
 if(ast.type==='^'&&ast.exponent<0)return false;
 if(ast.type==='/'&&ast.args.every(a=>a.type==='number')){
  const a=[...ast.args[0].value.values()][0]||q(0),b=[...ast.args[1].value.values()][0];
  if(a.d===1n&&b.d===1n&&gcd(a.n,b.n)>1n)return false;
 }
 return ast.args.every(reduced);
}
function plain(poly){if(!poly.size)return '0';return [...poly].sort(([a],[b])=>a.localeCompare(b)).map(([k,c],index)=>{
 const{r,e}=unpack(k),negative=c.n<0n,abs=q(negative?-c.n:c.n,c.d);let num='',den='',inside='';
 for(let j=0;j<e.length;j++){const p=e[j],whole=Math.floor(p/2),rem=p-2*whole;if(whole>0)num+=letters[j]+(whole===1?'':`^${whole}`);if(whole<0)den+=letters[j]+(whole===-1?'':`^${-whole}`);if(rem)inside+=letters[j];}
 if(r!==1n)inside=r+inside;if(inside)num+=`sqrt(${inside})`;
 if(abs.n!==1n||!num)num=abs.n+num;if(abs.d!==1n)den=abs.d+den;
 const body=den?`${num}/(${den})`:num;
 return (negative?'-':index?'+':'')+body;
 }).join('');}
function tex(input){
 // Render the original expression, preserving the question structure.
 const s=normalize(input);let i=0;
 function sum(){let a=product();while(s[i]==='+'||s[i]==='-'){const op=s[i++];a+=` ${op} `+product();}return a;}
 function product(){let a=unary();while(i<s.length){const op=s[i];if(op==='*'||op==='/'){i++;const b=unary();a=op==='/'?`\\frac{${a}}{${b}}`:a+' \\cdot '+b;}else if(/[a-z0-9(√]/.test(op))a+='\\,'+unary();else break;}return a;}
 function unary(){if(s[i]==='+'||s[i]==='-')return s[i++]+unary();return powered();}
 function powered(){let a=atom();if(s[i]==='^'){i++;let exponent;if(s[i]==='('){i++;const start=i;while(i<s.length&&s[i]!==')')i++;exponent=s.slice(start,i);i++;}else{const m=s.slice(i).match(/^[+-]?\d+/);if(!m)throw Error('Exponent');exponent=m[0];i+=m[0].length;}a+=`^{${exponent}}`;}return a;}
 function atom(){if(s.startsWith('sqrt',i)||s[i]==='√'){i+=s[i]==='√'?1:4;let a;if(s[i]==='('){i++;a=sum();i++;}else a=powered();return `\\sqrt{${a}}`;}
 if(s[i]==='('){i++;const a=sum();i++;return `\\left(${a}\\right)`;}const m=s.slice(i).match(/^\d+(?:\.\d+)?|^[abcxy]/);if(!m)throw Error('Notatie');i+=m[0].length;return m[0].replace('.','{,}');}
 const out=sum();if(i!==s.length)throw Error('Notatie');return out;
}
const SKILLS=[
 ['power-power','machten','Macht van een macht','Vermenigvuldig de exponenten.'],
 ['power-product','machten','Machten vermenigvuldigen','Tel de exponenten van dezelfde letter op.'],
 ['power-quotient','machten','Machten delen','Trek de exponenten van dezelfde letter af.'],
 ['power-monomial','machten','Macht van een eenterm','Verhef elke factor tot de macht.'],
 ['power-negative','machten','Negatieve machten en breuken','Een negatieve exponent keert de breuk om.'],
 ['power-mixed','machten','Gemengde bewerkingen','Werk producten uit en deel daarna.'],
 ['scientific','wetenschappelijk','Wetenschappelijke schrijfwijze','Schrijf een factor van 1 tot 10 maal een macht van 10.'],
 ['square-factor','wortels','Ontbinden met een kwadraatfactor','Zoek een volkomen kwadraat dat het getal deelt, bijvoorbeeld 4, 9, 16, 25 of 36.'],
 ['root-product','wortels','Wortels vermenigvuldigen','Vermenigvuldig de getallen onder de wortels.'],
 ['root-quotient','wortels','Wortels delen','Deel de getallen onder de wortels.'],
 ['root-fraction','wortels','Wortel van een breuk','Neem de wortel van teller en noemer.'],
 ['root-power','wortels','Wortels en machten','Splits even machten af als kwadraten.'],
 ['root-simplify','wortels','Vierkantswortels vereenvoudigen','Haal de grootste kwadraatfactor buiten de wortel.'],
 ['root-letters','wortels','Wortels met letters','Haal paren van gelijke letters buiten de wortel.'],
 ['root-sum','wortels','Gelijksoortige wortels','Tel alleen termen met dezelfde wortel op.'],
 ['root-sum-mixed','wortels','Eerst vereenvoudigen, dan optellen','Vereenvoudig de wortels vóór je termen samenneemt.']
].map(([id,group,label,hint])=>({id,group,label,hint}));
const GROUPS=[{id:'machten',label:'Machten & letters'},{id:'wetenschappelijk',label:'Wetenschappelijke schrijfwijze'},{id:'wortels',label:'Vierkantswortels'}];
// Missing versions are historical tasks. Opt into the new progression only when
// the caller can save/send the version alongside the original seed and level.
const SCIENTIFIC_VERSION=2;
const SCIENTIFIC_LEVELS=Object.freeze([
 Object.freeze({level:0,label:'Start',description:'Grote gehele getallen met één significant cijfer; positieve exponenten van 2 tot 6.'}),
 Object.freeze({level:1,label:'Basis',description:'Grote en kleine getallen met twee of drie significante cijfers; exponenten van −6 tot 7.'}),
 Object.freeze({level:2,label:'Verdieping',description:'Heel grote en heel kleine getallen met vier of vijf significante cijfers en nullen in het voorgetal; exponenten tot ±20.'})
]);
function decimal(digits,exponent){const point=1+exponent;if(point<=0)return '0.'+'0'.repeat(-point)+digits;if(point>=digits.length)return digits+'0'.repeat(point-digits.length);return digits.slice(0,point)+'.'+digits.slice(point);}
function generate(skill,seed=1,level=1,variant=0,generatorVersion=1){
 if(!SKILLS.some(s=>s.id===skill)||!Number.isInteger(seed)||seed<0||seed>4294967295||![0,1,2].includes(level)||!Number.isInteger(variant)||variant<0||variant>3||![1,SCIENTIFIC_VERSION].includes(generatorVersion))throw Error('Ongeldige opgave.');
 let state=(seed^Math.imul(variant+1,2654435761))>>>0;const rnd=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;},pick=a=>a[Math.floor(rnd()*a.length)],int=(a,b)=>a+Math.floor(rnd()*(b-a+1));
 const a=int(2,level===0?4:7),b=int(2,5),n=int(2,level===0?3:5),m=int(2,6),r=pick([2,3,5,6,7]),x=pick(['x','a','b']);let expression,steps=[],condition='',answer;
 switch(skill){
 case 'power-power':expression=`(${x}^${m})^${n}`;steps=[`${x}^{${m}\\cdot ${n}}`];break;
 case 'power-product':{const k=level===0?int(1,5):int(-6,5);expression=`${x}^${m}*${x}^(${k})`;steps=[`${x}^{${m}+(${k})}`];condition=`${x} ≠ 0`;break;}
 case 'power-quotient':{const k=level===0?int(1,m):int(-6,8);expression=`${x}^${m}/${x}^(${k})`;steps=[`${x}^{${m}-(${k})}`];condition=`${x} ≠ 0`;break;}
 case 'power-monomial':{const c=level===0?a:-a;expression=level===2?`(${c}x^${m}y)^${n}`:`(${c}${x}^${m})^${n}`;steps=[`${c<0?'('+c+')':c}^{${n}}\\cdot ${level===2?'x':x}^{${m}\\cdot ${n}}${level===2?`\\cdot y^{${n}}`:''}`];break;}
 case 'power-negative':expression=level===0?`${x}^(-${n})`:`(${a}${x}/${b})^(-${n})`;steps=[level===0?`\\frac{1}{${x}^{${n}}}`:`\\left(\\frac{${b}}{${a}${x}}\\right)^{${n}}`];condition=`${x} ≠ 0`;break;
 case 'power-mixed':{const kind=level===0?'compound':pick(['product','quotient','compound']);
 if(kind==='product'){expression=`(-${a}${x}^${m})*(${b}${x}^${n})`;steps=[`(-${a})\\cdot ${b}\\cdot ${x}^{${m}+${n}}`];}
 else if(kind==='quotient'){expression=`(${a}${x}^${m})/(-${a*b}${x}^${n})`;steps=[`\\frac{${a}}{-${a*b}}\\cdot ${x}^{${m}-${n}}`];}
 else{expression=`(${x}*${x}^${m})/${x}^${n}`;steps=[`\\frac{${x}^{1+${m}}}{${x}^{${n}}}`,`${x}^{${1+m}-${n}}`];}
 condition=kind==='product'?'':`${x} ≠ 0`;break;}

 case 'scientific':{
 const digits=generatorVersion===1?(level===0?pick(['4','17','82']):pick(['499','10845','332','43','214','82','17'])):pick(level===0?['2','3','4','5','6','7','8','9']:level===1?['17','24','43','82','125','214','332','499']:['1005','10204','12004','40801','90807','10304','4007','8009']);
 const exponent=generatorVersion===1?pick(level===0?[-4,-2,3,5,8]:[-14,-7,-4,-1,5,8,9,14]):pick(level===0?[2,3,4,5,6]:level===1?[-6,-5,-4,-3,-2,-1,1,2,3,4,5,6,7]:[-20,-16,-12,-9,-7,9,12,16,20]);
 expression=decimal(digits,exponent);answer=(digits.length===1?digits:digits[0]+'.'+digits.slice(1))+`*10^(${exponent})`;steps=[`\\text{Verplaats de komma ${Math.abs(exponent)} plaatsen ${exponent>=0?'naar links':'naar rechts'}.}`];break;}
 case 'square-factor':{
 const base=int(2,level===0?5:level===1?10:15),rest=pick(level===0?[2,3,5]:level===1?[2,3,5,7,11]:[2,3,5,6,7,10,11,13]);
 const value=base*base*rest,[outer,inner]=factor(BigInt(value));expression=String(value);answer=`${inner}*${outer}^2`;
 steps=[`${value}= ${inner}\\cdot ${outer*outer}`,`${value}= ${inner}\\cdot ${outer}^{2}`];break;
 }
 case 'root-product':expression=level===0?`sqrt(${a*a}*${b*b})`:`sqrt(${r})*sqrt(${r*a*a})`;steps=[`\\sqrt{${level===0?a*a*b*b:r*r*a*a}}`];break;
 case 'root-quotient':{const numerator=level===2&&variant%2?r*a:r*a*a,denominator=level===2&&variant%2?a:r;expression=`sqrt(${numerator})/sqrt(${denominator})`;steps=[`\\sqrt{\\frac{${numerator}}{${denominator}}}`,`\\sqrt{${numerator/denominator}}`];break;}
 case 'root-fraction':expression=`sqrt(${a*a}/${b*b})`;steps=[`\\frac{\\sqrt{${a*a}}}{\\sqrt{${b*b}}}`,`\\frac{${a}}{${b}}`];break;
 case 'root-power':expression=level===0?`sqrt(${a}^2)`:pick([`(sqrt(${r}))^2`,`sqrt(${a*a}^${n})`,`sqrt(${r}^3)`]);
 steps=expression===`sqrt(${r}^3)`?[`\\sqrt{${r}^2\\cdot ${r}}`,`${r}\\sqrt{${r}}`]:expression===`sqrt(${a*a}^${n})`?[`(\\sqrt{${a*a}})^{${n}}`,`${a}^{${n}}`]:[tex(plain(parse(expression).value))];break;
 case 'root-simplify':expression=`sqrt(${a*a*r})`;steps=[`\\sqrt{${a*a}\\cdot ${r}}`,`${a}\\sqrt{${r}}`];break;
 case 'root-letters':{expression=level===0?`sqrt(${x}^${2*n+1})`:level===1?`sqrt(${a*a}${x}^${2*n+1})`:pick([`sqrt(${a*a}a^3b^7c^2)`,`sqrt(a^8b^6)`,`sqrt(b)*sqrt(b^4)*sqrt(b^3)`]);condition='Alle gebruikte letters zijn strikt positief.';
 if(level===0)steps=[`\\sqrt{${x}^{${2*n}}\\cdot ${x}}`];
 else if(level===1)steps=[`\\sqrt{${a*a}\\cdot ${x}^{${2*n}}\\cdot ${x}}`];
 else if(expression==='sqrt(a^8b^6)')steps=['\\sqrt{(a^4b^3)^2}'];
 else if(expression.startsWith('sqrt(b)'))steps=['\\sqrt{b^{1+4+3}}','\\sqrt{b^8}'];
 else steps=[`\\sqrt{${a*a}a^2b^6c^2\\cdot ab}`];break;}
 case 'root-sum':expression=level===2?`${a}sqrt(14)-${b}sqrt(7)+${n}sqrt(14)+sqrt(7)`:`${a}sqrt(${r})-${b}sqrt(${r})+${n}sqrt(${r})+sqrt(${r})`;steps=[level===2?`(${a}+${n})\\sqrt{14}+(-${b}+1)\\sqrt{7}`:`(${a}-${b}+${n}+1)\\sqrt{${r}}`];break;
 case 'root-sum-mixed':expression=level===2?'sqrt(75)+sqrt(50)-3sqrt(18)+sqrt(48)':`${a}sqrt(${r})-sqrt(${b*b*r})+sqrt(${n*n*r})`;steps=[level===2?'5\\sqrt{3}+5\\sqrt{2}-9\\sqrt{2}+4\\sqrt{3}':`${a}\\sqrt{${r}}-${b}\\sqrt{${r}}+${n}\\sqrt{${r}}`];break;
 }
 answer=answer||plain(parse(expression).value);const answerTex=tex(answer);if(skill!=='square-factor'&&steps.at(-1)!==answerTex)steps.push(answerTex);
 const versioned=skill==='scientific'&&generatorVersion===SCIENTIFIC_VERSION;
 return {id:`${skill}:${seed}:${level}:${variant}${versioned?':v'+SCIENTIFIC_VERSION:''}`,skill,seed,level,variant,...(versioned?{generatorVersion:SCIENTIFIC_VERSION}:{}),expression,tex:tex(expression),answer,answerTex,steps,condition,hint:SKILLS.find(s=>s.id===skill).hint,...(skill==='square-factor'?{instruction:'Schrijf het getal als een product van twee natuurlijke factoren. Minstens één factor is een volkomen kwadraat.',answerLabel:'Jouw product van twee factoren',inputHelp:'Typ bijvoorbeeld 3*2^2 of 3*4. Je mag de factoren ook omwisselen.'}:{})};
}
function check(task,input){
 try{const actual=parse(input),expected=parse(task.answer);
 if(signature(actual.value)!==signature(expected.value))return {ok:false,message:'Nog niet juist. '+task.hint};
 if(task.skill==='square-factor'){
 const naturalFactor=ast=>{
  if(ast.type!=='number'&&!(ast.type==='^'&&ast.args[0].type==='number'&&ast.exponent>=0))return null;
  if(ast.value.size!==1)return null;const[k,c]=[...ast.value][0];
  return k===key()&&c.d===1n&&c.n>0n?c.n:null;
 };
 const values=actual.type==='*'&&actual.args.length===2?actual.args.map(naturalFactor):[];
 if(values.length!==2||values.some(v=>v===null))return {ok:false,message:'Schrijf een product van precies twee natuurlijke factoren, bijvoorbeeld 3*2^2.'};
 if(!values.some(v=>factor(v)[1]===1n))return {ok:false,message:'Het product klopt, maar geen van beide factoren is een volkomen kwadraat. '+task.hint};
 return {ok:true,message:'Juist! Het product klopt en minstens één factor is een volkomen kwadraat.'};
 }
 if(task.skill==='scientific'){
 const match=normalize(input).match(/^([1-9](?:\.\d+)?)\*10\^\(?([+-]?\d+)\)?$/);
 if(!match||Number(match[1])>=10)return {ok:false,message:'De waarde klopt. Schrijf ze als a · 10ⁿ met 1 ≤ a < 10.'};
 }else if(!reduced(actual)||cost(actual)>cost(expected))return {ok:false,message:'De waarde klopt. Vereenvoudig verder: neem gelijke machten of worteltermen samen en haal kwadraatfactoren uit de wortel. Gebruik positieve exponenten.'};
 return {ok:true,message:'Juist. Mooi vereenvoudigd!'};
 }catch(e){return {ok:false,message:e.message};}
}
return Object.freeze({SKILLS,GROUPS,SCIENTIFIC_VERSION,SCIENTIFIC_LEVELS,generate,check,parse,plain,tex,signature,normalize});
});
