import { CONFIG } from "../../src/config.js";
import { setWebhook, getWebhookInfo, getMe } from "../../src/lib/telegram.js";
import { initDatabase } from "../../src/database/client.js";
import { logger } from "../../src/lib/logger.js";

export default async function handler(req, res) {
  const auth = req.headers.authorization || "";
  const secret = req.query.secret || auth.replace("Bearer ", "");
  if (secret !== CONFIG.WEBHOOK_SECRET) return res.status(403).json({ error: "Forbidden" });
  try {
    await initDatabase();
    const webhookUrl = CONFIG.WEBHOOK_URL;
    const bot = await getMe();
    const setup = await setWebhook(webhookUrl, CONFIG.WEBHOOK_SECRET);
    const info = await getWebhookInfo();
    return res.status(200).json({ ok: true, bot: { id: bot.id, username: bot.username }, webhook: { url: webhookUrl, set: setup, info } });
  } catch (error) {
    logger.error("Webhook setup failed", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
