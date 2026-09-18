/**
 * ============================================
 *  CENTRAL CONFIGURATION
 * ============================================
 *
 * SECURITY WARNING:
 * This file contains sensitive credentials.
 * Your Git repository MUST remain PRIVATE.
 * Do NOT share this repository publicly.
 *
 * To configure:
 * 1. Replace TELEGRAM_BOT_TOKEN with your BotFather token
 * 2. Replace ADMIN_TELEGRAM_ID with your Telegram user ID
 * 3. Replace DATABASE_URL with your Neon/PostgreSQL connection string
 * 4. Replace WEBHOOK_SECRET with a random secret string
 */

export const CONFIG = {
  /** Telegram Bot Token from @BotFather */
  TELEGRAM_BOT_TOKEN: "PASTE_YOUR_BOT_TOKEN_HERE",

  /** Telegram User ID of the bot admin (get from @userinfobot) */
  ADMIN_TELEGRAM_ID: 0,

  /** Random secret for webhook and cron authentication */
  WEBHOOK_SECRET: "CHANGE_THIS_TO_A_RANDOM_SECRET_STRING",

  /** PostgreSQL connection string (e.g., from Neon) */
  DATABASE_URL: "PASTE_YOUR_DATABASE_URL_HERE",

  /** Vercel deployment domain (set after deploy) */
  VERCEL_DOMAIN: "YOUR-PROJECT.vercel.app",

  /** Webhook base URL */
  get WEBHOOK_URL() {
    return `https://${this.VERCEL_DOMAIN}/api/telegram/webhook`;
  },
} as const;
