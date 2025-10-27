/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_OPENAI_API_KEY?: string
  readonly VITE_QDRANT_URL?: string
  readonly VITE_QDRANT_API_KEY?: string
  readonly VITE_ENABLE_AI_MATCHING?: string
  readonly VITE_ENABLE_APPLICATION_ASSISTANT?: string
  readonly VITE_APPLICATION_ASSISTANT_PREMIUM?: string
  readonly VITE_ENABLE_QDRANT?: string
  readonly VITE_SENTRY_DSN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
