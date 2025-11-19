import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type DenseMode = "normal" | "compact";

interface DenseModeContextType {
  denseMode: DenseMode;
  setDenseMode: (mode: DenseMode) => void;
  toggleDenseMode: () => void;
}

const DenseModeContext = createContext<DenseModeContextType | undefined>(undefined);

export function DenseModeProvider({ children }: { children: ReactNode }) {
  const [denseMode, setDenseModeState] = useState<DenseMode>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem("dense-mode");
    return (stored === "compact" ? "compact" : "normal") as DenseMode;
  });

  useEffect(() => {
    // Save to localStorage whenever it changes
    localStorage.setItem("dense-mode", denseMode);
    
    // Dispatch storage event for other tabs/components
    window.dispatchEvent(new Event("storage"));
  }, [denseMode]);

  const setDenseMode = (mode: DenseMode) => {
    setDenseModeState(mode);
  };

  const toggleDenseMode = () => {
    setDenseModeState(prev => prev === "normal" ? "compact" : "normal");
  };

  return (
    <DenseModeContext.Provider value={{ denseMode, setDenseMode, toggleDenseMode }}>
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
