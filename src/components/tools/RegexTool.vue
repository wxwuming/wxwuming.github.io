<script setup lang="ts">
import { computed, ref } from 'vue'

const pattern = ref('')
const flags = ref('g')
const source = ref('')

const analysis = computed(() => {
  if (!pattern.value) return { error: '', matches: [] as Array<{ index: number; value: string; groups: string[] }> }

  try {
    const uniqueFlags = [...new Set(flags.value.replace(/[^dgimsuvy]/g, '').split(''))].join('')
    const scanFlags = uniqueFlags.includes('g') ? uniqueFlags : `${uniqueFlags}g`
    const expression = new RegExp(pattern.value, scanFlags)
    const matches: Array<{ index: number; value: string; groups: string[] }> = []
    let match: RegExpExecArray | null

    while ((match = expression.exec(source.value)) && matches.length < 200) {
      matches.push({
        index: match.index,
        value: match[0],
        groups: match.slice(1).map((group) => group ?? ''),
      })
      if (match[0] === '') expression.lastIndex += 1
    }

    return { error: '', matches }
  } catch (reason) {
    return {
      error: reason instanceof Error ? reason.message : '正则表达式无效。',
      matches: [] as Array<{ index: number; value: string; groups: string[] }>,
    }
  }
})
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">开发与调试</p>
        <h2>正则测试</h2>
        <p>在浏览器中测试 JavaScript 正则表达式，查看匹配内容、起始位置和捕获分组。</p>
      </div>
      <span class="privacy-chip">最多展示 200 项</span>
    </div>

    <div class="regex-input-grid">
      <label><span class="field-label">表达式</span><input v-model="pattern" class="text-input" type="text" placeholder="例如：\b\w+@\w+\.\w+\b" spellcheck="false" /></label>
      <label><span class="field-label">标志</span><input v-model="flags" class="text-input" type="text" placeholder="gim" spellcheck="false" /></label>
    </div>

    <label><span class="field-label">测试文本</span><textarea v-model="source" class="code-area compact-area" spellcheck="false" placeholder="在这里粘贴需要测试的文本"></textarea></label>

    <p v-if="analysis.error" class="error-text" role="alert">{{ analysis.error }}</p>

    <div class="regex-summary" aria-live="polite">
      <strong>{{ analysis.matches.length }}</strong>
      <span>匹配结果</span>
      <span v-if="analysis.matches.length >= 200">已达到展示上限</span>
    </div>

    <div v-if="analysis.matches.length" class="regex-result-list">
      <div v-for="(match, index) in analysis.matches" :key="`${match.index}-${index}`" class="regex-result-row">
        <code>#{{ index + 1 }}</code>
        <div><strong>{{ match.value || '空匹配' }}</strong><small>位置 {{ match.index }}<template v-if="match.groups.length"> · {{ match.groups.length }} 个分组</template></small></div>
        <span v-if="match.groups.length">{{ match.groups.join(' · ') }}</span>
      </div>
    </div>
    <p v-else-if="pattern && !analysis.error" class="regex-empty">当前文本没有匹配结果。</p>
  </div>
</template>
