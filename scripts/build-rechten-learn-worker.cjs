const esbuild=require(process.env.LB_ESBUILD_MODULE||'esbuild');
esbuild.buildSync({entryPoints:['shared/multiplayer/rechten-learn-engine.cjs'],outfile:'supabase/functions/rechten-learn/engine.js',bundle:true,platform:'neutral',format:'esm',target:'es2022',legalComments:'none'});
