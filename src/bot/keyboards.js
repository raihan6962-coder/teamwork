import { getCountryPage, getTotalCountryPages } from "../data/countries.js";

export function mainMenu() {
  return { inline_keyboard: [
    [{ text: "Add Task", callback_data: "menu:add" }, { text: "My Tasks", callback_data: "menu:tasks" }],
    [{ text: "Active Reminders", callback_data: "menu:reminders" }, { text: "Completed", callback_data: "menu:history" }],
    [{ text: "Statistics", callback_data: "menu:stats" }, { text: "Settings", callback_data: "menu:settings" }],
    [{ text: "Help", callback_data: "menu:help" }],
  ]};
}

export function countrySelector(page) {
  page = page || 0;
  const perPage = 10;
  const pageCountries = getCountryPage(page, perPage);
  const totalPages = getTotalCountryPages(perPage);
  const kb = { inline_keyboard: [] };
  pageCountries.forEach((c) => kb.inline_keyboard.push([{ text: `${c.flag} ${c.name}`, callback_data: `country:${c.code}` }]));
  const nav = [];
  if (page > 0) nav.push({ text: "<", callback_data: `country_page:${page - 1}` });
  nav.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
  if (page < totalPages - 1) nav.push({ text: ">", callback_data: `country_page:${page + 1}` });
  kb.inline_keyboard.push(nav);
  kb.inline_keyboard.push([{ text: "Search Country", callback_data: "country_search" }]);
  kb.inline_keyboard.push([{ text: "Back", callback_data: "menu:add" }]);
  return kb;
}

export function completionTimeOptions() {
  return { inline_keyboard: [
    [{ text: "Just Now", callback_data: "time:0" }],
    [{ text: "30 Minutes Ago", callback_data: "time:30" }],
    [{ text: "1 Hour Ago", callback_data: "time:60" }],
    [{ text: "2 Hours Ago", callback_data: "time:120" }],
    [{ text: "3 Hours Ago", callback_data: "time:180" }],
    [{ text: "6 Hours Ago", callback_data: "time:360" }],
    [{ text: "12 Hours Ago", callback_data: "time:720" }],
    [{ text: "Custom Time", callback_data: "time:custom" }],
    [{ text: "Back", callback_data: "menu:add" }],
  ]};
}

export function reminderOptions() {
  return { inline_keyboard: [
    [{ text: "30 Minutes", callback_data: "remind:30" }],
    [{ text: "1 Hour", callback_data: "remind:60" }],
    [{ text: "2 Hours", callback_data: "remind:120" }],
    [{ text: "3 Hours", callback_data: "remind:180" }],
    [{ text: "6 Hours", callback_data: "remind:360" }],
    [{ text: "12 Hours", callback_data: "remind:720" }],
    [{ text: "Custom Reminder", callback_data: "remind:custom" }],
    [{ text: "Back", callback_data: "menu:add" }],
  ]};
}

export function taskConfirmation() {
  return { inline_keyboard: [
    [{ text: "Edit", callback_data: "confirm:edit" }, { text: "Cancel", callback_data: "confirm:cancel" }],
    [{ text: "My Tasks", callback_data: "menu:tasks" }],
  ]};
}

export function taskActions(taskId) {
  return { inline_keyboard: [
    [{ text: "View", callback_data: `task:view:${taskId}` }, { text: "Edit", callback_data: `task:edit:${taskId}` }],
    [{ text: "Delete", callback_data: `task:delete:${taskId}` }],
    [{ text: "Back", callback_data: "menu:tasks" }],
  ]};
}

export function reminderActions(taskId) {
  return { inline_keyboard: [
    [{ text: "Mark Complete", callback_data: `reminder:complete:${taskId}` }],
    [{ text: "Snooze 15m", callback_data: `reminder:snooze:${taskId}:15` }, { text: "Snooze 30m", callback_data: `reminder:snooze:${taskId}:30` }],
    [{ text: "Snooze 1h", callback_data: `reminder:snooze:${taskId}:60` }, { text: "Snooze 2h", callback_data: `reminder:snooze:${taskId}:120` }],
    [{ text: "Cancel", callback_data: `reminder:cancel:${taskId}` }],
  ]};
}

export function settingsMenu() {
  return { inline_keyboard: [
    [{ text: "Timezone", callback_data: "settings:timezone" }],
    [{ text: "Default Reminder", callback_data: "settings:default_reminder" }],
    [{ text: "Time Format", callback_data: "settings:time_format" }],
    [{ text: "Notifications", callback_data: "settings:notifications" }],
    [{ text: "Help", callback_data: "menu:help" }],
    [{ text: "Back", callback_data: "menu:main" }],
  ]};
}

export function timezoneSelector() {
  const kbs = [
    { label: "Bangladesh (BST)", value: "Asia/Dhaka" },
    { label: "India (IST)", value: "Asia/Kolkata" },
    { label: "UAE (GST)", value: "Asia/Dubai" },
    { label: "Singapore (SGT)", value: "Asia/Singapore" },
    { label: "UK (GMT/BST)", value: "Europe/London" },
    { label: "US Eastern (ET)", value: "America/New_York" },
    { label: "US Pacific (PT)", value: "America/Los_Angeles" },
    { label: "Japan (JST)", value: "Asia/Tokyo" },
    { label: "Australia (AEST)", value: "Australia/Sydney" },
    { label: "Germany (CET)", value: "Europe/Berlin" },
  ];
  const kb = { inline_keyboard: [] };
  kbs.forEach((t) => kb.inline_keyboard.push([{ text: t.label, callback_data: `tz:${t.value}` }]));
  kb.inline_keyboard.push([{ text: "Back", callback_data: "menu:settings" }]);
  return kb;
}

export function adminPanel() {
  return { inline_keyboard: [
    [{ text: "Statistics", callback_data: "admin:stats" }, { text: "Users", callback_data: "admin:users" }],
    [{ text: "Tasks", callback_data: "admin:tasks" }, { text: "Reminder Queue", callback_data: "admin:reminders" }],
    [{ text: "Broadcast", callback_data: "admin:broadcast" }],
    [{ text: "Back", callback_data: "menu:main" }],
  ]};
}

export function editTaskOptions(taskId) {
  return { inline_keyboard: [
    [{ text: "App/Website", callback_data: `editfield:app_name:${taskId}` }],
    [{ text: "Country", callback_data: `editfield:country:${taskId}` }],
    [{ text: "Completion Time", callback_data: `editfield:completed_at:${taskId}` }],
    [{ text: "Reminder Duration", callback_data: `editfield:reminder_duration:${taskId}` }],
    [{ text: "Notes", callback_data: `editfield:notes:${taskId}` }],
    [{ text: "Back", callback_data: `task:view:${taskId}` }],
  ]};
}

export function deleteConfirm(taskId) {
  return { inline_keyboard: [
    [{ text: "Yes, Delete", callback_data: `delete_confirm:${taskId}` }, { text: "Cancel", callback_data: `task:view:${taskId}` }],
  ]};
}

export function noteOptions() {
  return { inline_keyboard: [
    [{ text: "Add Note", callback_data: "note:add" }, { text: "Skip", callback_data: "note:skip" }],
  ]};
}

export function pastReminderOptions() {
  return { inline_keyboard: [
    [{ text: "Remind Me Now", callback_data: "past_remind:now" }],
    [{ text: "Start From Now", callback_data: "past_remind:start_now" }],
    [{ text: "Change Time", callback_data: "past_remind:change" }],
  ]};
}
