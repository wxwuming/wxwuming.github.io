<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import IconGlyph from '../components/IconGlyph.vue'
import {
  allTools,
  favoritesChangedEvent,
  readFavoriteToolIds,
  readRecentToolIds,
  recentToolsChangedEvent,
  toolGroups,
  type ToolId,
} from '../data/tools'

const searchText = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const recentToolIds = ref<ToolId[]>([])
const favoriteToolIds = ref<ToolId[]>([])

const popularToolIds: ToolId[] = ['json', 'timestamp', 'data', 'binary', 'regex']
const popularTools = popularToolIds
  .map((id) => allTools.find((tool) => tool.id === id))
  .filter((tool) => tool !== undefined)

const normalizedSearch = computed(() => searchText.value.trim().toLowerCase())
const filteredTools = computed(() => {
  if (!normalizedSearch.value) return []
  return allTools.filter((tool) => {
    const haystack = [tool.label, tool.description, ...tool.keywords].join(' ').toLowerCase()
    return haystack.includes(normalizedSearch.value)
  })
})

const recentTools = computed(() =>
  recentToolIds.value
    .map((id) => allTools.find((tool) => tool.id === id))
    .filter((tool) => tool !== undefined),
)

const favoriteTools = computed(() =>
  favoriteToolIds.value
    .map((id) => allTools.find((tool) => tool.id === id))
    .filter((tool) => tool !== undefined),
)

function toolRoute(id: ToolId) {
  return { path: '/tools', query: { tool: id } }
}

function focusSearch(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable
  if (event.key !== '/' || isTyping) return
  event.preventDefault()
  searchInputRef.value?.focus()
  searchInputRef.value?.select()
}

function syncStoredTools() {
  recentToolIds.value = readRecentToolIds()
  favoriteToolIds.value = readFavoriteToolIds()
}

onMounted(() => {
  syncStoredTools()
  window.addEventListener('keydown', focusSearch)
  window.addEventListener(favoritesChangedEvent, syncStoredTools)
  window.addEventListener(recentToolsChangedEvent, syncStoredTools)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', focusSearch)
  window.removeEventListener(favoritesChangedEvent, syncStoredTools)
  window.removeEventListener(recentToolsChangedEvent, syncStoredTools)
})
</script>

