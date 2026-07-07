@echo off
setlocal enabledelayedexpansion
title V7LA Portable Suite - Setup

echo ====================================================
echo      V7LA PORTABLE SUITE - ONE-CLICK INSTALLER
echo ====================================================
echo.

set "SUITE_DIR=%cd%"
set "USER_DIR=%USERPROFILE%"

:: Convert backslashes to forward slashes for JSON formatting
set "SUITE_DIR_JSON=%SUITE_DIR:\=/%"
set "USER_DIR_JSON=%USER_DIR:\=/%"

echo Current Directory  : %SUITE_DIR%
echo User Profile Path  : %USER_DIR%
echo.

if not exist "mcp_config.json.template" (
    echo [ERROR] mcp_config.json.template not found!
    echo Please make sure you extract the ZIP file fully.
    pause
    exit /b 1
)

echo [1/4] Resolving paths in mcp_config.json...
powershell -NoProfile -Command ^
    "(Get-Content 'mcp_config.json.template') " ^
    "-replace '\{\{PORTABLE_SUITE_DIR\}\}', '%SUITE_DIR_JSON%' " ^
    "-replace '\{\{USERPROFILE\}\}', '%USER_DIR_JSON%' | " ^
    "Set-Content 'mcp_config.json'"

if not exist "mcp_config.json" (
    echo [ERROR] Failed to generate mcp_config.json!
    pause
    exit /b 1
)
echo [OK] Generated mcp_config.json locally.

echo [2/4] Installing mcp_config.json to AppData folders...

:: 1. Antigravity IDE
set "GEMINI_DIR=%USERPROFILE%\.gemini\antigravity-ide"
if not exist "%GEMINI_DIR%" mkdir "%GEMINI_DIR%"

if exist "%GEMINI_DIR%\mcp_config.json" (
    echo Backing up existing Gemini mcp_config.json...
    copy /Y "%GEMINI_DIR%\mcp_config.json" "%GEMINI_DIR%\mcp_config.json.bak"
)
copy /Y "mcp_config.json" "%GEMINI_DIR%\mcp_config.json"
echo [OK] Configured Antigravity IDE.

:: 2. Claude Desktop
set "CLAUDE_DIR=%APPDATA%\Claude"
if not exist "%CLAUDE_DIR%" mkdir "%CLAUDE_DIR%"

if exist "%CLAUDE_DIR%\claude_desktop_config.json" (
    echo Backing up existing Claude Desktop config...
    copy /Y "%CLAUDE_DIR%\claude_desktop_config.json" "%CLAUDE_DIR%\claude_desktop_config.json.bak"
)
copy /Y "mcp_config.json" "%CLAUDE_DIR%\claude_desktop_config.json"
echo [OK] Configured Claude Desktop.

echo [3/4] Checking and installing Python dependencies automatically...
set "VENV_PYTHON=%USERPROFILE%\.gemini\antigravity-ide\mcp\mcp_env\Scripts\python.exe"
set "VENV_PIP=%USERPROFILE%\.gemini\antigravity-ide\mcp\mcp_env\Scripts\pip.exe"
:: Alternate path check for scratch location
if not exist "%VENV_PYTHON%" (
    set "VENV_PYTHON=%USERPROFILE%\.gemini\antigravity-ide\scratch\mcp_env\Scripts\python.exe"
    set "VENV_PIP=%USERPROFILE%\.gemini\antigravity-ide\scratch\mcp_env\Scripts\pip.exe"
)

if exist "%VENV_PYTHON%" (
    echo Antigravity Python environment detected at: %VENV_PYTHON%
    
    :: 1. Check Graphify
    "%VENV_PYTHON%" -c "import graphify" 2>nul
    if !errorlevel! neq 0 (
        echo [WARN] Graphify is missing. Installing Graphify automatically...
        "%VENV_PIP%" install graphify
        if !errorlevel! eq 0 (
            echo [OK] Graphify installed successfully.
        ) else (
            echo [ERROR] Failed to install Graphify.
        )
    ) else (
        echo [OK] Graphify is already installed.
    )

    :: 2. Check Paapi / PA-API helper
    "%VENV_PYTHON%" -c "import mcp_amazon_paapi" 2>nul
    if !errorlevel! neq 0 (
        echo [WARN] mcp_amazon_paapi is missing. Installing automatically...
        "%VENV_PIP%" install mcp-amazon-paapi 2>nul
    )
) else (
    echo [WARNING] Antigravity Python virtual environment was not found.
    echo   Please open Antigravity IDE once so it initializes the environment.
)

echo [4/4] System Health Check...
:: Run the bootstrapper/HUD status check
if exist "V7LA-START-SUITE.bat" (
    echo Booting up V7LA Sovereign Hub...
    echo.
    call "V7LA-START-SUITE.bat"
) else (
    echo [WARNING] V7LA-START-SUITE.bat not found in root.
)

echo.
echo ====================================================
echo  [SUCCESS] V7LA Portable Suite is fully configured!
echo ====================================================
echo.
pause
