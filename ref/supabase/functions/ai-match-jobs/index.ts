/**
 * AI Match Jobs Edge Function
 * 
 * Handles semantic job matching using Qdrant vector search
 * - Generates embeddings for user profile
 * - Searches Qdrant for similar jobs
 * - Returns matched jobs with scores
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const QDRANT_URL = Deno.env.get('QDRANT_URL') || 'https://n8n-qdrant.katsu6.easypanel.host'
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface UserProfile {
  cv_data?: {
    title?: string
    bio?: string
    summary?: string
    skills?: string[]
    experience_level?: string
  }
  preferences?: {
    desired_role?: string
    preferred_location?: string
    preferred_employment_type?: string
  }
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { user_id, limit = 50 } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🤖 AI Matching for user: ${user_id}`)

    // Get user profile
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('cv_data, preferences')
      .eq('id', user_id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build search text from profile
    console.log('👤 Profile data:', {
      has_cv_data: !!profile.cv_data,
      cv_title: profile.cv_data?.title,
      cv_skills_count: profile.cv_data?.skills?.length || 0,
      has_preferences: !!profile.preferences
    })
    
    const searchText = buildSearchText(profile as UserProfile)
    console.log('📝 Search text length:', searchText.length)
    console.log('📝 Search text preview:', searchText.substring(0, 200))

    if (!searchText) {
      return new Response(
        JSON.stringify({ error: 'No searchable content in profile' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generate embedding
    console.log('🔮 Generating embedding...')
    const embedding = await generateEmbedding(searchText)

    if (!embedding) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate embedding' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Search Qdrant
    console.log('🔍 Searching Qdrant...')
    console.log('🔍 Embedding vector length:', embedding.length)
    console.log('🔍 Requesting limit:', limit)
    const results = await searchQdrant(embedding, limit)
    console.log('🔍 Qdrant returned:', results.length, 'results')

    // DEBUG: Log first result to see structure
    if (results.length > 0) {
      console.log('🔍 First result structure:', JSON.stringify(results[0], null, 2))
      console.log('🔍 Payload keys:', Object.keys(results[0].payload || {}))
    }

    // Get external_ids from Qdrant results
    const externalIds = results.map(r => r.payload.external_id).filter(Boolean)
    
    // Look up actual job IDs from Supabase using external_id
    const { data: jobMappings } = await supabase
      .from('jobs')
      .select('id, external_id')
      .in('external_id', externalIds)
    
    // Create mapping: external_id -> job UUID
    const externalIdToJobId = new Map(
      jobMappings?.map(j => [j.external_id, j.id]) || []
    )
    
    console.log(`📋 Mapped ${externalIdToJobId.size} external_ids to job UUIDs`)

    // Get already swiped jobs to filter out
    const { data: swipedJobs } = await supabase
      .from('swipes')
      .select('job_id')
      .eq('user_id', user_id)

    const swipedJobIds = new Set(swipedJobs?.map(s => s.job_id) || [])

    // Filter and transform results
    const jobs = results
      .map(result => {
        const jobId = externalIdToJobId.get(result.payload.external_id)
        if (!jobId) {
          console.warn(`⚠️ No job found for external_id: ${result.payload.external_id}`)
          return null
        }
        return {
          ...result.payload,
          id: jobId,  // Use the UUID from jobs table!
          match_score: Math.round(result.score * 100) / 100,
          match_type: 'ai',
          similarity_score: result.score,
        }
      })
      .filter(job => job !== null && !swipedJobIds.has(job.id))

    console.log(`✅ Found ${jobs.length} AI-matched jobs`)

    return new Response(
      JSON.stringify({ 
        success: true,
        data: jobs,
        count: jobs.length,
        method: 'ai_semantic',
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  }
})

/**
 * Build search text from user profile
 */
function buildSearchText(profile: UserProfile): string {
  const parts: string[] = []

  // From CV data
  if (profile.cv_data) {
    if (profile.cv_data.title) parts.push(profile.cv_data.title)
    if (profile.cv_data.bio) parts.push(profile.cv_data.bio)
    if (profile.cv_data.summary) parts.push(profile.cv_data.summary)
    if (profile.cv_data.skills) parts.push(profile.cv_data.skills.join(', '))
    if (profile.cv_data.experience_level) parts.push(profile.cv_data.experience_level)
  }

  // From preferences
  if (profile.preferences) {
    if (profile.preferences.desired_role) parts.push(profile.preferences.desired_role)
    if (profile.preferences.preferred_location) parts.push(profile.preferences.preferred_location)
    if (profile.preferences.preferred_employment_type) parts.push(profile.preferences.preferred_employment_type)
  }

  return parts.filter(Boolean).join(' ')
}

/**
 * Generate embedding using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    })

    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error('Failed to generate embedding:', error)
    return null
  }
}

/**
 * Search Qdrant for similar jobs
 */
async function searchQdrant(vector: number[], limit: number): Promise<any[]> {
  try {
    const response = await fetch(`${QDRANT_URL}/collections/jobs/points/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector,
        limit,
        with_payload: true,
      }),
    })

    const data = await response.json()
    return data.result || []
  } catch (error) {
    console.error('Failed to search Qdrant:', error)
    return []
  }
}
