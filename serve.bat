@echo off
REM Bloger — start a local server (required because the tool uses fetch()).
REM Browsers block fetch() over file://, so serve over HTTP.
title Bloger
cd /d "%~dp0"
echo Starting Bloger at http://localhost:8080
echo Press Ctrl+C to stop.
python -m http.server 8080
