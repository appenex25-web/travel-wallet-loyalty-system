# Portable setup: one link + helper app

What you need for a **direct, portable** setup:

1. **One link** – Your live site (e.g. `https://yourdomain.com` or `https://YOUR_SERVER_IP`).
2. **Helper app** – Travel Wallet NFC Reader installed and running on the same PC (system tray).

Open the link, log in, go to the customer’s **Attach NFC card** (or POS **Listen to reader**), and use **Scan card**. No second URL, no local admin server.

## Why HTTPS is required

Browsers block a **page on an HTTP site** from talking to **localhost** (the reader). So with **HTTP** only, “Reader helper not reachable” will stay.

With **HTTPS**, Chrome (and others) let you allow that **one site** to access local network (localhost) once:

1. Open your site over **HTTPS** (e.g. `https://yourdomain.com`).
2. Chrome → lock icon (or site info) → **Site settings**.
3. Set **Local network access** to **Allow** for this site.

After that, the **same link** works with the helper: open the link, run the helper on that PC, use Scan card. One link, one app, direct.

## Summary

| You have              | Result                                      |
|-----------------------|---------------------------------------------|
| HTTP site + helper    | Reader not reachable from the live link     |
| **HTTPS** site + helper + allow Local network access | One link works; Scan card reaches the reader |

To get HTTPS: put your app behind a domain and use Let’s Encrypt (or your host’s SSL) on the server. Then use that HTTPS URL as your one link everywhere.
