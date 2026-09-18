export const CONFIG = {
  TELEGRAM_BOT_TOKEN: "8955148796:AAEbW3o_8IUu4v2z-m7YY1Sd4_GLUQgPddg",
  ADMIN_TELEGRAM_ID: 6593421895,
  WEBHOOK_SECRET: "teamwork_bot_secret_2026_xK9mBz",
  DATABASE_URL: "",
  VERCEL_DOMAIN: "YOUR-PROJECT.vercel.app",
  get WEBHOOK_URL() {
    return `https://${this.VERCEL_DOMAIN}/api/telegram/webhook`;
  },
};