<template>
  <section class="hero home-hero page-width">
    <div class="hero-copy">
      <div class="hero-kicker-row">
        <p class="eyebrow">WUMING / 在线工具</p>
        <span class="live-dot">{{ allTools.length }} 项工具可用</span>
      </div>
      <h1>常用在线工具，<br /><span>打开即可使用。</span></h1>
      <p class="hero-text">
        文档、图片、数据、开发调试、编码与文本工具集中在一个页面。无需安装软件，无需注册账号，常见处理任务尽量在浏览器本地完成。
      </p>

      <div class="tool-search-shell">
        <div class="tool-search-input-wrap">
          <IconGlyph name="search" :size="18" />
          <input
            ref="searchInputRef"
            v-model="searchText"
            class="tool-search-input"
            type="search"
            autocomplete="off"
            placeholder="搜索工具，例如：时间戳、JSON、Base64、正则"
            aria-label="搜索工具"
          />
          <kbd>/</kbd>
        </div>
        <div v-if="normalizedSearch" class="tool-search-results" aria-live="polite">
          <RouterLink
            v-for="tool in filteredTools"
            :key="tool.id"
            class="tool-search-result"
            :to="toolRoute(tool.id)"
          >
            <span class="search-result-icon"><IconGlyph :name="tool.icon" :size="17" /></span>
            <span><strong>{{ tool.label }}</strong><small>{{ tool.description }}</small></span>
            <IconGlyph name="arrow" :size="15" />
          </RouterLink>
          <p v-if="filteredTools.length === 0" class="search-empty">没有找到匹配工具，可以尝试其他关键词。</p>
        </div>
      </div>

      <div class="hero-actions">
        <RouterLink class="button primary" to="/tools">浏览全部工具 <IconGlyph name="arrow" :size="16" /></RouterLink>
      </div>
      <div class="hero-facts" aria-label="站点特点">
        <span><i></i> 浏览器内处理</span>
        <span><i></i> 无需账号</span>
        <span><i></i> Ctrl K 全局搜索</span>
      </div>
    </div>

    <div class="utility-console" aria-label="常用工具">
      <div class="console-topbar">
        <div class="console-dots" aria-hidden="true"><i></i><i></i><i></i></div>
        <span>常用工具</span>
        <span class="console-ready">可用</span>
      </div>
      <div class="console-body">
        <div class="console-heading">
          <div><span>快速入口</span><strong>直接进入工具</strong></div>
          <span class="console-count">{{ String(allTools.length).padStart(2, '0') }}</span>
        </div>
        <div class="console-list">
          <RouterLink v-for="tool in popularTools" :key="tool.id" class="console-item" :to="toolRoute(tool.id)">
            <span class="console-icon"><IconGlyph :name="tool.icon" :size="17" /></span>
            <span class="console-name">{{ tool.label }}</span>
            <code>{{ tool.description }}</code>
            <IconGlyph class="console-arrow" name="arrow" :size="15" />
          </RouterLink>
        </div>
        <div class="console-footer"><span>无需安装</span><span>数据尽量留在本地</span></div>
      </div>
    </div>
  </section>

  <section v-if="favoriteTools.length" class="recent-section favorite-section page-width">
    <div class="recent-heading">
      <div><p class="eyebrow">我的收藏</p><h2>常用工具，一次直达。</h2></div>
      <span>收藏保存在当前浏览器</span>
    </div>
    <div class="recent-tools">
      <RouterLink v-for="tool in favoriteTools" :key="tool.id" class="recent-tool favorite-tool" :to="toolRoute(tool.id)">
        <span class="recent-tool-icon"><IconGlyph :name="tool.icon" :size="17" /></span>
        <span><strong>{{ tool.label }}</strong><small>{{ tool.description }}</small></span>
        <IconGlyph name="star" :size="15" />
      </RouterLink>
    </div>
  </section>

  <section v-if="recentTools.length" class="recent-section page-width">
    <div class="recent-heading">
      <div><p class="eyebrow">最近使用</p><h2>继续上次的工具。</h2></div>
      <span>保存在当前浏览器</span>
    </div>
    <div class="recent-tools">
      <RouterLink v-for="tool in recentTools" :key="tool.id" class="recent-tool" :to="toolRoute(tool.id)">
        <span class="recent-tool-icon"><IconGlyph :name="tool.icon" :size="17" /></span>
        <span><strong>{{ tool.label }}</strong><small>{{ tool.description }}</small></span>
        <IconGlyph name="arrow" :size="15" />
      </RouterLink>
    </div>
  </section>

  <section class="capability-section page-width">
    <div class="section-heading-row">
      <div class="section-heading">
        <p class="eyebrow">全部工具</p>
        <h2>按任务快速找到工具。</h2>
      </div>
      <p>工具按实际任务分类，每个入口都可以直接打开和分享。进入工具后可使用星标收藏，或按 Ctrl K 在任意页面快速搜索。</p>
    </div>

    <div class="tool-category-grid">
      <article v-for="group in toolGroups" :key="group.label" class="tool-category-card">
        <div class="category-card-head">
          <div><span>{{ group.code }}</span><h3>{{ group.label }}</h3></div>
          <code>{{ String(group.tools.length).padStart(2, '0') }}</code>
        </div>
        <p>{{ group.description }}</p>
        <div class="category-tool-list">
          <RouterLink v-for="tool in group.tools" :key="tool.id" :to="toolRoute(tool.id)">
            <span class="category-tool-icon"><IconGlyph :name="tool.icon" :size="16" /></span>
            <span><strong>{{ tool.label }}</strong><small>{{ tool.description }}</small></span>
            <IconGlyph name="arrow" :size="14" />
          </RouterLink>
        </div>
      </article>
    </div>
  </section>

  <section class="about-section trust-section page-width">
    <div class="about-main">
      <p class="eyebrow">使用方式</p>
      <h2>简单、直接，也更关注数据边界。</h2>
    </div>
    <div class="about-copy trust-points">
      <p>当前工具以浏览器端处理为主，常见文本和文件任务无需额外安装软件，也不要求登录账号。</p>
      <div class="trust-list">
        <span><IconGlyph name="shield" :size="16" /> 浏览器内处理</span>
        <span><IconGlyph name="document" :size="16" /> 无需上传即可完成的任务尽量不上传</span>
        <span><IconGlyph name="star" :size="16" /> 收藏与最近使用仅保存在当前浏览器</span>
      </div>
    </div>
    <div class="about-signature" aria-hidden="true">W</div>
  </section>
</template>
