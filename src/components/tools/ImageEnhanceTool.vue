<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import UiSelect from '../UiSelect.vue'
import {
  MAX_IMAGE_FILE_BYTES,
  enhancePixels,
  enhancedDimensions,
  type ImageScale,
} from '../../utils/imageEnhance'

const scaleOptions = [
  { value: '1', label: '1× · 仅提升清晰度' },
  { value: '2', label: '2× · 宽高各放大 2 倍' },
  { value: '4', label: '4× · 宽高各放大 4 倍' },
] as const
const formatOptions = [
  { value: 'image/png', label: 'PNG · 无损' },
  { value: 'image/jpeg', label: 'JPEG · 文件较小' },
  { value: 'image/webp', label: 'WebP · 高效压缩' },
] as const

type OutputType = (typeof formatOptions)[number]['value']

const file = ref<File | null>(null)
const inputUrl = ref('')
const resultUrl = ref('')
const sourceWidth = ref(0)
const sourceHeight = ref(0)
const resultSize = ref(0)
const scale = ref<(typeof scaleOptions)[number]['value']>('2')
const sharpness = ref(45)
const denoise = ref(15)
const outputType = ref<OutputType>('image/png')
const quality = ref(0.92)
const isDragging = ref(false)
const isLoading = ref(false)
const isProcessing = ref(false)
const status = ref('')
const error = ref('')

let sourceImage: HTMLImageElement | null = null
let loadId = 0
let disposed = false

const target = computed(() => {
  if (!file.value) return null
  try {
    return { ...enhancedDimensions(sourceWidth.value, sourceHeight.value, Number(scale.value) as ImageScale), error: '' }
  } catch (cause) {
    return { width: 0, height: 0, error: cause instanceof Error ? cause.message : '图片尺寸无效。' }
  }
})

const downloadName = computed(() => {
  const name = file.value?.name.replace(/\.[^.]+$/, '') || 'image'
  const extension = outputType.value === 'image/jpeg' ? 'jpg' : outputType.value === 'image/webp' ? 'webp' : 'png'
  return `${name}-enhanced-${scale.value}x.${extension}`
})

