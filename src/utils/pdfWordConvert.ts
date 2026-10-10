import { Document, HeadingLevel, ImageRun, Packer, Paragraph } from 'docx'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'

export type PdfWordMode = 'editable' | 'visual'
export type ConversionProgress = (current: number, total: number, message: string) => void

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

interface PositionedText {
  text: string
  x: number
  y: number
  width: number
  size: number
}

interface TextLine {
  text: string
  fontSize: number
}

function textLines(items: PositionedText[]): TextLine[] {
  const lines: { y: number; parts: PositionedText[] }[] = []
  for (const item of items.sort((a, b) => b.y - a.y || a.x - b.x)) {
    if (!item.text.trim()) continue
    const line = lines.find((candidate) => Math.abs(candidate.y - item.y) < Math.max(2, item.size * 0.18))
    if (line) line.parts.push(item)
    else lines.push({ y: item.y, parts: [item] })
  }

  return lines.sort((a, b) => b.y - a.y).map((line) => {
    const ordered = line.parts.sort((a, b) => a.x - b.x)
    let text = ''
    let previous: PositionedText | undefined
    for (const part of ordered) {
      const distance = previous ? part.x - (previous.x + previous.width) : 0
      const addSpace = previous && distance > Math.max(2, part.size * 0.23)
        && /[\w\d]$/.test(previous.text) && /^[\w\d]/.test(part.text)
      text += (addSpace ? ' ' : '') + part.text
      previous = part
    }
    return {
      text: text.replace(/\u0000/g, '').trim(),
      fontSize: Math.max(...ordered.map((item) => item.size)),
    }
  }).filter((line) => line.text.length > 0)
}

export async function pdfToWord(
  file: File,
  mode: PdfWordMode,
  onProgress: ConversionProgress,
): Promise<Blob> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const loadingTask = getDocument({ data: bytes, useSystemFonts: true })

  try {
    const pdf = await loadingTask.promise
    if (pdf.numPages > 80) throw new Error('当前支持最多 80 页的 PDF，请拆分后转换。')

    if (mode === 'visual') {
      const sections: Array<ConstructorParameters<typeof Document>[0]['sections'][number]> = []

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        onProgress(pageNumber, pdf.numPages, `正在保留第 ${pageNumber} 页的版式`)
        const page = await pdf.getPage(pageNumber)
        const original = page.getViewport({ scale: 1 })
        const scale = Math.min(1.8, 1600 / original.width)
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)
        const context = canvas.getContext('2d')
        if (!context) throw new Error('浏览器无法创建画布，请更换浏览器后重试。')

        try {
          await page.render({ canvas, canvasContext: context, viewport, background: '#ffffff' }).promise
          const imageBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('页面图像生成失败')), 'image/jpeg', 0.9)
          })
          const contentScale = Math.min((original.width - 44) / original.width, (original.height - 64) / original.height)
          const width = Math.round(original.width * contentScale * (4 / 3))
          const height = Math.round(original.height * contentScale * (4 / 3))
          sections.push({
            properties: {
              page: {
                size: { width: Math.round(original.width * 20), height: Math.round(original.height * 20) },
                margin: { top: 360, bottom: 360, left: 360, right: 360 },
              },
            },
            children: [new Paragraph({
              spacing: { before: 0, after: 0 },
              children: [new ImageRun({
                data: new Uint8Array(await imageBlob.arrayBuffer()),
                type: 'jpg',
                transformation: { width, height },
              })],
            })],
          })
        } finally {
          canvas.width = 0
          canvas.height = 0
          page.cleanup()
        }
      }

      onProgress(pdf.numPages, pdf.numPages, '正在生成 Word 文件')
      return Packer.toBlob(new Document({ sections }))
    }

    const paragraphs: Paragraph[] = []
    let textPages = 0
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      onProgress(pageNumber, pdf.numPages, `正在提取第 ${pageNumber} 页的文字`)
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      const items: PositionedText[] = []
      for (const item of content.items) {
        if (!('str' in item)) continue
        items.push({
          text: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          size: Math.hypot(item.transform[0], item.transform[1]) || item.height || 12,
        })
      }

      const lines = textLines(items)
      if (lines.length) {
        textPages += 1
        const fonts = lines.map((line) => line.fontSize).sort((a, b) => a - b)
        const baseFont = fonts[Math.floor(fonts.length / 2)] || 12
        lines.forEach((line, index) => {
          const isHeading = line.fontSize >= baseFont * 1.35 && line.text.length <= 90
          paragraphs.push(new Paragraph({
            text: line.text,
            ...(isHeading ? { heading: HeadingLevel.HEADING_2 } : {}),
            pageBreakBefore: pageNumber > 1 && index === 0 && paragraphs.length > 0,
            spacing: { after: 40 },
          }))
        })
      }
      page.cleanup()
    }
    if (!textPages) throw new Error('PDF 中没有可提取的文字。扫描件请切换至“保留页面外观”模式，或先使用图片 OCR 工具。')

    onProgress(pdf.numPages, pdf.numPages, '正在生成可编辑 Word 文件')
    return Packer.toBlob(new Document({ sections: [{ children: paragraphs }] }))
  } finally {
    await loadingTask.destroy()
  }
}

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.all(images.map((img) => {
    if (img.complete) return Promise.resolve()
    return new Promise<void>((resolve) => {
      img.addEventListener('load', () => resolve(), { once: true })
      img.addEventListener('error', () => resolve(), { once: true })
    })
  }))
}

