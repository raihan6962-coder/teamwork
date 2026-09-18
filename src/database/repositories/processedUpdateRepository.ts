import { queryOne, execute } from "../database/client.js";

export const processedUpdateRepository = {
  async isProcessed(updateId: number): Promise<boolean> {
    const result = await queryOne<{ update_id: number }>(
      "SELECT update_id FROM processed_updates WHERE update_id = $1",
      [updateId]
    );
    return result !== null;
  },

  async markProcessed(updateId: number): Promise<void> {
    try {
      await execute(
        "INSERT INTO processed_updates (update_id, processed_at) VALUES ($1, NOW()) ON CONFLICT (update_id) DO NOTHING",
        [updateId]
      );
    } catch {
      // Update may already exist, ignore duplicate
    }
  },

  async cleanup(): Promise<void> {
    await execute(
      "DELETE FROM processed_updates WHERE processed_at < NOW() - INTERVAL '7 days'"
    );
  },
};
