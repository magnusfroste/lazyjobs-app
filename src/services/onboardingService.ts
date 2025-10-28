import { supabase } from "@/integrations/supabase/client";

export interface OnboardingPreferences {
  location?: string;
  salary_min?: number;
  work_type?: string;
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
   * Save survey answers (merged into preferences)
   */
  async saveSurvey(userId: string, survey: SurveyAnswers): Promise<void> {
    // Get current preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", userId)
      .single();

    const currentPreferences = (profile?.preferences as any) || {};
    
    const { error } = await supabase
      .from("profiles")
      .update({
        preferences: {
          ...currentPreferences,
          onboarding_survey: survey,
        } as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      throw new Error(`Failed to save survey: ${error.message}`);
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
