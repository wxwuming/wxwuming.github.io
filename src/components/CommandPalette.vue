<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import IconGlyph from './IconGlyph.vue'
import {
  allTools,
  favoritesChangedEvent,
  getToolGroup,
  readFavoriteToolIds,
  readRecentToolIds,
  recentToolsChangedEvent,
  recordRecentTool,
  toggleFavoriteTool,
  type ToolId,
} from '../data/tools'

const router = useRouter()
const isOpen = ref(false)
const query = ref('')
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const favoriteIds = ref<ToolId[]>([])
const recentIds = ref<ToolId[]>([])
let returnFocus: HTMLElement | null = null

const normalizedQuery = computed(() => query.value.trim().toLowerCase())
const orderedTools = computed(() => {
  if (normalizedQuery.value) {
    return allTools.filter((tool) => {
      const group = getToolGroup(tool.id)
      const haystack = [tool.label, tool.description, group?.label ?? '', ...tool.keywords].join(' ').toLowerCase()
      return haystack.includes(normalizedQuery.value)
    })
  }

  const priority = [...favoriteIds.value, ...recentIds.value]
  const seen = new Set<ToolId>()
  const ordered = priority
    .map((id) => allTools.find((tool) => tool.id === id))
    .filter((tool): tool is (typeof allTools)[number] => Boolean(tool))
    .filter((tool) => {
      if (seen.has(tool.id)) return false
      seen.add(tool.id)
      return true
    })

  for (const tool of allTools) {
    if (!seen.has(tool.id)) ordered.push(tool)
  }

  return ordered
})

function syncStoredTools() {
  favoriteIds.value = readFavoriteToolIds()
  recentIds.value = readRecentToolIds()
}

function openPalette() {
  if (isOpen.value) return
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  syncStoredTools()
  query.value = ''
  activeIndex.value = 0
  isOpen.value = true
  document.body.classList.add('command-palette-open')
  void nextTick(() => inputRef.value?.focus())
}

function closePalette() {
  if (!isOpen.value) return
  isOpen.value = false
  document.body.classList.remove('command-palette-open')
  void nextTick(() => returnFocus?.focus())
}

async function openTool(toolId: ToolId) {
  recordRecentTool(toolId)
  closePalette()
  await router.push({ path: '/tools', query: { tool: toolId } })
}

function toggleFavorite(toolId: ToolId) {
  favoriteIds.value = toggleFavoriteTool(toolId)
}

function onGlobalKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    isOpen.value ? closePalette() : openPalette()
    return
  }

  if (!isOpen.value || isTyping && target !== inputRef.value) return

  if (event.key === 'Escape') {
    event.preventDefault()
    closePalette()
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, orderedTools.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (event.key === 'Enter' && orderedTools.value[activeIndex.value]) {
    event.preventDefault()
    void openTool(orderedTools.value[activeIndex.value].id)
  }
}

watch(orderedTools, () => {
  activeIndex.value = Math.min(activeIndex.value, Math.max(orderedTools.value.length - 1, 0))
})

onMounted(() => {
  syncStoredTools()
  window.addEventListener('keydown', onGlobalKeydown)
  window.addEventListener(favoritesChangedEvent, syncStoredTools)
  window.addEventListener(recentToolsChangedEvent, syncStoredTools)
})

onBeforeUnmount(() => {
  document.body.classList.remove('command-palette-open')
  window.removeEventListener('keydown', onGlobalKeydown)
  window.removeEventListener(favoritesChangedEvent, syncStoredTools)
  window.removeEventListener(recentToolsChangedEvent, syncStoredTools)
})

defineExpose({ openPalette })
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="command-backdrop" @mousedown.self="closePalette">
      <section class="command-dialog" role="dialog" aria-modal="true" aria-label="搜索并打开工具">
        <div class="command-search-row">
          <IconGlyph name="search" :size="19" />
          <input
            ref="inputRef"
            v-model="query"
            type="search"
            autocomplete="off"
            placeholder="搜索工具、格式或任务…"
            aria-label="搜索工具"
          />
          <kbd>Esc</kbd>
        </div>

        <div class="command-context">
          <span v-if="normalizedQuery">搜索结果</span>
          <span v-else-if="favoriteIds.length">收藏、最近使用与全部工具</span>
          <span v-else>最近使用与全部工具</span>
          <strong>{{ orderedTools.length }} 项</strong>
        </div>

        <div v-if="orderedTools.length" class="command-results" role="listbox">
          <div
            v-for="(tool, index) in orderedTools"
            :key="tool.id"
            class="command-result-row"
            :class="{ active: index === activeIndex }"
            @mouseenter="activeIndex = index"
          >
            <button class="command-result-main" type="button" @click="openTool(tool.id)">
              <span class="command-result-icon"><IconGlyph :name="tool.icon" :size="17" /></span>
              <span class="command-result-copy">
                <strong>{{ tool.label }}</strong>
                <small>{{ getToolGroup(tool.id)?.label }} · {{ tool.description }}</small>
              </span>
              <span v-if="recentIds.includes(tool.id)" class="command-result-tag">最近</span>
              <IconGlyph name="arrow" :size="15" />
            </button>
            <button
              class="command-favorite-button"
              :class="{ active: favoriteIds.includes(tool.id) }"
              type="button"
              :aria-label="favoriteIds.includes(tool.id) ? `取消收藏 ${tool.label}` : `收藏 ${tool.label}`"
              :title="favoriteIds.includes(tool.id) ? '取消收藏' : '收藏工具'"
              @click="toggleFavorite(tool.id)"
            >
              <IconGlyph name="star" :size="16" />
            </button>
          </div>
        </div>
        <div v-else class="command-empty">
          <IconGlyph name="search" :size="22" />
          <strong>没有找到匹配工具</strong>
          <span>尝试输入 JSON、时间戳、Base64、正则等关键词。</span>
        </div>

        <footer class="command-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
          <span><kbd>Enter</kbd> 打开</span>
          <span><IconGlyph name="star" :size="13" /> 收藏保存在当前浏览器</span>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
