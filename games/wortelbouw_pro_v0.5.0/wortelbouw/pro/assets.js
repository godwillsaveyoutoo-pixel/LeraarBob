(function(root){
  'use strict';
  const manifest={
    soil:'assets/wortelbouw/fields/soil.png',
    grass:'assets/wortelbouw/fields/grass.png',
    woodEdge:'assets/wortelbouw/fields/wood-edge.png',
    woodCorner:'assets/wortelbouw/fields/wood-corner.png',
    paper:'assets/wortelbouw/paper/paper.png',
    poster:'assets/wortelbouw/signs/poster.png',
    ground:'assets/wortelbouw/garden/ground.png',
    rabbitIdle:'assets/wortelbouw/rabbits/rabbit-idle.png',
    rabbitGuide:'assets/wortelbouw/rabbits/rabbit-guide.png'
  };
  const images={},listeners=new Set();
  let pending=0;
  function emit(){for(const fn of listeners)try{fn()}catch{}}
  for(const [key,src] of Object.entries(manifest)){
    pending++;
    const img=new Image();
    img.decoding='async';
    img.onload=()=>{images[key]=img;pending--;emit()};
    img.onerror=()=>{images[key]=null;pending--;emit()};
    img.src=src;
  }
  root.WortelbouwAssets=Object.freeze({
    manifest,
    get:key=>images[key]||null,
    has:key=>!!images[key],
    pending:()=>pending,
    onChange(fn){listeners.add(fn);return()=>listeners.delete(fn)}
  });
})(globalThis);
