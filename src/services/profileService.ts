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

  async uploadCV(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(filePath, file);

    if (uploadError) throw new ProfileServiceError(uploadError.message);

    const { data: { publicUrl } } = supabase.storage
      .from("cvs")
      .getPublicUrl(filePath);

    return publicUrl;
  }
}

export const profileService = new ProfileService();
