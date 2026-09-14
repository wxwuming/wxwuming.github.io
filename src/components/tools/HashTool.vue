<script setup lang="ts">
import { ref } from 'vue'
import UiSelect from '../UiSelect.vue'

type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512'
type SourceMode = 'text' | 'file'

const sourceModeOptions = [
  { value: 'text', label: '文本' },
  { value: 'file', label: '文件' },
] as const
const algorithmOptions = [
  { value: 'SHA-256', label: 'SHA-256' },
  { value: 'SHA-384', label: 'SHA-384' },
  { value: 'SHA-512', label: 'SHA-512' },
] as const
const algorithm = ref<HashAlgorithm>('SHA-256')
const sourceMode = ref<SourceMode>('text')
const input = ref('无名工具')
const file = ref<File | null>(null)
const result = ref('')
const status = ref('')

function chooseFile(event: Event) {
  const target = event.target as HTMLInputElement
  file.value = target.files?.[0] ?? null
  status.value = file.value ? `${file.value.name} · ${(file.value.size / 1024).toFixed(1)} KB` : ''
  result.value = ''
}

async function calculateHash() {
  if (sourceMode.value === 'file' && !file.value) {
    status.value = '请先选择文件'
    return
  }

  const data: BufferSource = sourceMode.value === 'file'
    ? await file.value!.arrayBuffer()
    : new TextEncoder().encode(input.value)

  const digest = await crypto.subtle.digest(algorithm.value, data)
  result.value = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  status.value = sourceMode.value === 'file' ? '校验值已生成' : ''
}

async function copyResult() {
  if (result.value) await navigator.clipboard.writeText(result.value)
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">哈希校验</p>
        <h2>哈希校验</h2>
        <p>生成文本或文件的 SHA 摘要，用于内容比对与完整性校验。</p>
      </div>
      <span class="privacy-chip">SHA-2</span>
    </div>

    <div class="control-grid">
      <label>
        <span class="field-label">数据来源</span>
        <UiSelect v-model="sourceMode" :options="sourceModeOptions" aria-label="数据来源" />
      </label>
      <label>
        <span class="field-label">算法</span>
        <UiSelect v-model="algorithm" :options="algorithmOptions" aria-label="哈希算法" />
      </label>
    </div>

    <label v-if="sourceMode === 'text'">
      <span class="field-label">文本内容</span>
      <textarea v-model="input" class="code-area compact-area" spellcheck="false"></textarea>
    </label>

    <label v-else class="drop-zone compact-drop-zone" for="hash-file">
      <input id="hash-file" type="file" @change="chooseFile" />
      <strong>{{ file ? file.name : '点击选择需要校验的文件' }}</strong>
      <span>{{ status || '支持任意文件类型' }}</span>
    </label>

    <label>
      <span class="field-label">摘要结果</span>
      <textarea v-model="result" class="code-area hash-result" readonly spellcheck="false"></textarea>
    </label>

    <div class="tool-actions">
      <button class="button primary" type="button" @click="calculateHash">计算摘要</button>
      <button class="button ghost" type="button" :disabled="!result" @click="copyResult">复制结果</button>
      <span v-if="sourceMode === 'file'" class="status-text" role="status" aria-live="polite">{{ status }}</span>
    </div>
  </div>
</template>
