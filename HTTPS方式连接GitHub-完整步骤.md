# 使用 HTTPS + Token 连接 GitHub - 完整步骤

## 📋 前置检查

确保你已经：
- [x] 在 GitHub 上创建了仓库：`yo385042-blip/mindcube`
- [ ] 本地项目已初始化 Git
- [ ] 已创建首次提交

---

## 🚀 完整步骤

### 步骤 1: 初始化 Git 并提交代码（如果还没做）

在 PowerShell 中执行：

```powershell
# 1. 初始化 Git 仓库
git init

# 2. 添加所有文件
git add .

# 3. 创建首次提交
git commit -m "初始提交：心理测评管理平台"
```

### 步骤 2: 配置远程仓库为 HTTPS

```powershell
# 删除现有的远程仓库（如果存在）
git remote remove origin

# 添加 HTTPS 远程仓库
git remote add origin https://github.com/yo385042-blip/mindcube.git

# 验证配置
git remote -v
```

应该看到：
```
origin  https://github.com/yo385042-blip/mindcube.git (fetch)
origin  https://github.com/yo385042-blip/mindcube.git (push)
```

### 步骤 3: 创建 GitHub Personal Access Token

#### 3.1 访问 Token 页面
打开浏览器，访问：**https://github.com/settings/tokens**

#### 3.2 创建新 Token
1. 点击 **"Generate new token"** → **"Generate new token (classic)"**
2. 填写信息：
   - **Note**: `My Windows PC - Git Push`
   - **Expiration**: 选择 `90 days` 或自定义
   - **Select scopes**: ✅ **勾选 `repo`**（这会自动勾选所有仓库权限）
3. 点击 **"Generate token"**
4. **立即复制 Token**（只显示一次！）
   - Token 格式：`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### 3.3 保存 Token
将 Token 保存在安全的地方（如记事本或密码管理器）

### 步骤 4: 设置分支并推送

```powershell
# 1. 确保分支名为 main
git branch -M main

# 2. 推送代码（会提示输入用户名和密码）
git push -u origin main
```

### 步骤 5: 输入凭据

当提示输入凭据时：

1. **Username**: 输入 `yo385042-blip`
2. **Password**: **粘贴你的 Token**（不是 GitHub 密码！）

**注意**：
- 输入密码时，PowerShell 不会显示字符（这是正常的）
- 直接粘贴 Token 后按 Enter

---

## ✅ 成功标志

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

## 🔧 如果遇到问题

### 问题 1: "fatal: not a git repository"
**解决**：先执行 `git init`

### 问题 2: "Authentication failed"
**解决**：
- 检查 Token 是否正确复制（没有多余空格）
- 确认勾选了 `repo` 权限
- 重新生成 Token 试试

### 问题 3: "remote origin already exists"
**解决**：
```powershell
git remote remove origin
git remote add origin https://github.com/yo385042-blip/mindcube.git
```

### 问题 4: 网络连接问题
**解决**：
- 检查网络连接
- 尝试使用手机热点
- 或使用代理（如果有）

---

## 📝 快速命令（复制粘贴）

```powershell
# 1. 初始化（如果还没做）
git init
git add .
git commit -m "初始提交：心理测评管理平台"

# 2. 配置远程仓库
git remote remove origin
git remote add origin https://github.com/yo385042-blip/mindcube.git
git remote -v

# 3. 推送（需要先创建 Token）
git branch -M main
git push -u origin main
# Username: yo385042-blip
# Password: 粘贴你的 Token
```

---

## 🔗 重要链接

- 创建 Token：https://github.com/settings/tokens/new
- 查看 Token：https://github.com/settings/tokens
- 你的仓库：https://github.com/yo385042-blip/mindcube

---

## 💡 提示

- Token 只显示一次，务必保存好
- 如果 Token 泄露，立即删除并重新生成
- 后续推送代码只需：`git push`（如果配置了凭据管理器）

