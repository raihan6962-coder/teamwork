import { CONFIG } from "../../src/config.js";
import { initDatabase } from "../../src/database/client.js";
import { processPendingReminders } from "../../src/services/reminderService.js";
import { logger } from "../../src/lib/logger.js";

export default async function handler(req, res) {
  const secret = req.query.secret || req.headers["x-cron-secret"];
  if (secret !== CONFIG.WEBHOOK_SECRET) return res.status(403).json({ error: "Forbidden" });
  try {
    await initDatabase();
    const result = await processPendingReminders();
    logger.info("Cron completed", result);
    return res.status(200).json({ ok: true, ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error("Cron failed", error);
    return res.status(500).json({ ok: false });
  }
}
