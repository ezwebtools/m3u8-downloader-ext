import { isM3U8 } from '../utils/detect'
import { loadAllTabData, saveTabList, deleteTabList } from '../utils/storage'

// 语言映射配置
const LANGUAGE_MAP: Record<string, string> = {
  'zh_CN': 'zh-CN',
  'en': 'en-us',
  // 可以添加更多语言映射
}

// 默认语言（不添加语言代码）
const DEFAULT_LANGUAGE = 'en'

// 基础URL配置
const URL_CONFIG = {
  welcome: 'https://example.com',
  changelog: 'https://example.com/changelog',
  uninstallFeedback: 'https://example.com/uninstall-feedback'
}

// 获取用户语言代码
function getUserLanguage(): string {
  // 首先尝试从浏览器UI语言获取
  const uiLanguage = browser.i18n.getUILanguage()
  console.log('Browser UI language:', uiLanguage)
  
  // 标准化语言代码（例如：zh-CN -> zh_CN）
  const normalizedLang = uiLanguage.replace('-', '_')
  return normalizedLang
}

// 根据语言构建URL
function buildUrl(baseUrl: string, language: string): string {
  // 如果是默认语言，不添加语言代码
  if (language === DEFAULT_LANGUAGE) {
    return baseUrl
  }
  
  // 检查语言是否在映射表中
  const mappedLang = LANGUAGE_MAP[language]
  if (mappedLang) {
    // 确保URL以斜杠结尾，然后添加语言代码
    const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
    return url + mappedLang
  }
  
  // 如果语言不在映射表中，使用默认语言（不添加语言代码）
  console.log(`Language ${language} not in language map, using default language`)
  return baseUrl
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed/updated:', details.reason)
    
    // 获取用户语言
    const userLanguage = getUserLanguage()
    console.log('User language:', userLanguage)
    
    if (details.reason === 'install') {
      const welcomeUrl = buildUrl(URL_CONFIG.welcome, userLanguage)
      browser.tabs.create({ url: welcomeUrl })
      console.log('Opened welcome page:', welcomeUrl)
    } else if (details.reason === 'update') {
      const changelogUrl = buildUrl(URL_CONFIG.changelog, userLanguage)
      browser.tabs.create({ url: changelogUrl })
      console.log('Opened changelog page:', changelogUrl)
    }
  })

  // 卸载反馈URL也需要支持多语言
  const userLanguage = getUserLanguage()
  const uninstallUrl = buildUrl(URL_CONFIG.uninstallFeedback, userLanguage)
  browser.runtime.setUninstallURL(uninstallUrl)
  console.log('Set uninstall URL:', uninstallUrl)

  const tabMap = new Map<number, Set<string>>()
  let isDataLoaded = false
  const pendingMessages: Array<{msg: any, sender: any, sendResponse: (response?: any) => void}> = []

  loadAllTabData().then(data => {
    console.log('Background: Data loaded, tab count:', data.size)
    data.forEach((set, tabId) => {
      console.log(`Background: Tab ${tabId} has ${set.size} items`)
      tabMap.set(tabId, set)
    })
    isDataLoaded = true
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      if (tabs[0]?.id) {
        console.log(`Background: Updating badge for tab ${tabs[0].id}`)
        updateBadge(tabs[0].id)
      }
    })
    
    console.log(`Background: Processing ${pendingMessages.length} pending messages`)
    pendingMessages.forEach(({msg, sender, sendResponse}) => {
      handleMessage(msg, sender, sendResponse)
    })
    pendingMessages.length = 0
  })

  browser.tabs.onRemoved.addListener((tabId) => {
    tabMap.delete(tabId)
    deleteTabList(tabId)
  })

  browser.webRequest.onCompleted.addListener(
    (details) => {
      if (details.tabId > 0 && isM3U8(details.url)) {
        addM3U8(details.url, details.tabId)
      }
    },
    { urls: ['<all_urls>'], types: ['media', 'xmlhttprequest', 'other'] },
  )

  browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!isDataLoaded) {
      pendingMessages.push({msg, sender, sendResponse})
      return true
    }
    return handleMessage(msg, sender, sendResponse)
  })

  function handleMessage(msg: any, sender: any, sendResponse: (response?: any) => void) {
    console.log('Background: Received message:', msg.type, 'from tab:', sender.tab?.id)
    
    if (msg.type === 'M3U8_FOUND') {
      const tabId = msg.tabId || sender.tab?.id
      console.log('Background: M3U8_FOUND for tab', tabId, 'url:', msg.url)
      if (tabId) addM3U8(msg.url, tabId)
    }

    if (msg.type === 'GET_LIST') {
      const tabId = msg.tabId as number
      const list = [...(tabMap.get(tabId) ?? [])]
      console.log('Background: GET_LIST for tab', tabId, 'returning', list.length, 'items')
      sendResponse(list)
      return true
    }

    if (msg.type === 'CLEAR_LIST') {
      const tabId = msg.tabId as number
      console.log('Background: CLEAR_LIST for tab', tabId)
      tabMap.delete(tabId)
      deleteTabList(tabId)
      updateBadge(tabId)
      broadcast(tabId, [])
    }

    if (msg.type === 'GET_CURRENT_TAB') {
      return Promise.resolve(sender.tab)
    }
    return false
  }

  function addM3U8(url: string, tabId: number) {
    console.log('Background: addM3U8 for tab', tabId, 'url:', url)
    if (!tabMap.has(tabId)) {
      console.log('Background: Creating new set for tab', tabId)
      tabMap.set(tabId, new Set())
    }
    const set = tabMap.get(tabId)!
    if (set.has(url)) {
      console.log('Background: URL already exists for tab', tabId)
      return
    }
    set.add(url)
    const list = [...set]
    console.log('Background: Tab', tabId, 'now has', list.length, 'items')
    saveTabList(tabId, list)
    updateBadge(tabId)
    broadcast(tabId, list)
  }

  function updateBadge(tabId: number) {
    const count = tabMap.get(tabId)?.size ?? 0
    console.log('Background: updateBadge for tab', tabId, 'count:', count)
    browser.action.setBadgeText({ text: count > 0 ? count.toString() : '', tabId })
    browser.action.setBadgeTextColor({ color: '#FFFFFF', tabId })
    browser.action.setBadgeBackgroundColor({ color: '#3B82F6', tabId })
  }

  function broadcast(tabId: number, list: string[]) {
    browser.runtime.sendMessage({ type: 'LIST_UPDATED', tabId, list }).catch(() => {})
  }
})
