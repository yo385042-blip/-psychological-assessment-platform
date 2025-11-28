# Search for Git repositories
Write-Host "Searching for Git repositories..." -ForegroundColor Cyan
Write-Host ""

$desktop = [Environment]::GetFolderPath("Desktop")
$found = $false

Get-ChildItem -Path $desktop -Directory -Recurse -Depth 2 -ErrorAction SilentlyContinue | ForEach-Object {
    $gitPath = Join-Path $_.FullName ".git"
    if (Test-Path $gitPath) {
        $found = $true
        Write-Host "Found Git repo: $($_.FullName)" -ForegroundColor Green
        
        try {
            Push-Location $_.FullName
            $remote = git remote get-url origin 2>&1
            if ($remote -match "mindcube|yo385042") {
                Write-Host "  *** This is your mindcube repo! ***" -ForegroundColor Magenta
                Write-Host "  Remote: $remote" -ForegroundColor Cyan
            }
            Pop-Location
        } catch {
            Pop-Location
        }
    }
}

if (-not $found) {
    Write-Host "No Git repositories found on Desktop" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. Documents folder"
    Write-Host "2. Or tell me the folder name you remember"
}

