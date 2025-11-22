import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeUrlBlocker } from "./lib/urlBlocker";

// Initialize URL blocker before rendering
initializeUrlBlocker();

createRoot(document.getElementById("root")!).render(<App />);
