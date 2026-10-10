<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Packer } from 'docx'
import { buildMarkdownDocument } from '../../utils/markdownToDocx'

const markdown = ref(`# Markdown 转 Word

将 Markdown 内容整理成真正的 Word 文档结构，而不是保留 Markdown 标记。

## 支持内容

| Markdown 内容 | Word 输出 |
| --- | --- |
| 标题 | Word 标题 1～6 |
| 表格 | 可编辑的 Word 表格 |
| 有序 / 无序列表 | Word 列表 |
| **粗体**、*斜体*、\`行内代码\` | 对应文字格式 |

> 还支持引用、代码块、链接、任务列表与分隔线。
`)
const filename = ref('markdown-export')
const status = ref('')
const loadedFileName = ref('')
const isDragging = ref(false)
const previewHost = ref<HTMLElement | null>(null)
const previewStatus = ref('')
const isPreviewing = ref(false)
let dragDepth = 0
let previewTimer: number | undefined
let previewVersion = 0
let previewModulePromise: Promise<typeof import('docx-preview')> | undefined

function loadPreviewModule() {
  previewModulePromise ??= import('docx-preview')
  return previewModulePromise
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function isMarkdownFile(file: File) {
  return /\.(md|markdown)$/i.test(file.name) || ['text/markdown', 'text/plain'].includes(file.type)
}

async function loadMarkdownFile(file: File) {
  if (!isMarkdownFile(file)) {
    status.value = '请选择 .md 或 .markdown 文件'
    return
  }

  try {
    markdown.value = await file.text()
    filename.value = file.name.replace(/\.(md|markdown)$/i, '') || 'markdown-export'
    loadedFileName.value = file.name
    status.value = `已载入 ${file.name} · ${formatFileSize(file.size)}`
  } catch (error) {
    console.error(error)
    status.value = '文件读取失败，请重新选择'
  }
}

async function importMarkdown(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await loadMarkdownFile(file)
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

async function dropMarkdown(event: DragEvent) {
  dragDepth = 0
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) await loadMarkdownFile(file)
}

async function renderWordPreview() {
  const host = previewHost.value
  if (!host) return

  if (!markdown.value.trim()) {
    previewVersion += 1
    host.replaceChildren()
    previewStatus.value = '输入 Markdown 后将在这里显示 Word 预览'
    isPreviewing.value = false
    return
  }

  const version = ++previewVersion
  isPreviewing.value = true
  previewStatus.value = '正在生成 Word 预览…'

  try {
    const outputName = filename.value.trim() || 'markdown-export'
    const doc = buildMarkdownDocument(markdown.value, outputName)
    const blob = await Packer.toBlob(doc)
    if (version !== previewVersion || !previewHost.value) return

    const { renderAsync } = await loadPreviewModule()
    if (version !== previewVersion || !previewHost.value) return

    previewHost.value.replaceChildren()
    await renderAsync(blob, previewHost.value, previewHost.value, {
      inWrapper: true,
      breakPages: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      useBase64URL: true,
      experimental: true,
    })

    if (version === previewVersion) previewStatus.value = '预览已更新'
  } catch (error) {
    console.error(error)
    if (version === previewVersion) {
      previewStatus.value = '预览生成失败，请检查 Markdown 内容'
      previewHost.value?.replaceChildren()
    }
  } finally {
    if (version === previewVersion) isPreviewing.value = false
  }
}

function schedulePreview() {
  if (previewTimer !== undefined) window.clearTimeout(previewTimer)
  previewTimer = window.setTimeout(() => {
    previewTimer = undefined
    void renderWordPreview()
  }, 450)
}

watch([markdown, filename], schedulePreview)

onMounted(() => {
  void nextTick(renderWordPreview)
})

onBeforeUnmount(() => {
  previewVersion += 1
  if (previewTimer !== undefined) window.clearTimeout(previewTimer)
})

async function exportDocx() {
  if (!markdown.value.trim()) {
    status.value = '请先输入或导入 Markdown 内容'
    return
  }

  status.value = '正在生成 Word…'
  try {
    const outputName = filename.value.trim() || 'markdown-export'
    const doc = buildMarkdownDocument(markdown.value, outputName)
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${outputName}.docx`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    status.value = `已生成 ${outputName}.docx`
  } catch (error) {
    console.error(error)
    status.value = '生成失败，请检查 Markdown 内容后重试'
  }
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">文档转换</p>
        <h2>Markdown → Word</h2>
        <p>将标题、表格、列表和文字样式转换为可编辑的 Word 文档结构。</p>
      </div>
      <span class="privacy-chip">本地处理</span>
    </div>

    <label
      class="drop-zone markdown-drop-zone"
      :class="{ 'is-dragging': isDragging }"
      for="markdown-file"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent
      @dragleave.prevent="onDragLeave"
      @drop.prevent="dropMarkdown"
    >
      <input
        id="markdown-file"
        type="file"
        accept=".md,.markdown,text/markdown,text/plain"
        @change="importMarkdown"
      />
      <strong>{{ loadedFileName || '拖动 Markdown 文件到这里，或点击选择文件' }}</strong>
      <span>{{ loadedFileName ? '可继续编辑下方内容，重新选择文件会替换当前文本' : '支持 .md / .markdown，文件只在浏览器本地读取' }}</span>
    </label>

    <div class="markdown-convert-note" aria-label="转换支持范围">
      <span>标题 1～6</span>
      <span>Word 表格</span>
      <span>有序 / 无序列表</span>
      <span>粗体 / 斜体 / 代码</span>
      <span>引用 / 链接 / 任务列表</span>
    </div>

    <label class="field-label" for="doc-name">导出文件名</label>
    <input id="doc-name" v-model="filename" class="text-input" type="text" placeholder="markdown-export" />

    <label class="field-label" for="markdown-source">Markdown 内容</label>
    <textarea id="markdown-source" v-model="markdown" class="code-area large" spellcheck="false"></textarea>

    <section class="word-preview-section" aria-labelledby="word-preview-title">
      <div class="word-preview-toolbar">
        <div>
          <span class="field-label preview-label" id="word-preview-title">Word 预览</span>
          <span class="preview-hint">预览由即将下载的 DOCX 文件直接渲染</span>
        </div>
        <div class="preview-toolbar-actions">
          <span class="status-text" role="status" aria-live="polite">{{ previewStatus }}</span>
          <button class="button ghost preview-refresh" type="button" :disabled="isPreviewing" @click="renderWordPreview">
            {{ isPreviewing ? '生成中…' : '刷新预览' }}
          </button>
        </div>
      </div>
      <div class="word-preview-viewport" :class="{ 'is-loading': isPreviewing }">
        <div ref="previewHost" class="word-preview-host"></div>
      </div>
    </section>

    <div class="tool-actions markdown-actions">
      <button class="button primary" type="button" @click="exportDocx">转换并下载 Word</button>
      <span class="status-text" role="status" aria-live="polite">{{ status }}</span>
    </div>
  </div>
</template>

<style scoped>
.markdown-drop-zone.is-dragging {
  border-color: #53635d;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(83, 99, 93, .1);
  transform: translateY(-1px);
}

.markdown-drop-zone.is-dragging::before {
  content: '↓';
  color: #35413d;
}

.markdown-convert-note {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0 4px;
}

.markdown-convert-note span {
  padding: 5px 9px;
  border: 1px solid #dfe2dc;
  border-radius: 999px;
  background: #f7f8f3;
  color: #47514d;
  font-size: 12px;
  line-height: 1.3;
}

.word-preview-section {
  margin-top: 22px;
}

.word-preview-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 10px;
}

.word-preview-toolbar > div:first-child {
  display: grid;
  gap: 4px;
}

.preview-label {
  margin: 0;
}

.preview-hint {
  color: #59625f;
  font-size: 12px;
}

.preview-toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-width: 0;
}

.preview-refresh {
  flex: 0 0 auto;
}

.word-preview-viewport {
  position: relative;
  min-height: 360px;
  max-height: 760px;
  overflow: auto;
  padding: 24px;
  border: 1px solid #d8dcd5;
  border-radius: 12px;
  background: #e9ebe7;
  transition: opacity .18s ease, border-color .18s ease;
}

.word-preview-viewport.is-loading {
  opacity: .72;
}

.word-preview-host {
  width: max-content;
  min-width: 100%;
  margin: 0 auto;
}

.word-preview-host:empty {
  min-height: 310px;
}

.word-preview-host:empty::before {
  content: '正在准备 Word 预览…';
  display: grid;
  min-height: 310px;
  place-items: center;
  color: #66706c;
  font-size: 13px;
}

.word-preview-host :deep(.docx-wrapper) {
  padding: 0;
  background: transparent;
}

.word-preview-host :deep(.docx-wrapper > section.docx) {
  margin: 0 auto 20px;
  box-shadow: 0 10px 32px rgba(23, 31, 28, .12);
}

.markdown-actions {
  align-items: center;
}

@media (max-width: 640px) {
  .word-preview-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .preview-toolbar-actions {
    width: 100%;
    justify-content: space-between;
  }

  .word-preview-viewport {
    min-height: 300px;
    padding: 14px;
  }

  .word-preview-host:empty,
  .word-preview-host:empty::before {
    min-height: 270px;
  }

  .markdown-actions {
    align-items: flex-start;
  }
}
</style>
