# GitHub 自动部署指南

## 📋 通过 GitHub 自动部署到 Cloudflare Pages

### 前置要求
1. 代码已推送到 GitHub 仓库
2. 已登录 Cloudflare Dashboard
3. 已创建 Cloudflare Pages 项目

---

## 🚀 部署步骤

### 步骤 1：准备代码并推送到 GitHub

```powershell
# 1. 检查当前状态
git status

# 2. 添加所有更改
git add .

# 3. 提交更改
git commit -m "准备部署到 Cloudflare Pages"

# 4. 推送到 GitHub
git push origin main
```

**注意**：如果还没有初始化 Git 仓库，先执行：

```powershell
# 初始化 Git 仓库
git init

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/your-username/your-repo.git

# 添加所有文件
git add .

# 首次提交
git commit -m "Initial commit"

# 推送到 GitHub
git push -u origin main
```

---

### 步骤 2：在 Cloudflare Dashboard 中配置

1. **登录 Cloudflare Dashboard**
   - 访问：https://dash.cloudflare.com/
   - 登录你的账号

2. **进入 Pages**
   - 点击左侧菜单 "Workers & Pages"
   - 点击 "Pages" 标签
   - 点击 "Create a project"

3. **连接 GitHub 仓库**
   - 选择 "Connect to Git"
   - 授权 Cloudflare 访问你的 GitHub 账号
   - 选择你的仓库

4. **配置构建设置**
   - **Project name**: 输入项目名称（如：mindcube-platform）
   - **Production branch**: `main` 或 `master`
   - **Framework preset**: `None` 或 `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (留空)
   - **Node version**: `18` 或更高

5. **环境变量（可选）**
   - 在 "Environment variables" 中添加：
     - `NODE_VERSION`: `18`
     - 其他需要的环境变量

6. **保存并部署**
   - 点击 "Save and Deploy"
   - Cloudflare 会自动开始构建和部署

---

### 步骤 3：配置 KV 绑定（重要）

1. **创建 KV Namespace**
   - 在 Cloudflare Dashboard 中
   - 进入 "Workers & Pages" > "KV"
   - 点击 "Create a namespace"
   - 输入名称（如：`mindcube-db`）
   - 点击 "Add"

2. **绑定 KV 到 Pages 项目**
   - 进入你的 Pages 项目
   - 点击 "Settings" > "Functions"
   - 在 "KV Namespace Bindings" 中
   - 点击 "Add binding"
   - **Variable name**: `DB` (必须与代码中的一致)
   - **KV namespace**: 选择刚才创建的 namespace
   - 点击 "Save"

---

## 🔄 自动部署流程

配置完成后，每次你推送代码到 GitHub 的 `main` 分支时：

1. Cloudflare 会自动检测到代码更新
2. 自动运行 `npm run build`
3. 自动部署到 Cloudflare Pages
4. 你可以在 Dashboard 中查看部署状态

---

## 📝 常用 Git 命令

### 日常更新部署

```powershell
# 1. 查看更改
git status

# 2. 添加更改
git add .

# 3. 提交更改
git commit -m "更新描述"

# 4. 推送到 GitHub（自动触发部署）
git push origin main
```

### 查看部署历史

在 Cloudflare Dashboard 中：
- 进入你的 Pages 项目
- 点击 "Deployments" 标签
- 可以看到所有部署历史

### 回滚到之前的版本

在 Cloudflare Dashboard 中：
- 进入 "Deployments"
- 找到之前的部署版本
- 点击 "..." > "Retry deployment" 或 "Promote to production"

---

## 🔧 故障排除

### 构建失败

1. **检查构建日志**
   - 在 Cloudflare Dashboard 中查看构建日志
   - 查找错误信息

2. **常见问题**
   - Node.js 版本不匹配：确保使用 Node 18+
   - 依赖安装失败：检查 `package.json`
   - 构建命令错误：确认 `npm run build` 可以本地运行

### Functions 不工作

1. **检查 functions 目录**
   - 确保 `functions/` 目录在项目根目录
   - 确保 `dist/functions/` 在构建后存在

2. **检查 KV 绑定**
   - 确认 KV Namespace 已创建
   - 确认绑定名称是 `DB`（与代码一致）

### 环境变量问题

1. **在 Cloudflare Dashboard 中配置**
   - 进入项目 Settings > Environment variables
   - 添加需要的环境变量
   - 重新部署

---

## 📋 完整部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] Cloudflare Pages 项目已创建
- [ ] GitHub 仓库已连接
- [ ] 构建设置已配置（build command: `npm run build`）
- [ ] 输出目录已设置（`dist`）
- [ ] KV Namespace 已创建
- [ ] KV 绑定已配置（变量名：`DB`）
- [ ] 首次部署成功
- [ ] 测试网站功能正常

---

## 🎯 快速部署命令

创建一个简单的批处理脚本 `deploy-github.ps1`：

```powershell
# deploy-github.ps1
Write-Host "Deploying to GitHub..." -ForegroundColor Cyan

# 检查是否有未提交的更改
$status = git status --porcelain
if ($status) {
    Write-Host "Uncommitted changes found. Committing..." -ForegroundColor Yellow
    git add .
    $message = Read-Host "Enter commit message"
    if (-not $message) {
        $message = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }
    git commit -m $message
}

# 推送到 GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK Code pushed to GitHub. Cloudflare will auto-deploy." -ForegroundColor Green
} else {
    Write-Host "X Failed to push to GitHub" -ForegroundColor Red
    exit 1
}
```

使用方法：
```powershell
.\deploy-github.ps1
```

---

## 📚 更多信息

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [项目 README](README.md)


