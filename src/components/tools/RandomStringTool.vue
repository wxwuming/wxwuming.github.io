<script setup lang="ts">
import { computed, ref } from 'vue'

const length = ref(24)
const count = ref(5)
const useLower = ref(true)
const useUpper = ref(true)
const useDigits = ref(true)
const useSymbols = ref(false)
const output = ref('')
const error = ref('')

const alphabet = computed(() => [
  useLower.value ? 'abcdefghijklmnopqrstuvwxyz' : '',
  useUpper.value ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '',
  useDigits.value ? '0123456789' : '',
  useSymbols.value ? '!@#$%^&*_-+=?' : '',
].join(''))

function randomIndex(max: number) {
  const range = 0x100000000
  const limit = Math.floor(range / max) * max
  const values = new Uint32Array(1)
  do crypto.getRandomValues(values)
  while (values[0] >= limit)
  return values[0] % max
}

function generateOne(size: number) {
  return Array.from({ length: size }, () => alphabet.value[randomIndex(alphabet.value.length)]).join('')
}

function generate() {
  error.value = ''
  if (!alphabet.value) {
    output.value = ''
    error.value = '至少选择一种字符类型。'
    return
  }

  const safeLength = Math.min(256, Math.max(1, Math.floor(Number(length.value) || 1)))
  const safeCount = Math.min(50, Math.max(1, Math.floor(Number(count.value) || 1)))
  length.value = safeLength
  count.value = safeCount
  output.value = Array.from({ length: safeCount }, () => generateOne(safeLength)).join('\n')
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
        <p class="eyebrow">随机值生成</p>
        <h2>随机字符串</h2>
        <p>使用浏览器加密随机源生成字符串，可控制长度、数量和字符集合。</p>
      </div>
      <span class="privacy-chip">Web Crypto</span>
    </div>

    <div class="control-grid random-number-grid">
      <label><span class="field-label">每条长度（1–256）</span><input v-model.number="length" class="text-input" type="number" min="1" max="256" /></label>
      <label><span class="field-label">生成数量（1–50）</span><input v-model.number="count" class="text-input" type="number" min="1" max="50" /></label>
    </div>

    <div class="random-options" aria-label="字符类型">
      <label><input v-model="useLower" type="checkbox" /> 小写字母</label>
      <label><input v-model="useUpper" type="checkbox" /> 大写字母</label>
      <label><input v-model="useDigits" type="checkbox" /> 数字</label>
      <label><input v-model="useSymbols" type="checkbox" /> 常用符号</label>
    </div>

    <p v-if="error" class="error-text" role="alert">{{ error }}</p>
    <label><span class="field-label">生成结果</span><textarea v-model="output" class="code-area uuid-result" readonly spellcheck="false"></textarea></label>

    <div class="tool-actions">
      <button class="button primary" type="button" @click="generate">重新生成</button>
      <button class="button ghost" type="button" :disabled="!output" @click="copyOutput">复制全部</button>
    </div>
  </div>
</template>
