@echo off
chcp 65001 >nul
title Python Adventure - All Services

echo ==========================================
echo   Starting Python Adventure App
echo ==========================================

:: Start backend in new window (kept minimized)
start /min "Backend" cmd /c "cd /d %~dp0 && npm run dev:server"

:: Wait for backend
timeout /t 2 /nobreak >nul

:: Start frontend in current window
echo.
echo Starting Frontend...
npm run dev