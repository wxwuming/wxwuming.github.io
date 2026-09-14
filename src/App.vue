<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import IconGlyph from './components/IconGlyph.vue'
</script>

<template>
  <div class="site-shell">
    <header class="site-header">
      <div class="site-header-inner">
        <RouterLink class="brand" to="/" aria-label="Wuming 首页">
          <span class="brand-mark">W</span>
          <span class="brand-lockup">
            <strong>Wuming</strong>
            <small>浏览器工具</small>
          </span>
        </RouterLink>

        <nav class="nav-links" aria-label="主导航">
          <RouterLink class="nav-item" to="/">主页</RouterLink>
          <RouterLink class="nav-item" to="/tools">工具箱</RouterLink>
          <a class="nav-item nav-item-external" href="https://github.com/wxwuming" target="_blank" rel="noreferrer">
            <IconGlyph name="github" :size="16" />
            <span>GitHub</span>
          </a>
        </nav>
      </div>
    </header>

    <main>
      <RouterView />
    </main>

    <footer class="site-footer">
      <div class="site-footer-inner">
        <div class="footer-brand">
          <span class="footer-mark">W</span>
          <div>
            <strong>Wuming 工具箱</strong>
            <span>轻量、直接、在浏览器里完成。</span>
          </div>
        </div>
        <div class="footer-meta">
          <span>© {{ new Date().getFullYear() }} Wuming</span>
          <a href="https://github.com/wxwuming" target="_blank" rel="noreferrer">GitHub ↗</a>
        </div>
      </div>
    </footer>
  </div>
</template>
