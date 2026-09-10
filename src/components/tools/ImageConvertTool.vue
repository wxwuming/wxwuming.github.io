<script setup lang="ts">
import { ref } from 'vue'

const file = ref<File | null>(null)
const previewUrl = ref('')
const outputType = ref<'image/png' | 'image/jpeg' | 'image/webp'>('image/webp')
const quality = ref(0.9)
const status = ref('')

function chooseFile(event: Event) {
  const input = event.target as HTMLInputElement
  const selected = input.files?.[0] ?? null
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  file.value = selected
  previewUrl.value = selected ? URL.createObjectURL(selected) : ''
  status.value = selected ? `${selected.name} · ${(selected.size / 1024).toFixed(1)} KB` : ''
}

function extensionFor(type: string) {
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/webp') return 'webp'
  return 'png'
}

async function convertImage() {
  if (!file.value) {
    status.value = '请先选择图片'
    return
  }

  const image = new Image()
  image.src = previewUrl.value
  await image.decode()

  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (outputType.value === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(image, 0, 0)

  canvas.toBlob((blob) => {
    if (!blob) {
      status.value = '当前浏览器不支持该输出格式'
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const baseName = file.value?.name.replace(/\.[^.]+$/, '') || 'converted'
    a.href = url
    a.download = `${baseName}.${extensionFor(outputType.value)}`
    a.click()
    URL.revokeObjectURL(url)
    status.value = `转换完成 · ${(blob.size / 1024).toFixed(1)} KB`
  }, outputType.value, quality.value)
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">IMAGE</p>
        <h2>图片格式转换</h2>
        <p>PNG、JPEG、WebP 互转，直接在浏览器画布中完成。</p>
      </div>
      <span class="privacy-chip">本地处理</span>
    </div>

    <label class="drop-zone" for="image-file">
      <input id="image-file" type="file" accept="image/png,image/jpeg,image/webp" @change="chooseFile" />
      <strong>{{ file ? file.name : '点击选择图片' }}</strong>
      <span>支持 PNG / JPEG / WebP</span>
    </label>

    <img v-if="previewUrl" :src="previewUrl" class="image-preview" alt="待转换图片预览" />

    <div class="control-grid">
      <label>
        <span class="field-label">输出格式</span>
        <select v-model="outputType" class="text-input">
          <option value="image/png">PNG</option>
          <option value="image/jpeg">JPEG</option>
          <option value="image/webp">WebP</option>
        </select>
      </label>
      <label>
        <span class="field-label">质量 {{ Math.round(quality * 100) }}%</span>
        <input v-model.number="quality" class="range-input" type="range" min="0.1" max="1" step="0.05" />
      </label>
    </div>

    <div class="tool-actions">
      <button class="button primary" type="button" @click="convertImage">转换并下载</button>
      <span class="status-text">{{ status }}</span>
    </div>
  </div>
</template>
