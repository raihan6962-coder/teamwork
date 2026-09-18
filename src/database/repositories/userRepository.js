import { queryOne, execute } from "../database/client.js";
import { v4 as uuidv4 } from "uuid";

export const userRepository = {
  async findById(telegramUserId) {
    return queryOne("SELECT * FROM users WHERE telegram_user_id = $1", [telegramUserId]);
  },

  async create(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    await execute(
      "INSERT INTO users (id, telegram_user_id, telegram_chat_id, username, first_name, last_name, timezone, is_admin, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
      [id, data.telegram_user_id, data.telegram_chat_id, data.username || null, data.first_name || null, data.last_name || null, data.timezone || "UTC", data.is_admin || false, now, now]
    );
    return this.findById(data.telegram_user_id);
  },

  async update(telegramUserId, data) {
    const sets = [];
    const values = [];
    let idx = 1;
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) { sets.push(`${key} = $${idx++}`); values.push(val); }
    }
    if (sets.length === 0) return;
    sets.push(`updated_at = $${idx++}`);
    values.push(new Date().toISOString());
    values.push(telegramUserId);
    await execute(`UPDATE users SET ${sets.join(", ")} WHERE telegram_user_id = $${idx}`, values);
  },

  async count() {
    const r = await queryOne("SELECT COUNT(*) as count FROM users");
    return r ? r.count : 0;
  },

  async getAllChatIds() {
    const { query } = await import("../database/client.js");
    return query("SELECT DISTINCT telegram_chat_id FROM users WHERE notifications_enabled = true");
  },
};
