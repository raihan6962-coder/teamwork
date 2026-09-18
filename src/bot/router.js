import { getOrCreateUser } from "../services/taskService.js";
import { handleCommand } from "./handlers/commandHandler.js";
import { handleCallbackQuery } from "./handlers/callbackHandler.js";
import { handleTextMessage } from "./handlers/messageHandler.js";
import { logger } from "../lib/logger.js";

export async function routeUpdate(update) {
  if (update.callback_query) {
    await routeCallbackQuery(update.callback_query);
  } else if (update.message) {
    await routeMessage(update.message);
  }
}

async function routeMessage(message) {
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
    } else {
      await handleTextMessage(message, user);
    }
  } catch (error) {
    logger.error("Error routing message", error, { userId, chatId });
  }
}

async function routeCallbackQuery(query) {
  if (!query.from || query.from.is_bot) return;
  const userId = query.from.id;
  try {
    const user = await getOrCreateUser({
      telegram_user_id: userId,
      telegram_chat_id: (query.message && query.message.chat) ? query.message.chat.id : 0,
      username: query.from.username,
      first_name: query.from.first_name,
      last_name: query.from.last_name,
    });
    await handleCallbackQuery(query, user);
  } catch (error) {
    logger.error("Error routing callback", error, { userId });
  }
}
