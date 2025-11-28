# 查找 Git 仓库目录脚本
Write-Host "=== 正在查找 Git 仓库目录 ===" -ForegroundColor Cyan
Write-Host ""

$foundRepos = @()

# 检查常见位置
$searchPaths = @(
    "$env:USERPROFILE\Desktop",
    "$env:USERPROFILE\Documents",
    "$env:USERPROFILE\Downloads"
)

foreach ($searchPath in $searchPaths) {
    if (Test-Path $searchPath) {
        Write-Host "正在搜索: $searchPath" -ForegroundColor Yellow
        
        # 搜索包含 .git 的文件夹
        $gitDirs = Get-ChildItem -Path $searchPath -Directory -Recurse -Depth 3 -Filter ".git" -ErrorAction SilentlyContinue
        
        foreach ($gitDir in $gitDirs) {
            $repoPath = $gitDir.Parent.FullName
            $repoName = $gitDir.Parent.Name
            
            Write-Host "  ✅ 找到: $repoPath" -ForegroundColor Green
            
            # 检查是否是 mindcube 相关的仓库
            try {
                Push-Location $repoPath
                $remote = git remote get-url origin 2>&1
                if ($remote -match "mindcube|yo385042") {
                    Write-Host "    ⭐ 这可能是你的仓库！" -ForegroundColor Magenta
                    Write-Host "    远程地址: $remote" -ForegroundColor Cyan
                }
            } catch {
                # 忽略错误
            } finally {
                Pop-Location
            }
            
            $foundRepos += $repoPath
        }
    }
}

Write-Host ""
Write-Host "=== 搜索完成 ===" -ForegroundColor Cyan
Write-Host ""

if ($foundRepos.Count -eq 0) {
    Write-Host "❌ 没有找到 Git 仓库" -ForegroundColor Red
    Write-Host ""
    Write-Host "请尝试：" -ForegroundColor Yellow
    Write-Host "1. 手动检查你的项目文件夹"
    Write-Host "2. 或者告诉我你记得的文件夹名字"
} else {
    Write-Host "找到 $($foundRepos.Count) 个 Git 仓库：" -ForegroundColor Green
    for ($i = 0; $i -lt $foundRepos.Count; $i++) {
        Write-Host "  [$($i+1)] $($foundRepos[$i])" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "请告诉我哪个是你的仓库路径！" -ForegroundColor Yellow
}
