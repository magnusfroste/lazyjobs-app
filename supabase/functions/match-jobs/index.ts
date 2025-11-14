import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MatchRequest {
  user_id: string
  cv_data?: {
    skills?: string[]
    experience_years?: number
    desired_location?: string
    desired_salary_min?: number
    desired_remote?: boolean
  }
  preferences?: {
    location?: string
    remote_only?: boolean
    salary_min?: number
    employment_types?: string[]
  }
  limit?: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    })

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const { user_id, cv_data, preferences, limit = 20 } = await req.json() as MatchRequest

    if (user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: user_id mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's profile with CV data
    const { data: profile } = await supabase
      .from('profiles')
      .select('cv_data, preferences')
      .eq('id', user_id)
      .single()

    const userCvData = cv_data || profile?.cv_data || {}
    const userPreferences = preferences || profile?.preferences || {}

    // Get jobs user hasn't swiped on
    const { data: swipedJobIds } = await supabase
      .from('swipes')
      .select('job_id')
      .eq('user_id', user_id)

    const swipedIds = swipedJobIds?.map(s => s.job_id) || []

    // Fetch active jobs
    let query = supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('posted_at', { ascending: false })

    if (swipedIds.length > 0) {
      query = query.not('id', 'in', `(${swipedIds.join(',')})`)
    }

    const { data: jobs, error: jobsError } = await query.limit(100)

    if (jobsError) {
      throw jobsError
    }

    // Swedish to English skill translation for European job market
    const swedishTranslations: Record<string, string[]> = {
      // Job titles / roles
      'systemutvecklare': ['developer', 'programmer', 'software engineer', 'system developer'],
      'programmerare': ['programmer', 'developer', 'coder', 'software developer'],
      'mjukvaruutvecklare': ['software developer', 'developer', 'programmer'],
      'utvecklare': ['developer', 'programmer', 'engineer'],
      'systemdesigner': ['system designer', 'architect', 'system architect'],
      'mjukvarutestare': ['software tester', 'qa', 'tester', 'quality assurance'],
      'systemtestare': ['system tester', 'qa engineer', 'test engineer'],
      'testledare': ['test lead', 'qa lead', 'test manager'],
      'arkitekt': ['architect', 'system architect', 'software architect'],
      'ingenjör': ['engineer', 'software engineer'],
      
      // Languages
      'svenska': ['swedish'],
      'engelska': ['english'],
      
      // Tech terms
      'databas': ['database', 'db'],
      'nätverk': ['network', 'networking'],
      'säkerhet': ['security', 'cybersecurity'],
      'data': ['data', 'database'],
      
      // Education
      'eftergymnasial utbildning två år eller längre': ['bachelor', 'degree', 'university'],
      'work experience required': ['experience', 'professional experience'],
    }
    
    // Skill normalization with common aliases and Swedish translation
    function normalizeSkill(skill: string, language?: string): string[] {
      const normalized = skill.toLowerCase().trim()
      
      // If Swedish job, try translation first
      if (language === 'sv' && swedishTranslations[normalized]) {
        return swedishTranslations[normalized]
      }
      
      // Common tech skill aliases (English)
      const aliases: Record<string, string[]> = {
        'js': ['javascript', 'js', 'ecmascript'],
        'javascript': ['javascript', 'js', 'ecmascript'],
        'ts': ['typescript', 'ts'],
        'typescript': ['typescript', 'ts'],
        'node': ['node', 'nodejs', 'node.js'],
        'nodejs': ['node', 'nodejs', 'node.js'],
        'react': ['react', 'reactjs', 'react.js'],
        'reactjs': ['react', 'reactjs', 'react.js'],
        'vue': ['vue', 'vuejs', 'vue.js'],
        'angular': ['angular', 'angularjs'],
        'python': ['python', 'py'],
        'py': ['python', 'py'],
      }
      
      return aliases[normalized] || [normalized]
    }

    // Improved matching algorithm - Skills are CRITICAL
    const scoredJobs = jobs.map(job => {
      let score = 0 // Start at 0, not 0.5!

      // SKILL MATCHING (50% weight - MOST IMPORTANT!)
      const userSkills = userCvData.skills_flat || userCvData.skills || []
      let skillScore = 0
      
      if (userSkills.length > 0 && job.required_skills && job.required_skills.length > 0) {
        // Get job language for translation
        const jobLanguage = job.metadata?.language || 'en'
        
        // Normalize both user and job skills (with language-aware translation)
        const userSkillsNormalized = userSkills.flatMap((s: string) => normalizeSkill(s))
        const jobSkillsNormalized = job.required_skills.flatMap((s: string) => normalizeSkill(s, jobLanguage))
        
        // Find matches
        const matchedSkills = userSkillsNormalized.filter((s: string) => 
          jobSkillsNormalized.includes(s)
        )
        
        // Calculate match ratio (use unique skills to avoid counting duplicates)
        const uniqueJobSkills = [...new Set(jobSkillsNormalized)]
        const skillMatchRatio = matchedSkills.length / uniqueJobSkills.length
        
        // If NO skills match, this is a bad match!
        if (matchedSkills.length === 0) {
          skillScore = 0.1 // Very low score for zero skill match
        } else {
          skillScore = 0.3 + (skillMatchRatio * 0.7) // 30% base + up to 70% for full match
        }
      } else if (!job.required_skills || job.required_skills.length === 0) {
        // No skills data = can't verify match, give low score
        // This prevents bad matches when job data is incomplete
        skillScore = 0.3
      } else {
        // User has no skills but job requires them = bad match
        skillScore = 0.1
      }
      
      score += skillScore * 0.5 // Skills are 50% of total score

      // SALARY MATCHING (20% weight)
      let salaryScore = 0.5 // Neutral if no data
      if (userPreferences.salary_min && job.salary_min) {
        if (job.salary_min >= userPreferences.salary_min) {
          salaryScore = 1.0 // Perfect match
        } else {
          const salaryRatio = job.salary_min / userPreferences.salary_min
          salaryScore = Math.max(0.2, salaryRatio) // Lower salary = lower score
        }
      }
      score += salaryScore * 0.2

      // LOCATION MATCHING (15% weight)
      let locationScore = 0.5 // Neutral
      
      // Remote jobs are location-flexible - don't penalize for location mismatch!
      if (job.is_remote) {
        locationScore = 0.8 // Good match regardless of user location
      } else if (userPreferences.location && job.location) {
        // On-site jobs must match user's preferred location
        if (job.location.toLowerCase().includes(userPreferences.location.toLowerCase())) {
          locationScore = 1.0 // Perfect match
        } else {
          locationScore = 0.3 // Wrong location
        }
      }
      score += locationScore * 0.15

      // REMOTE PREFERENCE (10% weight)
      let remoteScore = 0.5 // Neutral
      if (userPreferences.remote_only) {
        remoteScore = job.is_remote ? 1.0 : 0.2
      } else if (job.is_remote) {
        remoteScore = 0.8 // Remote is a bonus even if not required
      }
      score += remoteScore * 0.1

      // EMPLOYMENT TYPE (5% weight)
      let employmentScore = 0.5 // Neutral
      if (userPreferences.employment_types && job.employment_type) {
        employmentScore = userPreferences.employment_types.includes(job.employment_type) ? 1.0 : 0.3
      }
      score += employmentScore * 0.05

      return {
        ...job,
        match_score: Math.round(Math.min(Math.max(score, 0), 1) * 100), // Return 0-100 range
        match_breakdown: {
          skills: Math.round(skillScore * 100),
          salary: Math.round(salaryScore * 100),
          location: Math.round(locationScore * 100),
          remote: Math.round(remoteScore * 100),
          employment: Math.round(employmentScore * 100)
        }
      }
    })

    // Sort by match score and return top matches
    const topMatches = scoredJobs
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, limit)

    return new Response(
      JSON.stringify({
        success: true,
        jobs: topMatches,
        total: topMatches.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
