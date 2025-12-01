const repeatingPattern = /(.)\1{6,}/i;

interface ValidationResult {
  sanitized: string;
  hadSensitiveWord: boolean;
}

export class MessageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MessageValidationError";
  }
}

export function validateAndSanitizeMessage(
  content: string,
  bannedWords: string[]
): ValidationResult {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new MessageValidationError("content required");
  }
  if (trimmed.length < 2) {
    throw new MessageValidationError("content too short");
  }
  if (trimmed.length > 500) {
    throw new MessageValidationError("content too long");
  }
  if (repeatingPattern.test(trimmed)) {
    throw new MessageValidationError("too many repeated characters");
  }

  let sanitized = trimmed;
  let hadSensitiveWord = false;
  for (const banned of bannedWords) {
    const regex = new RegExp(banned, "gi");
    if (regex.test(sanitized)) {
      hadSensitiveWord = true;
      sanitized = sanitized.replace(regex, "***");
    }
  }

  return { sanitized, hadSensitiveWord };
}
