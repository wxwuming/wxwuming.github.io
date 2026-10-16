export type ToolId =
  | 'markdown'
  | 'pdf-word'
  | 'image'
  | 'image-enhance'
  | 'ocr'
  | 'translate'
  | 'data'
  | 'json'
  | 'yaml'
  | 'jwt'
  | 'regex'
  | 'diff'
  | 'cron'
  | 'color'
  | 'binary'
  | 'base'
  | 'html'
  | 'url'
  | 'hash'
  | 'qr'
  | 'timestamp'
  | 'uuid'
  | 'random'
  | 'password'
  | 'text'

export interface ToolItem {
  id: ToolId
  icon: string
  label: string
  description: string
  keywords: readonly string[]
}

export interface ToolGroup {
  label: string
  code: string
  description: string
  tools: readonly ToolItem[]
}

export const toolGroups = [
  {
    label: '文件与格式',
    code: '文件',
    description: '处理文档、图片与结构化数据格式。',
    tools: [
      { id: 'markdown', icon: 'document', label: 'Markdown → Word', description: '导出标准 DOCX', keywords: ['markdown', 'word', 'docx', '文档'] },
      { id: 'pdf-word', icon: 'document', label: 'PDF ↔ Word', description: 'PDF / DOCX 双向转换', keywords: ['pdf', 'word', 'docx', '文档', '转换', '互转', '双向'] },
      { id: 'image', icon: 'image', label: '图片处理', description: '转换 / 缩放 / 压缩', keywords: ['图片', 'png', 'jpg', 'jpeg', 'webp', '压缩', '缩放'] },
      { id: 'image-enhance', icon: 'image', label: '图片高清增强', description: '像素放大 / 锐化 / 降噪', keywords: ['图片', '超清', '高清', '分辨率', '像素', '清晰度', '放大', '锐化', '降噪', 'upscale', 'enhance'] },
      { id: 'ocr', icon: 'scan', label: '图片转文字', description: 'OCR / 截图翻译', keywords: ['ocr', '图片', '文字识别', '图片转文字', '截图翻译', '中文', '英文', '扫描件'] },
      { id: 'translate', icon: 'translate', label: '文本翻译', description: '自动检测 / 多语言', keywords: ['翻译', 'translate', '中文', '英文', '日语', '韩语', '多语言'] },
      { id: 'data', icon: 'data', label: '数据转换', description: 'JSON / CSV / TSV', keywords: ['json', 'csv', 'tsv', '数据', '表格'] },
    ],
  },
  {
    label: '开发与调试',
    code: '开发',
    description: '格式化数据、测试表达式并处理开发常用值。',
    tools: [
      { id: 'json', icon: 'code', label: 'JSON 格式化', description: '美化 / 压缩 / 排序', keywords: ['json', '格式化', '美化', '压缩', 'pretty', 'minify'] },
      { id: 'yaml', icon: 'data', label: 'JSON ↔ YAML', description: '双向转换 / 配置文件', keywords: ['yaml', 'yml', 'json', '配置', '转换'] },
      { id: 'jwt', icon: 'token', label: 'JWT 解析', description: 'Header / Payload / 时间', keywords: ['jwt', 'token', '令牌', 'payload', 'header', 'exp'] },
      { id: 'regex', icon: 'regex', label: '正则测试', description: '匹配 / 分组 / 位置', keywords: ['正则', 'regex', 'regexp', '匹配', '测试'] },
      { id: 'diff', icon: 'diff', label: '文本 Diff', description: '新增 / 删除 / 行比较', keywords: ['diff', '文本', '比较', '差异', '对比'] },
      { id: 'cron', icon: 'calendar', label: 'Cron 表达式', description: '解析 / 下次执行', keywords: ['cron', '计划任务', '定时', '表达式', 'crontab'] },
      { id: 'color', icon: 'color', label: '颜色转换', description: 'HEX / RGB / HSL', keywords: ['颜色', 'color', 'hex', 'rgb', 'hsl'] },
    ],
  },
  {
    label: '编码与校验',
    code: '编码',
    description: '处理常见编码、链接参数与文件摘要。',
    tools: [
      { id: 'binary', icon: 'binary', label: '编码转换', description: '文本 / Hex / Base64', keywords: ['base64', 'hex', '文本', '编码', '二进制'] },
      { id: 'base', icon: 'radix', label: '进制转换', description: '2 / 8 / 10 / 16 进制', keywords: ['进制', '二进制', '八进制', '十进制', '十六进制', 'hex'] },
      { id: 'html', icon: 'html', label: 'HTML Entity', description: '实体编码 / 解码', keywords: ['html', 'entity', '实体', '编码', '转义'] },
      { id: 'url', icon: 'link', label: 'URL 编解码', description: '链接 / 参数', keywords: ['url', 'encode', 'decode', '链接', '参数'] },
      { id: 'hash', icon: 'hash', label: '哈希校验', description: 'SHA-256 / 384 / 512', keywords: ['hash', 'sha', 'sha256', '校验', '摘要'] },
    ],
  },
  {
    label: '日常工具',
    code: '效率',
    description: '覆盖时间、标识符、随机值与文本整理等高频任务。',
    tools: [
      { id: 'qr', icon: 'qr', label: '二维码工具', description: '生成 / 图片识别', keywords: ['二维码', 'qr', 'qrcode', '生成', '识别'] },
      { id: 'timestamp', icon: 'time', label: '时间戳转换', description: 'Unix / 日期时间', keywords: ['时间戳', 'unix', '日期', '时间'] },
      { id: 'uuid', icon: 'uuid', label: 'UUID 生成器', description: 'UUID v4', keywords: ['uuid', 'guid', '随机', '标识符'] },
      { id: 'random', icon: 'random', label: '随机字符串', description: '长度 / 数量 / 字符集', keywords: ['随机', '字符串', 'token', 'random'] },
      { id: 'password', icon: 'key', label: '密码生成器', description: '安全随机 / 字符集', keywords: ['密码', 'password', '安全', '随机', 'crypto'] },
      { id: 'text', icon: 'text', label: '文本处理', description: '统计 / 去重 / 排序', keywords: ['文本', '统计', '去重', '排序', '字符'] },
    ],
  },
] as const satisfies readonly ToolGroup[]

