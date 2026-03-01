# Travel Wallet & Loyalty – Backend API

NestJS API for wallet, points, POS identification (NFC/QR), and redemptions.

## Setup

**Requires PostgreSQL running** (e.g. on `localhost:5432`). The API will not start until the database is reachable.

```bash
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, CORS_ORIGINS
npm install
npm run start:dev
```

API base: `http://localhost:3000` (set `VITE_API_URL` in the web app to match; set `EXPO_PUBLIC_API_URL` in mobile for device testing).

## Endpoints

### Auth
- `POST /auth/register` – Customer sign up (body: `email`, `password`, `name`, `phone?`). Creates user + customer; they appear in admin customer list.
- `POST /auth/login` – Customer/login (body: `email`, `password`) → `access_token`, `user` (includes `mustChangePassword` when customer must set a new password on first login).
- `POST /auth/agent/login` – Agent/admin login (same body; role must be agent/admin)
- `POST /auth/change-password` – Set new password (JWT; body: `currentPassword`, `newPassword`). Used after first login when `mustChangePassword` is true.

### Customers
- `GET /customers/me` – Current customer (JWT, role customer)
- `GET /customers/me/has-pin` – Whether customer has a 6-digit security PIN set (JWT, customer) → `{ hasPin: boolean }`
- `POST /customers/me/pin` – Set or change 6-digit PIN (JWT, customer; body: `pin`, `confirmPin?`, `oldPin?` for change)
- `GET /customers/me/qr-payload` – Same QR payload as admin customer detail (JWT, customer) → `{ payload: "tw:cust:${customerId}" }`
- `GET /customers/:id` – Customer by id (JWT, agent/admin)
- `GET /customers/:id/qr-payload` – QR payload for POS (JWT, agent/admin)
- `POST /customers/:id/nfc-identifiers` – Link NFC tag (body: `tagUid`, `label?`) (JWT, agent/admin)

### Wallet
- `GET /wallet/me` – Balance for current customer (JWT, customer)
- `GET /wallet/me/history` – Transaction history (JWT, customer)
- `GET /wallet/:customerId` – Balance for customer (JWT, agent/admin)
- `POST /wallet/:customerId/topup` – Top up (body: `amount`, `source?`, `reference?`) (JWT, agent/admin)

### Points
- `GET /points/me` – Points for current customer (JWT, customer)
- `GET /points/me/history` – Points history (JWT, customer)
- `GET /points/offers/active` – Active offers (JWT)

### QR
- `POST /qr/session` – Create short-lived QR session (JWT, customer) → `token`, `expiresIn`
- `GET /qr/session/:token` – Resolve token to customer + balance + points (no auth, for POS)

### POS
- `GET /pos/customer/:customerId` – Get customer summary (balance, points) by ID (JWT, agent/admin)
- `GET /pos/rewards-rate` – Points per dollar from active bonus_points offer (JWT, agent/admin)
- `POST /pos/identify/nfc` – Identify by NFC UID (body: `tagUid`) (JWT, agent/admin)
- `POST /pos/identify/qr` – Identify by QR token (body: `token`) (JWT, agent/admin)
- `POST /pos/customer/:customerId/purchase` – Record purchase: deduct from wallet, award points (body: `amount`, `reference?`) (JWT, agent/admin). Points use active offer type `bonus_points` with `conditions.pointsPerDollar` (default 1).
- `POST /pos/redemptions` – Create redemption (body: `customerId`, `branchId?`, `walletAmount`, `pointsUsed`, `bookingId?`) (JWT, agent/admin; agent/branch from token or body)

### Admin
- `GET /admin/dashboard/summary` – KPIs (wallet float, active customers, redemptions, points) + `weeklyActivity` (last 7 days wallet/redemption counts)
- `GET /admin/dashboard/recent-transactions?limit=20` – Recent wallet and redemption transactions (agent/admin)
- `GET /admin/customers?search=` – List customers with `points` and `last_activity_at` (agent/admin). Includes customers created by admin and those who signed up via the mobile app.
- `POST /admin/customers` – Create customer (body: `email`, `name`, `phone?`; optional `password`). If no password, default is first name in lowercase; customer must change it on first login.
- `POST /admin/customers/:id/reset-pin` – Reset customer security PIN (admin); customer must set new PIN on next use.
- `GET /admin/campaigns` – List all trip campaigns (admin; includes draft/ended)
- `GET /admin/offers` – List offers
- `POST /admin/offers` – Create offer (admin)
- `PATCH /admin/offers/:id` – Update offer (admin)
- `GET /admin/branches` – List branches

