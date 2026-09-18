import { taskRepository } from "../database/repositories/taskRepository.js";
import { userRepository } from "../database/repositories/userRepository.js";
import { sendMessage } from "../lib/telegram.js";
import { reminderNotification } from "../bot/messages.js";
import { reminderActions } from "../bot/keyboards.js";
import { logger } from "../lib/logger.js";

export async function processPendingReminders() {
  const tasks = await taskRepository.getPendingReminders();
  let sent = 0;
  let failed = 0;
  for (const task of tasks) {
    try {
      const user = await userRepository.findById(task.telegram_user_id);
      if (!user) continue;
      await sendMessage(task.telegram_chat_id, reminderNotification(task, user), reminderActions(task.id));
      await taskRepository.markReminderSent(task.id);
      sent++;
      logger.info("Reminder sent", { taskId: task.id, appName: task.app_name });
    } catch (error) {
      failed++;
      logger.error("Failed to send reminder", error, { taskId: task.id });
    }
  }
  return { processed: tasks.length, sent, failed };
}
