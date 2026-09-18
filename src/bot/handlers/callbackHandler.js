import { sendMessage, editMessageText, answerCallbackQuery, isFromAdmin } from "../../lib/telegram.js";
import { getConversation, setConversation, clearConversation, createTask, getUserTasks, getHistoryTasks, getStats, snoozeTask, completeTask, cancelTask, getAdminStats } from "../../services/taskService.js";
import { taskRepository } from "../../database/repositories/taskRepository.js";
import { userRepository } from "../../database/repositories/userRepository.js";
import { broadcastRepository } from "../../database/repositories/reminderRepository.js";
import { mainMenuMessage, taskConfirmationMessage, taskViewMessage, tasksListMessage, remindersListMessage, historyListMessage, statsMessage, settingsMessage, adminDashboardMessage, broadcastConfirmMessage, pastReminderMessage, notePrompt } from "../messages.js";
import { mainMenu, countrySelector, completionTimeOptions, reminderOptions, taskConfirmation, taskActions, reminderActions, settingsMenu, timezoneSelector, adminPanel, editTaskOptions, deleteConfirm, noteOptions, pastReminderOptions } from "../keyboards.js";
import { addToDate, utcNow, toUTC, parseCustomTime, parseCustomReminder, isTimeInPast } from "../../lib/time.js";
import { getCountryByCode } from "../../data/countries.js";

async function editOrSend(chatId, messageId, text, keyboard) {
  if (messageId) {
    try { await editMessageText(chatId, messageId, text, keyboard); return; } catch {}
  }
  await sendMessage(chatId, text, keyboard);
}

