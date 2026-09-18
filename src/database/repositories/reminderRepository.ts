import { query, queryOne, execute } from "../database/client.js";
import type { Reminder, BroadcastLog } from "../types.js";
import { v4 as uuidv4 } from "uuid";

export const reminderRepository = {
  async create(data: {
    task_id: string;
    telegram_user_id: number;
    telegram_chat_id: number;
    reminder_at: string;
  }): Promise<Reminder> {
    const id = uuidv4();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO reminders (id, task_id, telegram_user_id, telegram_chat_id, reminder_at, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
      [id, data.task_id, data.telegram_user_id, data.telegram_chat_id, data.reminder_at, now]
    );
    return this.findById(id) as Promise<Reminder>;
  },

  async findById(id: string): Promise<Reminder | null> {
    return queryOne<Reminder>("SELECT * FROM reminders WHERE id = $1", [id]);
  },

  async getDueReminders(): Promise<Reminder[]> {
    return query<Reminder>(
      `SELECT * FROM reminders 
       WHERE status = 'pending' 
       AND reminder_at <= NOW()::text
       ORDER BY reminder_at ASC 
       LIMIT 50`
    );
  },

  async markSent(id: string): Promise<void> {
    await execute(
      "UPDATE reminders SET status = 'sent', sent_at = NOW()::text WHERE id = $1",
      [id]
    );
  },

  async markFailed(id: string, errorMessage: string): Promise<void> {
    await execute(
      "UPDATE reminders SET status = 'failed', error_message = $1 WHERE id = $2",
      [errorMessage, id]
    );
  },

  async countPending(): Promise<number> {
    const result = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM reminders WHERE status = 'pending'"
    );
    return result?.count || 0;
  },

  async countSent(): Promise<number> {
    const result = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM reminders WHERE status = 'sent'"
    );
    return result?.count || 0;
  },
};

export const broadcastRepository = {
  async create(data: {
    admin_user_id: number;
    message: string;
    total_recipients: number;
    successful: number;
    failed: number;
  }): Promise<BroadcastLog> {
    const id = uuidv4();
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO broadcast_logs (id, admin_user_id, message, total_recipients, successful, failed, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, data.admin_user_id, data.message, data.total_recipients, data.successful, data.failed, now]
    );
    return { id, ...data, created_at: now };
  },
};
