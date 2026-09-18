import { CONFIG } from "../config.js";
import { SCHEMA_SQL } from "./schema.js";
import { logger } from "../lib/logger.js";

let dbInitialized = false;
let useInMemory = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sqlFn: any = null;

// In-memory storage for development/fallback
const memoryStore: Map<string, Record<string, unknown>[]> = new Map();

function isDbConfigured(): boolean {
  return (
    !!CONFIG.DATABASE_URL &&
    CONFIG.DATABASE_URL !== "" &&
    CONFIG.DATABASE_URL !== "PASTE_YOUR_DATABASE_URL_HERE"
  );
}

async function getSql() {
  if (sqlFn) return sqlFn;
  if (!isDbConfigured()) {
    useInMemory = true;
    return null;
  }
  try {
    const { neon } = await import("@neondatabase/serverless");
    sqlFn = neon(CONFIG.DATABASE_URL);
    return sqlFn;
  } catch (error) {
    logger.warn("Failed to connect to database — using in-memory fallback", error);
    useInMemory = true;
    return null;
  }
}

export async function initDatabase(): Promise<void> {
  if (dbInitialized) return;
  const sql = await getSql();
  if (!sql) {
    logger.info("No DATABASE_URL configured — using in-memory storage (data resets on cold start)");
    dbInitialized = true;
    return;
  }
  try {
    const statements = SCHEMA_SQL.split(";")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
    for (const stmt of statements) {
      await sql(stmt + ";");
    }
    dbInitialized = true;
    logger.info("Database initialized successfully");
  } catch (error) {
    logger.error("Database initialization failed — falling back to in-memory", error);
    useInMemory = true;
    dbInitialized = true;
  }
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const sql = await getSql();
  if (!sql) {
    return inMemoryQuery<T>(text, params);
  }
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
  const sql = await getSql();
  if (!sql) {
    return inMemoryExecute(text, params);
  }
  try {
    const result = await sql(text, params || []);
    return { rowCount: result.length };
  } catch (error) {
    logger.error("Database execute failed", error, { query: text });
    throw error;
  }
}

export function isUsingInMemory(): boolean {
  return useInMemory || !isDbConfigured();
}

// ─────────────────────────────────────────────
//  Minimal in-memory query engine (development)
// ─────────────────────────────────────────────

function getTableName(sql: string): string | null {
  const lower = sql.toLowerCase();
  const insertMatch = lower.match(/into\s+(\w+)/);
  if (insertMatch) return insertMatch[1];
  const selectMatch = lower.match(/from\s+(\w+)/);
  if (selectMatch) return selectMatch[1];
  const updateMatch = lower.match(/update\s+(\w+)/);
  if (updateMatch) return updateMatch[1];
  const deleteMatch = lower.match(/delete\s+from\s+(\w+)/);
  if (deleteMatch) return deleteMatch[1];
  return null;
}

function ensureTable(name: string) {
  if (!memoryStore.has(name)) memoryStore.set(name, []);
}

function inMemoryExecute(text: string, params?: unknown[]): { rowCount: number } {
  inMemoryQuery(text, params);
  return { rowCount: 1 };
}

function inMemoryQuery<T>(sql: string, params?: unknown[]): T[] {
  const lower = sql.toLowerCase().trim();
  const tableName = getTableName(sql);
  if (!tableName) return [];

  // Handle INSERT ... ON CONFLICT DO UPDATE (upsert)
  if (lower.includes("on conflict")) {
    inMemoryUpsert(tableName, sql, params);
    return [];
  }

  // Handle INSERT
  if (lower.startsWith("insert")) {
    inMemoryInsert(tableName, sql, params);
    return [];
  }

  // Handle UPDATE
  if (lower.startsWith("update")) {
    inMemoryUpdate(tableName, sql, params);
    return [];
  }

  // Handle DELETE
  if (lower.startsWith("delete")) {
    inMemoryDelete(tableName, sql, params);
    return [];
  }

  // Handle SELECT
  ensureTable(tableName);
  let rows = [...(memoryStore.get(tableName) || [])];

  // Simple WHERE clause filtering
  const whereMatch = lower.match(/where\s+(.+?)(?:\s+order\s+|\s+limit\s+|\s+offset\s+|$)/);
  if (whereMatch) {
    const conditions = whereMatch[1].split(/\s+and\s+/);
    rows = rows.filter((row) => {
      return conditions.every((cond) => {
        const eqMatch = cond.match(/(\w+)\s*=\s*'?(\w+)'?/);
        if (eqMatch) {
          const [, col, val] = eqMatch;
          const paramMatch = val.match(/^\$(\d+)$/);
          if (paramMatch && params) {
            return String(row[col]) === String(params[parseInt(paramMatch[1]) - 1]);
          }
          return String(row[col]) === val;
        }
        if (cond.includes("is null")) {
          const col = cond.replace(/\s+is\s+null/, "").trim();
          return row[col] === null || row[col] === undefined;
        }
        if (cond.includes("is not null")) {
          const col = cond.replace(/\s+is\s+not\s+null/, "").trim();
          return row[col] !== null && row[col] !== undefined;
        }
        return true;
      });
    });
  }

  // ORDER BY
  const orderMatch = lower.match(/order\s+by\s+(\w+)\s+(asc|desc)/);
  if (orderMatch) {
    const [, col, dir] = orderMatch;
    rows.sort((a, b) => {
      const aVal = a[col];
      const bVal = b[col];
      if (aVal === bVal) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal));
      return dir === "desc" ? -cmp : cmp;
    });
  }

  // LIMIT
  const limitMatch = lower.match(/limit\s+(\d+)/);
  if (limitMatch) {
    rows = rows.slice(0, parseInt(limitMatch[1]));
  }

  // OFFSET
  const offsetMatch = lower.match(/offset\s+(\d+)/);
  if (offsetMatch) {
    const offset = parseInt(offsetMatch[1]);
    rows = rows.slice(offset);
  }

  // COUNT
  if (lower.includes("count(*)")) {
    return [{ count: rows.length }] as unknown as T[];
  }

  // GROUP BY (simplified)
  const groupMatch = lower.match(/group\s+by\s+(\w+)/);
  if (groupMatch) {
    const col = groupMatch[1];
    const groups = new Map<string, Record<string, unknown>[]>();
    for (const row of rows) {
      const key = String(row[col] || "null");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }
    return Array.from(groups.entries()).map(([key, group]) => ({
      [col]: key,
      count: group.length,
    })) as unknown as T[];
  }

  return rows as unknown as T[];
}

