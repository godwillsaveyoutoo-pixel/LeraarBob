/* One classroom entry flow; native controls, handlers and providers remain in charge. */
(()=>{
'use strict';
const mounts=new WeakMap();
const nodes=value=>(Array.isArray(value)?value:[value]).filter(Boolean);
function element(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}
function restore(host){const m=mounts.get(host);if(!m)return;const focus=host.ownerDocument.activeElement;for(const {node,anchor}of m.moved){if(anchor.parentNode)anchor.replaceWith(node);}for(const {node,hidden}of m.hidden)node.hidden=hidden;m.shell.remove();host.classList.remove('lb-class-host');mounts.delete(host);if(focus?.isConnected)focus.focus({preventScroll:true});if(!document.querySelector('.lb-class-flow'))delete document.body.dataset.classFlow;}
function mount(host,kind,options){
 const fields=kind==='setup'?['topic','skills','options','help','submit','secondary']:['code','members','count','help','start','copy','stop','secondary'];
 const original=fields.flatMap(key=>nodes(options[key])),signature=JSON.stringify([kind,options.world,!!options.simulation,options.stopLabel]);
 const previous=mounts.get(host);if(previous&&previous.signature===signature&&previous.original.length===original.length&&previous.original.every((node,i)=>node===original[i])){document.body.dataset.classFlow=kind;return previous;}
 restore(host);const focus=host.ownerDocument.activeElement,m={original,signature,moved:[],hidden:[],shell:element('section','lb-class-flow lb-class-'+kind)};
 m.shell.setAttribute('aria-label',kind==='setup'?'Klasbattle instellen':'Wachtkamer');
 for(const child of [...host.children]){m.hidden.push({node:child,hidden:child.hidden});child.hidden=true;}
 function move(value,to){for(const node of nodes(value)){const anchor=document.createComment('class-flow original');node.before(anchor);m.moved.push({node,anchor});node.hidden=false;to.append(node);}}
 const eyebrow=element('p','lb-class-eyebrow',options.world||'Klasbattle');m.shell.append(eyebrow,element('h2','lb-class-title',kind==='setup'?'Klasbattle instellen':'Wachtkamer'));
 const steps=element('ol','lb-class-steps');for(const [i,label]of ['Leerstof','Instellingen','Wachtkamer'].entries()){const li=element('li','',label);if(i===(kind==='setup'?0:2))li.setAttribute('aria-current','step');steps.append(li);}m.shell.append(steps);
 if(options.simulation)m.shell.append(element('p','lb-class-simulation','Simulatie · virtuele leerlingen · geen leerlingresultaten'));
 if(kind==='setup'){
  const columns=element('div','lb-class-columns'),lesson=element('section','lb-class-card'),settings=element('section','lb-class-card');lesson.append(element('h3','','Leerstof'));settings.append(element('h3','','Instellingen'));move(options.topic,lesson);move(options.skills,lesson);const controls=element('div','lb-class-options');move(options.options,controls);settings.append(controls);columns.append(lesson,settings);m.shell.append(columns);
  const help=element('div','lb-class-help');move(options.help,help);m.shell.append(help);const actions=element('div','lb-class-actions');move(options.secondary,actions);move(options.submit,actions);for(const submit of nodes(options.submit))submit.textContent=options.simulation?'Start simulatie':'Maak klasbattle';m.shell.append(actions);
 }else{
  const columns=element('div','lb-class-columns'),invite=element('section','lb-class-card lb-class-invite'),members=element('section','lb-class-card');invite.append(element('h3','','Deel de code'));move(options.code,invite);move(options.copy,invite);for(const copy of nodes(options.copy))copy.textContent='Kopieer deelnamelink';members.append(element('h3','','Deelnemers'));move(options.members,members);move(options.count,members);columns.append(invite,members);m.shell.append(columns);const help=element('div','lb-class-help');move(options.help,help);m.shell.append(help);const actions=element('div','lb-class-actions');move(options.secondary,actions);move(options.stop,actions);move(options.start,actions);for(const start of nodes(options.start))start.textContent='Start klasbattle';for(const stop of nodes(options.stop))stop.textContent=options.stopLabel||'Sessie afsluiten';m.shell.append(actions);
 }
 host.append(m.shell);host.classList.add('lb-class-host');mounts.set(host,m);document.body.dataset.classFlow=kind;if(focus?.isConnected)focus.focus({preventScroll:true});return m;
}
window.LeraarBobClassActivityFlow=Object.freeze({setup:(host,options)=>mount(host,'setup',options),lobby:(host,options)=>mount(host,'lobby',options),restore});
})();
