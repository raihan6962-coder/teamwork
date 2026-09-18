export function validateAppName(name) {
  const trimmed = name.trim();
  if (trimmed.length === 0) return { valid: false, error: "App/website name cannot be empty." };
  if (trimmed.length > 100) return { valid: false, error: "Name too long (max 100 characters)." };
  return { valid: true };
}

export function sanitizeInput(input) {
  return input.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
