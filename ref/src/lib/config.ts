/**
 * Dynamic App Configuration
 * Fetches feature flags and config from Supabase instead of env vars
 * Benefits:
 * - Toggle features without rebuild/redeploy
 * - Single source of truth
 * - Cached in localStorage for performance
 */

import { supabase } from './supabase'
import type { FeatureFlags } from '../types'

const CACHE_KEY = 'app_config'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface AppConfig {
  features: FeatureFlags
  config: Record<string, unknown>
}

interface CachedConfig {
  data: AppConfig
  timestamp: number
}

let configCache: AppConfig | null = null
let lastFetch: number | null = null

/**
 * Fetch app configuration from Supabase
 * Returns cached config if still fresh
 */
export async function getAppConfig(forceRefresh = false): Promise<AppConfig> {
  // Return cache if still fresh
  if (!forceRefresh && configCache && lastFetch && Date.now() - lastFetch < CACHE_DURATION) {
    return configCache
  }

  // Try localStorage cache first (skip in incognito/private mode)
  if (!forceRefresh) {
    try {
      // Check if localStorage is available (fails in incognito in some browsers)
      if (typeof localStorage !== 'undefined' && localStorage !== null) {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached) as CachedConfig
          if (Date.now() - timestamp < CACHE_DURATION) {
            configCache = data
            lastFetch = timestamp
            return data
          }
        }
      }
    } catch (e: unknown) {
      console.warn('Failed to load cached config (incognito mode?):', e)
      // Continue without cache - not critical
    }
  }

  // Fetch from Supabase
  try {
    const { data, error } = await supabase.from('app_settings').select('key, value')

    if (error) throw error

    // Transform array to object
    const settings = (data || []) as Array<{ key: string; value: any }>
    const config: AppConfig = {
      features: (settings.find(s => s.key === 'features')?.value as FeatureFlags) || {},
      config: (settings.find(s => s.key === 'config')?.value as Record<string, unknown>) || {},
    }

    // Cache it in memory (always works)
    configCache = config
    lastFetch = Date.now()

    // Also cache in localStorage if available (skip in incognito)
    try {
      if (typeof localStorage !== 'undefined' && localStorage !== null) {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            data: config,
            timestamp: lastFetch,
          })
        )
      }
    } catch (e: unknown) {
      console.warn('Failed to cache config in localStorage (incognito mode?):', e)
      // Not critical - we have memory cache
    }

    return config
  } catch (error: unknown) {
    console.error('Failed to fetch config from Supabase:', error)

    // Fallback to defaults
    return {
      features: {
        ai_matching: false,
        ai_matching_premium: false,
        ai_matching_show_stats: false,
        application_assistant: false,
        application_assistant_premium: false,
        qdrant_enabled: false,
      },
      config: {},
    }
  }
}

/**
 * Clear config cache (useful for testing or forcing refresh)
 */
export function clearConfigCache() {
  configCache = null
  lastFetch = null
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (e: unknown) {
    console.warn('Failed to clear cache:', e)
  }
}

/**
 * Initialize config on app load
 * Call this in your main app component
 */
export async function initializeConfig(): Promise<AppConfig> {
  return await getAppConfig()
}
