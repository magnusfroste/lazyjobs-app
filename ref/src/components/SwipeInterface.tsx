// @ts-nocheck
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Job, Profile, MatchMode } from '../types'
import JobCard from './JobCard'
import MatchesView from './MatchesView'
import ProfileSettings from './ProfileSettings'
import Onboarding from './Onboarding'
import JobDetailsModal from './JobDetailsModal'
import { Heart, X, RotateCcw, List, Settings, Info, Moon, Sun } from 'lucide-react'
import MatchScoreSlider from './MatchScoreSlider'
import JobCardSkeleton from './JobCardSkeleton'
import { MatchModeToggle } from './MatchModeToggle'
import { FEATURES } from '../lib/featureFlags'
import { getAIMatchedJobs } from '../lib/aiMatching'
import { ApplicationModalTailwind as ApplicationModal } from '../features/application-assistant/ApplicationModalTailwind'
import { useTheme } from '../contexts/ThemeContext'

interface SwipeInterfaceProps {
  user: User
}

export default function SwipeInterface({ user }: SwipeInterfaceProps) {
  const { isDark, toggleTheme } = useTheme()
  const [jobs, setJobs] = useState<Job[]>([])
  const [allJobs, setAllJobs] = useState<Job[]>([]) // Store all jobs for filtering
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [showMatches, setShowMatches] = useState<boolean>(false)
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [matchThreshold, setMatchThreshold] = useState<number>(0.5) // 50% default
  const [checkingOnboarding, setCheckingOnboarding] = useState<boolean>(true)
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false)
  const [cvProcessing, setCvProcessing] = useState<boolean>(false)
  const [cvCheckInterval, setCvCheckInterval] = useState<NodeJS.Timeout | null>(null)
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false)
  const [showJobDetails, setShowJobDetails] = useState<boolean>(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [matchMode, setMatchMode] = useState<MatchMode>('keyword') // 'keyword' or 'ai'
  // ============ APPLICATION ASSISTANT FEATURE START ============
  const [showApplicationModal, setShowApplicationModal] = useState<boolean>(false)
  const [matchedJob, setMatchedJob] = useState<Job | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  // ============ APPLICATION ASSISTANT FEATURE END ==============

  useEffect(() => {
    checkOnboardingStatus()
    fetchUserProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Fetch user profile for match calculations
  const fetchUserProfile = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('cv_data, preferences, application_language_preference')
        .eq('id', user.id)
        .single()
      setUserProfile(profile)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  // Refetch jobs when match mode changes
  useEffect(() => {
    if (!needsOnboarding && !checkingOnboarding) {
      fetchJobs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchMode])

  const checkOnboardingStatus = async () => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_completed, cv_data')
        .eq('id', user.id)
        .single()

      // If profile doesn't exist, create it first
      if (profileError && profileError.code === 'PGRST116') {
        console.log('Creating profile for user...')
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          preferences: {},
        })

        // New user needs onboarding
        setNeedsOnboarding(true)
        setCheckingOnboarding(false)
        return
      }

      // Check if user has completed onboarding OR has CV data
      const hasCompletedOnboarding = profile?.onboarding_completed || profile?.cv_data

      if (!hasCompletedOnboarding) {
        setNeedsOnboarding(true)
        setCheckingOnboarding(false)
      } else {
        setNeedsOnboarding(false)
        setCheckingOnboarding(false)
        fetchJobs()
      }
    } catch (err) {
      console.error('Onboarding check error:', err)
      // If error, proceed to app (fail open)
      setCheckingOnboarding(false)
      fetchJobs()
    }
  }

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false)
    fetchJobs()
  }

  // Filter jobs when threshold changes
  useEffect(() => {
    if (allJobs.length > 0) {
      const filtered = allJobs.filter(job => {
        // If job has no match_score, treat it as 0.5 (50%) - minimum threshold
        const score = job.match_score ?? 0.5
        return score >= matchThreshold
      })
      setJobs(filtered)
      setCurrentIndex(0)
    }
  }, [matchThreshold, allJobs])

  const handleThresholdChange = newThreshold => {
    setMatchThreshold(newThreshold)
  }
  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get user profile with CV data
      const { data: profile } = await supabase
        .from('profiles')
        .select('cv_data, preferences, onboarding_completed')
        .eq('id', user.id)
        .single()

      // ============ AI MATCHING FEATURE START ============
      // If AI mode is selected and feature is enabled, use Qdrant semantic search
      if (matchMode === 'ai' && FEATURES.AI_MATCHING && profile?.cv_data) {
        console.log('🤖 Using AI semantic matching via Qdrant')

        try {
          const aiJobs = await getAIMatchedJobs(profile, 50, user.id)
          console.log(`✅ AI matching found ${aiJobs.length} jobs`)

          // Filter out already swiped jobs
          const { data: swipedJobs } = await supabase
            .from('swipes')
            .select('job_id')
            .eq('user_id', user.id)

          const swipedJobIds = swipedJobs?.map(s => s.job_id) || []
          const filteredAIJobs = aiJobs.filter(job => !swipedJobIds.includes(job.id))

          setAllJobs(filteredAIJobs)
          setJobs(filteredAIJobs)
          setLoading(false)
          return // Exit early - AI matching complete
        } catch (aiError) {
          console.error('AI matching failed, falling back to keyword:', aiError)
          // Fall through to keyword matching
        }
      }
      // ============ AI MATCHING FEATURE END ============

      // Check if CV is still being processed
      if (profile?.onboarding_completed && !profile?.cv_data) {
        // User completed onboarding but CV data not ready yet
        setCvProcessing(true)

        // Start polling for CV data (check every 5 seconds)
        if (!cvCheckInterval) {
          const interval = setInterval(async () => {
            const { data: updatedProfile } = await supabase
              .from('profiles')
              .select('cv_data')
              .eq('id', user.id)
              .single()

            if (updatedProfile?.cv_data) {
              console.log('✅ CV data ready! Refreshing jobs...')
              setCvProcessing(false)
              clearInterval(interval)
              setCvCheckInterval(null)
              fetchJobs() // Refresh with CV data
            }
          }, 5000)

          setCvCheckInterval(interval)
        }
      } else if (profile?.cv_data) {
        // CV data is ready
        setCvProcessing(false)
        if (cvCheckInterval) {
          clearInterval(cvCheckInterval)
          setCvCheckInterval(null)
        }
      }

      // Use match-jobs edge Function for AI-powered matching
      const { data, error: matchError } = await supabase.functions.invoke('match-jobs', {
        body: {
          user_id: user.id,
          cv_data: profile?.cv_data,
          preferences: profile?.preferences,
          limit: 50, // Increased from 20 to 50
        },
      })

      if (matchError) {
        console.warn('Match function error, falling back to direct query:', matchError)
        // Fallback to direct query if Edge Function fails
        const { data: swipedJobs } = await supabase
          .from('swipes')
          .select('job_id')
          .eq('user_id', user.id)

        const swipedJobIds = swipedJobs?.map(s => s.job_id) || []

        let query = supabase
          .from('jobs')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(50) // Increased from 20 to 50

        if (swipedJobIds.length > 0) {
          query = query.not('id', 'in', `(${swipedJobIds.join(',')})`)
        }

        const { data: fallbackData, error: fetchError } = await query
        if (fetchError) throw fetchError

        const allJobsData = fallbackData || []
        setAllJobs(allJobsData)
        // Filter by threshold
        const filtered = allJobsData.filter(
          job => !job.match_score || job.match_score >= matchThreshold
        )
        setJobs(filtered)
      } else {
        const allJobsData = data?.jobs || []
        setAllJobs(allJobsData)
        // Filter by threshold
        const filtered = allJobsData.filter(
          job => !job.match_score || job.match_score >= matchThreshold
        )
        setJobs(filtered)
      }

      setCurrentIndex(0)
    } catch (err: unknown) {
      console.error('Error fetching jobs:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSwipe = async (direction: string, fromButton = false): Promise<void> => {
    const currentJob = jobs[currentIndex]
    if (!currentJob) return

    // If triggered by button, animate the card flying away
    if (fromButton) {
      const cardElement = document.querySelector('[data-card-id="' + currentJob.id + '"]') as HTMLElement
      if (cardElement) {
        // Fixed distance works reliably across all devices (Tinder-style)
        const flyDistance = direction === 'right' ? 600 : -600
        cardElement.style.transition =
          'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out'
        cardElement.style.transform = `translateX(${flyDistance}px) rotate(${direction === 'right' ? 15 : -15}deg)`
        cardElement.style.opacity = '0'

        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    try {
      // Record swipe
      const { error: swipeError } = await supabase.from('swipes').insert({
        user_id: user.id,
        job_id: currentJob.id,
        direction,
      })

      // Ignore duplicate swipe errors (shouldn't happen but handle gracefully)
      if (swipeError && swipeError.code !== '23505') {
        throw swipeError
      }

      // If swiped right, create a match
      if (direction === 'right') {
        const { error: matchError } = await supabase.from('matches').insert({
          user_id: user.id,
          job_id: currentJob.id,
          match_score: currentJob.match_score || 0.5, // Use actual match score from job
        })

        if (matchError && matchError.code !== '23505') {
          // Ignore duplicate errors
          throw matchError
        }

        // ============ APPLICATION ASSISTANT FEATURE START ============
        // Show application assistant after match (if user preference enabled)
        if (FEATURES.APPLICATION_ASSISTANT) {
          setMatchedJob(currentJob)
          // Fetch user profile if not already loaded
          if (!userProfile) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('cv_data, preferences, application_language_preference')
              .eq('id', user.id)
              .single()
            setUserProfile(profile)

            // Auto-open modal only if user has enabled it in settings
            if (profile?.preferences?.auto_open_application) {
              setTimeout(() => setShowApplicationModal(true), 500)
            }
          } else {
            // Profile already loaded, check preference
            if (userProfile?.preferences?.auto_open_application) {
              setTimeout(() => setShowApplicationModal(true), 500)
            }
          }
        }
        // ============ APPLICATION ASSISTANT FEATURE END ==============
      }

      // Move to next job
      setCurrentIndex(prev => prev + 1)

      // Reset flip state for next card
      setIsCardFlipped(false)

      // Fetch more jobs if running low
      if (currentIndex >= jobs.length - 3) {
        fetchJobs()
      }
    } catch (err) {
      console.error('Error recording swipe:', err)
      setError(err.message)
    }
  }

  const handleUndo = async () => {
    if (currentIndex === 0) return

    const previousJob = jobs[currentIndex - 1]

    try {
      // Delete the previous swipe
      await supabase.from('swipes').delete().eq('user_id', user.id).eq('job_id', previousJob.id)

      // Delete match if it exists
      await supabase.from('matches').delete().eq('user_id', user.id).eq('job_id', previousJob.id)

      setCurrentIndex(prev => prev - 1)
    } catch (err) {
      console.error('Error undoing swipe:', err)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const hasMoreJobs = currentIndex < jobs.length

  // Show checking state
  if (checkingOnboarding) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  // Show onboarding if needed
  if (needsOnboarding) {
    return <Onboarding user={user} onComplete={handleOnboardingComplete} />
  }

  // Show loading with CV processing message
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
        {cvProcessing && (
          <p className="text-gray-600 text-center max-w-md">
            🔄 Analyzing your CV...
            <br />
            <span className="text-sm">Jobs will be personalized in a moment!</span>
          </p>
        )}
      </div>
    )
  }

  // Show settings view
  if (showSettings) {
    return (
      <ProfileSettings 
        user={user} 
        onBack={() => setShowSettings(false)} 
        onLogout={handleLogout}
        jobStack={jobs} 
      />
    )
  }

  // Show matches view
  if (showMatches) {
    return <MatchesView user={user} onBack={() => setShowMatches(false)} />
  }

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            LazyJobs
          </h1>
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="w-6 h-6 text-yellow-500" />
            ) : (
              <Moon className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Loading Skeleton */}
        <div className="flex-1 flex items-center justify-center p-4">
          <JobCardSkeleton />
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex justify-center gap-4 p-8 bg-white">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
          <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse" />
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchJobs}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!hasMoreJobs) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
        {/* Header with Slider */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            🛋️ LazyJobs
          </h1>
          <div className="flex items-center gap-2">
            <MatchScoreSlider
              onThresholdChange={handleThresholdChange}
              totalJobs={allJobs.length}
              filteredCount={jobs.length}
              matchMode={matchMode}
            />
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="w-6 h-6 text-yellow-500" />
              ) : (
                <Moon className="w-6 h-6 text-gray-600" />
              )}
            </button>

            {/* AI Matching Toggle - Compact version in header */}
            {FEATURES.AI_MATCHING && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                <button
                  onClick={() => setMatchMode('keyword')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    matchMode === 'keyword'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Keyword matching"
                >
                  🔤
                </button>
                <button
                  onClick={() => setMatchMode('ai')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    matchMode === 'ai'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="AI semantic matching"
                >
                  🤖
                </button>
              </div>
            )}

            <button
              onClick={() => setShowMatches(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              title="View Matches"
            >
              <List className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              title="Settings"
            >
              <Settings className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* No Jobs Message */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              {jobs.length === 0 && allJobs.length > 0 ? 'No Jobs at This Level' : 'No More Jobs!'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {jobs.length === 0 && allJobs.length > 0
                ? `Try lowering the match threshold above. You have ${allJobs.length} total jobs available.`
                : "You've seen all available jobs. Check back later for new opportunities!"}
            </p>
            <button
              onClick={fetchJobs}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header - Compact */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          LazyJobs
        </h1>
        <div className="flex items-center gap-2">
          <MatchScoreSlider
            onThresholdChange={handleThresholdChange}
            totalJobs={allJobs.length}
            filteredCount={jobs.length}
            matchMode={matchMode}
          />
          {FEATURES.AI_MATCHING && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
              <button
                onClick={() => setMatchMode('keyword')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  matchMode === 'keyword'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Keyword matching"
              >
                🔤
              </button>
              <button
                onClick={() => setMatchMode('ai')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  matchMode === 'ai'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="AI semantic matching"
              >
                🤖
              </button>
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="w-6 h-6 text-yellow-500" />
            ) : (
              <Moon className="w-6 h-6 text-gray-600" />
            )}
          </button>
          <button
            onClick={() => setShowMatches(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            title="View Matches"
          >
            <List className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            title="Settings"
          >
            <Settings className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Card Stack - No wasted space */}
      <div className="flex-1 relative px-0 py-0 w-full mx-auto" style={{ touchAction: 'pan-y' }}>
        {/* Render current card and next 2 cards for smooth transitions */}
        {jobs.slice(currentIndex, currentIndex + 3).map((job, index) => (
          <JobCard
            key={job.id}
            job={job}
            cardId={job.id}
            onSwipe={index === 0 ? handleSwipe : () => {}}
            onFlip={index === 0 ? () => setIsCardFlipped(!isCardFlipped) : undefined}
            onReadMore={
              index === 0
                ? () => {
                    setSelectedJob(job)
                    setShowJobDetails(true)
                  }
                : undefined
            }
            isFlipped={index === 0 ? isCardFlipped : false}
            userSkills={userProfile?.cv_data?.skills_flat || []}
            userProfile={userProfile}
            style={{
              zIndex: 10 - index,
              transform: `scale(${1 - index * 0.05}) translateY(${index * 10}px)`,
              pointerEvents: index === 0 ? 'auto' : 'none',
            }}
          />
        ))}
      </div>

      {/* Action Buttons - Optimized size */}
      <div
        className="px-3 py-2 bg-white dark:bg-gray-800 shadow-lg"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
          <button
            onClick={() => handleSwipe('left', true)}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all active:scale-90 touch-manipulation"
            aria-label="Reject job"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={handleUndo}
            disabled={currentIndex === 0}
            className="w-12 h-12 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-600 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
            aria-label="Undo last swipe"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleSwipe('right', true)}
            className="w-16 h-16 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all active:scale-90 touch-manipulation"
            aria-label="Like job"
          >
            <Heart className="w-8 h-8" />
          </button>
        </div>

        <p className="text-center text-gray-500 dark:text-gray-400 text-xs mt-2">
          {jobs.length - currentIndex} jobs • Tap score to see details
        </p>
      </div>

      {/* Job Details Modal */}
      {showJobDetails && selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => {
            setShowJobDetails(false)
            setSelectedJob(null)
          }}
        />
      )}

      {/* ============ APPLICATION ASSISTANT FEATURE START ============ */}
      {/* Application Assistant Modal */}
      {FEATURES.APPLICATION_ASSISTANT && showApplicationModal && matchedJob && (
        <ApplicationModal
          job={matchedJob}
          userId={user.id}
          isPremium={userProfile?.subscription === 'premium' || false}
          onClose={() => {
            setShowApplicationModal(false)
            setMatchedJob(null)
          }}
        />
      )}
      {/* ============ APPLICATION ASSISTANT FEATURE END ============== */}
    </div>
  )
}
