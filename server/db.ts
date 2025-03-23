import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Initialize the database connection
const initDb = () => {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set");
    return null;
  }

  try {
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    const db = drizzle(client, { schema });
    
    console.log("Database connection initialized successfully");
    return db;
  } catch (error) {
    console.error("Failed to initialize database connection:", error);
    return null;
  }
};

export const db = initDb();