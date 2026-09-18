export function validateAppName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "App/website name cannot be empty." };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: "App/website name is too long (max 100 characters)." };
  }
  return { valid: true };
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function isValidTelegramId(id: number): boolean {
  return id > 0 && Number.isInteger(id);
}
