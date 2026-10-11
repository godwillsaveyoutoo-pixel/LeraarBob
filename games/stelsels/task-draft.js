/* Saved student work is untrusted, including the presentation text in snapshots. */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.StelselsTaskDraft=factory();})(globalThis,()=>{
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function mathMarkup(value){
  // Only the tiny, fixed math markup produced by this renderer may survive.
  return escape(value).replace(/&lt;br\s*\/?&gt;/g,'<br>').replace(/&amp;nbsp;/g,'&nbsp;')
   .replace(/&lt;span class=&quot;(frac|num|bar|den)&quot;&gt;/g,'<span class="$1">').replace(/&lt;\/span&gt;/g,'</span>');
 }
 function clean(v,snapshots=false,depth=0){
  if(depth>30)throw Error('Ongeldige tussenstappen.');
  if(typeof v==='string')return snapshots?mathMarkup(v):escape(v);
  if(Array.isArray(v))return v.map(x=>clean(x,snapshots,depth+1));
  if(v&&typeof v==='object'){const out={};for(const [key,x]of Object.entries(v)){if(['__proto__','constructor','prototype'].includes(key))continue;out[key]=clean(x,snapshots||key==='snapshots',depth+1);}return out;}
  return v;
 }
 return {clean,escape};
});
