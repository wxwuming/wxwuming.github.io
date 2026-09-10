<script setup lang="ts">
import { ref } from 'vue'

const count = ref(5)
const output = ref('')

function fallbackUuid() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`
}

function createUuid() {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : fallbackUuid()
}

function generate() {
  const safeCount = Math.min(50, Math.max(1, Math.floor(Number(count.value) || 1)))
  count.value = safeCount
  output.value = Array.from({ length: safeCount }, createUuid).join('\n')
}

async function copyOutput() {
  if (output.value) await navigator.clipboard.writeText(output.value)
}

generate()
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">UUID</p>
        <h2>UUID 生成器</h2>
        <p>批量生成标准 UUID v4 标识符。</p>
      </div>
      <span class="privacy-chip">UUID v4</span>
    </div>

    <label class="field-label" for="uuid-count">生成数量（1–50）</label>
    <input id="uuid-count" v-model.number="count" class="text-input narrow-input" type="number" min="1" max="50" />

    <label>
      <span class="field-label">生成结果</span>
      <textarea v-model="output" class="code-area uuid-result" readonly spellcheck="false"></textarea>
    </label>

    <div class="tool-actions">
      <button class="button primary" type="button" @click="generate">重新生成</button>
      <button class="button ghost" type="button" :disabled="!output" @click="copyOutput">复制全部</button>
    </div>
  </div>
</template>
