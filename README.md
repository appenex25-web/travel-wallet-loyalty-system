# Travel Wallet & Loyalty System

Backend (NestJS), web app (POS + Admin), and mobile app (Expo) for a travel agent loyalty and booking system.

## Quick start – test the Android app

1. **Backend** (Terminal 1):
   ```bash
   cd backend
   cp .env.example .env   # edit DATABASE_URL if needed
   npm install && npm run start:dev
   ```
   Seed an admin and a customer: `npm run seed`, then register a customer via `POST /auth/register` or the web app.

2. **Android Studio**: Open Android Studio and start an **Android Virtual Device** (AVD) from Device Manager, or connect a physical device with USB debugging.

3. **Mobile app** (Terminal 2):
   ```bash
   cd mobile
   cp .env.example .env   # EXPO_PUBLIC_API_URL=http://10.0.2.2:3000 for emulator
   npm install
   npm run android
   ```
   The app will open in the emulator/device. Log in with a customer account.

- **Emulator**: `.env` should use `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`.
- **Physical device**: Use your PC’s IP in `mobile/.env` (e.g. `http://192.168.1.x:3000`), same Wi‑Fi as the phone. You **don’t open the project in Android Studio** — use **Expo Go** (scan QR from `npx expo start`) or run `npx expo run:android` with the device connected by USB. See `mobile/README.md`.

## Repo structure

| Folder    | Description |
|----------|-------------|
| `backend`| NestJS API (auth, wallet, points, bookings, hotels, flights, POS, admin). |
| `web`    | React POS + Admin dashboard (Vite). |
| `mobile` | Expo (React Native) customer app – wallet, rewards, book, QR. |
| `pos-reader` | Optional NFC reader helper for POS. |

See `backend/README.md`, `mobile/README.md` for details.
