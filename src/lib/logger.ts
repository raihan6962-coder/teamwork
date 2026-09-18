export const logger = {
  info(message: string, data?: Record<string, unknown>) {
    const entry = {
      level: "info",
      timestamp: new Date().toISOString(),
      message,
      ...data,
    };
    console.log(JSON.stringify(entry));
  },

  error(message: string, error?: unknown, data?: Record<string, unknown>) {
    const entry = {
      level: "error",
      timestamp: new Date().toISOString(),
      message,
      error: error instanceof Error ? error.message : String(error),
      ...data,
    };
    console.error(JSON.stringify(entry));
  },

  warn(message: string, data?: Record<string, unknown>) {
    const entry = {
      level: "warn",
      timestamp: new Date().toISOString(),
      message,
      ...data,
    };
    console.warn(JSON.stringify(entry));
  },

  debug(message: string, data?: Record<string, unknown>) {
    const entry = {
      level: "debug",
      timestamp: new Date().toISOString(),
      message,
      ...data,
    };
    console.debug(JSON.stringify(entry));
  },
};