function inMemoryInsert(tableName: string, sql: string, params?: unknown[]) {
  ensureTable(tableName);
  const row: Record<string, unknown> = {};

  const colMatch = sql.match(/\(([^)]+)\)/i);
  if (colMatch && params) {
    const cols = colMatch[1].split(",").map((c: string) => c.trim());
    cols.forEach((col: string, i: number) => {
      row[col] = params[i] !== undefined ? params[i] : null;
    });
  }

  memoryStore.get(tableName)!.push(row);
}

function inMemoryUpsert(tableName: string, sql: string, params?: unknown[]) {
  ensureTable(tableName);
  const row: Record<string, unknown> = {};

  const colMatch = sql.match(/\(([^)]+)\)/i);
  if (colMatch && params) {
    const cols = colMatch[1].split(",").map((c: string) => c.trim());
    cols.forEach((col: string, i: number) => {
      row[col] = params[i] !== undefined ? params[i] : null;
    });
  }

  const store = memoryStore.get(tableName)!;
  const firstCol = Object.keys(row)[0];
  const idx = store.findIndex((r) => String(r[firstCol]) === String(row[firstCol]));
  if (idx >= 0) {
    store[idx] = { ...store[idx], ...row };
  } else {
    store.push(row);
  }
}

function inMemoryUpdate(tableName: string, sql: string, params?: unknown[]) {
  ensureTable(tableName);
  const lower = sql.toLowerCase();

  const setMatch = lower.match(/set\s+(.+?)\s+where/);
  if (!setMatch) return;

  const whereMatch = lower.match(/where\s+(.+?)$/);
  if (!whereMatch) return;

  const store = memoryStore.get(tableName)!;
  const whereParts = whereMatch[1].split(/\s+and\s+/);

  store.forEach((row) => {
    const matchesWhere = whereParts.every((cond: string) => {
      const eqMatch = cond.match(/(\w+)\s*=\s*'?(\w+)'?/);
      if (eqMatch) {
        const [, col, val] = eqMatch;
        const paramMatch = val.match(/^\$(\d+)$/);
        if (paramMatch && params) {
          return String(row[col]) === String(params[parseInt(paramMatch[1]) - 1]);
        }
        return String(row[col]) === val;
      }
      return true;
    });

    if (matchesWhere) {
      const setParts = setMatch[1].split(/,(?=\s*\w+\s*=)/);
      setParts.forEach((part: string) => {
        const kvMatch = part.match(/(\w+)\s*=\s*\$?(\d+|'[^']*'|true|false|NULL)/);
        if (kvMatch) {
          const [, col, val] = kvMatch;
          if (val.startsWith("$")) {
            const idx = parseInt(val.substring(1)) - 1;
            if (params && idx < params.length) row[col] = params[idx];
          } else if (val === "true") {
            row[col] = true;
          } else if (val === "false") {
            row[col] = false;
          } else if (val === "null" || val === "NULL") {
            row[col] = null;
          } else {
            row[col] = val.replace(/'/g, "");
          }
        }
      });
    }
  });
}

function inMemoryDelete(tableName: string, sql: string, params?: unknown[]) {
  ensureTable(tableName);
  const lower = sql.toLowerCase();
  const whereMatch = lower.match(/where\s+(.+)$/);
  if (!whereMatch) {
    memoryStore.set(tableName, []);
    return;
  }

  const store = memoryStore.get(tableName)!;
  const whereParts = whereMatch[1].split(/\s+and\s+/);

  const newStore = store.filter((row) => {
    return !whereParts.every((cond: string) => {
      const eqMatch = cond.match(/(\w+)\s*=\s*'?(\w+)'?/);
      if (eqMatch) {
        const [, col, val] = eqMatch;
        const paramMatch = val.match(/^\$(\d+)$/);
        if (paramMatch && params) {
          return String(row[col]) === String(params[parseInt(paramMatch[1]) - 1]);
        }
        return String(row[col]) === val;
      }
      return true;
    });
  });

  memoryStore.set(tableName, newStore);
}