export async function handleCallbackQuery(query, user) {
  const data = query.data;
  if (!data) return;
  const chatId = (query.message && query.message.chat) ? query.message.chat.id : 0;
  const messageId = query.message ? query.message.message_id : undefined;
  try { await answerCallbackQuery(query.id); } catch {}
  if (data === "noop") return;

  // Menu
  if (data === "menu:main" || data === "menu:back") return editOrSend(chatId, messageId, mainMenuMessage(), mainMenu());
  if (data === "menu:add") { await clearConversation(user.telegram_user_id); await setConversation(user.telegram_user_id, { state: "WAITING_FOR_APP" }); return editOrSend(chatId, messageId, "What app or website did you work on?\n\nEnter the name below:"); }
  if (data === "menu:tasks") return handleShowTasks(user, chatId, 0, messageId);
  if (data === "menu:reminders") return handleShowReminders(user, chatId, messageId);
  if (data === "menu:history") return handleShowHistory(user, chatId, 0, messageId);
  if (data === "menu:stats") { const s = await getStats(user.telegram_user_id); return editOrSend(chatId, messageId, statsMessage(s), mainMenu()); }
  if (data === "menu:settings") return editOrSend(chatId, messageId, settingsMessage(user), settingsMenu());
  if (data === "menu:help") { const { helpMessage } = await import("../messages.js"); return editOrSend(chatId, messageId, helpMessage(), mainMenu()); }

  // Pagination
  if (data.startsWith("tasks_page:")) return handleShowTasks(user, chatId, parseInt(data.split(":")[1]), messageId);
  if (data.startsWith("history_page:")) return handleShowHistory(user, chatId, parseInt(data.split(":")[1]), messageId);

  // Country
  if (data.startsWith("country_page:")) return editOrSend(chatId, messageId, "Select the country:", countrySelector(parseInt(data.split(":")[1])));
  if (data === "country_search") { await setConversation(user.telegram_user_id, { state: "WAITING_FOR_COUNTRY", country_page: 0 }); return editOrSend(chatId, messageId, "Type a country name below:"); }
  if (data.startsWith("country:")) {
    const code = data.split(":")[1];
    const country = getCountryByCode(code);
    if (!country) return;
    const conv = await getConversation(user.telegram_user_id);
    await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_COMPLETION_TIME", country: country.name, country_code: country.code });
    return editOrSend(chatId, messageId, "When was this task completed?", completionTimeOptions());
  }

  // Time
  if (data.startsWith("time:")) {
    const timeValue = data.split(":")[1];
    const conv = await getConversation(user.telegram_user_id);
    if (timeValue === "custom") { await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_CUSTOM_TIME" }); return editOrSend(chatId, messageId, "Enter the time (e.g. 18:30, 6:30 PM, 2026-09-19 18:30):\n\nType back to go back:"); }
    const completedAt = addToDate(utcNow(), -parseInt(timeValue, 10));
    await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_REMINDER", completed_at: toUTC(completedAt) });
    return editOrSend(chatId, messageId, "How long after completion should I remind you?", reminderOptions());
  }

  // Reminder
  if (data.startsWith("remind:")) {
    const remindValue = data.split(":")[1];
    const conv = await getConversation(user.telegram_user_id);
    if (remindValue === "custom") { await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_CUSTOM_REMINDER" }); return editOrSend(chatId, messageId, "Enter reminder duration (e.g. 30 minutes, 2 hours, 1 day):\n\nType back to go back:"); }
    const durationMinutes = parseInt(remindValue, 10);
    const completedAt = new Date(conv.completed_at || utcNow());
    const reminderAt = addToDate(completedAt, durationMinutes);
    if (isTimeInPast(reminderAt)) { await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_REMINDER", reminder_duration: durationMinutes }); return editOrSend(chatId, messageId, "This reminder time has already passed.", pastReminderOptions()); }
    await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_NOTES", reminder_duration: durationMinutes, reminder_at: toUTC(reminderAt) });
    return editOrSend(chatId, messageId, "Add an optional note for this task:", noteOptions());
  }

  // Past reminder
  if (data === "past_remind:now") { const conv = await getConversation(user.telegram_user_id); const task = await createTask({ telegram_user_id: user.telegram_user_id, telegram_chat_id: chatId, app_name: conv.app_name || "Unknown", country: conv.country || "Unknown", country_code: conv.country_code || "XX", completed_at: new Date(conv.completed_at || utcNow()), reminder_duration: 0, timezone: user.timezone, notes: conv.notes }); await clearConversation(user.telegram_user_id); return editOrSend(chatId, messageId, taskConfirmationMessage(task, user), taskConfirmation()); }
  if (data === "past_remind:start_now") { const conv = await getConversation(user.telegram_user_id); const now = utcNow(); const dur = conv.reminder_duration || 60; await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_NOTES", completed_at: toUTC(now), reminder_at: toUTC(addToDate(now, dur)) }); return editOrSend(chatId, messageId, "Add an optional note:", noteOptions()); }
  if (data === "past_remind:change") { const conv = await getConversation(user.telegram_user_id); await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_REMINDER" }); return editOrSend(chatId, messageId, "How long after completion?", reminderOptions()); }

  // Notes
  if (data === "note:add") { const conv = await getConversation(user.telegram_user_id); await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_NOTES" }); return editOrSend(chatId, messageId, "Type your note below:"); }
  if (data === "note:skip") { const conv = await getConversation(user.telegram_user_id); const task = await createTask({ telegram_user_id: user.telegram_user_id, telegram_chat_id: chatId, app_name: conv.app_name || "Unknown", country: conv.country || "Unknown", country_code: conv.country_code || "XX", completed_at: new Date(conv.completed_at || utcNow()), reminder_duration: conv.reminder_duration || 60, timezone: user.timezone }); await clearConversation(user.telegram_user_id); return editOrSend(chatId, messageId, taskConfirmationMessage(task, user), taskConfirmation()); }

  // Task actions
  if (data.startsWith("task:view:")) { const taskId = data.split(":")[2]; const task = await taskRepository.findById(taskId); if (!task || task.telegram_user_id !== user.telegram_user_id) return; return editOrSend(chatId, messageId, taskViewMessage(task, user), taskActions(taskId)); }
  if (data.startsWith("task:edit:")) { const taskId = data.split(":")[2]; const task = await taskRepository.findById(taskId); if (!task || task.telegram_user_id !== user.telegram_user_id) return; return editOrSend(chatId, messageId, `Edit Task - ${task.app_name}`, editTaskOptions(taskId)); }
  if (data.startsWith("task:delete:")) { const taskId = data.split(":")[2]; const task = await taskRepository.findById(taskId); if (!task || task.telegram_user_id !== user.telegram_user_id) return; return editOrSend(chatId, messageId, `Delete this task?\n\n${task.app_name}`, deleteConfirm(taskId)); }
  if (data.startsWith("delete_confirm:")) { const taskId = data.split(":")[1]; if (await cancelTask(taskId, user.telegram_user_id)) return editOrSend(chatId, messageId, "Task deleted.", mainMenu()); }

  // Reminder actions
  if (data.startsWith("reminder:complete:")) { const taskId = data.split(":")[2]; const task = await completeTask(taskId, user.telegram_user_id); if (task) return editOrSend(chatId, messageId, `Task Completed! ${task.app_name}`, mainMenu()); }
  if (data.startsWith("reminder:snooze:")) { const parts = data.split(":"); const taskId = parts[2]; const minutes = parseInt(parts[3], 10); const task = await snoozeTask(taskId, user.telegram_user_id, minutes); if (task) return editOrSend(chatId, messageId, `Snoozed ${minutes}m. ${task.app_name}`, mainMenu()); }
  if (data.startsWith("reminder:cancel:")) { const taskId = data.split(":")[2]; if (await cancelTask(taskId, user.telegram_user_id)) return editOrSend(chatId, messageId, "Reminder cancelled.", mainMenu()); }

  // Confirm
  if (data === "confirm:cancel") { await clearConversation(user.telegram_user_id); return editOrSend(chatId, messageId, "Task cancelled.", mainMenu()); }

  // Edit fields
  if (data.startsWith("editfield:")) { const parts = data.split(":"); const field = parts[1]; const taskId = parts[2]; const conv = await getConversation(user.telegram_user_id); await setConversation(user.telegram_user_id, { ...conv, state: "WAITING_FOR_EDIT_FIELD", edit_task_id: taskId, edit_field: field }); const prompts = { app_name: "Enter new app/website name:", country: "Enter new country name:", completed_at: "Enter new completion time (e.g. 18:30):", reminder_duration: "Enter new reminder duration (e.g. 60, 2 hours):", notes: "Enter new notes:" }; return editOrSend(chatId, messageId, prompts[field] || "Enter new value:"); }

  // Settings
  if (data === "settings:timezone") return editOrSend(chatId, messageId, "Select your timezone:", timezoneSelector());
  if (data.startsWith("tz:")) { await userRepository.update(user.telegram_user_id, { timezone: data.substring(3) }); return editOrSend(chatId, messageId, `Timezone updated to ${data.substring(3)}`, mainMenu()); }
  if (data === "settings:time_format") { const f = user.time_format === "12h" ? "24h" : "12h"; await userRepository.update(user.telegram_user_id, { time_format: f }); return editOrSend(chatId, messageId, `Time format set to ${f}`, mainMenu()); }
  if (data === "settings:notifications") { const n = !user.notifications_enabled; await userRepository.update(user.telegram_user_id, { notifications_enabled: n }); return editOrSend(chatId, messageId, `Notifications ${n ? "enabled" : "disabled"}.`, mainMenu()); }
  if (data === "settings:default_reminder") { await setConversation(user.telegram_user_id, { state: "WAITING_FOR_EDIT_FIELD", edit_field: "default_reminder_minutes" }); return editOrSend(chatId, messageId, "Enter default reminder in minutes (e.g. 60):"); }

  // Admin
  if (data === "admin:stats" && isFromAdmin(user.telegram_user_id)) return editOrSend(chatId, messageId, adminDashboardMessage(await getAdminStats()), adminPanel());
  if (data === "admin:users" && isFromAdmin(user.telegram_user_id)) { const c = await userRepository.count(); return editOrSend(chatId, messageId, `Total Users: ${c}`, adminPanel()); }
  if (data === "admin:tasks" && isFromAdmin(user.telegram_user_id)) { const sc = await taskRepository.countByStatus(); return editOrSend(chatId, messageId, sc.map((s) => `${s.status}: ${s.count}`).join("\n"), adminPanel()); }
  if (data === "admin:reminders" && isFromAdmin(user.telegram_user_id)) { const p = await taskRepository.totalActiveReminders(); return editOrSend(chatId, messageId, `Pending Reminders: ${p}`, adminPanel()); }
  if (data === "admin:broadcast" && isFromAdmin(user.telegram_user_id)) { await setConversation(user.telegram_user_id, { state: "WAITING_FOR_BROADCAST" }); return editOrSend(chatId, messageId, "Enter the message to broadcast:"); }
  if (data === "broadcast:send") { const conv = await getConversation(user.telegram_user_id); if (!conv.broadcast_message) return; const chatIds = await userRepository.getAllChatIds(); let ok = 0, fail = 0; for (const { telegram_chat_id } of chatIds) { try { await sendMessage(telegram_chat_id, conv.broadcast_message); ok++; } catch { fail++; } } await broadcastRepository.create({ admin_user_id: user.telegram_user_id, message: conv.broadcast_message, total_recipients: chatIds.length, successful: ok, failed: fail }); await clearConversation(user.telegram_user_id); return editOrSend(chatId, messageId, `Broadcast sent! OK: ${ok}, Failed: ${fail}`, adminPanel()); }
  if (data === "broadcast:cancel") { await clearConversation(user.telegram_user_id); return editOrSend(chatId, messageId, "Broadcast cancelled.", adminPanel()); }
}

export async function handleShowTasks(user, chatId, page, messageId) {
  const { tasks, total } = await getUserTasks(user.telegram_user_id, page);
  const text = tasksListMessage(tasks, user, page, total);
  const totalPages = Math.ceil(total / 5);
  const kb = { inline_keyboard: [] };
  tasks.forEach((t) => kb.inline_keyboard.push([{ text: t.app_name, callback_data: `task:view:${t.id}` }]));
  if (totalPages > 1) { const nav = []; if (page > 0) nav.push({ text: "<", callback_data: `tasks_page:${page - 1}` }); nav.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" }); if (page < totalPages - 1) nav.push({ text: ">", callback_data: `tasks_page:${page + 1}` }); kb.inline_keyboard.push(nav); }
  kb.inline_keyboard.push([{ text: "Add Task", callback_data: "menu:add" }]);
  kb.inline_keyboard.push([{ text: "Back", callback_data: "menu:main" }]);
  if (messageId) { try { await editMessageText(chatId, messageId, text, kb); return; } catch {} }
  await sendMessage(chatId, text, kb);
}

export async function handleShowReminders(user, chatId, messageId) {
  const tasks = await taskRepository.findByUser(user.telegram_user_id, { status: "pending", limit: 20 });
  const text = remindersListMessage(tasks, user);
  const kb = { inline_keyboard: [] };
  tasks.forEach((t) => kb.inline_keyboard.push([{ text: t.app_name, callback_data: `reminder:complete:${t.id}` }]));
  kb.inline_keyboard.push([{ text: "Back", callback_data: "menu:main" }]);
  if (messageId) { try { await editMessageText(chatId, messageId, text, kb); return; } catch {} }
  await sendMessage(chatId, text, kb);
}

export async function handleShowHistory(user, chatId, page, messageId) {
  const { tasks, total } = await getHistoryTasks(user.telegram_user_id, page);
  const text = historyListMessage(tasks, user, page, total);
  const totalPages = Math.ceil(total / 5);
  const kb = { inline_keyboard: [] };
  if (totalPages > 1) { const nav = []; if (page > 0) nav.push({ text: "<", callback_data: `history_page:${page - 1}` }); nav.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" }); if (page < totalPages - 1) nav.push({ text: ">", callback_data: `history_page:${page + 1}` }); kb.inline_keyboard.push(nav); }
  kb.inline_keyboard.push([{ text: "Back", callback_data: "menu:main" }]);
  if (messageId) { try { await editMessageText(chatId, messageId, text, kb); return; } catch {} }
  await sendMessage(chatId, text, kb);
}
