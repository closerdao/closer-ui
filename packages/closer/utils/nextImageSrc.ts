export function isValidNextImageSrc(raw: string | undefined | null): boolean {
  const src = typeof raw === 'string' ? raw.trim() : '';
  if (!src) return false;
  return (
    src.startsWith('/') ||
    src.startsWith('http://') ||
    src.startsWith('https://')
  );
}
