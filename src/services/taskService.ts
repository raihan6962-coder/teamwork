import { taskRepository } from "../database/repositories/taskRepository.js";
import { conversationRepository } from "../database/repositories/conversationRepository.js";
import { userRepository } from "../database/repositories/userRepository.js";
import type { Task, User, ConversationData } from "../types.js";
import { addToDate, utcNow, toUTC } from "../lib/time.js";
import { logger } from "../lib/logger.js";

export async function getOrCreateUser(data: {
  telegram_user_id: number;
  telegram_chat_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}): Promise<User> {
  let user = await userRepository.findById(data.telegram_user_id);
  if (!user) {
    user = await userRepository.create({
      ...data,
      timezone: "UTC",
      is_admin: false,
    });
    logger.info("New user created", { userId: data.telegram_user_id });
  } else {
    await userRepository.update(data.telegram_user_id, {
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
    });
  }
  return user;
}

export async function getConversation(
  userId: number
): Promise<ConversationData> {
  const state = await conversationRepository.getState(userId);
  return state || { state: "IDLE" };
}

export async function setConversation(
  userId: number,
  data: ConversationData
): Promise<void> {
  await conversationRepository.setState(userId, data);
}

export async function clearConversation(userId: number): Promise<void> {
  await conversationRepository.clearState(userId);
}

export async function createTask(data: {
  telegram_user_id: number;
  telegram_chat_id: number;
  app_name: string;
  country: string;
  country_code: string;
  completed_at: Date;
  reminder_duration: number;
  timezone: string;
  notes?: string;
}): Promise<Task> {
  const reminderAt = addToDate(data.completed_at, data.reminder_duration);

  return taskRepository.create({
    telegram_user_id: data.telegram_user_id,
    telegram_chat_id: data.telegram_chat_id,
    app_name: data.app_name,
    country: data.country,
    country_code: data.country_code,
    completed_at: toUTC(data.completed_at),
    reminder_at: toUTC(reminderAt),
    reminder_duration: data.reminder_duration,
    timezone: data.timezone,
    notes: data.notes,
  });
}

export async function snoozeTask(
  taskId: string,
  userId: number,
  minutes: number
): Promise<Task | null> {
  const task = await taskRepository.findById(taskId);
  if (!task || task.telegram_user_id !== userId) return null;

  const newReminderAt = addToDate(utcNow(), minutes);
  await taskRepository.update(taskId, userId, {
    reminder_at: toUTC(newReminderAt),
    reminder_sent: false,
    status: "pending",
  });

  return taskRepository.findById(taskId);
}

export async function completeTask(
  taskId: string,
  userId: number
): Promise<Task | null> {
  const task = await taskRepository.findById(taskId);
  if (!task || task.telegram_user_id !== userId) return null;

  await taskRepository.update(taskId, userId, {
    status: "completed",
  });

  return taskRepository.findById(taskId);
}

export async function cancelTask(
  taskId: string,
  userId: number
): Promise<boolean> {
  const task = await taskRepository.findById(taskId);
  if (!task || task.telegram_user_id !== userId) return false;

  await taskRepository.softDelete(taskId, userId);
  return true;
}

export async function getUserTasks(
  userId: number,
  page: number = 0,
  perPage: number = 5
): Promise<{ tasks: Task[]; total: number }> {
  const total = await taskRepository.countByUser(userId, "pending");
  const tasks = await taskRepository.findByUser(userId, {
    status: "pending",
    limit: perPage,
    offset: page * perPage,
  });
  return { tasks, total };
}

export async function getHistoryTasks(
  userId: number,
  page: number = 0,
  perPage: number = 5
): Promise<{ tasks: Task[]; total: number }> {
  const total = await taskRepository.countHistory(userId);
  const tasks = await taskRepository.getHistory(userId, {
    limit: perPage,
    offset: page * perPage,
  });
  return { tasks, total };
}

export async function getStats(userId: number) {
  const totalTasks = await taskRepository.countByUser(userId);
  const completed = await taskRepository.countByUser(userId, "completed");
  const pending = await taskRepository.countByUser(userId, "pending");
  const cancelled = await taskRepository.countByUser(userId, "cancelled");
  const remindersSent = await taskRepository.countRemindersSent();
  const mostUsedApp = await taskRepository.getMostUsedApp(userId);
  const mostUsedCountry = await taskRepository.getMostUsedCountry(userId);

  return {
    totalTasks,
    completed,
    pending,
    cancelled,
    remindersSent,
    mostUsedApp,
    mostUsedCountry,
  };
}

export async function getAdminStats() {
  const totalUsers = await userRepository.count();
  const statusCounts = await taskRepository.countByStatus();
  const totalTasks = statusCounts.reduce((sum, s) => sum + s.count, 0);
  const completedTasks =
    statusCounts.find((s) => s.status === "completed")?.count || 0;
  const pendingReminders = await taskRepository.totalActiveReminders();
  const remindersSent = await taskRepository.countRemindersSent();

  return {
    totalUsers,
    totalTasks,
    completedTasks,
    pendingReminders,
    remindersSent,
  };
}
