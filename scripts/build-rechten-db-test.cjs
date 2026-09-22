// Prints a transaction containing only pg_temp objects and fictitious progress.
const fs=require('node:fs'),path=require('node:path'),root=path.join(__dirname,'..');
const wave=process.argv.includes('--wave2')?'wave2':'wave1';
const candidate=fs.readFileSync(path.join(root,'supabase_rechten_'+wave+'.sql'),'utf8');
const start=candidate.indexOf('CREATE OR REPLACE FUNCTION');
const sql=candidate.slice(start,candidate.indexOf(';\nrevoke all'))
 .replace('public.axioma_save_progress(','pg_temp.wave_save_progress(')
 .replaceAll('public.axioma_progress','pg_temp.wave_progress')
 .replaceAll('public.axioma_profiles','pg_temp.wave_profiles')
 .replaceAll('axioma_progress.revision','wave_progress.revision');
const tests=fs.readFileSync(path.join(root,wave==='wave2'?'tests/rechten-construction-database.sql':'tests/rechten-wave-database.sql'),'utf8'),split=tests.indexOf('do $$');
process.stdout.write('begin;\n'+tests.slice(0,split)+sql+';\n'+tests.slice(split)+'\nrollback;\n');
