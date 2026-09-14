<script setup lang="ts">
import { ref } from 'vue'
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'

const markdown = ref(`# Markdown 转 Word

将 Markdown 内容快速整理并导出为 Word 文档。

## 支持内容

- 一级到三级标题
- 无序列表
- 引用
- **粗体**、*斜体*、\`行内代码\`
- 普通段落

> 适合笔记、说明文档和常规内容整理。
`)
const filename = ref('markdown-export')
const status = ref('')

async function importMarkdown(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  markdown.value = await file.text()
  filename.value = file.name.replace(/\.md$/i, '') || 'markdown-export'
  status.value = `已载入 ${file.name}`
  input.value = ''
}

function inlineRuns(text: string): TextRun[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).filter(Boolean)
  return tokens.map((token) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return new TextRun({ text: token.slice(2, -2), bold: true })
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return new TextRun({ text: token.slice(1, -1), italics: true })
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return new TextRun({ text: token.slice(1, -1), font: 'Consolas', shading: { fill: 'E5E7EB' } })
    }
    return new TextRun(token)
  })
}

function buildParagraphs(source: string): Paragraph[] {
  return source.split(/\r?\n/).map((line) => {
    if (line.startsWith('### ')) {
      return new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 })
    }
    if (line.startsWith('## ')) {
      return new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 })
    }
    if (line.startsWith('# ')) {
      return new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 })
    }
    if (/^[-*+]\s+/.test(line)) {
      return new Paragraph({ children: inlineRuns(line.replace(/^[-*+]\s+/, '')), bullet: { level: 0 } })
    }
    if (line.startsWith('> ')) {
      return new Paragraph({
        children: [new TextRun({ text: line.slice(2), italics: true, color: '4B5563' })],
        indent: { left: 420 },
      })
    }
    return new Paragraph({ children: inlineRuns(line), spacing: { after: line ? 160 : 80 } })
  })
}

async function exportDocx() {
  status.value = '正在生成…'
  try {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: buildParagraphs(markdown.value),
        },
      ],
    })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename.value.trim() || 'markdown-export'}.docx`
    a.click()
    URL.revokeObjectURL(url)
    status.value = '已生成 Word 文件'
  } catch (error) {
    console.error(error)
    status.value = '生成失败，请检查内容后重试'
  }
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">文档转换</p>
        <h2>Markdown → Word</h2>
        <p>输入 Markdown，直接导出标准 DOCX 文件。</p>
      </div>
      <span class="privacy-chip">快速导出</span>
    </div>

    <div class="tool-actions import-row">
      <label class="button ghost file-button" for="markdown-file">导入 .md 文件</label>
      <input id="markdown-file" class="visually-hidden" type="file" accept=".md,text/markdown,text/plain" @change="importMarkdown" />
      <span class="status-text" role="status" aria-live="polite">{{ status }}</span>
    </div>

    <label class="field-label" for="doc-name">文件名</label>
    <input id="doc-name" v-model="filename" class="text-input" type="text" placeholder="markdown-export" />

    <label class="field-label" for="markdown-source">Markdown</label>
    <textarea id="markdown-source" v-model="markdown" class="code-area large" spellcheck="false"></textarea>

    <div class="tool-actions">
      <button class="button primary" type="button" @click="exportDocx">导出 .docx</button>
    </div>
  </div>
</template>
