// Supabase Database Types for LazyJobs

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: Job
        Insert: Omit<Job, 'id' | 'created_at'>
        Update: Partial<Omit<Job, 'id' | 'created_at'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      matches: {
        Row: Match
        Insert: Omit<Match, 'id' | 'created_at'>
        Update: Partial<Omit<Match, 'id' | 'created_at'>>
      }
      swipes: {
        Row: Swipe
        Insert: Omit<Swipe, 'id' | 'created_at'>
        Update: Partial<Omit<Swipe, 'id' | 'created_at'>>
      }
      swipe_events: {
        Row: SwipeEvent
        Insert: Omit<SwipeEvent, 'id' | 'created_at'>
        Update: Partial<Omit<SwipeEvent, 'id' | 'created_at'>>
      }
    }
  }
}

// Job Post
export interface Job {
  id: string
  external_id: string
  title: string
  company: string
  description: string
  location: string
  employment_type?: string
  experience_level?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  is_remote: boolean
  url?: string
  posted_date?: string
  expires_date?: string
  required_skills: string[]
  nice_to_have_skills: string[]
  benefits?: string[]
  metadata?: Record<string, unknown>
  created_at: string
  source?: string
  match_score?: number // AI/keyword matching score (0-1)
}

// User Profile
export interface Profile {
  id: string
  user_id: string
  full_name?: string
  email?: string
  cv_text?: string
  cv_data?: any // Parsed CV data from AI
  skills: string[]
  experience_years?: number
  desired_roles?: string[]
  desired_locations?: string[]
  remote_preference?: 'only' | 'hybrid' | 'no' | 'any'
  min_salary?: number
  preferences?: ProfilePreferences
  onboarding_completed: boolean
  application_language_preference?: 'auto' | 'en' | 'sv'
  created_at: string
  updated_at: string
}

export interface ProfilePreferences {
  match_threshold?: number
  auto_open_application?: boolean
  [key: string]: unknown
}

// Match
export interface Match {
  id: string
  user_id: string
  job_id: string
  match_score: number
  match_type: 'keyword' | 'ai'
  matched_skills: string[]
  missing_skills: string[]
  is_applied?: boolean // User marked as applied
  applied_at?: string // When user applied
  created_at: string
}

// Swipe
export interface Swipe {
  id: string
  user_id: string
  job_id: string
  direction: 'left' | 'right'
  match_score?: number
  created_at: string
}

// Swipe Event (for analytics/ML tracking)
export interface SwipeEvent {
  id: string
  user_id: string
  job_id: string
  direction: string
  match_score?: number
  time_spent_seconds?: number
  viewed_breakdown?: boolean
  job_title?: string
  company_name?: string
  salary_min?: number
  salary_max?: number
  location?: string
  is_remote?: boolean
  employment_type?: string
  experience_level?: string
  required_skills?: string[]
  session_id?: string
  device_type?: string
  created_at: string
}

// Application Assistant
export interface ApplicationData {
  cv: string
  coverLetter: string
  emailDraft: string
  language: 'en' | 'sv'
}

// Feature Flags
export interface FeatureFlags {
  ai_matching_enabled: boolean
  application_assistant_enabled: boolean
  application_assistant_premium: boolean
  qdrant_enabled: boolean
  [key: string]: boolean | string | number
}
