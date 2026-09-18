import type { VercelRequest, VercelResponse } from "@vercel/node";
import { CONFIG } from "../../src/config.js";
import { initDatabase } from "../../src/database/client.js";
import { getWebhookInfo, getMe } from "../../src/lib/telegram.js";
import { logger } from "../../src/lib/logger.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${CONFIG.WEBHOOK_SECRET}`) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    await initDatabase();

    let telegramStatus = "🔴 Disconnected";
    let webhookStatus = "🔴 Inactive";

    try {
      const bot = await getMe();
      telegramStatus = `🟢 Connected (@${bot.username})`;
    } catch {
      telegramStatus = "🔴 Connection Failed";
    }

    try {
      const info = await getWebhookInfo();
      if (info.url && info.url.includes(CONFIG.VERCEL_DOMAIN)) {
        webhookStatus = `🟢 Active (${info.url})`;
      } else {
        webhookStatus = `🟡 URL: ${info.url || "Not set"}`;
      }
    } catch {
      webhookStatus = "🔴 Check Failed";
    }

    return res.status(200).json({
      status: "ok",
      services: {
        telegram: telegramStatus,
        database: "🟢 Connected",
        webhook: webhookStatus,
        reminderEngine: "🟢 Ready",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Status check failed", error);
    return res.status(500).json({ status: "error" });
  }
}
