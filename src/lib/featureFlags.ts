/**
 * Convenient feature flag accessors
 * Usage: if (FEATURES.AI_MATCHING) { ... }
 */

import { getFeature } from "./config";

export const FEATURES = {
  get APPLICATION_ASSISTANT() {
    return getFeature("application_assistant");
  },

  get APPLICATION_ASSISTANT_PREMIUM() {
    return getFeature("application_assistant_premium");
  },
};
