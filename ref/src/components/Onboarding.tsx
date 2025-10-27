// @ts-nocheck
import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { Upload, Sparkles, ArrowRight, FileText, MapPin, DollarSign, Loader, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface OnboardingProps {
  user: User
  onComplete: () => void
}

interface SurveyAnswers {
  job_search_status: string
  primary_platform: string
  expectations: string
}

type WorkType = 'remote' | 'hybrid' | 'office' | 'any'

export default function Onboarding({ user, onComplete }: OnboardingProps) {
  const [step, setStep] = useState<number>(1)
  const [uploading, setUploading] = useState<boolean>(false)
  const [processing, setProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Preferences
  const [location, setLocation] = useState<string>('')
  const [salaryMin, setSalaryMin] = useState<string>('')
  const [remoteOnly, setRemoteOnly] = useState<boolean>(false)
  const [workType, setWorkType] = useState<WorkType>('any')
  
  // Survey answers
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers>({
    job_search_status: '',
    primary_platform: '',
    expectations: ''
  })

  const handleCVUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      setError(null)

      // Delete old CV files first (cleanup)
      try {
        const { data: oldFiles } = await supabase.storage.from('cvs').list('', { search: user.id })

        if (oldFiles && oldFiles.length > 0) {
          const filesToDelete = oldFiles.map(f => f.name)
          await supabase.storage.from('cvs').remove(filesToDelete)
        }
      } catch (cleanupError: unknown) {
        // Don't block upload if cleanup fails
        console.warn('CV cleanup failed:', cleanupError)
      }

      // Upload new CV to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('cvs').upload(fileName, file)

      if (uploadError) {
        throw new Error(
          `Upload failed: ${uploadError.message}. Please create a 'cvs' bucket in Supabase Storage.`
        )
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('cvs').getPublicUrl(fileName)

      // Move to processing screen
      setStep(2.5)
      setProcessing(true)
      
      // Trigger n8n webhook for parsing (now we wait!)
      const webhookUrl = import.meta.env.VITE_N8N_CV_WEBHOOK_URL
      if (webhookUrl && !webhookUrl.includes('your-n8n-instance')) {
        const processCV = async (retryCount = 0) => {
          try {
            const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: user.id,
                cv_url: publicUrl,
                email: user.email,
                filename: file.name,
              }),
            })

            if (response.ok) {
              let cvData = await response.json()

              // Handle array response (n8n wraps in array)
              if (Array.isArray(cvData) && cvData.length > 0) {
                cvData = cvData[0].response || cvData[0]
              }

              // Flatten skills for easier matching
              const flattenSkills = skills => {
                if (!skills) return []
                const allSkills = []
                const extractSkills = obj => {
                  if (Array.isArray(obj)) {
                    allSkills.push(...obj)
                  } else if (typeof obj === 'object') {
                    Object.values(obj).forEach(value => extractSkills(value))
                  }
                }
                extractSkills(skills)
                return [...new Set(allSkills)]
              }

              // Handle both 'skills' and 'technical_skills' from n8n
              // If skills_flat already exists (new format), keep it
              const skillsData = cvData.technical_skills || cvData.skills
              const flattenedData = {
                ...cvData,
                skills_flat: cvData.skills_flat || flattenSkills(skillsData),
              }

              // Save CV data to profile
              await supabase.from('profiles').update({ cv_data: flattenedData }).eq('id', user.id)

              console.log('✅ CV processed and saved!')
              
              // Move to preferences after successful processing
              setProcessing(false)
              setTimeout(() => setStep(3), 1000) // Small delay to show success
            } else {
              throw new Error(`Webhook returned ${response.status}`)
            }
          } catch (err) {
            console.error('CV processing failed:', err)

            // Retry once after 10 seconds
            if (retryCount === 0) {
              console.log('Retrying CV processing in 10 seconds...')
              setTimeout(() => processCV(1), 10000)
            } else {
              console.error('CV processing failed after retry')
              setProcessing(false)
              setError('CV processing failed. You can continue anyway or try uploading again later.')
              // Allow user to continue after 3 seconds
              setTimeout(() => setStep(3), 3000)
            }
          }
        }

        // Start processing (now blocking - we wait!)
        processCV()
      } else {
        // No webhook configured, skip to preferences
        setProcessing(false)
        setStep(3)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSkip = async () => {
    // Skip CV, go to preferences immediately
    setStep(3)
  }
  
  const handleContinueToSurvey = () => {
    setStep(4)
  }

  const handleSavePreferences = async () => {
    // Just save preferences and move to survey
    try {
      setError(null)

      // Ensure profile exists first
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // Create profile if it doesn't exist
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          preferences: {
            location: location || null,
            salary_min: salaryMin ? parseInt(salaryMin) : null,
            work_type: workType,
          },
        })
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            preferences: {
              location: location || null,
              salary_min: salaryMin ? parseInt(salaryMin) : null,
              work_type: workType,
            },
          })
          .eq('id', user.id)

        if (updateError) {
          console.error('Update error:', updateError)
          throw updateError
        }

        console.log('✅ Preferences saved')
      }

      // Move to survey
      setStep(4)
    } catch (err) {
      console.error('Save preferences error:', err)
      setError(err.message)
    }
  }
  
  const handleCompleteSurvey = async () => {
    try {
      setError(null)
      
      // Save survey answers
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          onboarding_survey: surveyAnswers,
          onboarding_completed: true,
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Survey save error:', updateError)
        throw updateError
      }

      console.log('✅ Survey completed, onboarding done!')
      onComplete()
    } catch (err) {
      console.error('Complete survey error:', err)
      setError(err.message)
    }
  }

  const handleSkipPreferences = async () => {
    try {
      // Ensure profile exists first
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // Create profile if it doesn't exist
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          preferences: {},
          onboarding_completed: true,
        })
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id)

        if (updateError) {
          console.error('Update error:', updateError)
          throw updateError
        }

        console.log('✅ Onboarding skipped, onboarding_completed set to true')
      }

      onComplete()
    } catch (err) {
      console.error('Skip preferences error:', err)
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          <div
            className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'}`}
          />
          <div
            className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'}`}
          />
          <div
            className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'}`}
          />
          <div
            className={`h-2 flex-1 rounded-full ${step >= 4 ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'}`}
          />
        </div>

        {step === 1 && (
          <div className="text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to LazyJobs! 🎉</h1>

            {/* Description */}
            <p className="text-gray-600 mb-8 text-lg">
              We use AI to match you with jobs that actually fit your skills and experience.
              <br />
              <br />
              <strong>To get started, we need your CV.</strong>
            </p>

            {/* Why CV */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
              <p className="text-sm text-blue-900 font-medium mb-2">🎯 Why we need your CV:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Extract your skills automatically</li>
                <li>✓ Calculate accurate match scores</li>
                <li>✓ Show you relevant jobs only</li>
                <li>✓ Save you time (no manual input!)</li>
              </ul>
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep(2)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
              <FileText className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload Your CV</h2>

            {/* Description */}
            <p className="text-gray-600 mb-8">
              We'll parse it automatically and start showing you personalized matches in seconds.
            </p>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Upload Area */}
            <label className="block mb-6">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleCVUpload}
                disabled={uploading}
                className="hidden"
                id="cv-upload"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-2">
                  {uploading ? 'Uploading...' : 'Click to upload CV'}
                </p>
                <p className="text-sm text-gray-500">PDF, DOC, or DOCX (max 10MB)</p>
              </div>
            </label>

            {/* Skip Option */}
            <button
              onClick={handleSkip}
              disabled={uploading}
              className="text-gray-600 hover:text-gray-800 text-sm underline"
            >
              Skip for now (you'll see random jobs)
            </button>

            {/* Info */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
              <p className="text-xs text-yellow-900">
                <strong>⚠️ Without a CV:</strong> We can't calculate accurate match scores. You'll
                see random jobs instead of personalized matches.
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
              <MapPin className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Preferences</h2>

            {/* Description */}
            <p className="text-gray-600 mb-8">
              Help us find better matches by telling us what you're looking for.
            </p>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <div className="space-y-4 text-left mb-6">
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Preferred Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Stockholm, Gothenburg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Minimum Salary (SEK/month)
                </label>
                <input
                  type="number"
                  value={salaryMin}
                  onChange={e => setSalaryMin(e.target.value)}
                  placeholder="e.g. 35000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Remote */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="remote"
                  checked={remoteOnly}
                  onChange={e => setRemoteOnly(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label
                  htmlFor="remote"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Only show remote jobs
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleSavePreferences}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Start Swiping! 🎉
              </button>

              <button
                onClick={handleSkipPreferences}
                className="w-full text-gray-600 hover:text-gray-800 text-sm underline"
              >
                Skip (I'll set this later)
              </button>
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
              <p className="text-xs text-blue-900">
                💡 <strong>Tip:</strong> You can always change these later in Settings.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
