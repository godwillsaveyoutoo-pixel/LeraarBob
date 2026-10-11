const esbuild=require(process.env.LB_ESBUILD_MODULE||'esbuild');
esbuild.buildSync({entryPoints:['shared/multiplayer/logica-battle-policy.cjs'],outfile:'supabase/functions/logica-class/policy.js',bundle:true,platform:'neutral',format:'esm',target:'es2022',legalComments:'none'});
