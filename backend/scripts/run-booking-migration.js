/**
 * Run booking payment columns migration.
 * Usage: from backend folder: node scripts/run-booking-migration.js
 * Or: DATABASE_URL=postgresql://... node backend/scripts/run-booking-migration.js
 * Loads .env from backend folder if DATABASE_URL is not set.
 */
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

function loadEnv() {
  let envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/);
    if (m) {
      const val = m[1].trim().replace(/^["']|["']$/g, '');
      if (val && !process.env.DATABASE_URL) process.env.DATABASE_URL = val;
      break;
    }
  }
}

const SQLS = [
  'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "paymentMethod" varchar(32) NULL',
  'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "payByAt" timestamptz NULL',
  'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "numberOfPeople" int NULL',
  'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "paidInOffice" boolean NOT NULL DEFAULT false',
];

async function main() {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set. Set it in backend/.env or in the environment.');
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    for (const sql of SQLS) {
      await client.query(sql);
      console.log('OK:', sql.slice(0, 60) + '...');
    }
    console.log('Migration done.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
