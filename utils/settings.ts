export interface SniffingGroups {
  streaming: boolean
  video: boolean
  audio: boolean
  image: boolean
}

export interface Settings {
  sniffingGroups: SniffingGroups
  minSizeKB: number
  customExtensions: string[]
  excludeDomains: string[]
  language: 'auto' | 'en' | 'zh_CN'
}

export const DEFAULT_SETTINGS: Settings = {
  sniffingGroups: {
    streaming: true,
    video: true,
    audio: true,
    image: false,
  },
  minSizeKB: 0,
  customExtensions: [],
  excludeDomains: [],
  language: 'auto',
}

const SETTINGS_KEY = 'ext_settings'

export async function loadSettings(): Promise<Settings> {
  const result = await browser.storage.sync.get(SETTINGS_KEY)
  const stored = result[SETTINGS_KEY] as any
  if (!stored || typeof stored !== 'object') return { ...DEFAULT_SETTINGS }
  return {
    sniffingGroups: {
      ...DEFAULT_SETTINGS.sniffingGroups,
      ...(stored.sniffingGroups ?? {}),
    },
    minSizeKB: typeof stored.minSizeKB === 'number' ? stored.minSizeKB : DEFAULT_SETTINGS.minSizeKB,
    customExtensions: Array.isArray(stored.customExtensions) ? stored.customExtensions : [],
    excludeDomains: Array.isArray(stored.excludeDomains) ? stored.excludeDomains : [],
    language: stored.language ?? DEFAULT_SETTINGS.language,
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.sync.set({ [SETTINGS_KEY]: settings })
}

export const STREAMING_FORMATS = ['m3u8', 'mpd']
export const VIDEO_FORMATS = ['mp4', 'webm', 'ogv', 'flv', 'mkv', 'mov', 'avi', '3gp', '3g2', 'ts', 'mpeg']
export const AUDIO_FORMATS = ['mp3', 'm4a', 'oga', 'weba', 'wav', 'flac', 'aac']
export const IMAGE_FORMATS = ['gif', 'jpg', 'png', 'webp', 'svg']

export function getFormatGroup(format: string): keyof SniffingGroups | null {
  const f = format.toLowerCase()
  if (STREAMING_FORMATS.includes(f)) return 'streaming'
  if (VIDEO_FORMATS.includes(f)) return 'video'
  if (AUDIO_FORMATS.includes(f)) return 'audio'
  if (IMAGE_FORMATS.includes(f)) return 'image'
  return null
}

export function isFormatAllowed(format: string, settings: Settings): boolean {
  const f = format.toLowerCase()
  const customExts = settings.customExtensions.map(e => e.toLowerCase().replace(/^\./, ''))
  if (customExts.includes(f)) return true
  const group = getFormatGroup(f)
  if (!group) return false
  return settings.sniffingGroups[group]
}

export function isDomainExcluded(url: string, settings: Settings): boolean {
  if (!settings.excludeDomains.length) return false
  try {
    const hostname = new URL(url).hostname
    return settings.excludeDomains.some(domain => {
      const d = domain.trim().toLowerCase()
      if (!d) return false
      return hostname === d || hostname.endsWith('.' + d)
    })
  } catch {
    return false
  }
}
