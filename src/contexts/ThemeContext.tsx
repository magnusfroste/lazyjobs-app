import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme, skipPersist?: boolean) => void;
  resolvedTheme: "light" | "dark";
  setThemeFromProfile: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme") as Theme;
    return stored || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = window.document.documentElement;
    
    const getSystemTheme = (): "light" | "dark" => {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    const applyTheme = (newTheme: Theme) => {
      const actual = newTheme === "system" ? getSystemTheme() : newTheme;
      
      root.classList.remove("light", "dark");
      root.classList.add(actual);
      setResolvedTheme(actual);
    };

    applyTheme(theme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme, skipPersist = false) => {
    setThemeState(newTheme);
    if (!skipPersist) {
      localStorage.setItem("theme", newTheme);
    }
  }, []);

  // Set theme from profile without triggering localStorage save (to avoid overwriting before DB sync)
  const setThemeFromProfile = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, setThemeFromProfile }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
