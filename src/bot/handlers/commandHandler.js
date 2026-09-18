import { sendMessage, isFromAdmin } from "../../lib/telegram.js";
import { clearConversation, getStats, getAdminStats, setConversation } from "../../services/taskService.js";
import { welcomeMessage, mainMenuMessage, helpMessage, adminDashboardMessage, unauthorizedMessage, statsMessage, settingsMessage } from "../messages.js";
import { mainMenu, adminPanel, settingsMenu } from "../keyboards.js";

export async function handleCommand(message, user) {
  const chatId = message.chat.id;
  const text = message.text || "";
  const command = text.split(" ")[0].toLowerCase().replace("@", "").split("_")[0];
  await clearConversation(user.telegram_user_id);

  switch (command) {
    case "/start":
      await sendMessage(chatId, welcomeMessage(), mainMenu());
      break;
    case "/help":
      await sendMessage(chatId, helpMessage(), mainMenu());
      break;
    case "/menu":
      await sendMessage(chatId, mainMenuMessage(), mainMenu());
      break;
    case "/add":
      await sendMessage(chatId, "What app or website did you work on?\n\nEnter the name below:");
      await setConversation(user.telegram_user_id, { state: "WAITING_FOR_APP" });
      break;
    case "/tasks":
      await import("./callbackHandler.js").then((m) => m.handleShowTasks(user, chatId, 0));
      break;
    case "/reminders":
      await import("./callbackHandler.js").then((m) => m.handleShowReminders(user, chatId));
      break;
    case "/history":
      await import("./callbackHandler.js").then((m) => m.handleShowHistory(user, chatId, 0));
      break;
    case "/stats":
      await sendMessage(chatId, statsMessage(await getStats(user.telegram_user_id)), mainMenu());
      break;
    case "/settings":
      await sendMessage(chatId, settingsMessage(user), settingsMenu());
      break;
    case "/cancel":
      await sendMessage(chatId, "Action cancelled.", mainMenu());
      break;
    case "/admin":
      if (!isFromAdmin(user.telegram_user_id)) {
        await sendMessage(chatId, unauthorizedMessage());
        return;
      }
      await sendMessage(chatId, adminDashboardMessage(await getAdminStats()), adminPanel());
      break;
    default:
      await sendMessage(chatId, "Unknown command. Use /help", mainMenu());
  }
}
