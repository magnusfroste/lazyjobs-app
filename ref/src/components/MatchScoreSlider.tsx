// @ts-nocheck
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Sliders, Sparkles, TrendingUp, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface MatchScoreSliderProps {
  onThresholdChange: (threshold: number) => void
  totalJobs: number
  filteredCount?: number
  matchMode?: 'keyword' | 'ai'
}

export default function MatchScoreSlider({ onThresholdChange, totalJobs, filteredCount, matchMode = 'keyword' }: MatchScoreSliderProps) {
  const [threshold, setThreshold] = useState<number>(50)
  const [topN, setTopN] = useState<number>(25)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  // Use real filtered count from parent
  const jobCount = filteredCount !== undefined ? filteredCount : totalJobs

  const handleChange = (value: number): void => {
    if (matchMode === 'ai') {
      setTopN(value)
      // For AI mode, pass the topN value directly (not as percentage)
      onThresholdChange(value)
    } else {
      setThreshold(value)
      onThresholdChange(value / 100)
    }
  }

  const getQualityLabel = (): { text: string; color: string; icon: LucideIcon } => {
    if (matchMode === 'ai') {
      return { text: 'AI Matches', color: 'text-purple-600', icon: Sparkles }
    }
    if (threshold >= 90)
      return { text: 'Perfect Matches', color: 'text-purple-600', icon: Sparkles }
    if (threshold >= 75) return { text: 'Great Matches', color: 'text-blue-600', icon: TrendingUp }
    if (threshold >= 60) return { text: 'Good Matches', color: 'text-green-600', icon: TrendingUp }
    return { text: 'All Matches', color: 'text-gray-600', icon: Sliders }
  }

  const quality = getQualityLabel()
  const QualityIcon = quality.icon

  return (
    <div className="relative">
      {/* Toggle Button - Compact Single Row */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 rounded-full shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-600"
      >
        {matchMode === 'ai' ? (
          <>
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Top {topN}</span>
          </>
        ) : (
          <>
            <Sliders className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{threshold}%</span>
          </>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slider Panel */}
      {isOpen && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-80 z-50 border border-gray-100 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <QualityIcon className={`w-5 h-5 ${quality.color}`} />
              <h3 className="font-bold text-gray-800 dark:text-gray-100">{quality.text}</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Job Count Preview */}
          <div
            className={`rounded-lg p-4 mb-4 ${
              jobCount === 0
                ? 'bg-gradient-to-r from-red-50 to-orange-50'
                : 'bg-gradient-to-r from-blue-50 to-purple-50'
            }`}
          >
            <div className="text-center">
              <div
                className={`text-4xl font-bold bg-clip-text text-transparent ${
                  jobCount === 0
                    ? 'bg-gradient-to-r from-red-600 to-orange-600'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600'
                }`}
              >
                {jobCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {jobCount === 0 ? '⚠️ No jobs at this level' : 'jobs to swipe through'}
              </div>
              {jobCount === 0 && (
                <div className="text-xs text-orange-600 mt-2 font-medium">
                  Try lowering the threshold
                </div>
              )}
            </div>
          </div>

          {/* Slider or Top N Selector */}
          {matchMode === 'keyword' ? (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span>More Jobs</span>
                <span>Better Quality</span>
              </div>

              <input
                type="range"
                min="0"
                max="95"
                step="5"
                value={threshold}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, 
                    #3b82f6 0%, 
                    #3b82f6 ${threshold}%, 
                    #e5e7eb ${threshold}%, 
                    #e5e7eb 100%)`,
                }}
              />

              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>95%</span>
              </div>
            </div>
          ) : null}

          {/* Quick Presets */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {matchMode === 'ai' ? 'How many matches to show:' : 'Quick Select:'}
            </div>
            {matchMode === 'ai' ? (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleChange(10)}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition ${
                    topN === 10
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-2 border-purple-300 dark:border-purple-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="text-xl mb-1">🎯</div>
                  <div>Top 10</div>
                </button>
                <button
                  onClick={() => handleChange(25)}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition ${
                    topN === 25
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-2 border-purple-300 dark:border-purple-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="text-xl mb-1">⭐</div>
                  <div>Top 25</div>
                </button>
                <button
                  onClick={() => handleChange(50)}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition ${
                    topN === 50
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-2 border-purple-300 dark:border-purple-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="text-xl mb-1">🚀</div>
                  <div>Top 50</div>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleChange(50)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    threshold === 50
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All (50%+)
                </button>
                <button
                  onClick={() => handleChange(75)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    threshold === 75
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Great (75%+)
                </button>
                <button
                  onClick={() => handleChange(90)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    threshold === 90
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Perfect (90%+)
                </button>
              </div>
            )}
          </div>

          {/* Info Text */}
          <div className={`mt-4 p-3 rounded-lg ${
            matchMode === 'ai' 
              ? 'bg-purple-50 dark:bg-purple-900/30' 
              : 'bg-blue-50 dark:bg-blue-900/30'
          }`}>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {matchMode === 'ai' ? (
                <>
                  <span className="font-semibold">🤖 AI Ranking:</span> Jobs are sorted by semantic
                  similarity to your CV. The best matches appear first!
                </>
              ) : (
                <>
                  💡 <strong>Tip:</strong> Start with lower threshold to help the algorithm learn your
                  preferences, then increase for better matches!
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #9333ea);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
          transition: transform 0.2s;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #9333ea);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
        }
      `}</style>
    </div>
  )
}
