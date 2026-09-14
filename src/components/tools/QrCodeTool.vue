<script setup lang="ts">
import { ref } from 'vue'
import QRCode from 'qrcode'
import jsQR from 'jsqr'

const input = ref('')
const qrDataUrl = ref('')
const decoded = ref('')
const error = ref('')

async function generate() {
  error.value = ''
  qrDataUrl.value = ''
  try {
    if (!input.value.trim()) return
    qrDataUrl.value = await QRCode.toDataURL(input.value, { width: 360, margin: 2, errorCorrectionLevel: 'M' })
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '二维码生成失败。'
  }
}

async function decodeFile(file: File | undefined) {
  if (!file) return
  error.value = ''
  decoded.value = ''
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('当前浏览器无法读取图片画布。')
    context.drawImage(image, 0, 0)
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)
    if (!code) throw new Error('未识别到二维码，请尝试更清晰的图片。')
    decoded.value = code.data
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '二维码识别失败。'
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function copyDecoded() {
  if (decoded.value) await navigator.clipboard.writeText(decoded.value)
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">二维码</p>
        <h2>二维码工具</h2>
        <p>把文本或链接生成二维码，也可以从本地图片中识别二维码内容。</p>
      </div>
      <span class="privacy-chip">本地生成 / 识别</span>
    </div>

    <div class="qr-tool-grid">
      <section class="utility-card qr-card">
        <h3>生成二维码</h3>
        <label><span class="field-label">文本或链接</span><textarea v-model="input" class="code-area compact-area" spellcheck="false"></textarea></label>
        <div class="tool-actions"><button class="button primary" type="button" :disabled="!input.trim()" @click="generate">生成二维码</button></div>
        <div v-if="qrDataUrl" class="qr-preview">
          <img :src="qrDataUrl" alt="生成的二维码" />
          <a class="button ghost" :href="qrDataUrl" download="wuming-qrcode.png">下载 PNG</a>
        </div>
      </section>

      <section class="utility-card qr-card">
        <h3>识别二维码图片</h3>
        <label class="drop-zone compact-drop-zone">
          <input type="file" accept="image/*" @change="decodeFile(($event.target as HTMLInputElement).files?.[0])" />
          <strong>选择二维码图片</strong><span>PNG、JPG、WebP 等常见图片格式</span>
        </label>
        <label><span class="field-label">识别结果</span><textarea v-model="decoded" class="code-area compact-area" readonly spellcheck="false"></textarea></label>
        <div class="tool-actions"><button class="button ghost" type="button" :disabled="!decoded" @click="copyDecoded">复制结果</button></div>
      </section>
    </div>
    <p v-if="error" class="error-text">{{ error }}</p>
  </div>
</template>
