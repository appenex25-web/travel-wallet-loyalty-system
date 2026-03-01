# Travel Wallet & Loyalty System – Todo

## Phase 0 – Project setup
- [x] Create project folder on Desktop (`travel-wallet-loyalty-system`)
- [x] Initialize NestJS backend (PostgreSQL, TypeORM, auth)
- [x] Initialize React web app (POS + Admin dashboard, Tailwind)
- [x] Initialize React Native (Expo) mobile app
- [x] Add `.env.example` and document env vars

## Phase 1 – Core backend & admin
- [x] Implement entities: Customer, NFCIdentifier, WalletLedger, PointsLedger, Offer, Redemption
- [x] Implement auth (customer register/login, agent login) and RBAC
- [x] Wallet APIs: balance, top-up (manual)
- [x] Points & offers APIs; redemption recording
- [x] QR session service (in-memory short-lived tokens)
- [x] POS identify endpoints (NFC UID, QR token)
- [x] Basic admin dashboard (overview, customers, offers placeholders)

## Phase 2 – Agent POS & hardware
- [x] POS web UI: Tap Card (NFC UID), Scan QR token, customer summary, Apply redemption
- [x] ACR122U helper (pos-reader: HTTP server + optional nfc-pcsc; Listen to reader on POS)
- [x] Redemption creation via API (audit via ledger)

## Phase 3 – Customer mobile app
- [x] Auth (login), wallet balance, points, token persistence (AsyncStorage)
- [x] Rewards/offers list
- [x] QR session screen with QR code display (react-native-qrcode-svg)

## Phase 4 – Bookings
- [x] Booking entity and APIs (create, list by customer, apply wallet)
- [x] Booking views in admin and mobile app (list, create, apply wallet)
- [x] Hotel and Flight catalog (DB + admin CRUD; list/detail for mobile)
- [x] Bookings linked to hotel/flight (admin: select from catalog; customer: book from app → auto-fills admin table)

## Phase 5 – Trip campaigns & mobile overhaul
- [x] Trip campaigns: TripCampaign + CampaignAddOn entities, CRUD, list active/admin
- [x] Bookings from campaign (POST /bookings/from-campaign) with add-ons and campaignId
- [x] Messaging: MessageThread + Message, threads/me, send, admin list + reply, booking notification on create
- [x] Posts (reviews): Post entity, POST/GET posts, linked to booking
- [x] Saved campaigns: CustomerSavedCampaign, save/unsave, GET saved/me
- [x] Customer 6-digit PIN: pinHash, set/change (old PIN required), verify on transaction, admin reset-pin
- [x] GET /customers/me/qr-payload (same as admin customer QR)
- [x] Web admin: Trip campaigns page; AdminCustomerDetail – bookings, messages, Reset PIN
- [x] Web POS: Customer panel shows bookings and messages when customer identified
- [x] Mobile: New tabs (Home, Messages, Post, My Trips, Account); light theme, blue accent
- [x] Mobile Home: wallet balance + Scan button (→ Wallet / QR screens), top buttons, search, campaigns
- [x] Mobile: WalletScreen, QR screen (customer payload), CampaignDetailScreen (add-ons, PIN, book)
- [x] Mobile: MessagesScreen, ChatScreen; PostScreen, WriteReviewScreen; AccountScreen (tier, saved, details)
- [x] Mobile: My Trips = BookingsScreen; PIN required for apply-wallet and from-campaign

## Phase 6 – Reservations & Hotels/Flights flows
- [x] Mobile: Reduce header padding (avoid camera notch); add divider line below header
- [x] Mobile: Hotels and Flights buttons open list screens (card grid like campaigns)
- [x] Mobile: Hotel detail – image slideshow (imageUrls or imageUrl), details, room type selector, check-in/out (optional), Book with PIN
- [x] Mobile: Flight detail – details and Book with PIN
- [x] Backend: Hotel entity – imageUrls (jsonb), roomTypes (jsonb); Booking – checkInAt, checkOutAt, roomType
- [x] Backend: POST /bookings/from-catalog accepts checkInAt, checkOutAt, roomType for hotel; room type price delta applied
- [x] Admin: New “Reservations” tab – sub-tabs Hotels | Flights | Transport | Campaigns; list by type, pending count badge
- [x] Admin: Reservation list – name/route, client, dates, total, status; click row → detail; Confirm / Deny / Cancel with reason
- [x] On Confirm: auto-deduct from wallet (remaining amount), send “Reservation confirmed” notification to customer
- [x] On Deny/Cancel: send notification to customer

## Phase 7 – Future (skipped for now)
- [ ] ~~Apple/Google Wallet pass issuance and VAS/Smart Tap~~ (deferred)

---
**App development complete.** Backend, web (POS + Admin), and mobile (Expo) are ready. Test the Android app via Expo (see `mobile/README.md`). Run DB migrations in `backend/migrations/` if using production-style DB.

*Updated as development progresses.*
