// Common types for LazyJobs

export * from './supabase'

// Component Props Types
export interface JobCardProps {
  job: import('./supabase').Job
  matchScore?: number
  matchedSkills?: string[]
  missingSkills?: string[]
  onSwipe?: (direction: 'left' | 'right') => void
  onDetailsClick?: () => void
}

export interface AuthProps {
  onAuthSuccess?: () => void
}

export interface OnboardingProps {
  user: {
    id: string
    email?: string
  }
  onComplete: () => void
}

export interface SwipeInterfaceProps {
  user: {
    id: string
    email?: string
  }
}

// Match Mode
export type MatchMode = 'keyword' | 'ai'

// Theme
export type Theme = 'light' | 'dark' | 'system'

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Feature Flags
export interface FeatureFlags {
  ai_matching?: boolean
  ai_matching_enabled?: boolean
  ai_matching_premium?: boolean
  ai_matching_show_stats?: boolean
  application_assistant?: boolean
  application_assistant_enabled?: boolean
  application_assistant_premium?: boolean
  qdrant_enabled?: boolean
  [key: string]: boolean | string | number | undefined
}

// Qdrant Types
export interface QdrantSearchResult {
  id: string
  score: number
  payload: Record<string, unknown>
}

export interface SemanticSearchParams {
  query: string
  limit?: number
  filter?: Record<string, unknown>
}
