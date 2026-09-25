/* Integers first; a fraction is an explicit choice, with directly selectable parts. */
(function(root){
'use strict';const C=root.RechtenWave;
function mount(w,{host,answers,footer,label='Uitkomst',submit,redraw,status,confirm='Controleer',inline=false,fixedFraction=false}){
 const fraction=fixedFraction||w.fraction||w.part===1||w.entry[1]!=='1';
 const output=document.createElement('div');output.className='wave-entry number-entry';
 const part=i=>`<button type="button" data-number-part="${i}" class="${w.part===i?'active':''}" aria-label="${i?'Noemer':'Getal of teller'}">${(w.entry[i]||'□').replace('-','−')}</button>`;
 output.innerHTML=`<span>${inline?'=':label+' = '}</span>${fraction?`<span class="number-fraction">${part(0)}${part(1)}</span>`:part(0)}`;host.append(output);
 output.querySelectorAll('[data-number-part]').forEach(b=>b.onclick=()=>{w.part=Number(b.dataset.numberPart);w.replace=true;redraw()});
 answers.classList.add('wave-keypad');
 const button=(text,fn,parent=answers)=>{const b=document.createElement('button');b.type='button';b.textContent=text;root.RechtenEquationEditor.activate(b,fn);parent.append(b);return b};
 for(const key of ['7','8','9','breuk','⌫','4','5','6','±','wis','1','2','3','0']){
  const b=button(key,()=>{
   if(key==='breuk'){w.fraction=true;w.part=1;w.replace=true}
   else if(key==='wis'){w.entry=fixedFraction?['','']:['','1'];w.part=0;w.fraction=fixedFraction;w.replace=false}
   else if(key==='⌫'){w.entry[w.part]=w.entry[w.part].slice(0,-1);w.replace=false;}
   else if(key==='±'){w.entry[w.part]=w.entry[w.part].startsWith('-')?w.entry[w.part].slice(1):'-'+w.entry[w.part];w.replace=false;}
   else if(w.replace||w.entry[w.part].length<6){w.entry[w.part]=w.replace?key:w.entry[w.part]+key;w.replace=false}
   redraw();
  });if(key==='breuk'&&fixedFraction){b.textContent='↓';b.setAttribute('aria-label','Naar de noemer')}if(key==='0')b.style.gridColumn='span 2';
 }
 button(confirm,()=>{const value=C.parse(w.entry.join('/'));if(!value){status.className='status bad';status.textContent='Vul een getal in. Bij een breuk mag de noemer niet nul zijn.';return}w.fraction=false;submit(value)},footer);
}
root.RechtenNumberEntry={mount};
})(globalThis);
