import type { CallbackQuery, User } from "../../types.js";
import { sendMessage, editMessageText, answerCallbackQuery } from "../../lib/telegram.js";
import {
  getConversation,
  setConversation,
  clearConversation,
  createTask,
  getUserTasks,
  getHistoryTasks,
  getStats,
  snoozeTask,
  completeTask,
  cancelTask,
  getAdminStats,
} from "../../services/taskService.js";
import { taskRepository } from "../../database/repositories/taskRepository.js";
import { userRepository } from "../../database/repositories/userRepository.js";
import { broadcastRepository } from "../../database/repositories/reminderRepository.js";
import {
  mainMenuMessage,
  newTaskPrompt,
  countryPrompt,
  completionTimePrompt,
  reminderPrompt,
  customTimePrompt,
  customReminderPrompt,
  taskConfirmationMessage,
  taskViewMessage,
  tasksListMessage,
  remindersListMessage,
  historyListMessage,
  statsMessage,
  settingsMessage,
  adminDashboardMessage,
  broadcastConfirmMessage,
  pastReminderMessage,
  notePrompt,
} from "../messages.js";
import {
  mainMenu,
  countrySelector,
  completionTimeOptions,
  reminderOptions,
  taskConfirmation,
  taskActions,
  reminderActions,
  settingsMenu,
  timezoneSelector,
  adminPanel,
  editTaskOptions,
  deleteConfirm,
  noteOptions,
  pastReminderOptions,
} from "../keyboards.js";
import {
  addToDate,
  utcNow,
  toUTC,
  parseCustomTime,
  parseCustomReminder,
  isTimeInPast,
} from "../../lib/time.js";
import { getCountryByCode } from "../../data/countries.js";
import type { InlineKeyboard } from "../../types.js";

