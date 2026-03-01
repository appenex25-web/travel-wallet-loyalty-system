# Travel Wallet NFC Reader (tray app)

Runs the NFC reader helper as a Windows app that sits in the system tray (notification area). No console window.

- **Minimised to tray** – runs in the background; right‑click the tray icon for options.
- **Start when Windows starts** – tick “Start when Windows starts” in the tray menu (or choose it during installation).
- **Same API** – serves `http://localhost:31337/uid` (and `/uid/clear`, POST `/uid`) like the Node.js `server.js`.
- **Open admin for NFC linking** – tray menu opens the admin from this PC (localhost) so the browser can reach the reader. Enter your server API URL once (e.g. `http://YOUR_SERVER_IP:3000`). Scan card then works.

## Build the installer

1. **Install dependencies** (once):
   ```bash
   cd pos-reader/tray
   npm install
   ```

2. **Build the Electron app** (unpacked folder):
   ```bash
   npm run pack
   ```
   This creates `pos-reader/tray/dist/win-unpacked/` with the executable and resources.

3. **Create the installer** with [Inno Setup](https://jrsoftware.org/isinfo.php):
   - Install Inno Setup 6 if needed.
   - Open `pos-reader/installer/PosReaderSetup.iss` in Inno Setup Compiler, or run:
     ```bash
     "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" pos-reader\installer\PosReaderSetup.iss
     ```
   - The installer exe will be in `pos-reader/installer/output/`.

Optional: add `pos-reader/tray/icon.ico` (and optionally `icon.png` for the tray) for a custom icon; otherwise the app uses a default.
