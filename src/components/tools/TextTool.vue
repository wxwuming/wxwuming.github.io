<script setup lang="ts">
import { computed, ref } from 'vue'

const input = ref('')
const output = ref('')

const stats = computed(() => {
  const text = input.value
  return {
    chars: text.length,
    noSpaces: text.replace(/\s/g, '').length,
    lines: text ? text.split(/\r?\n/).length : 0,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    bytes: new TextEncoder().encode(text).length,
  }
})

function apply(action: 'trim' | 'remove-empty' | 'dedupe' | 'sort' | 'reverse' | 'upper' | 'lower') {
  const lines = input.value.split(/\r?\n/)
  switch (action) {
    case 'trim': output.value = lines.map((line) => line.trim()).join('\n').trim(); break
    case 'remove-empty': output.value = lines.filter((line) => line.trim()).join('\n'); break
    case 'dedupe': output.value = [...new Set(lines)].join('\n'); break
    case 'sort': output.value = [...lines].sort((a, b) => a.localeCompare(b, 'zh-CN')).join('\n'); break
    case 'reverse': output.value = [...lines].reverse().join('\n'); break
    case 'upper': output.value = input.value.toUpperCase(); break
    case 'lower': output.value = input.value.toLowerCase(); break
  }
}

function replaceInput() {
  if (output.value) input.value = output.value
}

async function copyOutput() {
  if (output.value) await navigator.clipboard.writeText(output.value)
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">TEXT</p>
        <h2>文本处理</h2>
        <p>统计文本信息，并完成去空行、去重、排序和大小写转换。</p>
      </div>
      <span class="privacy-chip">批量处理</span>
    </div>

    <div class="text-stats">
      <div><strong>{{ stats.chars }}</strong><span>字符</span></div>
      <div><strong>{{ stats.noSpaces }}</strong><span>非空字符</span></div>
      <div><strong>{{ stats.lines }}</strong><span>行</span></div>
      <div><strong>{{ stats.words }}</strong><span>词组</span></div>
      <div><strong>{{ stats.bytes }}</strong><span>UTF-8 字节</span></div>
    </div>

    <label><span class="field-label">输入文本</span><textarea v-model="input" class="code-area compact-area" spellcheck="false"></textarea></label>

    <div class="action-grid" aria-label="文本处理操作">
      <button type="button" @click="apply('trim')">清理首尾空格</button>
      <button type="button" @click="apply('remove-empty')">移除空行</button>
      <button type="button" @click="apply('dedupe')">按行去重</button>
      <button type="button" @click="apply('sort')">按行排序</button>
      <button type="button" @click="apply('reverse')">反转行序</button>
      <button type="button" @click="apply('upper')">转大写</button>
      <button type="button" @click="apply('lower')">转小写</button>
    </div>

    <label><span class="field-label">处理结果</span><textarea v-model="output" class="code-area compact-area" readonly spellcheck="false"></textarea></label>
    <div class="tool-actions">
      <button class="button primary" type="button" :disabled="!output" @click="copyOutput">复制结果</button>
      <button class="button ghost" type="button" :disabled="!output" @click="replaceInput">结果作为输入</button>
    </div>
  </div>
</template>
