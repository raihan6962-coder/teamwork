import { taskRepository } from "../database/repositories/taskRepository.js";
import { conversationRepository } from "../database/repositories/conversationRepository.js";
import { userRepository } from "../database/repositories/userRepository.js";
import { addToDate, utcNow, toUTC } from "../lib/time.js";
import { logger } from "../lib/logger.js";

export async function getOrCreateUser(data) {
  let user = await userRepository.findById(data.telegram_user_id);
  if (!user) {
    user = await userRepository.create({ ...data, timezone: "UTC", is_admin: false });
    logger.info("New user created", { userId: data.telegram_user_id });
  } else {
    await userRepository.update(data.telegram_user_id, { username: data.username, first_name: data.first_name, last_name: data.last_name });
  }
  return user;
}

export async function getConversation(userId) {
  const state = await conversationRepository.getState(userId);
  return state || { state: "IDLE" };
}

export async function setConversation(userId, data) {
  await conversationRepository.setState(userId, data);
}

export async function clearConversation(userId) {
  await conversationRepository.clearState(userId);
}

export async function createTask(data) {
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

export async function snoozeTask(taskId, userId, minutes) {
  const task = await taskRepository.findById(taskId);
  if (!task || task.telegram_user_id !== userId) return null;
  const newReminderAt = addToDate(utcNow(), minutes);
  await taskRepository.update(taskId, userId, { reminder_at: toUTC(newReminderAt), reminder_sent: false, status: "pending" });
  return taskRepository.findById(taskId);
}

export async function completeTask(taskId, userId) {
  const task = await taskRepository.findById(taskId);
  if (!task || task.telegram_user_id !== userId) return null;
  await taskRepository.update(taskId, userId, { status: "completed" });
  return taskRepository.findById(taskId);
}

export async function cancelTask(taskId, userId) {
  const task = await taskRepository.findById(taskId);
  if (!task || task.telegram_user_id !== userId) return false;
  await taskRepository.softDelete(taskId, userId);
  return true;
}

export async function getUserTasks(userId, page, perPage) {
  page = page || 0;
  perPage = perPage || 5;
  const total = await taskRepository.countByUser(userId, "pending");
  const tasks = await taskRepository.findByUser(userId, { status: "pending", limit: perPage, offset: page * perPage });
  return { tasks, total };
}

export async function getHistoryTasks(userId, page, perPage) {
  page = page || 0;
  perPage = perPage || 5;
  const total = await taskRepository.countHistory(userId);
  const tasks = await taskRepository.getHistory(userId, { limit: perPage, offset: page * perPage });
  return { tasks, total };
}

export async function getStats(userId) {
  return {
    totalTasks: await taskRepository.countByUser(userId),
    completed: await taskRepository.countByUser(userId, "completed"),
    pending: await taskRepository.countByUser(userId, "pending"),
    cancelled: await taskRepository.countByUser(userId, "cancelled"),
    remindersSent: await taskRepository.countRemindersSent(),
    mostUsedApp: await taskRepository.getMostUsedApp(userId),
    mostUsedCountry: await taskRepository.getMostUsedCountry(userId),
  };
}

export async function getAdminStats() {
  const statusCounts = await taskRepository.countByStatus();
  return {
    totalUsers: await userRepository.count(),
    totalTasks: statusCounts.reduce((sum, s) => sum + s.count, 0),
    completedTasks: (statusCounts.find((s) => s.status === "completed") || {}).count || 0,
    pendingReminders: await taskRepository.totalActiveReminders(),
    remindersSent: await taskRepository.countRemindersSent(),
  };
}
