param(
  [string]$Branch = "main"
)

Write-Host "=== GitHub deploy script ===" -ForegroundColor Cyan

# Ensure we are in the script directory (project root)
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "Current directory: $(Get-Location)"

# Show status
$status = git status --porcelain
if (-not $?) {
  Write-Error "git status failed. Please check that git is installed and this is a git repo."
  exit 1
}

if ($status) {
  Write-Host "Uncommitted changes found:" -ForegroundColor Yellow
  Write-Host $status

  $answer = Read-Host "Add all changes? (Y/N)"
  if ($answer -match '^(Y|y)$') {
    git add .
    if (-not $?) {
      Write-Error "git add failed."
      exit 1
    }

    $msg = Read-Host "Enter commit message (or press Enter for default)"
    if ([string]::IsNullOrWhiteSpace($msg)) {
      $msg = "auto deploy"
    }

    git commit -m "$msg"
    if (-not $?) {
      Write-Error "git commit failed."
      exit 1
    }
  } else {
    Write-Host "Please commit your changes manually, then re-run this script."
    exit 0
  }
} else {
  Write-Host "No uncommitted changes." -ForegroundColor Green
}

Write-Host "Pushing to GitHub (branch: $Branch)..." -ForegroundColor Cyan
git push origin $Branch
if (-not $?) {
  Write-Error "git push failed. Please check your network or GitHub settings."
  exit 1
}

Write-Host "Push completed. Cloudflare Pages (GitHub) will build and deploy automatically." -ForegroundColor Green


