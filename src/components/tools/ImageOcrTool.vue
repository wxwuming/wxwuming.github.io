<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { createWorker, OEM, PSM } from 'tesseract.js'
import UiSelect from '../UiSelect.vue'
import {
  translateText,
  translationLanguageLabel,
  translationLanguages,
  type TranslationLanguage,
  type TranslationSourceLanguage,
} from '../../services/translation'

const languageOptions = [
  { value: 'chi_sim+eng', label: '中文简体 + 英文' },
  { value: 'chi_sim', label: '中文简体' },
  { value: 'eng', label: '英文' },
] as const

const file = ref<File | null>(null)
const previewUrl = ref('')
const fileMeta = ref('')
const language = ref<(typeof languageOptions)[number]['value']>('chi_sim+eng')
const resultText = ref('')
const status = ref('')
const error = ref('')
const isDragging = ref(false)
const isRecognizing = ref(false)
const progress = ref(0)
const confidence = ref<number | null>(null)
const translatedText = ref('')
const translationTarget = ref<TranslationLanguage>('zh-CN')
const isTranslating = ref(false)
const translationStatus = ref('')

let dragDepth = 0
let recognitionRun = 0
let workerLanguage = ''
let activeWorker: Awaited<ReturnType<typeof createWorker>> | null = null

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function progressLabel(rawStatus: string) {
  const labels: Record<string, string> = {
    'loading tesseract core': '加载 OCR 引擎',
    'loaded tesseract core': 'OCR 引擎已加载',
    'initializing tesseract': '初始化 OCR 引擎',
    'initialized tesseract': 'OCR 引擎已就绪',
    'loading language traineddata': '下载语言模型',
    'loaded language traineddata': '语言模型已加载',
    'initializing api': '初始化识别模型',
    'initialized api': '识别模型已就绪',
    'recognizing text': '正在识别文字',
  }
  return labels[rawStatus] ?? '正在准备识别'
}

function handleWorkerProgress(message: { status: string; progress: number }) {
  if (!isRecognizing.value) return
  status.value = progressLabel(message.status)
  progress.value = Math.max(0, Math.min(100, Math.round((message.progress || 0) * 100)))
}

async function disposeWorker() {
  const worker = activeWorker
  activeWorker = null
  workerLanguage = ''
  if (worker) {
    try {
      await worker.terminate()
    } catch {
      // Worker may already be terminating after a cancelled recognition.
    }
  }
}

async function getWorker(runId: number) {
  if (activeWorker && workerLanguage === language.value) return activeWorker

  await disposeWorker()
  const languageKey = language.value
  const createdWorker = await createWorker(languageKey.split('+'), OEM.LSTM_ONLY, {
    logger: handleWorkerProgress,
  })

  if (runId !== recognitionRun) {
    await createdWorker.terminate()
    throw new Error('OCR_CANCELLED')
  }

  await createdWorker.setParameters({
    tessedit_pageseg_mode: PSM.AUTO,
    preserve_interword_spaces: '1',
    user_defined_dpi: '300',
  })

  activeWorker = createdWorker
  workerLanguage = languageKey
  return createdWorker
}

function revokePreview() {
  if (!previewUrl.value) return
  URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

async function cancelRecognition(silent = false) {
  recognitionRun += 1
  isRecognizing.value = false
  progress.value = 0
  await disposeWorker()
  if (!silent) status.value = '已停止识别'
}

async function loadFile(selected: File | null) {
  if (!selected) return
  error.value = ''

  if (isRecognizing.value) await cancelRecognition(true)

  const supported = /\.(png|jpe?g|webp|bmp)$/i.test(selected.name)
  if (!supported) {
    error.value = '请选择 PNG、JPG、JPEG、WebP 或 BMP 图片。'
    return
  }

  if (selected.size > 25 * 1024 * 1024) {
    error.value = '图片不能超过 25 MB，请先压缩后再识别。'
    return
  }

  revokePreview()
  file.value = selected
  previewUrl.value = URL.createObjectURL(selected)
  resultText.value = ''
  translatedText.value = ''
  translationStatus.value = ''
  confidence.value = null
  status.value = '图片已就绪'
  progress.value = 0
  fileMeta.value = formatFileSize(selected.size)

  const image = new Image()
  image.src = previewUrl.value
  try {
    await image.decode()
    fileMeta.value = `${image.naturalWidth}×${image.naturalHeight} · ${formatFileSize(selected.size)}`
  } catch {
    // Keep the file-size metadata if the browser cannot decode dimensions here.
  }
}

async function chooseFile(event: Event) {
  const input = event.target as HTMLInputElement
  const selected = input.files?.[0] ?? null
  await loadFile(selected)
  input.value = ''
}

function onDragEnter() {
  dragDepth += 1
  isDragging.value = true
}

function onDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) isDragging.value = false
}

