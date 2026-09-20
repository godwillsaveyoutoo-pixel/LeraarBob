(() => {
'use strict';

const MAX_BYTES = 262144;

function client(){
  if(!window.AxiomaAuth) throw new Error('AxiomaAuth ontbreekt.');
  return window.AxiomaAuth.client();
}

function validateGameId(gameId){
  const id=String(gameId||'').trim();
  if(!/^[a-z0-9][a-z0-9_-]{2,63}$/.test(id)) throw new Error('Ongeldige game_id.');
  return id;
}

function validateState(state){
  if(!state || typeof state!=='object' || Array.isArray(state)) throw new Error('Voortgang moet een object zijn.');
  const json=JSON.stringify(state);
  if(new Blob([json]).size>MAX_BYTES) throw new Error('Voortgang is te groot.');
  return state;
}

async function ensureStudent(){
  const account=await window.AxiomaAuth.getAccount();
  if(account?.role!=='student') throw new Error('Leerlingaccount vereist.');
  return account;
}

async function load(gameId){
  const id=validateGameId(gameId);
  await ensureStudent();
  const sb=client();
  const {data,error}=await sb.from('axioma_game_progress')
    .select('game_id,state,revision,updated_at')
    .eq('game_id',id)
    .maybeSingle();
  if(error) throw error;
  return data ? {
    gameId:data.game_id,
    state:data.state,
    revision:Number(data.revision)||0,
    updatedAt:data.updated_at
  } : {
    gameId:id,
    state:null,
    revision:0,
    updatedAt:null
  };
}

async function save(gameId,state,revision){
  const id=validateGameId(gameId);
  validateState(state);
  await ensureStudent();
  const sb=client();
  const {data,error}=await sb.rpc('axioma_save_game_progress',{
    p_game_id:id,
    p_state:state,
    p_revision:Number(revision)||0
  });
  if(error) throw error;
  return data;
}

async function saveLatest(gameId,state){
  const current=await load(gameId);
  const result=await save(gameId,state,current.revision);
  if(result?.status==='conflict'){
    return {status:'conflict', remote:result};
  }
  return result;
}

async function completeUnit(gameId,unitId,total){
  const id=validateGameId(gameId);
  const unit=String(unitId);
  const totalCount=Math.max(1,Number(total)||1);

  // Games remain fully playable without an account.
  const account=await window.AxiomaAuth.getAccount();
  if(account?.role!=='student') return {status:'guest'};

  for(let attempt=0;attempt<2;attempt++){
    const current=await load(id);
    const oldState=(current.state && typeof current.state==='object') ? current.state : {};
    const completed=new Set(Array.isArray(oldState.completed) ? oldState.completed.map(String) : []);
    completed.add(unit);

    const nextState={
      ...oldState,
      completed:Array.from(completed),
      total:totalCount,
      finished:completed.size>=totalCount
    };

    const result=await save(id,nextState,current.revision);
    if(result?.status!=='conflict') return result;
  }
  return {status:'conflict'};
}

async function listGames(){
  const sb=client();
  const {data,error}=await sb.from('axioma_games')
    .select('id,title,theme,game_type,progress_type,teacher_visible,sort_order,metadata')
    .eq('active',true)
    .order('sort_order');
  if(error) throw error;
  return data||[];
}

window.AxiomaProgress=Object.freeze({
  load,
  save,
  saveLatest,
  completeUnit,
  listGames
});
})();