/**
 * Convenient feature flag accessors
 * Usage: if (FEATURES.AI_MATCHING) { ... }
 */

import { getFeature } from "./config";

export const FEATURES = {
  get AI_MATCHING() {
    return getFeature("ai_matching");
  },

  get AI_MATCHING_PREMIUM() {
    return getFeature("ai_matching_premium");
  },

  get AI_MATCHING_SHOW_STATS() {
    return getFeature("ai_matching_show_stats");
  },

  get APPLICATION_ASSISTANT() {
    return getFeature("application_assistant");
  },

  get APPLICATION_ASSISTANT_PREMIUM() {
    return getFeature("application_assistant_premium");
  },

  get QDRANT_ENABLED() {
    return getFeature("qdrant_enabled");
  },
};