async function onDrop(event: DragEvent) {
  dragDepth = 0
  isDragging.value = false
  await loadFile(event.dataTransfer?.files?.[0] ?? null)
}

function imageExtension(type: string) {
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/webp') return 'webp'
  if (type === 'image/bmp') return 'bmp'
  return 'png'
}

async function pasteScreenshot() {
  error.value = ''
  try {
    if (!navigator.clipboard?.read) {
      throw new Error('当前浏览器不支持直接读取剪贴板，请使用 Ctrl+V 粘贴截图。')
    }

    const items = await navigator.clipboard.read()
    for (const item of items) {
      const imageType = item.types.find((type) => type.startsWith('image/'))
      if (!imageType) continue

      const blob = await item.getType(imageType)
      const clipboardFile = new File(
        [blob],
        `screenshot-${new Date().toISOString().replace(/[:.]/g, '-') }.${imageExtension(imageType)}`,
        { type: imageType },
      )
      await loadFile(clipboardFile)
      status.value = '已从剪贴板读取截图'
      return
    }

    throw new Error('剪贴板中没有找到图片。')
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '读取剪贴板失败。'
  }
}

function handlePaste(event: ClipboardEvent) {
  const items = Array.from(event.clipboardData?.items ?? [])
  const imageItem = items.find((item) => item.type.startsWith('image/'))
  const pastedFile = imageItem?.getAsFile()
  if (!pastedFile) return

  event.preventDefault()
  const clipboardFile = new File(
    [pastedFile],
    `screenshot-${new Date().toISOString().replace(/[:.]/g, '-') }.${imageExtension(pastedFile.type)}`,
    { type: pastedFile.type },
  )
  void loadFile(clipboardFile).then(() => {
    status.value = '已粘贴截图'
  })
}

function ocrSourceLanguage(): TranslationSourceLanguage {
  if (language.value === 'chi_sim') return 'zh-CN'
  if (language.value === 'eng') return 'en'
  return 'auto'
}

function translationProgressText(stage: string, currentProgress?: number) {
  if (stage === 'detecting') return '正在判断原文语言'
  if (stage === 'preparing') return '正在准备本机翻译'
  if (stage === 'downloading') {
    return currentProgress !== undefined
      ? `正在下载翻译模型 · ${Math.round(currentProgress * 100)}%`
      : '正在下载翻译模型'
  }
  return currentProgress !== undefined
    ? `正在翻译 · ${Math.round(currentProgress * 100)}%`
    : '正在翻译'
}

async function translateRecognized(text = resultText.value) {
  if (!text.trim()) {
    error.value = '请先识别图片中的文字。'
    return ''
  }

  error.value = ''
  isTranslating.value = true
  translationStatus.value = '准备翻译'
  translatedText.value = ''

  try {
    const translation = await translateText(text, ocrSourceLanguage(), translationTarget.value, (current) => {
      translationStatus.value = translationProgressText(current.stage, current.progress)
    })
    translatedText.value = translation.text
    const providerLabel = translation.provider === 'browser'
      ? '本机翻译'
      : translation.provider === 'online'
        ? '在线翻译'
        : '无需翻译'
    translationStatus.value = `${providerLabel} · ${translationLanguageLabel(translation.sourceLanguage)} → ${translationLanguageLabel(translation.targetLanguage)}`
    return translation.text
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '翻译失败，请稍后再试。'
    translationStatus.value = ''
    return ''
  } finally {
    isTranslating.value = false
  }
}

