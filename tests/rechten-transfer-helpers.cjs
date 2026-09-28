function nextAnswer(C,t,w,opt={}){
 if(C.transferWorkbench.modern(t))return C.expected(t,w);
 const stage=C.transfer.stages(t,w)[w.index];
 if(stage==='colA')return opt.first??0;if(stage==='colB')return opt.second??1;
 if(stage==='pickA'||stage==='pickB'){
  const ps=[];for(let x=-5;x<=5;x++)for(let y=-5;y<=5;y++){const P=C.gridPoint(t,{x,y});if(C.onLine(P,t.params.model))ps.push(P)}
  return stage==='pickA'?(opt.reverse?ps.at(-1):ps[0]):(opt.reverse?ps[0]:ps.at(-1));
 }
 if(stage==='bRoute')return opt.read&&Math.abs(C.num(C.div(t.params.model.b,t.params.scaleY)))<=5?'read':'point';
 if(stage==='ys'||stage==='xs')return opt.reverse?['A','B']:['B','A'];if(stage==='point')return opt.reverse?'B':'A';if(stage==='subX')return 'x';if(stage==='subY')return 'y';
 return C.expected(t,w);
}
function solve(C,t,opt={}){const w=t.work=C.fresh(t);for(let i=0;!w.done&&i<40;i++){const r=C.submit(t,w,nextAnswer(C,t,w,opt));if(!r.ok)throw Error(JSON.stringify({t,w,r}))}if(!w.done)throw Error('unfinished');return w}
module.exports={nextAnswer,solve};
