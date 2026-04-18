@echo off
echo ===================================================
echo KHOI DONG HE THONG TUYEN DUNG AI
echo ===================================================

echo 1. Dang khoi dong AI Service (Python FastAPI)...
start "AI_Python_Service" cmd /k "cd /d d:\KhoaLuan\Python && python main.py"

echo 2. Dang khoi dong Backend Main (C# ASP.NET Core)...
start "CSharp_Backend" cmd /k "cd /d d:\KhoaLuan\RecruitmentBackend\RecruitmentBackend && dotnet run"

echo Hoan tat! Ca 2 backend dang chay song song.