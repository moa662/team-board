@echo off
chcp 65001 >nul
title 时间轴更新

echo.
echo  ╔══════════════════════════════════════╗
echo  ║        时间轴更新工具                ║
echo  ╚══════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo  [1/2] 正在读取 timeline-data.json ...
echo.

python build.py

if %errorlevel% equ 0 (
    echo.
    echo  ✅ 更新成功！
    echo.
    echo  现在可以直接打开 index.html 查看效果
    echo.
) else (
    echo.
    echo  ❌ 更新失败，请检查错误信息
    echo.
)

pause
