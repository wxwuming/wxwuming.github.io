import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  LevelFormat,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  UnderlineType,
  WidthType,
} from 'docx'
import type { FileChild, ParagraphChild } from 'docx'

const ORDERED_LIST_REFERENCE = 'markdown-ordered-list'
const MAX_LIST_LEVEL = 8

const bodyFont = {
  ascii: 'Aptos',
  hAnsi: 'Aptos',
  eastAsia: 'Microsoft YaHei',
} as const

const codeFont = {
  ascii: 'Consolas',
  hAnsi: 'Consolas',
  eastAsia: 'Microsoft YaHei',
} as const

interface InlineStyle {
  bold?: boolean
  italics?: boolean
  strike?: boolean
}

interface TableAlignment {
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType]
}

function cleanText(text: string) {
  return text.replace(/\\([\\`*_[\]{}()#+.!|>-])/g, '$1')
}

function textRun(text: string, style: InlineStyle = {}) {
  return new TextRun({
    text: cleanText(text),
    font: bodyFont,
    bold: style.bold,
    italics: style.italics,
    strike: style.strike,
  })
}

function linkedText(label: string, link: string, style: InlineStyle): ParagraphChild[] {
  if (!/^(https?:|mailto:|ftp:)/i.test(link)) {
    return [textRun(`${label}（${link}）`, style)]
  }

  return [
    new ExternalHyperlink({
      link,
      children: [
        new TextRun({
          text: cleanText(label),
          font: bodyFont,
          bold: style.bold,
          italics: style.italics,
          strike: style.strike,
          color: '0563C1',
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
    }),
  ]
}

function inlineRuns(text: string, style: InlineStyle = {}): ParagraphChild[] {
  const tokenPattern = /(`[^`\n]+`|\*\*\*[^*\n]+\*\*\*|___[^_\n]+___|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|!\[[^\]\n]*\]\([^)]+\)|\[[^\]\n]+\]\([^)]+\)|<https?:\/\/[^ >]+>|\*[^*\n]+\*|_[^_\n]+_)/g
  const children: ParagraphChild[] = []
  let cursor = 0

  for (const match of text.matchAll(tokenPattern)) {
    const index = match.index ?? 0
    if (index > cursor) children.push(textRun(text.slice(cursor, index), style))

    const token = match[0]
    if (token.startsWith('`') && token.endsWith('`')) {
      children.push(new TextRun({
        text: token.slice(1, -1),
        font: codeFont,
        bold: style.bold,
        italics: style.italics,
        strike: style.strike,
        shading: { fill: 'EEF0EC' },
      }))
    } else if ((token.startsWith('***') && token.endsWith('***')) || (token.startsWith('___') && token.endsWith('___'))) {
      children.push(...inlineRuns(token.slice(3, -3), { ...style, bold: true, italics: true }))
    } else if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) {
      children.push(...inlineRuns(token.slice(2, -2), { ...style, bold: true }))
    } else if (token.startsWith('~~') && token.endsWith('~~')) {
      children.push(...inlineRuns(token.slice(2, -2), { ...style, strike: true }))
    } else if (token.startsWith('![')) {
      const image = token.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)$/)
      if (image) {
        const [, alt, link] = image
        children.push(textRun(`图片：${alt || '未命名图片'} `, { ...style, italics: true }))
        children.push(...linkedText(link, link, style))
      } else {
        children.push(textRun(token, style))
      }
    } else if (token.startsWith('[')) {
      const link = token.match(/^\[([^\]]+)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)$/)
      if (link) children.push(...linkedText(link[1], link[2], style))
      else children.push(textRun(token, style))
    } else if (token.startsWith('<http')) {
      children.push(...linkedText(token.slice(1, -1), token.slice(1, -1), style))
    } else if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
      children.push(...inlineRuns(token.slice(1, -1), { ...style, italics: true }))
    } else {
      children.push(textRun(token, style))
    }

    cursor = index + token.length
  }

  if (cursor < text.length) children.push(textRun(text.slice(cursor), style))
  if (children.length === 0) children.push(textRun(text, style))
  return children
}

function splitTableRow(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let escaped = false
  let inCode = false

  for (const char of line.trim()) {
    if (escaped) {
      current += char
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      current += char
      continue
    }
    if (char === '`') {
      inCode = !inCode
      current += char
      continue
    }
    if (char === '|' && !inCode) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  cells.push(current.trim())

  if (cells[0] === '') cells.shift()
  if (cells.at(-1) === '') cells.pop()
  return cells.map((cell) => cell.replace(/\\\|/g, '|'))
}

function isTableDelimiter(line: string) {
  const cells = splitTableRow(line)
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, '')))
}

