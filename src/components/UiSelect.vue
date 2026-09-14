<script setup lang="ts" generic="T extends string">
import { computed, nextTick, onMounted, onUnmounted, ref, useId } from 'vue'

type SelectOption<TValue extends string> = {
  value: TValue
  label: string
}

const props = withDefaults(defineProps<{
  modelValue: T
  options: readonly SelectOption<T>[]
  id?: string
  ariaLabel?: string
  disabled?: boolean
}>(), {
  id: undefined,
  ariaLabel: undefined,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()

const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const isOpen = ref(false)
const activeIndex = ref(0)
const generatedId = useId()

const controlId = computed(() => props.id || `ui-select-${generatedId}`)
const listboxId = computed(() => `${controlId.value}-listbox`)
const selectedIndex = computed(() => Math.max(0, props.options.findIndex((option) => option.value === props.modelValue)))
const selectedOption = computed(() => props.options[selectedIndex.value])
const activeOptionId = computed(() => isOpen.value ? `${controlId.value}-option-${activeIndex.value}` : undefined)

function openMenu() {
  if (props.disabled) return
  activeIndex.value = selectedIndex.value
  isOpen.value = true
}

function closeMenu() {
  isOpen.value = false
}

function toggleMenu() {
  if (isOpen.value) closeMenu()
  else openMenu()
}

function selectOption(index: number) {
  const option = props.options[index]
  if (!option) return
  emit('update:modelValue', option.value)
  activeIndex.value = index
  closeMenu()
  nextTick(() => triggerRef.value?.focus())
}

function moveActive(step: number) {
  const count = props.options.length
  if (!count) return
  activeIndex.value = (activeIndex.value + step + count) % count
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (!isOpen.value) openMenu()
      else moveActive(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      if (!isOpen.value) openMenu()
      else moveActive(-1)
      break
    case 'Home':
      if (!isOpen.value) return
      event.preventDefault()
      activeIndex.value = 0
      break
    case 'End':
      if (!isOpen.value) return
      event.preventDefault()
      activeIndex.value = Math.max(0, props.options.length - 1)
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (!isOpen.value) openMenu()
      else selectOption(activeIndex.value)
      break
    case 'Escape':
      if (!isOpen.value) return
      event.preventDefault()
      closeMenu()
      break
    case 'Tab':
      closeMenu()
      break
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!isOpen.value || rootRef.value?.contains(event.target as Node)) return
  closeMenu()
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown))
onUnmounted(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
</script>

<template>
  <div ref="rootRef" class="ui-select" :class="{ 'is-open': isOpen, 'is-disabled': disabled }">
    <button
      :id="controlId"
      ref="triggerRef"
      class="ui-select-trigger"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-label="ariaLabel"
      :aria-controls="listboxId"
      :aria-expanded="isOpen"
      :aria-activedescendant="activeOptionId"
      :disabled="disabled"
      @click="toggleMenu"
      @keydown="onKeydown"
    >
      <span class="ui-select-value">{{ selectedOption?.label }}</span>
      <svg class="ui-select-chevron" viewBox="0 0 20 20" aria-hidden="true">
        <path d="m6.5 8 3.5 3.5L13.5 8" />
      </svg>
    </button>

    <Transition name="select-menu">
      <div v-if="isOpen" :id="listboxId" class="ui-select-menu" role="listbox" :aria-labelledby="controlId">
        <button
          v-for="(option, index) in options"
          :id="`${controlId}-option-${index}`"
          :key="option.value"
          class="ui-select-option"
          :class="{ 'is-selected': option.value === modelValue, 'is-active': index === activeIndex }"
          type="button"
          role="option"
          :aria-selected="option.value === modelValue"
          @mouseenter="activeIndex = index"
          @click="selectOption(index)"
        >
          <span>{{ option.label }}</span>
          <svg v-if="option.value === modelValue" class="ui-select-check" viewBox="0 0 20 20" aria-hidden="true">
            <path d="m5.5 10 2.7 2.7 6.3-6.3" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.ui-select {
  position: relative;
  width: 100%;
  min-width: 0;
}

.ui-select-trigger {
  width: 100%;
  min-height: 46px;
  padding: 0 13px 0 14px;
  border: 1px solid #cfd4cd;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #f8f8f4;
  color: #202825;
  font: 500 14px/1.4 var(--font-sans, system-ui, sans-serif);
  text-align: left;
  box-shadow: 0 1px 2px rgba(24, 32, 31, .025);
  transition: border-color .16s ease, background .16s ease, box-shadow .16s ease;
}

.ui-select-trigger:hover {
  border-color: #aeb6ad;
  background: #fcfcf9;
}

.ui-select-trigger:focus-visible,
.is-open .ui-select-trigger {
  border-color: #6d7973;
  background: #fff;
  outline: none;
  box-shadow: 0 0 0 4px rgba(83, 99, 93, .1);
}

.ui-select-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-select-chevron {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  color: #59635f;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform .16s ease;
}

.is-open .ui-select-chevron { transform: rotate(180deg); }

.ui-select-menu {
  position: absolute;
  z-index: 80;
  top: calc(100% + 7px);
  left: 0;
  width: 100%;
  max-height: 280px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid #d8ddd6;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 16px 40px rgba(24, 32, 31, .14), 0 3px 10px rgba(24, 32, 31, .06);
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #c8cec7 transparent;
}

.ui-select-option {
  width: 100%;
  min-height: 40px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: transparent;
  color: #303936;
  font: 500 13px/1.4 var(--font-sans, system-ui, sans-serif);
  text-align: left;
  transition: background .12s ease, color .12s ease;
}

.ui-select-option.is-active { background: #f0f2ed; }
.ui-select-option.is-selected { color: #18201f; font-weight: 650; }
.ui-select-option.is-selected.is-active { background: #edf3e7; }

.ui-select-check {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  color: #526a36;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.is-disabled .ui-select-trigger {
  cursor: not-allowed;
  border-color: #e1e4df;
  background: #f1f2ef;
  color: #8a918e;
  box-shadow: none;
}

.select-menu-enter-active,
.select-menu-leave-active { transition: opacity .12s ease, transform .12s ease; transform-origin: top; }
.select-menu-enter-from,
.select-menu-leave-to { opacity: 0; transform: translateY(-4px) scale(.985); }

@media (prefers-reduced-motion: reduce) {
  .ui-select-trigger,
  .ui-select-chevron,
  .ui-select-option,
  .select-menu-enter-active,
  .select-menu-leave-active { transition: none; }
}
</style>
