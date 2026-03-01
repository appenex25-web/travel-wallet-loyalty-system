/**
 * ACR122U NFC reader helper.
 * Run: node server.js
 * Optional: node server.js --with-reader (requires nfc-pcsc; may need native deps on your OS)
 *
 * GET http://localhost:31337/uid  -> returns { uid } (does NOT clear).
 *     So while a card is on the reader we keep returning the same UID = no UI flicker.
 * POST http://localhost:31337/uid/clear -> clear cached UID (call when starting a new scan)
 * POST http://localhost:31337/uid with body { uid: "..." } -> set UID (e.g. from another app)
 */

import express from 'express';

const PORT = Number(process.env.POS_READER_PORT) || 31337;
const app = express();
app.use(express.json());
function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
}
app.use((req, res, next) => {
  corsHeaders(res);
  next();
});
app.options('*', (req, res) => {
  corsHeaders(res);
  res.sendStatus(204);
});

let lastUid = null;

function uidToHex(uid) {
  if (uid == null) return null;
  if (typeof uid === 'string') return uid.trim().replace(/\s+/g, '').toUpperCase();
  if (Buffer.isBuffer(uid)) return uid.toString('hex').toUpperCase();
  if (Array.isArray(uid)) return Buffer.from(uid).toString('hex').toUpperCase();
  return String(uid);
}

/** Clear cached UID. Call when starting a new scan so we don't show a stale card. */
app.post('/uid/clear', (req, res) => {
  lastUid = null;
  res.json({ ok: true });
});

/** Return current UID (if any). Does not clear - so UI gets stable "card on reader" while card is present. */
app.get('/uid', (req, res) => {
  res.json({ uid: lastUid });
});

app.post('/uid', (req, res) => {
  const uid = req.body?.uid;
  lastUid = uid != null ? uidToHex(uid) : null;
  res.json({ uid: lastUid });
});

// Optional: start NFC reader if --with-reader and nfc-pcsc is available
const withReader = process.argv.includes('--with-reader');
if (withReader) {
  try {
    const { default: NFC } = await import('nfc-pcsc');
    const nfc = new NFC();
    nfc.on('reader', (reader) => {
      console.log(`Reader attached: ${reader.name}`);
      reader.on('card', (card) => {
        lastUid = uidToHex(card.uid) || null;
        console.log(`Card: ${lastUid}`);
      });
      reader.on('error', (err) => console.error('Reader error:', err));
    });
    nfc.on('error', (err) => console.error('NFC error:', err));
  } catch (e) {
    console.warn('nfc-pcsc not available or failed:', e.message);
    console.warn('  On Windows: install Visual Studio Build Tools with "Desktop development with C++" and Windows SDK, then run "npm run start:reader" again.');
    console.warn('  Or use the paste workaround: run "node set-uid.js" and paste the UID when your reader app shows it.');
  }
}

app.listen(PORT, () => {
  console.log(`POS reader helper: http://localhost:${PORT}/uid`);
  if (!withReader) console.log('Start with --with-reader to read ACR122U (requires nfc-pcsc).');
});
