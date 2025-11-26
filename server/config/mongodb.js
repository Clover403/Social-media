import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DBNAME || "social_media_db";

let db = null;

export const client = new MongoClient(uri);

async function connect() {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log(`Connected to database: ${dbName}`);
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call connect() first.");
  }
  return db;
}

export async function initializeDb() {
  if (!db) {
    await connect();
  }
}
