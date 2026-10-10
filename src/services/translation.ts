export type TranslationLanguage = 'zh-CN' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru' | 'pt' | 'it' | 'ar'
export type TranslationSourceLanguage = TranslationLanguage | 'auto'
export type TranslationProvider = 'browser' | 'online' | 'same-language'

export interface TranslationResult {
  text: string
  provider: TranslationProvider
  sourceLanguage: TranslationLanguage
  targetLanguage: TranslationLanguage
}

export interface TranslationProgress {
  stage: 'detecting' | 'preparing' | 'downloading' | 'translating'
  progress?: number
}

export const translationLanguages = [
  { value: 'zh-CN', label: '中文（简体）' },
  { value: 'en', label: '英语' },
  { value: 'ja', label: '日语' },
  { value: 'ko', label: '韩语' },
  { value: 'fr', label: '法语' },
  { value: 'de', label: '德语' },
  { value: 'es', label: '西班牙语' },
  { value: 'ru', label: '俄语' },
  { value: 'pt', label: '葡萄牙语' },
  { value: 'it', label: '意大利语' },
  { value: 'ar', label: '阿拉伯语' },
] as const

export const translationSourceLanguages = [
  { value: 'auto', label: '自动检测' },
  ...translationLanguages,
] as const

type Availability = 'unavailable' | 'downloadable' | 'downloading' | 'available'

interface BrowserTranslator {
  translate(text: string): Promise<string>
  destroy?: () => void
}

interface BrowserTranslatorFactory {
  availability(options: { sourceLanguage: string; targetLanguage: string }): Promise<Availability>
  create(options: {
    sourceLanguage: string
    targetLanguage: string
    monitor?: (monitor: {
      addEventListener: (type: 'downloadprogress', listener: (event: { loaded: number }) => void) => void
    }) => void
  }): Promise<BrowserTranslator>
}

type TranslationGlobals = typeof globalThis & {
  Translator?: BrowserTranslatorFactory
}

const encoder = new TextEncoder()

function languageScore(text: string, expressions: RegExp[]) {
  return expressions.reduce((score, expression) => score + (text.match(expression)?.length ?? 0), 0)
}

export function detectTranslationLanguage(text: string): TranslationLanguage {
  if (/[぀-ヿ]/u.test(text)) return 'ja'
  if (/[가-힯]/u.test(text)) return 'ko'
  if (/[一-鿿]/u.test(text)) return 'zh-CN'
  if (/[Ѐ-ӿ]/u.test(text)) return 'ru'
  if (/[؀-ۿ]/u.test(text)) return 'ar'

  const normalized = ` ${text.toLowerCase()} `
  const scores: Array<[TranslationLanguage, number]> = [
    ['fr', languageScore(normalized, [/\b(le|la|les|des|une|est|avec|pour|vous|dans|pas|que|qui)\b/g, /[àâçéèêëîïôùûüÿœ]/g])],
    ['de', languageScore(normalized, [/\b(der|die|das|und|ist|mit|für|nicht|ein|eine|ich|sie)\b/g, /[äöüß]/g])],
    ['es', languageScore(normalized, [/\b(el|la|los|las|una|es|con|para|que|por|como|pero)\b/g, /[áéíóúñ¿¡]/g])],
    ['pt', languageScore(normalized, [/\b(o|a|os|as|uma|com|para|que|não|por|como|mas)\b/g, /[ãõáéíóúç]/g])],
    ['it', languageScore(normalized, [/\b(il|lo|la|gli|una|con|per|che|non|come|sono|della)\b/g, /[àèéìíîòóùú]/g])],
  ]
  scores.sort((a, b) => b[1] - a[1])
  return scores[0][1] >= 2 ? scores[0][0] : 'en'
}

function splitParagraphForOnline(paragraph: string, maxBytes = 430) {
  const chunks: string[] = []
  let current = ''

  for (const char of paragraph) {
    const next = current + char
    if (encoder.encode(next).length > maxBytes && current) {
      chunks.push(current)
      current = char
    } else {
      current = next
    }
  }

  if (current) chunks.push(current)
  return chunks
}

function onlineSegments(text: string) {
  const paragraphs = text.split(/(\n\s*\n)/)
  const output: Array<{ text: string; separator: boolean }> = []

  for (const paragraph of paragraphs) {
    if (/^\n\s*\n$/u.test(paragraph)) {
      output.push({ text: paragraph, separator: true })
      continue
    }
    if (!paragraph.trim()) {
      output.push({ text: paragraph, separator: true })
      continue
    }
    for (const chunk of splitParagraphForOnline(paragraph)) {
      output.push({ text: chunk, separator: false })
    }
  }
  return output
}

