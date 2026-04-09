<script lang="ts" setup>
  import { loadSettings, saveSettings, DEFAULT_SETTINGS, type Settings } from '../../utils/settings'

  const settings = ref<Settings>({ ...DEFAULT_SETTINGS })
  const saved = ref(false)
  const excludeDomainsText = ref('')
  const customExtText = ref('')
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  const LANGUAGES = [
    { value: 'auto', label: 'Auto (System)' },
    { value: 'en', label: 'English' },
    { value: 'zh_CN', label: '中文（简体）' },
  ]

  onMounted(async () => {
    const s = await loadSettings()
    settings.value = s
    excludeDomainsText.value = s.excludeDomains.join('\n')
    customExtText.value = s.customExtensions.join(', ')
  })

  function parseExcludeDomains(text: string): string[] {
    return text.split('\n').map(d => d.trim()).filter(d => d.length > 0)
  }

  function parseCustomExtensions(text: string): string[] {
    return text.split(',').map(e => e.trim().toLowerCase().replace(/^\./, '')).filter(e => e.length > 0)
  }

  async function triggerSave() {
    settings.value.excludeDomains = parseExcludeDomains(excludeDomainsText.value)
    settings.value.customExtensions = parseCustomExtensions(customExtText.value)
    await saveSettings(settings.value)
    saved.value = true
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { saved.value = false }, 2000)
  }

  function openShortcuts() {
    browser.tabs.create({ url: 'chrome://extensions/shortcuts' })
  }

  onUnmounted(() => {
    if (saveTimer) clearTimeout(saveTimer)
  })
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
    <div class="max-w-2xl mx-auto px-4 py-8">

      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 class="text-xl font-semibold">Settings</h1>
        </div>

        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 scale-90"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-90"
        >
          <div v-if="saved"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </div>
        </Transition>
      </div>

      <div class="space-y-4">

        <!-- Sniffing Settings -->
        <section class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 class="font-medium text-sm text-gray-900 dark:text-gray-100">Sniffing</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Choose which resource types to capture</p>
          </div>
          <div class="px-5 py-4 space-y-3">
            <label v-for="(label, key) in { streaming: 'Streaming (HLS / DASH)', video: 'Video (MP4, WebM…)', audio: 'Audio (MP3, AAC…)', image: 'Image (PNG, JPG…)' }"
              :key="key"
              class="flex items-center justify-between cursor-pointer group">
              <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{{ label }}</span>
              <button
                type="button"
                role="switch"
                :aria-checked="settings.sniffingGroups[key as keyof typeof settings.sniffingGroups]"
                @click="settings.sniffingGroups[key as keyof typeof settings.sniffingGroups] = !settings.sniffingGroups[key as keyof typeof settings.sniffingGroups]; triggerSave()"
                :class="[
                  'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
                  settings.sniffingGroups[key as keyof typeof settings.sniffingGroups]
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                ]"
              >
                <span :class="[
                  'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200',
                  settings.sniffingGroups[key as keyof typeof settings.sniffingGroups] ? 'translate-x-4' : 'translate-x-0'
                ]" />
              </button>
            </label>
          </div>
        </section>

        <!-- Size Threshold -->
        <section class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 class="font-medium text-sm text-gray-900 dark:text-gray-100">Minimum File Size</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Only capture files larger than this size. Set to 0 to capture all.</p>
          </div>
          <div class="px-5 py-4">
            <div class="flex items-center gap-3">
              <input
                type="number"
                min="0"
                step="1"
                v-model.number="settings.minSizeKB"
                @change="triggerSave"
                class="w-32 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="text-sm text-gray-500 dark:text-gray-400">KB</span>
              <span v-if="settings.minSizeKB > 0" class="text-xs text-gray-400 dark:text-gray-500">
                = {{ (settings.minSizeKB / 1024).toFixed(2) }} MB
              </span>
            </div>
          </div>
        </section>

        <!-- Custom Extensions -->
        <section class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 class="font-medium text-sm text-gray-900 dark:text-gray-100">Custom Extensions</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Add extra formats to capture, comma-separated (e.g. mkv, ogg, f4v)</p>
          </div>
          <div class="px-5 py-4">
            <input
              type="text"
              v-model="customExtText"
              @blur="triggerSave"
              placeholder="mkv, ogg, f4v"
              class="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </section>

        <!-- Exclude Domains -->
        <section class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 class="font-medium text-sm text-gray-900 dark:text-gray-100">Exclude Domains</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sniffing will be disabled on these domains. One per line (e.g. twitter.com)</p>
          </div>
          <div class="px-5 py-4">
            <textarea
              v-model="excludeDomainsText"
              @blur="triggerSave"
              rows="4"
              placeholder="twitter.com&#10;facebook.com&#10;instagram.com"
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
            />
          </div>
        </section>

        <!-- Language -->
        <section class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 class="font-medium text-sm text-gray-900 dark:text-gray-100">Language</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Override the display language</p>
          </div>
          <div class="px-5 py-4">
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="lang in LANGUAGES"
                :key="lang.value"
                type="button"
                @click="settings.language = lang.value as Settings['language']; triggerSave()"
                :class="[
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                  settings.language === lang.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
                ]"
              >
                {{ lang.label }}
              </button>
            </div>
          </div>
        </section>

        <!-- Keyboard Shortcuts -->
        <section class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 class="font-medium text-sm text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Configure shortcuts to open the extension panel</p>
          </div>
          <div class="px-5 py-4 flex items-center justify-between">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Manage keyboard shortcuts in Chrome's extension settings
            </div>
            <button
              type="button"
              @click="openShortcuts"
              class="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              Open Shortcuts
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
        </section>

        <!-- Reset -->
        <div class="flex justify-end pt-2">
          <button
            type="button"
            @click="() => {
              settings = { ...DEFAULT_SETTINGS }
              excludeDomainsText = ''
              customExtText = ''
              triggerSave()
            }"
            class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            Reset to defaults
          </button>
        </div>

      </div>
    </div>
  </div>
</template>
