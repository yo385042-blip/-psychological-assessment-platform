# 🔗 连接 GitHub 账户 - 操作指南

## 📋 当前页面说明

你看到的页面是 **"从您的帐户部署站点"（Deploy Site from Your Account）**。

这表示你已经完成了仓库权限配置，现在需要**连接 GitHub 账户**。

---

## ✅ 操作步骤

### 步骤 1：连接 GitHub

1. **找到蓝色的 "连接 GitHub" 按钮**
   - 按钮上有一个 GitHub Octocat 图标
   - 按钮文字：**"连接 GitHub"**

2. **点击 "连接 GitHub" 按钮**

3. **授权 Cloudflare 访问 GitHub**
   - 会跳转到 GitHub 授权页面
   - 登录你的 GitHub 账户（如果还没登录）
   - 点击 **"Authorize Cloudflare Pages"**（授权 Cloudflare Pages）或类似按钮

4. **等待跳转回来**
   - 授权完成后会自动跳转回 Cloudflare Pages

---

## 📋 步骤 2：选择仓库

连接 GitHub 后，会显示你的仓库列表：

1. **选择你的项目仓库**
   - 会显示你所有的仓库
   - 找到并选择你的项目（`心理网站编写` 或相关仓库）

2. **点击仓库名称或 "选择" 按钮**

---

## 📋 步骤 3：配置构建设置

选择仓库后，需要配置构建设置：

### 必填配置：

```
项目名称：mindcube（或你的项目名）

构建设置：
  - 生产分支：main（或 master）
  - 框架预设：None（或 Vite）
  - 构建命令：npm run build
  - 构建输出目录：dist
  - 根目录：（留空，使用根目录）
```

### 详细说明：

1. **项目名称**
   - 可以自定义，例如：`mindcube`

2. **生产分支**
   - 通常是 `main` 或 `master`
   - 查看你的仓库默认分支

3. **构建命令**
   - 输入：`npm run build`

4. **构建输出目录**
   - 输入：`dist`

5. **根目录**
   - 留空即可（使用项目根目录）

---

## 🎯 现在请操作

### 立即执行：

1. ✅ **点击蓝色的 "连接 GitHub" 按钮**

2. ✅ **在 GitHub 页面授权**
   - 登录 GitHub（如果需要）
   - 点击授权按钮

3. ✅ **选择仓库**
   - 从列表中选择你的项目仓库

4. ✅ **配置构建设置**
   - 按照上面的配置填写

5. ✅ **保存并部署**
   - 点击 "保存并部署" 或 "Save and Deploy"

---

## ⚠️ 如果还没有 GitHub 仓库

如果你的项目还没有推送到 GitHub，需要先：

### 1. 在 GitHub 创建仓库

1. 访问 https://github.com/new
2. 创建新仓库
3. 不要初始化 README、.gitignore 等（保持空仓库）

### 2. 将项目推送到 GitHub

在你的项目目录运行：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

---

## 💡 提示

- **如果已经连接过 GitHub**：可能只需要选择仓库即可
- **如果是第一次连接**：需要完整授权流程
- **授权是安全的**：Cloudflare 只会访问你授权的仓库

---

## 🎯 现在请执行

1. ✅ 点击 **"连接 GitHub"** 按钮
2. ✅ 完成授权
3. ✅ 选择仓库
4. ✅ 配置构建设置

完成后告诉我你看到了什么界面！

