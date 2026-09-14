<script setup lang="ts">
import { ref } from 'vue'

const expression = ref('*/5 * * * *')
const error = ref('')
const description = ref('每 5 分钟执行一次')
const nextRuns = ref<string[]>([])

function expandField(field: string, min: number, max: number) {
  const values = new Set<number>()
  const addRange = (start: number, end: number, step = 1) => {
    if (start < min || end > max || start > end || step < 1) throw new Error('Cron 字段超出允许范围。')
    for (let value = start; value <= end; value += step) values.add(value)
  }

  for (const segment of field.split(',')) {
    const [base, stepText] = segment.split('/')
    const step = stepText ? Number(stepText) : 1
    if (!Number.isInteger(step) || step < 1) throw new Error('Cron 步长格式无效。')
    if (base === '*') {
      addRange(min, max, step)
    } else if (base.includes('-')) {
      const [start, end] = base.split('-').map(Number)
      addRange(start, end, step)
    } else {
      const value = Number(base)
      if (!Number.isInteger(value)) throw new Error('Cron 字段包含无效数字。')
      addRange(value, value)
    }
  }
  return values
}

function describe(fields: string[]) {
  const [minute, hour, day, month, weekday] = fields
  if (/^\*\/\d+$/.test(minute) && hour === '*' && day === '*' && month === '*' && weekday === '*') {
    return `每 ${minute.slice(2)} 分钟执行一次`
  }
  if (/^\d+$/.test(minute) && hour === '*' && day === '*' && month === '*' && weekday === '*') {
    return `每小时第 ${minute} 分钟执行`
  }
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && day === '*' && month === '*' && weekday === '*') {
    return `每天 ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} 执行`
  }
  return '符合该五段 Cron 表达式的时间执行'
}

function calculate() {
  error.value = ''
  nextRuns.value = []
  try {
    const fields = expression.value.trim().split(/\s+/)
    if (fields.length !== 5) throw new Error('请输入标准五段 Cron：分钟 小时 日 月 星期。')
    const minutes = expandField(fields[0], 0, 59)
    const hours = expandField(fields[1], 0, 23)
    const days = expandField(fields[2], 1, 31)
    const months = expandField(fields[3], 1, 12)
    const weekdays = expandField(fields[4], 0, 6)
    description.value = describe(fields)

    const dayWildcard = fields[2] === '*'
    const weekdayWildcard = fields[4] === '*'
    const cursor = new Date()
    cursor.setSeconds(0, 0)
    cursor.setMinutes(cursor.getMinutes() + 1)
    const matches: string[] = []
    const maxChecks = 60 * 24 * 366 * 2

    for (let checked = 0; checked < maxChecks && matches.length < 5; checked += 1) {
      const dayMatch = days.has(cursor.getDate())
      const weekdayMatch = weekdays.has(cursor.getDay())
      const calendarMatch = dayWildcard && weekdayWildcard
        ? true
        : dayWildcard
          ? weekdayMatch
          : weekdayWildcard
            ? dayMatch
            : dayMatch || weekdayMatch
      if (
        minutes.has(cursor.getMinutes()) &&
        hours.has(cursor.getHours()) &&
        months.has(cursor.getMonth() + 1) &&
        calendarMatch
      ) {
        matches.push(cursor.toLocaleString('zh-CN', { hour12: false }))
      }
      cursor.setMinutes(cursor.getMinutes() + 1)
    }
    if (!matches.length) throw new Error('两年范围内没有找到匹配时间，请检查表达式。')
    nextRuns.value = matches
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Cron 解析失败。'
  }
}

calculate()
</script>

<template>
  <div class="tool-panel">
    <div class="tool-title-row">
      <div>
        <p class="eyebrow">计划任务</p>
        <h2>Cron 表达式</h2>
        <p>解析常用五段 Cron 表达式，支持数字、*、范围、列表和步长，并计算接下来 5 次执行时间。</p>
      </div>
      <span class="privacy-chip">本地计算</span>
    </div>

    <label class="field-label" for="cron-expression">Cron 表达式</label>
    <input id="cron-expression" v-model="expression" class="text-input cron-input" spellcheck="false" placeholder="*/5 * * * *" @keyup.enter="calculate" />
    <div class="cron-field-hint"><span>分钟</span><span>小时</span><span>日</span><span>月</span><span>星期</span></div>
    <div class="tool-actions"><button class="button primary" type="button" @click="calculate">解析表达式</button></div>
    <p v-if="error" class="error-text">{{ error }}</p>

    <div v-if="nextRuns.length" class="cron-result-grid">
      <section class="utility-card"><span class="field-label">表达式含义</span><strong class="cron-description">{{ description }}</strong></section>
      <section class="utility-card">
        <span class="field-label">接下来 5 次</span>
        <div class="result-list cron-runs"><div v-for="run in nextRuns" :key="run" class="result-row"><strong>{{ run }}</strong></div></div>
      </section>
    </div>
  </div>
</template>
