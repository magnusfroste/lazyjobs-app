export interface FeatureFlags {
  application_assistant?: boolean;
  application_assistant_premium?: boolean;
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
