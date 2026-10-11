import {createHandler} from '../rechten-duo/handler.js';
import policy from '../logica-class/policy.js';
Deno.serve(createHandler({url:Deno.env.get('SUPABASE_URL')!,anonKey:Deno.env.get('SUPABASE_ANON_KEY')!,serviceKey:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,policy,rpcName:'axioma_logica_duo',worker:'axioma_logica_duo_worker'}));
