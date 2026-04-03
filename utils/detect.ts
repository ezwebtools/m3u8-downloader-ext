export function normalizeUrl(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (value instanceof URL) return value.toString()
  if (typeof Request !== 'undefined' && value instanceof Request) return value.url
  return null
}

export function isM3U8(value: unknown): boolean {
  const url = normalizeUrl(value)
  if (!url) return false

  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname.toLowerCase()
    const search = parsed.search.toLowerCase()
    return pathname.endsWith('.m3u8') || search.includes('m3u8')
  } catch {
    const lower = url.toLowerCase()
    return lower.includes('.m3u8') || lower.includes('m3u8?')
  }
}