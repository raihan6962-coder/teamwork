import { query, queryOne, execute } from "../client.js";
import { randomUUID } from "crypto";

export const taskRepository = {
  async findById(id) {
    return queryOne("SELECT * FROM tasks WHERE id = $1 AND deleted_at IS NULL", [id]);
  },

  async findByUser(telegramUserId, options) {
    let sql = "SELECT * FROM tasks WHERE telegram_user_id = $1 AND deleted_at IS NULL";
    const params = [telegramUserId];
    let idx = 2;
    if (options && options.status) { sql += ` AND status = $${idx++}`; params.push(options.status); }
    sql += " ORDER BY created_at DESC";
    if (options && options.limit) { sql += ` LIMIT $${idx++}`; params.push(options.limit); }
    if (options && options.offset) { sql += ` OFFSET $${idx++}`; params.push(options.offset); }
    return query(sql, params);
  },

  async countByUser(telegramUserId, status) {
    let sql = "SELECT COUNT(*) as count FROM tasks WHERE telegram_user_id = $1 AND deleted_at IS NULL";
    const params = [telegramUserId];
    let idx = 2;
    if (status) { sql += ` AND status = $${idx++}`; params.push(status); }
    const r = await queryOne(sql, params);
    return r ? r.count : 0;
  },

  async countByStatus() {
    return query("SELECT status, COUNT(*) as count FROM tasks WHERE deleted_at IS NULL GROUP BY status");
  },

  async getMostUsedApp(telegramUserId) {
    const r = await queryOne("SELECT app_name FROM tasks WHERE telegram_user_id = $1 AND deleted_at IS NULL GROUP BY app_name ORDER BY COUNT(*) DESC LIMIT 1", [telegramUserId]);
    return r ? r.app_name : null;
  },

  async getMostUsedCountry(telegramUserId) {
    const r = await queryOne("SELECT country FROM tasks WHERE telegram_user_id = $1 AND deleted_at IS NULL GROUP BY country ORDER BY COUNT(*) DESC LIMIT 1", [telegramUserId]);
    return r ? r.country : null;
  },

  async getPendingReminders() {
    return query("SELECT * FROM tasks WHERE status = 'pending' AND reminder_sent = false AND deleted_at IS NULL AND reminder_at <= NOW()::text ORDER BY reminder_at ASC LIMIT 50");
  },

  async create(data) {
    const id = randomUUID();
    const now = new Date().toISOString();
    const row = {
      id,
      telegram_user_id: data.telegram_user_id,
      telegram_chat_id: data.telegram_chat_id,
      app_name: data.app_name,
      country: data.country,
      country_code: data.country_code,
      completed_at: data.completed_at,
      reminder_at: data.reminder_at,
      reminder_duration: data.reminder_duration,
      created_at: now,
      updated_at: now,
      timezone: data.timezone,
      notes: data.notes || null,
      reminder_sent: false,
      status: "pending",
      deleted_at: null,
    };
    await execute(
      "INSERT INTO tasks (id, telegram_user_id, telegram_chat_id, app_name, country, country_code, completed_at, reminder_at, reminder_duration, created_at, updated_at, timezone, notes, reminder_sent, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false, 'pending')",
      [id, data.telegram_user_id, data.telegram_chat_id, data.app_name, data.country, data.country_code, data.completed_at, data.reminder_at, data.reminder_duration, now, now, data.timezone, data.notes || null]
    );
    return row;
  },

  async update(id, telegramUserId, data) {
    const sets = [];
    const values = [];
    let idx = 1;
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) { sets.push(`${key} = $${idx++}`); values.push(val); }
    }
    if (sets.length === 0) return;
    sets.push(`updated_at = $${idx++}`);
    values.push(new Date().toISOString());
    values.push(id);
    values.push(telegramUserId);
    await execute(`UPDATE tasks SET ${sets.join(", ")} WHERE id = $${idx - 1} AND telegram_user_id = $${idx}`, values);
  },

  async markReminderSent(id) {
    await execute("UPDATE tasks SET reminder_sent = true, updated_at = NOW()::text WHERE id = $1", [id]);
  },

  async softDelete(id, telegramUserId) {
    await execute("UPDATE tasks SET deleted_at = NOW()::text, status = 'cancelled', updated_at = NOW()::text WHERE id = $1 AND telegram_user_id = $2", [id, telegramUserId]);
  },

  async getHistory(telegramUserId, options) {
    let sql = "SELECT * FROM tasks WHERE telegram_user_id = $1 AND (status = 'completed' OR status = 'cancelled') AND deleted_at IS NULL ORDER BY updated_at DESC";
    const params = [telegramUserId];
    let idx = 2;
    if (options && options.limit) { sql += ` LIMIT $${idx++}`; params.push(options.limit); }
    if (options && options.offset) { sql += ` OFFSET $${idx++}`; params.push(options.offset); }
    return query(sql, params);
  },

  async countHistory(telegramUserId) {
    const r = await queryOne("SELECT COUNT(*) as count FROM tasks WHERE telegram_user_id = $1 AND (status = 'completed' OR status = 'cancelled') AND deleted_at IS NULL", [telegramUserId]);
    return r ? r.count : 0;
  },

  async countRemindersSent() {
    const r = await queryOne("SELECT COUNT(*) as count FROM tasks WHERE reminder_sent = true");
    return r ? r.count : 0;
  },

  async totalActiveReminders() {
    const r = await queryOne("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending' AND reminder_sent = false AND deleted_at IS NULL");
    return r ? r.count : 0;
  },
};
