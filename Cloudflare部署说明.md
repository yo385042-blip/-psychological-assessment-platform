# Cloudflare Pages 部署说明

## 🚨 当前问题

网站部署到 Cloudflare Pages 后无法打开（ERR_CONNECTION_CLOSED）。

## ✅ 已完成的修复

1. **创建了 Cloudflare Pages Functions 中间件**
   - 文件：`functions/_middleware.js`
   - 功能：处理 SPA 路由，将所有非静态资源请求重定向到 `index.html`

2. **保留了 `_redirects` 文件作为备用方案**
   - 文件：`public/_redirects`

## 📋 部署步骤

### 方法 1：使用 Git 集成（推荐）

如果你的项目已连接到 Git 仓库：

1. **确认 functions 目录在项目根目录**
   - `functions/_middleware.js` 应该存在于项目根目录
   - 不是在 `dist` 目录中

2. **推送代码到 Git**
   ```bash
   git add .
   git commit -m "添加 Cloudflare Pages SPA 路由支持"
   git push
   ```

3. **在 Cloudflare Pages 控制台检查**
   - 进入你的 Pages 项目
   - 检查构建日志，确保构建成功
   - 确保 `functions` 目录被正确部署

### 方法 2：手动上传 dist 目录（不推荐，因为缺少 functions）

如果你直接上传 `dist` 目录，中间件将不会工作。请使用 Git 集成方法。

### 方法 3：在 Cloudflare Pages 控制台配置

如果中间件不起作用，可以在控制台手动配置：

1. 进入 Cloudflare Pages 项目
2. Settings → Functions & Middleware
3. 添加路由规则：
   - Pattern: `/*`
   - Rewrite to: `/index.html`
   - Status code: `200`

## 🔍 检查清单

### 构建配置检查

- [ ] 构建命令：`npm run build`
- [ ] 构建输出目录：`dist`
- [ ] Node.js 版本：18 或更高

### 文件结构检查

确保项目根目录包含：
```
项目根目录/
├── functions/
│   └── _middleware.js    ← 这个很重要！
├── public/
│   ├── _redirects
│   └── logo-cube.jpg
├── src/
├── dist/                 ← 构建输出
├── package.json
└── vite.config.ts
```

### 部署后检查

- [ ] 访问首页（如 `https://your-domain.pages.dev/`）是否正常
- [ ] 访问子路由（如 `https://your-domain.pages.dev/dashboard`）是否正常
- [ ] 检查浏览器控制台是否有错误
- [ ] 检查网络请求是否都成功

## 🐛 故障排除

### 问题 1：仍然无法访问

**解决方案：**
1. 检查 Cloudflare Pages 部署日志是否有错误
2. 确认 `functions/_middleware.js` 文件存在于项目根目录
3. 尝试清除 Cloudflare Pages 缓存：
   - 进入项目设置
   - Caching → Purge Everything

### 问题 2：静态资源 404

**解决方案：**
- 中间件已经配置跳过静态资源，如果仍然有问题，检查：
  - 资源路径是否正确（应该是绝对路径，如 `/assets/xxx.js`）
  - 构建输出是否包含所有资源文件

### 问题 3：路由仍然返回 404

**解决方案：**
1. 确认中间件文件存在且格式正确
2. 在 Cloudflare Pages 控制台的 Functions 页面查看是否有错误
3. 尝试使用控制台的路由配置（方法 3）

## 📝 重要说明

1. **`functions` 目录必须在项目根目录**，不是在 `dist` 目录中
2. **Cloudflare Pages 会自动处理 `functions` 目录**，无需手动复制
3. **如果使用 Git 集成**，确保 `functions` 目录被提交到仓库
4. **清除浏览器缓存**后再测试

## 🎯 下一步

1. 确认 `functions/_middleware.js` 文件存在
2. 推送代码到 Git（如果使用 Git 集成）
3. 等待 Cloudflare Pages 自动构建和部署
4. 测试网站是否正常访问

如果问题仍然存在，请检查 Cloudflare Pages 的部署日志，查找具体错误信息。