function tableAlignments(separator: string): TableAlignment[] {
  return splitTableRow(separator).map((cell) => {
    const marker = cell.replace(/\s/g, '')
    if (marker.startsWith(':') && marker.endsWith(':')) return { alignment: AlignmentType.CENTER }
    if (marker.endsWith(':')) return { alignment: AlignmentType.RIGHT }
    return { alignment: AlignmentType.LEFT }
  })
}

function createTableCell(text: string, isHeader: boolean, alignment: TableAlignment['alignment']) {
  return new TableCell({
    shading: isHeader ? { fill: 'EEF1EC' } : undefined,
    margins: { top: 90, bottom: 90, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: isHeader
          ? inlineRuns(text, { bold: true })
          : inlineRuns(text),
        alignment,
        spacing: { before: 0, after: 0, line: 280 },
      }),
    ],
  })
}

function createTable(headerLine: string, separatorLine: string, dataLines: string[]) {
  const header = splitTableRow(headerLine)
  const alignments = tableAlignments(separatorLine)
  const columnCount = Math.max(header.length, alignments.length)
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'C8CEC8' }

  const normalizeCells = (line: string) => {
    const cells = splitTableRow(line)
    return Array.from({ length: columnCount }, (_, index) => cells[index] ?? '')
  }

  const rows = [
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: normalizeCells(headerLine).map((cell, index) => createTableCell(cell, true, alignments[index]?.alignment ?? AlignmentType.LEFT)),
    }),
    ...dataLines.map((line) => new TableRow({
      cantSplit: true,
      children: normalizeCells(line).map((cell, index) => createTableCell(cell, false, alignments[index]?.alignment ?? AlignmentType.LEFT)),
    })),
  ]

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.AUTOFIT,
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    borders: {
      top: border,
      bottom: border,
      left: border,
      right: border,
      insideHorizontal: border,
      insideVertical: border,
    },
  })
}

function headingLevel(level: number) {
  const levels = [
    HeadingLevel.HEADING_1,
    HeadingLevel.HEADING_2,
    HeadingLevel.HEADING_3,
    HeadingLevel.HEADING_4,
    HeadingLevel.HEADING_5,
    HeadingLevel.HEADING_6,
  ] as const
  return levels[Math.min(Math.max(level, 1), 6) - 1]
}

function listLevel(indent: string) {
  const spaces = indent.replace(/\t/g, '  ').length
  return Math.min(Math.floor(spaces / 2), MAX_LIST_LEVEL)
}

function isHorizontalRule(line: string) {
  return /^\s{0,3}((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})$/.test(line)
}

