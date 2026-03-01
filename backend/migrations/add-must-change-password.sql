-- Add mustChangePassword for first-login password change flow
ALTER TABLE users ADD COLUMN IF NOT EXISTS "mustChangePassword" boolean DEFAULT false;
