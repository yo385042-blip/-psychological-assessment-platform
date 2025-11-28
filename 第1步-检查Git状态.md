# 第 1 步：检查 Git 状态

## 🎯 当前任务

检查你的项目是否已经是 Git 仓库，以及有哪些文件需要提交。

---

## 📋 操作步骤

### 步骤 1.1：打开终端/命令行

**方法 A：在项目文件夹中打开（推荐）**

1. **打开文件资源管理器**
2. **导航到项目文件夹：**
   ```
   C:\Users\26872\Desktop\心理网站编写\02 管理器 - 副本 - 副本
   ```
3. **在文件夹中：**
   - 按住 `Shift` 键
   - 右键点击空白处
   - 选择 **"在此处打开 PowerShell 窗口"** 或 **"在此处打开命令提示符"**

**方法 B：手动打开 PowerShell**

1. **按 `Win + X`**
2. **选择 "Windows PowerShell" 或 "终端"**
3. **运行以下命令：**
   ```powershell
   cd "C:\Users\26872\Desktop\心理网站编写\02 管理器 - 副本 - 副本"
   ```

### 步骤 1.2：检查是否已经是 Git 仓库

**运行以下命令：**
```bash
git status
```

**可能的结果：**

#### ✅ 情况 1：已经是 Git 仓库

如果看到类似这样的输出：
```
On branch main (or master)
Changes not staged for commit:
  ...
```
→ **说明已经是 Git 仓库，可以继续下一步**

#### ❌ 情况 2：还不是 Git 仓库

如果看到错误：
```
fatal: not a git repository (or any of the parent directories): .git
```
→ **需要先初始化 Git 仓库（看下面的步骤 1.3）**

### 步骤 1.3：初始化 Git 仓库（如果需要）

**如果还不是 Git 仓库，运行：**

```bash
git init
```

**然后设置分支名称：**

```bash
git branch -M main
```

**然后配置远程仓库（如果还没配置）：**

```bash
git remote add origin https://github.com/yo385042-blip/mindcube.git
```

### 步骤 1.4：再次检查状态

**运行：**
```bash
git status
```

**查看输出：**

1. **已跟踪的文件：**
   - 显示在 "Changes to be committed" 下

2. **未跟踪的文件：**
   - 显示在 "Untracked files" 下
   - 这些文件需要添加

3. **已修改的文件：**
   - 显示在 "Changes not staged for commit" 下
   - 这些文件需要添加

---

## ✅ 预期结果

运行 `git status` 后，你应该看到：

- ✅ 很多未跟踪的文件（`src/`、`functions/`、`public/` 等）
- ✅ 可能有一些已修改的文件
- ✅ **没有** `node_modules/`（应该被忽略）
- ✅ **没有** `dist/`（应该被忽略）

---

## 🎯 下一步

确认 Git 状态后，继续：
- **第 2 步：添加所有文件到 Git**

---

## 💡 提示

- 如果看到很多文件，这是正常的
- 重点是确认 `node_modules/` 和 `dist/` 没有被列出
- 如果有问题，告诉我具体的错误信息

