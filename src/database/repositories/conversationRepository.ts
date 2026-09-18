import { queryOne, execute } from "../database/client.js";
import type { ConversationData, ConversationState } from "../types.js";

export const conversationRepository = {
  async getState(telegramUserId: number): Promise<ConversationData | null> {
    const result = await queryOne<{
      telegram_user_id: number;
      state: string;
      data: string;
    }>(
      "SELECT * FROM conversation_states WHERE telegram_user_id = $1",
      [telegramUserId]
    );
    if (!result) return null;
    try {
      return JSON.parse(result.data) as ConversationData;
    } catch {
      return null;
    }
  },

  async setState(
    telegramUserId: number,
    data: ConversationData
  ): Promise<void> {
    const now = new Date().toISOString();
    const jsonData = JSON.stringify(data);
    await execute(
      `INSERT INTO conversation_states (telegram_user_id, state, data, updated_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (telegram_user_id) DO UPDATE SET state = $2, data = $3, updated_at = $4`,
      [telegramUserId, data.state, jsonData, now]
    );
  },

  async clearState(telegramUserId: number): Promise<void> {
    await execute(
      "DELETE FROM conversation_states WHERE telegram_user_id = $1",
      [telegramUserId]
    );
  },
};
