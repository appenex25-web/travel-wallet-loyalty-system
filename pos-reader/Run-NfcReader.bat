@echo off
title NFC Reader (NTAG / ACR122U)
cd /d "%~dp0"
echo Starting NFC Reader... Make sure pos-reader is running (npm start) and POS page has "Listen to reader" on.
echo.
dotnet run --project nfc-windows-vb
pause
