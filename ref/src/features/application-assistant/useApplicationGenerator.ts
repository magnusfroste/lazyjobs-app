/**
 * ============ APPLICATION ASSISTANT FEATURE ============
 * React hook for generating tailored CVs and cover letters
 *
 * Features:
 * - Auto-detects job description language
 * - Generates tailored CV, cover letter, and email
 * - Respects user language preference
 *
 * See: supabase/functions/generate-application/
 * ======================================================
 */

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface GenerationOptions {
  languageOverride?: 'auto' | 'en' | 'sv'
  include?: ('cv' | 'cover_letter' | 'email')[]
}

interface GenerationResult {
  language: 'en' | 'sv'
  cv: string
  cover_letter: string
  email: {
    subject: string
    body: string
  }
}

interface UseApplicationGeneratorReturn {
  generate: (jobId: string, userId: string, options?: GenerationOptions) => Promise<GenerationResult>
  reset: () => void
  loading: boolean
  error: string | null
  result: GenerationResult | null
}

export function useApplicationGenerator(): UseApplicationGeneratorReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerationResult | null>(null)

  /**
   * Generate application materials
   */
  const generate = async (
    jobId: string,
    userId: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> => {
    const { languageOverride = 'auto', include = ['cv', 'cover_letter', 'email'] } = options

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('📝 Generating application materials...', {
        jobId,
        userId,
        languageOverride,
        include,
      })

      const { data, error: functionError } = await supabase.functions.invoke(
        'generate-application',
        {
          body: {
            job_id: jobId,
            user_id: userId,
            language_override: languageOverride,
            include,
          },
        }
      )

      console.log('📦 Function response:', { data, functionError })

      if (functionError) {
        console.error('❌ Function error:', functionError)
        throw new Error(functionError.message || 'Failed to invoke function')
      }

      if (!data) {
        console.error('❌ No data returned from function')
        throw new Error('No response from function')
      }

      if (!data.success) {
        console.error('❌ Function returned error:', data)
        throw new Error(data.error || data.details || 'Failed to generate application')
      }

      console.log(`✅ Generated in ${data.data.language}`)
      setResult(data.data)

      // Track analytics
      trackGeneration(jobId, data.data.language, include)

      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ Generation failed:', err)
      console.error('❌ Error details:', {
        message: errorMessage,
        error: err,
      })
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Reset state
   */
  const reset = () => {
    setLoading(false)
    setError(null)
    setResult(null)
  }

  return {
    generate,
    reset,
    loading,
    error,
    result,
  }
}

/**
 * Track generation analytics
 */
function trackGeneration(
  jobId: string,
  language: string,
  include: string[]
): void {
  // TODO: Integrate with your analytics
  console.log('📊 Analytics:', {
    event: 'application_generated',
    job_id: jobId,
    language,
    components: include,
    timestamp: new Date().toISOString(),
  })
}
