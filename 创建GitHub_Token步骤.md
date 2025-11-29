# 创建 GitHub Personal Access Token 步骤

## 📋 步骤说明

### 步骤 1: 访问 Token 设置页面

1. 打开浏览器，访问：**https://github.com/settings/tokens**
2. 或者：
   - 登录 GitHub
   - 点击右上角头像 → **Settings**
   - 左侧菜单找到 **Developer settings**
   - 点击 **Personal access tokens** → **Tokens (classic)**

### 步骤 2: 创建新 Token

1. 点击 **"Generate new token"** 按钮
2. 选择 **"Generate new token (classic)"**

### 步骤 3: 配置 Token

填写以下信息：

- **Note**（备注）: 填写一个名称，如：`My Windows PC - Git Push`
- **Expiration**（过期时间）: 选择：
  - `90 days`（90天）
  - `No expiration`（永不过期，不推荐）
  - 或自定义时间

- **Select scopes**（选择权限）: **必须勾选以下权限**：
  - ✅ **`repo`** - 完整仓库访问权限
    - 这会自动勾选所有子权限（repo:status, repo_deployment, public_repo 等）

### 步骤 4: 生成并复制 Token

1. 滚动到页面底部
2. 点击 **"Generate token"** 按钮
3. **重要**：立即复制生成的 Token！
   - Token 只显示一次
   - 格式类似：`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - 如果关闭页面，需要重新生成

### 步骤 5: 保存 Token

**重要**：将 Token 保存在安全的地方（如密码管理器），因为：
- Token 只显示一次
- 如果丢失，需要重新生成
- 不要分享给他人

---

## 🚀 使用 Token 推送代码

### 在 PowerShell 中执行：

```powershell
# 推送代码
git push -u origin main
```

### 当提示输入凭据时：

1. **Username**: 输入你的 GitHub 用户名：`yo385042-blip`
2. **Password**: **不要输入 GitHub 密码**，而是粘贴刚才复制的 **Token**

---

## ✅ 验证是否成功

如果看到类似以下输出，说明成功：

```
Enumerating objects: XX, done.
Counting objects: 100% (XX/XX), done.
Delta compression using up to X threads
Compressing objects: 100% (XX/XX), done.
Writing objects: 100% (XX/XX), XX.XX KiB | XX.XX MiB/s, done.
Total XX (delta XX), reused 0 (delta 0), pack-reused 0
To https://github.com/yo385042-blip/mindcube.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## 🔒 安全提示

1. **不要将 Token 提交到代码仓库**
2. **不要分享 Token 给他人**
3. **定期更新 Token**（如果设置了过期时间）
4. **如果 Token 泄露，立即删除并重新生成**

---

## 🆘 如果遇到问题

### 问题 1: 提示 "Authentication failed"
- 检查 Token 是否正确复制（没有多余空格）
- 确认勾选了 `repo` 权限
- 尝试重新生成 Token

### 问题 2: 提示 "Permission denied"
- 确认 Token 有 `repo` 权限
- 检查仓库是否存在且有访问权限

### 问题 3: 不想每次都输入密码
可以配置 Git Credential Manager 来保存凭据（Windows 通常已安装）

---

## 📝 快速链接

- Token 设置页面：https://github.com/settings/tokens
- 创建新 Token：https://github.com/settings/tokens/new
- 查看现有 Token：https://github.com/settings/tokens

