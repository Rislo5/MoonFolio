import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Initialize the database connection with connection pool
const initDb = () => {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set");
    return null;
  }

  try {
    const connectionString = process.env.DATABASE_URL;
    // Configurazione ottimizzata del pool di connessioni per supportare fino a 20 utenti
    // con 5 utenti concorrenti
    const client = postgres(connectionString, {
      max: 10, // Numero massimo di connessioni nel pool
      idle_timeout: 20, // Tempo in secondi prima che una connessione inattiva venga chiusa
      connect_timeout: 10, // Tempo massimo in secondi per stabilire una connessione
      prepare: false, // Disabilita le query preparate per ridurre l'overhead
    });
    
    const db = drizzle(client, { schema });
    
    console.log("Database connection pool initialized successfully");
    return db;
  } catch (error) {
    console.error("Failed to initialize database connection:", error);
    return null;
  }
};

export const db = initDb();