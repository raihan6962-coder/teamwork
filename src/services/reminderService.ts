import { taskRepository } from "../database/repositories/taskRepository.js";
import { userRepository } from "../database/repositories/userRepository.js";
import { sendMessage } from "../lib/telegram.js";
import { reminderNotification } from "../bot/messages.js";
import { reminderActions } from "../bot/keyboards.js";
import { logger } from "../lib/logger.js";

export async function processPendingReminders(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const tasks = await taskRepository.getPendingReminders();
  let sent = 0;
  let failed = 0;

  for (const task of tasks) {
    try {
      const user = await userRepository.findById(task.telegram_user_id);
      if (!user) {
        logger.warn("User not found for reminder", {
          taskId: task.id,
          userId: task.telegram_user_id,
        });
        continue;
      }

      const notificationText = reminderNotification(task, user);
      const keyboard = reminderActions(task.id);

      await sendMessage(
        task.telegram_chat_id,
        notificationText,
        keyboard
      );

      await taskRepository.markReminderSent(task.id);
      sent++;

      logger.info("Reminder sent", {
        taskId: task.id,
        userId: task.telegram_user_id,
        appName: task.app_name,
      });
    } catch (error) {
      failed++;
      logger.error("Failed to send reminder", error, {
        taskId: task.id,
        userId: task.telegram_user_id,
      });
    }
  }

  return { processed: tasks.length, sent, failed };
}