export async function handleCallbackQuery(
  query: CallbackQuery,
  user: User
): Promise<void> {
  const data = query.data;
  if (!data) return;

  const chatId = query.message?.chat.id || 0;
  const messageId = query.message?.message_id;

  try {
    await answerCallbackQuery(query.id);
  } catch {
    // Ignore callback answer errors
  }

  if (data === "noop") return;

  if (data === "menu:main" || data === "menu:back") {
    await editOrSend(chatId, messageId, mainMenuMessage(), mainMenu());
    return;
  }

  if (data === "menu:add") {
    await clearConversation(user.telegram_user_id);
    await setConversation(user.telegram_user_id, { state: "WAITING_FOR_APP" });
    await editOrSend(chatId, messageId, newTaskPrompt());
    return;
  }

  if (data === "menu:tasks") {
    await handleShowTasks(user, chatId, 0, messageId);
    return;
  }

  if (data === "menu:reminders") {
    await handleShowReminders(user, chatId, messageId);
    return;
  }

  if (data === "menu:history") {
    await handleShowHistory(user, chatId, 0, messageId);
    return;
  }

  if (data.startsWith("tasks_page:")) {
    const page = parseInt(data.split(":")[1], 10);
    await handleShowTasks(user, chatId, page, messageId);
    return;
  }

  if (data.startsWith("history_page:")) {
    const page = parseInt(data.split(":")[1], 10);
    await handleShowHistory(user, chatId, page, messageId);
    return;
  }

  if (data === "menu:stats") {
    const stats = await getStats(user.telegram_user_id);
    await editOrSend(chatId, messageId, statsMessage(stats), mainMenu());
    return;
  }

  if (data === "menu:settings") {
    await editOrSend(
      chatId,
      messageId,
      settingsMessage(user),
      settingsMenu()
    );
    return;
  }

  if (data === "menu:help") {
    const { helpMessage } = await import("../messages.js");
    await editOrSend(chatId, messageId, helpMessage(), mainMenu());
    return;
  }

  if (data.startsWith("country_page:")) {
    const page = parseInt(data.split(":")[1], 10);
    await editOrSend(chatId, messageId, countryPrompt(), countrySelector(page));
    return;
  }

  if (data === "country_search") {
    await editOrSend(
      chatId,
      messageId,
      "🔎 <b>Search Country</b>\n\n<i>Type a country name below:</i>"
    );
    await setConversation(user.telegram_user_id, {
      state: "WAITING_FOR_COUNTRY",
      country_page: 0,
    });
    return;
  }

  if (data.startsWith("country:")) {
    const code = data.split(":")[1];
    const country = getCountryByCode(code);
    if (!country) return;

    const conv = await getConversation(user.telegram_user_id);
    await setConversation(user.telegram_user_id, {
      ...conv,
      state: "WAITING_FOR_COMPLETION_TIME",
      country: country.name,
      country_code: country.code,
    });
    await editOrSend(chatId, messageId, completionTimePrompt(), completionTimeOptions());
    return;
  }

  if (data.startsWith("time:")) {
    const timeValue = data.split(":")[1];
    const conv = await getConversation(user.telegram_user_id);

    if (timeValue === "custom") {
      await setConversation(user.telegram_user_id, {
        ...conv,
        state: "WAITING_FOR_CUSTOM_TIME",
      });
      await editOrSend(chatId, messageId, customTimePrompt());
      return;
    }

    const minutesAgo = parseInt(timeValue, 10);
    const completedAt = addToDate(utcNow(), -minutesAgo);

    await setConversation(user.telegram_user_id, {
      ...conv,
      state: "WAITING_FOR_REMINDER",
      completed_at: toUTC(completedAt),
    });
    await editOrSend(chatId, messageId, reminderPrompt(), reminderOptions());
    return;
  }

  if (data.startsWith("remind:")) {
    const remindValue = data.split(":")[1];
    const conv = await getConversation(user.telegram_user_id);

    if (remindValue === "custom") {
      await setConversation(user.telegram_user_id, {
        ...conv,
        state: "WAITING_FOR_CUSTOM_REMINDER",
      });
      await editOrSend(chatId, messageId, customReminderPrompt());
      return;
    }

    const durationMinutes = parseInt(remindValue, 10);
    const completedAt = new Date(conv.completed_at || utcNow());
    const reminderAt = addToDate(completedAt, durationMinutes);

    if (isTimeInPast(reminderAt)) {
      await editOrSend(
        chatId,
        messageId,
        pastReminderMessage(),
        pastReminderOptions()
      );
      await setConversation(user.telegram_user_id, {
        ...conv,
        state: "WAITING_FOR_REMINDER",
        reminder_duration: durationMinutes,
      });
      return;
    }

    await setConversation(user.telegram_user_id, {
      ...conv,
      state: "WAITING_FOR_NOTES",
      reminder_duration: durationMinutes,
      reminder_at: toUTC(reminderAt),
    });
    await editOrSend(chatId, messageId, notePrompt(), noteOptions());
    return;
  }

  if (data === "past_remind:now") {
    const conv = await getConversation(user.telegram_user_id);
    const task = await createTask({
      telegram_user_id: user.telegram_user_id,
      telegram_chat_id: chatId,
      app_name: conv.app_name || "Unknown",
      country: conv.country || "Unknown",
      country_code: conv.country_code || "XX",
      completed_at: new Date(conv.completed_at || utcNow()),
      reminder_duration: 0,
      timezone: user.timezone,
      notes: conv.notes,
    });
    await clearConversation(user.telegram_user_id);
    await editOrSend(
      chatId,
      messageId,
      taskConfirmationMessage(task, user),
      taskConfirmation()
    );
    return;
  }

  if (data === "past_remind:start_now") {
    const conv = await getConversation(user.telegram_user_id);
    const completedAt = utcNow();
    const duration = conv.reminder_duration || 60;
    const reminderAt = addToDate(completedAt, duration);

    await setConversation(user.telegram_user_id, {
      ...conv,
      state: "WAITING_FOR_NOTES",
      completed_at: toUTC(completedAt),
      reminder_at: toUTC(reminderAt),
    });
    await editOrSend(chatId, messageId, notePrompt(), noteOptions());
    return;
  }

  if (data === "past_remind:change") {
    const conv = await getConversation(user.telegram_user_id);
    await setConversation(user.telegram_user_id, {
      ...conv,
      state: "WAITING_FOR_REMINDER",
    });
    await editOrSend(chatId, messageId, reminderPrompt(), reminderOptions());
    return;
  }

  if (data === "note:add") {
    const conv = await getConversation(user.telegram_user_id);
    await setConversation(user.telegram_user_id, {
      ...conv,
      state: "WAITING_FOR_NOTES",
    });
    await editOrSend(chatId, messageId, notePrompt());
    return;
  }

  if (data === "note:skip") {
    const conv = await getConversation(user.telegram_user_id);
    const task = await createTask({
      telegram_user_id: user.telegram_user_id,
      telegram_chat_id: chatId,
      app_name: conv.app_name || "Unknown",
      country: conv.country || "Unknown",
      country_code: conv.country_code || "XX",
      completed_at: new Date(conv.completed_at || utcNow()),
      reminder_duration: conv.reminder_duration || 60,
      timezone: user.timezone,
    });
    await clearConversation(user.telegram_user_id);
    await editOrSend(
      chatId,
      messageId,
      taskConfirmationMessage(task, user),
      taskConfirmation()
    );
    return;
  }

  if (data.startsWith("task:view:")) {
    const taskId = data.split(":")[2];
    const task = await taskRepository.findById(taskId);
    if (!task || task.telegram_user_id !== user.telegram_user_id) return;
    await editOrSend(
      chatId,
      messageId,
      taskViewMessage(task, user),
      taskActions(taskId)
    );
    return;
  }

  if (data.startsWith("task:edit:")) {
    const taskId = data.split(":")[2];
    const task = await taskRepository.findById(taskId);
    if (!task || task.telegram_user_id !== user.telegram_user_id) return;
    await editOrSend(
      chatId,
      messageId,
      `✏️ <b>Edit Task</b>\n\n📱 ${task.app_name}`,
      editTaskOptions(taskId)
    );
    return;
  }

  if (data.startsWith("task:delete:")) {
    const taskId = data.split(":")[2];
    const task = await taskRepository.findById(taskId);
    if (!task || task.telegram_user_id !== user.telegram_user_id) return;
    await editOrSend(
      chatId,
      messageId,
      `⚠️ <b>Delete this task?</b>\n\nThis action cannot be undone.\n\n📱 ${task.app_name}`,
      deleteConfirm(taskId)
    );
    return;
  }

  if (data.startsWith("delete_confirm:")) {
    const taskId = data.split(":")[1];
    const deleted = await cancelTask(taskId, user.telegram_user_id);
    if (deleted) {
      await editOrSend(chatId, messageId, "✅ Task deleted.", mainMenu());
    }
    return;
  }

  if (data.startsWith("reminder:complete:")) {
    const taskId = data.split(":")[2];
    const task = await completeTask(taskId, user.telegram_user_id);
    if (task) {
      await editOrSend(
        chatId,
        messageId,
        `✅ <b>Task Completed!</b>\n\n📱 ${task.app_name}`,
        mainMenu()
      );
    }
    return;
  }

  if (data.startsWith("reminder:snooze:")) {
    const parts = data.split(":");
    const taskId = parts[2];
    const minutes = parseInt(parts[3], 10);
    const task = await snoozeTask(taskId, user.telegram_user_id, minutes);
    if (task) {
      await editOrSend(
        chatId,
        messageId,
        `⏰ <b>Reminder snoozed for ${minutes} minutes.</b>\n\n📱 ${task.app_name}`,
        mainMenu()
      );
    }
    return;
  }

  if (data.startsWith("reminder:cancel:")) {
    const taskId = data.split(":")[2];
    const deleted = await cancelTask(taskId, user.telegram_user_id);
    if (deleted) {
      await editOrSend(chatId, messageId, "✅ Reminder cancelled.", mainMenu());
    }
    return;
  }

  if (data.startsWith("confirm:")) {
    const action = data.split(":")[1];
    if (action === "cancel") {
      await clearConversation(user.telegram_user_id);
      await editOrSend(chatId, messageId, "❌ Task cancelled.", mainMenu());
    } else if (action === "edit") {
      await editOrSend(
        chatId,
        messageId,
        "What would you like to change?",
        mainMenu()
      );
    }
    return;
  }

  if (data.startsWith("editfield:")) {
    const parts = data.split(":");
    const field = parts[1];
    const taskId = parts[2];
    const conv = await getConversation(user.telegram_user_id);
    await setConversation(user.telegram_user_id, {
      ...conv,
      state: "WAITING_FOR_EDIT_FIELD",
      edit_task_id: taskId,
      edit_field: field,
    });

    const prompts: Record<string, string> = {
      app_name: "📱 Enter new app/website name:",
      country: "🌍 Enter new country name or select from keyboard:",
      completed_at: "⏱️ Enter new completion time (e.g., 18:30, 6:30 PM):",
      reminder_duration: "🔔 Enter new reminder duration (e.g., 30 minutes, 2 hours):",
      timezone: "🌍 Select new timezone:",
      notes: "📝 Enter new notes:",
    };

    const keyboards: Record<string, InlineKeyboard> = {
      country: countrySelector(0),
      timezone: timezoneSelector(),
    };

    await editOrSend(
      chatId,
      messageId,
      prompts[field] || "Enter new value:",
      keyboards[field]
    );
    return;
  }

  if (data === "settings:timezone") {
    await editOrSend(
      chatId,
      messageId,
      "🌍 <b>Select your timezone:</b>",
      timezoneSelector()
    );
    return;
  }

  if (data.startsWith("tz:")) {
    const tz = data.substring(3);
    await userRepository.update(user.telegram_user_id, { timezone: tz });
    await editOrSend(
      chatId,
      messageId,
      `✅ Timezone updated to <code>${tz}</code>`,
      mainMenu()
    );
    return;
  }

  if (data === "settings:time_format") {
    const newFormat = user.time_format === "12h" ? "24h" : "12h";
    await userRepository.update(user.telegram_user_id, { time_format: newFormat });
    await editOrSend(
      chatId,
      messageId,
      `✅ Time format set to <b>${newFormat}</b>`,
      mainMenu()
    );
    return;
  }

  if (data === "settings:notifications") {
    const newSetting = !user.notifications_enabled;
    await userRepository.update(user.telegram_user_id, {
      notifications_enabled: newSetting,
    });
    await editOrSend(
      chatId,
      messageId,
      `✅ Notifications ${newSetting ? "enabled" : "disabled"}.`,
      mainMenu()
    );
    return;
  }

  if (data.startsWith("settings:default_reminder")) {
    await editOrSend(
      chatId,
      messageId,
      "⏰ <b>Default Reminder Duration</b>\n\nEnter default reminder in minutes (e.g., 60):"
    );
    await setConversation(user.telegram_user_id, {
      state: "WAITING_FOR_EDIT_FIELD",
      edit_field: "default_reminder_minutes",
    });
    return;
  }

  if (data === "admin:stats" && isFromAdmin(user.telegram_user_id)) {
    const stats = await getAdminStats();
    await editOrSend(chatId, messageId, adminDashboardMessage(stats), adminPanel());
    return;
  }

  if (data === "admin:users" && isFromAdmin(user.telegram_user_id)) {
    const count = await userRepository.count();
    await editOrSend(
      chatId,
      messageId,
      `👥 <b>Total Users:</b> ${count}`,
      adminPanel()
    );
    return;
  }

  if (data === "admin:tasks" && isFromAdmin(user.telegram_user_id)) {
    const statusCounts = await taskRepository.countByStatus();
    let msg = "📋 <b>Task Statistics:</b>\n\n";
    for (const s of statusCounts) {
      msg += `${s.status}: ${s.count}\n`;
    }
    await editOrSend(chatId, messageId, msg, adminPanel());
    return;
  }

  if (data === "admin:reminders" && isFromAdmin(user.telegram_user_id)) {
    const pending = await taskRepository.totalActiveReminders();
    await editOrSend(
      chatId,
      messageId,
      `🔔 <b>Pending Reminders:</b> ${pending}`,
      adminPanel()
    );
    return;
  }

  if (data === "admin:broadcast" && isFromAdmin(user.telegram_user_id)) {
    await setConversation(user.telegram_user_id, {
      state: "WAITING_FOR_BROADCAST",
    });
    await editOrSend(
      chatId,
      messageId,
      "📢 <b>BROADCAST</b>\n\nEnter the message to broadcast to all users:"
    );
    return;
  }

  if (data === "broadcast:send") {
    const conv = await getConversation(user.telegram_user_id);
    if (!conv.broadcast_message) return;

    const chatIds = await userRepository.getAllChatIds();
    let successful = 0;
    let failed = 0;

    for (const { telegram_chat_id } of chatIds) {
      try {
        await sendMessage(telegram_chat_id, conv.broadcast_message);
        successful++;
      } catch {
        failed++;
      }
    }

    await broadcastRepository.create({
      admin_user_id: user.telegram_user_id,
      message: conv.broadcast_message,
      total_recipients: chatIds.length,
      successful,
      failed,
    });

    await clearConversation(user.telegram_user_id);
    await editOrSend(
      chatId,
      messageId,
      `✅ Broadcast sent!\n\n✅ Successful: ${successful}\n❌ Failed: ${failed}`,
      adminPanel()
    );
    return;
  }

  if (data === "broadcast:cancel") {
    await clearConversation(user.telegram_user_id);
    await editOrSend(chatId, messageId, "❌ Broadcast cancelled.", adminPanel());
    return;
  }
}

