<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="site-shell">
    <header class="site-header">
      <div class="site-header-inner">
        <RouterLink class="brand" to="/">
          <span class="brand-mark">W</span>
          <span>Wuming</span>
        </RouterLink>
        <nav class="nav-links" aria-label="主导航">
          <RouterLink to="/">主页</RouterLink>
          <RouterLink to="/tools">工具箱</RouterLink>
          <a href="https://github.com/wxwuming" target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
      </div>
    </header>

    <main>
      <RouterView />
    </main>

    <footer class="site-footer">
      <div class="site-footer-inner">
        <span>© {{ new Date().getFullYear() }} Wuming</span>
        <span>Wuming Tools · 简洁、实用的在线工具集合</span>
      </div>
    </footer>
  </div>
</template>