### Catalog (hotels & flights – used by admin and mobile app)
- `GET /hotels` – List hotels (public)
- `GET /hotels/:id` – Hotel detail
- `POST /hotels` – Create hotel (admin/agent; body: name, description?, location?, imageUrl?, imageUrls?, roomTypes?, currency?). roomTypes: [{ name, description?, size?, amenities?, pricePerNight, imageUrls? }]. Legacy: priceDelta still supported per room type.
- `PATCH /hotels/:id` – Update hotel (admin/agent)
- `DELETE /hotels/:id` – Delete hotel (admin)
- `GET /flights` – List flights (public)
- `GET /flights/:id` – Flight detail
- `POST /flights` – Create flight (admin/agent; body: origin, destination, flightNumber?, departureAt?, price, currency?)
- `PATCH /flights/:id` – Update flight (admin/agent)
- `DELETE /flights/:id` – Delete flight (admin)

### Trip campaigns
- `GET /campaigns` – List active trip campaigns (public)
- `GET /campaigns/saved/me` – My saved campaigns (JWT, customer)
- `GET /campaigns/:id` – Campaign detail with add-ons
- `POST /campaigns` – Create campaign (admin/agent; body: title, shortDescription?, description?, imageUrls?, basePrice, currency?, addOns?)
- `PATCH /campaigns/:id` – Update campaign (admin/agent)
- `DELETE /campaigns/:id` – Delete campaign (admin)
- `POST /campaigns/:id/save` – Save campaign (JWT, customer)
- `DELETE /campaigns/:id/save` – Unsave campaign (JWT, customer)

### Messages
- `GET /messages/threads/me` – My threads (JWT, customer)
- `GET /messages/threads?customerId=` – List threads (JWT, admin; optional filter)
- `GET /messages/threads/:id/messages` – Thread with messages (JWT)
- `POST /messages/threads` – Create thread (JWT, customer; body: type?, subject?, bookingId?)
- `POST /messages/threads/:id/messages` – Send message (JWT; body: body). Customer or admin can reply.

### Posts (reviews)
- `POST /posts` – Create review (JWT, customer; body: bookingId, title?, body, imageUrls?)
- `GET /posts/me` – My posts (JWT, customer)
- `GET /posts` – List posts (admin)

### Bookings
- `GET /bookings?customerId=&bookingType=` – List bookings (agent/admin; optional customerId and bookingType: hotel, flight, trip_package, other)
- `POST /bookings` – Create booking (admin; body: customerId, totalAmount, currency?, bookingType?, title?, hotelId?, flightId?, campaignId?, externalReference?)
- `POST /bookings/from-catalog` – Create booking from catalog (customer; body: hotelId? | flightId?, **pin**, checkInAt?, checkOutAt?, roomType?). For hotel: roomType applies price delta from hotel.roomTypes; dates stored on booking. Requires 6-digit PIN.
- `POST /bookings/from-campaign` – Create booking from trip campaign (customer; body: campaignId, startDate?, endDate?, addOnIds?, **pin**). Requires 6-digit PIN.
- `GET /bookings/customer/me` – My bookings (customer)
- `GET /bookings/:id` – Get booking
- `POST /bookings/:id/apply-wallet` – Apply wallet amount to booking (body: amount, **pin** for customer). Requires PIN for customers.

### Health
- `GET /health` – Health check

## Database

PostgreSQL. Set `DATABASE_URL`. Tables are created via TypeORM `synchronize` in development. For production, use migrations and set `synchronize: false`.

## Future: standalone agency website

The API is designed so a separate agency website can reuse the same backend: customer auth (`POST /auth/login`, `GET /customers/me`), wallet (`GET /wallet/me`), points (`GET /points/me`), catalog (`GET /hotels`, `GET /flights`), and bookings (`GET /bookings/customer/me`, `POST /bookings/from-catalog`). Use the same JWT and CORS; add the website origin to `CORS_ORIGINS`.

## Seeding first admin/agent

```bash
# Set DATABASE_URL in .env, then:
npm run seed
```

Creates admin user `admin@travel.local` / `admin123` (or `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`), a branch "Main Branch", and an agent linked to that admin so they can use POS redemptions.
