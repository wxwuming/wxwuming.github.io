<script setup lang="ts">
import { ref } from 'vue'
import UiSelect from '../UiSelect.vue'

type Action = 'encode-component' | 'decode-component' | 'encode-url' | 'decode-url'
const actionOptions = [
  { value: 'encode-component', label: '编码参数（encodeURIComponent）' },
  { value: 'decode-component', label: '解码参数（decodeURIComponent）' },
  { value: 'encode-url', label: '编码完整 URL（encodeURI）' },
  { value: 'decode-url', label: '解码完整 URL（decodeURI）' },
] as const

const action = ref<Action>('encode-component')
const input = ref('https://example.com/search?q=无名 工具&lang=zh-CN')
const output = ref('')
const error = ref('')

function transform() {
  error.value = ''
  try {
    switch (action.value) {
      case 'encode-component': output.value = encodeURIComponent(input.value); break
      case 'decode-component': output.value = decodeURIComponent(input.value); break
      case 'encode-url': output.value = encodeURI(input.value); break
      case 'decode-url': output.value = decodeURI(input.value); break
    }
  } catch (e) {
    output.value = ''
    error.value = e instanceof Error ? e.message : '处理失败'
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
        <p class="eyebrow">链接处理</p>
        <h2>URL 编码 / 解码</h2>
        <p>处理链接、查询参数和百分号编码内容。</p>
      </div>
      <span class="privacy-chip">即时处理</span>
    </div>

    <label class="field-label" for="url-action">处理方式</label>
    <UiSelect id="url-action" v-model="action" :options="actionOptions" aria-label="处理方式" />

    <div class="editor-grid utility-editor-grid">
      <label><span class="field-label">输入</span><textarea v-model="input" class="code-area" spellcheck="false"></textarea></label>
      <label><span class="field-label">结果</span><textarea v-model="output" class="code-area" readonly spellcheck="false"></textarea></label>
    </div>

    <p v-if="error" class="error-text" role="alert">{{ error }}</p>
    <div class="tool-actions">
      <button class="button primary" type="button" @click="transform">开始处理</button>
      <button class="button ghost" type="button" :disabled="!output" @click="copyOutput">复制结果</button>
    </div>
  </div>
</template>
