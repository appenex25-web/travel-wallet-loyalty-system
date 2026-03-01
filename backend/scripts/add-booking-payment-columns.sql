-- Run this if your bookings table was created before paymentMethod/payByAt/numberOfPeople/paidInOffice were added.
-- Example: psql $DATABASE_URL -f scripts/add-booking-payment-columns.sql

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "paymentMethod" varchar(32) NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "payByAt" timestamptz NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "numberOfPeople" int NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "paidInOffice" boolean NOT NULL DEFAULT false;
