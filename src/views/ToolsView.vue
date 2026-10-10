<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IconGlyph from '../components/IconGlyph.vue'

const MarkdownWordTool = defineAsyncComponent(() => import('../components/tools/MarkdownWordTool.vue'))
const PdfWordTool = defineAsyncComponent(() => import('../components/tools/PdfWordTool.vue'))
const ImageConvertTool = defineAsyncComponent(() => import('../components/tools/ImageConvertTool.vue'))
const ImageOcrTool = defineAsyncComponent(() => import('../components/tools/ImageOcrTool.vue'))
const TranslateTool = defineAsyncComponent(() => import('../components/tools/TranslateTool.vue'))
const DataConvertTool = defineAsyncComponent(() => import('../components/tools/DataConvertTool.vue'))
const JsonFormatTool = defineAsyncComponent(() => import('../components/tools/JsonFormatTool.vue'))
const YamlConvertTool = defineAsyncComponent(() => import('../components/tools/YamlConvertTool.vue'))
const JwtTool = defineAsyncComponent(() => import('../components/tools/JwtTool.vue'))
const RegexTool = defineAsyncComponent(() => import('../components/tools/RegexTool.vue'))
const TextDiffTool = defineAsyncComponent(() => import('../components/tools/TextDiffTool.vue'))
const CronTool = defineAsyncComponent(() => import('../components/tools/CronTool.vue'))
const ColorConvertTool = defineAsyncComponent(() => import('../components/tools/ColorConvertTool.vue'))
const BinaryConvertTool = defineAsyncComponent(() => import('../components/tools/BinaryConvertTool.vue'))
const BaseConvertTool = defineAsyncComponent(() => import('../components/tools/BaseConvertTool.vue'))
const HtmlEntityTool = defineAsyncComponent(() => import('../components/tools/HtmlEntityTool.vue'))
const UrlCodecTool = defineAsyncComponent(() => import('../components/tools/UrlCodecTool.vue'))
const HashTool = defineAsyncComponent(() => import('../components/tools/HashTool.vue'))
const QrCodeTool = defineAsyncComponent(() => import('../components/tools/QrCodeTool.vue'))
const TimestampTool = defineAsyncComponent(() => import('../components/tools/TimestampTool.vue'))
const UuidTool = defineAsyncComponent(() => import('../components/tools/UuidTool.vue'))
const RandomStringTool = defineAsyncComponent(() => import('../components/tools/RandomStringTool.vue'))
const PasswordTool = defineAsyncComponent(() => import('../components/tools/PasswordTool.vue'))
const TextTool = defineAsyncComponent(() => import('../components/tools/TextTool.vue'))
import {
  allTools,
  favoritesChangedEvent,
  isToolId,
  readFavoriteToolIds,
  recordRecentTool,
  toggleFavoriteTool,
  toolGroups,
  type ToolId,
} from '../data/tools'

const route = useRoute()
const router = useRouter()
const initialTool: ToolId = isToolId(route.query.tool) ? route.query.tool : 'markdown'
const activeTool = ref<ToolId>(initialTool)
const workspaceRef = ref<HTMLElement | null>(null)
const workspaceMinHeight = ref(0)
const favoriteIds = ref<ToolId[]>(readFavoriteToolIds())

recordRecentTool(initialTool)

const activeToolMeta = computed(() => {
  for (const group of toolGroups) {
    const tool = group.tools.find((item) => item.id === activeTool.value)
    if (tool) return { ...tool, group: group.label, code: group.code }
  }
  return null
})

const activeIsFavorite = computed(() => favoriteIds.value.includes(activeTool.value))

function syncFavorites() {
  favoriteIds.value = readFavoriteToolIds()
}

function toggleActiveFavorite() {
  favoriteIds.value = toggleFavoriteTool(activeTool.value)
}

function preserveWorkspaceHeight() {
  const workspace = workspaceRef.value
  if (!workspace) return

  workspaceMinHeight.value = Math.max(
    workspaceMinHeight.value,
    Math.ceil(workspace.getBoundingClientRect().height),
  )
}

