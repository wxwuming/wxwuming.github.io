<script setup lang="ts">
import { ref } from 'vue'

const input = ref('')
const output = ref('')
const indent = ref(2)
const sortKeys = ref(false)
const error = ref('')

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, sortObject(item)]),
    )
  }
  return value
}

function parseInput() {
  const parsed = JSON.parse(input.value)
  return sortKeys.value ? sortObject(parsed) : parsed
}

function formatJson(compact = false) {
  error.value = ''
  try {
    const value = parseInput()
    const safeIndent = Math.min(8, Math.max(0, Math.floor(Number(indent.value) || 0)))
    indent.value = safeIndent
    output.value = JSON.stringify(value, null, compact ? 0 : safeIndent)
  } catch (reason) {
    output.value = ''
    error.value = reason instanceof Error ? reason.message : 'JSON 内容无法解析。'
  }
}

function replaceInput() {
  if (output.value) input.value = output.value
}

async function copyOutput() {
  if (output.value) await navigator.clipboard.writeText(output.value)
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">开发与调试</p>
        <h2>JSON 格式化</h2>
        <p>美化、压缩并可选按键名排序 JSON 数据，错误信息会直接显示在当前页面。</p>
      </div>
      <span class="privacy-chip">本地解析</span>
    </div>

    <div class="control-grid json-control-grid">
      <label>
        <span class="field-label">缩进空格（0–8）</span>
        <input v-model.number="indent" class="text-input narrow-input" type="number" min="0" max="8" />
      </label>
      <label class="option-line json-sort-option"><input v-model="sortKeys" type="checkbox" /> 按键名排序</label>
    </div>

    <div class="editor-grid utility-editor-grid">
      <label><span class="field-label">输入 JSON</span><textarea v-model="input" class="code-area" spellcheck="false" placeholder='{"name":"Wuming","enabled":true}'></textarea></label>
      <label><span class="field-label">处理结果</span><textarea v-model="output" class="code-area" readonly spellcheck="false"></textarea></label>
    </div>

    <p v-if="error" class="error-text" role="alert">{{ error }}</p>
    <div class="tool-actions">
      <button class="button primary" type="button" :disabled="!input.trim()" @click="formatJson(false)">格式化</button>
      <button class="button ghost" type="button" :disabled="!input.trim()" @click="formatJson(true)">压缩</button>
      <button class="button ghost" type="button" :disabled="!output" @click="copyOutput">复制结果</button>
      <button class="button ghost" type="button" :disabled="!output" @click="replaceInput">结果作为输入</button>
    </div>
  </div>
</template>
