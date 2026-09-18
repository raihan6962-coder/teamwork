import { query, queryOne, execute } from "../database/client.js";
import type { User, ConversationData } from "../types.js";
import { v4 as uuidv4 } from "uuid";

export const userRepository = {
  async findById(telegramUserId: number): Promise<User | null> {
    return queryOne<User>(
      "SELECT * FROM users WHERE telegram_user_id = $1",
      [telegramUserId]
    );
  },

  async create(data: {
    telegram_user_id: number;
    telegram_chat_id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    timezone?: string;
    is_admin?: boolean;
  }): Promise<User> {
    const id = uuidv4();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO users (id, telegram_user_id, telegram_chat_id, username, first_name, last_name, timezone, is_admin, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        data.telegram_user_id,
        data.telegram_chat_id,
        data.username || null,
        data.first_name || null,
        data.last_name || null,
        data.timezone || "UTC",
        data.is_admin || false,
        now,
        now,
      ]
    );
    return this.findById(data.telegram_user_id) as Promise<User>;
  },

  async update(
    telegramUserId: number,
    data: Partial<Pick<User, "timezone" | "default_reminder_minutes" | "time_format" | "notifications_enabled" | "username" | "first_name" | "last_name">>
  ): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.timezone !== undefined) {
      sets.push(`timezone = $${idx++}`);
      values.push(data.timezone);
    }
    if (data.default_reminder_minutes !== undefined) {
      sets.push(`default_reminder_minutes = $${idx++}`);
      values.push(data.default_reminder_minutes);
    }
    if (data.time_format !== undefined) {
      sets.push(`time_format = $${idx++}`);
      values.push(data.time_format);
    }
    if (data.notifications_enabled !== undefined) {
      sets.push(`notifications_enabled = $${idx++}`);
      values.push(data.notifications_enabled);
    }
    if (data.username !== undefined) {
      sets.push(`username = $${idx++}`);
      values.push(data.username);
    }
    if (data.first_name !== undefined) {
      sets.push(`first_name = $${idx++}`);
      values.push(data.first_name);
    }
    if (data.last_name !== undefined) {
      sets.push(`last_name = $${idx++}`);
      values.push(data.last_name);
    }

    if (sets.length === 0) return;

    sets.push(`updated_at = $${idx++}`);
    values.push(new Date().toISOString());
    values.push(telegramUserId);

    await execute(
      `UPDATE users SET ${sets.join(", ")} WHERE telegram_user_id = $${idx}`,
      values
    );
  },

  async count(): Promise<number> {
    const result = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM users"
    );
    return result?.count || 0;
  },

  async getAllChatIds(): Promise<{ telegram_chat_id: number }[]> {
    return query<{ telegram_chat_id: number }>(
      "SELECT DISTINCT telegram_chat_id FROM users WHERE notifications_enabled = true"
    );
  },
};
