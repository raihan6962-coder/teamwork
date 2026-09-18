import { sendMessage } from "../../lib/telegram.js";
import { getConversation, setConversation, clearConversation, createTask } from "../../services/taskService.js";
import { taskRepository } from "../../database/repositories/taskRepository.js";
import { userRepository } from "../../database/repositories/userRepository.js";
import { countryPrompt, completionTimePrompt, reminderPrompt, taskConfirmationMessage, notePrompt } from "../messages.js";
import { countrySelector, completionTimeOptions, reminderOptions, taskConfirmation, noteOptions, pastReminderOptions } from "../keyboards.js";
import { parseCustomTime, parseCustomReminder, addToDate, utcNow, toUTC, isTimeInPast } from "../../lib/time.js";
import { searchCountries } from "../../data/countries.js";
import { validateAppName } from "../../lib/validation.js";

export async function handleTextMessage(message, user) {
  const chatId = message.chat.id;
  const text = message.text;
  if (!text) return;
  const conv = await getConversation(user.telegram_user_id);

  switch (conv.state) {
    case "WAITING_FOR_APP": {
      const v = validateAppName(text);
      if (!v.valid) { await sendMessage(chatId, v.error); return; }
      await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_COUNTRY", app_name: text.trim(), country_page: 0 });
      await sendMessage(chatId, countryPrompt(), countrySelector(0));
      break;
    }
    case "WAITING_FOR_COUNTRY": {
      const results = searchCountries(text);
      if (results.length === 1) {
        const c = results[0];
        await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_COMPLETION_TIME", country: c.name, country_code: c.code });
        await sendMessage(chatId, completionTimePrompt(), completionTimeOptions());
      } else if (results.length > 1) {
        const kb = { inline_keyboard: results.slice(0, 10).map((c) => [{ text: `${c.flag} ${c.name}`, callback_data: `country:${c.code}` }]) };
        await sendMessage(chatId, "Search Results - Select a country:", kb);
      } else {
        await sendMessage(chatId, "Country not found. Try again:", countrySelector(conv.country_page || 0));
      }
      break;
    }
    case "WAITING_FOR_CUSTOM_TIME": {
      if (text.toLowerCase() === "back") { await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_COMPLETION_TIME" }); await sendMessage(chatId, completionTimePrompt(), completionTimeOptions()); return; }
      const parsed = parseCustomTime(text, user.timezone);
      if (parsed.error) { await sendMessage(chatId, parsed.error); return; }
      await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_REMINDER", completed_at: toUTC(parsed.date) });
      await sendMessage(chatId, reminderPrompt(), reminderOptions());
      break;
    }
    case "WAITING_FOR_CUSTOM_REMINDER": {
      if (text.toLowerCase() === "back") { await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_REMINDER" }); await sendMessage(chatId, reminderPrompt(), reminderOptions()); return; }
      const parsed = parseCustomReminder(text);
      if (parsed.error) { await sendMessage(chatId, parsed.error); return; }
      const completedAt = new Date(conv.completed_at || utcNow());
      const reminderAt = addToDate(completedAt, parsed.minutes);
      if (isTimeInPast(reminderAt)) { await sendMessage(chatId, "This reminder time has already passed.", pastReminderOptions()); await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_REMINDER", reminder_duration: parsed.minutes }); return; }
      await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_NOTES", reminder_duration: parsed.minutes, reminder_at: toUTC(reminderAt) });
      await sendMessage(chatId, notePrompt(), noteOptions());
      break;
    }
    case "WAITING_FOR_NOTES": {
      const conv2 = await getConversation(user.telegram_user_id);
      const task = await createTask({ telegram_user_id: user.telegram_user_id, telegram_chat_id: chatId, app_name: conv2.app_name || "Unknown", country: conv2.country || "Unknown", country_code: conv2.country_code || "XX", completed_at: new Date(conv2.completed_at || utcNow()), reminder_duration: conv2.reminder_duration || 60, timezone: user.timezone, notes: text === "skip" ? undefined : text });
      await clearConversation(user.telegram_user_id);
      await sendMessage(chatId, taskConfirmationMessage(task, user), taskConfirmation());
      break;
    }
    case "WAITING_FOR_EDIT_FIELD": {
      const field = conv.edit_field;
      const taskId = conv.edit_task_id;
      if (!field || !taskId) { await clearConversation(user.telegram_user_id); return; }
      const task = await taskRepository.findById(taskId);
      if (!task || task.telegram_user_id !== user.telegram_user_id) { await clearConversation(user.telegram_user_id); return; }
      if (field === "app_name") { const v = validateAppName(text); if (!v.valid) { await sendMessage(chatId, v.error); return; } await taskRepository.update(taskId, user.telegram_user_id, { app_name: text.trim() }); }
      else if (field === "country") { const r = searchCountries(text); if (r.length === 1) await taskRepository.update(taskId, user.telegram_user_id, { country: r[0].name, country_code: r[0].code }); else { await sendMessage(chatId, "Country not found. Try again:"); return; } }
      else if (field === "completed_at") { const p = parseCustomTime(text, user.timezone); if (p.error) { await sendMessage(chatId, p.error); return; } await taskRepository.update(taskId, user.telegram_user_id, { completed_at: toUTC(p.date) }); }
      else if (field === "reminder_duration") { const p = parseCustomReminder(text); if (p.error) { await sendMessage(chatId, p.error); return; } const ca = new Date(task.completed_at); await taskRepository.update(taskId, user.telegram_user_id, { reminder_duration: p.minutes, reminder_at: toUTC(addToDate(ca, p.minutes)), reminder_sent: false }); }
      else if (field === "notes") { await taskRepository.update(taskId, user.telegram_user_id, { notes: text === "skip" ? null : text }); }
      else if (field === "default_reminder_minutes") { const m = parseInt(text, 10); if (isNaN(m) || m < 1) { await sendMessage(chatId, "Enter a valid number."); return; } await userRepository.update(user.telegram_user_id, { default_reminder_minutes: m }); }
      await clearConversation(user.telegram_user_id);
      const updated = await taskRepository.findById(taskId);
      if (updated) { const { taskViewMessage } = await import("../messages.js"); const { taskActions } = await import("../keyboards.js"); await sendMessage(chatId, `Updated!\n\n${taskViewMessage(updated, user)}`, taskActions(taskId)); }
      break;
    }
    case "WAITING_FOR_BROADCAST": {
      const chatIds = await userRepository.getAllChatIds();
      await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_BROADCAST", broadcast_message: text });
      const { broadcastConfirmMessage } = await import("../messages.js");
      await sendMessage(chatId, broadcastConfirmMessage(text, chatIds.length), { inline_keyboard: [[{ text: "Send", callback_data: "broadcast:send" }, { text: "Cancel", callback_data: "broadcast:cancel" }]] });
      break;
    }
  }
}
