import type { VercelRequest, VercelResponse } from "@vercel/node";
import { CONFIG } from "../../src/config.js";
import { routeUpdate } from "../../src/bot/router.js";
import { initDatabase } from "../../src/database/client.js";
import { processedUpdateRepository } from "../../src/database/repositories/processedUpdateRepository.js";
import { processPendingReminders } from "../../src/services/reminderService.js";
import { logger } from "../../src/lib/logger.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretHeader = req.headers["x-telegram-bot-api-secret-token"];
  if (secretHeader !== CONFIG.WEBHOOK_SECRET) {
    logger.warn("Invalid webhook secret");
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    await initDatabase();

    const update = req.body;
    if (!update || typeof update.update_id !== "number") {
      return res.status(400).json({ error: "Invalid update" });
    }

    const alreadyProcessed = await processedUpdateRepository.isProcessed(
      update.update_id
    );
    if (alreadyProcessed) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    await processedUpdateRepository.markProcessed(update.update_id);

    await routeUpdate(update);

    // Also check for due reminders on every webhook call (hybrid cron)
    try {
      await processPendingReminders();
    } catch {
      // Non-critical, don't fail the webhook
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    logger.error("Webhook error", error);
    return res.status(200).json({ ok: true });
  }
}
