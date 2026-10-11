require('esbuild').buildSync({entryPoints:['tasks/policy.cjs'],outfile:'supabase/functions/task-activity/policy.js',bundle:true,platform:'neutral',format:'esm',target:'es2022',legalComments:'none'});
