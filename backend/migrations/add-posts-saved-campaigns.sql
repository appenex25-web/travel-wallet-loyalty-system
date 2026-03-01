CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  "bookingId" uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  title varchar(500) NULL,
  body text NOT NULL,
  "imageUrls" jsonb NULL,
  status varchar(50) NOT NULL DEFAULT 'pending',
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_saved_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  "campaignId" uuid NOT NULL REFERENCES trip_campaigns(id) ON DELETE CASCADE,
  CONSTRAINT uq_customer_campaign UNIQUE("customerId", "campaignId")
);
