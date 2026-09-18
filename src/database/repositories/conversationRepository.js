import { queryOne, execute } from "../client.js";

export const conversationRepository = {
  async getState(telegramUserId) {
    const result = await queryOne("SELECT * FROM conversation_states WHERE telegram_user_id = $1", [telegramUserId]);
    if (!result) return null;
    try { return JSON.parse(result.data); } catch { return null; }
  },

  async setState(telegramUserId, data) {
    const jsonData = JSON.stringify(data);
    await execute(
      "INSERT INTO conversation_states (telegram_user_id, state, data, updated_at) VALUES ($1, $2, $3, NOW()::text) ON CONFLICT (telegram_user_id) DO UPDATE SET state = $2, data = $3, updated_at = NOW()::text",
      [telegramUserId, data.state, jsonData]
    );
  },

  async clearState(telegramUserId) {
    await execute("DELETE FROM conversation_states WHERE telegram_user_id = $1", [telegramUserId]);
  },
};
