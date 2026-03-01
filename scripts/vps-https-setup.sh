#!/bin/bash
# Run on VPS as root to set up HTTPS for appenex.org
set -e
DEPLOY_PATH="${DEPLOY_PATH:-/opt/travel-wallet-loyalty-system}"

echo "=== 1. Free port 80 (web container should not bind 80; use updated docker-compose from repo) ==="
cd "$DEPLOY_PATH"
docker compose up -d
echo "Docker running."

echo "=== 2. Install Nginx and Certbot ==="
apt-get update -qq
apt-get install -y -qq nginx certbot python3-certbot-nginx

echo "=== 3. Install Nginx site config ==="
mkdir -p /var/www/html
if [ -f /tmp/appenex.conf ]; then
  mv /tmp/appenex.conf /etc/nginx/sites-available/appenex.conf
else
  echo "Warning: /tmp/appenex.conf not found. Copy it first with scp."
  exit 1
fi
ln -sf /etc/nginx/sites-available/appenex.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
echo "Nginx reloaded."

echo "=== 4. Get SSL certificate ==="
echo "Run this yourself if non-interactive fails: sudo certbot --nginx -d appenex.org -d www.appenex.org"
certbot --nginx -d appenex.org -d www.appenex.org --non-interactive --agree-tos --redirect --email admin@appenex.org || true

echo "=== 5. Update .env for API_BASE_URL and CORS ==="
cd "$DEPLOY_PATH"
if [ -f .env ]; then
  grep -q '^API_BASE_URL=' .env && sed -i 's|^API_BASE_URL=.*|API_BASE_URL=https://www.appenex.org|' .env || echo "API_BASE_URL=https://www.appenex.org" >> .env
  grep -q '^CORS_ORIGINS=' .env && sed -i 's|^CORS_ORIGINS=.*|CORS_ORIGINS=https://appenex.org,https://www.appenex.org|' .env || echo "CORS_ORIGINS=https://appenex.org,https://www.appenex.org" >> .env
  docker compose up -d backend
  echo "Backend restarted with new CORS."
else
  echo "No .env at $DEPLOY_PATH - add API_BASE_URL and CORS_ORIGINS manually."
fi

echo "=== Done. Test https://www.appenex.org ==="
