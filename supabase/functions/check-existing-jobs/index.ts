import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { external_ids } = await req.json()

    if (!Array.isArray(external_ids) || external_ids.length === 0) {
      console.log('No external_ids provided or invalid format')
      return new Response(
        JSON.stringify({ existing_ids: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Checking ${external_ids.length} external IDs for existing jobs`)

    // Create Supabase client (uses anon key from environment)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Query for existing active jobs with matching external_ids
    // RLS allows public read access to active jobs
    const { data, error } = await supabase
      .from('jobs')
      .select('external_id')
      .in('external_id', external_ids)
      .eq('is_active', true)

    if (error) {
      console.error('Error querying jobs:', error)
      throw error
    }

    const existingIds = data?.map(job => job.external_id) || []
    console.log(`Found ${existingIds.length} existing jobs`)

    return new Response(
      JSON.stringify({ existing_ids: existingIds }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in check-existing-jobs function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage, existing_ids: [] }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
