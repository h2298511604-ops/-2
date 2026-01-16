@echo off
echo [1/2] 正在启动后台服务...
start /b python app.py
timeout /t 2 /nobreak >nul
echo [2/2] 正在打开网页...
cd web
start /b npm run dev
timeout /t 4 /nobreak >nul
start http://localhost:5173
echo 启动成功！请不要关闭此黑色窗口。
pause