function isFence(line: string) {
  return /^\s*```/.test(line)
}

function isHeading(line: string) {
  return /^\s{0,3}#{1,6}\s+/.test(line)
}

function isQuote(line: string) {
  return /^\s{0,3}>/.test(line)
}

function isList(line: string) {
  return /^(\s*)(?:[-*+]\s+|\d+[.)]\s+)/.test(line)
}

function isSetextUnderline(line: string) {
  return /^\s*(?:={3,}|-{3,})\s*$/.test(line)
}

function startsSpecialBlock(lines: string[], index: number) {
  const line = lines[index] ?? ''
  if (!line.trim()) return true
  if (isFence(line) || isHeading(line) || isQuote(line) || isList(line) || isHorizontalRule(line)) return true
  if (index + 1 < lines.length && isTableDelimiter(lines[index + 1]) && line.includes('|')) return true
  if (index + 1 < lines.length && isSetextUnderline(lines[index + 1])) return true
  return false
}

function createCodeBlock(lines: string[], language: string) {
  const runs: ParagraphChild[] = []
  if (language) {
    runs.push(new TextRun({ text: `${language}\n`, font: codeFont, italics: true, color: '667085', size: 18 }))
  }
  lines.forEach((line, index) => {
    runs.push(new TextRun({ text: line || ' ', font: codeFont, size: 19, break: index > 0 || Boolean(language) ? 1 : 0 }))
  })

  return new Paragraph({
    children: runs,
    shading: { fill: 'F3F4F1' },
    border: {
      top: { style: BorderStyle.SINGLE, size: 2, color: 'D7DDD7' },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: 'D7DDD7' },
      left: { style: BorderStyle.SINGLE, size: 2, color: 'D7DDD7' },
      right: { style: BorderStyle.SINGLE, size: 2, color: 'D7DDD7' },
    },
    indent: { left: 180, right: 180 },
    spacing: { before: 100, after: 180, line: 280 },
  })
}

function buildBlocks(source: string): FileChild[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const children: FileChild[] = []
  let index = 0
  let orderedListInstance = 0

  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index += 1
      continue
    }

    const fence = line.match(/^\s*```\s*([^\s`]*)\s*$/)
    if (fence) {
      const language = fence[1] ?? ''
      const codeLines: string[] = []
      index += 1
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        codeLines.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      children.push(createCodeBlock(codeLines, language))
      continue
    }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (heading) {
      children.push(new Paragraph({
        children: inlineRuns(heading[2]),
        heading: headingLevel(heading[1].length),
      }))
      index += 1
      continue
    }

    if (index + 1 < lines.length && isSetextUnderline(lines[index + 1]) && !line.includes('|')) {
      const level = lines[index + 1].trim().startsWith('=') ? 1 : 2
      children.push(new Paragraph({ children: inlineRuns(line.trim()), heading: headingLevel(level) }))
      index += 2
      continue
    }

    if (index + 1 < lines.length && line.includes('|') && isTableDelimiter(lines[index + 1])) {
      const separatorLine = lines[index + 1]
      const dataLines: string[] = []
      index += 2
      while (index < lines.length && lines[index].trim() && lines[index].includes('|')) {
        dataLines.push(lines[index])
        index += 1
      }
      children.push(createTable(line, separatorLine, dataLines))
      children.push(new Paragraph({ spacing: { after: 80 } }))
      continue
    }

    if (isQuote(line)) {
      while (index < lines.length && isQuote(lines[index])) {
        const content = lines[index].replace(/^\s{0,3}>\s?/, '')
        children.push(new Paragraph({
          children: inlineRuns(content, { italics: true }),
          indent: { left: 360, right: 120 },
          border: { left: { style: BorderStyle.SINGLE, size: 10, color: 'AAB4AE', space: 10 } },
          spacing: { before: 40, after: 100, line: 300 },
        }))
        index += 1
      }
      continue
    }

    if (isList(line)) {
      orderedListInstance += 1
      while (index < lines.length) {
        const item = lines[index].match(/^(\s*)([-*+]|\d+[.)])\s+(.+)$/)
        if (!item) break
        const [, indent, marker] = item
        let content = item[3]
        const level = listLevel(indent)
        const task = content.match(/^\[([ xX])\]\s+(.*)$/)
        if (task) content = `${task[1].toLowerCase() === 'x' ? '☒' : '☐'} ${task[2]}`
        const ordered = /^\d/.test(marker)

        children.push(new Paragraph({
          children: inlineRuns(content),
          ...(ordered
            ? { numbering: { reference: ORDERED_LIST_REFERENCE, level, instance: orderedListInstance } }
            : { bullet: { level } }),
          spacing: { after: 70, line: 300 },
        }))
        index += 1
      }
      continue
    }

    if (isHorizontalRule(line)) {
      children.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'C8CEC8', space: 1 } },
        spacing: { before: 100, after: 180 },
      }))
      index += 1
      continue
    }

    const paragraphLines: string[] = []
    while (index < lines.length && lines[index].trim() && !startsSpecialBlock(lines, index)) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }
    if (paragraphLines.length === 0) {
      paragraphLines.push(line.trim())
      index += 1
    }

    children.push(new Paragraph({
      children: inlineRuns(paragraphLines.join(' ')),
      spacing: { after: 160, line: 320 },
    }))
  }

  return children
}

function headingStyle(size: number, before: number, after: number) {
  return {
    run: { font: bodyFont, bold: true, size, color: '18201F' },
    paragraph: { spacing: { before, after }, keepNext: true },
  }
}

export function buildMarkdownDocument(source: string, title: string) {
  const levels = Array.from({ length: MAX_LIST_LEVEL + 1 }, (_, level) => ({
    level,
    format: LevelFormat.DECIMAL,
    text: `%${level + 1}.`,
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 720 + level * 420, hanging: 300 },
      },
    },
  }))

  return new Document({
    title,
    creator: 'wxwuming Tools',
    description: '由 Markdown 转 Word 工具生成',
    styles: {
      default: {
        document: {
          run: { font: bodyFont, size: 22, color: '202624' },
          paragraph: { spacing: { after: 160, line: 320 } },
        },
        heading1: headingStyle(36, 300, 180),
        heading2: headingStyle(32, 260, 160),
        heading3: headingStyle(28, 220, 140),
        heading4: headingStyle(25, 200, 120),
        heading5: headingStyle(23, 180, 100),
        heading6: headingStyle(22, 160, 90),
        listParagraph: {
          run: { font: bodyFont, size: 22, color: '202624' },
          paragraph: { spacing: { after: 70, line: 300 } },
        },
      },
    },
    numbering: {
      config: [{ reference: ORDERED_LIST_REFERENCE, levels }],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children: buildBlocks(source),
      },
    ],
  })
}
