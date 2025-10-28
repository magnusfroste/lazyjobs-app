export interface FeatureFlags {
  ai_matching?: boolean;
  ai_matching_premium?: boolean;
  ai_matching_show_stats?: boolean;
  application_assistant?: boolean;
  application_assistant_premium?: boolean;
  qdrant_enabled?: boolean;
  [key: string]: boolean | undefined;
}

export interface AppConfig {
  features: FeatureFlags;
  config: Record<string, unknown>;
}

export interface CachedConfig {
  data: AppConfig;
  timestamp: number;
}
