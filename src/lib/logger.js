export const logger = {
  info(message, data) {
    console.log(JSON.stringify({ level: "info", timestamp: new Date().toISOString(), message, ...data }));
  },
  error(message, error, data) {
    console.error(JSON.stringify({ level: "error", timestamp: new Date().toISOString(), message, error: error instanceof Error ? error.message : String(error), ...data }));
  },
  warn(message, data) {
    console.warn(JSON.stringify({ level: "warn", timestamp: new Date().toISOString(), message, ...data }));
  },
};
