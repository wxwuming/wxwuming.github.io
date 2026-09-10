<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="site-shell">
    <header class="site-header">
      <RouterLink class="brand" to="/">
        <span class="brand-mark">W</span>
        <span>Wuming</span>
      </RouterLink>
      <nav class="nav-links" aria-label="主导航">
        <RouterLink to="/">主页</RouterLink>
        <RouterLink to="/tools">工具箱</RouterLink>
        <a href="https://github.com/wxwuming" target="_blank" rel="noreferrer">GitHub</a>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>

    <footer class="site-footer">
      <span>© {{ new Date().getFullYear() }} Wuming</span>
      <span>Built with Vue 3 + TypeScript · All conversions run locally in your browser.</span>
    </footer>
  </div>
</template>
