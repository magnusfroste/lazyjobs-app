import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

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

  async updatePreferences(userId: string, preferences: any): Promise<void> {
    await this.updateProfile(userId, { preferences });
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

      // 2. Get webhook URL from environment
      const webhookUrl = import.meta.env.VITE_N8N_CV_WEBHOOK_URL;
      if (!webhookUrl) {
        console.warn("VITE_N8N_CV_WEBHOOK_URL not configured - skipping CV analysis");
        return { success: true, publicUrl };
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