export const allTools: ToolItem[] = toolGroups.reduce<ToolItem[]>((items, group) => {
  items.push(...group.tools)
  return items
}, [])

const recentStorageKey = 'wuming:recent-tools'
const favoriteStorageKey = 'wuming:favorite-tools'
export const recentToolsChangedEvent = 'wuming:recent-tools-changed'
export const favoritesChangedEvent = 'wuming:favorite-tools-changed'

export function isToolId(value: unknown): value is ToolId {
  return typeof value === 'string' && allTools.some((tool) => tool.id === value)
}

export function getToolGroup(toolId: ToolId) {
  return toolGroups.find((group) => group.tools.some((tool) => tool.id === toolId)) ?? null
}

function readStoredToolIds(storageKey: string, limit = allTools.length): ToolId[] {
  if (typeof window === 'undefined') return []

  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey) || '[]')
    if (!Array.isArray(value)) return []
    return value.filter(isToolId).slice(0, limit)
  } catch {
    return []
  }
}

export function readRecentToolIds(): ToolId[] {
  return readStoredToolIds(recentStorageKey, 5)
}

export function recordRecentTool(toolId: ToolId) {
  if (typeof window === 'undefined') return
  const next = [toolId, ...readRecentToolIds().filter((id) => id !== toolId)].slice(0, 5)
  window.localStorage.setItem(recentStorageKey, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(recentToolsChangedEvent, { detail: next }))
}

export function readFavoriteToolIds(): ToolId[] {
  return readStoredToolIds(favoriteStorageKey)
}

export function toggleFavoriteTool(toolId: ToolId): ToolId[] {
  if (typeof window === 'undefined') return []
  const current = readFavoriteToolIds()
  const next = current.includes(toolId)
    ? current.filter((id) => id !== toolId)
    : [...current, toolId]

  window.localStorage.setItem(favoriteStorageKey, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(favoritesChangedEvent, { detail: next }))
  return next
}
