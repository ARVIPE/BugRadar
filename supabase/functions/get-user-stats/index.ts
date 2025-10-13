// supabase/functions/get-user-stats/index.ts
// VERSIÓN DE DEPURACIÓN MÁXIMA

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log('[DEBUG] Nivel superior: El fichero de la función ha sido cargado por el runtime.')

Deno.serve(async (req) => {
  console.log(`[DEBUG] Handler Invocado: Recibida una petición ${req.method} a ${req.url}`)

  if (req.method === 'OPTIONS') {
    console.log('[DEBUG] Petición OPTIONS recibida. Devolviendo cabeceras CORS.')
    return new Response('ok', { headers: corsHeaders })
  }

  // Pega esto dentro de Deno.serve(async (req) => { ... })

try {
    console.log('[DEBUG] AISLAMIENTO: Verificando secrets...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceKey) throw new Error("Secrets no encontrados.");

    console.log('[DEBUG] AISLAMIENTO: Creando cliente...');
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    console.log('[DEBUG] AISLAMIENTO: Llamando a get_total_logins_last_7_days...');
    const { data, error } = await supabaseAdmin.rpc('get_total_logins_last_7_days');

    if (error) {
        // Si hay un error, lo lanzamos para que se capture abajo
        throw error;
    }

    console.log('[DEBUG] AISLAMIENTO: Llamada exitosa. Resultado:', data);

    return new Response(JSON.stringify({ logins: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });

} catch (error) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!!      ERROR CAPTURADO EN MODO AISLADO      !!!');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('[DEBUG] Error completo:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
    });
}
})