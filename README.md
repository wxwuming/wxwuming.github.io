# Wuming Tools

`wxwuming.github.io` 的个人主页与浏览器端工具箱，使用 Vue 3 + TypeScript + Vite 构建。

## 当前工具

- Markdown → Word（DOCX）
- 图片格式转换（PNG / JPEG / WebP）
- 数据格式转换（JSON / CSV / TSV）
- 二进制表示转换（Text / Hex / Base64 / Bytes）

所有转换均优先在浏览器本地完成，不上传用户文件。

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
