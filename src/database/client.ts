import { neon } from "@neondatabase/serverless";
import { CONFIG } from "../config.js";
import { SCHEMA_SQL } from "./schema.js";
import { logger } from "../lib/logger.js";

let dbInitialized = false;

export function getDb() {
  const sql = neon(CONFIG.DATABASE_URL);
  return sql;
}

export async function initDatabase(): Promise<void> {
  if (dbInitialized) return;
  try {
    const sql = getDb();
    const statements = SCHEMA_SQL.split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      await sql(stmt + ";");
    }
    dbInitialized = true;
    logger.info("Database initialized successfully");
  } catch (error) {
    logger.error("Database initialization failed", error);
    throw error;
  }
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const sql = getDb();
  try {
    const result = await sql(text, params || []);
    return result as T[];
  } catch (error) {
    logger.error("Database query failed", error, { query: text });
    throw error;
  }
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const results = await query<T>(text, params);
  return results.length > 0 ? results[0] : null;
}

export async function execute(
  text: string,
  params?: unknown[]
): Promise<{ rowCount: number }> {
  const sql = getDb();
  try {
    const result = await sql(text, params || []);
    return { rowCount: result.length };
  } catch (error) {
    logger.error("Database execute failed", error, { query: text });
    throw error;
  }
}
