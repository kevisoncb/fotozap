const PLACEHOLDER_RE =
  /aguardando|placeholder|change.?me|^todo$|^xxx+$|your[-_].+|not[_-]?set|pending/i;

export function isPlaceholderSecret(value?: string | null): boolean {
  if (value == null) return true;
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  return PLACEHOLDER_RE.test(trimmed);
}

export function hasUsableSecrets(...values: Array<string | undefined>): boolean {
  return values.length > 0 && values.every((value) => !isPlaceholderSecret(value));
}
