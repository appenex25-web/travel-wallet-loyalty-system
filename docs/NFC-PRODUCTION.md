# How NFC works with the deployed app

Your API and web app are on the server at **http://45.76.31.105** (web) and **http://45.76.31.105:3000** (API). NFC still works the same way: the **reader** runs on the **POS computer**; the **browser** and **API** can be the deployed site.

---

## 1. What runs where

| Piece | Where it runs | Purpose |
|-------|----------------|---------|
| **API** | Server (45.76.31.105:3000) | Looks up customer by NFC UID, wallet, points, redemptions. |
| **Web app (POS page)** | Browser on the **POS PC** | You open **http://45.76.31.105** on the POS machine and go to the POS page. It talks to the API in the cloud. |
| **Reader helper** | **Same POS PC** (localhost:31337) | Small local server that reads the NFC hardware and exposes the card UID. The POS page in the browser polls `http://localhost:31337/uid`. |

So: **one POS computer** has the NFC reader plugged in, the reader helper running, and the browser open to your deployed site. The API is already on the server; no need to run backend or database on the POS.

---

## 2. Setup on each POS computer (where the NFC reader is)

You can use either the **installable tray app** (recommended) or the **Node.js helper**.

### Option A: Install the tray app (recommended)

1. **Run the installer**  
   On the POS PC, run **Travel Wallet NFC Reader** setup (e.g. `TravelWalletNfcReader-Setup-1.0.0.exe` from `pos-reader/installer/output/` after building).  
   - During setup you can choose **"Run when Windows starts"** so the reader helper starts with the PC.  
   - You can also enable **"Start when Windows starts"** later from the **tray icon** (right‑click the icon in the notification area).

2. **Tray app behaviour**  
   After install, the app runs in the **system tray** (no console window). Right‑click the tray icon for:
   - **Start when Windows starts** – turn on or off.
   - **Open reader URL** – open `http://localhost:31337` in the browser.
   - **Exit** – close the helper.

3. **NFC hardware (ACR122U)**  
   The tray app serves the same HTTP API (`/uid`, `/uid/clear`, POST `/uid`). For automatic card read you still need the **VB.NET bridge** or another app that POSTs the UID to `http://localhost:31337/uid` (see pos-reader README). The tray app can run on its own for manual UID entry or with the VB bridge.

To **build the installer**: see `pos-reader/tray/README.md` (build Electron app with `npm run pack`, then compile `pos-reader/installer/PosReaderSetup.iss` with Inno Setup).

### Option B: Node.js reader helper

1. **Install Node.js** on the Windows PC (e.g. from [nodejs.org](https://nodejs.org)).

2. **Copy and run the reader helper**  
   Copy the **`pos-reader`** folder from your project to the POS PC. Then:
   ```bash
   cd pos-reader
   npm install
   npm start
   ```
   Leave this running. It listens on **http://localhost:31337**.  
   - Without extra setup it runs in “server only” mode: no automatic hardware read, but you can use the paste workaround or another app that POSTs the UID to `http://localhost:31337/uid`.  
   - For **automatic** ACR122U read you need either:
     - **Visual Studio Build Tools** on that PC and run `npm run start:reader`, or  
     - The **VB.NET bridge** (see pos-reader README): build and run `nfc-windows-vb\bin\Release\net8.0\NfcReader.exe`; it reads the card and POSTs the UID to the reader helper.

3. **Open the POS in the browser**  
   On the **same** POS PC, open a browser and go to:
   ```text
   http://45.76.31.105
   ```
   Log in as agent/admin, then open the **POS** page.

4. **Start listening to the reader**  
   On the POS page, click **“Listen to reader”** (or the equivalent “scan card” / NFC button). The page will poll `http://localhost:31337/uid` and, when a UID appears, send it to the API at **http://45.76.31.105:3000**.  
   Customer balance and points are shown from the server; you can complete the sale (wallet/points) there.

---

## 3. Why the reader must be on the same PC as the browser

The POS page calls **`http://localhost:31337`** to get the UID. That address is only valid on the machine where the reader helper is running. So:

- The **browser** must be on the **same computer** that runs the reader helper and has the NFC reader attached.
- The **API** can be (and is) on the server; the page already uses **http://45.76.31.105:3000** when you use the deployed site.

So: **one PC = one reader + reader helper + browser on your deployed app.**

---

## 4. Linking NFC cards to customers (admin)

Before a tap can identify a customer, that card’s **UID** must be linked to their customer record:

1. Log in to the **admin** at **http://45.76.31.105**.
2. Open **Customers**, then the customer.
3. Use **“Add NFC tag”** (or “Link NFC”): enter the card’s UID and save.

The UID is the hex string from the reader (e.g. from the reader helper, the VB app, or `npm run set-uid`). After it’s linked, when that card is tapped at any POS that uses your deployed app, the API will return that customer’s wallet and points.

---

## 5. Quick checklist per POS location

- [ ] **Reader helper** running on the POS PC: either **tray app** installed (and optionally “Start when Windows starts”) or **Node.js** `npm start` (or `npm run start:reader` / VB app) in **pos-reader**.
- [ ] Browser on **the same PC** opened to **http://45.76.31.105** → POS page.
- [ ] On POS page, click **“Listen to reader”** and tap a card.
- [ ] In admin, each customer’s NFC card UID is **linked** to their profile.

No backend or database need to run on the POS PC; the deployed server handles everything except reading the card, which stays local on the POS machine.
