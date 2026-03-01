# Run these on the VPS (SSH as root)

SSH in first: `ssh root@45.76.31.105`

Then run each block in order. If you haven’t copied the nginx config yet, from your **PC** (in the project folder) run first:

```powershell
scp scripts/nginx-https-appenex.conf root@45.76.31.105:/tmp/appenex.conf
```

---

## On the VPS

**1. Go to app folder and restart Docker (so port 80 is free; use updated docker-compose from repo or already updated)**

```bash
cd /opt/travel-wallet-loyalty-system
docker compose up -d
```

**2. Install Nginx and Certbot**

```bash
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx
```

**3. Enable the Nginx site**

```bash
mkdir -p /var/www/html
mv /tmp/appenex.conf /etc/nginx/sites-available/appenex.conf
ln -sf /etc/nginx/sites-available/appenex.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

**4. Get the SSL certificate**

```bash
certbot --nginx -d appenex.org -d www.appenex.org
```

Use an email you can access, agree to terms, and choose **Yes** to redirect HTTP to HTTPS.

**5. Set backend .env and restart backend**

```bash
cd /opt/travel-wallet-loyalty-system
grep -q '^API_BASE_URL=' .env && sed -i 's|^API_BASE_URL=.*|API_BASE_URL=https://www.appenex.org|' .env || echo "API_BASE_URL=https://www.appenex.org" >> .env
grep -q '^CORS_ORIGINS=' .env && sed -i 's|^CORS_ORIGINS=.*|CORS_ORIGINS=https://appenex.org,https://www.appenex.org|' .env || echo "CORS_ORIGINS=https://appenex.org,https://www.appenex.org" >> .env
docker compose up -d backend
```

**6. Test**

Open **https://www.appenex.org** in your browser.

---

To get the updated `docker-compose.yml` (with port 80 commented out) on the server, either push from your repo and let CI/CD deploy, or copy the file to the server and run `docker compose up -d` again.
