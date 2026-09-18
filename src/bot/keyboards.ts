import type { InlineKeyboard } from "../types.js";
import { getCountryPage, getTotalCountryPages } from "../data/countries.js";

export function mainMenu(): InlineKeyboard {
  return {
    inline_keyboard: [
      [
        { text: "🚀 Add Task", callback_data: "menu:add" },
        { text: "📋 My Tasks", callback_data: "menu:tasks" },
      ],
      [
        { text: "⏰ Active Reminders", callback_data: "menu:reminders" },
        { text: "✅ Completed", callback_data: "menu:history" },
      ],
      [
        { text: "📊 Statistics", callback_data: "menu:stats" },
        { text: "⚙️ Settings", callback_data: "menu:settings" },
      ],
      [{ text: "❓ Help", callback_data: "menu:help" }],
    ],
  };
}

export function backButton(callbackData: string): InlineKeyboard {
  return { inline_keyboard: [[{ text: "⬅️ Back", callback_data: callbackData }]] };
}

export function countrySelector(page: number = 0): InlineKeyboard {
  const perPage = 10;
  const pageCountries = getCountryPage(page, perPage);
  const totalPages = getTotalCountryPages(perPage);
  const keyboard: InlineKeyboard = { inline_keyboard: [] };

  for (const c of pageCountries) {
    keyboard.inline_keyboard.push([
      { text: `${c.flag} ${c.name}`, callback_data: `country:${c.code}` },
    ]);
  }

  const navRow: { text: string; callback_data: string }[] = [];
  if (page > 0) {
    navRow.push({ text: "⬅️", callback_data: `country_page:${page - 1}` });
  }
  navRow.push({
    text: `${page + 1}/${totalPages}`,
    callback_data: "noop",
  });
  if (page < totalPages - 1) {
    navRow.push({ text: "➡️", callback_data: `country_page:${page + 1}` });
  }
  keyboard.inline_keyboard.push(navRow);
  keyboard.inline_keyboard.push([
    { text: "🔎 Search Country", callback_data: "country_search" },
  ]);
  keyboard.inline_keyboard.push([
    { text: "⬅️ Back", callback_data: "menu:add" },
  ]);

  return keyboard;
}

export function completionTimeOptions(): InlineKeyboard {
  return {
    inline_keyboard: [
      [{ text: "🔵 Just Now", callback_data: "time:0" }],
      [{ text: "🕐 30 Minutes Ago", callback_data: "time:30" }],
      [{ text: "🕑 1 Hour Ago", callback_data: "time:60" }],
      [{ text: "🕒 2 Hours Ago", callback_data: "time:120" }],
      [{ text: "🕓 3 Hours Ago", callback_data: "time:180" }],
      [{ text: "🕕 6 Hours Ago", callback_data: "time:360" }],
      [{ text: "🕛 12 Hours Ago", callback_data: "time:720" }],
      [{ text: "📅 Custom Time", callback_data: "time:custom" }],
      [{ text: "⬅️ Back", callback_data: "menu:add" }],
    ],
  };
}

export function reminderOptions(): InlineKeyboard {
  return {
    inline_keyboard: [
      [{ text: "⏰ 30 Minutes", callback_data: "remind:30" }],
      [{ text: "⏰ 1 Hour", callback_data: "remind:60" }],
      [{ text: "⏰ 2 Hours", callback_data: "remind:120" }],
      [{ text: "⏰ 3 Hours", callback_data: "remind:180" }],
      [{ text: "⏰ 6 Hours", callback_data: "remind:360" }],
      [{ text: "⏰ 12 Hours", callback_data: "remind:720" }],
      [{ text: "📅 Custom Reminder", callback_data: "remind:custom" }],
      [{ text: "⬅️ Back", callback_data: "menu:add" }],
    ],
  };
}

export function taskConfirmation(): InlineKeyboard {
  return {
    inline_keyboard: [
      [
        { text: "✏️ Edit", callback_data: "confirm:edit" },
        { text: "❌ Cancel", callback_data: "confirm:cancel" },
      ],
      [{ text: "📋 My Tasks", callback_data: "menu:tasks" }],
    ],
  };
}

export function taskActions(taskId: string): InlineKeyboard {
  return {
    inline_keyboard: [
      [
        { text: "👁 View", callback_data: `task:view:${taskId}` },
        { text: "✏️ Edit", callback_data: `task:edit:${taskId}` },
      ],
      [{ text: "🗑 Delete", callback_data: `task:delete:${taskId}` }],
      [{ text: "⬅️ Back", callback_data: "menu:tasks" }],
    ],
  };
}

export function reminderActions(taskId: string): InlineKeyboard {
  return {
    inline_keyboard: [
      [
        { text: "✅ Mark Complete", callback_data: `reminder:complete:${taskId}` },
      ],
      [
        { text: "⏰ Snooze 15m", callback_data: `reminder:snooze:${taskId}:15` },
        { text: "⏰ Snooze 30m", callback_data: `reminder:snooze:${taskId}:30` },
      ],
      [
        { text: "⏰ Snooze 1h", callback_data: `reminder:snooze:${taskId}:60` },
        { text: "⏰ Snooze 2h", callback_data: `reminder:snooze:${taskId}:120` },
      ],
      [
        { text: "❌ Cancel", callback_data: `reminder:cancel:${taskId}` },
      ],
    ],
  };
}

