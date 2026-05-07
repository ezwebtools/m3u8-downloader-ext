<script lang="ts" setup>
  import { loadSettings, saveSettings, DEFAULT_SETTINGS, type Settings, type SniffingGroup } from '../../utils/settings'

  const settings = ref<Settings>({
    sniffingRules: {
      streaming: { ...DEFAULT_SETTINGS.sniffingRules.streaming },
      video:     { ...DEFAULT_SETTINGS.sniffingRules.video },
      audio:     { ...DEFAULT_SETTINGS.sniffingRules.audio },
      image:     { ...DEFAULT_SETTINGS.sniffingRules.image },
    },
    excludeDomains: [],
  })
  const saved = ref(false)
  const excludeDomainsText = ref('')
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  const t = (key: string) => browser.i18n.getMessage(key as any)

  const SNIFFING_ROWS: { key: SniffingGroup; labelKey: string; icon: string; hintKey: string }[] = [
    { key: 'streaming', labelKey: 'streaming', icon: '📡', hintKey: 'streamingHint' },
    { key: 'video',     labelKey: 'video',     icon: '🎬', hintKey: 'videoHint' },
    { key: 'audio',     labelKey: 'audio',     icon: '🎵', hintKey: 'audioHint' },
    { key: 'image',     labelKey: 'image',     icon: '🖼️', hintKey: 'imageHint' },
  ]

  onMounted(async () => {
    const s = await loadSettings()
    settings.value = s
    excludeDomainsText.value = s.excludeDomains.join('\n')
  })

  function parseExcludeDomains(text: string): string[] {
    return text.split('\n').map(d => d.trim()).filter(d => d.length > 0)
  }

  async function triggerSave() {
    const domains = parseExcludeDomains(excludeDomainsText.value)
    settings.value.excludeDomains = domains
    await saveSettings({
      sniffingRules: settings.value.sniffingRules,
      excludeDomains: Array.from(domains),
    })
    saved.value = true
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { saved.value = false }, 2000)
  }

  async function openShortcuts() {
    if (typeof (browser.commands as any)?.openShortcutSettings === 'function') {
      ;(browser.commands as any).openShortcutSettings()
    } else {
      const isFirefox = navigator.userAgent.includes('Firefox')
      const url = isFirefox
        ? 'about:addons'
        : 'chrome://extensions/shortcuts'
      browser.tabs.create({ url })
    }
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
          <h1 class="text-xl font-semibold">{{ t('optionsTitle') }}</h1>
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
            {{ t('saved') }}
          </div>
        </Transition>
      </div>

      <div class="space-y-4">

        <!-- Sniffing Rules -->
        <section class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 class="font-medium text-sm text-gray-900 dark:text-gray-100">{{ t('sniffingRules') }}</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ t('sniffingRulesDesc') }}</p>
          </div>
          <!-- 表头 -->
          <div class="grid grid-cols-[1fr_auto_160px] items-center px-5 py-2.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
            <span class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{{ t('type') }}</span>
            <span class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center pr-6">{{ t('sniff') }}</span>
            <span class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{{ t('minSizeKB') }}</span>
          </div>
          <!-- 数据行 -->
          <div class="divide-y divide-gray-100 dark:divide-gray-800">
            <div v-for="row in SNIFFING_ROWS" :key="row.key"
              class="grid grid-cols-[1fr_auto_160px] items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors duration-150">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="text-lg leading-none select-none">{{ row.icon }}</span>
                <div>
                  <p class="text-sm text-gray-800 dark:text-gray-200 font-medium">{{ t(row.labelKey) }}</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500">{{ t(row.hintKey) }}</p>
                </div>
              </div>
              <div class="flex justify-center pr-6">
                <button
                  type="button"
                  role="switch"
                  :aria-checked="settings.sniffingRules[row.key].enabled"
                  @click="settings.sniffingRules[row.key].enabled = !settings.sniffingRules[row.key].enabled; triggerSave()"
                  :class="['relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none', settings.sniffingRules[row.key].enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700']"
                >
                  <span :class="['pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200', settings.sniffingRules[row.key].enabled ? 'translate-x-4' : 'translate-x-0']" />
                </button>
              </div>
              <div class="flex items-center gap-2">
                <input
                  type="number" min="0" step="1"
                  v-model.number="settings.sniffingRules[row.key].minSizeKB"
                  @change="triggerSave"
                  :disabled="!settings.sniffingRules[row.key].enabled"
                  class="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-35 disabled:cursor-not-allowed transition-opacity duration-150"
                />
                <span class="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{{ t('kb') }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Exclude Domains -->
        <section class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 class="font-medium text-sm text-gray-900 dark:text-gray-100">{{ t('excludeDomains') }}</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ t('excludeDomainsDesc') }}</p>
          </div>
          <div class="px-5 py-4">
            <textarea
              v-model="excludeDomainsText"
              @blur="triggerSave"
              rows="4"
              :placeholder="t('excludeDomainsPlaceholder')"
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
            />
          </div>
        </section>

        <!-- Keyboard Shortcuts -->
        <section class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 class="font-medium text-sm text-gray-900 dark:text-gray-100">{{ t('keyboardShortcuts') }}</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ t('keyboardShortcutsDesc') }}</p>
          </div>
          <div class="px-5 py-4 flex items-center justify-between">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('manageShortcuts') }}
            </div>
            <button
              type="button"
              @click="openShortcuts"
              class="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              {{ t('openShortcuts') }}
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
              settings = {
                sniffingRules: {
                  streaming: { ...DEFAULT_SETTINGS.sniffingRules.streaming },
                  video:     { ...DEFAULT_SETTINGS.sniffingRules.video },
                  audio:     { ...DEFAULT_SETTINGS.sniffingRules.audio },
                  image:     { ...DEFAULT_SETTINGS.sniffingRules.image },
                },
                excludeDomains: [],
              }
              excludeDomainsText = ''
              triggerSave()
            }"
            class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            {{ t('resetToDefaults') }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>