export async function handleShowTasks(
  user: User,
  chatId: number,
  page: number,
  messageId?: number
): Promise<void> {
  const { tasks, total } = await getUserTasks(user.telegram_user_id, page);
  const text = tasksListMessage(tasks, user, page, total);
  const totalPages = Math.ceil(total / 5);

  let keyboard: InlineKeyboard = { inline_keyboard: [] };
  for (const task of tasks) {
    keyboard.inline_keyboard.push([
      {
        text: `📱 ${task.app_name}`,
        callback_data: `task:view:${task.id}`,
      },
    ]);
  }

  if (totalPages > 1) {
    const navRow: { text: string; callback_data: string }[] = [];
    if (page > 0) {
      navRow.push({ text: "⬅️", callback_data: `tasks_page:${page - 1}` });
    }
    navRow.push({
      text: `${page + 1}/${totalPages}`,
      callback_data: "noop",
    });
    if (page < totalPages - 1) {
      navRow.push({ text: "➡️", callback_data: `tasks_page:${page + 1}` });
    }
    keyboard.inline_keyboard.push(navRow);
  }
  keyboard.inline_keyboard.push([
    { text: "🚀 Add Task", callback_data: "menu:add" },
  ]);
  keyboard.inline_keyboard.push([
    { text: "⬅️ Back", callback_data: "menu:main" },
  ]);

  if (messageId) {
    await editMessageText(chatId, messageId, text, keyboard);
  } else {
    await sendMessage(chatId, text, keyboard);
  }
}