async function translateWithBrowser(
  text: string,
  sourceLanguage: TranslationLanguage,
  targetLanguage: TranslationLanguage,
  onProgress?: (progress: TranslationProgress) => void,
) {
  const translatorFactory = (globalThis as TranslationGlobals).Translator
  if (!translatorFactory) return null

  const availability = await translatorFactory.availability({ sourceLanguage, targetLanguage })
  if (availability === 'unavailable') return null

  onProgress?.({ stage: availability === 'available' ? 'preparing' : 'downloading', progress: availability === 'available' ? 1 : 0 })
  const translator = await translatorFactory.create({
    sourceLanguage,
    targetLanguage,
    monitor(monitor) {
      monitor.addEventListener('downloadprogress', (event) => {
        onProgress?.({ stage: 'downloading', progress: event.loaded })
      })
    },
  })

  try {
    onProgress?.({ stage: 'translating' })
    const parts = text.split(/(\n\s*\n)/)
    const translated: string[] = []
    for (const part of parts) {
      if (!part.trim() || /^\n\s*\n$/u.test(part)) {
        translated.push(part)
      } else {
        translated.push(await translator.translate(part))
      }
    }
    return translated.join('')
  } finally {
    translator.destroy?.()
  }
}

interface MyMemoryResponse {
  responseData?: {
    translatedText?: string
  }
  quotaFinished?: boolean
  responseStatus?: number | string
  responseDetails?: string
}

async function translateWithOnlineService(
  text: string,
  sourceLanguage: TranslationLanguage,
  targetLanguage: TranslationLanguage,
  onProgress?: (progress: TranslationProgress) => void,
) {
  const segments = onlineSegments(text)
  const translated: string[] = []
  const translateCount = segments.filter((segment) => !segment.separator).length
  let completed = 0

  for (const segment of segments) {
    if (segment.separator) {
      translated.push(segment.text)
      continue
    }

    onProgress?.({ stage: 'translating', progress: translateCount ? completed / translateCount : 0 })
    const query = new URLSearchParams({
      q: segment.text,
      langpair: `${sourceLanguage}|${targetLanguage}`,
      mt: '1',
    })
    const response = await fetch(`https://api.mymemory.translated.net/get?${query.toString()}`)
    if (!response.ok) throw new Error(`在线翻译服务暂时不可用（${response.status}）`)

    const data = await response.json() as MyMemoryResponse
    if (data.quotaFinished) throw new Error('在线翻译免费额度已用完，请稍后再试或使用支持本机翻译的桌面 Chrome。')
    if (!data.responseData?.translatedText) {
      throw new Error(data.responseDetails || '在线翻译没有返回结果。')
    }

    translated.push(data.responseData.translatedText)
    completed += 1
  }

  onProgress?.({ stage: 'translating', progress: 1 })
  return translated.join('')
}

export function translationLanguageLabel(language: TranslationLanguage | 'auto') {
  if (language === 'auto') return '自动检测'
  return translationLanguages.find((item) => item.value === language)?.label ?? language
}

export async function translateText(
  text: string,
  sourceLanguage: TranslationSourceLanguage,
  targetLanguage: TranslationLanguage,
  onProgress?: (progress: TranslationProgress) => void,
): Promise<TranslationResult> {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('请输入需要翻译的文本。')

  onProgress?.({ stage: 'detecting' })
  const detectedSource = sourceLanguage === 'auto' ? detectTranslationLanguage(trimmed) : sourceLanguage

  if (detectedSource === targetLanguage) {
    return {
      text,
      provider: 'same-language',
      sourceLanguage: detectedSource,
      targetLanguage,
    }
  }

  try {
    const browserText = await translateWithBrowser(text, detectedSource, targetLanguage, onProgress)
    if (browserText !== null) {
      return {
        text: browserText,
        provider: 'browser',
        sourceLanguage: detectedSource,
        targetLanguage,
      }
    }
  } catch {
    // Fall back to the public translation service when the local browser model is unavailable.
  }

  const onlineText = await translateWithOnlineService(text, detectedSource, targetLanguage, onProgress)
  return {
    text: onlineText,
    provider: 'online',
    sourceLanguage: detectedSource,
    targetLanguage,
  }
}
