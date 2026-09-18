import { query, queryOne, execute } from "../database/client.js";
import type { Task } from "../types.js";
import { v4 as uuidv4 } from "uuid";

export const taskRepository = {
  async findById(id: string): Promise<Task | null> {
    return queryOne<Task>(
      "SELECT * FROM tasks WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );
  },

  async findByUser(
    telegramUserId: number,
    options?: { status?: string; limit?: number; offset?: number }
  ): Promise<Task[]> {
    let sql = "SELECT * FROM tasks WHERE telegram_user_id = $1 AND deleted_at IS NULL";
    const params: unknown[] = [telegramUserId];
    let idx = 2;

    if (options?.status) {
      sql += ` AND status = $${idx++}`;
      params.push(options.status);
    }

    sql += " ORDER BY created_at DESC";

    if (options?.limit) {
      sql += ` LIMIT $${idx++}`;
      params.push(options.limit);
    }
    if (options?.offset) {
      sql += ` OFFSET $${idx++}`;
      params.push(options.offset);
    }

    return query<Task>(sql, params);
  },

  async countByUser(
    telegramUserId: number,
    status?: string
  ): Promise<number> {
    let sql = "SELECT COUNT(*) as count FROM tasks WHERE telegram_user_id = $1 AND deleted_at IS NULL";
    const params: unknown[] = [telegramUserId];
    let idx = 2;

    if (status) {
      sql += ` AND status = $${idx++}`;
      params.push(status);
    }

    const result = await queryOne<{ count: number }>(sql, params);
    return result?.count || 0;
  },

  async countByStatus(): Promise<
    { status: string; count: number }[]
  > {
    return query<{ status: string; count: number }>(
      "SELECT status, COUNT(*) as count FROM tasks WHERE deleted_at IS NULL GROUP BY status"
    );
  },

  async getMostUsedApp(telegramUserId: number): Promise<string | null> {
    const result = await queryOne<{ app_name: string }>(
      `SELECT app_name, COUNT(*) as cnt FROM tasks 
       WHERE telegram_user_id = $1 AND deleted_at IS NULL 
       GROUP BY app_name ORDER BY cnt DESC LIMIT 1`,
      [telegramUserId]
    );
    return result?.app_name || null;
  },

  async getMostUsedCountry(telegramUserId: number): Promise<string | null> {
    const result = await queryOne<{ country: string }>(
      `SELECT country, COUNT(*) as cnt FROM tasks 
       WHERE telegram_user_id = $1 AND deleted_at IS NULL 
       GROUP BY country ORDER BY cnt DESC LIMIT 1`,
      [telegramUserId]
    );
    return result?.country || null;
  },

  async getPendingReminders(): Promise<Task[]> {
    return query<Task>(
      `SELECT * FROM tasks 
       WHERE status = 'pending' 
       AND reminder_sent = false 
       AND reminder_at <= NOW()::text
       AND deleted_at IS NULL 
       ORDER BY reminder_at ASC 
       LIMIT 50`
    );
  },

  async create(data: {
    telegram_user_id: number;
    telegram_chat_id: number;
    app_name: string;
    country: string;
    country_code: string;
    completed_at: string;
    reminder_at: string;
    reminder_duration: number;
    timezone: string;
    notes?: string;
  }): Promise<Task> {
    const id = uuidv4();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO tasks (id, telegram_user_id, telegram_chat_id, app_name, country, country_code, completed_at, reminder_at, reminder_duration, created_at, updated_at, timezone, notes, reminder_sent, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false, 'pending')`,
      [
        id,
        data.telegram_user_id,
        data.telegram_chat_id,
        data.app_name,
        data.country,
        data.country_code,
        data.completed_at,
        data.reminder_at,
        data.reminder_duration,
        now,
        now,
        data.timezone,
        data.notes || null,
      ]
    );
    return this.findById(id) as Promise<Task>;
  },

  async update(
    id: string,
    telegramUserId: number,
    data: Partial<Pick<Task, "app_name" | "country" | "country_code" | "completed_at" | "reminder_at" | "reminder_duration" | "status" | "notes" | "reminder_sent" | "timezone">>
  ): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.app_name !== undefined) {
      sets.push(`app_name = $${idx++}`);
      values.push(data.app_name);
    }
    if (data.country !== undefined) {
      sets.push(`country = $${idx++}`);
      values.push(data.country);
    }
    if (data.country_code !== undefined) {
      sets.push(`country_code = $${idx++}`);
      values.push(data.country_code);
    }
    if (data.completed_at !== undefined) {
      sets.push(`completed_at = $${idx++}`);
      values.push(data.completed_at);
    }
    if (data.reminder_at !== undefined) {
      sets.push(`reminder_at = $${idx++}`);
      values.push(data.reminder_at);
    }
    if (data.reminder_duration !== undefined) {
      sets.push(`reminder_duration = $${idx++}`);
      values.push(data.reminder_duration);
    }
    if (data.status !== undefined) {
      sets.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.notes !== undefined) {
      sets.push(`notes = $${idx++}`);
      values.push(data.notes);
    }
    if (data.reminder_sent !== undefined) {
      sets.push(`reminder_sent = $${idx++}`);
      values.push(data.reminder_sent);
    }
    if (data.timezone !== undefined) {
      sets.push(`timezone = $${idx++}`);
      values.push(data.timezone);
    }

    if (sets.length === 0) return;

    sets.push(`updated_at = $${idx++}`);
    values.push(new Date().toISOString());
    values.push(id);
    values.push(telegramUserId);

    await execute(
      `UPDATE tasks SET ${sets.join(", ")} WHERE id = $${idx - 1} AND telegram_user_id = $${idx}`,
      values
    );
  },

  async markReminderSent(id: string): Promise<void> {
    await execute(
      "UPDATE tasks SET reminder_sent = true, updated_at = NOW()::text WHERE id = $1",
      [id]
    );
  },

  async softDelete(id: string, telegramUserId: number): Promise<void> {
    await execute(
      "UPDATE tasks SET deleted_at = NOW()::text, status = 'cancelled', updated_at = NOW()::text WHERE id = $1 AND telegram_user_id = $2",
      [id, telegramUserId]
    );
  },

  async getHistory(
    telegramUserId: number,
    options?: { limit?: number; offset?: number }
  ): Promise<Task[]> {
    let sql =
      "SELECT * FROM tasks WHERE telegram_user_id = $1 AND (status = 'completed' OR status = 'cancelled') AND deleted_at IS NULL ORDER BY updated_at DESC";
    const params: unknown[] = [telegramUserId];
    let idx = 2;

    if (options?.limit) {
      sql += ` LIMIT $${idx++}`;
      params.push(options.limit);
    }
    if (options?.offset) {
      sql += ` OFFSET $${idx++}`;
      params.push(options.offset);
    }

    return query<Task>(sql, params);
  },

  async countHistory(telegramUserId: number): Promise<number> {
    const result = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM tasks WHERE telegram_user_id = $1 AND (status = 'completed' OR status = 'cancelled') AND deleted_at IS NULL",
      [telegramUserId]
    );
    return result?.count || 0;
  },

  async countRemindersSent(): Promise<number> {
    const result = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM tasks WHERE reminder_sent = true"
    );
    return result?.count || 0;
  },

  async getAllForAdmin(): Promise<Task[]> {
    return query<Task>(
      "SELECT * FROM tasks WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 100"
    );
  },

  async totalActiveReminders(): Promise<number> {
    const result = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM tasks WHERE status = 'pending' AND reminder_sent = false AND deleted_at IS NULL"
    );
    return result?.count || 0;
  },
};
