// @ts-nocheck
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Job, Match } from '../types'
import { ExternalLink, MapPin, DollarSign, Briefcase, CheckCircle, X, FileText } from 'lucide-react'
import { FEATURES } from '../lib/featureFlags'
import { ApplicationModalTailwind as ApplicationModal } from '../features/application-assistant/ApplicationModalTailwind'
import { htmlToFormattedText, isHTML } from '../lib/htmlToText'

interface MatchesViewProps {
  user: User
  onBack: () => void
}

interface MatchWithJob extends Match {
  job: Job
}

export default function MatchesView({ user, onBack }: MatchesViewProps) {
  const [matches, setMatches] = useState<MatchWithJob[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({})
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})
  // ============ APPLICATION ASSISTANT FEATURE START ============
  const [showApplicationModal, setShowApplicationModal] = useState<boolean>(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  // ============ APPLICATION ASSISTANT FEATURE END ==============

  useEffect(() => {
    fetchMatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchMatches = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      // Fetch matches with job details
      const { data, error: fetchError } = await supabase
        .from('matches')
        .select(
          `
          *,
          job:jobs (*)
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setMatches(data || [])
    } catch (err) {
      console.error('Error fetching matches:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleApplied = async (matchId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({
          is_applied: !currentStatus,
          applied_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq('id', matchId)

      if (error) throw error

      // Update local state
      setMatches(
        matches.map(m =>
          m.id === matchId
            ? {
                ...m,
                is_applied: !currentStatus,
                applied_at: !currentStatus ? new Date().toISOString() : null,
              }
            : m
        )
      )
    } catch (err) {
      console.error('Error updating match:', err)
    }
  }

  const deleteMatch = async matchId => {
    if (!confirm('Remove this match?')) return

    try {
      console.log('🗑️ Deleting match:', matchId)
      
      const { data, error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId)
        .select() // Return deleted row to verify

      if (error) {
        console.error('❌ Delete error:', error)
        alert(`Failed to delete match: ${error.message}`)
        throw error
      }

      console.log('✅ Match deleted:', data)
      
      // Update local state only if deletion succeeded
      setMatches(matches.filter(m => m.id !== matchId))
    } catch (err) {
      console.error('❌ Error deleting match:', err)
      alert(`Error: ${err.message || 'Failed to delete match'}`)
    }
  }

  const toggleFlip = matchId => {
    setFlippedCards(prev => ({
      ...prev,
      [matchId]: !prev[matchId],
    }))
  }

  const toggleExpand = matchId => {
    setExpandedCards(prev => ({
      ...prev,
      [matchId]: !prev[matchId],
    }))
  }

  const getMatchBreakdown = match => {
    // Use stored breakdown from match metadata, or calculate from job
    if (match.metadata?.match_breakdown) {
      return {
        overall: match.match_score ? Math.round(match.match_score * 100) : 75,
        ...match.metadata.match_breakdown,
      }
    }

    // Fallback: Use job data (for old matches without breakdown)
    const job = match.job
    return {
      overall: match.match_score ? Math.round(match.match_score * 100) : 75,
      skills: 75, // Default
      salary: job.salary_min ? 100 : 50,
      location: job.location ? 85 : 50,
      remote: job.is_remote ? 80 : 50,
      employment: job.employment_type === 'full-time' ? 100 : 75,
    }
  }

  const formatSalary = (min?: number | null, max?: number | null, currency?: string | null): string | null => {
    if (!min && !max) return null
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    })
    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`
    }
    return formatter.format((min || max) as number)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Loading matches...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchMatches}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            ← Back to Swipe
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            My Matches
          </h1>
          <div className="w-24"></div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {matches.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💼</div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              No matches yet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Start swiping right on jobs you like!
            </p>
            <button
              onClick={onBack}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
            >
              Start Swiping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {matches.length} {matches.length === 1 ? 'match' : 'matches'}
            </p>

            {matches.map(match => {
              const isFlipped = flippedCards[match.id]
              const isExpanded = expandedCards[match.id]
              const breakdown = getMatchBreakdown(match)

              return (
                <div
                  key={match.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
                >
                  {/* FRONT SIDE - Job Details */}
                  <div
                    className={`p-6 transition-opacity duration-300 ${isFlipped ? 'hidden' : 'block'}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                          {match.job.title}
                        </h3>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                          {match.job.company}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {match.match_score && (
                          <button
                            onClick={() => toggleFlip(match.id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-bold hover:bg-blue-600 transition"
                            title="View match breakdown"
                          >
                            {Math.round(match.match_score * 100)}% ✨
                          </button>
                        )}
                        <button
                          onClick={() => deleteMatch(match.id)}
                          className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-2"
                          title="Remove match"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span>{match.job.location || 'Location not specified'}</span>
                        {match.job.is_remote && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Remote
                          </span>
                        )}
                      </div>

                      {(match.job.salary_min || match.job.salary_max) && (
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold">
                            {formatSalary(
                              match.job.salary_min,
                              match.job.salary_max,
                              match.job.salary_currency
                            )}
                          </span>
                        </div>
                      )}

                      {match.job.employment_type && (
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Briefcase className="w-4 h-4" />
                          <span className="capitalize">{match.job.employment_type}</span>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {match.job.required_skills && match.job.required_skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {match.job.required_skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Job Description - Expandable */}
                    {match.job.description && (
                      <div className="mb-4">
                        <button
                          onClick={() => toggleExpand(match.id)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          {isExpanded ? 'Hide' : 'Show'} Job Description
                        </button>
                        {isExpanded && (
                          <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                              {isHTML(match.job.description)
                                ? htmlToFormattedText(match.job.description)
                                : match.job.description}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t">
                      {/* ============ APPLICATION ASSISTANT FEATURE START ============ */}
                      {FEATURES.APPLICATION_ASSISTANT && !match.is_applied && (
                        <button
                          onClick={() => {
                            setSelectedJob(match.job)
                            setShowApplicationModal(true)
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <FileText className="w-4 h-4" />
                          Apply Now
                        </button>
                      )}
                      {/* ============ APPLICATION ASSISTANT FEATURE END ============== */}

                      <button
                        onClick={() => toggleApplied(match.id, match.is_applied)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                          match.is_applied
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {match.is_applied ? 'Applied' : 'Mark as Applied'}
                      </button>

                      {match.job.url && (
                        <a
                          href={match.job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Job
                        </a>
                      )}
                    </div>

                    {/* Match info */}
                    <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                      Matched {new Date(match.created_at).toLocaleDateString()}
                      {match.match_score && ` • ${Math.round(match.match_score * 100)}% match`}
                    </div>
                  </div>

                  {/* BACK SIDE - Match Breakdown */}
                  <div
                    className={`p-6 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 transition-opacity duration-300 ${isFlipped ? 'block' : 'hidden'}`}
                  >
                    {/* Close Button */}
                    <button
                      onClick={() => toggleFlip(match.id)}
                      className="float-right w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 transition"
                      aria-label="Close match breakdown"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Overall Score */}
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white mb-2">
                        <div>
                          <div className="text-3xl font-bold">{breakdown.overall}%</div>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        Match Breakdown
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Why this job matches your profile
                      </p>
                    </div>

                    {/* Breakdown Details */}
                    <div className="space-y-3">
                      {/* Skills Match */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                            Skills Match
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                            {breakdown.skills}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${breakdown.skills}%` }}
                          />
                        </div>
                      </div>

                      {/* Salary Match */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                            Salary Range
                          </span>
                          <span className="text-green-600 dark:text-green-400 font-bold text-sm">
                            {breakdown.salary}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${breakdown.salary}%` }}
                          />
                        </div>
                      </div>

                      {/* Location Match */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                            Location
                          </span>
                          <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">
                            {breakdown.location}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${breakdown.location}%` }}
                          />
                        </div>
                      </div>

                      {/* Remote Preference */}
                      {breakdown.remote !== undefined && (
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                              Remote Preference
                            </span>
                            <span className="text-teal-600 dark:text-teal-400 font-bold text-sm">
                              {breakdown.remote}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full transition-all"
                              style={{ width: `${breakdown.remote}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Employment Type */}
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                            Employment Type
                          </span>
                          <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                            {breakdown.employment}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
                            style={{ width: `${breakdown.employment}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ============ APPLICATION ASSISTANT FEATURE START ============ */}
      {/* Application Assistant Modal */}
      {FEATURES.APPLICATION_ASSISTANT && showApplicationModal && selectedJob && (
        <ApplicationModal
          job={selectedJob}
          userId={user.id}
          isPremium={false} // TODO: Get from user profile
          onClose={() => {
            setShowApplicationModal(false)
            setSelectedJob(null)
          }}
        />
      )}
      {/* ============ APPLICATION ASSISTANT FEATURE END ============== */}
    </div>
  )
}
