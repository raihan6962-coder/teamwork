import { formatForDisplay, formatRelativeTime, formatTimeRemaining } from "../lib/time.js";

function sep() { return "━━━━━━━━━━━━━━━━"; }

export function welcomeMessage() {
  return `${sep()}\nWelcome to Task Reminder!\n${sep()}\n\nTrack when you complete work on apps and websites and get automatic reminders.\n\nCreate a task below to get started.`;
}

export function mainMenuMessage() {
  return `${sep()}\nMAIN MENU\n${sep()}\n\nChoose an option below:`;
}

export function newTaskPrompt() {
  return `${sep()}\nNEW TASK\n${sep()}\n\nWhat app or website did you work on?\n\nEnter the name below:`;
}

export function countryPrompt() {
  return `${sep()}\nCOUNTRY\n${sep()}\n\nSelect the country where this task was performed.\n\nOr type a country name to search:`;
}

export function completionTimePrompt() {
  return `${sep()}\nCOMPLETION TIME\n${sep()}\n\nWhen was this task completed?`;
}

export function reminderPrompt() {
  return `${sep()}\nREMINDER\n${sep()}\n\nHow long after completion should I remind you?`;
}

export function customTimePrompt() {
  return `${sep()}\nCUSTOM TIME\n${sep()}\n\nEnter the time when the task was completed.\n\nFormats:\n<code>18:30</code>\n<code>6:30 PM</code>\n<code>2026-09-19 18:30</code>\n\nOr type "back" to go back:`;
}

export function customReminderPrompt() {
  return `${sep()}\nCUSTOM REMINDER\n${sep()}\n\nWhen should I remind you?\n\nFormats:\n<code>30 minutes</code>\n<code>2 hours</code>\n<code>1 day</code>\n\nOr type "back" to go back:`;
}

export function notePrompt() {
  return `${sep()}\nADD NOTE\n${sep()}\n\nAdd an optional note for this task.\n\nType your note below:`;
}

export function taskConfirmationMessage(task, user) {
  const completedStr = task.completed_at ? formatRelativeTime(task.completed_at) : "N/A";
  const reminderStr = task.reminder_duration ? `${Math.floor(task.reminder_duration / 60)}h ${task.reminder_duration % 60}m` : "N/A";
  const reminderAtStr = task.reminder_at ? formatForDisplay(task.reminder_at, user.timezone, user.time_format) : "N/A";
  let msg = `${sep()}\nTASK CREATED\n${sep()}\n\nApp: ${task.app_name || "N/A"}\n\nCountry: ${task.country || "N/A"}\n\nCompleted: ${completedStr}\n\nReminder: ${reminderStr} after completion\n\nReminder Time: ${reminderAtStr}`;
  if (task.notes) msg += `\n\nNote: ${task.notes}`;
  return msg;
}

export function taskViewMessage(task, user) {
  return `${sep()}\nTASK DETAILS\n${sep()}\n\nApp: ${task.app_name}\nCountry: ${task.country}\nCompleted: ${formatRelativeTime(task.completed_at)}\nStatus: ${task.status}\nReminder: ${formatTimeRemaining(task.reminder_at)}\nCreated: ${formatForDisplay(task.created_at, user.timezone, user.time_format)}\nID: ${task.id.slice(0, 8)}` + (task.notes ? `\n\nNote: ${task.notes}` : "");
}

export function tasksListMessage(tasks, user, page, total) {
  const perPage = 5;
  const totalPages = Math.ceil(total / perPage);
  let msg = `${sep()}\nACTIVE TASKS\n${sep()}\n\n`;
  if (!tasks.length) return msg + "No active tasks.\n\nCreate one with Add Task!";
  tasks.forEach((task, i) => {
    const idx = page * perPage + i + 1;
    msg += `${idx}. ${task.app_name}\n   ${task.country}\n   Completed: ${formatRelativeTime(task.completed_at)}\n   ${formatTimeRemaining(task.reminder_at)}\n\n`;
  });
  msg += `Page ${page + 1} of ${totalPages}`;
  return msg;
}

export function remindersListMessage(tasks, user) {
  let msg = `${sep()}\nACTIVE REMINDERS\n${sep()}\n\n`;
  if (!tasks.length) return msg + "No active reminders.";
  tasks.forEach((task) => {
    msg += `${task.app_name}\n  ${task.country} - ${formatTimeRemaining(task.reminder_at)}\n\n`;
  });
  return msg;
}

export function reminderNotification(task, user) {
  return `${sep()}\nREMINDER\n${sep()}\n\nYour scheduled follow-up is due.\n\nApp/Website: ${task.app_name}\n\nCountry: ${task.country}\n\nCompleted: ${formatRelativeTime(task.completed_at)}` + (task.notes ? `\n\nNote: ${task.notes}` : "");
}

export function historyListMessage(tasks, user, page, total) {
  const perPage = 5;
  const totalPages = Math.ceil(total / perPage);
  let msg = `${sep()}\nTASK HISTORY\n${sep()}\n\n`;
  if (!tasks.length) return msg + "No completed or cancelled tasks.";
  tasks.forEach((task, i) => {
    const idx = page * perPage + i + 1;
    msg += `${task.status === "completed" ? "V" : "X"} ${idx}. ${task.app_name}\n   ${task.country} - ${task.status}\n\n`;
  });
  msg += `Page ${page + 1} of ${totalPages}`;
  return msg;
}

export function statsMessage(stats) {
  return `${sep()}\nYOUR ACTIVITY\n${sep()}\n\nTotal Tasks: ${stats.totalTasks}\nCompleted: ${stats.completed}\nPending: ${stats.pending}\nCancelled: ${stats.cancelled}\nReminders Sent: ${stats.remindersSent}\n\nMost Used App: ${stats.mostUsedApp || "N/A"}\n\nMost Used Country: ${stats.mostUsedCountry || "N/A"}`;
}

export function settingsMessage(user) {
  return `${sep()}\nSETTINGS\n${sep()}\n\nTimezone: ${user.timezone}\nDefault Reminder: ${user.default_reminder_minutes} minutes\nTime Format: ${user.time_format}\nNotifications: ${user.notifications_enabled ? "Enabled" : "Disabled"}`;
}

export function helpMessage() {
  return `${sep()}\nHELP\n${sep()}\n\nHow to use Task Reminder:\n\n1. Tap Add Task\n2. Enter the app/website name\n3. Select the country\n4. Choose when the task was completed\n5. Set a reminder time\n6. Get notified automatically!\n\nCommands:\n/start - Start the bot\n/menu - Show main menu\n/add - Add a new task\n/tasks - View active tasks\n/reminders - View active reminders\n/history - View completed tasks\n/stats - View statistics\n/settings - Open settings\n/help - Show this help\n/cancel - Cancel current action`;
}

export function adminDashboardMessage(stats) {
  return `${sep()}\nADMIN PANEL\n${sep()}\n\nTotal Users: ${stats.totalUsers}\nTotal Tasks: ${stats.totalTasks}\nPending Reminders: ${stats.pendingReminders}\nCompleted Tasks: ${stats.completedTasks}\nReminders Sent: ${stats.remindersSent}`;
}

export function broadcastConfirmMessage(message, recipientCount) {
  return `${sep()}\nBROADCAST\n${sep()}\n\nRecipients: ${recipientCount} users\n\nMessage:\n${message}`;
}

export function unauthorizedMessage() {
  return "Unauthorized. You don't have permission.";
}

export function pastReminderMessage() {
  return "This reminder time has already passed.\n\nWould you like to:";
}
