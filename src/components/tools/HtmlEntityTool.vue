<script setup lang="ts">
import { ref } from 'vue'

const input = ref('')
const output = ref('')
const mode = ref<'encode' | 'decode'>('encode')

function encode(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function decode(value: string) {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value
}

function transform(nextMode = mode.value) {
  mode.value = nextMode
  output.value = nextMode === 'encode' ? encode(input.value) : decode(input.value)
}

function swap() {
  if (!output.value) return
  input.value = output.value
  output.value = ''
  mode.value = mode.value === 'encode' ? 'decode' : 'encode'
  transform()
}

async function copyOutput() {
  if (output.value) await navigator.clipboard.writeText(output.value)
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">网页编码</p>
        <h2>HTML Entity</h2>
        <p>编码或还原 HTML 实体，处理 &lt;、&gt;、&amp;、引号等网页文本中的特殊字符。</p>
      </div>
      <span class="privacy-chip">编码 / 解码</span>
    </div>

    <div class="action-grid mode-action-grid">
      <button type="button" :class="{ active: mode === 'encode' }" @click="transform('encode')">编码 HTML Entity</button>
      <button type="button" :class="{ active: mode === 'decode' }" @click="transform('decode')">解码 HTML Entity</button>
    </div>
    <div class="editor-grid utility-editor-grid">
      <label><span class="field-label">输入文本</span><textarea v-model="input" class="code-area large" spellcheck="false"></textarea></label>
      <label><span class="field-label">处理结果</span><textarea v-model="output" class="code-area large" readonly spellcheck="false"></textarea></label>
    </div>
    <div class="tool-actions">
      <button class="button primary" type="button" :disabled="!input" @click="transform()">处理</button>
      <button class="button ghost" type="button" :disabled="!output" @click="swap">交换并反向处理</button>
      <button class="button ghost" type="button" :disabled="!output" @click="copyOutput">复制结果</button>
    </div>
  </div>
</template>
