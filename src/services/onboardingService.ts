import { supabase } from "@/integrations/supabase/client";
import { getConfig } from "@/lib/config";

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
   * Upload CV file to Supabase Storage
   */
  async uploadCV(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(fileName, file);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data } = supabase.storage.from("cvs").getPublicUrl(fileName);
    
    return data.publicUrl;
  },

  /**
   * Trigger CV processing webhook (if configured)
   */
  async processCV(cvUrl: string, userId: string): Promise<any> {
    const webhookUrl = getConfig("cv_webhook_url") as string;
    
    if (!webhookUrl) {
      console.warn("CV processing webhook not configured, skipping...");
      return null;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv_url: cvUrl, user_id: userId }),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("CV processing failed:", error);
      throw error;
    }
  },

  /**
   * Save CV data to user profile
   */
  async saveCVData(userId: string, cvUrl: string, cvData?: any): Promise<void> {
    const updates: any = {
      cv_data: cvData || { cv_url: cvUrl },
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) {
      throw new Error(`Failed to save CV data: ${error.message}`);
    }
  },

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
