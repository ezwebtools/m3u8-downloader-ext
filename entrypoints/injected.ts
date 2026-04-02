export default defineUnlistedScript(() => {
  const originalFetch = window.fetch

  window.fetch = async (...args) => {
    try {
      const url = normalizeArg(args[0])
      if (url && url.toLowerCase().includes('m3u8')) {
        send(url)
      }
    } catch {}
    return originalFetch(...args)
  }

  const originalOpen = XMLHttpRequest.prototype.open

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async: boolean = true,
    username?: string | null,
    password?: string | null,
  ) {
    try {
      const urlStr = url instanceof URL ? url.toString() : url
      if (urlStr.toLowerCase().includes('m3u8')) {
        send(urlStr)
      }
    } catch {}
    return originalOpen.call(this, method, url, async, username, password)
  }

  function normalizeArg(input: unknown): string | null {
    if (typeof input === 'string') return input
    if (input instanceof URL) return input.toString()
    if (input instanceof Request) return input.url
    return null
  }

  function send(url: string) {
    window.postMessage({ type: 'M3U8_DETECTED', url })
  }
})
