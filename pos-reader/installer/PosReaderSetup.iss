; Inno Setup script for Travel Wallet NFC Reader (tray app).
; Build the Electron app first: cd pos-reader/tray && npm run pack
; Then compile this script with Inno Setup (e.g. iscc installer\PosReaderSetup.iss from pos-reader).

#define MyAppName "Travel Wallet NFC Reader"
#define MyAppExe "Travel Wallet NFC Reader.exe"
#define MyAppVersion "1.0.0"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher=Travel Wallet
DefaultDirName={autopf}\Travel Wallet NFC Reader
DefaultGroupName=Travel Wallet
DisableProgramGroupPage=yes
OutputDir=output
OutputBaseFilename=TravelWalletNfcReader-Setup-{#MyAppVersion}
; Optional: add icon.ico to pos-reader/tray/ and uncomment next line for custom installer icon
; SetupIconFile=..\tray\icon.ico
UninstallDisplayIcon={app}\{#MyAppExe}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Tasks]
Name: "startup"; Description: "Run {#MyAppName} when Windows starts"; GroupDescription: "Startup"; Flags: unchecked
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons"

[Files]
Source: "..\tray\dist\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExe}"; Comment: "NFC reader helper for POS (system tray)"
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExe}"; Tasks: startup
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExe}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExe}"; Description: "Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Ensure app is closed on uninstall
Filename: "taskkill"; Parameters: "/f /im ""{#MyAppExe}"""; Flags: runhidden; RunOnceId: "KillApp"
