<script setup lang="ts">
import { ref } from 'vue'
import { parse, stringify } from 'yaml'

const input = ref('')
const output = ref('')
const error = ref('')
const mode = ref<'json-yaml' | 'yaml-json'>('json-yaml')

function convert(nextMode = mode.value) {
  mode.value = nextMode
  error.value = ''
  output.value = ''
  try {
    if (!input.value.trim()) return
    if (nextMode === 'json-yaml') {
      output.value = stringify(JSON.parse(input.value))
    } else {
      output.value = JSON.stringify(parse(input.value), null, 2)
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '转换失败，请检查输入格式。'
  }
}

function swap() {
  if (!output.value) return
  input.value = output.value
  output.value = ''
  mode.value = mode.value === 'json-yaml' ? 'yaml-json' : 'json-yaml'
  convert()
}

async function copyOutput() {
  if (output.value) await navigator.clipboard.writeText(output.value)
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">结构化数据</p>
        <h2>JSON ↔ YAML</h2>
        <p>在 JSON 与 YAML 之间双向转换，适合配置文件、接口数据与开发调试。</p>
      </div>
      <span class="privacy-chip">浏览器内转换</span>
    </div>

    <div class="action-grid mode-action-grid" aria-label="转换方向">
      <button type="button" :class="{ active: mode === 'json-yaml' }" @click="convert('json-yaml')">JSON → YAML</button>
      <button type="button" :class="{ active: mode === 'yaml-json' }" @click="convert('yaml-json')">YAML → JSON</button>
    </div>

    <div class="editor-grid utility-editor-grid">
      <label><span class="field-label">输入</span><textarea v-model="input" class="code-area large" spellcheck="false"></textarea></label>
      <label><span class="field-label">转换结果</span><textarea v-model="output" class="code-area large" readonly spellcheck="false"></textarea></label>
    </div>
    <p v-if="error" class="error-text">{{ error }}</p>
    <div class="tool-actions">
      <button class="button primary" type="button" :disabled="!input.trim()" @click="convert()">转换</button>
      <button class="button ghost" type="button" :disabled="!output" @click="swap">交换方向</button>
      <button class="button ghost" type="button" :disabled="!output" @click="copyOutput">复制结果</button>
    </div>
  </div>
</template>
