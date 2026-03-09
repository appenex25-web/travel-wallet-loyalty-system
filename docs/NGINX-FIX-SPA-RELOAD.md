# Fix: SPA reload (location blocks must be inside server)

The three lines for `/pos`, `/admin`, `/login` must be **inside** the **HTTPS server block** (the one with `listen 443 ssl` and `root /opt/...`), not after it.

## Correct structure on the VPS

Your `appenex.conf` should look like this (only the relevant part is shown):

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name appenex.org www.appenex.org;
    root /opt/travel-wallet-loyalty-system/web-dist;
    index index.html;

    # SSL lines (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/appenex.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/appenex.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    # SPA routes – reload /pos, /admin, /login serves index.html
    location = /pos { try_files /index.html =404; }
    location = /admin { try_files /index.html =404; }
    location = /login { try_files /index.html =404; }

    # API proxy
    location ~ ^/(auth|users|customers|pos|admin|uploads|messages|bookings|campaigns|posts|catalog|qr|points|wallet|health) {
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

server {
    listen 80;
    listen [::]:80;
    server_name appenex.org www.appenex.org;
    if ($host = www.appenex.org) { return 301 https://$host$request_uri; }
    if ($host = appenex.org) { return 301 https://$host$request_uri; }
    return 404;
}
```

## What to do

1. **Remove** the three `location = /pos`, `location = /admin`, `location = /login` lines from where they are now (outside any `server` block).
2. **Add** those same three lines **inside** the first `server { }` block (the HTTPS one), right after `location /.well-known/...` and **before** the `location ~ ^/(auth|users|...` block.
3. Save, then run: `nginx -t && systemctl reload nginx`

If the file was heavily changed, you can replace the whole HTTPS server block with the one above (keep the Certbot comments if you prefer), then run `nginx -t && systemctl reload nginx`.
