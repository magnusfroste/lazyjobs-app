/**
 * ============ AI MATCHING FEATURE ============
 * Toggle component for switching between Keyword and AI matching
 *
 * Shows:
 * - Mode selection (Keyword vs AI)
 * - Comparison stats (A/B testing)
 * - Premium badge if needed
 *
 * Can be removed by deleting this file
 * ============================================
 */

import { useState } from 'react'
import { FEATURES } from '../lib/featureFlags'
import type { MatchMode } from '../types'
import './MatchModeToggle.css'

interface MatchStats {
  avgScore?: number
  count?: number
  matches?: number
  swipes?: number
  matchRate?: number
}

interface MatchModeToggleProps {
  mode: MatchMode
  onChange: (mode: MatchMode) => void
  isPremium?: boolean
  keywordStats?: MatchStats
  aiStats?: MatchStats
}

export function MatchModeToggle({
  mode,
  onChange,
  isPremium = false,
  keywordStats = {},
  aiStats = {},
}: MatchModeToggleProps) {
  const [showStats, setShowStats] = useState(FEATURES.AI_MATCHING_SHOW_STATS)

  const isAIPremiumOnly = FEATURES.AI_MATCHING_PREMIUM_ONLY
  const canUseAI = !isAIPremiumOnly || isPremium

  return (
    <div className="match-mode-toggle">
      {/* Toggle Buttons */}
      <div className="toggle-buttons">
        <button
          onClick={() => onChange('keyword')}
          className={`toggle-btn ${mode === 'keyword' ? 'active' : ''}`}
        >
          <span className="toggle-icon">🔤</span>
          <span className="toggle-label">Keyword Match</span>
          {showStats && keywordStats.avgScore && (
            <span className="toggle-stat">{keywordStats.avgScore}% avg</span>
          )}
        </button>

        <button
          onClick={() => canUseAI && onChange('ai')}
          className={`toggle-btn ${mode === 'ai' ? 'active' : ''} ${!canUseAI ? 'disabled' : ''}`}
          disabled={!canUseAI}
        >
          <span className="toggle-icon">🤖</span>
          <span className="toggle-label">AI Match</span>
          {!canUseAI && <span className="premium-badge">✨ Premium</span>}
          {showStats && aiStats.avgScore && (
            <span className="toggle-stat">{aiStats.avgScore}% avg</span>
          )}
        </button>
      </div>

      {/* A/B Testing Stats (Development/Testing) */}
      {showStats && (keywordStats.count || aiStats.count) && (
        <div className="ab-stats">
          <button onClick={() => setShowStats(!showStats)} className="stats-toggle">
            📊 {showStats ? 'Hide' : 'Show'} Stats
          </button>

          {showStats && (
            <div className="stats-details">
              <div className="stat-row">
                <span className="stat-label">Keyword:</span>
                <span className="stat-value">
                  {keywordStats.matches || 0} matches / {keywordStats.swipes || 0} swipes
                  {keywordStats.matchRate && ` (${keywordStats.matchRate}%)`}
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">AI:</span>
                <span className="stat-value">
                  {aiStats.matches || 0} matches / {aiStats.swipes || 0} swipes
                  {aiStats.matchRate && ` (${aiStats.matchRate}%)`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Banner */}
      {mode === 'ai' && (
        <div className="mode-info">
          <span className="info-icon">ℹ️</span>
          <span className="info-text">
            AI matching uses semantic search to find jobs based on meaning, not just keywords
          </span>
        </div>
      )}
    </div>
  )
}
