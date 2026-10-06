/* Reading roles are local presentation choices, independent of accounts and progress. */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.LessonReaders=factory();})(globalThis,()=>{
 const teacher='LeraarBob';
 function resolve(reading,lesson,state={}){
  const role=reading||{lead:'teacher',pair:null},absent=new Set(Array.isArray(state.absent)?state.absent:[]),available=lesson.readers.filter(name=>!absent.has(name));
  const original=lesson.readerPairs[role.pair]||[],assigned=state.assignments?.[role.pair];
  let team=[...new Set((Array.isArray(assigned)?assigned:original).filter(name=>name===teacher||available.includes(name)))];
  if(!team.length&&original.length){const offset=((role.pair+1)*2)%Math.max(1,available.length);team=[...available.slice(offset),...available.slice(0,offset)].slice(0,2);}
  if(!team.length)team=[teacher];
  return {team,speakers:role.lead==='teacher'?[teacher]:role.lead==='pair'?team:[team[role.lead]||team[0]]};
 }
 return {resolve,teacher};
});
