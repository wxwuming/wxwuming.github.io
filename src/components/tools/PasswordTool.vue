<script setup lang="ts">
import { computed, ref } from 'vue'

const length = ref(20)
const count = ref(5)
const useUpper = ref(true)
const useLower = ref(true)
const useNumbers = ref(true)
const useSymbols = ref(true)
const excludeAmbiguous = ref(true)
const output = ref('')
const error = ref('')

const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const lower = 'abcdefghijklmnopqrstuvwxyz'
const numbers = '0123456789'
const symbols = '!@#$%^&*()-_=+[]{};:,.?'
const ambiguous = new Set('Il1O0o')

const charset = computed(() => {
  let value = ''
  if (useUpper.value) value += upper
  if (useLower.value) value += lower
  if (useNumbers.value) value += numbers
  if (useSymbols.value) value += symbols
  return excludeAmbiguous.value ? [...value].filter((char) => !ambiguous.has(char)).join('') : value
})

function secureChar(chars: string) {
  const limit = 256 - (256 % chars.length)
  const bytes = new Uint8Array(32)
  while (true) {
    crypto.getRandomValues(bytes)
    for (const byte of bytes) {
      if (byte < limit) return chars[byte % chars.length]
    }
  }
}

function generate() {
  error.value = ''
  const safeLength = Math.min(128, Math.max(6, Math.floor(Number(length.value) || 20)))
  const safeCount = Math.min(20, Math.max(1, Math.floor(Number(count.value) || 5)))
  length.value = safeLength
  count.value = safeCount
  if (!charset.value) {
    output.value = ''
    error.value = '请至少选择一种字符类型。'
    return
  }
  output.value = Array.from({ length: safeCount }, () =>
    Array.from({ length: safeLength }, () => secureChar(charset.value)).join(''),
  ).join('\n')
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
        <p class="eyebrow">安全随机</p>
        <h2>密码生成器</h2>
        <p>使用 Web Crypto 生成随机密码，可控制长度、数量与字符集，不使用 Math.random。</p>
      </div>
      <span class="privacy-chip">Web Crypto</span>
    </div>

    <div class="control-grid password-number-grid">
      <label><span class="field-label">密码长度（6–128）</span><input v-model.number="length" class="text-input" type="number" min="6" max="128" /></label>
      <label><span class="field-label">生成数量（1–20）</span><input v-model.number="count" class="text-input" type="number" min="1" max="20" /></label>
    </div>
    <div class="password-options utility-card">
      <label class="option-line"><input v-model="useUpper" type="checkbox" /> 大写字母 A–Z</label>
      <label class="option-line"><input v-model="useLower" type="checkbox" /> 小写字母 a–z</label>
      <label class="option-line"><input v-model="useNumbers" type="checkbox" /> 数字 0–9</label>
      <label class="option-line"><input v-model="useSymbols" type="checkbox" /> 特殊字符</label>
      <label class="option-line"><input v-model="excludeAmbiguous" type="checkbox" /> 排除 Il1O0o 等易混淆字符</label>
    </div>
    <p v-if="error" class="error-text">{{ error }}</p>
    <label><span class="field-label">生成结果</span><textarea v-model="output" class="code-area uuid-result" readonly spellcheck="false"></textarea></label>
    <div class="tool-actions">
      <button class="button primary" type="button" @click="generate">重新生成</button>
      <button class="button ghost" type="button" :disabled="!output" @click="copyOutput">复制全部</button>
    </div>
  </div>
</template>