async function recognizeImage(): Promise<string> {
  if (!file.value) {
    error.value = '请先选择需要识别的图片。'
    return ''
  }

  error.value = ''
  resultText.value = ''
  translatedText.value = ''
  translationStatus.value = ''
  confidence.value = null
  progress.value = 0
  isRecognizing.value = true
  status.value = '准备 OCR 引擎'

  const runId = ++recognitionRun
  try {
    const worker = await getWorker(runId)
    if (runId !== recognitionRun) return ''

    const response = await worker.recognize(file.value, { rotateAuto: true })
    if (runId !== recognitionRun) return ''

    resultText.value = response.data.text.trim()
    confidence.value = Math.round(response.data.confidence)
    progress.value = 100
    status.value = resultText.value ? '识别完成' : '未识别到可用文字'
    return resultText.value
  } catch (cause) {
    if (runId !== recognitionRun) return ''
    error.value = cause instanceof Error && cause.message !== 'OCR_CANCELLED'
      ? `识别失败：${cause.message}`
      : '识别已停止。'
    status.value = ''
    return ''
  } finally {
    if (runId === recognitionRun) isRecognizing.value = false
  }
}

async function recognizeAndTranslate() {
  const recognized = await recognizeImage()
  if (recognized) await translateRecognized(recognized)
}

async function copyResult() {
  if (!resultText.value) return
  await navigator.clipboard.writeText(resultText.value)
  status.value = '识别结果已复制'
}

async function copyTranslation() {
  if (!translatedText.value) return
  await navigator.clipboard.writeText(translatedText.value)
  translationStatus.value = '译文已复制'
}

