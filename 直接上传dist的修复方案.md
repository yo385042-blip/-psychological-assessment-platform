# 🔧 直接上传 dist 的修复方案

## ❌ 问题原因

你使用"直接上传 dist"方式部署，所以：
- Cloudflare Pages 只能看到 `dist` 目录中的内容
- `functions` 目录在项目根目录，不在 `dist` 中
- 所以 Cloudflare Pages 检测不到 Functions 中间件

---

## ✅ 解决方案 1：在控制台手动配置路由（快速修复）

### 步骤 1：进入项目设置

1. 在 Cloudflare Pages 控制台
2. 进入你的项目（mindcube）
3. 点击 **"设置"** (Settings) 标签

### 步骤 2：查找路由配置

在设置页面，查找以下选项之一：
- **"Redirects"** 或 **"重定向"**
- **"Routes"** 或 **"路由"**
- **"Transform Rules"** 或 **"转换规则"**
- **"Functions & Middleware"** 或 **"函数和中间件"**

### 步骤 3：添加路由规则

添加以下规则：

**规则配置：**
- **Pattern（模式）**: `/*`
- **Rewrites to（重写为）**: `/index.html`
- **Status code（状态码）**: `200`

或者如果只有简单的重定向选项：
- **From**: `/*`
- **To**: `/index.html`
- **Status**: `200`

### 步骤 4：保存并测试

1. 保存配置
2. 等待几秒钟让配置生效
3. 刷新你的网站，测试是否能正常访问

---

## ✅ 解决方案 2：将 functions 复制到 dist（推荐）

### 步骤 1：修改构建脚本

创建一个构建后脚本，自动将 `functions` 目录复制到 `dist`。

#### 方法 A：修改 package.json（推荐）

在 `package.json` 的 `scripts` 部分，修改 `build` 命令：

```json
{
  "scripts": {
    "build": "tsc && vite build && npm run copy-functions",
    "copy-functions": "node scripts/copy-functions.js",
    ...
  }
}
```

#### 方法 B：创建复制脚本

创建文件 `scripts/copy-functions.js`：

```javascript
const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'functions');
const destDir = path.join(__dirname, '..', 'dist', 'functions');

// 确保目标目录存在
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// 复制文件
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(sourceDir, destDir);
console.log('✓ Functions directory copied to dist');
```

### 步骤 2：重新构建

```bash
npm run build
```

### 步骤 3：验证

检查 `dist/functions/_middleware.js` 文件是否存在。

### 步骤 4：上传新的 dist 目录

将包含 `functions` 目录的新 `dist` 目录上传到 Cloudflare Pages。

---

## ✅ 解决方案 3：改用 Git 集成部署（最佳方案）

虽然你现在使用直接上传，但建议改用 Git 集成：

### 优点：
- Cloudflare Pages 会自动从项目根目录读取 `functions`
- 每次推送代码自动部署
- 更可靠的部署流程

### 如何设置：

1. **将项目推送到 Git 仓库**（GitHub/GitLab）
2. **在 Cloudflare Pages 控制台**：
   - 创建新项目
   - 选择 "Connect to Git"
   - 连接你的 Git 仓库
   - 设置：
     - 构建命令：`npm run build`
     - 输出目录：`dist`
     - 根目录：`/`（项目根目录）

3. **Cloudflare Pages 会自动检测 `functions` 目录**

---

## 🎯 推荐操作顺序

### 立即修复（现在就能用）：

1. **使用方案 1：在控制台手动配置路由**
   - 这是最快的解决方案
   - 立即生效

### 长期方案（之后可以做）：

2. **使用方案 2 或方案 3**
   - 方案 2：修改构建脚本
   - 方案 3：改用 Git 集成（最推荐）

---

## 📋 现在请执行

### 方案 1：手动配置路由（立即执行）

1. **进入项目设置**
   - Cloudflare Pages → mindcube → "设置"

2. **查找路由/重定向配置**
   - 查找 "Redirects"、"Routes"、"路由" 等选项

3. **添加规则**
   - Pattern: `/*`
   - Rewrites to: `/index.html`
   - Status: `200`

4. **保存并测试**

---

## 💡 如果找不到路由配置选项

如果设置页面没有路由配置选项，可以：

1. **检查是否有 "Functions & Middleware" 部分**
2. **或者使用 Cloudflare Dashboard 的 Transform Rules**
   - 进入 Cloudflare Dashboard（不是 Pages）
   - 选择你的域名
   - Transform Rules → URL Rewrite
   - 添加规则

告诉我你找到了什么配置选项，我可以给你更具体的指导！

