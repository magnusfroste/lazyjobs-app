import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { DenseModeProvider } from "./contexts/DenseModeContext";

createRoot(document.getElementById("root")!).render(
  <DenseModeProvider>
    <App />
  </DenseModeProvider>
);
