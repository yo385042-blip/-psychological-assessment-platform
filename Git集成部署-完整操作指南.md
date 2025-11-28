# 🚀 Git 集成部署 - 完整操作指南

## 📋 当前步骤：配置 Git 仓库访问权限

你正在配置 Cloudflare Pages 对 Git 仓库的访问权限。

---

## ✅ 步骤 1：选择仓库访问权限

### 选项 A：所有仓库（推荐，如果信任 Cloudflare）

1. **选择 "All Repositories"（所有仓库）**
   - ✅ 这个选项已经选中了（蓝色圆圈）
   - 这允许 Cloudflare 访问你账户下的所有仓库

2. **点击 "Save"（保存）按钮**
   - 绿色按钮，在右下角

### 选项 B：仅选择特定仓库（更安全）

如果你想只授权特定仓库：

1. **选择 "Select Repositories Only"（仅选择存储库）**
   - 点击这个选项的圆圈

2. **选择仓库**
   - 会显示仓库列表
   - 选择你要部署的仓库

3. **点击 "Save"（保存）按钮**

---

## 📋 步骤 2：连接仓库后的配置

保存仓库权限后，Cloudflare Pages 会要求你：

### 1. 选择仓库

- 会显示你的 GitHub/GitLab 仓库列表
- 选择你的项目仓库

### 2. 配置构建设置

Cloudflare Pages 会要求你配置：

```
项目名称：mindcube（或你的项目名）
生产分支：main（或 master）
构建设置：
  - 框架预设：None（或 Vite）
  - 构建命令：npm run build
  - 构建输出目录：dist
  - 根目录：（留空，使用根目录）
环境变量：（暂时不需要）
```

### 3. 保存并部署

- 点击 "Save and Deploy"（保存并部署）
- Cloudflare Pages 会自动开始构建和部署

---

## 🔧 步骤 3：确保项目准备好 Git 集成

在连接 Git 之前，确保你的项目：

### ✅ 1. 项目根目录有 `functions/` 文件夹

你的项目已经有：
- ✅ `functions/_middleware.js` - Functions 中间件

### ✅ 2. 项目根目录有 `public/` 文件夹

你的项目已经有：
- ✅ `public/_redirects` - 重定向配置
- ✅ `public/logo-cube.jpg` - Logo 图片

### ✅ 3. 项目根目录有 `package.json`

你的项目已经有：
- ✅ `package.json` - 包含构建脚本

---

## 📝 重要配置说明

### Functions 配置

- ✅ Functions 在 `functions/` 文件夹中
- ✅ Cloudflare Pages 会自动从项目根目录读取
- ✅ 不需要手动复制到 `dist`

### `_redirects` 配置

- ✅ `_redirects` 在 `public/` 文件夹中
- ✅ Vite 构建时会自动复制到 `dist`
- ✅ Cloudflare Pages 会自动处理

### 构建配置

- ✅ 构建命令：`npm run build`
- ✅ 输出目录：`dist`
- ✅ Node.js 版本：会自动检测（建议 18+）

---

## 🎯 完整操作流程

### 立即执行：

1. **在仓库访问权限界面**
   - ✅ 选择 "All Repositories"（已选中）
   - ✅ 点击 "Save"（保存）

2. **选择仓库**
   - 选择你的项目仓库

3. **配置构建设置**
   ```
   构建命令：npm run build
   构建输出目录：dist
   根目录：（留空）
   ```

4. **保存并部署**
   - 点击 "Save and Deploy"
   - 等待构建完成

5. **验证部署**
   - 检查部署状态（应该显示成功）
   - 检查 Functions 标签（应该能看到 `_middleware.js`）
   - 测试网站访问

---

## ✅ 预期结果

Git 集成部署后：

- ✅ Functions 会自动从项目根目录读取
- ✅ `_redirects` 会自动从 `public/` 目录读取
- ✅ 每次推送代码会自动部署
- ✅ 网站应该能正常访问

---

## 🔍 如果遇到问题

### 问题 1：找不到仓库

- 检查你是否登录了正确的 GitHub/GitLab 账户
- 检查仓库是否是私有的（可能需要额外权限）

### 问题 2：构建失败

- 检查构建日志
- 确认 Node.js 版本设置正确（18+）
- 确认构建命令和输出目录正确

### 问题 3：Functions 仍然检测不到

- 确认 `functions/` 文件夹在项目根目录
- 确认 `functions/_middleware.js` 存在
- 检查构建日志是否有错误

---

## 💡 为什么 Git 集成更好？

- ✅ Functions 自动工作
- ✅ `_redirects` 自动工作
- ✅ 每次推送代码自动部署
- ✅ 完全自动化
- ✅ 不需要手动上传文件

---

## 🎯 现在请执行

1. ✅ 在仓库访问权限界面点击 "Save"
2. ✅ 选择你的项目仓库
3. ✅ 配置构建设置
4. ✅ 保存并部署

完成后告诉我结果！

