import { CONFIG } from "../config.js";
import { logger } from "./logger.js";

const TELEGRAM_API = "https://api.telegram.org";

async function apiRequest(method, body) {
  const url = `${TELEGRAM_API}/bot${CONFIG.TELEGRAM_BOT_TOKEN}/${method}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    if (!data.ok) {
      logger.error(`Telegram API error: ${method}`, null, { description: data.description, error_code: data.error_code });
      throw new Error(`Telegram API error: ${data.description || "Unknown"}`);
    }
    return data.result;
  } catch (error) {
    if (error.name === "TimeoutError") logger.error(`Telegram API timeout: ${method}`);
    throw error;
  }
}

export async function sendMessage(chatId, text, replyMarkup, parseMode) {
  return apiRequest("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: parseMode || "HTML",
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function editMessageText(chatId, messageId, text, replyMarkup, parseMode) {
  return apiRequest("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: parseMode || "HTML",
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function answerCallbackQuery(callbackId, text, showAlert) {
  return apiRequest("answerCallbackQuery", {
    callback_query_id: callbackId,
    text,
    show_alert: showAlert || false,
  });
}

export async function deleteMessage(chatId, messageId) {
  try {
    return await apiRequest("deleteMessage", { chat_id: chatId, message_id: messageId });
  } catch {
    return false;
  }
}

export async function setWebhook(url, secret) {
  return apiRequest("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
  });
}

export async function getWebhookInfo() {
  return apiRequest("getWebhookInfo");
}

export async function getMe() {
  return apiRequest("getMe");
}

export function isFromAdmin(telegramUserId) {
  return telegramUserId === CONFIG.ADMIN_TELEGRAM_ID;
}
