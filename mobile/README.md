# Travel Wallet – Mobile App (Android / iOS)

Customer app: wallet, points, rewards, book hotels/flights, show QR for in-store.

Use **Option A** (Expo Go) for the quickest test, **Option B** for a one-command install from the terminal, or **Option C** to open the project in Android Studio and build with Gradle (like other Android apps).

---

## Prerequisites

- Node.js 18+
- Backend running (see project root `backend/`)
- **Physical device**: phone and PC on the same Wi‑Fi (for Expo Go) or USB cable + USB debugging (for direct install)

## Setup (once)

```bash
cd mobile
cp .env.example .env
# Edit .env: set EXPO_PUBLIC_API_URL (see below)
npm install
```

### API URL

- **Physical device (same Wi‑Fi as PC)**: use your PC’s IP, e.g. `http://192.168.1.100:3000` (replace with your PC’s IP; run `ipconfig` on Windows to find it).
- **Android emulator**: use `http://10.0.2.2:3000`.

---

## Option A: Install on physical device with Expo Go (easiest)

No Android Studio needed. The app runs inside the **Expo Go** app on your phone.

1. **On your Android phone**: Install **Expo Go** from the Google Play Store.

2. **On your PC**: In `mobile/.env` set:
   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:3000
   ```
   (e.g. `http://192.168.1.100:3000` — use the IP of the PC where the backend runs.)

3. **Start the backend** (in a terminal):
   ```bash
   cd backend && npm run start:dev
   ```

4. **Start Expo** (in another terminal):
   ```bash
   cd mobile
   npx expo start
   ```

5. **On your phone**: Open Expo Go and **scan the QR code** shown in the terminal (or in the browser that opened). The Travel Wallet app will load inside Expo Go.

6. Log in with a customer account (create one via the web app or `POST /auth/register` on the backend).

---

## Option B: Install from the terminal (no Expo Go)

One command builds and installs the app. Android Studio (or the SDK) is used for the build, but you don’t open the project in the IDE.

1. **On your phone**: Enable **Developer options** and **USB debugging**. Connect the phone to the PC with a USB cable.

2. **On your PC**: In `mobile/.env` set `EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:3000`.

3. **Start the backend**: `cd backend && npm run start:dev`

4. **Build and install** (in another terminal):
   ```bash
   cd mobile
   npx expo run:android
   ```
   The first run may download the SDK and generate the `android/` folder, then build and install on your phone.

5. Open **Travel Wallet** on the device and log in.

---

## Option C: Build with Android Studio (Gradle)

Same workflow as other Android apps: open the project in Android Studio, sync Gradle, and run. Use this if you prefer the IDE (Logcat, debugger, signing, etc.).

1. **Generate the native Android project** (once, or after changing `app.json` / Expo config):
   ```bash
   cd mobile
   npx expo prebuild
   ```
   This creates the `android/` folder (and `ios/`). You only need to run it again if you change Expo/app config.

2. **On your phone**: Enable **Developer options** and **USB debugging**. Connect via USB.

3. **On your PC**: In `mobile/.env` set `EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:3000` (your PC’s IP for the backend). Start the backend: `cd backend && npm run start:dev`.

4. **Open in Android Studio**: In Android Studio choose **File → Open** and select the **`mobile/android`** folder (not the whole `mobile` folder). Wait for Gradle sync to finish.

5. **Run**: Select your connected device (or an emulator) and click **Run** (green play). The app will build and install.

6. Open **Travel Wallet** on the device and log in.

If you later change `app.json` or add Expo plugins, run `npx expo prebuild` again in `mobile/`, then reopen or sync the project in Android Studio.

---

## Android emulator (instead of physical device)

1. Install Android Studio and create/start an AVD (Device Manager → Create Device → start it).
2. In `mobile/.env` use `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`.
3. Run `cd mobile && npm run android` — the app will open in the emulator.

---

## Which option to use?

| Option | Best for |
|--------|----------|
| **A (Expo Go)** | Fastest way to try the app; no build, no Android Studio. App runs inside Expo Go. |
| **B (terminal)** | One command to build and install; no need to open Android Studio. |
| **C (Android Studio)** | Same as your other apps: open project, Gradle, Run. Full IDE (debugger, Logcat, signing). |

---

## Windows: “Filename longer than 260 characters”

On Windows, the Android build can fail with **ninja: error: Filename longer than 260 characters** when building native modules (e.g. safe-area-context, screens). Do both steps below.

### 1. Enable long paths in Windows

Run **PowerShell as Administrator**:

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

Restart the PC (or at least close and reopen Android Studio / terminals). See [Microsoft docs](https://learn.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation?tabs=powershell).

### 2. Use a newer Ninja (required for the build)

The Android SDK’s CMake ships an old Ninja that hits the path limit. Replace it with Ninja **v1.12 or newer**:

1. Download **ninja-win.zip** from [ninja releases](https://github.com/ninja-build/ninja/releases) (e.g. v1.12.1).
2. Locate your Android SDK CMake bin folder, for example:
   `C:\Users\<You>\AppData\Local\Android\Sdk\cmake\3.22.1\bin\`
3. (Optional) Backup the existing `ninja.exe`.
4. Copy the new `ninja.exe` from the zip into that folder, overwriting the old one.

After that, run the build again (e.g. **Build → Rebuild Project** in Android Studio or `.\gradlew.bat :app:assembleDebug` from `mobile/android`).

---

## App flow

**Login** → **Home** (wallet, points) → **Rewards** (offers) → **Book** (hotels & flights) → **Bookings** (my bookings, pay with wallet) → **Show QR** (in-store).
