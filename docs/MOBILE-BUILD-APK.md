# Building the Android APK (Travel Wallet mobile app)

Two ways to get an APK: **Android Studio** (local, if you already use it for testing) or **EAS Build** (cloud, no Android Studio needed).

---

## Quick: Live APK with Android Studio (connects to https://www.appenex.org)

**Important:** Build the **release** APK so the app runs standalone. The **debug** APK expects Metro and will show "Unable to load script" when installed alone.

1. **Set live API and regenerate** (once, or when you change the API URL):
   ```bash
   cd mobile
   ```
   Ensure `mobile/.env` contains: `EXPO_PUBLIC_API_URL=https://www.appenex.org`  
   Then run: `npx expo prebuild --platform android`

2. **Open in Android Studio:** **File → Open** → choose the **`mobile/android`** folder (not the whole `mobile` folder). Wait for Gradle sync.

3. **Build the release APK** (so the JS bundle is inside the app):
   - **Build → Generate Signed Bundle / APK…** → choose **APK** → Next.
   - **Create new…** (keystore): choose a path and password, fill Key alias (e.g. `travelwallet`) and password → OK → Next.
   - Select **release** build variant → **Create**. Wait for the build.
   - Or: **Build → Select Build Variant** → set **release**, then **Build → Build Bundle(s) / APK(s) → Build APK(s)** (uses debug keystore for release in this project).

4. **Get the APK:** **Locate** in the notification, or find it at:
   `mobile/android/app/build/outputs/apk/release/app-release.apk`  
   Copy to your phone and install. The app will open and talk to the live server.

---

## Option A: Build APK with Android Studio (detailed)

Use this if you already run the app from Android Studio. The APK will use your live API at **https://www.appenex.org** if you set it before prebuild.

### 1. Set the production API URL and generate Android project

In **mobile**, set the API URL and run prebuild (do this whenever you want the app to point at the live server):

```bash
cd mobile
# In .env set EXPO_PUBLIC_API_URL=https://www.appenex.org (so the APK talks to your live site)
npx expo prebuild
```

If you already have an **android/** folder, prebuild will update it. The `.env` value is read at prebuild time and baked into the app.

### 2. Open the project in Android Studio

- **File → Open** and select the **mobile/android** folder (not the whole mobile folder).
- Wait for Gradle sync to finish.

### 3. Build the APK

- **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
- Wait for the build to finish. Android Studio will show a notification with **Locate** to open the output folder.

The **debug APK** is at:

```
mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

Copy this file to your phone (USB, email, cloud, etc.) and open it to install.

**If you see "Unable to load script"** when opening the app: the debug APK expects the Metro dev server. Build and install the **release** APK instead (step 4 below); the release build has the JS bundle embedded and runs standalone.

### 4. Release APK (for standalone install – no Metro; use this for testing on device)

Build a **release** APK so the app runs without Metro (no "Unable to load script"):

- **Build → Generate Signed Bundle / APK…** → **APK** → create or choose a keystore → build **release**.  
- Or: **Build → Select Build Variant** → set **release**, then **Build → Build APK(s)** (this project signs release with the debug keystore).

The release APK is at `mobile/android/app/build/outputs/apk/release/app-release.apk`. Copy to your phone and install.

---

## Option B: Build APK with EAS (cloud, no Android Studio)

### 1. Install EAS CLI and log in

```bash
npm install -g eas-cli
eas login
```

Create a free [Expo](https://expo.dev) account if you don't have one.

---

### 2. Build the APK

From the **mobile** folder:

```bash
cd mobile
npm run build:apk
```

Or run directly:

```bash
eas build --platform android --profile preview
```

The build runs in the cloud. When it finishes, EAS prints a **download link** for the APK.

---

### 3. Install on the phone

1. On your Android device, open the download link (or copy the APK from your PC to the phone).
2. Tap the APK file and tap **Install**.
3. If prompted, allow **Install from unknown sources** for your browser or file manager.
4. Open **Travel Wallet** and log in with a customer account.

---

### Profiles (eas.json)

| Profile       | Command               | Output | Use case                |
|---------------|------------------------|--------|-------------------------|
| **preview**   | `npm run build:apk`    | APK    | Install on devices      |
| **production**| `npm run build:aab`    | AAB    | Upload to Google Play   |

Both profiles set `EXPO_PUBLIC_API_URL=https://www.appenex.org`. To use a different API, edit the `env` block for that profile in `mobile/eas.json`.

---

## Troubleshooting (Android Studio release build)

**"OutOfMemoryError: Metaspace" or "mergeExtDexRelease FAILED"**  
The project’s `mobile/android/gradle.properties` is set to use more JVM memory and to build only `arm64-v8a` (most phones). Stop the Gradle daemon so it picks up the new settings: in a terminal run `cd mobile/android` then `.\gradlew.bat --stop`. Then in Android Studio run **Build → Clean Project**, then **Build → Build APK(s)** again (with release variant).

**CMake "object file directory has 200 characters" / path too long**  
On Windows, enable long paths (see `mobile/README.md`) and use a shorter project path (e.g. `C:\tw` instead of a long Desktop path) if the build still fails.
