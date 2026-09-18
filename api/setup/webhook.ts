import type { VercelRequest, VercelResponse } from "@vercel/node";
import { CONFIG } from "../../src/config.js";
import { setWebhook, getWebhookInfo, getMe } from "../../src/lib/telegram.js";
import { initDatabase } from "../../src/database/client.js";
import { logger } from "../../src/lib/logger.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${CONFIG.WEBHOOK_SECRET}`) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    await initDatabase();

    const webhookUrl = CONFIG.WEBHOOK_URL;
    const botInfo = await getMe();
    const setupResult = await setWebhook(webhookUrl, CONFIG.WEBHOOK_SECRET);
    const webhookInfo = await getWebhookInfo();

    return res.status(200).json({
      ok: true,
      bot: {
        id: botInfo.id,
        username: botInfo.username,
        first_name: botInfo.first_name,
      },
      webhook: {
        url: webhookUrl,
        set: setupResult,
        info: webhookInfo,
      },
    });
  } catch (error) {
    logger.error("Webhook setup failed", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
