-- Hotels and Flights catalog + booking links.
-- Run this if using synchronize: false in production.

CREATE TABLE IF NOT EXISTS hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  description text,
  location varchar,
  "imageUrl" varchar,
  "pricePerNight" decimal(14,2),
  currency varchar DEFAULT 'USD',
  "createdAt" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin varchar NOT NULL,
  destination varchar NOT NULL,
  "flightNumber" varchar,
  "departureAt" timestamptz,
  price decimal(14,2) NOT NULL,
  currency varchar DEFAULT 'USD',
  "createdAt" timestamptz DEFAULT now()
);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS "hotelId" uuid REFERENCES hotels(id),
  ADD COLUMN IF NOT EXISTS "flightId" uuid REFERENCES flights(id);
