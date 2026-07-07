@echo off
setlocal enabledelayedexpansion
set "V7LA_PORTABLE_ROOT=%~dp0"
set "PATH=%V7LA_PORTABLE_ROOT%runtime;%PATH%"
set "V7LA_PROJECT_ROOT=%V7LA_PORTABLE_ROOT%"

echo.
echo   =============================================
echo   V7LA-PORTABLE-SUITE v2.2.0 (AUTONOMOUS-PRIME)
echo   =============================================
echo   Runtime  : %V7LA_PORTABLE_ROOT%runtime\node.exe
echo   Vault    : %V7LA_PORTABLE_ROOT%vault
echo   Interface: %V7LA_PORTABLE_ROOT%OpenClaw.exe
echo.

echo [DEPENDENCY CHECK] Verifying dependencies...
set "VENV_PYTHON=%USERPROFILE%\.gemini\antigravity-ide\mcp\mcp_env\Scripts\python.exe"
set "VENV_PIP=%USERPROFILE%\.gemini\antigravity-ide\mcp\mcp_env\Scripts\pip.exe"
if not exist "%VENV_PYTHON%" (
    set "VENV_PYTHON=%USERPROFILE%\.gemini\antigravity-ide\scratch\mcp_env\Scripts\python.exe"
    set "VENV_PIP=%USERPROFILE%\.gemini\antigravity-ide\scratch\mcp_env\Scripts\pip.exe"
)

if exist "%VENV_PYTHON%" (
    :: Check and install Graphify
    "%VENV_PYTHON%" -c "import graphify" 2>nul
    if !errorlevel! neq 0 (
        echo [WARN] Graphify is missing. Installing Graphify automatically...
        "%VENV_PIP%" install graphify
        if !errorlevel! equ 0 (
            echo [OK] Graphify installed successfully.
        ) else (
            echo [ERROR] Failed to install Graphify.
        )
    ) else (
        echo [OK] Graphify is active.
    )

    :: Check other dependencies
    "%VENV_PYTHON%" -c "import mcp_amazon_paapi" 2>nul
    if !errorlevel! neq 0 (
        echo [WARN] mcp_amazon_paapi is missing. Installing automatically...
        "%VENV_PIP%" install mcp-amazon-paapi 2>nul
    )
) else (
    echo [WARNING] Antigravity Python environment not found. Skip auto-dependency check.
)
echo.

:: Launch the main status dashboard with S3 Solo Sentinel Stack & Master Engine Prompt v3.2.md
powershell -NoProfile -ExecutionPolicy Bypass -Command "& { . '%V7LA_PORTABLE_ROOT%v7la-core.ps1'; m 'Picu dan patuhi instruksi makro global dari keahlian: @solo-sentinel sesuai dengan Master Engine Prompt v3.2.md + best_practices.md'; v }"

echo.
echo   Sistem Siaga, Pak Bos! 🛡️✨🚀
echo.
