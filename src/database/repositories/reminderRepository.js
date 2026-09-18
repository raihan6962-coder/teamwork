import { execute } from "../client.js";
import { randomUUID } from "crypto";

export const broadcastRepository = {
  async create(data) {
    const id = randomUUID();
    const now = new Date().toISOString();
    await execute(
      "INSERT INTO broadcast_logs (id, admin_user_id, message, total_recipients, successful, failed, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, data.admin_user_id, data.message, data.total_recipients, data.successful, data.failed, now]
    );
  },
};
