type MatchMode = "keyword" | "precomputed";

interface MatchSettings {
  matchMode: MatchMode;
  keywordThreshold: number;
  aiTopN: number;
}

const DEFAULT_SETTINGS: MatchSettings = {
  matchMode: "precomputed",
  keywordThreshold: 0.65,
  aiTopN: 50,
};

const STORAGE_KEY = "lazyjobs_match_settings";

export const getMatchSettings = (): MatchSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to load match settings:", error);
  }
  return DEFAULT_SETTINGS;
};

export const saveMatchSettings = (settings: Partial<MatchSettings>): void => {
  try {
    const current = getMatchSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save match settings:", error);
  }
};
