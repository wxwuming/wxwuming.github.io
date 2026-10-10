<script setup lang="ts">
import { ref } from 'vue'
import UiSelect from '../UiSelect.vue'
import {
  translateText,
  translationLanguageLabel,
  translationLanguages,
  translationSourceLanguages,
  type TranslationLanguage,
  type TranslationSourceLanguage,
} from '../../services/translation'

const sourceLanguage = ref<TranslationSourceLanguage>('auto')
const targetLanguage = ref<TranslationLanguage>('zh-CN')
const sourceText = ref('')
const translatedText = ref('')
const status = ref('')
const error = ref('')
const isTranslating = ref(false)
const detectedLanguage = ref<TranslationLanguage | null>(null)

function progressText(stage: string, progress?: number) {
  if (stage === 'detecting') return '正在判断原文语言'
  if (stage === 'preparing') return '正在准备本机翻译'
  if (stage === 'downloading') {
    return progress !== undefined ? `正在下载本机语言模型 · ${Math.round(progress * 100)}%` : '正在下载本机语言模型'
  }
  return progress !== undefined ? `正在翻译 · ${Math.round(progress * 100)}%` : '正在翻译'
}

async function translate() {
  if (!sourceText.value.trim()) {
    error.value = '请输入需要翻译的文本。'
    return
  }

  error.value = ''
  status.value = ''
  translatedText.value = ''
  isTranslating.value = true

  try {
    const result = await translateText(sourceText.value, sourceLanguage.value, targetLanguage.value, (progress) => {
      status.value = progressText(progress.stage, progress.progress)
    })
    translatedText.value = result.text
    detectedLanguage.value = result.sourceLanguage

    if (result.provider === 'browser') {
      status.value = `翻译完成 · 本机翻译 · ${translationLanguageLabel(result.sourceLanguage)} → ${translationLanguageLabel(result.targetLanguage)}`
    } else if (result.provider === 'online') {
      status.value = `翻译完成 · 在线服务 · ${translationLanguageLabel(result.sourceLanguage)} → ${translationLanguageLabel(result.targetLanguage)}`
    } else {
      status.value = '原文语言与目标语言相同，无需翻译。'
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '翻译失败，请稍后再试。'
    status.value = ''
  } finally {
    isTranslating.value = false
  }
}

function swapLanguages() {
  const previousTarget = targetLanguage.value
  const previousSource = sourceLanguage.value === 'auto'
    ? (detectedLanguage.value ?? 'en')
    : sourceLanguage.value

  sourceLanguage.value = previousTarget
  targetLanguage.value = previousSource
  const previousText = sourceText.value
  sourceText.value = translatedText.value
  translatedText.value = previousText
  status.value = ''
  error.value = ''
}

async function copyTranslation() {
  if (!translatedText.value) return
  await navigator.clipboard.writeText(translatedText.value)
  status.value = '译文已复制'
}

function clearText() {
  sourceText.value = ''
  translatedText.value = ''
  detectedLanguage.value = null
  status.value = ''
  error.value = ''
}
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">文本工具 / 翻译</p>
        <h2>文本翻译</h2>
        <p>在常用语言之间快速翻译文本；支持时优先调用浏览器本机翻译能力。</p>
      </div>
      <span class="privacy-chip">本机优先</span>
    </div>

    <div class="translate-language-row">
      <label>
        <span class="field-label">原文语言</span>
        <UiSelect v-model="sourceLanguage" :options="translationSourceLanguages" aria-label="原文语言" :disabled="isTranslating" />
      </label>
      <button class="swap-button translate-swap" type="button" :disabled="isTranslating" title="交换语言" @click="swapLanguages">⇄</button>
      <label>
        <span class="field-label">目标语言</span>
        <UiSelect v-model="targetLanguage" :options="translationLanguages" aria-label="目标语言" :disabled="isTranslating" />
      </label>
    </div>

    <div class="translate-editor-grid">
      <section class="translate-pane">
        <div class="translate-pane-head">
          <span>原文</span>
          <button type="button" :disabled="!sourceText" @click="clearText">清空</button>
        </div>
        <textarea
          v-model="sourceText"
          class="code-area translate-area"
          spellcheck="false"
          placeholder="输入或粘贴需要翻译的内容……"
        ></textarea>
      </section>

      <section class="translate-pane">
        <div class="translate-pane-head">
          <span>译文</span>
          <button type="button" :disabled="!translatedText" @click="copyTranslation">复制</button>
        </div>
        <textarea
          v-model="translatedText"
          class="code-area translate-area"
          spellcheck="false"
          placeholder="翻译结果会显示在这里……"
        ></textarea>
      </section>
    </div>

    <div class="translate-footer">
      <div class="tool-actions">
        <button class="button primary" type="button" :disabled="isTranslating || !sourceText.trim()" @click="translate">
          {{ isTranslating ? '翻译中…' : '开始翻译' }}
        </button>
        <span v-if="status" class="status-text" role="status">{{ status }}</span>
      </div>
      <p class="translate-privacy-note">桌面 Chrome 支持内置 Translator API 时可在设备上完成；不支持时会把待翻译文本片段发送到在线翻译服务。</p>
    </div>

    <p v-if="error" class="error-text" role="alert">{{ error }}</p>
  </div>
</template>
