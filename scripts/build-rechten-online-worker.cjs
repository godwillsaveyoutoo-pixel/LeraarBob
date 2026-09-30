// ES module bundle for Deno; built from the exact browser task generators/checkers.
const path=require('node:path');
const esbuild=require(process.env.LB_ESBUILD_MODULE||'esbuild');
esbuild.buildSync({entryPoints:[path.join(__dirname,'../shared/multiplayer/rechten-online-policy.cjs')],outfile:path.join(__dirname,'../supabase/functions/rechten-duo/policy.js'),bundle:true,platform:'neutral',format:'esm',target:'es2022',legalComments:'none'});
