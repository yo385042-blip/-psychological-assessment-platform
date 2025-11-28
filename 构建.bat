@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在构建项目...
echo.
npm run build
if %ERRORLEVEL% EQU 0 (
    echo.
    echo 构建成功完成！
) else (
    echo.
    echo 构建失败，错误代码: %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)


