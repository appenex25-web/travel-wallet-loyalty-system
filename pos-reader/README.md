# ACR122U NFC reader helper

Runs on the POS Windows PC. Reads NFC card UID from the ACR122U (when using `--with-reader`) or accepts UID via POST. The POS web app can poll `GET /uid` to get the last read UID.

## Run

```bash
cd pos-reader
npm install
npm start
```

- **Without reader**: Server only. Use `POST http://localhost:31337/uid` with body `{ "uid": "04a1b2c3d4e5f6" }` to set the UID (e.g. from another app or script).
- **With reader**: `npm run start:reader` (requires `nfc-pcsc` and native PC/SC; on Windows you may need [pcsc drivers](https://www.acs.com.hk/en/driver/3/acr122u-usb-nfc-reader/) and **Visual Studio Build Tools** with "Desktop development with C++" and Windows SDK for the native module to compile).
- **Windows without build tools**: Run `npm start` in one terminal, then in another run `npm run set-uid`.
- **NTAG + Visual Basic**: Use the VB.NET bridge in `nfc-windows-vb/` to read NTAG UIDs and POST them here (no Node build tools). See `nfc-windows-vb/README.md`. When you tap a card, use your reader’s app (e.g. ACS demo tool) to see the UID, paste it into `set-uid`, press Enter — the POS page will pick it up.

## Endpoints

- `GET http://localhost:31337/uid` → `{ "uid": "hex-string" }` or `{ "uid": null }`. Does **not** clear the UID, so the app can poll and show a stable “card on reader” and support **quick tap** (client taps and removes card; one read is enough).
- `POST http://localhost:31337/uid/clear` → clear cached UID (call when starting a new scan so you don’t show a previous card).
- `POST http://localhost:31337/uid` body `{ "uid": "hex" }` → set last UID (CORS enabled for POS origin).

## POS integration

On the POS page, use "Listen to reader" to poll this server and auto-fill the NFC UID when a card is tapped (reader must be running on the same machine).

---

## Tray app and installer (Windows)

For a **no-console** experience on POS PCs, use the **tray app**: it runs in the system tray (notification area) and can start with Windows.

- **Build the installer**: See `tray/README.md`. In short: `cd tray`, `npm install`, `npm run pack`, then compile `installer/PosReaderSetup.iss` with [Inno Setup](https://jrsoftware.org/isinfo.php). The installer exe is created in `installer/output/`.
- **Tray menu**: Right‑click the tray icon for **Start when Windows starts**, **Open reader URL**, **Exit**.
- Same HTTP API as the Node server (`localhost:31337`). For automatic ACR122U read, use the VB bridge or another app that POSTs the UID to the tray app.

---

## Production / install on other computers

**How `npm install` behaves**

- **nfc-pcsc** is an **optionalDependency**. On every machine (dev or production), `npm install` will try to install it. If the machine **does not** have Visual Studio Build Tools + Windows SDK, the install **still succeeds** but nfc-pcsc is skipped. The server runs in “server-only” mode: no hardware reader, but `GET`/`POST` `/uid` work (e.g. for the paste workaround or another app that POSTs the UID).
- If the machine **does** have Build Tools, nfc-pcsc compiles and you can use `npm run start:reader` for automatic card read.

**Recommended for production (no Build Tools on POS PCs)**

1. On each POS computer: install Node.js, then `cd pos-reader`, `npm install`, `npm start`. No VS/Build Tools needed.
2. Use one of:
   - **Paste workaround**: Run `npm run set-uid` in a second terminal; staff paste the UID from your reader app (e.g. ACS tool) after tapping the card.
   - **Standalone reader app**: Use any small app or script that reads the ACR122U (e.g. manufacturer’s demo, or a small C#/C++ tool using Windows PC/SC) and POSTs the UID to `http://localhost:31337/uid`. Then the POS page will pick it up when “Listen to reader” is on.

**If you want automatic reader (Option B) on each production PC**

- **Option B1 – Build tools on every PC**: Install Visual Studio Build Tools with “Desktop development with C++” and Windows SDK on each POS machine, then run `npm install` and `npm run start:reader`. Heavy but works.
- **Option B2 – Build once, copy (advanced)**: On one machine that has Build Tools, run `npm install` so nfc-pcsc compiles. Copy the whole `pos-reader` folder (including `node_modules`) to other **same-OS, same Node version** PCs. Run `npm run start:reader` there. Avoid upgrading Node or changing OS on targets or the native module may break.

**Summary**

| Scenario | Install | Run | Reader behavior |
|----------|--------|-----|------------------|
| Production, no Build Tools | `npm install` ✅ | `npm start` | No hardware read; use set-uid or external app that POSTs UID |
| Production, Build Tools on each PC | `npm install` ✅, nfc-pcsc builds | `npm run start:reader` | Automatic ACR122U read |
| Production, build-once copy | Copy built folder | `npm run start:reader` | Automatic read (same Node/OS only) |

---

## NTAG cards – Visual Basic bridge (`nfc-windows-vb/`)

If you use **NTAG** cards (not Mifare Classic) and have **Visual Basic / .NET** on Windows, you can use the small VB.NET app that reads the card via PC/SC and POSTs the UID to this server.

1. Install [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (or runtime).
2. Build: `cd nfc-windows-vb` then `dotnet build -c Release`.
3. Start the pos-reader server: `npm start` (from `pos-reader`).
4. Run: `nfc-windows-vb\bin\Release\net8.0\NfcReader.exe`.
5. On the POS page click **Listen to reader** and tap an NTAG card.

No nfc-pcsc or Visual Studio Build Tools required. See `nfc-windows-vb/README.md` for details.
