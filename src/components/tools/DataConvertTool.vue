<script setup lang="ts">
import { computed, ref } from 'vue'

type Format = 'json' | 'csv' | 'tsv'
const sourceFormat = ref<Format>('json')
const targetFormat = ref<Format>('csv')
const input = ref('[\n  { "name": "Alice", "department": "Design" },\n  { "name": "Bob", "department": "Product" }\n]')
const output = ref('')
const error = ref('')

const delimiterMap: Record<'csv' | 'tsv', string> = { csv: ',', tsv: '\t' }
const canSwap = computed(() => sourceFormat.value !== targetFormat.value)

function parseDelimited(text: string, delimiter: string): Record<string, string>[] {
  const rows = text.trim().split(/\r?\n/).map((row) => row.split(delimiter).map((cell) => cell.trim()))
  if (!rows.length) return []
  const headers = rows[0]
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])),
  )
}

function escapeCell(value: unknown, delimiter: string) {
  const text = value == null ? '' : String(value)
  if (text.includes(delimiter) || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

function toDelimited(rows: Record<string, unknown>[], delimiter: string) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  const body = rows.map((row) => headers.map((key) => escapeCell(row[key], delimiter)).join(delimiter))
  return [headers.join(delimiter), ...body].join('\n')
}

function convert() {
  error.value = ''
  try {
    let data: Record<string, unknown>[]
    if (sourceFormat.value === 'json') {
      const parsed = JSON.parse(input.value)
      data = Array.isArray(parsed) ? parsed : [parsed]
    } else {
      data = parseDelimited(input.value, delimiterMap[sourceFormat.value])
    }

    if (targetFormat.value === 'json') {
      output.value = JSON.stringify(data, null, 2)
    } else {
      output.value = toDelimited(data, delimiterMap[targetFormat.value])
    }
  } catch (e) {
    output.value = ''
    error.value = e instanceof Error ? e.message : '转换失败'
  }
}

function swapFormats() {
  if (!canSwap.value) return
  const previous = sourceFormat.value
  sourceFormat.value = targetFormat.value
  targetFormat.value = previous
  if (output.value) {
    input.value = output.value
    output.value = ''
  }
}

async function copyOutput() {
  if (output.value) await navigator.clipboard.writeText(output.value)
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">DATA</p>
        <h2>JSON / CSV / TSV</h2>
        <p>适合常见表格型文本数据的快速互转。</p>
      </div>
      <span class="privacy-chip">快速转换</span>
    </div>

    <div class="format-row">
      <select v-model="sourceFormat" class="text-input"><option value="json">JSON</option><option value="csv">CSV</option><option value="tsv">TSV</option></select>
      <button class="swap-button" type="button" @click="swapFormats">⇄</button>
      <select v-model="targetFormat" class="text-input"><option value="json">JSON</option><option value="csv">CSV</option><option value="tsv">TSV</option></select>
    </div>

    <div class="editor-grid">
      <label><span class="field-label">输入</span><textarea v-model="input" class="code-area" spellcheck="false"></textarea></label>
      <label><span class="field-label">输出</span><textarea v-model="output" class="code-area" readonly spellcheck="false"></textarea></label>
    </div>

    <p v-if="error" class="error-text">{{ error }}</p>
    <div class="tool-actions">
      <button class="button primary" type="button" @click="convert">开始转换</button>
      <button class="button ghost" type="button" :disabled="!output" @click="copyOutput">复制结果</button>
    </div>
  </div>
</template>
