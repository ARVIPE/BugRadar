// supabase/functions/get-user-stats/index.ts

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Helper function to get user from JWT
async function getUser(supabase: SupabaseClient, req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('Missing Authorization header')
  }
  const jwt = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(jwt)
  if (error) {
    throw new Error('Invalid JWT')
  }
  return user
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Although we use admin client for RPC calls, 
    // we first validate the user's JWT to secure the endpoint.
    await getUser(supabaseAdmin, req)

    // Perform RPC calls to get statistics
    const [
      { data: dailySignups, error: dailySignupsError },
      { data: totalLogins, error: totalLoginsError },
      { data: growthRate, error: growthRateError },
    ] = await Promise.all([
      supabaseAdmin.rpc('get_daily_signups'),
      supabaseAdmin.rpc('get_total_logins_last_7_days'),
      supabaseAdmin.rpc('get_user_growth_rate'),
    ])

    if (dailySignupsError || totalLoginsError || growthRateError) {
      console.error({
        dailySignupsError,
        totalLoginsError,
        growthRateError,
      })
      throw new Error('One or more database RPC calls failed.')
    }

    const weeklyNewUsers = dailySignups?.reduce((acc, day) => acc + (day.users || 0), 0) || 0;

    const stats = {
      weeklyNewUsers: weeklyNewUsers,
      dailySignups: dailySignups ?? [],
      totalLogins: totalLogins ?? 0,
      growthRate: growthRate ?? 0.0,
    }

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})