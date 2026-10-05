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
      // Keep loading=true when no userId - prevents race condition where
      // consumers think profile is "loaded" when it hasn't been fetched yet
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
    
    const updated = await profileService.updateProfile(userId, updates);
    setProfile(updated);
  };

  const completeOnboarding = async () => {
    if (!userId) return;
    
    await profileService.completeOnboarding(userId);
    setProfile(profile ? { ...profile, onboarding_completed: true } : null);
  };

  const updateSkills = async (skills: string[]) => {
    if (!userId) return;
    
    const updated = await profileService.updateSkills(userId, skills);
    setProfile(updated);
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
