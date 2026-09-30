const esbuild=require(process.env.LB_ESBUILD_MODULE||'esbuild');
esbuild.buildSync({entryPoints:['shared/multiplayer/algebra-class-policy.cjs'],outfile:'supabase/functions/algebra-class/policy.js',bundle:true,platform:'neutral',format:'esm',target:'es2022',legalComments:'none'});
