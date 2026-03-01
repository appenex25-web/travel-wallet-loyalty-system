#!/bin/bash
# Paste this entire script into your SSH session (you're already root on the server).
# It will: free port 80, install nginx/certbot, add site config, get SSL, update .env, restart backend.
set -e
DEPLOY_PATH="/opt/travel-wallet-loyalty-system"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@appenex.org}"

echo "=== 1. Restart Docker (use updated compose so port 80 is free) ==="
cd "$DEPLOY_PATH"
docker compose up -d
echo "Done."

echo "=== 2. Install Nginx and Certbot ==="
apt-get update -qq
apt-get install -y -qq nginx certbot python3-certbot-nginx
echo "Done."

echo "=== 3. Write Nginx site config ==="
mkdir -p /var/www/html
cat > /etc/nginx/sites-available/appenex.conf << 'NGINX_EOF'
server {
    listen 80;
    listen [::]:80;
    server_name appenex.org www.appenex.org;
    root /opt/travel-wallet-loyalty-system/web-dist;
    index index.html;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    location = /pos { try_files /index.html =404; }
    location = /admin { try_files /index.html =404; }
    location = /login { try_files /index.html =404; }
    location ^~ /admin/ { try_files $uri $uri/ /index.html; }

    location ~ ^/(auth|users|customers|uploads|messages|bookings|campaigns|posts|catalog|qr|points|wallet) {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/appenex.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
echo "Done."

echo "=== 3b. Open ports 80 and 443 in firewall (so Let'\''s Encrypt can reach this server) ==="
if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable 2>/dev/null || true
  echo "UFW: allowed 80, 443."
else
  echo "No ufw; if you use another firewall, allow 80 and 443."
fi
echo "Done."

echo "=== 4. Get SSL certificate (Let'\''s Encrypt) ==="
certbot --nginx -d appenex.org -d www.appenex.org --non-interactive --agree-tos --email "$CERTBOT_EMAIL" --redirect
echo "Done."

echo "=== 5. Update .env and restart backend ==="
cd "$DEPLOY_PATH"
grep -q '^API_BASE_URL=' .env && sed -i 's|^API_BASE_URL=.*|API_BASE_URL=https://www.appenex.org|' .env || echo "API_BASE_URL=https://www.appenex.org" >> .env
grep -q '^CORS_ORIGINS=' .env && sed -i 's|^CORS_ORIGINS=.*|CORS_ORIGINS=https://appenex.org,https://www.appenex.org|' .env || echo "CORS_ORIGINS=https://appenex.org,https://www.appenex.org" >> .env
docker compose up -d backend
echo "Done."

echo ""
echo "=== HTTPS setup complete. Open https://www.appenex.org in your browser. ==="
