# 推送代码脚本
# 使用方法：在包含 .git 的目录中运行此脚本

Write-Host "=== 推送更新的 Functions Middleware ===" -ForegroundColor Cyan
Write-Host ""

# 检查是否在 Git 仓库中
if (-not (Test-Path ".git")) {
    Write-Host "❌ 错误：当前目录不是 Git 仓库！" -ForegroundColor Red
    Write-Host ""
    Write-Host "请执行以下步骤：" -ForegroundColor Yellow
    Write-Host "1. 找到包含 .git 文件夹的项目目录"
    Write-Host "2. 在 PowerShell 中切换到那个目录"
    Write-Host "3. 再次运行此脚本"
    Write-Host ""
    Write-Host "或者告诉我目录路径，我可以帮你切换过去。" -ForegroundColor Yellow
    exit 1
}

# 检查远程仓库
Write-Host "检查 Git 仓库..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 错误：无法获取远程仓库信息" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Git 仓库: $remote" -ForegroundColor Green
Write-Host ""

# 检查 middleware 文件是否存在
if (-not (Test-Path "functions/_middleware.js")) {
    Write-Host "❌ 错误：找不到 functions/_middleware.js 文件" -ForegroundColor Red
    Write-Host "请确保你在项目根目录中运行此脚本" -ForegroundColor Yellow
    exit 1
}

Write-Host "检查文件状态..." -ForegroundColor Yellow
git status --short functions/_middleware.js

# 添加文件
Write-Host ""
Write-Host "添加文件到 Git..." -ForegroundColor Yellow
git add functions/_middleware.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 错误：添加文件失败" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 文件已添加" -ForegroundColor Green

# 提交
Write-Host ""
Write-Host "提交更改..." -ForegroundColor Yellow
git commit -m "简化 Functions middleware：直接处理所有路由，返回 index.html"

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  警告：提交失败，可能没有更改需要提交" -ForegroundColor Yellow
    Write-Host "继续尝试推送..." -ForegroundColor Yellow
}

# 推送
Write-Host ""
Write-Host "推送到 GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ 成功！代码已推送到 GitHub" -ForegroundColor Green
    Write-Host "Cloudflare Pages 应该会自动开始新的部署" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ 错误：推送失败" -ForegroundColor Red
    Write-Host "请检查网络连接和 Git 权限" -ForegroundColor Yellow
    exit 1
}

