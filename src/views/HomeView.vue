<script setup lang="ts">
import { RouterLink } from 'vue-router'
import IconGlyph from '../components/IconGlyph.vue'

const features = [
  { icon: 'document', index: '01', title: '文档与格式', text: 'Markdown 导出 Word，JSON、CSV、TSV 与常见图片格式快速转换。', meta: 'DOCX · JSON · CSV · PNG' },
  { icon: 'binary', index: '02', title: '编码与校验', text: '处理文本、Hex、Base64、URL 编解码，并生成 SHA-2 摘要。', meta: 'HEX · BASE64 · URL · SHA' },
  { icon: 'time', index: '03', title: '日常效率', text: '时间戳转换、UUID 批量生成与文本清理，覆盖高频小任务。', meta: '时间 · UUID · 文本' },
]

const toolOverview = [
  { icon: 'document', name: 'Markdown → Word', detail: 'DOCX' },
  { icon: 'image', name: '图片处理', detail: 'PNG / JPG / WebP' },
  { icon: 'data', name: '数据转换', detail: 'JSON / CSV / TSV' },
  { icon: 'binary', name: '编码转换', detail: '文本 / Hex / Base64' },
  { icon: 'hash', name: '哈希校验', detail: 'SHA-2' },
]
</script>

<template>
  <section class="hero page-width">
    <div class="hero-copy">
      <div class="hero-kicker-row">
        <p class="eyebrow">WUMING / 浏览器工具</p>
        <span class="live-dot">9 项工具可用</span>
      </div>
      <h1>把琐碎任务，<br /><span>留在浏览器里。</span></h1>
      <p class="hero-text">
        一个面向日常工作的轻量工具站。处理文档、图片、数据、编码和文本，打开页面即可开始，无需安装额外软件。
      </p>
      <div class="hero-actions">
        <RouterLink class="button primary" to="/tools">打开工具箱 <IconGlyph name="arrow" :size="16" /></RouterLink>
        <a class="button ghost" href="https://github.com/wxwuming" target="_blank" rel="noreferrer"><IconGlyph name="github" :size="16" /> GitHub</a>
      </div>
      <div class="hero-facts" aria-label="站点特点">
        <span><i></i> 浏览器内处理</span>
        <span><i></i> 无需账号</span>
        <span><i></i> 即开即用</span>
      </div>
    </div>

    <div class="utility-console" aria-label="工具箱能力概览">
      <div class="console-topbar">
        <div class="console-dots" aria-hidden="true"><i></i><i></i><i></i></div>
        <span>WUMING / 工具箱</span>
        <span class="console-ready">可用</span>
      </div>
      <div class="console-body">
        <div class="console-heading">
          <div><span>当前可用</span><strong>常用工具工作台</strong></div>
          <span class="console-count">09</span>
        </div>
        <div class="console-list">
          <RouterLink v-for="item in toolOverview" :key="item.name" class="console-item" to="/tools">
            <span class="console-icon"><IconGlyph :name="item.icon" :size="17" /></span>
            <span class="console-name">{{ item.name }}</span>
            <code>{{ item.detail }}</code>
            <IconGlyph class="console-arrow" name="arrow" :size="15" />
          </RouterLink>
        </div>
        <div class="console-footer"><span>浏览器内处理</span><span>无需上传文件</span></div>
      </div>
    </div>
  </section>

  <section class="capability-section page-width">
    <div class="section-heading-row">
      <div class="section-heading">
        <p class="eyebrow">工具能力</p>
        <h2>常用工作，一站处理。</h2>
      </div>
      <p>按任务类型组织工具，不需要记住复杂入口。进入工具箱后，可在同一个稳定工作区中连续切换。</p>
    </div>

    <div class="feature-grid">
      <RouterLink v-for="item in features" :key="item.title" class="feature-card" to="/tools">
        <div class="feature-card-top">
          <span class="feature-icon"><IconGlyph :name="item.icon" :size="20" /></span>
          <span class="feature-index">{{ item.index }}</span>
        </div>
        <div class="feature-card-copy">
          <h3>{{ item.title }}</h3>
          <p>{{ item.text }}</p>
        </div>
        <div class="feature-card-meta">
          <code>{{ item.meta }}</code>
          <IconGlyph name="arrow" :size="16" />
        </div>
      </RouterLink>
    </div>
  </section>

  <section class="about-section page-width">
    <div class="about-main">
      <p class="eyebrow">关于 Wuming</p>
      <h2>为高频的小任务，保留一个直接入口。</h2>
    </div>
    <div class="about-copy">
      <p>Wuming Tools 聚焦那些会反复出现、又不需要复杂软件的处理需求。界面保持克制，工具保持独立，让任务尽可能在当前页面完成。</p>
      <a href="https://github.com/wxwuming" target="_blank" rel="noreferrer" class="text-link">查看 GitHub <IconGlyph name="arrow" :size="15" /></a>
    </div>
    <div class="about-signature" aria-hidden="true">W</div>
  </section>
</template>
