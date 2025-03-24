import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n"; // Import i18n configuration
import { useEffect } from "react";
import i18n from "./i18n";

// Carica la lingua salvata dal localStorage all'avvio dell'app
const savedLanguage = localStorage.getItem('language');
if (savedLanguage && ['it', 'en'].includes(savedLanguage)) {
  i18n.changeLanguage(savedLanguage);
}

createRoot(document.getElementById("root")!).render(
  <App />
);
