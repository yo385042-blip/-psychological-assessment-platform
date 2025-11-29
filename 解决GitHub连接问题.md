# 解决 GitHub 连接问题

## 🔍 问题分析

你遇到的错误：
- `Recv failure: Connection was reset` - 连接被重置
- `Failed to connect to github.com port 443` - 无法连接到服务器

这通常是网络问题，可能的原因：
1. 网络不稳定
2. 防火墙阻止
3. GitHub 访问受限（需要代理）
4. 远程仓库地址格式问题

---

## ✅ 解决方案

### 方案 1: 检查并修复远程仓库地址

**问题**：你的命令中有空格，导致地址格式错误
```bash
# 错误的（有空格）
git remote add origin https://github.com/ yo385042-blip/mindcube.git

# 正确的（无空格）
git remote add origin https://github.com/yo385042-blip/mindcube.git
```

**修复步骤**：
```bash
# 1. 删除现有的远程仓库配置
git remote remove origin

# 2. 重新添加（注意：地址中不能有空格）
git remote add origin https://github.com/yo385042-blip/mindcube.git

# 3. 验证配置
git remote -v
```

---

### 方案 2: 使用代理（如果你有代理）

如果你有可用的代理（VPN 或代理服务器）：

```bash
# 设置 HTTP 代理
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 或者使用 SOCKS5 代理
git config --global http.proxy socks5://127.0.0.1:1080
git config --global https.proxy socks5://127.0.0.1:1080

# 推送代码
git push -u origin main

# 推送完成后，可以取消代理设置
git config --global --unset http.proxy
git config --global --unset https.proxy
```

**注意**：将 `127.0.0.1:7890` 替换为你实际的代理地址和端口。

---

### 方案 3: 使用 SSH 方式（推荐，更稳定）

SSH 方式通常比 HTTPS 更稳定：

#### 3.1 检查是否已有 SSH 密钥
```bash
# 检查是否存在 SSH 密钥
ls ~/.ssh/id_rsa.pub
```

#### 3.2 如果没有，生成 SSH 密钥
```bash
# 生成 SSH 密钥（替换为你的邮箱）
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 按 Enter 使用默认路径
# 设置密码（可选，直接 Enter 跳过）
```

#### 3.3 复制公钥
```bash
# Windows PowerShell
cat ~/.ssh/id_rsa.pub | clip

# 或者手动打开文件复制
notepad ~/.ssh/id_rsa.pub
```

#### 3.4 在 GitHub 添加 SSH 密钥
1. 访问 GitHub → Settings → SSH and GPG keys
2. 点击 "New SSH key"
3. Title: 填写一个名称（如：My Computer）
4. Key: 粘贴刚才复制的公钥
5. 点击 "Add SSH key"

#### 3.5 切换到 SSH 方式
```bash
# 删除现有的 HTTPS 远程仓库
git remote remove origin

# 添加 SSH 远程仓库（注意：使用 git@ 开头）
git remote add origin git@github.com:yo385042-blip/mindcube.git

# 测试 SSH 连接
ssh -T git@github.com

# 如果看到 "Hi yo385042-blip! You've successfully authenticated..." 说明成功

# 推送代码
git push -u origin main
```

---

### 方案 4: 增加超时时间和重试

```bash
# 增加超时时间
git config --global http.postBuffer 524288000
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999

# 重试推送
git push -u origin main
```

---

### 方案 5: 使用 GitHub CLI（gh）

如果上述方法都不行，可以尝试使用 GitHub CLI：

```bash
# 安装 GitHub CLI（如果还没安装）
# 下载：https://cli.github.com/

# 登录 GitHub
gh auth login

# 选择 GitHub.com
# 选择 HTTPS
# 选择浏览器登录或输入 token

# 然后推送
git push -u origin main
```

---

### 方案 6: 分批推送（如果文件太大）

如果项目文件很大，可以尝试分批推送：

```bash
# 先推送少量文件测试
git push -u origin main --verbose

# 如果还是失败，可以尝试压缩提交
git gc --aggressive
git push -u origin main
```

---

## 🔧 快速修复命令（推荐顺序）

### 步骤 1: 修复远程仓库地址
```bash
# 检查当前配置
git remote -v

# 如果地址有空格或格式不对，删除并重新添加
git remote remove origin
git remote add origin https://github.com/yo385042-blip/mindcube.git

# 验证
git remote -v
```

### 步骤 2: 尝试推送（如果网络正常）
```bash
git push -u origin main
```

### 步骤 3: 如果还是失败，使用代理或 SSH
（参考上面的方案 2 或方案 3）

---

## 📝 检查清单

- [ ] 远程仓库地址格式正确（无空格）
- [ ] 网络连接正常
- [ ] 如果使用代理，代理配置正确
- [ ] 如果使用 SSH，SSH 密钥已添加到 GitHub
- [ ] Git 用户信息已配置

---

## 💡 临时解决方案

如果急需推送代码，可以：

1. **使用手机热点**（如果电脑网络有问题）
2. **换个网络环境**（如使用其他 WiFi）
3. **使用 GitHub Desktop**（图形界面，可能更稳定）
4. **使用 GitLab 或 Gitee**（国内访问更稳定）

---

## 🆘 如果所有方法都不行

可以尝试：
1. 检查防火墙设置
2. 联系网络管理员
3. 使用 GitHub Desktop 客户端
4. 考虑使用国内代码托管平台（Gitee）作为备份

