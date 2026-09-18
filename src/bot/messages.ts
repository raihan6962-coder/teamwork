import type { Task, User } from "../types.js";
import { formatForDisplay, formatRelativeTime, formatTimeRemaining } from "../lib/time.js";

export function welcomeMessage(): string {
  return `👋 <b>Welcome to Task Reminder!</b>

Track when you complete work on apps and websites and get automatic reminders at the right time.

🚀 Create a task below to get started.`;
}

export function mainMenuMessage(): string {
  return `━━━━━━━━━━━━━━━━
📋 <b>MAIN MENU</b>
━━━━━━━━━━━━━━━━

Choose an option below:`;
}

export function newTaskPrompt(): string {
  return `━━━━━━━━━━━━━━━━
🚀 <b>NEW TASK</b>
━━━━━━━━━━━━━━━━

📱 What app or website did you work on?

<i>Enter the name below:</i>`;
}

export function countryPrompt(): string {
  return `━━━━━━━━━━━━━━━━
🌍 <b>COUNTRY</b>
━━━━━━━━━━━━━━━━

Select the country where this task was performed.

<i>Or type a country name to search:</i>`;
}

export function completionTimePrompt(): string {
  return `━━━━━━━━━━━━━━━━
⏱️ <b>COMPLETION TIME</b>
━━━━━━━━━━━━━━━━

When was this task completed?`;
}

export function reminderPrompt(): string {
  return `━━━━━━━━━━━━━━━━
🔔 <b>REMINDER</b>
━━━━━━━━━━━━━━━━

How long after completion should I remind you?`;
}

export function customTimePrompt(): string {
  return `━━━━━━━━━━━━━━━━
📅 <b>CUSTOM TIME</b>
━━━━━━━━━━━━━━━━

Enter the time when the task was completed.

<i>Formats:</i>
<code>18:30</code>
<code>6:30 PM</code>
<code>2026-09-19 18:30</code>

<i>Or type "back" to go back:</i>`;
}

export function customReminderPrompt(): string {
  return `━━━━━━━━━━━━━━━━
📅 <b>CUSTOM REMINDER</b>
━━━━━━━━━━━━━━━━

When should I remind you?

<i>Formats:</i>
<code>30 minutes</code>
<code>2 hours</code>
<code>1 day</code>

<i>Or type "back" to go back:</i>`;
}

export function notePrompt(): string {
  return `━━━━━━━━━━━━━━━━
📝 <b>ADD NOTE</b>
━━━━━━━━━━━━━━━━

Add an optional note for this task.

<i>Type your note below:</i>`;
}

export function taskConfirmationMessage(
  task: Partial<Task>,
  user: User
): string {
  const completedStr = task.completed_at
    ? formatRelativeTime(task.completed_at, user.timezone)
    : "N/A";
  const reminderStr = task.reminder_duration
    ? `${Math.floor(task.reminder_duration / 60)}h ${task.reminder_duration % 60}m`
    : "N/A";
  const reminderAtStr =
    task.reminder_at && user
      ? formatForDisplay(task.reminder_at, user.timezone, user.time_format)
      : "N/A";

  let msg = `━━━━━━━━━━━━━━━━
✅ <b>TASK CREATED</b>
━━━━━━━━━━━━━━━━

📱 <b>App:</b> ${task.app_name || "N/A"}

🌍 <b>Country:</b> ${task.country || "N/A"}

⏱️ <b>Completed:</b> ${completedStr}

🔔 <b>Reminder:</b> ${reminderStr} after completion

🕐 <b>Reminder Time:</b> ${reminderAtStr}`;

  if (task.notes) {
    msg += `\n\n📝 <b>Note:</b> ${task.notes}`;
  }

  return msg;
}

export function taskViewMessage(task: Task, user: User): string {
  const completedStr = formatRelativeTime(task.completed_at, user.timezone);
  const reminderStr = formatTimeRemaining(task.reminder_at, user.timezone);
  const createdAtStr = formatForDisplay(
    task.created_at,
    user.timezone,
    user.time_format
  );

  let msg = `━━━━━━━━━━━━━━━━
📋 <b>TASK DETAILS</b>
━━━━━━━━━━━━━━━━

📱 <b>App:</b> ${task.app_name}
🌍 <b>Country:</b> ${task.country}
⏱️ <b>Completed:</b> ${completedStr}
🔔 <b>Status:</b> ${task.status}
🕐 <b>Reminder:</b> ${reminderStr}
📅 <b>Created:</b> ${createdAtStr}
🆔 <b>ID:</b> <code>${task.id.slice(0, 8)}</code>`;

  if (task.notes) {
    msg += `\n\n📝 <b>Note:</b> ${task.notes}`;
  }

  return msg;
}

export function tasksListMessage(
  tasks: Task[],
  user: User,
  page: number,
  total: number
): string {
  const perPage = 5;
  const totalPages = Math.ceil(total / perPage);

  let msg = `━━━━━━━━━━━━━━━━
📋 <b>ACTIVE TASKS</b>
━━━━━━━━━━━━━━━━

`;

  if (tasks.length === 0) {
    msg += `<i>No active tasks.</i>\n\nCreate one with 🚀 Add Task!`;
    return msg;
  }

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const idx = page * perPage + i + 1;
    const completedStr = formatRelativeTime(task.completed_at, user.timezone);
    const reminderStr = formatTimeRemaining(task.reminder_at, user.timezone);
    const emoji =
      task.status === "pending"
        ? "🟡"
        : task.status === "reminded"
          ? "🔵"
          : "🟢";

    msg += `${emoji} <b>${idx}.</b> ${task.app_name}\n`;
    msg += `   ${task.country}\n`;
    msg += `   ⏱ Completed: ${completedStr}\n`;
    msg += `   🔔 ${reminderStr}\n\n`;
  }

  msg += `📄 Page ${page + 1} of ${totalPages}`;
  return msg;
}

