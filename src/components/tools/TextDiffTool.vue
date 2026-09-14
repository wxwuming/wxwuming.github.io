<script setup lang="ts">
import { computed, ref } from 'vue'

type DiffLine = { type: 'same' | 'add' | 'remove'; text: string }

const left = ref('')
const right = ref('')
const result = ref<DiffLine[]>([])
const error = ref('')

function compare() {
  error.value = ''
  result.value = []
  const a = left.value.split(/\r?\n/)
  const b = right.value.split(/\r?\n/)
  if (a.length > 500 || b.length > 500) {
    error.value = '为保证浏览器性能，单侧文本暂支持最多 500 行。'
    return
  }

  const matrix = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1))
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      matrix[i][j] = a[i - 1] === b[j - 1]
        ? matrix[i - 1][j - 1] + 1
        : Math.max(matrix[i - 1][j], matrix[i][j - 1])
    }
  }

  const lines: DiffLine[] = []
  let i = a.length
  let j = b.length
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      lines.push({ type: 'same', text: a[i - 1] })
      i -= 1
      j -= 1
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      lines.push({ type: 'add', text: b[j - 1] })
      j -= 1
    } else {
      lines.push({ type: 'remove', text: a[i - 1] })
      i -= 1
    }
  }
  result.value = lines.reverse()
}

const summary = computed(() => ({
  added: result.value.filter((line) => line.type === 'add').length,
  removed: result.value.filter((line) => line.type === 'remove').length,
}))
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">文本比较</p>
        <h2>文本 Diff</h2>
        <p>按行比较两段文本，标记新增与删除内容，适合配置、日志和代码片段快速核对。</p>
      </div>
      <span class="privacy-chip">行级比较</span>
    </div>

    <div class="editor-grid">
      <label><span class="field-label">原始文本</span><textarea v-model="left" class="code-area compact-area" spellcheck="false"></textarea></label>
      <label><span class="field-label">修改后文本</span><textarea v-model="right" class="code-area compact-area" spellcheck="false"></textarea></label>
    </div>
    <div class="tool-actions"><button class="button primary" type="button" @click="compare">开始比较</button></div>
    <p v-if="error" class="error-text">{{ error }}</p>

    <div v-if="result.length" class="diff-result">
      <div class="diff-summary"><span>新增 {{ summary.added }} 行</span><span>删除 {{ summary.removed }} 行</span></div>
      <div class="diff-lines" role="region" aria-label="文本差异结果">
        <div v-for="(line, index) in result" :key="`${index}-${line.type}`" class="diff-line" :class="`diff-${line.type}`">
          <span>{{ line.type === 'add' ? '+' : line.type === 'remove' ? '−' : ' ' }}</span><code>{{ line.text || ' ' }}</code>
        </div>
      </div>
    </div>
  </div>
</template>
