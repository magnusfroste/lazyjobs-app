import { supabase } from "@/integrations/supabase/client";

export interface OnboardingPreferences {
  location?: string;
  salary_min?: number;
  work_type?: string;
  employment_types?: string[];
}

export interface SurveyAnswers {
  job_search_stage?: string;
  priorities?: string[];
  experience_years?: string;
}

export const onboardingService = {
  /**
   * Save user preferences
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
  },

  /**
   * Mark onboarding as completed
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
  },
};