export function remindersListMessage(
  tasks: Task[],
  user: User
): string {
  let msg = `━━━━━━━━━━━━━━━━
⏰ <b>ACTIVE REMINDERS</b>
━━━━━━━━━━━━━━━━

`;

  if (tasks.length === 0) {
    msg += `<i>No active reminders.</i>`;
    return msg;
  }

  for (const task of tasks) {
    const reminderStr = formatTimeRemaining(task.reminder_at, user.timezone);
    msg += `📱 <b>${task.app_name}</b>\n`;
    msg += `   ${task.country} • ${reminderStr}\n\n`;
  }

  return msg;
}

export function reminderNotification(task: Task, user: User): string {
  const completedStr = formatRelativeTime(task.completed_at, user.timezone);

  let msg = `🔔 <b>REMINDER</b>

Your scheduled follow-up is due.

📱 <b>App/Website:</b> ${task.app_name}

🌍 <b>Country:</b> ${task.country}

⏱️ <b>Completed:</b> ${completedStr}`;

  if (task.notes) {
    msg += `\n\n📝 <b>Note:</b> ${task.notes}`;
  }

  return msg;
}

export function historyListMessage(
  tasks: Task[],
  user: User,
  page: number,
  total: number
): string {
  const perPage = 5;
  const totalPages = Math.ceil(total / perPage);

  let msg = `━━━━━━━━━━━━━━━━
📜 <b>TASK HISTORY</b>
━━━━━━━━━━━━━━━━

`;

  if (tasks.length === 0) {
    msg += `<i>No completed or cancelled tasks.</i>`;
    return msg;
  }

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const idx = page * perPage + i + 1;
    const statusEmoji =
      task.status === "completed" ? "✅" : "❌";

    msg += `${statusEmoji} <b>${idx}.</b> ${task.app_name}\n`;
    msg += `   ${task.country} • ${task.status}\n\n`;
  }

  msg += `📄 Page ${page + 1} of ${totalPages}`;
  return msg;
}

export function statsMessage(stats: {
  totalTasks: number;
  completed: number;
  pending: number;
  cancelled: number;
  remindersSent: number;
  mostUsedApp: string | null;
  mostUsedCountry: string | null;
}): string {
  return `━━━━━━━━━━━━━━━━
📊 <b>YOUR ACTIVITY</b>
━━━━━━━━━━━━━━━━

📋 <b>Total Tasks:</b> ${stats.totalTasks}
✅ <b>Completed:</b> ${stats.completed}
🟡 <b>Pending:</b> ${stats.pending}
❌ <b>Cancelled:</b> ${stats.cancelled}
📨 <b>Reminders Sent:</b> ${stats.remindersSent}

📱 <b>Most Used App:</b> ${stats.mostUsedApp || "N/A"}

🌍 <b>Most Used Country:</b> ${stats.mostUsedCountry || "N/A"}`;
}

export function settingsMessage(user: User): string {
  return `━━━━━━━━━━━━━━━━
⚙️ <b>SETTINGS</b>
━━━━━━━━━━━━━━━━

🌍 <b>Timezone:</b> ${user.timezone}
⏰ <b>Default Reminder:</b> ${user.default_reminder_minutes} minutes
🕐 <b>Time Format:</b> ${user.time_format}
🔔 <b>Notifications:</b> ${user.notifications_enabled ? "Enabled" : "Disabled"}`;
}

export function helpMessage(): string {
  return `━━━━━━━━━━━━━━━━
❓ <b>HELP</b>
━━━━━━━━━━━━━━━━

<b>How to use Task Reminder:</b>

1️⃣ Tap 🚀 <b>Add Task</b>
2️⃣ Enter the app/website name
3️⃣ Select the country
4️⃣ Choose when the task was completed
5️⃣ Set a reminder time
6️⃣ Get notified automatically!

<b>Commands:</b>
/start - Start the bot
/menu - Show main menu
/add - Add a new task
/tasks - View active tasks
/reminders - View active reminders
/history - View completed tasks
/stats - View statistics
/settings - Open settings
/help - Show this help
/cancel - Cancel current action

<b>Need help?</b> Contact the bot admin.`;
}

export function adminDashboardMessage(stats: {
  totalUsers: number;
  totalTasks: number;
  pendingReminders: number;
  completedTasks: number;
  remindersSent: number;
}): string {
  return `━━━━━━━━━━━━━━━━
👑 <b>ADMIN PANEL</b>
━━━━━━━━━━━━━━━━

👥 <b>Total Users:</b> ${stats.totalUsers}
📋 <b>Total Tasks:</b> ${stats.totalTasks}
⏰ <b>Pending Reminders:</b> ${stats.pendingReminders}
✅ <b>Completed Tasks:</b> ${stats.completedTasks}
📨 <b>Reminders Sent:</b> ${stats.remindersSent}`;
}

export function broadcastConfirmMessage(
  message: string,
  recipientCount: number
): string {
  return `━━━━━━━━━━━━━━━━
📢 <b>BROADCAST</b>
━━━━━━━━━━━━━━━━

👥 <b>Recipients:</b> ${recipientCount} users

📝 <b>Message:</b>
${message}`;
}

export function errorMessage(): string {
  return `❌ Something went wrong.

Please try again.`;
}

export function unauthorizedMessage(): string {
  return `❌ <b>Unauthorized.</b>

You don't have permission to perform this action.`;
}

export function pastReminderMessage(): string {
  return `⚠️ <b>This reminder time has already passed.</b>

Would you like to:`;
}
