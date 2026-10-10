<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { PdfWordMode } from '../../utils/pdfWordConvert'

type Direction = 'pdf-to-word' | 'word-to-pdf'

const direction = ref<Direction>('pdf-to-word')
const mode = ref<PdfWordMode>('editable')
const file = ref<File | null>(null)
const filename = ref('')
const isDragging = ref(false)
const converting = ref(false)
const percent = ref(0)
const status = ref('')
const error = ref('')
const finishedBlob = ref<Blob | null>(null)
let dragDepth = 0
let downloadUrl = ''

const targetExtension = computed(() => direction.value === 'pdf-to-word' ? '.docx' : '.pdf')
const outputName = computed(() => `${filename.value.trim() || 'converted'}${targetExtension.value}`)
const chosenLabel = computed(() => file.value
  ? `${file.value.name} · ${formatFileSize(file.value.size)}`
  : '拖入文件或点击选择文件')

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function clearResult() {
  finishedBlob.value = null
  percent.value = 0
  error.value = ''
  status.value = ''
  if (downloadUrl) {
    URL.revokeObjectURL(downloadUrl)
    downloadUrl = ''
  }
}

watch(mode, clearResult)

function useDirection(value: Direction) {
  if (converting.value || direction.value === value) return
  file.value = null
  filename.value = ''
  clearResult()
  direction.value = value
}

function validateAndLoad(selected: File | null) {
  if (!selected || converting.value) return
  const ext = /\.(pdf|docx)$/i.exec(selected.name)?.[1]?.toLowerCase()
  if (ext === 'pdf') direction.value = 'pdf-to-word'
  if (ext === 'docx') direction.value = 'word-to-pdf'
  clearResult()
  if (ext !== 'pdf' && ext !== 'docx') {
    file.value = null
    error.value = '请选择 PDF（.pdf）或 Word（.docx）文件，暂不支持旧版 .doc 格式。'
    return
  }
  const limit = ext === 'pdf' ? 35 : 20
  if (selected.size === 0 || selected.size > limit * 1024 * 1024) {
    file.value = null
    error.value = `文件需大于 0 且不超过 ${limit} MB。`
    return
  }
  file.value = selected
  filename.value = selected.name.replace(/\.(pdf|docx)$/i, '') || 'converted'
  status.value = '文件已就绪，可以开始转换'
}

function chooseFile(event: Event) {
  const input = event.target as HTMLInputElement
  validateAndLoad(input.files?.[0] ?? null)
  input.value = ''
}

function onDragEnter() {
  if (converting.value) return
  dragDepth += 1
  isDragging.value = true
}

function onDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1)
  if (!dragDepth) isDragging.value = false
}

function onDrop(event: DragEvent) {
  dragDepth = 0
  isDragging.value = false
  validateAndLoad(event.dataTransfer?.files?.[0] ?? null)
}

