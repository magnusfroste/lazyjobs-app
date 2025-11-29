import { useState, useEffect, useCallback, useRef } from "react";
import { profileService } from "@/services/profileService";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

/**
 * User settings structure for theme, display, and matching preferences.
 */
export interface UserSettings {
  theme: "light" | "dark" | "system";
  dense_mode: "normal" | "compact";
  match_threshold: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: "system",
  dense_mode: "normal",
  match_threshold: 0.65,
};

const STORAGE_KEYS = {
  theme: "theme",
  dense_mode: "dense-mode",
  match_threshold: "lazyjobs_match_settings",
};

/**
 * Load settings from localStorage (for immediate effect and fallback).
 */
const loadFromLocalStorage = (): Partial<UserSettings> => {
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.theme) as UserSettings["theme"] | null;
    const denseMode = localStorage.getItem(STORAGE_KEYS.dense_mode) as UserSettings["dense_mode"] | null;
    const matchSettingsRaw = localStorage.getItem(STORAGE_KEYS.match_threshold);
    const matchSettings = matchSettingsRaw ? JSON.parse(matchSettingsRaw) : null;

    return {
      theme: theme || undefined,
      dense_mode: denseMode === "compact" ? "compact" : denseMode === "normal" ? "normal" : undefined,
      match_threshold: matchSettings?.keywordThreshold,
    };
  } catch {
    return {};
  }
};

/**
 * Save settings to localStorage for immediate persistence.
 */
const saveToLocalStorage = (settings: Partial<UserSettings>) => {
  try {
    if (settings.theme !== undefined) {
      localStorage.setItem(STORAGE_KEYS.theme, settings.theme);
    }
    if (settings.dense_mode !== undefined) {
      localStorage.setItem(STORAGE_KEYS.dense_mode, settings.dense_mode);
    }
    if (settings.match_threshold !== undefined) {
      const matchSettingsRaw = localStorage.getItem(STORAGE_KEYS.match_threshold);
      const matchSettings = matchSettingsRaw ? JSON.parse(matchSettingsRaw) : {};
      localStorage.setItem(STORAGE_KEYS.match_threshold, JSON.stringify({
        ...matchSettings,
        keywordThreshold: settings.match_threshold,
      }));
    }
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
};

/**
 * Extract settings from profile preferences JSON.
 */
const extractSettingsFromProfile = (profile: Profile | null): Partial<UserSettings> => {
  if (!profile?.preferences) return {};
  
  const prefs = profile.preferences as Record<string, unknown>;
  return {
    theme: prefs.theme as UserSettings["theme"] | undefined,
    dense_mode: prefs.dense_mode as UserSettings["dense_mode"] | undefined,
    match_threshold: typeof prefs.match_threshold === "number" ? prefs.match_threshold : undefined,
  };
};

/**
 * Hook for managing user settings with localStorage + database persistence.
 * Settings are saved to localStorage immediately for responsiveness,
 * then synced to database with debounce for cross-device consistency.
 * 
 * @param userId - The user's ID for database persistence
 * @param profile - The user's profile (source of truth for settings)
 * @returns Settings state and update methods
 */
export const useUserSettings = (userId: string | undefined, profile: Profile | null) => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    // Initial load: prefer profile, fallback to localStorage, then defaults
    const profileSettings = extractSettingsFromProfile(profile);
    const localSettings = loadFromLocalStorage();
    
    return {
      theme: profileSettings.theme ?? localSettings.theme ?? DEFAULT_SETTINGS.theme,
      dense_mode: profileSettings.dense_mode ?? localSettings.dense_mode ?? DEFAULT_SETTINGS.dense_mode,
      match_threshold: profileSettings.match_threshold ?? localSettings.match_threshold ?? DEFAULT_SETTINGS.match_threshold,
    };
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Sync settings from profile when it loads
  useEffect(() => {
    if (profile) {
      const profileSettings = extractSettingsFromProfile(profile);
      const localSettings = loadFromLocalStorage();
      
      setSettings({
        theme: profileSettings.theme ?? localSettings.theme ?? DEFAULT_SETTINGS.theme,
        dense_mode: profileSettings.dense_mode ?? localSettings.dense_mode ?? DEFAULT_SETTINGS.dense_mode,
        match_threshold: profileSettings.match_threshold ?? localSettings.match_threshold ?? DEFAULT_SETTINGS.match_threshold,
      });
    }
  }, [profile]);

  // Save to database with debounce
  const saveToDatabase = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!userId) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        await profileService.updatePreferences(userId, newSettings);
      } catch (error) {
        console.error("Failed to save settings to database:", error);
      } finally {
        setIsSyncing(false);
      }
    }, 500); // 500ms debounce
  }, [userId]);

  /**
   * Update a single setting.
   * Immediately updates state and localStorage, debounced to database.
   */
  const updateSetting = useCallback(<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    const update = { [key]: value } as Partial<UserSettings>;
    
    // Update local state immediately
    setSettings(prev => ({ ...prev, ...update }));
    
    // Save to localStorage for immediate persistence
    saveToLocalStorage(update);
    
    // Save to database (debounced)
    saveToDatabase(update);
  }, [saveToDatabase]);

  /**
   * Update multiple settings at once.
   * Immediately updates state and localStorage, debounced to database.
   */
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    // Update local state immediately
    setSettings(prev => ({ ...prev, ...updates }));
    
    // Save to localStorage
    saveToLocalStorage(updates);
    
    // Save to database (debounced)
    saveToDatabase(updates);
  }, [saveToDatabase]);

  return {
    settings,
    updateSetting,
    updateSettings,
    isSyncing,
  };
};
