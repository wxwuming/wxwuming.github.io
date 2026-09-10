<script setup lang="ts">
import { ref } from 'vue'

const file = ref<File | null>(null)
const previewUrl = ref('')
const outputType = ref<'image/png' | 'image/jpeg' | 'image/webp'>('image/webp')
const quality = ref(0.9)
const status = ref('')
const targetWidth = ref(0)
const targetHeight = ref(0)
const aspectRatio = ref(1)
const keepRatio = ref(true)

async function chooseFile(event: Event) {
  const input = event.target as HTMLInputElement
  const selected = input.files?.[0] ?? null
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  file.value = selected
  previewUrl.value = selected ? URL.createObjectURL(selected) : ''
  if (!selected) {
    status.value = ''
    return
  }

  const image = new Image()
  image.src = previewUrl.value
  await image.decode()
  targetWidth.value = image.naturalWidth
  targetHeight.value = image.naturalHeight
  aspectRatio.value = image.naturalWidth / image.naturalHeight
  status.value = `${selected.name} · ${image.naturalWidth}×${image.naturalHeight} · ${(selected.size / 1024).toFixed(1)} KB`
}

function updateWidth() {
  if (keepRatio.value && targetWidth.value > 0) targetHeight.value = Math.max(1, Math.round(targetWidth.value / aspectRatio.value))
}

function updateHeight() {
  if (keepRatio.value && targetHeight.value > 0) targetWidth.value = Math.max(1, Math.round(targetHeight.value * aspectRatio.value))
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
  canvas.width = Math.max(1, Math.round(targetWidth.value || image.naturalWidth))
  canvas.height = Math.max(1, Math.round(targetHeight.value || image.naturalHeight))
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (outputType.value === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

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
        <h2>图片转换与缩放</h2>
        <p>转换 PNG、JPEG、WebP，并按需要调整尺寸与输出质量。</p>
      </div>
      <span class="privacy-chip">快速转换</span>
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

    <div v-if="file" class="control-grid image-size-grid">
      <label>
        <span class="field-label">宽度（px）</span>
        <input v-model.number="targetWidth" class="text-input" type="number" min="1" @input="updateWidth" />
      </label>
      <label>
        <span class="field-label">高度（px）</span>
        <input v-model.number="targetHeight" class="text-input" type="number" min="1" @input="updateHeight" />
      </label>
    </div>
    <label v-if="file" class="option-line">
      <input v-model="keepRatio" type="checkbox" />
      <span>保持原始宽高比</span>
    </label>

    <div class="tool-actions">
      <button class="button primary" type="button" @click="convertImage">转换并下载</button>
      <span class="status-text">{{ status }}</span>
    </div>
  </div>
</template>
