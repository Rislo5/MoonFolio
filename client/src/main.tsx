import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import i18n from "./i18n"; // Importa i18n con la configurazione

// Renderizza l'applicazione
// i18n viene inizializzato prima grazie all'import, quindi non c'è bisogno di chiamare funzioni aggiuntive
createRoot(document.getElementById("root")!).render(
  <App />
);