export function settingsMenu(): InlineKeyboard {
  return {
    inline_keyboard: [
      [{ text: "🌍 Timezone", callback_data: "settings:timezone" }],
      [{ text: "⏰ Default Reminder", callback_data: "settings:default_reminder" }],
      [{ text: "🕐 Time Format", callback_data: "settings:time_format" }],
      [{ text: "🔔 Notifications", callback_data: "settings:notifications" }],
      [{ text: "❓ Help", callback_data: "menu:help" }],
      [{ text: "⬅️ Back", callback_data: "menu:main" }],
    ],
  };
}

export function timezoneSelector(): InlineKeyboard {
  const keyboard: InlineKeyboard = { inline_keyboard: [] };
  const tzOptions = [
    { label: "🇧🇩 Bangladesh (BST)", value: "Asia/Dhaka" },
    { label: "🇮🇳 India (IST)", value: "Asia/Kolkata" },
    { label: "🇦🇪 UAE (GST)", value: "Asia/Dubai" },
    { label: "🇸🇬 Singapore (SGT)", value: "Asia/Singapore" },
    { label: "🇬🇧 UK (GMT/BST)", value: "Europe/London" },
    { label: "🇺🇸 US Eastern (ET)", value: "America/New_York" },
    { label: "🇺🇸 US Central (CT)", value: "America/Chicago" },
    { label: "🇺🇸 US Mountain (MT)", value: "America/Denver" },
    { label: "🇺🇸 US Pacific (PT)", value: "America/Los_Angeles" },
    { label: "🇺🇸 US Alaska (AKT)", value: "America/Anchorage" },
    { label: "🇺🇸 US Hawaii (HT)", value: "Pacific/Honolulu" },
    { label: "🇯🇵 Japan (JST)", value: "Asia/Tokyo" },
    { label: "🇨🇳 China (CST)", value: "Asia/Shanghai" },
    { label: "🇰🇷 South Korea (KST)", value: "Asia/Seoul" },
    { label: "🇦🇺 Australia Eastern (AEST)", value: "Australia/Sydney" },
    { label: "🇳🇿 New Zealand (NZST)", value: "Pacific/Auckland" },
    { label: "🇧🇷 Brazil (BRT)", value: "America/Sao_Paulo" },
    { label: "🇩🇪 Germany (CET)", value: "Europe/Berlin" },
    { label: "🇫🇷 France (CET)", value: "Europe/Paris" },
    { label: "🇷🇺 Russia (MSK)", value: "Europe/Moscow" },
  ];

  for (const tz of tzOptions) {
    keyboard.inline_keyboard.push([
      { text: tz.label, callback_data: `tz:${tz.value}` },
    ]);
  }
  keyboard.inline_keyboard.push([
    { text: "⬅️ Back", callback_data: "menu:settings" },
  ]);
  return keyboard;
}

export function adminPanel(): InlineKeyboard {
  return {
    inline_keyboard: [
      [
        { text: "📊 Statistics", callback_data: "admin:stats" },
        { text: "👥 Users", callback_data: "admin:users" },
      ],
      [
        { text: "📋 Tasks", callback_data: "admin:tasks" },
        { text: "🔔 Reminder Queue", callback_data: "admin:reminders" },
      ],
      [{ text: "📢 Broadcast", callback_data: "admin:broadcast" }],
      [{ text: "⚙️ Bot Settings", callback_data: "admin:settings" }],
      [{ text: "⬅️ Back", callback_data: "menu:main" }],
    ],
  };
}

export function editTaskOptions(taskId: string): InlineKeyboard {
  return {
    inline_keyboard: [
      [{ text: "📱 App/Website", callback_data: `editfield:app_name:${taskId}` }],
      [{ text: "🌍 Country", callback_data: `editfield:country:${taskId}` }],
      [{ text: "⏱️ Completion Time", callback_data: `editfield:completed_at:${taskId}` }],
      [{ text: "🔔 Reminder Duration", callback_data: `editfield:reminder_duration:${taskId}` }],
      [{ text: "🌍 Timezone", callback_data: `editfield:timezone:${taskId}` }],
      [{ text: "📝 Notes", callback_data: `editfield:notes:${taskId}` }],
      [{ text: "⬅️ Back", callback_data: `task:view:${taskId}` }],
    ],
  };
}

export function deleteConfirm(taskId: string): InlineKeyboard {
  return {
    inline_keyboard: [
      [
        { text: "Yes, Delete", callback_data: `delete_confirm:${taskId}` },
        { text: "Cancel", callback_data: `task:view:${taskId}` },
      ],
    ],
  };
}

export function noteOptions(): InlineKeyboard {
  return {
    inline_keyboard: [
      [
        { text: "➕ Add Note", callback_data: "note:add" },
        { text: "⏭️ Skip", callback_data: "note:skip" },
      ],
    ],
  };
}

export function pastReminderOptions(): InlineKeyboard {
  return {
    inline_keyboard: [
      [{ text: "🔔 Remind Me Now", callback_data: "past_remind:now" }],
      [{ text: "⏰ Start From Now", callback_data: "past_remind:start_now" }],
      [{ text: "✏️ Change Time", callback_data: "past_remind:change" }],
    ],
  };
}

export function pagination(
  currentPage: number,
  totalPages: number,
  prefix: string
): InlineKeyboard {
  const navRow: { text: string; callback_data: string }[] = [];
  if (currentPage > 0) {
    navRow.push({ text: "⬅️", callback_data: `${prefix}:page:${currentPage - 1}` });
  }
  navRow.push({
    text: `${currentPage + 1}/${totalPages}`,
    callback_data: "noop",
  });
  if (currentPage < totalPages - 1) {
    navRow.push({ text: "➡️", callback_data: `${prefix}:page:${currentPage + 1}` });
  }
  return { inline_keyboard: [navRow] };
}