export async function wordToPdf(file: File, onProgress: ConversionProgress): Promise<Blob> {
  const { renderAsync } = await import('docx-preview')
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])

  const stage = document.createElement('div')
  stage.setAttribute('aria-hidden', 'true')
  Object.assign(stage.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    zIndex: '-1000',
    width: 'max-content',
    pointerEvents: 'none',
  })
  document.body.appendChild(stage)
  try {
    onProgress(0, 1, '正在解析 Word 文档与分页')
    await renderAsync(await file.arrayBuffer(), stage, stage, {
      inWrapper: true,
      breakPages: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      useBase64URL: true,
      experimental: true,
    })

    await waitForImages(stage)
    await document.fonts.ready
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    const pages = Array.from(stage.querySelectorAll<HTMLElement>('.docx-wrapper > section.docx'))
    if (!pages.length) throw new Error('没有找到可转换的 Word 页面，请确认文件内容。')
    if (pages.length > 80) throw new Error('当前支持最多 80 页的 Word 文档，请拆分后转换。')

    let pdf: InstanceType<typeof jsPDF> | undefined
    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index]!
      onProgress(index + 1, pages.length, `正在生成 PDF 第 ${index + 1} / ${pages.length} 页`)
      const rect = page.getBoundingClientRect()
      const width = Math.ceil(Math.max(page.scrollWidth, rect.width))
      const height = Math.ceil(Math.max(page.scrollHeight, rect.height))
      if (!width || !height) throw new Error('文档页面尺寸无效，无法生成 PDF。')

      const canvas = await html2canvas(page, {
        backgroundColor: '#ffffff',
        scale: Math.min(2, 1800 / width),
        useCORS: true,
        logging: false,
        windowWidth: Math.max(document.documentElement.clientWidth, width + 30),
      })
      const widthPt = width * 0.75
      const heightPt = height * 0.75
      const orientation = widthPt > heightPt ? 'landscape' : 'portrait'
      if (!pdf) {
        pdf = new jsPDF({ orientation, unit: 'pt', format: [widthPt, heightPt], compress: true })
      } else {
        pdf.addPage([widthPt, heightPt], orientation)
      }
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, widthPt, heightPt, undefined, 'FAST')
      canvas.width = 0
      canvas.height = 0
    }
    if (!pdf) throw new Error('没有可转换的 Word 页面。')
    onProgress(pages.length, pages.length, '正在保存 PDF')
    return pdf.output('blob')
  } finally {
    stage.remove()
  }
}
