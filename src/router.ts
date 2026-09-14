import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import ToolsView from './views/ToolsView.vue'
import { allTools, isToolId } from './data/tools'

const siteTitle = 'Wuming Tools · 在线工具箱'
const siteDescription = 'Wuming Tools 提供文档、图片、JSON、正则、编码、时间戳与文本等常用在线工具，打开浏览器即可使用。'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: siteTitle, description: siteDescription } },
    { path: '/tools', name: 'tools', component: ToolsView, meta: { title: '网页工具箱 · Wuming Tools', description: siteDescription } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}

router.afterEach((to) => {
  const tool = to.name === 'tools' && isToolId(to.query.tool)
    ? allTools.find((item) => item.id === to.query.tool)
    : undefined

  const title = tool
    ? `${tool.label} · Wuming Tools`
    : typeof to.meta.title === 'string' ? to.meta.title : siteTitle
  const description = tool
    ? `${tool.label}：${tool.description}。无需安装软件，直接在浏览器中使用。`
    : typeof to.meta.description === 'string' ? to.meta.description : siteDescription

  document.title = title
  setMeta('meta[name="description"]', 'name', 'description', description)
  setMeta('meta[property="og:title"]', 'property', 'og:title', title)
  setMeta('meta[property="og:description"]', 'property', 'og:description', description)
})

export default router
