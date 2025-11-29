import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

type DenseMode = "normal" | "compact";

interface DenseModeContextType {
  denseMode: DenseMode;
  setDenseMode: (mode: DenseMode, skipPersist?: boolean) => void;
  toggleDenseMode: () => void;
  setDenseModeFromProfile: (mode: DenseMode) => void;
}

const DenseModeContext = createContext<DenseModeContextType | undefined>(undefined);

export function DenseModeProvider({ children }: { children: ReactNode }) {
  const [denseMode, setDenseModeState] = useState<DenseMode>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem("dense-mode");
    return (stored === "compact" ? "compact" : "normal") as DenseMode;
  });

  useEffect(() => {
    // Dispatch storage event for other tabs/components
    window.dispatchEvent(new Event("storage"));
  }, [denseMode]);

  const setDenseMode = useCallback((mode: DenseMode, skipPersist = false) => {
    setDenseModeState(mode);
    if (!skipPersist) {
      localStorage.setItem("dense-mode", mode);
    }
  }, []);

  const toggleDenseMode = useCallback(() => {
    setDenseModeState(prev => {
      const newMode = prev === "normal" ? "compact" : "normal";
      localStorage.setItem("dense-mode", newMode);
      return newMode;
    });
  }, []);

  // Set from profile without triggering extra localStorage writes
  const setDenseModeFromProfile = useCallback((mode: DenseMode) => {
    setDenseModeState(mode);
    localStorage.setItem("dense-mode", mode);
  }, []);

  return (
    <DenseModeContext.Provider value={{ denseMode, setDenseMode, toggleDenseMode, setDenseModeFromProfile }}>
      {children}
    </DenseModeContext.Provider>
  );
}

export function useDenseMode() {
  const context = useContext(DenseModeContext);
  if (context === undefined) {
    throw new Error("useDenseMode must be used within a DenseModeProvider");
  }
  return context;
}
