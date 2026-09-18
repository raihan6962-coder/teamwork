/**
 * ============================================
 *  CENTRAL CONFIGURATION
 * ============================================
 *
 * SECURITY WARNING:
 * This file contains sensitive credentials.
 * Your Git repository MUST remain PRIVATE.
 * Do NOT share this repository publicly.
 */

export const CONFIG = {
  /** Telegram Bot Token from @BotFather */
  TELEGRAM_BOT_TOKEN: "8955148796:AAEbW3o_8IUu4v2z-m7YY1Sd4_GLUQgPddg",

  /**
   * Telegram User ID of the bot admin.
   * IMPORTANT: This must be a NUMBER, not a username.
   * Get your numeric ID: open Telegram → search @userinfobot → send any message → copy the ID number.
   * Example: 123456789
   */
  ADMIN_TELEGRAM_ID: 0,

  /** Random secret for webhook and cron authentication */
  WEBHOOK_SECRET: "teamwork_bot_secret_2026_xK9mBz",

  /**
   * PostgreSQL connection string (e.g., from Neon, Supabase, Vercel Postgres).
   * If left empty, the bot will use an in-memory fallback (data resets on cold start).
   * For production, set a real database URL.
   */
  DATABASE_URL: "",

  /** Vercel deployment domain (set after deploy) */
  VERCEL_DOMAIN: "YOUR-PROJECT.vercel.app",

  /** Webhook base URL */
  get WEBHOOK_URL() {
    return `https://${this.VERCEL_DOMAIN}/api/telegram/webhook`;
  },
} as const;
