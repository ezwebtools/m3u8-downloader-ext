<script lang="ts" setup>
  const sessionId = new URLSearchParams(location.search).get('session') ?? ''
  const status = ref<'waiting' | 'downloading' | 'done' | 'error'>('waiting')
  const errorMsg = ref('')

  function triggerDownload(url: string, filename: string) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function getFilenameFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname
      return pathname.split('/').pop() || 'download'
    } catch {
      return 'download'
    }
  }

  onMounted(async () => {
    if (!sessionId) {
      status.value = 'error'
      errorMsg.value = '无效的会话'
      return
    }

    try {
      const resp = await browser.runtime.sendMessage({ type: 'PAGE_READY', sessionId })
      if (resp?.ok && resp.url) {
        status.value = 'downloading'
        const filename = resp.filename || getFilenameFromUrl(resp.url)
        triggerDownload(resp.url, filename)
        status.value = 'done'
      } else {
        status.value = 'error'
        errorMsg.value = '会话已过期或无效'
      }
    } catch {
      status.value = 'error'
      errorMsg.value = '无法连接到扩展后台'
    }
  })
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
      <div v-if="status === 'waiting'" class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        <p class="text-gray-600 dark:text-gray-300 text-sm">正在准备下载...</p>
      </div>

      <div v-else-if="status === 'downloading'" class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
        <p class="text-gray-600 dark:text-gray-300 text-sm">正在触发下载...</p>
      </div>

      <div v-else-if="status === 'done'" class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
          <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p class="text-gray-700 dark:text-gray-200 font-medium">下载已开始</p>
        <p class="text-gray-400 dark:text-gray-500 text-xs">可以关闭此页面</p>
      </div>

      <div v-else-if="status === 'error'" class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
          <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p class="text-gray-700 dark:text-gray-200 font-medium">下载失败</p>
        <p class="text-red-500 dark:text-red-400 text-xs">{{ errorMsg }}</p>
      </div>
    </div>
  </div>
</template>
