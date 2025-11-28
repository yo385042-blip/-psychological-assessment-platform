# ⚙️ 配置 Cloudflare Pages 构建 - 详细步骤

## 📋 前提条件

- ✅ 已完成代码推送到 GitHub
- ✅ GitHub 仓库包含完整源代码和配置文件

---

## ✅ 步骤 1：进入项目设置

### 1.1 登录 Cloudflare Dashboard

1. **打开浏览器**
2. **访问：** https://dash.cloudflare.com/
3. **登录你的账户**

### 1.2 进入 Pages 项目

1. **左侧菜单 → Workers & Pages**
2. **点击你的项目**
   - 可能是 `psytest.store` 或 `mindcube`

---

## ✅ 步骤 2：找到构建设置

### 2.1 进入设置页面

1. **点击顶部的 "设置" (Settings) 标签**

### 2.2 找到构建和部署部分

在设置页面中，查找以下选项之一：

- **"Builds & deployments"** 或 **"构建和部署"**
- **"Build configuration"** 或 **"构建配置"**
- 可能在左侧菜单或页面中间部分

---

## ✅ 步骤 3：配置构建命令

### 3.1 找到构建命令设置

在构建和部署部分，你会看到以下字段：

1. **框架预设 (Framework preset)**
   - 选择：**None** 或 **Vite**
   - 推荐选择 **None**，手动配置

2. **构建命令 (Build command)**
   - 输入：`npm run build`
   - **重要：** 必须输入这个命令

3. **构建输出目录 (Output directory)**
   - 输入：`dist`
   - **重要：** 必须输入 `dist`

4. **根目录 (Root directory)**
   - **留空**（使用项目根目录）
   - 或者输入：`/` 或 `.`

### 3.2 配置 Node.js 版本

查找 **"Node.js version"** 或 **"Node.js 版本"**：

- 选择：**18** 或 **20**
- 推荐：**18**

### 3.3 最终配置应该显示：

```
框架预设：None
构建命令：npm run build
构建输出目录：dist
根目录：（留空）
Node.js 版本：18
```

---

## ✅ 步骤 4：保存设置

### 4.1 保存

1. **滚动到页面底部**
2. **找到 "保存" (Save) 按钮**
3. **点击保存**

### 4.2 确认保存成功

- 页面可能会刷新
- 或者显示 "设置已保存" 的提示
- 配置应该已经更新

---

## ✅ 步骤 5：触发重新部署

### 方法 1：推送新提交（推荐）

推送一个新提交到 GitHub，Cloudflare Pages 会自动检测并构建：

```bash
# 在项目目录运行

# 1. 提交空提交触发重新构建
git commit --allow-empty -m "触发 Cloudflare Pages 重新构建"

# 2. 推送
git push origin main
```

### 方法 2：手动重新部署

1. **进入部署页面**
   - 点击 **"部署"** (Deployments) 标签

2. **找到最新部署**
   - 点击部署右侧的三个点（...）菜单

3. **重新部署**
   - 点击 **"重新部署"** (Retry deployment) 或 **"Retry build"**

---

## ✅ 步骤 6：查看构建日志

### 6.1 进入部署详情

1. **Deployments → 最新部署**
2. **点击部署**

### 6.2 查看构建日志

应该看到以下步骤：

1. ✅ **克隆仓库**
   ```
   Cloning repository...
   Success: Finished cloning repository files
   ```

2. ✅ **安装依赖**
   ```
   Installing dependencies...
   npm install
   ```

3. ✅ **运行构建**
   ```
   Running build command...
   npm run build
   ```

4. ✅ **复制 Functions**
   ```
   Copying functions directory to dist...
   Functions directory copied to dist successfully!
   ```

5. ✅ **部署成功**
   ```
   Success: Your site was deployed!
   ```

### 6.3 检查关键信息

确认**没有**以下错误：
- ❌ "No build command specified"
- ❌ "No functions dir found"

确认**有**以下信息：
- ✅ "Running build command"
- ✅ "Functions directory copied"
- ✅ "Success: Your site was deployed!"

---

## ✅ 步骤 7：验证 Functions 部署

### 7.1 检查 Functions 标签

1. **在部署详情页面**
2. **点击 "函数" (Functions) 标签**

### 7.2 应该看到

- ✅ `_middleware.js` 函数
- ✅ 状态为 Active 或 Deployed
- ✅ 没有错误信息

---

## ✅ 步骤 8：测试网站

### 8.1 访问网站

1. **找到网站 URL**
   - 在部署详情页面查看
   - 通常格式：`https://psytest.store.pages.dev`

2. **访问网站**
   - 在浏览器中打开 URL

### 8.2 测试功能

1. **测试首页**
   - ✅ 是否能正常打开？
   - ✅ 页面是否正常显示？

2. **测试路由**
   - ✅ `/login` 是否能访问？
   - ✅ `/dashboard` 是否能访问？
   - ✅ 其他路由是否正常？

---

## 📋 完成后的检查清单

- [ ] 构建设置已配置：`npm run build` → `dist`
- [ ] 构建日志显示构建成功
- [ ] 没有 "No build command specified" 错误
- [ ] 没有 "No functions dir found" 错误
- [ ] Functions 标签显示 `_middleware.js`
- [ ] 网站能正常访问
- [ ] 所有路由都能正常工作

---

## 🎯 现在请执行

1. ✅ **进入 Cloudflare Pages 项目设置**
2. ✅ **配置构建命令：`npm run build`**
3. ✅ **配置输出目录：`dist`**
4. ✅ **保存设置**
5. ✅ **触发重新部署**
6. ✅ **查看构建日志**
7. ✅ **测试网站**

完成后告诉我结果！

