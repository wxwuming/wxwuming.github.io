# Wuming Tools

`wxwuming.github.io` 的个人主页与浏览器端工具箱，使用 Vue 3 + TypeScript + Vite 构建。

## 当前工具

- Markdown → Word（DOCX）
- PDF ↔ Word（DOCX）：支持 PDF 文字提取为可编辑 Word、逐页保留 PDF 页面外观、Word 页面导出为 PDF
- 图片格式转换（PNG / JPEG / WebP）
- 数据格式转换（JSON / CSV / TSV）
- 二进制表示转换（Text / Hex / Base64 / Bytes）

所有转换均优先在浏览器本地完成，不上传用户文件。

### PDF ↔ Word 使用说明

在网页工具箱的「文件与格式」分类中打开「PDF ↔ Word」，选择或拖入文件，点击「转换并下载」。支持 `.pdf` 和 `.docx`（不支持旧版 `.doc`）。PDF 文件上限 35 MB，Word 文件上限 20 MB，单个文档最多 80 页。

- **PDF → 可编辑 Word**：提取 PDF 文本为真正可修改的 Word 段落，支持常见文字版 PDF。PDF 不是结构化的 Word 文档，因此复杂表格、图片、分栏和字体排版可能无法完整还原；扫描件没有可提取文本时，请选「保留页面外观」或先进行 OCR。
- **PDF → 保留页面外观的 Word**：将 PDF 每页绘制成图像嵌入 DOCX，更接近原始视觉效果，但正文不可直接编辑。
- **Word → PDF**：在浏览器内预览 DOCX 页面并转换为图片型 PDF；适合常见文档，但文字不能直接选取复制，自动分页、页眉页脚、复杂布局及字体可能与 Microsoft Word 的原生导出有差异。

以上功能均在浏览器执行，无需独立服务器或外部转换接口。

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

产物位于 `dist/`。

## GitHub Pages 部署

仓库建议直接命名为 `wxwuming.github.io`。推送到 `main` 分支后，`.github/workflows/deploy.yml` 会自动构建并发布 `dist/`。

首次使用 GitHub Actions 发布时，请在仓库 Settings → Pages 中将 Source 设置为 **GitHub Actions**。
