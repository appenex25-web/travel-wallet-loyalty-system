-- Trip campaigns and add-ons
CREATE TABLE IF NOT EXISTS trip_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(255) NOT NULL,
  "shortDescription" varchar(500) NULL,
  description text NULL,
  "imageUrls" jsonb NULL,
  "basePrice" decimal(14,2) NOT NULL DEFAULT 0,
  currency varchar(10) NOT NULL DEFAULT 'USD',
  status varchar(50) NOT NULL DEFAULT 'active',
  "startAt" timestamptz NULL,
  "endAt" timestamptz NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaign_add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaignId" uuid NOT NULL REFERENCES trip_campaigns(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  "priceDelta" decimal(14,2) NOT NULL DEFAULT 0,
  currency varchar(10) NOT NULL DEFAULT 'USD'
);

-- Add campaignId to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "campaignId" uuid REFERENCES trip_campaigns(id);
