/* Pure, order-preserving A4 row packing. The subject owns its questions and answers. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.LeraarBobWorksheetLayout=api})(globalThis,()=>{
'use strict';
function paginate(items,{height=228,gap=6}={}){
 const pages=[];let page=[],row=null,used=0;
 function finishRow(){if(!row)return;const extra=row.height+(page.length?gap:0);if(used+extra>height){pages.push(page);page=[];used=0}page.push(row);used+=row.height+(page.length>1?gap:0);row=null;}
 for(const item of items){
  if(!Number.isFinite(item.height)||item.height<=0||item.height>height||![1,2].includes(item.span))throw Error('Ongeldige werkbladruimte');
  if(row&&row.span+item.span>2)finishRow();
  row||={items:[],span:0,height:0};row.items.push(item);row.span+=item.span;row.height=Math.max(row.height,item.height);
  if(row.span===2)finishRow();
 }
 finishRow();if(page.length)pages.push(page);return pages;
}
return Object.freeze({paginate});
});
