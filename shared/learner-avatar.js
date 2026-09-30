/* Central avatar hook. Add the supplied portrait assets to this allowlist later.
   Arbitrary profile URLs are never rendered. Until then, display the alias initials. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.LeraarBobAvatar=api;})(globalThis,()=>{
 const catalog=Object.freeze({});
 function initials(alias){const text=String(alias||'?').trim();return [...text].slice(0,2).join('').toLocaleUpperCase('nl');}
 function create(profile,doc=document){
  const span=doc.createElement('span');span.className='learner-avatar';span.setAttribute('aria-hidden','true');
  const id=profile?.avatar_id,path=Object.hasOwn(catalog,id)?catalog[id]:null;
  if(path){const img=doc.createElement('img');img.src=path;img.alt='';img.width=32;img.height=32;span.append(img);}else span.textContent=initials(profile?.alias);
  return span;
 }
 return Object.freeze({catalog,initials,create});
});
