import type { VercelRequest, VercelResponse } from "@vercel/node";
import { CONFIG } from "../../src/config.js";
import { initDatabase } from "../../src/database/client.js";
import { processPendingReminders } from "../../src/services/reminderService.js";
import { logger } from "../../src/lib/logger.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  const cronSecret = req.query.secret || req.headers["x-cron-secret"];

  if (cronSecret !== CONFIG.WEBHOOK_SECRET && authHeader !== `Bearer ${CONFIG.WEBHOOK_SECRET}`) {
    logger.warn("Unauthorized cron request", {
      ip: req.headers["x-forwarded-for"],
    });
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    await initDatabase();

    const result = await processPendingReminders();

    logger.info("Cron execution completed", result);

    return res.status(200).json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Cron execution failed", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}
