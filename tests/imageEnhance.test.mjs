import test from 'node:test'
import assert from 'node:assert/strict'
import { enhancedDimensions, enhancePixels } from '../src/utils/imageEnhance.ts'

function ninePixels(center = 120, surrounding = 100, centerAlpha = 255) {
  const data = new Uint8ClampedArray(3 * 3 * 4)
  for (let i = 0; i < 9; i++) {
    const color = i === 4 ? center : surrounding
    data.set([color, color, color, i === 4 ? centerAlpha : 255], i * 4)
  }
  return data
}

test('支持 1×、2×、4× 放大并准确计算宽高', () => {
  assert.deepEqual(enhancedDimensions(640, 360, 1), { width: 640, height: 360 })
  assert.deepEqual(enhancedDimensions(640, 360, 2), { width: 1280, height: 720 })
  assert.deepEqual(enhancedDimensions(640, 360, 4), { width: 2560, height: 1440 })
})

test('限制不安全的尺寸与像素数量', () => {
  assert.deepEqual(enhancedDimensions(1000, 1000, 4), { width: 4000, height: 4000 })
  assert.throws(() => enhancedDimensions(1920, 1080, 4), /1600 万像素/)
  assert.throws(() => enhancedDimensions(2049, 100, 4), /8192 px/)
  assert.throws(() => enhancedDimensions(0, 100, 2), /尺寸/)
  assert.throws(() => enhancedDimensions(Number.NaN, 100, 2), /尺寸/)
})

test('强度为零时保留原始像素', () => {
  const data = ninePixels()
  const original = data.slice()
  enhancePixels(data, 3, 3, 0, 0)
  assert.deepEqual(data, original)
})

test('锐化提高亮点对比，同时保留 alpha 通道', () => {
  const data = ninePixels()
  enhancePixels(data, 3, 3, 100, 0)
  assert.ok(data[4 * 4] > 120)
  assert.equal(data[4 * 4 + 3], 255)
  assert.equal(data[0], 100)
})

test('降噪使局部色彩更接近邻域平均值', () => {
  const data = ninePixels()
  enhancePixels(data, 3, 3, 0, 60)
  assert.ok(data[4 * 4] < 120)
  assert.ok(data[4 * 4] > 100)
})

test('半透明边缘不应被锐化或降噪污染', () => {
  const data = ninePixels(120, 100, 120)
  const original = data.slice()
  enhancePixels(data, 3, 3, 100, 100)
  assert.deepEqual(data, original)
})

test('像素缓冲区不完整时拒绝处理', () => {
  assert.throws(() => enhancePixels(new Uint8ClampedArray(4), 10, 10, 50, 50), /不完整/)
})