async function setActiveTool(toolId: ToolId) {
  if (activeTool.value === toolId) {
    recordRecentTool(toolId)
    return
  }

  const scrollTop = window.scrollY
  preserveWorkspaceHeight()
  activeTool.value = toolId
  recordRecentTool(toolId)
  await nextTick()
  preserveWorkspaceHeight()

  requestAnimationFrame(() => {
    window.scrollTo({ top: scrollTop, left: 0, behavior: 'auto' })
  })
}

async function selectTool(toolId: ToolId) {
  await setActiveTool(toolId)
  if (route.query.tool !== toolId) {
    await router.replace({ query: { ...route.query, tool: toolId } })
  }
}

watch(
  () => route.query.tool,
  (toolId) => {
    if (isToolId(toolId)) void setActiveTool(toolId)
  },
)

onMounted(() => window.addEventListener(favoritesChangedEvent, syncFavorites))
onBeforeUnmount(() => window.removeEventListener(favoritesChangedEvent, syncFavorites))
</script>

<template>
  <section class="toolbox-page page-width">
    <header class="toolbox-intro">
      <div>
        <p class="eyebrow">工具箱 / {{ allTools.length }} 项工具</p>
        <h1>网页工具箱</h1>
      </div>
      <p>选择一个工具，在同一工作区完成转换、编码、校验与文本处理。每个工具都有独立链接，可以直接打开、分享或收藏。</p>
    </header>

    <div class="toolbox-statusbar" aria-label="工具箱状态">
      <span><i></i> 工具可用</span>
      <span>Ctrl K 快速搜索</span>
      <span>浏览器内处理</span>
      <span>无需安装</span>
    </div>

    <div class="tools-layout">
      <aside class="tool-sidebar" aria-label="工具导航">
        <div class="sidebar-heading">
          <span>全部工具</span>
          <code>{{ String(allTools.length).padStart(2, '0') }}</code>
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
          <div class="workspace-actions">
            <div class="workspace-meta"><span>{{ activeToolMeta?.group }}</span><code>{{ activeToolMeta?.code }}</code></div>
            <button
              class="workspace-favorite"
              :class="{ active: activeIsFavorite }"
              type="button"
              :aria-pressed="activeIsFavorite"
              :title="activeIsFavorite ? '取消收藏' : '收藏当前工具'"
              @click="toggleActiveFavorite"
            >
              <IconGlyph name="star" :size="15" />
              <span>{{ activeIsFavorite ? '已收藏' : '收藏' }}</span>
            </button>
          </div>
        </div>
        <MarkdownWordTool v-if="activeTool === 'markdown'" />
        <PdfWordTool v-else-if="activeTool === 'pdf-word'" />
        <ImageConvertTool v-else-if="activeTool === 'image'" />
        <ImageOcrTool v-else-if="activeTool === 'ocr'" />
        <TranslateTool v-else-if="activeTool === 'translate'" />
        <DataConvertTool v-else-if="activeTool === 'data'" />
        <JsonFormatTool v-else-if="activeTool === 'json'" />
        <YamlConvertTool v-else-if="activeTool === 'yaml'" />
        <JwtTool v-else-if="activeTool === 'jwt'" />
        <RegexTool v-else-if="activeTool === 'regex'" />
        <TextDiffTool v-else-if="activeTool === 'diff'" />
        <CronTool v-else-if="activeTool === 'cron'" />
        <ColorConvertTool v-else-if="activeTool === 'color'" />
        <BinaryConvertTool v-else-if="activeTool === 'binary'" />
        <BaseConvertTool v-else-if="activeTool === 'base'" />
        <HtmlEntityTool v-else-if="activeTool === 'html'" />
        <UrlCodecTool v-else-if="activeTool === 'url'" />
        <HashTool v-else-if="activeTool === 'hash'" />
        <QrCodeTool v-else-if="activeTool === 'qr'" />
        <TimestampTool v-else-if="activeTool === 'timestamp'" />
        <UuidTool v-else-if="activeTool === 'uuid'" />
        <RandomStringTool v-else-if="activeTool === 'random'" />
        <PasswordTool v-else-if="activeTool === 'password'" />
        <TextTool v-else />
      </div>
    </div>
  </section>
</template>
