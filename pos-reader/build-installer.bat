@echo off
REM Build Travel Wallet NFC Reader installer.
REM Requires: Node.js, npm, Inno Setup 6 (default path below).
set ISCC="C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
set VB_OK=1

cd /d "%~dp0"

echo Building NFC bridge (VB, for automatic card read)...
mkdir tray\resources\nfc-bridge 2>nul
dotnet publish nfc-windows-vb\NfcReader.vbproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o tray\resources\nfc-bridge
set VB_OK=0
if errorlevel 1 (
  set VB_OK=0
  echo VB bridge build failed - need .NET 8 SDK: https://dotnet.microsoft.com/download/dotnet/8.0
  echo Building tray without bundled NFC bridge - card read will need NfcReader.exe run separately.
  node -e "const p=require('./tray/package.json'); p.build.extraResources=[]; require('fs').writeFileSync('./tray/package.json', JSON.stringify(p,null,2));"
)

echo.
echo Building tray app (Electron)...
cd tray
call npm install
call npm run pack
if errorlevel 1 ( echo Tray build failed. & exit /b 1 )
cd ..

echo.
echo Building installer with Inno Setup...
if not exist %ISCC% (
  echo Inno Setup not found at %ISCC%
  echo Install from https://jrsoftware.org/isinfo.php or set ISCC in this script.
  exit /b 1
)
%ISCC% "installer\PosReaderSetup.iss"
if errorlevel 1 ( echo Inno Setup failed. & exit /b 1 )

echo.
echo Done. Installer: pos-reader\installer\output\TravelWalletNfcReader-Setup-1.0.0.exe

if "%VB_OK%"=="0" git checkout -- tray/package.json 2>nul
