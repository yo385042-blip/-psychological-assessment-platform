# 📖 如何找到 Git 仓库目录 - 详细教程

## 🎯 方法 1：自动搜索（最简单）

我已经创建了一个自动搜索脚本。执行以下命令：

```powershell
powershell -ExecutionPolicy Bypass -File find-git-repo.ps1
```

这个脚本会：
- ✅ 自动搜索桌面、文档、下载文件夹
- ✅ 查找所有包含 `.git` 的文件夹
- ✅ 检查是否是 mindcube 相关的仓库
- ✅ 显示找到的所有 Git 仓库路径

---

## 🔍 方法 2：手动查找

### 步骤 1：打开文件资源管理器

1. 按 `Win + E` 打开文件资源管理器
2. 或者点击任务栏的文件资源管理器图标

### 步骤 2：搜索包含 `.git` 的文件夹

#### 方法 A：在地址栏搜索

1. 进入 `C:\Users\26872\Desktop`
2. 在地址栏右侧的搜索框输入：`.git`
3. 等待搜索结果

#### 方法 B：使用 PowerShell 搜索

打开 PowerShell，执行：

```powershell
# 搜索桌面上的所有 .git 文件夹
Get-ChildItem -Path "$env:USERPROFILE\Desktop" -Directory -Recurse -Depth 3 -Filter ".git" -ErrorAction SilentlyContinue | Select-Object @{Name="仓库路径";Expression={$_.Parent.FullName}}, @{Name="文件夹名";Expression={$_.Parent.Name}}
```

---

## 🗂️ 方法 3：回忆你之前的操作

### 思考以下问题：

1. **你之前在哪里克隆的仓库？**
   - 通常会在桌面或文档文件夹

2. **你的项目文件夹叫什么名字？**
   - 可能是 `mindcube`
   - 或者包含 `心理网站` 的文件夹

3. **你之前在哪里执行的 `git push`？**
   - 回想一下你打开 PowerShell 时的路径

---

## 📂 常见位置检查清单

请手动检查这些位置：

- [ ] `C:\Users\26872\Desktop\` 下的所有文件夹
- [ ] `C:\Users\26872\Documents\` 下的所有文件夹
- [ ] `C:\Users\26872\Downloads\` 下的所有文件夹
- [ ] 看看有没有叫 `mindcube` 的文件夹
- [ ] 看看有没有叫 `心理网站编写` 的父文件夹，里面可能有 Git 仓库

---

## 🎯 快速检查命令

**在 PowerShell 中执行这个命令，查看桌面上所有可能的 Git 仓库：**

```powershell
Get-ChildItem -Path "$env:USERPROFILE\Desktop" -Directory | ForEach-Object {
    $gitPath = Join-Path $_.FullName ".git"
    if (Test-Path $gitPath) {
        Write-Host "✅ 找到 Git 仓库: $($_.FullName)" -ForegroundColor Green
        try {
            Push-Location $_.FullName
            $remote = git remote get-url origin 2>&1
            if ($remote -match "mindcube") {
                Write-Host "   ⭐ 这是 mindcube 仓库！" -ForegroundColor Magenta
                Write-Host "   远程: $remote" -ForegroundColor Cyan
            }
        } catch {
            # 忽略
        } finally {
            Pop-Location
        }
    }
}
```

---

## 💡 如果找到了

一旦找到 Git 仓库目录，告诉我路径，我会立即帮你：
1. 切换到那个目录
2. 推送更新后的代码

---

## ❓ 如果找不到

**没关系！告诉我：**
- 你记得的文件夹名字
- 或者大概位置
- 我们可以一起找

---

## 🚀 现在执行

**请运行这个命令，它会自动搜索：**

```powershell
powershell -ExecutionPolicy Bypass -File find-git-repo.ps1
```

然后告诉我结果！

