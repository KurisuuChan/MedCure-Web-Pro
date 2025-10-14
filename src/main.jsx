import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Debug tools for development only - prevents loading in production
if (import.meta.env.DEV) {
  import("./debug/SystemValidationRoadmap.js");
  import("./debug/ProfessionalDeveloperMode.js");
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
