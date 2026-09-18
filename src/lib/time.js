export function utcNow() {
  return new Date();
}

export function toUTC(date) {
  return date.toISOString();
}

export function addToDate(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

export function formatForDisplay(isoString, timezone, timeFormat) {
  try {
    const date = new Date(isoString);
    const opts = { timeZone: timezone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: timeFormat === "12h" };
    return new Intl.DateTimeFormat("en-US", opts).format(date);
  } catch {
    return new Date(isoString).toLocaleString();
  }
}

export function formatRelativeTime(isoString) {
  const now = utcNow();
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    const r = diffMinutes % 60;
    return r > 0 ? `${diffHours}h ${r}m ago` : `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function formatTimeRemaining(isoString) {
  const now = utcNow();
  const then = new Date(isoString);
  const diffMs = then.getTime() - now.getTime();
  if (diffMs <= 0) return "due now";
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 60) return `${diffMinutes}m remaining`;
  const diffHours = Math.floor(diffMinutes / 60);
  const r = diffMinutes % 60;
  if (diffHours < 24) return r > 0 ? `${diffHours}h ${r}m remaining` : `${diffHours}h remaining`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d remaining`;
}

export function parseCustomTime(input, timezone) {
  const trimmed = input.trim();
  const now = utcNow();
  const timeOnlyMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (timeOnlyMatch) {
    let hours = parseInt(timeOnlyMatch[1], 10);
    const minutes = parseInt(timeOnlyMatch[2], 10);
    const ampm = timeOnlyMatch[3];
    if (ampm) {
      if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
    }
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return { date: now, error: "Invalid time." };
    const today = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    today.setHours(hours, minutes, 0, 0);
    const offsetMs = now.getTime() - today.getTime();
    const result = new Date(now.getTime() - offsetMs);
    return { date: result };
  }
  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?$/i;
  const dateMatch = trimmed.match(dateRegex);
  if (dateMatch) {
    const [, y, mo, d, h, mi, ap] = dateMatch;
    let hours = parseInt(h, 10);
    const minutes = parseInt(mi, 10);
    if (ap) {
      if (ap.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (ap.toUpperCase() === "AM" && hours === 12) hours = 0;
    }
    const dateStr = `${y}-${mo}-${d}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
    return { date: new Date(dateStr) };
  }
  return { date: now, error: "I could not understand that time.\n\nFormats:\n<code>18:30</code>\n<code>6:30 PM</code>\n<code>2026-09-19 18:30</code>" };
}

export function parseCustomReminder(input) {
  const trimmed = input.trim().toLowerCase();
  const patterns = [
    [/^(\d+)\s*minutes?$/, 1], [/^(\d+)\s*mins?$/, 1],
    [/^(\d+)\s*hours?$/, 60], [/^(\d+)\s*hrs?$/, 60],
    [/^(\d+)\s*days?$/, 1440], [/^(\d+)\s*d$/, 1440],
    [/^(\d+)\s*h$/, 60], [/^(\d+)\s*m$/, 1],
  ];
  for (const [regex, multiplier] of patterns) {
    const match = trimmed.match(regex);
    if (match) {
      const value = parseInt(match[1], 10);
      if (value > 0 && value <= 10080) return { minutes: value * multiplier };
    }
  }
  return { minutes: 0, error: "I could not understand that duration.\n\nFormats:\n<code>30 minutes</code>\n<code>2 hours</code>\n<code>1 day</code>" };
}

export function isTimeInPast(date) {
  return date.getTime() < utcNow().getTime();
}
