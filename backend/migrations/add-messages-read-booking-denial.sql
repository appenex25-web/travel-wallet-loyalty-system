ALTER TABLE message_threads ADD COLUMN IF NOT EXISTS "readBySupportAt" timestamptz NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "denialReason" varchar(500) NULL;
-- Optional: backfill existing customer-created bookings as pending_confirmation (leave existing as-is)
-- UPDATE bookings SET status = 'pending_confirmation' WHERE status = 'quote' AND "campaignId" IS NOT NULL;
