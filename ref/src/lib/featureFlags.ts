/**
 * Feature Flags
 * Now powered by Supabase app_settings table
 * Toggle features without rebuild/redeploy!
 *
 * Usage:
 * - Import { FEATURES } from './featureFlags'
 * - Check: if (FEATURES.AI_MATCHING) { ... }
 * - Update: Change in Supabase app_settings table
 */

interface AppConfig {
  features?: {
    ai_matching?: boolean
    ai_matching_premium?: boolean
    ai_matching_show_stats?: boolean
    application_assistant?: boolean
    application_assistant_premium?: boolean
    qdrant_enabled?: boolean
  }
  config?: Record<string, unknown>
}

// Get config from localStorage cache
// This is set by getAppConfig() on app load
function getCachedConfig(): AppConfig {
  try {
    const cached = localStorage.getItem('app_config')
    if (cached) {
      const { data } = JSON.parse(cached)
      return data
    }
  } catch (e: unknown) {
    console.warn('Failed to read cached config:', e)
  }

  // Fallback to env vars if available (for local development)
  return {
    features: {
      ai_matching: import.meta.env.VITE_ENABLE_AI_MATCHING === 'true',
      ai_matching_premium: import.meta.env.VITE_AI_MATCHING_PREMIUM === 'true',
      ai_matching_show_stats: import.meta.env.VITE_AI_MATCHING_SHOW_STATS === 'true',
      application_assistant: import.meta.env.VITE_ENABLE_APPLICATION_ASSISTANT === 'true',
      application_assistant_premium: import.meta.env.VITE_APPLICATION_ASSISTANT_PREMIUM === 'true',
      qdrant_enabled: import.meta.env.VITE_QDRANT_ENABLED === 'true',
    },
  }
}

/**
 * Feature flags with dynamic getters
 * Reads from Supabase config (cached in localStorage)
 */
export const FEATURES = {
  get AI_MATCHING() {
    const config = getCachedConfig()
    return config.features?.ai_matching || false
  },

  get AI_MATCHING_PREMIUM_ONLY() {
    const config = getCachedConfig()
    return config.features?.ai_matching_premium || false
  },

  get AI_MATCHING_SHOW_STATS() {
    const config = getCachedConfig()
    // Always show stats in development
    if (import.meta.env.DEV) return true
    return config.features?.ai_matching_show_stats || false
  },

  get APPLICATION_ASSISTANT() {
    const config = getCachedConfig()
    return config.features?.application_assistant || false
  },

  get APPLICATION_ASSISTANT_PREMIUM_ONLY() {
    const config = getCachedConfig()
    return config.features?.application_assistant_premium || false
  },

  get QDRANT_ENABLED() {
    const config = getCachedConfig()
    return config.features?.qdrant_enabled || false
  },
}

/**
 * Get public config values
 */
export function getConfig(key: string): unknown {
  const config = getCachedConfig()
  return config.config?.[key] || null
}
