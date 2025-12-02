# GitHub Deployment Script
# Push code to GitHub and trigger Cloudflare Pages auto-deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GitHub Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if in git repository
if (-not (Test-Path ".git")) {
    Write-Host "Error: Not a git repository. Please initialize git first:" -ForegroundColor Red
    Write-Host "  git init" -ForegroundColor Yellow
    Write-Host "  git remote add origin <your-repo-url>" -ForegroundColor Yellow
    exit 1
}

# Check git status
Write-Host "Checking git status..." -ForegroundColor Yellow
$status = git status --porcelain

if ($status) {
    Write-Host ""
    Write-Host "Uncommitted changes found:" -ForegroundColor Yellow
    git status --short
    
    Write-Host ""
    $addAll = Read-Host "Add all changes? (Y/N)"
    if ($addAll -eq "Y" -or $addAll -eq "y") {
        git add .
        Write-Host "Changes added." -ForegroundColor Green
    } else {
        Write-Host "Please commit changes manually first." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host ""
    $message = Read-Host "Enter commit message (or press Enter for default)"
    if (-not $message) {
        $message = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }
    
    git commit -m $message
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Commit failed." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Changes committed." -ForegroundColor Green
} else {
    Write-Host "No uncommitted changes." -ForegroundColor Green
}

# Check current branch
$currentBranch = git branch --show-current
Write-Host ""
Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan

# Push to GitHub
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin $currentBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  OK Code pushed to GitHub successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Cloudflare Pages will automatically detect the changes and deploy." -ForegroundColor Cyan
    Write-Host "Check deployment status in Cloudflare Dashboard." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  X Failed to push to GitHub" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. GitHub remote is configured correctly" -ForegroundColor Yellow
    Write-Host "  2. You have push permissions" -ForegroundColor Yellow
    Write-Host "  3. Network connection is stable" -ForegroundColor Yellow
    exit 1
}


