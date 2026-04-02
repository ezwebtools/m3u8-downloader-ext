import { extractM3U8UrlsFromText } from '../utils/detect'

export default defineContentScript({
  matches: ['*://*/*'],
  allFrames: true,
  runAt: 'document_end',
  main() {
    if (!document.querySelector('script[data-m3u8-injected]')) {
      const script = document.createElement('script')
      script.src = browser.runtime.getURL('/injected.js')
      script.dataset.m3u8Injected = '1'
      ;(document.head || document.documentElement).appendChild(script)
    }

    const urls = extractM3U8UrlsFromText(document.documentElement.innerHTML)
    urls.forEach(url => {
      browser.runtime.sendMessage({ type: 'M3U8_FOUND', url })
    })

    window.addEventListener('message', (event) => {
      if (
        event.data?.type === 'M3U8_DETECTED' &&
        typeof event.data.url === 'string'
      ) {
        browser.runtime.sendMessage({ type: 'M3U8_FOUND', url: event.data.url })
      }
    })
  },
})
