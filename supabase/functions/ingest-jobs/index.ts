import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Job {
  external_id: string
  title: string
  company: string
  description?: string
  location?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  is_remote?: boolean
  employment_type?: string
  required_skills?: string[]
  experience_level?: string
  url?: string
  posted_at?: string
  metadata?: Record<string, any>
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { api_key, jobs } = await req.json()
    
    if (!api_key) {
      return new Response(
        JSON.stringify({ error: 'Missing api_key in request body' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const apiKey = api_key

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify connector API key (simplified - no database lookup)
    const validApiKey = Deno.env.get('CONNECTOR_API_KEY')
    
    if (apiKey !== validApiKey) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: jobs array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate required fields
    for (const job of jobs) {
      if (!job.external_id || !job.title || !job.company) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid job data: external_id, title, and company are required' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Prepare jobs for insertion
    const jobsToInsert = jobs.map(job => ({
      external_id: job.external_id,
      title: job.title,
      company: job.company,
      description: job.description || null,
      location: job.location || null,
      salary_min: job.salary_min || null,
      salary_max: job.salary_max || null,
      salary_currency: job.salary_currency || 'USD',
      is_remote: job.is_remote || false,
      employment_type: job.employment_type || null,
      required_skills: job.required_skills || [],
      experience_level: job.experience_level || null,
      url: job.url || null,
      posted_at: job.posted_at || new Date().toISOString(),
      metadata: job.metadata || {},
      is_active: true,
    }))

    // Upsert jobs (insert or update if external_id exists)
    const { data: insertedJobs, error: insertError } = await supabase
      .from('jobs')
      .upsert(jobsToInsert, {
        onConflict: 'external_id',
        ignoreDuplicates: false
      })
      .select('id')

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to insert jobs', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get source from first job's metadata
    const source = jobs[0]?.metadata?.source || 'OpenJobs'
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: jobs.length,
        inserted: insertedJobs?.length || 0,
        message: `Successfully processed ${jobs.length} jobs from ${source}`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
