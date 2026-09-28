(function(root){
  'use strict';

  // Presentation-only reward timeline. Mathematical state is untouched; this
  // module only paces the visual feedback after a correct construction.
  // The sequence is intentionally compact: line -> land -> rabbit -> root ->
  // a small "harvest" wave along the already discovered roots.
  const NORMAL={
    signalStart:0,
    signalEnd:430,
    cameraStart:150,
    cameraDuration:520,
    cameraScale:.985,
    rabbitStart:760,
    rabbitDuration:540,
    axisStart:1120,
    rootStart:1310,
    rootGrowDuration:560,
    harvestStart:1680,
    harvestDuration:430,
    messageStart:1760,
    settleEnd:2280,
    collapseDelay:1650
  };
  const REDUCED={
    signalStart:0,
    signalEnd:80,
    cameraStart:0,
    cameraDuration:1,
    cameraScale:1,
    rabbitStart:90,
    rabbitDuration:1,
    axisStart:110,
    rootStart:125,
    rootGrowDuration:1,
    harvestStart:145,
    harvestDuration:1,
    messageStart:150,
    settleEnd:190,
    collapseDelay:600
  };

  function create(start,reduced=false){
    const t=reduced?REDUCED:NORMAL;
    return Object.freeze({start,reduced,...t});
  }

  function age(sequence,now=performance.now()){
    return sequence?Math.max(0,now-sequence.start):0;
  }

  function stage(sequence,now=performance.now()){
    if(!sequence)return null;
    const a=age(sequence,now);
    if(a<sequence.signalEnd)return 'signal';
    if(a<sequence.rabbitStart)return 'field';
    if(a<sequence.rabbitStart+sequence.rabbitDuration)return 'rabbit';
    if(a<sequence.axisStart)return 'settle';
    if(a<sequence.harvestStart)return 'root';
    if(a<sequence.harvestStart+sequence.harvestDuration)return 'harvest';
    if(a<sequence.settleEnd)return 'root';
    return 'done';
  }

  function rootVisible(sequence,now=performance.now()){
    return !!sequence&&age(sequence,now)>=sequence.rootStart;
  }

  function messageVisible(sequence,now=performance.now()){
    return !!sequence&&age(sequence,now)>=sequence.messageStart;
  }

  root.WortelbouwCelebration=Object.freeze({create,age,stage,rootVisible,messageVisible,NORMAL,REDUCED});
})(globalThis);
