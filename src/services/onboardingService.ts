import { supabase } from "@/integrations/supabase/client";

/**
 * User preferences set during onboarding.
 */
export interface OnboardingPreferences {
  location?: string;
  salary_min?: number;
  work_type?: string;
  employment_types?: string[];
}

/**
 * Survey answers collected during onboarding.
 */
export interface SurveyAnswers {
  job_search_stage?: string;
  priorities?: string[];
  experience_years?: string;
}

/**
 * Service for managing user onboarding flow.
 * Handles preferences saving and onboarding completion.
 */
class OnboardingService {
  /**
   * Save user preferences to their profile.
   * @param userId - The user's ID
   * @param preferences - Job search preferences to save
   * @throws Error if save fails
   */
  async savePreferences(
    userId: string,
    preferences: OnboardingPreferences
  ): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({
        preferences: preferences as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      throw new Error(`Failed to save preferences: ${error.message}`);
    }
  }

  /**
   * Mark the user's onboarding as completed.
   * @param userId - The user's ID
   * @throws Error if update fails
   */
  async completeOnboarding(userId: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      throw new Error(`Failed to complete onboarding: ${error.message}`);
    }
  }
}

export const onboardingService = new OnboardingService();
