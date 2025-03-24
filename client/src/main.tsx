import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n"; // Import i18n configuration

/**
 * Funzione per impostare la lingua del documento e dell'app all'avvio
 */
function setupLanguage() {
  try {
    // Ottieni la lingua salvata dal localStorage o usa l'italiano come predefinito
    const savedLanguage = localStorage.getItem('language');
    const language = (savedLanguage && ['it', 'en'].includes(savedLanguage)) ? savedLanguage : 'it';
    
    // Imposta l'attributo lang del documento HTML
    document.documentElement.lang = language;
    
    console.log(`App inizializzata con lingua: ${language}`);
  } catch (error) {
    console.error('Errore durante l\'inizializzazione della lingua:', error);
  }
}

// Esegui setup della lingua
setupLanguage();

// Renderizza l'applicazione
createRoot(document.getElementById("root")!).render(
  <App />
);
