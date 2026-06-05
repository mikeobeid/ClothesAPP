function isSupportedImageScheme(uri: string): boolean {
  return (
    uri.startsWith('https://') ||
    uri.startsWith('http://') ||
    uri.startsWith('file://')
  );
}

export function isDisplayableImageUri(uri: string | undefined): uri is string {
  if (!uri) {
    return false;
  }

  const trimmed = uri.trim();
  return trimmed.length > 0 && isSupportedImageScheme(trimmed);
}

export function normalizeRestoredImageUri(
  raw: string | null | undefined,
): string | undefined {
  if (raw == null || typeof raw !== 'string') {
    return undefined;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }

  if (isSupportedImageScheme(trimmed)) {
    return trimmed;
  }

  console.warn('[Image] Ignoring unsupported image_uri from restore');
  return undefined;
}
