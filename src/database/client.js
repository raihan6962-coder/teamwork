import { CONFIG } from "../config.js";
import { SCHEMA_SQL } from "./schema.js";
import { logger } from "../lib/logger.js";

let dbInitialized = false;
let sqlFn = null;

function isDbConfigured() {
  return CONFIG.DATABASE_URL && CONFIG.DATABASE_URL !== "" && CONFIG.DATABASE_URL !== "PASTE_YOUR_DATABASE_URL_HERE";
}

async function getSql() {
  if (sqlFn) return sqlFn;
  if (!isDbConfigured()) return null;
  try {
    const { neon } = await import("@neondatabase/serverless");
    sqlFn = neon(CONFIG.DATABASE_URL);
    return sqlFn;
  } catch (error) {
    logger.warn("Failed to connect to database");
    return null;
  }
}

export async function initDatabase() {
  if (dbInitialized) return;
  const sql = await getSql();
  if (!sql) {
    logger.info("No DATABASE_URL - using in-memory storage");
    dbInitialized = true;
    return;
  }
  try {
    const statements = SCHEMA_SQL.split(";").map((s) => s.trim()).filter((s) => s.length > 0);
    for (const stmt of statements) {
      await sql(stmt + ";");
    }
    dbInitialized = true;
    logger.info("Database initialized");
  } catch (error) {
    logger.error("Database init failed - using in-memory", error);
    dbInitialized = true;
  }
}

export async function query(text, params) {
  const sql = await getSql();
  if (!sql) return inMemoryQuery(text, params);
  return await sql(text, params || []);
}

export async function queryOne(text, params) {
  const results = await query(text, params);
  return results.length > 0 ? results[0] : null;
}

export async function execute(text, params) {
  const sql = await getSql();
  if (!sql) { inMemoryQuery(text, params); return { rowCount: 1 }; }
  await sql(text, params || []);
  return { rowCount: 1 };
}

// In-memory fallback
const memoryStore = new Map();

function getTableName(sql) {
  const lower = sql.toLowerCase();
  const m = lower.match(/into\s+(\w+)/) || lower.match(/from\s+(\w+)/) || lower.match(/update\s+(\w+)/) || lower.match(/delete\s+from\s+(\w+)/);
  return m ? m[1] : null;
}

function inMemoryQuery(sql, params) {
  const lower = sql.toLowerCase().trim();
  const tableName = getTableName(sql);
  if (!tableName) return [];
  if (!memoryStore.has(tableName)) memoryStore.set(tableName, []);

  if (lower.includes("on conflict")) {
    const cols = (sql.match(/\(([^)]+)\)/i) || [])[1];
    if (cols && params) {
      const colNames = cols.split(",").map((c) => c.trim());
      const row = {};
      colNames.forEach((col, i) => { row[col] = params[i] !== undefined ? params[i] : null; });
      const store = memoryStore.get(tableName);
      const firstCol = Object.keys(row)[0];
      const idx = store.findIndex((r) => String(r[firstCol]) === String(row[firstCol]));
      if (idx >= 0) store[idx] = { ...store[idx], ...row };
      else store.push(row);
    }
    return [];
  }
  if (lower.startsWith("insert")) {
    const cols = (sql.match(/\(([^)]+)\)/i) || [])[1];
    if (cols && params) {
      const colNames = cols.split(",").map((c) => c.trim());
      const row = {};
      colNames.forEach((col, i) => { row[col] = params[i] !== undefined ? params[i] : null; });
      memoryStore.get(tableName).push(row);
    }
    return [];
  }
  if (lower.startsWith("update")) {
    const store = memoryStore.get(tableName);
    const whereMatch = lower.match(/where\s+(.+?)$/);
    if (whereMatch) {
      const parts = whereMatch[1].split(/\s+and\s+/);
      store.forEach((row) => {
        const match = parts.every((cond) => {
          const eq = cond.match(/(\w+)\s*=\s*\$?(\d+|'?[\w ]+'?)/);
          if (eq) {
            const [, col, val] = eq;
            const pm = val.match(/^\$(\d+)$/);
            if (pm && params) return String(row[col]) === String(params[parseInt(pm[1]) - 1]);
            return String(row[col]) === val.replace(/'/g, "");
          }
          return true;
        });
        if (match) {
          const setPart = lower.match(/set\s+(.+?)\s+where/);
          if (setPart) {
            setPart[1].split(/,(?=\s*\w+\s*=)/).forEach((p) => {
              const kv = p.match(/(\w+)\s*=\s*\$?(\d+)/);
              if (kv && params) row[kv[1]] = params[parseInt(kv[2]) - 1];
            });
          }
        }
      });
    }
    return [];
  }
  if (lower.startsWith("delete")) {
    const store = memoryStore.get(tableName);
    const whereMatch = lower.match(/where\s+(.+)$/);
    if (whereMatch) {
      const parts = whereMatch[1].split(/\s+and\s+/);
      const newStore = store.filter((row) => !parts.every((cond) => {
        const eq = cond.match(/(\w+)\s*=\s*\$?(\d+|'?[\w ]+'?)/);
        if (eq) {
          const [, col, val] = eq;
          const pm = val.match(/^\$(\d+)$/);
          if (pm && params) return String(row[col]) === String(params[parseInt(pm[1]) - 1]);
          return String(row[col]) === val.replace(/'/g, "");
        }
        return true;
      }));
      memoryStore.set(tableName, newStore);
    }
    return [];
  }

  let rows = [...memoryStore.get(tableName)];
  const whereMatch = lower.match(/where\s+(.+?)(?:\s+order\s+|\s+limit\s+|\s+offset\s+|$)/);
  if (whereMatch) {
    const parts = whereMatch[1].split(/\s+and\s+/);
    rows = rows.filter((row) => parts.every((cond) => {
      const eq = cond.match(/(\w+)\s*=\s*\$?(\d+|'?[\w ]+'?)/);
      if (eq) {
        const [, col, val] = eq;
        const pm = val.match(/^\$(\d+)$/);
        if (pm && params) return String(row[col]) === String(params[parseInt(pm[1]) - 1]);
        if (val === "true") return row[col] === true;
        if (val === "false") return row[col] === false;
        return String(row[col]) === val.replace(/'/g, "");
      }
      if (cond.includes("is null")) return row[cond.replace(/\s+is\s+null/, "").trim()] == null;
      return true;
    }));
  }
  const orderMatch = lower.match(/order\s+by\s+(\w+)\s+(asc|desc)/);
  if (orderMatch) {
    const [, col, dir] = orderMatch;
    rows.sort((a, b) => { const c = String(a[col] || "").localeCompare(String(b[col] || "")); return dir === "desc" ? -c : c; });
  }
  const limitMatch = lower.match(/limit\s+(\d+)/);
  if (limitMatch) rows = rows.slice(0, parseInt(limitMatch[1]));
  const offsetMatch = lower.match(/offset\s+(\d+)/);
  if (offsetMatch) rows = rows.slice(parseInt(offsetMatch[1]));
  if (lower.includes("count(*)")) return [{ count: rows.length }];
  const groupMatch = lower.match(/group\s+by\s+(\w+)/);
  if (groupMatch) {
    const col = groupMatch[1];
    const groups = new Map();
    rows.forEach((r) => { const k = String(r[col] || "null"); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
    return [...groups.entries()].map(([k, g]) => ({ [col]: k, count: g.length }));
  }
  return rows;
}
