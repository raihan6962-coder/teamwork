import { CONFIG } from "../config.js";
import { logger } from "./logger.js";
import type {
  InlineKeyboard,
  TelegramUpdate,
  TelegramMessage,
} from "../types.js";

const TELEGRAM_API = "https://api.telegram.org";

async function apiRequest<T>(
  method: string,
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${TELEGRAM_API}/bot${CONFIG.TELEGRAM_BOT_TOKEN}/${method}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    const data = (await response.json()) as {
      ok: boolean;
      result: T;
      description?: string;
      error_code?: number;
    };
    if (!data.ok) {
      logger.error(`Telegram API error: ${method}`, undefined, {
        method,
        description: data.description,
        error_code: data.error_code,
      });
      throw new Error(
        `Telegram API error: ${data.description || "Unknown error"}`
      );
    }
    return data.result;
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      logger.error(`Telegram API timeout: ${method}`, undefined, { method });
    }
    throw error;
  }
}

export async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup?: InlineKeyboard,
  parseMode?: "HTML" | "Markdown"
): Promise<TelegramMessage> {
  return apiRequest<TelegramMessage>("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: parseMode || "HTML",
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  replyMarkup?: InlineKeyboard,
  parseMode?: "HTML" | "Markdown"
): Promise<TelegramMessage> {
  return apiRequest<TelegramMessage>("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: parseMode || "HTML",
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function answerCallbackQuery(
  callbackId: string,
  text?: string,
  showAlert?: boolean
): Promise<boolean> {
  return apiRequest<boolean>("answerCallbackQuery", {
    callback_query_id: callbackId,
    text,
    show_alert: showAlert || false,
  });
}

export async function deleteMessage(
  chatId: number,
  messageId: number
): Promise<boolean> {
  try {
    return await apiRequest<boolean>("deleteMessage", {
      chat_id: chatId,
      message_id: messageId,
    });
  } catch {
    return false;
  }
}

export async function setWebhook(url: string, secret: string): Promise<boolean> {
  return apiRequest<boolean>("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
  });
}

export async function getWebhookInfo(): Promise<{
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
}> {
  return apiRequest("getWebhookInfo");
}

export async function getMe(): Promise<{
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
}> {
  return apiRequest("getMe");
}

export function validateWebhookSecret(
  update: TelegramUpdate,
  secret: string
): boolean {
  if ("message" in update && update.message) {
    return true;
  }
  if ("callback_query" in update && update.callback_query) {
    return true;
  }
  return true;
}

export function parseWebhookBody(body: string | Buffer): TelegramUpdate | null {
  try {
    return JSON.parse(body.toString()) as TelegramUpdate;
  } catch {
    return null;
  }
}

export function isFromAdmin(telegramUserId: number): boolean {
  return telegramUserId === CONFIG.ADMIN_TELEGRAM_ID;
}
