# HTTPS for appenex.org (Namecheap + Let's Encrypt)

Use this after you've registered **www.appenex.org** (or appenex.org) with Namecheap.

---

## Step 1: Point the domain to your VPS (Namecheap)

1. Log in to **Namecheap** → **Domain List** → click **appenex.org** → **Manage**.
2. Go to **Advanced DNS** (or **DNS**).
3. Add or edit **A records**:
   - **Host:** `@`  → **Value:** your VPS IP (e.g. `45.76.31.105`) → **TTL:** Automatic.
   - **Host:** `www` → **Value:** same VPS IP → **TTL:** Automatic.
4. Remove any conflicting **URL Redirect** for `www` if it points elsewhere.
5. Save. DNS can take 5–30 minutes (sometimes up to a few hours).

Check when it’s live: open **https://www.dnschecker.org** and search for `appenex.org` and `www.appenex.org`; both should show your VPS IP.

---

## Step 2: Free port 80 on the VPS for Nginx

Your Docker **web** container is using port 80. We’ll serve the site from **Nginx on the host** instead so we can use Certbot and HTTPS.

**On the VPS** (SSH in):

```bash
cd /opt/travel-wallet-loyalty-system
```

Edit `docker-compose.yml`: in the **web** service, **remove or comment out** the `ports` section so the container no longer binds port 80 on the host:

```yaml
  web:
    image: nginx:alpine
    volumes:
      - ./web-dist:/usr/share/nginx/html:ro
    # ports:
    #   - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

Then:

```bash
docker compose up -d
```

Port 80 on the host is now free.

---

## Step 3: Install Nginx and Certbot on the VPS

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

## Step 4: Add the Nginx config and get the certificate

1. Copy the Nginx config from your project to the server. From your **local machine** (PowerShell), in the project folder:

   ```powershell
   scp scripts/nginx-https-appenex.conf USER@YOUR_VPS_IP:/tmp/appenex.conf
   ```

   Replace `USER` and `YOUR_VPS_IP` (e.g. `root@45.76.31.105`).

2. **On the VPS:**

   ```bash
   sudo mkdir -p /var/www/html
   sudo mv /tmp/appenex.conf /etc/nginx/sites-available/appenex.conf
   sudo ln -s /etc/nginx/sites-available/appenex.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. Get the Let’s Encrypt certificate (use both names so both work over HTTPS):

   ```bash
   sudo certbot --nginx -d appenex.org -d www.appenex.org
   ```

   - Use an email you can access (for renewal notices).
   - Accept the terms.
   - Choose whether to redirect HTTP to HTTPS (recommended: **Yes**).

Certbot will adjust the Nginx config and reload Nginx. After this, **https://appenex.org** and **https://www.appenex.org** should work.

---

## Step 5: Update backend and CORS for the new domain

**On the VPS**, edit the `.env` in the deploy folder:

```bash
cd /opt/travel-wallet-loyalty-system
nano .env
```

Set (or add) so the backend trusts the new HTTPS origins and knows its public URL:

```ini
API_BASE_URL=https://www.appenex.org
CORS_ORIGINS=https://appenex.org,https://www.appenex.org
```

Save, then restart the backend:

```bash
docker compose up -d backend
```

---

## Step 6: Build the web app with the new API URL (GitHub)

The frontend must call your API over HTTPS on the same domain.

1. In GitHub: repo **Settings** → **Secrets and variables** → **Actions**.
2. Add a secret (if you prefer to use the domain for the build):
   - **Name:** `API_URL`
   - **Value:** `https://www.appenex.org`
3. Update the workflow to use it for the web build.

If you don’t add the secret, you can instead **manually build and deploy the web app once** with the correct API URL (see “One-time manual build” below).

**Option A – Add secret and update workflow**

In the repo, in **.github/workflows/deploy.yml**, change the “Build web app” step so it uses the domain when present:

- Use `VITE_API_URL=${{ secrets.API_URL }}` when `API_URL` is set.
- Otherwise keep using `http://${{ secrets.SERVER_IP }}:3000` for backward compatibility.

**Option B – One-time manual build**

On your **local machine**, in the project folder:

```powershell
cd web
$env:VITE_API_URL="https://www.appenex.org"; npm run build
scp -r dist/* USER@YOUR_VPS_IP:/opt/travel-wallet-loyalty-system/web-dist/
```

Replace `USER` and `YOUR_VPS_IP`. Then use **https://www.appenex.org** (or https://appenex.org) as your one link; the helper app and “Local network access” will work with this HTTPS URL.

---

## Step 7: Renewal (automatic)

Certbot installs a timer that renews the certificate. Check with:

```bash
sudo systemctl status certbot.timer
```

No extra cost; the certificate is free.

---

## Checklist

- [ ] Namecheap: A records for `@` and `www` → VPS IP.
- [ ] VPS: Port 80 free (web container no longer binding 80).
- [ ] VPS: Nginx + Certbot installed, site config in place, `certbot --nginx -d appenex.org -d www.appenex.org` run.
- [ ] VPS: `.env` has `API_BASE_URL` and `CORS_ORIGINS` for `https://appenex.org` and `https://www.appenex.org`.
- [ ] Web app built with `VITE_API_URL=https://www.appenex.org` and deployed to `web-dist`.
- [ ] Open **https://www.appenex.org** (or https://appenex.org), then in Chrome allow **Local network access** for that site so the NFC reader works from the one link.
