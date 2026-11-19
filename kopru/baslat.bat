@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Canli Dugun - TikTok Koprusu
where node >nul 2>nul || (echo Node.js kurulu degil! https://nodejs.org adresinden LTS surumunu kurun. & pause & exit /b)
if not exist node_modules (
  echo Ilk calistirma: paketler yukleniyor...
  call npm install
)
set /p KULLANICI=TikTok kullanici adiniz (@ olmadan): 
node sunucu.js %KULLANICI%
pause
