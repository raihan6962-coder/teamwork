import { CONFIG } from "../../src/config.js";
import { initDatabase } from "../../src/database/client.js";
import { getWebhookInfo, getMe } from "../../src/lib/telegram.js";
import { logger } from "../../src/lib/logger.js";

export default async function handler(req, res) {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${CONFIG.WEBHOOK_SECRET}`) return res.status(403).json({ error: "Forbidden" });
  try {
    await initDatabase();
    const bot = await getMe();
    const info = await getWebhookInfo();
    return res.status(200).json({ ok: true, bot: { id: bot.id, username: bot.username }, webhook: info });
  } catch (error) {
    logger.error("Status check failed", error);
    return res.status(500).json({ error: error.message });
  }
}
