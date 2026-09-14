<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import IconGlyph from '../components/IconGlyph.vue'
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
    code: '文件',
    tools: [
      { id: 'markdown', icon: 'document', label: 'Markdown → Word', description: '导出标准 DOCX' },
      { id: 'image', icon: 'image', label: '图片处理', description: '转换 / 缩放 / 压缩' },
      { id: 'data', icon: 'data', label: '数据转换', description: 'JSON / CSV / TSV' },
    ],
  },
  {
    label: '编码与校验',
    code: '编码',
    tools: [
      { id: 'binary', icon: 'binary', label: '编码转换', description: '文本 / Hex / Base64' },
      { id: 'url', icon: 'link', label: 'URL 编解码', description: '链接 / 参数' },
      { id: 'hash', icon: 'hash', label: '哈希校验', description: 'SHA-256 / 384 / 512' },
    ],
  },
  {
    label: '日常工具',
    code: '效率',
    tools: [
      { id: 'timestamp', icon: 'time', label: '时间戳转换', description: 'Unix / 日期时间' },
      { id: 'uuid', icon: 'uuid', label: 'UUID 生成器', description: 'UUID v4' },
      { id: 'text', icon: 'text', label: '文本处理', description: '统计 / 去重 / 排序' },
    ],
  },
] as const

type ToolId = (typeof toolGroups)[number]['tools'][number]['id']
const activeTool = ref<ToolId>('markdown')
const workspaceRef = ref<HTMLElement | null>(null)
const workspaceMinHeight = ref(0)

const activeToolMeta = computed(() => {
  for (const group of toolGroups) {
    const tool = group.tools.find((item) => item.id === activeTool.value)
    if (tool) return { ...tool, group: group.label, code: group.code }
  }
  return null
})

function preserveWorkspaceHeight() {
  const workspace = workspaceRef.value
  if (!workspace) return

  workspaceMinHeight.value = Math.max(
    workspaceMinHeight.value,
    Math.ceil(workspace.getBoundingClientRect().height),
  )
}

async function selectTool(toolId: ToolId) {
  if (activeTool.value === toolId) return

  const scrollTop = window.scrollY
  preserveWorkspaceHeight()
  activeTool.value = toolId
  await nextTick()
  preserveWorkspaceHeight()

  requestAnimationFrame(() => {
    window.scrollTo({ top: scrollTop, left: 0, behavior: 'auto' })
  })
}
</script>

<template>
  <section class="toolbox-page page-width">
    <header class="toolbox-intro">
      <div>
        <p class="eyebrow">工具箱 / 9 项工具</p>
        <h1>网页工具箱</h1>
      </div>
      <p>选择一个工具，在同一工作区完成转换、编码、校验与文本处理。界面切换不会打断当前浏览位置。</p>
    </header>

    <div class="toolbox-statusbar" aria-label="工具箱状态">
      <span><i></i> 工具可用</span>
      <span>浏览器内处理</span>
      <span>无需安装</span>
    </div>

    <div class="tools-layout">
      <aside class="tool-sidebar" aria-label="工具导航">
      <div class="sidebar-heading">
        <span>全部工具</span>
        <code>09</code>
      </div>
      <div class="tool-menu">
        <div v-for="group in toolGroups" :key="group.label" class="tool-menu-group">
          <div class="tool-menu-group-title">
            <span>{{ group.label }}</span>
            <code>{{ group.code }}</code>
          </div>
          <button
            v-for="tool in group.tools"
            :key="tool.id"
            class="tool-menu-item"
            :class="{ active: activeTool === tool.id }"
            type="button"
            :aria-pressed="activeTool === tool.id"
            @click="selectTool(tool.id)"
          >
            <span class="tool-menu-icon"><IconGlyph :name="tool.icon" :size="17" /></span>
            <span class="tool-menu-copy">
              <strong>{{ tool.label }}</strong>
              <small>{{ tool.description }}</small>
            </span>
            <IconGlyph class="tool-menu-arrow" name="arrow" :size="15" />
          </button>
        </div>
      </div>
      <div class="sidebar-note">
        <span class="sidebar-note-icon"><IconGlyph name="shield" :size="17" /></span>
        <p><strong>浏览器内处理</strong><span>文件与内容在当前页面完成处理。</span></p>
      </div>
    </aside>

    <div
      ref="workspaceRef"
      class="tool-workspace"
      :style="workspaceMinHeight ? { minHeight: `${workspaceMinHeight}px` } : undefined"
    >
      <div class="workspace-toolbar" aria-live="polite">
        <div class="workspace-current">
          <span class="workspace-icon"><IconGlyph :name="activeToolMeta?.icon || 'document'" :size="16" /></span>
          <span><small>当前工具</small><strong>{{ activeToolMeta?.label }}</strong></span>
        </div>
        <div class="workspace-meta"><span>{{ activeToolMeta?.group }}</span><code>{{ activeToolMeta?.code }}</code></div>
      </div>
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
    </div>
  </section>
</template>
