import { supabase } from "@/integrations/supabase/client";
import { Tables, Json } from "@/integrations/supabase/types";
import { getConfig } from "@/lib/config";

type Profile = Tables<"profiles">;

export class ProfileServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileServiceError";
  }
}

export class ProfileService {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new ProfileServiceError(error.message);
    }
    return data;
  }

  async createProfile(userId: string, email: string): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email,
        onboarding_completed: false,
      })
      .select()
      .single();

    if (error) throw new ProfileServiceError(error.message);
    return data;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw new ProfileServiceError(error.message);
    return data;
  }

  async completeOnboarding(userId: string): Promise<void> {
    await this.updateProfile(userId, { onboarding_completed: true });
  }

  async updatePreferences(userId: string, updates: Record<string, unknown>): Promise<void> {
    // Merge with existing preferences instead of replacing
    const profile = await this.getProfile(userId);
    const currentPrefs = (profile?.preferences as Record<string, unknown>) || {};
    const mergedPrefs = { ...currentPrefs, ...updates } as { [key: string]: Json | undefined };
    await this.updateProfile(userId, { preferences: mergedPrefs });
  }

  async updateSkills(userId: string, skills: string[]): Promise<Profile> {
    const profile = await this.getProfile(userId);
    if (!profile) throw new ProfileServiceError("Profile not found");

    const currentCvData = (profile.cv_data as any) || {};
    const updatedCvData = {
      ...currentCvData,
      skills_flat: skills,
    };

    return await this.updateProfile(userId, { cv_data: updatedCvData });
  }

  async uploadCV(userId: string, file: File, userEmail: string): Promise<{
    success: boolean;
    publicUrl?: string;
    cvData?: any;
    error?: string;
  }> {
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("cvs")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw new ProfileServiceError(uploadError.message);

      const { data: { publicUrl } } = supabase.storage
        .from("cvs")
        .getPublicUrl(filePath);

      // 2. Get webhook URL from app_settings
      const webhookUrl = getConfig("cv_webhook_url") as string | null;
      if (!webhookUrl) {
        console.warn("⚠️ CV webhook URL not configured in app_settings - skipping CV analysis");
        console.warn(
          "💡 Set it in Supabase: UPDATE app_settings SET value = jsonb_set(value, '{cv_webhook_url}', '\"https://your-n8n.com/webhook/cvparser\"') WHERE key = 'config';"
        );
        return {
          success: true,
          publicUrl,
          error: "CV uploaded but analysis skipped (webhook not configured)",
        };
      }

      // 3. Call n8n webhook
      let webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv_url: publicUrl,
          user_id: userId,
          email: userEmail,
          filename: file.name,
        }),
      });

      if (!webhookResponse.ok) {
        // Retry once after 10 seconds
        console.warn("First webhook attempt failed, retrying in 10s...");
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        webhookResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cv_url: publicUrl,
            user_id: userId,
            email: userEmail,
            filename: file.name,
          }),
        });

        if (!webhookResponse.ok) {
          throw new ProfileServiceError("CV analysis failed after retry");
        }
      }

      // 4. Parse webhook response
      let responseData = await webhookResponse.json();
      
      // Handle array-wrapped responses
      if (Array.isArray(responseData) && responseData.length > 0) {
        responseData = responseData[0].response || responseData[0];
      }

      // 5. Flatten skills if needed
      let cvData = responseData;
      if (cvData.technical_skills && !cvData.skills_flat) {
        cvData.skills_flat = this.flattenSkills(cvData.technical_skills);
      }

      // 6. Save cv_data to profiles table
      await this.updateProfile(userId, { cv_data: cvData });

      // 7. Auto-populate full_name and phone from CV data
      const profileUpdates: Partial<Profile> = {};
      if (cvData.name) {
        profileUpdates.full_name = cvData.name;
      }
      if (cvData.phone) {
        profileUpdates.phone = cvData.phone;
      }

      if (Object.keys(profileUpdates).length > 0) {
        await this.updateProfile(userId, profileUpdates);
      }

      return {
        success: true,
        publicUrl,
        cvData,
      };
    } catch (error: any) {
      console.error("CV upload error:", error);
      return {
        success: false,
        error: error.message || "Failed to process CV",
      };
    }
  }

  async getUserStatistics(userId: string): Promise<{
    totalSwipes: number;
    totalMatches: number;
    totalApplications: number;
  }> {
    try {
      // Fetch total swipes
      const { count: swipesCount, error: swipesError } = await supabase
        .from("swipes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (swipesError) throw new ProfileServiceError(swipesError.message);

      // Fetch total matches
      const { count: matchesCount, error: matchesError } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (matchesError) throw new ProfileServiceError(matchesError.message);

      // Fetch total applications
      const { count: applicationsCount, error: applicationsError } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (applicationsError) throw new ProfileServiceError(applicationsError.message);

      return {
        totalSwipes: swipesCount || 0,
        totalMatches: matchesCount || 0,
        totalApplications: applicationsCount || 0,
      };
    } catch (error: any) {
      throw new ProfileServiceError(error.message);
    }
  }

  private flattenSkills(skillsData: any): string[] {
    const skills: string[] = [];
    
    const traverse = (obj: any) => {
      if (typeof obj === 'string') {
        skills.push(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach(traverse);
      } else if (obj && typeof obj === 'object') {
        Object.values(obj).forEach(traverse);
      }
    };
    
    traverse(skillsData);
    return [...new Set(skills)]; // Remove duplicates
  }
}

export const profileService = new ProfileService();
