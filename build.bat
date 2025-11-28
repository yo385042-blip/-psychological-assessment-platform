@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Building project...
npm run build
if %ERRORLEVEL% EQU 0 (
    echo Build completed successfully!
) else (
    echo Build failed with error code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)
