<script setup lang="ts">
import { nextTick, ref } from 'vue'
import MarkdownWordTool from '../components/tools/MarkdownWordTool.vue'
import ImageConvertTool from '../components/tools/ImageConvertTool.vue'
import DataConvertTool from '../components/tools/DataConvertTool.vue'
import BinaryConvertTool from '../components/tools/BinaryConvertTool.vue'
import UrlCodecTool from '../components/tools/UrlCodecTool.vue'
import HashTool from '../components/tools/HashTool.vue'
import TimestampTool from '../components/tools/TimestampTool.vue'
import UuidTool from '../components/tools/UuidTool.vue'
import TextTool from '../components/tools/TextTool.vue'

const toolGroups = [
  {
    label: '文件与格式',
    tools: [
      { id: 'markdown', label: 'Markdown → Word', description: '导出 .docx' },
      { id: 'image', label: '图片处理', description: '转换 / 缩放 / 压缩' },
      { id: 'data', label: '数据转换', description: 'JSON / CSV / TSV' },
    ],
  },
  {
    label: '编码与校验',
    tools: [
      { id: 'binary', label: '编码转换', description: 'Text / Hex / Base64' },
      { id: 'url', label: 'URL 编解码', description: 'URI / Component' },
      { id: 'hash', label: '哈希校验', description: 'SHA-256 / 384 / 512' },
    ],
  },
  {
    label: '日常工具',
    tools: [
      { id: 'timestamp', label: '时间戳转换', description: 'Unix / DateTime' },
      { id: 'uuid', label: 'UUID 生成器', description: 'UUID v4' },
      { id: 'text', label: '文本处理', description: '统计 / 去重 / 排序' },
    ],
  },
] as const

type ToolId = (typeof toolGroups)[number]['tools'][number]['id']
const activeTool = ref<ToolId>('markdown')

async function selectTool(toolId: ToolId) {
  if (activeTool.value === toolId) return

  const scrollTop = window.scrollY
  activeTool.value = toolId
  await nextTick()

  requestAnimationFrame(() => {
    window.scrollTo({ top: scrollTop, left: 0, behavior: 'auto' })
  })
}
</script>

<template>
  <section class="tools-layout page-width">
    <aside class="tool-sidebar">
      <div class="section-heading compact">
        <p class="eyebrow">TOOLBOX</p>
        <h1>网页工具箱</h1>
        <p>选择需要的工具，快速完成常见格式转换与内容处理。</p>
      </div>
      <div class="tool-menu">
        <div v-for="group in toolGroups" :key="group.label" class="tool-menu-group">
          <p class="tool-menu-group-title">{{ group.label }}</p>
          <button
            v-for="tool in group.tools"
            :key="tool.id"
            class="tool-menu-item"
            :class="{ active: activeTool === tool.id }"
            type="button"
            @click="selectTool(tool.id)"
          >
            <span>{{ tool.label }}</span>
            <small>{{ tool.description }}</small>
          </button>
        </div>
      </div>
    </aside>

    <div class="tool-workspace">
      <MarkdownWordTool v-if="activeTool === 'markdown'" />
      <ImageConvertTool v-else-if="activeTool === 'image'" />
      <DataConvertTool v-else-if="activeTool === 'data'" />
      <BinaryConvertTool v-else-if="activeTool === 'binary'" />
      <UrlCodecTool v-else-if="activeTool === 'url'" />
      <HashTool v-else-if="activeTool === 'hash'" />
      <TimestampTool v-else-if="activeTool === 'timestamp'" />
      <UuidTool v-else-if="activeTool === 'uuid'" />
      <TextTool v-else />
    </div>
  </section>
</template>
