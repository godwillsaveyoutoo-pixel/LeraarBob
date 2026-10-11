'use strict';
const crypto=require('node:crypto');
// Deterministic persisted result fixtures, not simulated client scores.
async function seed(f){
 const rows=[];
 for(const [game,skill]of [['rechten','point'],['vectoren',require('../../games/vectoren/vector-core.js').TaskGenerator.skills[0].id],['algebra',require('../../games/algebra-trainer/battle-config.js').skills[0].id],['wortelbouw','build_1'],['bewerkingen',require('../../games/bewerkingen-trainer/core.js').SKILLS[0].id],['logicawereld','L01']]){
  const id=crypto.randomUUID(),deck=Array.from({length:5},(_,i)=>({skill,seed:i,variant:0}));
  await f.classroom.db.query("insert into axioma_private.vector_class_rooms(id,code,owner_id,phase,game,deck,seconds,round)values($1,$2,$3,'closed',$4,$5,60,3)",[id,crypto.randomBytes(3).toString('hex').toUpperCase(),f.ids.teacher,game,JSON.stringify(deck)]);
  for(const user of ['alex','sam'])await f.classroom.db.query('insert into axioma_private.vector_class_members(room_id,user_id,alias)values($1,$2,$3)',[id,f.ids[user],user]);
  await f.classroom.db.query("insert into axioma_private.vector_class_answers(room_id,user_id,round,answer,elapsed_ms,correct,points)values($1,$2,0,'{}',1000,true,870),($1,$2,1,'{}',2000,false,0),($1,$2,2,'{}',3000,null,0),($1,$3,0,'{}',1000,true,999)",[id,f.ids.alex,f.ids.sam]);
  rows.push({provider:'class',game,id});
 }
 const id=crypto.randomUUID();await f.numbers.db.query("insert into axioma_private.numbers_rooms(id,code,owner_id,activity,audience,phase,deck,round,seconds)values($1,'ABCDEF12',$2,'battle','class','finished',$3,2,60)",[id,f.ids.teacher,JSON.stringify(Array.from({length:3},(_,seed)=>({skill:require('../../games/bewerkingen-trainer/core.js').SKILLS[0].id,seed,level:1,variant:0})))]);
 await f.numbers.db.query('insert into axioma_private.numbers_members(room_id,user_id)values($1,$2)',[id,f.ids.alex]);
 await f.numbers.db.query("insert into axioma_private.numbers_answers(room_id,user_id,round,value,correct,points,xp)values($1,$2,0,'4',true,900,10),($1,$2,1,'5',false,0,0)",[id,f.ids.alex]);rows.push({provider:'numbers',game:'bewerkingen',id});
 const clay=crypto.randomUUID();await f.classroom.db.query("insert into axioma_private.clay_sessions(id,host_id,speed,status,os_mode,os_class,winner_id,ends_at)values($1,$2,8,'finished','classroom','TEST',$3,now())",[clay,f.ids.teacher,f.ids.sam]);
 await f.classroom.db.query('insert into axioma_private.clay_members(session_id,user_id,tab_id,streak,version,misses,participated)values($1,$2,$3,3,8,2,true)',[clay,f.ids.alex,crypto.randomUUID()]);
 await f.classroom.db.query("insert into axioma_private.clay_rewards(session_id,user_id,class_code,xp,winner)values($1,$2,'TEST',10,false)",[clay,f.ids.alex]);rows.push({provider:'clay',game:'kleiduifschieten',id:clay});
 return rows;
}
module.exports={seed};
