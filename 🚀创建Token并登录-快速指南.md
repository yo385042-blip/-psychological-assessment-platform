# 🚀 创建 Token 并登录 - 快速指南

## ✅ 我看到你已经在 Token 标签页了！

现在只需要：

1. **创建 GitHub Token**
2. **粘贴到输入框**
3. **点击登录**

---

## 📝 步骤 1：创建 GitHub Personal Access Token

### 方法 A：直接打开链接（最简单）

**在浏览器中打开：**
```
https://github.com/settings/tokens/new
```

这会直接打开创建 Token 的页面。

---

### 方法 B：手动导航

1. **打开浏览器，访问：** https://github.com
2. **登录你的 GitHub 账号**
3. **点击右上角头像** → 点击 "Settings"
4. **左侧菜单最底部** → 点击 "Developer settings"
5. **左侧菜单** → 点击 "Personal access tokens"
6. **点击 "Tokens (classic)"**
7. **点击 "Generate new token"** → 选择 "Generate new token (classic)"

---

## 🎯 步骤 2：填写 Token 信息

在 Token 创建页面，填写：

| 项目 | 填写内容 |
|------|---------|
| **Note** | `Cloudflare Pages Deploy`（或任何名字） |
| **Expiration** | `90 days` 或 `No expiration` |
| **Select scopes** | ✅ 勾选 **`repo`** |

**重要：**
- 勾选 `repo` 会自动勾选所有相关的权限
- 这是推送代码必需的权限

---

## 📋 步骤 3：生成并复制 Token

1. **滚动到页面底部**
2. **点击绿色的 "Generate token" 按钮**
3. **Token 会显示在页面上**（只显示一次！）
4. **立即复制整个 Token**（很长的一串字符）

⚠️ **警告：Token 只显示一次，如果关闭页面就找不回来了！**

---

## 🎯 步骤 4：粘贴 Token 并登录

1. **回到 Git 登录对话框**（就是你看到的那个窗口）
2. **在 "Personal access token" 输入框中粘贴 Token**
3. **点击 "Sign in" 按钮**
4. **等待登录完成**

---

## ✅ 步骤 5：推送完成

登录成功后，Git 会自动：
- ✅ 完成身份验证
- ✅ 开始推送代码到 GitHub
- ✅ 显示推送进度

推送完成后，Cloudflare Pages 会自动检测并开始部署！

---

## 💡 提示

- ✅ Token 创建后，可以随时在 GitHub 设置中查看和管理
- ✅ 如果 Token 过期，可以创建新的
- ✅ Token 应该保密，不要分享给他人

---

## 🎯 现在请执行

### 快速操作：

1. **打开浏览器** → 访问：https://github.com/settings/tokens/new
2. **填写 Token 信息：**
   - Note: `Cloudflare Pages Deploy`
   - 勾选 `repo` 权限
   - 点击 "Generate token"
3. **复制 Token**（长字符串）
4. **回到对话框** → 粘贴 Token → 点击 "Sign in"

**完成后告诉我结果！** 🚀

---

## ❓ 如果遇到问题

- **找不到 Token 设置页面？** → 访问：https://github.com/settings/tokens/new
- **Token 创建后找不到？** → 检查浏览器标签，Token 会在创建后立即显示
- **登录后还是报错？** → 告诉我具体错误信息

