export interface User {
  id: string;
  telegram_user_id: number;
  telegram_chat_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  timezone: string;
  default_reminder_minutes: number;
  time_format: "12h" | "24h";
  notifications_enabled: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  telegram_user_id: number;
  telegram_chat_id: number;
  app_name: string;
  country: string;
  country_code: string;
  completed_at: string;
  reminder_at: string;
  reminder_duration: number;
  status: "pending" | "reminded" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  timezone: string;
  notes: string | null;
  reminder_sent: boolean;
  deleted_at: string | null;
}

export interface Reminder {
  id: string;
  task_id: string;
  telegram_user_id: number;
  telegram_chat_id: number;
  reminder_at: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface BroadcastLog {
  id: string;
  admin_user_id: number;
  message: string;
  total_recipients: number;
  successful: number;
  failed: number;
  created_at: string;
}

export interface ProcessedUpdate {
  update_id: number;
  processed_at: string;
}

export type ConversationState =
  | "IDLE"
  | "WAITING_FOR_APP"
  | "WAITING_FOR_COUNTRY"
  | "WAITING_FOR_COMPLETION_TIME"
  | "WAITING_FOR_CUSTOM_TIME"
  | "WAITING_FOR_REMINDER"
  | "WAITING_FOR_CUSTOM_REMINDER"
  | "WAITING_FOR_NOTES"
  | "WAITING_FOR_EDIT_FIELD"
  | "WAITING_FOR_BROADCAST"
  | "WAITING_FOR_TIMEZONE";

export interface ConversationData {
  state: ConversationState;
  app_name?: string;
  country?: string;
  country_code?: string;
  completed_at?: string;
  reminder_duration?: number;
  reminder_at?: string;
  notes?: string;
  edit_task_id?: string;
  edit_field?: string;
  page?: number;
  country_page?: number;
  broadcast_message?: string;
  timezone?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: CallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  entities?: TelegramEntity[];
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
}

export interface TelegramEntity {
  type: string;
  offset: number;
  length: number;
}

export interface CallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface InlineKeyboard {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface Country {
  name: string;
  code: string;
  flag: string;
  timezone: string;
}
