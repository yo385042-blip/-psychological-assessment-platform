# 配置 SSH 密钥连接 GitHub

## 📋 当前状态
- ✅ 远程仓库已配置为 SSH 方式
- ❌ 还没有 SSH 密钥
- ❌ 需要确认 GitHub 主机密钥

---

## 🔧 解决步骤

### 步骤 1: 生成 SSH 密钥

在 PowerShell 中执行：

```powershell
# 生成 SSH 密钥（替换为你的 GitHub 邮箱）
ssh-keygen -t ed25519 -C "your_email@example.com"
```

**执行时会提示：**
1. `Enter file in which to save the key` - 直接按 **Enter**（使用默认路径）
2. `Enter passphrase` - 直接按 **Enter**（不设置密码，或设置一个密码）
3. `Enter same passphrase again` - 再次按 **Enter**

### 步骤 2: 启动 SSH 代理

```powershell
# 启动 ssh-agent
Start-Service ssh-agent

# 或者如果上面的命令失败，尝试：
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent

# 添加 SSH 密钥到代理
ssh-add ~/.ssh/id_ed25519
```

### 步骤 3: 复制公钥

```powershell
# 显示公钥内容
Get-Content ~/.ssh/id_ed25519.pub

# 或者复制到剪贴板
Get-Content ~/.ssh/id_ed25519.pub | clip
```

**重要**：复制输出的整个内容（以 `ssh-ed25519` 开头，以你的邮箱结尾）

### 步骤 4: 在 GitHub 添加 SSH 密钥

1. 访问 GitHub：https://github.com/settings/keys
2. 点击 **"New SSH key"** 按钮
3. **Title**: 填写一个名称（如：`My Windows PC`）
4. **Key**: 粘贴刚才复制的公钥内容
5. 点击 **"Add SSH key"**

### 步骤 5: 测试 SSH 连接

```powershell
# 测试连接（首次会询问是否信任，输入 yes）
ssh -T git@github.com
```

**如果看到：**
```
Hi yo385042-blip! You've successfully authenticated, but GitHub does not provide shell access.
```
说明成功！

### 步骤 6: 推送代码

```powershell
# 推送代码到 GitHub
git push -u origin main
```

---

## 🚀 快速命令（复制粘贴执行）

```powershell
# 1. 生成 SSH 密钥（替换邮箱）
ssh-keygen -t ed25519 -C "your_email@example.com"
# 按 Enter 三次

# 2. 启动 SSH 代理
Start-Service ssh-agent
ssh-add ~/.ssh/id_ed25519

# 3. 显示公钥（复制全部内容）
Get-Content ~/.ssh/id_ed25519.pub

# 4. 测试连接（输入 yes 确认）
ssh -T git@github.com

# 5. 推送代码
git push -u origin main
```

---

## ⚠️ 如果遇到问题

### 问题 1: ssh-agent 启动失败
```powershell
# 手动启动
Set-Service -Name ssh-agent -StartupType Manual
Start-Service ssh-agent
```

### 问题 2: 找不到 ~/.ssh 目录
```powershell
# 创建目录
New-Item -ItemType Directory -Path ~/.ssh -Force
```

### 问题 3: 还是连接失败
- 检查防火墙设置
- 尝试使用 HTTPS + Personal Access Token（见下方）

---

## 🔄 备选方案：使用 HTTPS + Token

如果 SSH 还是有问题，可以切换回 HTTPS 并使用 Personal Access Token：

```powershell
# 1. 切换回 HTTPS
git remote remove origin
git remote add origin https://github.com/yo385042-blip/mindcube.git

# 2. 创建 Personal Access Token
# 访问：https://github.com/settings/tokens
# 点击 "Generate new token (classic)"
# 勾选 "repo" 权限
# 复制生成的 token

# 3. 推送时使用 token 作为密码
git push -u origin main
# Username: yo385042-blip
# Password: 粘贴你的 token（不是 GitHub 密码）
```

