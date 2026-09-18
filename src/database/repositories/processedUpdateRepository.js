import { queryOne, execute } from "../client.js";

export const processedUpdateRepository = {
  async isProcessed(updateId) {
    const r = await queryOne("SELECT update_id FROM processed_updates WHERE update_id = $1", [updateId]);
    return r !== null;
  },
  async markProcessed(updateId) {
    try {
      await execute("INSERT INTO processed_updates (update_id, processed_at) VALUES ($1, NOW()::text) ON CONFLICT (update_id) DO NOTHING", [updateId]);
    } catch {}
  },
};
