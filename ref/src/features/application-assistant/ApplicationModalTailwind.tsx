/**
 * ============ APPLICATION ASSISTANT FEATURE (TAILWIND VERSION) ============
 * Modal for generating and reviewing application materials
 * Uses Tailwind classes instead of external CSS - follows app theme toggle
 * ==========================================================================
 */

import { useState } from 'react'
import { X } from 'lucide-react'
import { useApplicationGenerator } from './useApplicationGenerator'
import { FEATURES } from '../../lib/featureFlags'
import type { Job } from '../../types'

interface ApplicationModalTailwindProps {
  job: Job
  userId: string
  onClose: () => void
  isPremium?: boolean
}

export function ApplicationModalTailwind({ 
  job, 
  userId, 
  onClose, 
  isPremium = false 
}: ApplicationModalTailwindProps) {
  const { generate, loading, error, result } = useApplicationGenerator()
  const [languagePreference, setLanguagePreference] = useState<'auto' | 'en' | 'sv'>('auto')
  const [activeTab, setActiveTab] = useState<'cv' | 'cover_letter' | 'email'>('cv')

  // Check if feature is premium-only
  const isPremiumFeature = FEATURES.APPLICATION_ASSISTANT_PREMIUM_ONLY
  const canUse = !isPremiumFeature || isPremium

  const handleGenerate = async () => {
    if (!canUse) return

    try {
      await generate(job.id, userId, {
        languageOverride: languagePreference,
        include: ['cv', 'cover_letter', 'email'],
      })
    } catch {
      // Error handled by hook
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    console.log('✅ Copied to clipboard')
  }

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    // Overlay
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-5"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              📝 Application Assistant
            </h2>
            <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full">
              ✨ ATS-Optimized
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Job Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
              {job.title}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">{job.company}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{job.location}</p>
          </div>

          {/* ATS Info Banner */}
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>✨ ATS-Optimized:</strong> Your tailored CV includes exact keywords from the job description to maximize your ATS score and reach human recruiters.
            </p>
          </div>

          {!result ? (
            /* Generation Form */
            <div>
              {/* Premium Gate */}
              {isPremiumFeature && !isPremium && (
                <div className="text-center py-10">
                  <span className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    ✨ Premium Feature
                  </span>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Upgrade to generate tailored applications
                  </p>
                  <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition">
                    Upgrade to Premium
                  </button>
                </div>
              )}

              {canUse && (
                <>
                  {/* Language Selector */}
                  <div className="mb-6">
                    <label className="block font-semibold text-gray-800 dark:text-gray-100 mb-3">
                      Application Language
                    </label>
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <button
                        onClick={() => setLanguagePreference('auto')}
                        className={`px-4 py-3 border-2 rounded-lg font-medium transition ${
                          languagePreference === 'auto'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        🌍 Auto-detect
                      </button>
                      <button
                        onClick={() => setLanguagePreference('en')}
                        className={`px-4 py-3 border-2 rounded-lg font-medium transition ${
                          languagePreference === 'en'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        🇬🇧 English
                      </button>
                      <button
                        onClick={() => setLanguagePreference('sv')}
                        className={`px-4 py-3 border-2 rounded-lg font-medium transition ${
                          languagePreference === 'sv'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        🇸🇪 Swedish
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {languagePreference === 'auto'
                        ? "We'll detect the language from the job description"
                        : `Application will be generated in ${languagePreference === 'en' ? 'English' : 'Swedish'}`}
                    </p>
                  </div>

                  {/* What We'll Generate */}
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
                      We'll generate:
                    </h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-blue-900 dark:text-blue-200">
                        <span>📄</span>
                        <span>
                          <strong>Tailored CV</strong> - Highlights relevant experience
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-blue-900 dark:text-blue-200">
                        <span>📝</span>
                        <span>
                          <strong>Cover Letter</strong> - Personalized to the job
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-blue-900 dark:text-blue-200">
                        <span>✉️</span>
                        <span>
                          <strong>Email Draft</strong> - Ready to send
                        </span>
                      </li>
                    </ul>
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-900 dark:text-yellow-200">
                        <strong>⚠️ Review before sending!</strong> AI may emphasize skills to
                        match the job. Make sure you're comfortable with how your experience is
                        presented.
                      </p>
                    </div>
                  </div>

                  {/* Interview Test Box */}
                  <div className="mb-6 p-4 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-2 border-cyan-400 dark:border-cyan-600 rounded-xl flex gap-4">
                    <div className="text-4xl">💡</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-cyan-900 dark:text-cyan-100 mb-2">
                        The Interview Test
                      </h4>
                      <p className="text-cyan-900 dark:text-cyan-100 text-sm mb-3">
                        If you get asked about something in your CV, can you confidently discuss
                        it?
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="text-green-700 dark:text-green-400 font-medium">
                          ✅ If YES → Good tailoring!
                        </div>
                        <div className="text-orange-700 dark:text-orange-400 font-medium">
                          ⚠️ If NO → Edit before sending
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                      ❌ {error}
                    </div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg hover:-translate-y-0.5 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? '⏳ Generating...' : '✨ Generate Application'}
                  </button>
                </>
              )}
            </div>
          ) : (
            /* Results View */
            <div>
              {/* Language Badge */}
              <div className="inline-block px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full text-green-700 dark:text-green-300 font-semibold text-sm mb-6">
                Generated in: {result.language === 'sv' ? '🇸🇪 Swedish' : '🇬🇧 English'}
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b-2 border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('cv')}
                  className={`px-6 py-3 font-medium transition -mb-0.5 border-b-2 ${
                    activeTab === 'cv'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  📄 CV
                </button>
                <button
                  onClick={() => setActiveTab('cover_letter')}
                  className={`px-6 py-3 font-medium transition -mb-0.5 border-b-2 ${
                    activeTab === 'cover_letter'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  📝 Cover Letter
                </button>
                <button
                  onClick={() => setActiveTab('email')}
                  className={`px-6 py-3 font-medium transition -mb-0.5 border-b-2 ${
                    activeTab === 'email'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  ✉️ Email
                </button>
              </div>

              {/* Content Preview */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6 min-h-[400px]">
                {activeTab === 'cv' && (
                  <div>
                    <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-gray-800 dark:text-gray-100 mb-4">
                      {result.cv}
                    </pre>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleCopy(result.cv)}
                        className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={() => handleDownload(result.cv, 'cv.md')}
                        className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        💾 Download
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'cover_letter' && (
                  <div>
                    <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-gray-800 dark:text-gray-100 mb-4">
                      {result.cover_letter}
                    </pre>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleCopy(result.cover_letter)}
                        className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={() => handleDownload(result.cover_letter, 'cover-letter.md')}
                        className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        💾 Download
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'email' && (
                  <div>
                    <div className="mb-4">
                      <label className="block font-semibold text-gray-800 dark:text-gray-100 mb-2 text-sm">
                        Subject:
                      </label>
                      <input
                        type="text"
                        value={result.email.subject}
                        readOnly
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block font-semibold text-gray-800 dark:text-gray-100 mb-2 text-sm">
                        Body:
                      </label>
                      <textarea
                        value={result.email.body}
                        readOnly
                        rows={10}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 resize-y"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          handleCopy(`Subject: ${result.email.subject}\n\n${result.email.body}`)
                        }
                        className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        📋 Copy Email
                      </button>
                      <button
                        onClick={() => {
                          window.location.href = `mailto:?subject=${encodeURIComponent(result.email.subject)}&body=${encodeURIComponent(result.email.body)}`
                        }}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                      >
                        📧 Open in Email Client
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Again */}
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                🔄 Generate Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
