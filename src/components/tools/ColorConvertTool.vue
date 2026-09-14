<script setup lang="ts">
import { computed, ref } from 'vue'

const hexInput = ref('#1c2623')

function normalizeHex(value: string) {
  const cleaned = value.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(cleaned)) return `#${cleaned.split('').map((part) => `${part}${part}`).join('').toLowerCase()}`
  if (/^[0-9a-f]{6}$/i.test(cleaned)) return `#${cleaned.toLowerCase()}`
  return null
}

function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2
  const delta = max - min

  if (delta === 0) return { h: 0, s: 0, l: Math.round(lightness * 100) }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1))
  let hue = 0
  if (max === red) hue = 60 * (((green - blue) / delta) % 6)
  else if (max === green) hue = 60 * ((blue - red) / delta + 2)
  else hue = 60 * ((red - green) / delta + 4)
  if (hue < 0) hue += 360

  return { h: Math.round(hue), s: Math.round(saturation * 100), l: Math.round(lightness * 100) }
}

const color = computed(() => {
  const hex = normalizeHex(hexInput.value)
  if (!hex) return null
  const value = Number.parseInt(hex.slice(1), 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  const hsl = rgbToHsl(r, g, b)
  return {
    hex,
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
  }
})

function syncPicker(event: Event) {
  hexInput.value = (event.target as HTMLInputElement).value
}

async function copy(value: string) {
  await navigator.clipboard.writeText(value)
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">开发与调试</p>
        <h2>颜色转换</h2>
        <p>输入 HEX 颜色并转换为标准 HEX、RGB 与 HSL 表达形式。</p>
      </div>
      <span class="privacy-chip">HEX / RGB / HSL</span>
    </div>

    <div class="color-input-layout">
      <label class="color-picker-shell" :style="{ background: color?.hex || '#e5e7eb' }">
        <input :value="color?.hex || '#1c2623'" type="color" aria-label="选择颜色" @input="syncPicker" />
      </label>
      <label><span class="field-label">HEX 颜色</span><input v-model="hexInput" class="text-input" type="text" placeholder="#1c2623" spellcheck="false" /></label>
    </div>

    <p v-if="!color" class="error-text" role="alert">请输入 3 位或 6 位 HEX 颜色，例如 #fff 或 #1c2623。</p>

    <div v-else class="color-result-grid">
      <button type="button" @click="copy(color.hex)"><span>HEX</span><strong>{{ color.hex }}</strong><small>点击复制</small></button>
      <button type="button" @click="copy(color.rgb)"><span>RGB</span><strong>{{ color.rgb }}</strong><small>点击复制</small></button>
      <button type="button" @click="copy(color.hsl)"><span>HSL</span><strong>{{ color.hsl }}</strong><small>点击复制</small></button>
    </div>
  </div>
</template>
