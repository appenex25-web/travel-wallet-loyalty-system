/**
 * Paste UID workaround when nfc-pcsc is not available (e.g. on Windows without build tools).
 * Run: node set-uid.js
 * Then paste the card UID (from your reader app or device) when prompted.
 * The POS page will pick it up on the next poll.
 */
import readline from 'readline';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const PORT = Number(process.env.POS_READER_PORT) || 31337;
const READER_URL = `http://localhost:${PORT}`;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask() {
  rl.question('Paste card UID (hex, then Enter): ', async (line) => {
    const uid = (line || '').trim().replace(/\s+/g, '').toLowerCase();
    if (!uid) {
      ask();
      return;
    }
    try {
      const res = await fetch(`${READER_URL}/uid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      if (res.ok) console.log('UID sent. POS should detect it.');
      else console.log('Server error:', res.status);
    } catch (e) {
      console.error('Is the reader helper running? Start it with: npm start');
    }
    ask();
  });
}

console.log('Reader helper URL:', READER_URL);
console.log('Paste the UID from your card reader app, then press Enter.');
ask();
