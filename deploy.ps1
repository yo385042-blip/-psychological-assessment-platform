# MIND CUBE Deployment Script
# Quick deployment to Cloudflare Pages

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIND CUBE Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if in correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from the project root directory." -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "OK Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "X Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "OK npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "X npm not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting build..." -ForegroundColor Yellow
Write-Host ""

# Build project
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "X Build failed. Please check the error messages above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "OK Build successful!" -ForegroundColor Green
Write-Host ""

# Check dist directory
if (-not (Test-Path "dist")) {
    Write-Host "X dist directory does not exist" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "dist/functions")) {
    Write-Host "Warning: dist/functions directory does not exist. Trying to copy..." -ForegroundColor Yellow
    node scripts/copy-functions.js
}

Write-Host ""
Write-Host "Checking Wrangler..." -ForegroundColor Yellow

# Check Wrangler
try {
    $wranglerVersion = wrangler --version
    Write-Host "OK Wrangler installed" -ForegroundColor Green
} catch {
    Write-Host "Warning: Wrangler not installed. Installing..." -ForegroundColor Yellow
    npm install -g wrangler
    if ($LASTEXITCODE -ne 0) {
        Write-Host "X Wrangler installation failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Ready to deploy to Cloudflare Pages..." -ForegroundColor Yellow
Write-Host ""

# Ask for confirmation
$confirm = Read-Host "Continue deployment? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting deployment..." -ForegroundColor Green
Write-Host ""

# Deploy
wrangler pages deploy dist

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  OK Deployment successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tip: If this is your first deployment, please configure KV bindings in Cloudflare Dashboard" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  X Deployment failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above, or use the following command to deploy manually:" -ForegroundColor Yellow
    Write-Host "  wrangler pages deploy dist" -ForegroundColor Cyan
    exit 1
}
