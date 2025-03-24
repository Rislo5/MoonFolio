import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import './i18n'; // Import i18n initialization before rendering

// Render the application
createRoot(document.getElementById("root")!).render(
  <App />
);
