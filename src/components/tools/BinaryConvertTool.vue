<script setup lang="ts">
import { ref } from 'vue'

type Encoding = 'text' | 'hex' | 'base64' | 'bytes'
const sourceType = ref<Encoding>('text')
const targetType = ref<Encoding>('hex')
const input = ref('Wuming Tools')
const output = ref('')
const error = ref('')

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(' ')
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function base64ToBytes(text: string) {
  const binary = atob(text.replace(/\s/g, ''))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function parseSource(): Uint8Array {
  switch (sourceType.value) {
    case 'text': return encoder.encode(input.value)
    case 'hex': {
      const clean = input.value.replace(/0x/gi, '').replace(/[^0-9a-f]/gi, '')
      if (clean.length % 2 !== 0) throw new Error('Hex 内容长度必须为偶数')
      return Uint8Array.from(clean.match(/.{2}/g)?.map((pair) => parseInt(pair, 16)) ?? [])
    }
    case 'base64': return base64ToBytes(input.value)
    case 'bytes': return Uint8Array.from(input.value.split(/[\s,]+/).filter(Boolean).map((item) => {
      const value = Number(item)
      if (!Number.isInteger(value) || value < 0 || value > 255) throw new Error('字节必须是 0-255 的整数')
      return value
    }))
  }
}

function convert() {
  error.value = ''
  try {
    const bytes = parseSource()
    switch (targetType.value) {
      case 'text': output.value = decoder.decode(bytes); break
      case 'hex': output.value = bytesToHex(bytes); break
      case 'base64': output.value = bytesToBase64(bytes); break
      case 'bytes': output.value = Array.from(bytes).join(' '); break
    }
  } catch (e) {
    output.value = ''
    error.value = e instanceof Error ? e.message : '转换失败'
  }
}

function swap() {
  const old = sourceType.value
  sourceType.value = targetType.value
  targetType.value = old
  if (output.value) {
    input.value = output.value
    output.value = ''
  }
}

async function copyOutput() {
  if (output.value) await window.navigator.clipboard.writeText(output.value)
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">BINARY</p>
        <h2>文本 / Hex / Base64 / Bytes</h2>
        <p>基于 UTF-8 编码进行常用二进制表示转换。</p>
      </div>
      <span class="privacy-chip">本地处理</span>
    </div>

    <div class="format-row">
      <select v-model="sourceType" class="text-input"><option value="text">Text</option><option value="hex">Hex</option><option value="base64">Base64</option><option value="bytes">Bytes</option></select>
      <button class="swap-button" type="button" @click="swap">⇄</button>
      <select v-model="targetType" class="text-input"><option value="text">Text</option><option value="hex">Hex</option><option value="base64">Base64</option><option value="bytes">Bytes</option></select>
    </div>

    <div class="editor-grid">
      <label><span class="field-label">输入</span><textarea v-model="input" class="code-area" spellcheck="false"></textarea></label>
      <label><span class="field-label">输出</span><textarea v-model="output" class="code-area" readonly spellcheck="false"></textarea></label>
    </div>
    <p v-if="error" class="error-text">{{ error }}</p>
    <div class="tool-actions">
      <button class="button primary" type="button" @click="convert">转换</button>
      <button class="button ghost" type="button" :disabled="!output" @click="copyOutput">复制结果</button>
    </div>
  </div>
</template>
