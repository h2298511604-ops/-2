@echo off
echo ==========================================
echo 正在启动飞猪房源评分系统...
echo ==========================================

:: 1. 启动后端 (在后台运行)
echo [1/3] 正在启动 Python 后端...
start /b python app.py

:: 等待 3 秒让后端先跑起来
timeout /t 3 /nobreak >nul

:: 2. 启动前端
echo [2/3] 正在启动前端界面...
cd web
start /b npm run dev

:: 等待 5 秒让前端编译
timeout /t 5 /nobreak >nul

:: 3. 自动打开浏览器
echo [3/3] 打开浏览器...
start http://localhost:5173

echo ==========================================
echo 系统已启动！请在浏览器中操作。
echo 关闭此窗口即可停止服务。
echo ==========================================
pause