export async function handleShowReminders(
  user: User,
  chatId: number,
  messageId?: number
): Promise<void> {
  const tasks = await taskRepository.findByUser(user.telegram_user_id, {
    status: "pending",
    limit: 20,
  });
  const text = remindersListMessage(tasks, user);

  const keyboard: InlineKeyboard = { inline_keyboard: [] };
  for (const task of tasks) {
    keyboard.inline_keyboard.push([
      {
        text: `📱 ${task.app_name}`,
        callback_data: `reminder:complete:${task.id}`,
      },
    ]);
  }
  keyboard.inline_keyboard.push([
    { text: "⬅️ Back", callback_data: "menu:main" },
  ]);

  if (messageId) {
    await editMessageText(chatId, messageId, text, keyboard);
  } else {
    await sendMessage(chatId, text, keyboard);
  }
}

export async function handleShowHistory(
  user: User,
  chatId: number,
  page: number,
  messageId?: number
): Promise<void> {
  const { tasks, total } = await getHistoryTasks(user.telegram_user_id, page);
  const text = historyListMessage(tasks, user, page, total);

  const keyboard: InlineKeyboard = { inline_keyboard: [] };
  const totalPages = Math.ceil(total / 5);

  if (totalPages > 1) {
    const navRow: { text: string; callback_data: string }[] = [];
    if (page > 0) {
      navRow.push({ text: "⬅️", callback_data: `history_page:${page - 1}` });
    }
    navRow.push({
      text: `${page + 1}/${totalPages}`,
      callback_data: "noop",
    });
    if (page < totalPages - 1) {
      navRow.push({ text: "➡️", callback_data: `history_page:${page + 1}` });
    }
    keyboard.inline_keyboard.push(navRow);
  }
  keyboard.inline_keyboard.push([
    { text: "⬅️ Back", callback_data: "menu:main" },
  ]);

  if (messageId) {
    await editMessageText(chatId, messageId, text, keyboard);
  } else {
    await sendMessage(chatId, text, keyboard);
  }
}

async function editOrSend(
  chatId: number,
  messageId: number | undefined,
  text: string,
  keyboard?: InlineKeyboard
): Promise<void> {
  if (messageId) {
    try {
      await editMessageText(chatId, messageId, text, keyboard);
      return;
    } catch {
      // Message may not be editable, fall through to send
    }
  }
  await sendMessage(chatId, text, keyboard);
}
