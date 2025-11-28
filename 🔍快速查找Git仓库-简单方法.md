# 🔍 快速查找 Git 仓库 - 简单方法

## 💡 最简单的方法

### 方法 1：在 PowerShell 中运行这个命令

**复制粘贴这个命令到 PowerShell 中执行：**

```powershell
Get-ChildItem -Path "$env:USERPROFILE\Desktop" -Directory | ForEach-Object {
    $gitPath = Join-Path $_.FullName ".git"
    if (Test-Path $gitPath) {
        Write-Host "✅ 找到 Git 仓库: $($_.FullName)" -ForegroundColor Green
        try {
            Push-Location $_.FullName
            $remote = git remote get-url origin 2>&1
            Write-Host "   远程地址: $remote" -ForegroundColor Cyan
        } catch {
            Write-Host "   (无法获取远程信息)" -ForegroundColor Yellow
        } finally {
            Pop-Location
        }
    }
}
```

这个命令会：
- ✅ 搜索桌面上的所有文件夹
- ✅ 检查哪些包含 `.git` 文件夹
- ✅ 显示找到的 Git 仓库路径

---

### 方法 2：手动检查（最简单）

**按照以下步骤操作：**

1. **打开文件资源管理器**
   - 按 `Win + E`

2. **进入桌面**
   - 点击左侧的"桌面"文件夹
   - 或者直接进入：`C:\Users\26872\Desktop`

3. **查看所有文件夹**
   - 看看有没有叫 `mindcube` 的文件夹
   - 或者看看"心理网站编写"文件夹里面是否有其他子文件夹

4. **检查是否有 `.git` 文件夹**
   - 打开一个可能的文件夹
   - 如果看到 `.git` 文件夹（可能需要显示隐藏文件），那就是 Git 仓库！

**显示隐藏文件的方法：**
- 在文件资源管理器中，点击"查看"标签
- 勾选"隐藏的项目"

---

### 方法 3：使用搜索功能

1. **打开文件资源管理器**
2. **进入 `C:\Users\26872\Desktop`**
3. **在搜索框输入：** `.git`
4. **等待搜索结果**
5. **找到的 `.git` 文件夹所在的父文件夹就是 Git 仓库目录**

---

## 📋 检查当前目录的父文件夹

**当前你在：**
```
C:\Users\26872\Desktop\心理网站编写\02 管理器 - 副本 - 副本
```

**Git 仓库可能在这些位置：**
- `C:\Users\26872\Desktop\心理网站编写\mindcube\`
- `C:\Users\26872\Desktop\mindcube\`
- 或者其他子文件夹

---

## 🎯 现在执行

**请选择一种方法：**

1. **运行上面的 PowerShell 命令**（最快）
2. **或者手动检查桌面上的文件夹**
3. **或者告诉我你记得的文件夹名字**

找到后告诉我路径，我会立即帮你推送代码！

