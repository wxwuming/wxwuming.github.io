<script setup lang="ts">
import { computed, ref } from 'vue'

const input = ref('')
const header = ref('')
const payload = ref('')
const error = ref('')
const claims = ref<{ label: string; value: string }[]>([])

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function formatTime(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const date = new Date(value * 1000)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString('zh-CN', { hour12: false })
}

function parseToken() {
  error.value = ''
  claims.value = []
  header.value = ''
  payload.value = ''

  try {
    const parts = input.value.trim().split('.')
    if (parts.length !== 3) throw new Error('JWT 应包含 Header、Payload 和 Signature 三个部分。')

    const parsedHeader = JSON.parse(decodeBase64Url(parts[0]))
    const parsedPayload = JSON.parse(decodeBase64Url(parts[1]))
    header.value = JSON.stringify(parsedHeader, null, 2)
    payload.value = JSON.stringify(parsedPayload, null, 2)

    const nextClaims: { label: string; value: string }[] = []
    const exp = formatTime(parsedPayload.exp)
    const iat = formatTime(parsedPayload.iat)
    const nbf = formatTime(parsedPayload.nbf)
    if (iat) nextClaims.push({ label: '签发时间 iat', value: iat })
    if (nbf) nextClaims.push({ label: '生效时间 nbf', value: nbf })
    if (exp) {
      nextClaims.push({ label: '过期时间 exp', value: exp })
      nextClaims.push({ label: '当前状态', value: parsedPayload.exp * 1000 < Date.now() ? '已过期' : '未过期' })
    }
    claims.value = nextClaims
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'JWT 解析失败。'
  }
}

const hasResult = computed(() => Boolean(header.value || payload.value))

async function copyPayload() {
  if (payload.value) await navigator.clipboard.writeText(payload.value)
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">令牌解析</p>
        <h2>JWT 解析</h2>
        <p>解码 JWT Header 与 Payload，并读取常见时间声明。不会验证签名，也不会向服务器上传令牌。</p>
      </div>
      <span class="privacy-chip">仅本地解码</span>
    </div>

    <label>
      <span class="field-label">JWT</span>
      <textarea v-model="input" class="code-area compact-area" spellcheck="false" placeholder="粘贴 eyJ... JWT"></textarea>
    </label>
    <div class="tool-actions">
      <button class="button primary" type="button" :disabled="!input.trim()" @click="parseToken">解析 JWT</button>
      <button class="button ghost" type="button" :disabled="!payload" @click="copyPayload">复制 Payload</button>
    </div>
    <p v-if="error" class="error-text">{{ error }}</p>

    <div v-if="claims.length" class="claim-grid">
      <div v-for="claim in claims" :key="claim.label" class="utility-card compact-info-card">
        <span>{{ claim.label }}</span><strong>{{ claim.value }}</strong>
      </div>
    </div>

    <div v-if="hasResult" class="editor-grid utility-editor-grid">
      <label><span class="field-label">Header</span><textarea v-model="header" class="code-area compact-area" readonly spellcheck="false"></textarea></label>
      <label><span class="field-label">Payload</span><textarea v-model="payload" class="code-area compact-area" readonly spellcheck="false"></textarea></label>
    </div>
  </div>
</template>
