<script setup lang="ts">
import { ref } from 'vue'
import MarkdownWordTool from '../components/tools/MarkdownWordTool.vue'
import ImageConvertTool from '../components/tools/ImageConvertTool.vue'
import DataConvertTool from '../components/tools/DataConvertTool.vue'
import BinaryConvertTool from '../components/tools/BinaryConvertTool.vue'

const tools = [
  { id: 'markdown', label: 'Markdown → Word', description: '导出 .docx' },
  { id: 'image', label: '图片转换', description: 'PNG / JPEG / WebP' },
  { id: 'data', label: '数据转换', description: 'JSON / CSV / TSV' },
  { id: 'binary', label: '二进制转换', description: 'Text / Hex / Base64' },
] as const

type ToolId = (typeof tools)[number]['id']
const activeTool = ref<ToolId>('markdown')
</script>

<template>
  <section class="tools-layout page-width">
    <aside class="tool-sidebar">
      <div class="section-heading compact">
        <p class="eyebrow">TOOLBOX</p>
        <h1>网页工具箱</h1>
        <p>所有文件处理默认只在当前浏览器中完成。</p>
      </div>
      <div class="tool-menu">
        <button
          v-for="tool in tools"
          :key="tool.id"
          class="tool-menu-item"
          :class="{ active: activeTool === tool.id }"
          type="button"
          @click="activeTool = tool.id"
        >
          <span>{{ tool.label }}</span>
          <small>{{ tool.description }}</small>
        </button>
      </div>
    </aside>

    <div class="tool-workspace">
      <MarkdownWordTool v-if="activeTool === 'markdown'" />
      <ImageConvertTool v-else-if="activeTool === 'image'" />
      <DataConvertTool v-else-if="activeTool === 'data'" />
      <BinaryConvertTool v-else />
    </div>
  </section>
</template>
