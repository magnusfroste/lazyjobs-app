import { useState, useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";
import { profileService } from "@/services/profileService";

type Profile = Tables<"profiles">;

export const useProfile = (userId: string | undefined) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await profileService.getProfile(userId);
      setProfile(data);
    } catch (err) {
      setError(err as Error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userId) return;
    
    try {
      const updated = await profileService.updateProfile(userId, updates);
      setProfile(updated);
    } catch (err) {
      throw err;
    }
  };

  const completeOnboarding = async () => {
    if (!userId) return;
    
    try {
      await profileService.completeOnboarding(userId);
      setProfile(profile ? { ...profile, onboarding_completed: true } : null);
    } catch (err) {
      throw err;
    }
  };

  const updateSkills = async (skills: string[]) => {
    if (!userId) return;
    
    try {
      const updated = await profileService.updateSkills(userId, skills);
      setProfile(updated);
    } catch (err) {
      throw err;
    }
  };

  return {
    profile,
    loading,
    error,
    refetch: loadProfile,
    updateProfile,
    completeOnboarding,
    updateSkills,
  };
};
