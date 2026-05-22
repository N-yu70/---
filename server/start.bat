@echo off
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo [错误] 未找到 Node.js
  echo 请安装 Node.js: https://nodejs.org/
  echo 或使用 Cursor 自带 node 的完整路径运行
  pause
  exit /b 1
)

if not exist .env copy .env.example .env

echo.
echo 零依赖启动（无需 npm install）
echo API: http://127.0.0.1:3000
echo 健康检查: http://127.0.0.1:3000/api/health
echo.

node src/index.js
pause
