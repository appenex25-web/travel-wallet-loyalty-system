-- Add travel booking type and title to bookings (flights, hotels, trip packages).
-- Run this if using synchronize: false in production.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS "bookingType" varchar DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS "title" varchar(500) NULL;

COMMENT ON COLUMN bookings."bookingType" IS 'flight | hotel | trip_package | other';
COMMENT ON COLUMN bookings."title" IS 'Display e.g. Nairobi–Dubai return, Victoria Falls 3-day package';
