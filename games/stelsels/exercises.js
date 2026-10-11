(function(root,factory){if(typeof module==='object')module.exports=factory();else root.StelselsExercises=factory();})(globalThis,()=>{
return [
 // BASIS
 {id:1,eq:[['2','1','5'],['1','2','4']]},
 {id:2,eq:[['-2','1','4'],['1','3','5']]},
 {id:3,eq:[['2','1','5'],['1','-2','5']]},
 {id:4,eq:[['-3','1','-5'],['1','4','6']]},
 {id:5,eq:[['1/2','1','2'],['1','-1','1']]},

 // METHODEBEWUSTE VARIATIE
 // combinatie: y valt onmiddellijk weg
 {id:6,eq:[['3','2','7'],['3','-2','-1']]},
 // substitutie: x staat meteen met coefficient 1
 {id:7,eq:[['1','-3','-5'],['2','1','4']]},
 // negatieve x-coefficient
 {id:8,eq:[['-1','1','4'],['2','1','1']]},
 // beide oplossingscoordinaten negatief
 {id:9,eq:[['1','1','-3'],['2','-1','-3']]},
 // combinatie vraagt twee verschillende factoren
 {id:10,eq:[['2','3','7'],['3','-2','4']]},

 // UITDAGING
 // breuken als oplossing
 {id:11,eq:[['2','1','2'],['1','-1','0']]},
 // breuk als coefficient
 {id:12,eq:[['2/3','-1','-1'],['1','1','6']]},

 // SPECIALE GEVALLEN — minder onmiddellijk herkenbaar
 // tweede vergelijking = -2 maal de eerste
 {id:13,eq:[['2','-1','3'],['-4','2','-6']]},
 // zelfde linkerlidverhouding, ander rechterlid: evenwijdig
 {id:14,eq:[['2','-1','3'],['-4','2','-8']]}
];
});