function downloadTranslation() {
  if (!translatedText.value) return
  const blob = new Blob([translatedText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const baseName = file.value?.name.replace(/\.[^.]+$/, '') || 'ocr-translation'
  anchor.href = url
  anchor.download = `${baseName}-translated.txt`
  anchor.click()
  URL.revokeObjectURL(url)
  translationStatus.value = '译文 TXT 已下载'
}

function downloadResult() {
  if (!resultText.value) return
  const blob = new Blob([resultText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const baseName = file.value?.name.replace(/\.[^.]+$/, '') || 'ocr-result'
  anchor.href = url
  anchor.download = `${baseName}.txt`
  anchor.click()
  URL.revokeObjectURL(url)
  status.value = 'TXT 已下载'
}

async function clearFile() {
  if (isRecognizing.value) await cancelRecognition(true)
  revokePreview()
  file.value = null
  fileMeta.value = ''
  resultText.value = ''
  translatedText.value = ''
  translationStatus.value = ''
  confidence.value = null
  progress.value = 0
  status.value = ''
  error.value = ''
}

onMounted(() => window.addEventListener('paste', handlePaste))

onBeforeUnmount(() => {
  window.removeEventListener('paste', handlePaste)
  recognitionRun += 1
  revokePreview()
  void disposeWorker()
})
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">图片识别 / OCR</p>
        <h2>图片转文字</h2>
        <p>上传、拖入或直接粘贴截图，提取图片中的文字，并可一键翻译为目标语言。</p>
      </div>
      <span class="privacy-chip">图片本地识别</span>
    </div>

    <div class="ocr-workflow">
      <section class="ocr-upload-panel">
        <label
          class="drop-zone ocr-drop-zone"
          :class="{ 'drag-active': isDragging }"
          for="ocr-image-file"
          @dragenter.prevent="onDragEnter"
          @dragover.prevent
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
        >
          <input
            id="ocr-image-file"
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.bmp,image/png,image/jpeg,image/webp,image/bmp"
            @change="chooseFile"
          />
          <strong>{{ file ? '更换图片' : '点击或拖入图片' }}</strong>
          <span>支持 PNG / JPG / WebP / BMP，最大 25 MB，也可直接 Ctrl+V</span>
        </label>
        <button class="button ghost ocr-paste-button" type="button" @click="pasteScreenshot">从剪贴板粘贴截图</button>

        <div v-if="previewUrl" class="ocr-preview-card">
          <div class="ocr-preview-stage">
            <img :src="previewUrl" alt="待识别图片预览" />
          </div>
          <div class="ocr-file-meta">
            <span>
              <strong>{{ file?.name }}</strong>
              <small>{{ fileMeta }}</small>
            </span>
            <button type="button" @click="clearFile">移除</button>
          </div>
        </div>
      </section>

      <section class="utility-card ocr-settings-card">
        <div class="ocr-settings-heading">
          <span>识别设置</span>
          <small>OCR</small>
        </div>

        <label>
          <span class="field-label">文字语言</span>
          <UiSelect
            v-model="language"
            :options="languageOptions"
            aria-label="OCR 识别语言"
            :disabled="isRecognizing"
          />
        </label>

        <label>
          <span class="field-label">翻译为</span>
          <UiSelect
            v-model="translationTarget"
            :options="translationLanguages"
            aria-label="截图翻译目标语言"
            :disabled="isRecognizing || isTranslating"
          />
        </label>

        <div class="ocr-note">
          <strong>图片始终在浏览器内识别</strong>
          <span>首次 OCR 会下载语言模型；翻译优先使用浏览器本机能力，不支持时仅把识别出的文字发送到在线翻译服务。</span>
        </div>

        <div v-if="isRecognizing || progress > 0" class="ocr-progress" aria-live="polite">
          <div>
            <span>{{ status || '正在识别' }}</span>
            <strong>{{ progress }}%</strong>
          </div>
          <div class="ocr-progress-track" aria-hidden="true">
            <i :style="{ width: `${progress}%` }"></i>
          </div>
        </div>

        <div class="tool-actions ocr-primary-actions">
          <template v-if="!isRecognizing">
            <button
              class="button primary"
              type="button"
              :disabled="!file || isTranslating"
              @click="recognizeImage"
            >
              识别文字
            </button>
            <button
              class="button ghost"
              type="button"
              :disabled="!file || isTranslating"
              @click="recognizeAndTranslate"
            >
              识别并翻译
            </button>
          </template>
          <button v-else class="button ghost" type="button" @click="cancelRecognition()">
            停止识别
          </button>
          <span v-if="!isRecognizing && status" class="status-text" role="status">{{ status }}</span>
        </div>
      </section>
    </div>

    <section class="ocr-result-card">
      <div class="ocr-result-grid">
        <div class="ocr-result-pane">
          <div class="ocr-result-heading">
            <div>
              <span>识别原文</span>
              <small v-if="confidence !== null">平均置信度 {{ confidence }}%</small>
              <small v-else>完成识别后可在此编辑文本</small>
            </div>
            <div class="ocr-result-actions">
              <button class="button ghost compact-button" type="button" :disabled="!resultText" @click="copyResult">复制</button>
              <button class="button ghost compact-button" type="button" :disabled="!resultText" @click="downloadResult">下载</button>
            </div>
          </div>
          <textarea
            v-model="resultText"
            class="code-area ocr-result-area"
            spellcheck="false"
            placeholder="识别出的文字会显示在这里……"
          ></textarea>
        </div>

        <div class="ocr-result-pane">
          <div class="ocr-result-heading">
            <div>
              <span>截图译文</span>
              <small>{{ translationStatus || '识别后点击翻译即可生成译文' }}</small>
            </div>
            <div class="ocr-result-actions">
              <button
                class="button ghost compact-button"
                type="button"
                :disabled="!resultText || isTranslating"
                @click="translateRecognized()"
              >
                {{ isTranslating ? '翻译中…' : '翻译' }}
              </button>
              <button class="button ghost compact-button" type="button" :disabled="!translatedText" @click="copyTranslation">复制</button>
              <button class="button ghost compact-button" type="button" :disabled="!translatedText" @click="downloadTranslation">下载</button>
            </div>
          </div>
          <textarea
            v-model="translatedText"
            class="code-area ocr-result-area"
            spellcheck="false"
            placeholder="截图翻译结果会显示在这里……"
          ></textarea>
        </div>
      </div>
    </section>

    <p v-if="error" class="error-text" role="alert">{{ error }}</p>
  </div>
</template>
