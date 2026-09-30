/* User-supplied artwork, shown through a CSS viewport. Only catalog IDs are accepted. */
(function(root,factory){const api=factory(root);if(typeof module==='object')module.exports=api;else root.LeraarBobAvatar=api;})(globalThis,root=>{
 const source=root.document?.currentScript?.src;
 const assetRoot=source?new URL('../assets/avatars/',source).href:'assets/avatars/';
 // Crop coordinates are fractions of the original square sheet: x, y, side.
 const rows=[
  ['fox','Vos','woodland',[.052,.068,.245]],['owl','Uil','woodland',[.397,.123,.225]],['bear','Beer','woodland',[.733,.069,.245]],
  ['rabbit','Konijn','woodland',[.073,.532,.249]],['cat','Kat','woodland',[.403,.530,.235]],['whale','Walvis','woodland',[.672,.634,.260]],
  ['hedgehog','Egel','adventure',[.080,.130,.250]],['deer','Ree','adventure',[.407,.042,.232]],['penguin','Pinguïn','adventure',[.727,.098,.227]],
  ['turtle','Schildpad','adventure',[.145,.561,.185]],['squirrel','Eekhoorn','adventure',[.422,.542,.232]],['frog','Kikker','adventure',[.747,.608,.215]],
  ['red-panda','Rode panda','wildlife',[.057,.077,.250]],['elephant','Olifant','wildlife',[.339,.099,.302]],['seal','Zeehond','wildlife',[.695,.136,.255]],
  ['parrot','Papegaai','wildlife',[.085,.521,.224]],['moose','Eland','wildlife',[.399,.511,.247]],['chameleon','Kameleon','wildlife',[.681,.550,.231]],
  ['raccoon','Wasbeer','friends',[.065,.074,.252]],['koala','Koala','friends',[.383,.083,.270]],['duck','Eend','friends',[.703,.093,.227]],
  ['octopus','Octopus','friends',[.083,.578,.239]],['lion','Leeuw','friends',[.390,.537,.266]],['llama','Lama','friends',[.688,.520,.248]]
 ];
 const catalog=Object.freeze(Object.fromEntries(rows.map(([id,label,sheet,crop])=>[id,Object.freeze({id,label,sheet:'chalk-'+sheet+'.webp',crop:Object.freeze(crop)})])));
 const valid=id=>typeof id==='string'&&Object.hasOwn(catalog,id);
 function initials(alias){const text=String(alias||'?').trim();return [...text].slice(0,2).join('').toLocaleUpperCase('nl');}
 function create(profile,doc=root.document){
  const span=doc.createElement('span');span.className='learner-avatar';span.setAttribute('aria-hidden','true');
  Object.assign(span.style,{display:'inline-grid',placeItems:'center',width:'var(--avatar-size,32px)',height:'var(--avatar-size,32px)',flex:'none',overflow:'hidden',verticalAlign:'middle',backgroundColor:'#20352d',color:'#f8f3df',font:'700 12px/1 system-ui'});
  const item=valid(profile?.avatar_id)?catalog[profile.avatar_id]:null;
  if(item){const [x,y,size]=item.crop;span.dataset.avatarId=item.id;span.style.backgroundImage=`url("${assetRoot+item.sheet}")`;span.style.backgroundRepeat='no-repeat';span.style.backgroundSize=`${100/size}%`;span.style.backgroundPosition=`${100*x/(1-size)}% ${100*y/(1-size)}%`;}
  else span.textContent=initials(profile?.alias||(profile?.role==='teacher'?'LB':'?'));
  return span;
 }
 return Object.freeze({catalog,valid,initials,create});
});
