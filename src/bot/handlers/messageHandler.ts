import type { TelegramMessage, User } from "../../types.js";
import { sendMessage } from "../../lib/telegram.js";
import {
  getConversation,
  setConversation,
  clearConversation,
  createTask,
} from "../../services/taskService.js";
import { taskRepository } from "../../database/repositories/taskRepository.js";
import { userRepository } from "../../database/repositories/userRepository.js";
import {
  countryPrompt,
  completionTimePrompt,
  reminderPrompt,
  taskConfirmationMessage,
  notePrompt,
} from "../messages.js";
import {
  countrySelector,
  completionTimeOptions,
  reminderOptions,
  taskConfirmation,
  noteOptions,
  pastReminderOptions,
} from "../keyboards.js";
import {
  parseCustomTime,
  parseCustomReminder,
  addToDate,
  utcNow,
  toUTC,
  isTimeInPast,
} from "../../lib/time.js";
import { searchCountries } from "../../data/countries.js";
import { validateAppName } from "../../lib/validation.js";

export async function handleTextMessage(
  message: TelegramMessage,
  user: User
): Promise<void> {
  const chatId = message.chat.id;
  const text = message.text;
  if (!text) return;

  const conv = await getConversation(user.telegram_user_id);

  switch (conv.state) {
    case "WAITING_FOR_APP": {
      const validation = validateAppName(text);
      if (!validation.valid) {
        await sendMessage(chatId, `❌ ${validation.error}`);
        return;
      }
      await setConversation(user.telegram_user_id, {
        ...conv,
        state: "WAITING_FOR_COUNTRY",
        app_name: text.trim(),
        country_page: 0,
      });
      await sendMessage(chatId, countryPrompt(), countrySelector(0));
      break;
    }

    case "WAITING_FOR_COUNTRY": {
      const searchResults = searchCountries(text);
      if (searchResults.length === 1) {
        const country = searchResults[0];
        await setConversation(user.telegram_user_id, {
          ...conv,
          state: "WAITING_FOR_COMPLETION_TIME",
          country: country.name,
          country_code: country.code,
        });
        await sendMessage(chatId, completionTimePrompt(), completionTimeOptions());
      } else if (searchResults.length > 1) {
        const keyboard = {
          inline_keyboard: searchResults.slice(0, 10).map((c) => [
            { text: `${c.flag} ${c.name}`, callback_data: `country:${c.code}` },
          ]),
        };
        await sendMessage(
          chatId,
          "🔎 <b>Search Results:</b>\n\nSelect a country:",
          keyboard
        );
      } else {
        await sendMessage(
          chatId,
          "❌ Country not found. Try again or use the keyboard below:",
          countrySelector(conv.country_page || 0)
        );
      }
      break;
    }

    case "WAITING_FOR_CUSTOM_TIME": {
      if (text.toLowerCase() === "back") {
        await setConversation(user.telegram_user_id, {
          ...conv,
          state: "WAITING_FOR_COMPLETION_TIME",
        });
        await sendMessage(chatId, completionTimePrompt(), completionTimeOptions());
        return;
      }

      const parsed = parseCustomTime(text, user.timezone);
      if (parsed.error) {
        await sendMessage(chatId, parsed.error);
        return;
      }

      await setConversation(user.telegram_user_id, {
        ...conv,
        state: "WAITING_FOR_REMINDER",
        completed_at: toUTC(parsed.date),
      });
      await sendMessage(chatId, reminderPrompt(), reminderOptions());
      break;
    }

    case "WAITING_FOR_CUSTOM_REMINDER": {
      if (text.toLowerCase() === "back") {
        await setConversation(user.telegram_user_id, {
          ...conv,
          state: "WAITING_FOR_REMINDER",
        });
        await sendMessage(chatId, reminderPrompt(), reminderOptions());
        return;
      }

      const parsed = parseCustomReminder(text);
      if (parsed.error) {
        await sendMessage(chatId, parsed.error);
        return;
      }

      const completedAt = new Date(conv.completed_at || utcNow());
      const reminderAt = addToDate(completedAt, parsed.minutes);

      if (isTimeInPast(reminderAt)) {
        await sendMessage(
          chatId,
          "⚠️ <b>This reminder time has already passed.</b>\n\nWould you like to:",
          pastReminderOptions()
        );
        await setConversation(user.telegram_user_id, {
          ...conv,
          state: "WAITING_FOR_REMINDER",
          reminder_duration: parsed.minutes,
        });
        return;
      }

      await setConversation(user.telegram_user_id, {
        ...conv,
        state: "WAITING_FOR_NOTES",
        reminder_duration: parsed.minutes,
        reminder_at: toUTC(reminderAt),
      });
      await sendMessage(chatId, notePrompt(), noteOptions());
      break;
    }

    case "WAITING_FOR_NOTES": {
      const conv2 = await getConversation(user.telegram_user_id);
      const task = await createTask({
        telegram_user_id: user.telegram_user_id,
        telegram_chat_id: chatId,
        app_name: conv2.app_name || "Unknown",
        country: conv2.country || "Unknown",
        country_code: conv2.country_code || "XX",
        completed_at: new Date(conv2.completed_at || utcNow()),
        reminder_duration: conv2.reminder_duration || 60,
        timezone: user.timezone,
        notes: text === "skip" ? undefined : text,
      });
      await clearConversation(user.telegram_user_id);
      await sendMessage(
        chatId,
        taskConfirmationMessage(task, user),
        taskConfirmation()
      );
      break;
    }

    case "WAITING_FOR_EDIT_FIELD": {
      const field = conv.edit_field;
      const taskId = conv.edit_task_id;
      if (!field || !taskId) {
        await clearConversation(user.telegram_user_id);
        return;
      }

      const task = await taskRepository.findById(taskId);
      if (!task || task.telegram_user_id !== user.telegram_user_id) {
        await clearConversation(user.telegram_user_id);
        return;
      }

      switch (field) {
        case "app_name": {
          const validation = validateAppName(text);
          if (!validation.valid) {
            await sendMessage(chatId, `❌ ${validation.error}`);
            return;
          }
          await taskRepository.update(taskId, user.telegram_user_id, {
            app_name: text.trim(),
          });
          break;
        }
        case "country": {
          const searchResults = searchCountries(text);
          if (searchResults.length === 1) {
            await taskRepository.update(taskId, user.telegram_user_id, {
              country: searchResults[0].name,
              country_code: searchResults[0].code,
            });
          } else {
            await sendMessage(
              chatId,
              "❌ Country not found. Try again:"
            );
            return;
          }
          break;
        }
        case "completed_at": {
          const parsed = parseCustomTime(text, user.timezone);
          if (parsed.error) {
            await sendMessage(chatId, parsed.error);
            return;
          }
          await taskRepository.update(taskId, user.telegram_user_id, {
            completed_at: toUTC(parsed.date),
          });
          break;
        }
        case "reminder_duration": {
          const parsed = parseCustomReminder(text);
          if (parsed.error) {
            await sendMessage(chatId, parsed.error);
            return;
          }
          const completedAt = new Date(task.completed_at);
          const reminderAt = addToDate(completedAt, parsed.minutes);
          await taskRepository.update(taskId, user.telegram_user_id, {
            reminder_duration: parsed.minutes,
            reminder_at: toUTC(reminderAt),
            reminder_sent: false,
          });
          break;
        }
        case "notes": {
          await taskRepository.update(taskId, user.telegram_user_id, {
            notes: text === "skip" ? null : text,
          });
          break;
        }
        case "default_reminder_minutes": {
          const minutes = parseInt(text, 10);
          if (isNaN(minutes) || minutes < 1 || minutes > 10080) {
            await sendMessage(chatId, "❌ Please enter a valid number of minutes (1-10080).");
            return;
          }
          await userRepository.update(user.telegram_user_id, {
            default_reminder_minutes: minutes,
          });
          break;
        }
      }

      await clearConversation(user.telegram_user_id);
      const updatedTask = await taskRepository.findById(taskId);
      if (updatedTask) {
        const { taskViewMessage } = await import("../messages.js");
        const { taskActions } = await import("../keyboards.js");
        await sendMessage(
          chatId,
          `✅ Updated!\n\n${taskViewMessage(updatedTask, user)}`,
          taskActions(taskId)
        );
      }
      break;
    }

    case "WAITING_FOR_BROADCAST": {
      const conv2 = await getConversation(user.telegram_user_id);
      await setConversation(user.telegram_user_id, {
        ...conv2,
        state: "WAITING_FOR_BROADCAST",
        broadcast_message: text,
      });

      const chatIds = await userRepository.getAllChatIds();
      const { broadcastConfirmMessage } = await import("../messages.js");
      await sendMessage(
        chatId,
        broadcastConfirmMessage(text, chatIds.length),
        {
          inline_keyboard: [
            [
              { text: "🚀 Send", callback_data: "broadcast:send" },
              { text: "❌ Cancel", callback_data: "broadcast:cancel" },
            ],
          ],
        }
      );
      break;
    }

    case "IDLE":
    default:
      break;
  }
}
