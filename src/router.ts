import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import ToolsView from './views/ToolsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: 'Wuming · 浏览器工具' } },
    { path: '/tools', name: 'tools', component: ToolsView, meta: { title: '网页工具箱 · Wuming' } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  document.title = typeof to.meta.title === 'string' ? to.meta.title : 'Wuming · 浏览器工具'
})

export default router
