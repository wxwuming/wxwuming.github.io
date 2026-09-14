<script setup lang="ts">
import { ref } from 'vue'
import UiSelect from '../UiSelect.vue'

type Unit = 'seconds' | 'milliseconds'
const unitOptions = [
  { value: 'seconds', label: '秒' },
  { value: 'milliseconds', label: '毫秒' },
] as const

function datetimeLocalValue(date: Date) {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return shifted.toISOString().slice(0, 16)
}

const timestamp = ref(String(Math.floor(Date.now() / 1000)))
const unit = ref<Unit>('seconds')
const dateTime = ref(datetimeLocalValue(new Date()))
const timestampResult = ref({ local: '', utc: '', iso: '' })
const dateResult = ref({ seconds: '', milliseconds: '' })
const error = ref('')

function convertTimestamp() {
  error.value = ''
  const raw = Number(timestamp.value.trim())
  const date = new Date(unit.value === 'seconds' ? raw * 1000 : raw)
  if (!Number.isFinite(raw) || Number.isNaN(date.getTime())) {
    error.value = '请输入有效的时间戳'
    timestampResult.value = { local: '', utc: '', iso: '' }
    return
  }
  timestampResult.value = {
    local: date.toLocaleString(),
    utc: date.toUTCString(),
    iso: date.toISOString(),
  }
}

function convertDateTime() {
  error.value = ''
  const date = new Date(dateTime.value)
  if (Number.isNaN(date.getTime())) {
    error.value = '请选择有效的日期时间'
    return
  }
  dateResult.value = {
    seconds: String(Math.floor(date.getTime() / 1000)),
    milliseconds: String(date.getTime()),
  }
}

function useCurrentTime() {
  const now = new Date()
  timestamp.value = String(unit.value === 'seconds' ? Math.floor(now.getTime() / 1000) : now.getTime())
  dateTime.value = datetimeLocalValue(now)
  convertTimestamp()
  convertDateTime()
}

convertTimestamp()
convertDateTime()
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">时间工具</p>
        <h2>时间戳转换</h2>
        <p>在 Unix 时间戳和可读日期时间之间快速转换。</p>
      </div>
      <span class="privacy-chip">秒 / 毫秒</span>
    </div>

    <div class="utility-grid">
      <section class="utility-card">
        <h3>时间戳 → 日期</h3>
        <label class="field-label" for="timestamp-value">时间戳</label>
        <input id="timestamp-value" v-model="timestamp" class="text-input" inputmode="numeric" />
        <label class="field-label" for="timestamp-unit">单位</label>
        <UiSelect id="timestamp-unit" v-model="unit" :options="unitOptions" aria-label="时间戳单位" />
        <button class="button primary utility-button" type="button" @click="convertTimestamp">转换日期</button>
        <div class="result-list">
          <div class="result-row"><span>本地时间</span><strong>{{ timestampResult.local || '—' }}</strong></div>
          <div class="result-row"><span>UTC</span><strong>{{ timestampResult.utc || '—' }}</strong></div>
          <div class="result-row"><span>ISO 8601</span><strong>{{ timestampResult.iso || '—' }}</strong></div>
        </div>
      </section>

      <section class="utility-card">
        <h3>日期 → 时间戳</h3>
        <label class="field-label" for="datetime-value">本地日期时间</label>
        <input id="datetime-value" v-model="dateTime" class="text-input" type="datetime-local" />
        <button class="button primary utility-button" type="button" @click="convertDateTime">生成时间戳</button>
        <div class="result-list">
          <div class="result-row"><span>秒</span><strong>{{ dateResult.seconds || '—' }}</strong></div>
          <div class="result-row"><span>毫秒</span><strong>{{ dateResult.milliseconds || '—' }}</strong></div>
        </div>
      </section>
    </div>

    <p v-if="error" class="error-text" role="alert">{{ error }}</p>
    <div class="tool-actions">
      <button class="button ghost" type="button" @click="useCurrentTime">使用当前时间</button>
    </div>
  </div>
</template>