async function convert() {
  if (converting.value) return
  if (!file.value) {
    error.value = '请先选择要转换的文件。'
    return
  }
  if (!filename.value.trim() || /[\\/:*?"<>|]/.test(filename.value)) {
    error.value = '请输入有效的导出文件名，不要包含特殊路径字符。'
    return
  }

  const source = file.value
  const currentDirection = direction.value
  clearResult()
  converting.value = true
  status.value = '正在准备转换引擎…'
  try {
    const { pdfToWord, wordToPdf } = await import('../../utils/pdfWordConvert')
    const onProgress = (current: number, total: number, message: string) => {
      percent.value = total ? Math.round(current / total * 100) : 0
      status.value = message
    }
    const blob = currentDirection === 'pdf-to-word'
      ? await pdfToWord(source, mode.value, onProgress)
      : await wordToPdf(source, onProgress)
    if (!blob.size) throw new Error('转换结果为空，请确认文件内容。')
    finishedBlob.value = blob
    percent.value = 100
    status.value = '转换完成，文件已可下载'
    download()
  } catch (caught) {
    console.error(caught)
    error.value = caught instanceof Error ? caught.message : '转换失败，请确认文件内容后重试。'
    status.value = ''
  } finally {
    converting.value = false
  }
}

function download() {
  if (!finishedBlob.value) return
  if (downloadUrl) URL.revokeObjectURL(downloadUrl)
  downloadUrl = URL.createObjectURL(finishedBlob.value)
  const anchor = document.createElement('a')
  anchor.href = downloadUrl
  anchor.download = outputName.value
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

onBeforeUnmount(() => {
  if (downloadUrl) URL.revokeObjectURL(downloadUrl)
})
</script>

<template>
  <div class="tool-panel pdf-word-tool">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">文档转换</p>
        <h2>PDF ↔ Word</h2>
        <p>在浏览器中转换 PDF 与 Word 文档，支持可编辑文本提取与页面版式保留。</p>
      </div>
      <span class="privacy-chip">本地处理</span>
    </div>

    <div class="direction-switch" role="group" aria-label="转换方向">
      <button
        type="button"
        :disabled="converting"
        :class="{ active: direction === 'pdf-to-word' }"
        :aria-pressed="direction === 'pdf-to-word'"
        @click="useDirection('pdf-to-word')"
      >PDF 转 Word <small>PDF → DOCX</small></button>
      <button
        type="button"
        :disabled="converting"
        :class="{ active: direction === 'word-to-pdf' }"
        :aria-pressed="direction === 'word-to-pdf'"
        @click="useDirection('word-to-pdf')"
      >Word 转 PDF <small>DOCX → PDF</small></button>
    </div>

    <label
      class="drop-zone document-drop-zone"
      :class="{ 'is-dragging': isDragging, 'has-file': !!file, 'is-disabled': converting }"
      for="document-input"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <input
        id="document-input"
        type="file"
        :accept="direction === 'pdf-to-word' ? '.pdf,application/pdf' : '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'"
        :disabled="converting"
        @change="chooseFile"
      />
      <strong>{{ chosenLabel }}</strong>
      <span>支持 .pdf / .docx，拖入文件时会自动识别转换方向</span>
      <span v-if="!file">PDF 最大 35 MB，Word 最大 20 MB</span>
    </label>

    <div v-if="direction === 'pdf-to-word'" class="conversion-settings">
      <div class="setting-heading">
        <strong>Word 转换方式</strong>
        <span>根据后续用途选择</span>
      </div>
      <div class="mode-grid" role="group" aria-label="PDF 转 Word 模式">
        <label class="mode-card" :class="{ active: mode === 'editable' }">
          <input v-model="mode" type="radio" value="editable" :disabled="converting" />
          <span><strong>提取可编辑文字</strong><small>将 PDF 文字整理为可修改的 Word 段落。适合文字版 PDF，复杂排版可能变化。</small></span>
        </label>
        <label class="mode-card" :class="{ active: mode === 'visual' }">
          <input v-model="mode" type="radio" value="visual" :disabled="converting" />
          <span><strong>保留页面外观</strong><small>逐页保存为 Word 页面图像，适合扫描件或复杂排版，但页面文字不可直接编辑。</small></span>
        </label>
      </div>
    </div>
    <p v-else class="conversion-note">
      Word 将先按浏览器排版生成页面，再导出为 PDF。生成的 PDF 主要保留视觉效果，文字以页面图像呈现；复杂字体、自动分页或浮动元素可能与 Word 不完全一致。
    </p>

    <div class="export-setting">
      <label class="field-label" for="converted-file-name">导出文件名</label>
      <div class="filename-field">
        <input
          id="converted-file-name"
          v-model="filename"
          class="text-input"
          type="text"
          :disabled="converting"
          maxlength="120"
          placeholder="converted"
          autocomplete="off"
        />
        <span>{{ targetExtension }}</span>
      </div>
    </div>

    <div class="tool-actions conversion-actions">
      <button class="button primary" type="button" :disabled="!file || converting" @click="convert">
        {{ converting ? '转换处理中…' : `转换并下载 ${direction === 'pdf-to-word' ? 'Word' : 'PDF'}` }}
      </button>
      <button v-if="finishedBlob" class="button ghost" type="button" @click="download">
        再次下载
      </button>
    </div>

    <div v-if="converting" class="conversion-progress" role="status" aria-live="polite">
      <div class="progress-info"><span>{{ status }}</span><strong>{{ percent }}%</strong></div>
      <div class="progress-track"><div :style="{ width: `${percent}%` }"></div></div>
    </div>
    <p v-else-if="status" class="conversion-status" role="status">{{ status }}<span v-if="finishedBlob"> · {{ formatFileSize(finishedBlob.size) }}</span></p>
    <p v-if="error" class="error-text" role="alert">{{ error }}</p>

    <div class="conversion-footer">
      <span>文件仅在当前浏览器内读取和转换，不上传至服务器。</span>
      <span>转换页数上限：80 页</span>
    </div>
  </div>
</template>

<style scoped>
.direction-switch { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 22px; }
.direction-switch button { min-height: 80px; padding: 14px; border: 1px solid #d9ddd6; border-radius: 12px; background: #f8f8f4; color: #3b4541; display: grid; justify-items: start; align-content: center; gap: 5px; font-size: 15px; font-weight: 700; text-align: left; transition: border-color .2s, background .2s; }
.direction-switch button small { color: #6a7470; font-size: 11px; font-weight: 500; }
.direction-switch button.active { border-color: #283830; background: #e9efe1; color: #1c2924; box-shadow: inset 0 0 0 1px #283830; }
.direction-switch button:focus-visible, .mode-card:focus-within { outline: 3px solid #becbaa; outline-offset: 2px; }
.document-drop-zone { padding: 22px 18px; min-height: 175px; }
.document-drop-zone.is-dragging { border-color: #53635d; background: #eaf0e5; box-shadow: 0 0 0 4px rgba(83, 99, 93, .1); }
.document-drop-zone.has-file { border-style: solid; border-color: #9cba8f; background: #f5f9ef; }
.document-drop-zone.is-disabled { opacity: .7; cursor: wait; }
.document-drop-zone strong { word-break: break-word; max-width: 100%; font-size: 14px; }
.conversion-settings { margin-top: 26px; }
.setting-heading { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; margin-bottom: 12px; }
.setting-heading strong { font-size: 14px; color: #26312d; }
.setting-heading span { font-size: 12px; color: #5d6863; }
.mode-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.mode-card { min-width: 0; display: flex; gap: 10px; align-items: flex-start; padding: 15px 13px; border: 1px solid #d8dcd5; border-radius: 12px; background: #f8f8f4; cursor: pointer; }
.mode-card.active { border-color: #637e5a; background: #f0f6e9; }
.mode-card input { flex: 0 0 auto; margin: 3px 0; accent-color: #263a2d; }
.mode-card span { min-width: 0; display: grid; gap: 7px; }
.mode-card strong { color: #29352f; font-size: 13px; }
.mode-card small { color: #53615a; font-size: 12px; line-height: 1.7; }
.conversion-note { margin: 22px 0 0; padding: 15px; border: 1px solid #d9ddd6; border-radius: 10px; background: #f8f8f4; color: #53615a; font-size: 13px; line-height: 1.8; }
.export-setting { margin-top: 23px; }
.export-setting .field-label { display: block; margin-bottom: 9px; }
.filename-field { display: flex; align-items: center; border: 1px solid #d8dcd5; border-radius: 10px; background: #f8f8f4; overflow: hidden; }
.filename-field:focus-within { border-color: #7f8a85; box-shadow: 0 0 0 4px rgba(83,99,93,.09); }
.filename-field input { flex: 1; min-width: 0; border: 0; outline: none; box-shadow: none; background: transparent; }
.filename-field input:focus { box-shadow: none; background: transparent; }
.filename-field span { padding: 0 14px; color: #59655e; font-size: 13px; white-space: nowrap; }
.conversion-actions { margin-top: 24px; }
.conversion-progress { margin-top: 21px; }
.progress-info { display: flex; justify-content: space-between; gap: 12px; color: #4c5a52; font-size: 12px; }
.progress-info strong { font-variant-numeric: tabular-nums; }
.progress-track { height: 7px; overflow: hidden; margin-top: 9px; border-radius: 8px; background: #e2e7df; }
.progress-track div { height: 100%; border-radius: inherit; background: #5c874c; transition: width .15s; }
.conversion-status { margin: 17px 0 0; color: #3a6c39; font-size: 13px; }
.conversion-footer { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 9px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0e4dd; color: #606b65; font-size: 12px; line-height: 1.6; }
@media (max-width: 640px) { .mode-grid { grid-template-columns: 1fr; } .direction-switch button { min-height: 73px; } .setting-heading { flex-direction: column; gap: 3px; } }
</style>