function sizeLabel(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`
}

function clearResult() {
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = ''
  resultSize.value = 0
}

watch([scale, sharpness, denoise, outputType, quality], () => {
  clearResult()
  if (file.value) status.value = '参数已调整，点击“开始增强”生成新图片。'
})

async function loadFile(selected: File | null) {
  if (!selected || isProcessing.value) return
  const currentId = ++loadId
  isLoading.value = false
  error.value = ''
  status.value = ''
  clearResult()
  sourceImage = null
  file.value = null
  sourceWidth.value = 0
  sourceHeight.value = 0
  if (inputUrl.value) URL.revokeObjectURL(inputUrl.value)
  inputUrl.value = ''

  if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type)) {
    error.value = '仅支持 PNG、JPEG、WebP 图片。'
    return
  }
  if (selected.size > MAX_IMAGE_FILE_BYTES) {
    error.value = '单张图片不能超过 25 MB。'
    return
  }

  const url = URL.createObjectURL(selected)
  inputUrl.value = url
  isLoading.value = true
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    if (disposed || currentId !== loadId) return
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('图片尺寸无法读取。')
    sourceImage = image
    sourceWidth.value = image.naturalWidth
    sourceHeight.value = image.naturalHeight
    file.value = selected
    status.value = '图片已加载，可以调整参数并开始增强。'
  } catch {
    if (currentId !== loadId || disposed) return
    URL.revokeObjectURL(url)
    inputUrl.value = ''
    error.value = '图片无法解码，请尝试另一张 PNG、JPEG 或 WebP 图片。'
  } finally {
    if (currentId === loadId && !disposed) isLoading.value = false
  }
}

async function chooseFile(event: Event) {
  const input = event.target as HTMLInputElement
  const selected = input.files?.[0] ?? null
  input.value = ''
  await loadFile(selected)
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  void loadFile(event.dataTransfer?.files?.[0] ?? null)
}

function canvasWithImage(source: CanvasImageSource, width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('当前浏览器无法创建图片画布。')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, width, height)
  return canvas
}

function exportBlob(canvas: HTMLCanvasElement, type: OutputType, exportQuality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob || blob.type !== type) {
        reject(new Error('当前浏览器不支持此图片导出格式，请尝试 PNG 或 JPEG。'))
      } else {
        resolve(blob)
      }
    }, type, exportQuality)
  })
}

async function enhanceImage() {
  if (!file.value || !sourceImage || !target.value || target.value.error || isProcessing.value) return
  const currentId = loadId
  const dimensions = target.value
  const image = sourceImage
  isProcessing.value = true
  clearResult()
  error.value = ''
  status.value = '正在进行高质量放大…'

  try {
    // Allow the busy state to render before the synchronous canvas work begins.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    if (disposed || currentId !== loadId) return

    // A 4x resize is applied in two 2x passes for more stable interpolation.
    let input: CanvasImageSource = image
    if (scale.value === '4') {
      input = canvasWithImage(image, image.naturalWidth * 2, image.naturalHeight * 2)
    }
    const canvas = canvasWithImage(input, dimensions.width, dimensions.height)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('当前浏览器无法处理像素数据。')

    status.value = '正在优化噪点与边缘清晰度…'
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    if (disposed || currentId !== loadId) return

    if (sharpness.value > 0 || denoise.value > 0) {
      const imageData = context.getImageData(0, 0, dimensions.width, dimensions.height)
      enhancePixels(imageData.data, dimensions.width, dimensions.height, sharpness.value, denoise.value)
      context.putImageData(imageData, 0, 0)
    }

    // JPEG has no alpha; composite transparent source pixels against white.
    if (outputType.value === 'image/jpeg') {
      context.globalCompositeOperation = 'destination-over'
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }

    status.value = '正在生成图片文件…'
    const blob = await exportBlob(canvas, outputType.value, quality.value)
    if (disposed || currentId !== loadId) return
    resultUrl.value = URL.createObjectURL(blob)
    resultSize.value = blob.size
    status.value = '增强完成！可对比预览并下载处理后的图片。'
  } catch (cause) {
    if (disposed || currentId !== loadId) return
    error.value = cause instanceof Error ? cause.message : '图片处理失败，请降低放大倍数后重试。'
    status.value = ''
  } finally {
    if (!disposed) isProcessing.value = false
  }
}

onBeforeUnmount(() => {
  disposed = true
  loadId++
  clearResult()
  if (inputUrl.value) URL.revokeObjectURL(inputUrl.value)
})
</script>

<template>
  <div class="tool-panel image-enhance-tool">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">图片处理 / 高清增强</p>
        <h2>图片像素与清晰度增强</h2>
        <p>本地放大图片分辨率、减轻轻微噪点，并通过边缘锐化改善观感。</p>
      </div>
      <span class="privacy-chip">浏览器本地处理</span>
    </div>

    <label
      class="drop-zone enhance-drop-zone"
      :class="{ 'is-dragging': isDragging }"
      for="enhance-image-file"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input
        id="enhance-image-file"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        :disabled="isProcessing"
        @change="chooseFile"
      />
      <strong>{{ file ? file.name : '选择图片或拖拽图片到此处' }}</strong>
      <span>PNG / JPEG / WebP · 最大 25 MB</span>
    </label>

    <div v-if="file" class="enhance-file-meta">
      <span>原始尺寸：{{ sourceWidth }} × {{ sourceHeight }} px</span>
      <span>文件大小：{{ sizeLabel(file.size) }}</span>
    </div>

    <div class="control-grid enhance-controls">
      <label>
        <span class="field-label">放大倍数</span>
        <UiSelect v-model="scale" :options="scaleOptions" :disabled="isProcessing || isLoading" aria-label="放大倍数" />
      </label>
      <label>
        <span class="field-label">输出格式</span>
        <UiSelect v-model="outputType" :options="formatOptions" :disabled="isProcessing || isLoading" aria-label="输出格式" />
      </label>
      <label>
        <span class="field-label">锐化强度：{{ sharpness }}%</span>
        <input v-model.number="sharpness" class="range-input" type="range" min="0" max="100" step="5" :disabled="isProcessing" />
      </label>
      <label>
        <span class="field-label">降噪强度：{{ denoise }}%</span>
        <input v-model.number="denoise" class="range-input" type="range" min="0" max="100" step="5" :disabled="isProcessing" />
      </label>
      <label v-if="outputType !== 'image/png'">
        <span class="field-label">输出质量：{{ Math.round(quality * 100) }}%</span>
        <input v-model.number="quality" class="range-input" type="range" min="0.5" max="1" step="0.05" :disabled="isProcessing" />
      </label>
    </div>

    <p v-if="target && !target.error" class="enhance-target">
      目标分辨率：<strong>{{ target.width }} × {{ target.height }} px</strong>
      <span>（总像素约为原图的 {{ Number(scale) ** 2 }} 倍）</span>
    </p>
    <p v-if="target?.error" class="error-text" role="alert">{{ target.error }}</p>

    <div class="tool-actions enhance-actions">
      <button class="button primary" type="button" :disabled="!file || !!target?.error || isLoading || isProcessing" @click="enhanceImage">
        {{ isProcessing ? '正在增强…' : '开始增强' }}
      </button>
      <a v-if="resultUrl" class="button ghost" :href="resultUrl" :download="downloadName">下载高清图片</a>
      <span class="status-text" role="status" aria-live="polite">{{ isLoading ? '正在读取图片…' : status }}</span>
    </div>
    <p v-if="error" class="error-text" role="alert">{{ error }}</p>

    <div v-if="inputUrl && file" class="enhance-preview-grid">
      <figure class="enhance-preview-card">
        <figcaption>原图 <span>{{ sourceWidth }} × {{ sourceHeight }} px</span></figcaption>
        <img :src="inputUrl" alt="增强前原图" />
      </figure>
      <figure class="enhance-preview-card">
        <figcaption>增强后 <span v-if="resultUrl && target">{{ target.width }} × {{ target.height }} px · {{ sizeLabel(resultSize) }}</span></figcaption>
        <img v-if="resultUrl" :src="resultUrl" alt="增强后的图片预览" />
        <div v-else class="enhance-preview-empty">完成增强后在这里查看效果</div>
      </figure>
    </div>

    <p class="enhance-note">
      说明：使用高质量插值放大、轻度降噪与锐化，不是 AI 超分辨率模型。可以提高像素数量和边缘观感，但无法还原原图中不存在的真实纹理、文字或细节。处理过程不会上传图片。
    </p>
  </div>
</template>

<style scoped>
.enhance-drop-zone.is-dragging { border-color: #68746f; background: #edf3e9; box-shadow: 0 0 0 4px rgba(93,112,103,.1); }
.enhance-file-meta { display: flex; flex-wrap: wrap; gap: 7px 20px; margin: 12px 0 2px; color: #64706b; font-size: 12px; }
.enhance-controls { margin-top: 13px; }
.enhance-target { margin: 22px 0 4px; font-size: 13px; color: #59635f; }
.enhance-target strong { color: #2f3a36; }
.enhance-target span { color: #79817d; }
.enhance-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 22px; }
.enhance-actions .button:disabled { opacity: .55; cursor: not-allowed; }
.enhance-preview-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 26px; }
.enhance-preview-card { min-width: 0; margin: 0; border: 1px solid #e1e5e0; border-radius: 12px; overflow: hidden; background: #f6f8f4; }
.enhance-preview-card figcaption { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 5px; padding: 10px 12px; color: #36423d; font-size: 12px; font-weight: 700; background: #eef1ed; }
.enhance-preview-card figcaption span { color: #6f7873; font-weight: 400; }
.enhance-preview-card img { display: block; width: 100%; height: 240px; object-fit: contain; }
.enhance-preview-empty { display: grid; place-items: center; min-height: 240px; padding: 15px; text-align: center; font-size: 12px; color: #7b8580; }
.enhance-note { margin-top: 20px; font-size: 12px; line-height: 1.75; color: #68716e; }
@media (max-width: 720px) {
  .enhance-preview-grid { grid-template-columns: 1fr; }
  .enhance-preview-card img, .enhance-preview-empty { height: 210px; min-height: 210px; }
}
</style>
