<script setup lang="ts">
import { RouterLink } from 'vue-router'

const features = [
  { title: '文档与数据', text: 'Markdown 导出 Word，JSON、CSV、TSV 数据互转。' },
  { title: '图片处理', text: '转换 PNG、JPEG、WebP，并调整尺寸与输出质量。' },
  { title: '编码与校验', text: '处理 Base64、Hex、URL 编码和 SHA 哈希校验。' },
  { title: '日常效率工具', text: '提供时间戳、UUID 与常用文本批量处理能力。' },
]

const toolOverview = [
  { name: '文档与数据', format: 'DOCX · JSON · CSV' },
  { name: '图片处理', format: '转换 · 缩放 · 压缩' },
  { name: '编码解码', format: 'Base64 · Hex · URL' },
  { name: '内容校验', format: 'SHA-256 · 384 · 512' },
  { name: '效率工具', format: '时间戳 · UUID · 文本' },
]
</script>

<template>
  <section class="hero page-width">
    <div class="hero-copy">
      <p class="eyebrow">WUMING / ONLINE TOOLS</p>
      <h1>常用工具，<br />打开就能使用。</h1>
      <p class="hero-text">
        集中处理文档、图片、数据、编码校验与常用文本任务，减少重复操作和网站切换，
        让日常处理更简单、更高效。
      </p>
      <div class="hero-actions">
        <RouterLink class="button primary" to="/tools">打开工具箱</RouterLink>
        <a class="button ghost" href="https://github.com/wxwuming" target="_blank" rel="noreferrer">访问 GitHub</a>
      </div>
    </div>
    <div class="hero-card tool-overview-card" aria-label="工具概览">
      <div class="overview-header">
        <div>
          <span class="overview-kicker">TOOLBOX</span>
          <strong>常用工具</strong>
        </div>
        <span class="overview-status"><i></i> 可用</span>
      </div>
      <div class="overview-list">
        <div v-for="item in toolOverview" :key="item.name" class="overview-item">
          <span>{{ item.name }}</span>
          <strong>{{ item.format }}</strong>
        </div>
      </div>
      <div class="overview-footer">
        <span>无需安装</span>
        <span>即开即用</span>
      </div>
    </div>
  </section>

  <section class="page-width section-block">
    <div class="section-heading">
      <p class="eyebrow">TOOLS</p>
      <h2>现在可以做什么</h2>
    </div>
    <div class="feature-grid">
      <article v-for="item in features" :key="item.title" class="feature-card">
        <span class="feature-index">0{{ features.indexOf(item) + 1 }}</span>
        <h3>{{ item.title }}</h3>
        <p>{{ item.text }}</p>
      </article>
    </div>
  </section>

  <section class="page-width about-section">
    <div>
      <p class="eyebrow">ABOUT</p>
      <h2>关于 Wuming</h2>
    </div>
    <p>
      Wuming Tools 提供一组轻量、实用的日常工具，覆盖常见文档、图片、数据和编码处理场景。
      目标是让高频的小任务更直接完成，把时间留给真正重要的工作。
    </p>
  </section>
</template>
