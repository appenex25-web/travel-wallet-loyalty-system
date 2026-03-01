CREATE TABLE IF NOT EXISTS message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL DEFAULT 'support',
  subject varchar(500) NULL,
  "bookingId" uuid NULL REFERENCES bookings(id) ON DELETE SET NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "threadId" uuid NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender varchar(50) NOT NULL,
  body text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
