# Fix the HTTPS (443) server block so /admin/reservations works

The **second** server block (the one with `listen 443 ssl` and Certbot SSL lines) is missing `root`, `server_name`, and all the `location` blocks. So https://appenex.org requests have nowhere to get the app from and you get 404.

Add the following **inside** that 443 server block (after the SSL lines like `ssl_dhparam ...;` and **before** the closing `}` of that server).

---

## Step 1: Open the config

```bash
nano /etc/nginx/sites-available/appenex.conf
```

---

## Step 2: Find the 443 server block

Scroll to the block that has:

- `listen 443 ssl;`
- `ssl_certificate ...`
- `ssl_certificate_key ...`
- `include ... options-ssl-nginx.conf`
- `ssl_dhparam ...`

Right **after** the `ssl_dhparam` line (and before any `if ($host = ...)` or the closing `}`), add the lines below. If there is already a `location /` in that block, you can replace the whole block content (keep the `listen 443` and SSL lines, add the rest).

---

## Step 3: Add these lines inside the 443 server block

Add **server_name** and **root** first (if not already there), then the **location** blocks:

```nginx
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
```

Use the **same indentation** (4 spaces) as the other lines in that server block. Do **not** put `admin` in the proxy line; do **not** remove the `location ^~ /admin/` line.

---

## Step 4: Save and reload

1. Ctrl+O, Enter, Ctrl+X.
2. Run: `nginx -t && systemctl reload nginx`

Then open https://www.appenex.org/admin/reservations again; it should load instead of 404.
