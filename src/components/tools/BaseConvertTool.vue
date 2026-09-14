<script setup lang="ts">
import { reactive, ref } from 'vue'

const values = reactive({ binary: '', octal: '', decimal: '', hex: '' })
const error = ref('')

const configs = [
  { key: 'binary', label: '二进制', base: 2, placeholder: '101010' },
  { key: 'octal', label: '八进制', base: 8, placeholder: '52' },
  { key: 'decimal', label: '十进制', base: 10, placeholder: '42' },
  { key: 'hex', label: '十六进制', base: 16, placeholder: '2A' },
] as const

type ValueKey = (typeof configs)[number]['key']

function parseInteger(text: string, base: number) {
  const normalized = text.trim().replace(/_/g, '')
  if (!normalized) return null
  const negative = normalized.startsWith('-')
  const digits = negative ? normalized.slice(1) : normalized
  if (!digits) throw new Error('请输入整数。')
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
  let result = 0n
  for (const char of digits.toLowerCase()) {
    const digit = alphabet.indexOf(char)
    if (digit < 0 || digit >= base) throw new Error(`“${char}” 不是有效的 ${base} 进制数字。`)
    result = result * BigInt(base) + BigInt(digit)
  }
  return negative ? -result : result
}

function update(source: ValueKey, base: number) {
  error.value = ''
  try {
    const parsed = parseInteger(values[source], base)
    if (parsed === null) {
      for (const config of configs) if (config.key !== source) values[config.key] = ''
      return
    }
    values.binary = parsed.toString(2)
    values.octal = parsed.toString(8)
    values.decimal = parsed.toString(10)
    values.hex = parsed.toString(16).toUpperCase()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '进制转换失败。'
  }
}

async function copy(value: string) {
  if (value) await navigator.clipboard.writeText(value)
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">数字转换</p>
        <h2>进制转换</h2>
        <p>在二进制、八进制、十进制和十六进制整数之间实时转换，支持大整数与负数。</p>
      </div>
      <span class="privacy-chip">BigInt</span>
    </div>

    <div class="base-convert-grid">
      <label v-for="config in configs" :key="config.key" class="base-field utility-card">
        <span class="field-label">{{ config.label }}</span>
        <div class="base-input-row">
          <input v-model="values[config.key]" class="text-input" :placeholder="config.placeholder" spellcheck="false" @input="update(config.key, config.base)" />
          <button class="button ghost compact-button" type="button" :disabled="!values[config.key]" @click="copy(values[config.key])">复制</button>
        </div>
      </label>
    </div>
    <p v-if="error" class="error-text">{{ error }}</p>
  </div>
</template>
