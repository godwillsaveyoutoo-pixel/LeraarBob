/* Finished local battles only; separate from personal learning progress. */
(function(root){
'use strict';
const KEY='leraarbob-vectorbattle-ranking-v1',LIMIT=500;
const name=value=>String(value||'').normalize('NFC').trim().replace(/\s+/g,' ').slice(0,24);
const identity=value=>name(value).toLocaleLowerCase('nl');
function valid(m){return m&&typeof m.id==='string'&&m.id.length<=100&&Number.isFinite(m.at)&&Array.isArray(m.names)&&m.names.length===2&&m.names.every(n=>typeof n==='string'&&name(n))&&identity(m.names[0])!==identity(m.names[1])&&[5,10].includes(m.rounds)&&Array.isArray(m.scores)&&m.scores.length===2&&m.scores.every(n=>Number.isInteger(n)&&n>=0&&n<=m.rounds)&&m.scores[0]+m.scores[1]<=m.rounds;}
function sanitize(value){const seen=new Set();return {matches:(Array.isArray(value?.matches)?value.matches:[]).filter(m=>{if(!valid(m)||seen.has(m.id))return false;seen.add(m.id);return true}).slice(-LIMIT).map(m=>({id:m.id,at:m.at,names:m.names.map(name),scores:[...m.scores],rounds:m.rounds}))};}
function record(state,match){const clean=sanitize(state);if(!valid(match)||clean.matches.some(m=>m.id===match.id))return clean;return sanitize({matches:[...clean.matches,match]});}
function standings(state){
 const players=new Map();
 for(const match of sanitize(state).matches)for(let i=0;i<2;i++){
  const key=identity(match.names[i]),entry=players.get(key)||{name:match.names[i],played:0,wins:0,draws:0,points:0,roundPoints:0};
  entry.name=match.names[i];entry.played++;entry.roundPoints+=match.scores[i];
  if(match.scores[i]>match.scores[1-i]){entry.wins++;entry.points+=3;}else if(match.scores[i]===match.scores[1-i]){entry.draws++;entry.points++;}
  players.set(key,entry);
 }
 const rows=[...players.values()].sort((a,b)=>b.points-a.points||b.wins-a.wins||a.name.localeCompare(b.name,'nl'));let rank=0;
 return rows.map((row,i)=>{if(!i||row.points!==rows[i-1].points||row.wins!==rows[i-1].wins)rank=i+1;return {...row,rank};});
}
const api={KEY,LIMIT,name,identity,sanitize,record,standings};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.VectorBattleRanking=api;
})(typeof globalThis!=='undefined'?globalThis:this);
