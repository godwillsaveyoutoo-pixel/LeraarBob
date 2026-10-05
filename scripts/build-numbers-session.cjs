const esbuild=require(process.env.LB_ESBUILD_MODULE||'esbuild');
esbuild.buildSync({stdin:{contents:"module.exports=require('./games/bewerkingen-trainer/core.js')",resolveDir:process.cwd()},outfile:'supabase/functions/numbers-session/core.js',bundle:true,format:'esm',platform:'neutral',target:'es2022'});
