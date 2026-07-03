@echo off
echo ===================================================
echo KHOI DONG HE THONG TUYEN DUNG AI (FRONTEND - BACKEND - AI SERVICE)
echo ===================================================

echo 1. Dang khoi dong AI Service (Python FastAPI)...
start "AI_Python_Service" cmd /k "cd /d d:\KhoaLuan\Python && python main.py"

echo 2. Dang khoi dong Backend Main (C# ASP.NET Core)...
start "CSharp_Backend" cmd /k "cd /d d:\KhoaLuan\RecruitmentBackend\RecruitmentBackend && dotnet run"

echo 3. Dang khoi dong Frontend (React - Vite)...
start "React_Frontend" cmd /k "cd /d d:\KhoaLuan\ai-recruitment-frontend && npm run dev"

echo Hoan tat! Ca 3 dich vu dang chay song song trong cac cua so cmd rieng biet.