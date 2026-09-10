<script setup lang="ts">
import { RouterLink } from 'vue-router'

const features = [
  { title: 'Markdown → Word', text: '将 Markdown 内容直接导出为标准 .docx 文件。' },
  { title: '图片格式转换', text: '在 PNG、JPEG、WebP 之间本地转换，无需上传服务器。' },
  { title: '数据格式转换', text: 'JSON、CSV、TSV 常用文本数据格式快速互转。' },
  { title: '二进制转换', text: '文本、Hex、Base64、UTF-8 字节之间即时转换。' },
]
</script>

<template>
  <section class="hero page-width">
    <div class="hero-copy">
      <p class="eyebrow">WUMING / PERSONAL TOOLBOX</p>
      <h1>把常用的小工具，<br />放在自己的网页里。</h1>
      <p class="hero-text">
        这是 Wuming 的个人主页与前端工具集合。工具尽量在浏览器本地完成处理，
        适合部署在 <strong>wxwuming.github.io</strong> 作为随时可用的静态工具站。
      </p>
      <div class="hero-actions">
        <RouterLink class="button primary" to="/tools">打开工具箱</RouterLink>
        <a class="button ghost" href="https://github.com/wxwuming" target="_blank" rel="noreferrer">访问 GitHub</a>
      </div>
    </div>
    <div class="hero-card" aria-hidden="true">
      <div class="terminal-bar"><span></span><span></span><span></span></div>
      <pre><code>$ whoami
wuming

$ cat mission.txt
Build useful things.
Keep them simple.
Own the workflow.

$ tools --status
✓ browser-first
✓ privacy-friendly
✓ open & extensible</code></pre>
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
      这里可以继续补充你的个人简介、项目经历、联系方式和作品入口。
      当前版本先把它作为一个干净、快速、可持续扩展的个人工具主页基础。
    </p>
  </section>
</template>
