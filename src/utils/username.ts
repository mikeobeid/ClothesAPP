const USERNAME_PATTERN = /^[a-z0-9_]+$/;
const MIN_LENGTH = 3;
const MAX_LENGTH = 20;

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
}

export function suggestUsernameFromEmail(email: string): string {
  const prefix = email.split('@')[0] ?? 'user';
  let username = normalizeUsername(prefix);

  if (username.length < MIN_LENGTH) {
    username = `${username}user`.slice(0, MAX_LENGTH);
  }

  return username.slice(0, MAX_LENGTH);
}

export function validateUsername(username: string): string | null {
  const normalized = normalizeUsername(username);

  if (!normalized) {
    return 'Username is required.';
  }

  if (normalized.length < MIN_LENGTH) {
    return 'Username must be at least 3 characters.';
  }

  if (normalized.length > MAX_LENGTH) {
    return 'Username must be 20 characters or fewer.';
  }

  if (!USERNAME_PATTERN.test(normalized)) {
    return 'Use only lowercase letters, numbers, and underscores.';
  }

  return null;
}

export function buildUsernameWithSuffix(base: string, suffix: string): string {
  const normalized = normalizeUsername(base).slice(0, MAX_LENGTH);
  const trimmedBase = normalized.slice(0, Math.max(1, MAX_LENGTH - suffix.length));
  return `${trimmedBase}${suffix}`.slice(0, MAX_LENGTH);
}
