import type { TelegramUpdate, TelegramMessage, CallbackQuery } from "../types.js";
import { logger } from "../lib/logger.js";
import { handleCommand } from "./handlers/commandHandler.js";
import { handleCallbackQuery } from "./handlers/callbackHandler.js";
import { handleTextMessage } from "./handlers/messageHandler.js";
import { getOrCreateUser } from "../services/taskService.js";

export async function routeUpdate(update: TelegramUpdate): Promise<void> {
  if (update.callback_query) {
    await routeCallbackQuery(update.callback_query);
  } else if (update.message) {
    await routeMessage(update.message);
  }
}

async function routeMessage(message: TelegramMessage): Promise<void> {
  if (!message.from || message.from.is_bot) return;

  const userId = message.from.id;
  const chatId = message.chat.id;

  try {
    const user = await getOrCreateUser({
      telegram_user_id: userId,
      telegram_chat_id: chatId,
      username: message.from.username,
      first_name: message.from.first_name,
      last_name: message.from.last_name,
    });

    const text = message.text;
    if (!text) return;

    if (text.startsWith("/")) {
      await handleCommand(message, user);
      return;
    }

    await handleTextMessage(message, user);
  } catch (error) {
    logger.error("Error routing message", error, { userId, chatId });
  }
}

async function routeCallbackQuery(query: CallbackQuery): Promise<void> {
  if (!query.from || query.from.is_bot) return;

  const userId = query.from.id;

  try {
    const user = await getOrCreateUser({
      telegram_user_id: userId,
      telegram_chat_id: query.message?.chat.id || 0,
      username: query.from.username,
      first_name: query.from.first_name,
      last_name: query.from.last_name,
    });

    await handleCallbackQuery(query, user);
  } catch (error) {
    logger.error("Error routing callback query", error, { userId });
  }
}
