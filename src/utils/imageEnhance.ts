/** Browser-only image enhancement. Resampling increases pixels, not missing source detail. */
export const MAX_ENHANCED_PIXELS = 16_000_000
export const MAX_ENHANCED_EDGE = 8192
export const MAX_IMAGE_FILE_BYTES = 25 * 1024 * 1024

export type ImageScale = 1 | 2 | 4

export function enhancedDimensions(width: number, height: number, scale: ImageScale) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) {
    throw new Error('无法读取图片尺寸，请重新选择图片。')
  }

  const targetWidth = width * scale
  const targetHeight = height * scale
  if (targetWidth > MAX_ENHANCED_EDGE || targetHeight > MAX_ENHANCED_EDGE ||
      targetWidth * targetHeight > MAX_ENHANCED_PIXELS) {
    throw new Error('放大后图片超过浏览器安全处理范围（最长边 8192 px、最多 1600 万像素），请选择较低的放大倍数或更小的图片。')
  }

  return { width: targetWidth, height: targetHeight }
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, value))
}

/** Modify RGBA pixels in place. Keep transparency and avoid color bleeding along alpha edges. */
export function enhancePixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  sharpness: number,
  denoise: number,
) {
  if (pixels.length !== width * height * 4) throw new Error('图片像素数据不完整。')
  if (width < 3 || height < 3) return

  const noiseAmount = Math.max(0, Math.min(1, denoise / 100)) * 0.65
  const sharpenAmount = Math.max(0, Math.min(1, sharpness / 100)) * 0.7
  const rowStride = width * 4
  const neighborOffsets = [-4, 4, -rowStride, rowStride]

  if (noiseAmount > 0) {
    const original = new Uint8ClampedArray(pixels)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const center = (y * width + x) * 4
        if (original[center + 3] !== 255) continue
        let sumR = original[center]!
        let sumG = original[center + 1]!
        let sumB = original[center + 2]!
        let count = 1

        // Average similar neighbors only; avoid washing out contrasting edges.
        for (const offset of neighborOffsets) {
          const index = center + offset
          if (original[index + 3] !== 255) continue
          const difference = (
            Math.abs(original[index]! - original[center]!) +
            Math.abs(original[index + 1]! - original[center + 1]!) +
            Math.abs(original[index + 2]! - original[center + 2]!)
          ) / 3
          if (difference > 35) continue
          sumR += original[index]!
          sumG += original[index + 1]!
          sumB += original[index + 2]!
          count++
        }

        for (let channel = 0; channel < 3; channel++) {
          const average = channel === 0 ? sumR / count : channel === 1 ? sumG / count : sumB / count
          pixels[center + channel] = clamp(original[center + channel]! * (1 - noiseAmount) + average * noiseAmount)
        }
      }
    }
  }

  if (sharpenAmount > 0) {
    const original = new Uint8ClampedArray(pixels)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const center = (y * width + x) * 4
        if (original[center + 3] !== 255 ||
            original[center - 4 + 3] !== 255 ||
            original[center + 4 + 3] !== 255 ||
            original[center - rowStride + 3] !== 255 ||
            original[center + rowStride + 3] !== 255) continue

        for (let channel = 0; channel < 3; channel++) {
          const value = original[center + channel]!
          const neighborAverage = (
            original[center - 4 + channel]! +
            original[center + 4 + channel]! +
            original[center - rowStride + channel]! +
            original[center + rowStride + channel]!
          ) / 4
          // Constrain the local boost to avoid excessive halos and noise.
          const boost = Math.max(-48, Math.min(48, (value - neighborAverage) * sharpenAmount))
          pixels[center + channel] = clamp(value + boost)
        }
      }
    }
  }
}
