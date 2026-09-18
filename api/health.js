export default async function handler(req, res) {
  return res.status(200).json({ status: "ok", service: "telegram-task-reminder-bot", timestamp: new Date().toISOString() });
}
