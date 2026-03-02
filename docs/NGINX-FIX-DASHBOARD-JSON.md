# Fix dashboard: "Unexpected token '<', \"<!doctype \"... is not valid JSON"

The dashboard calls the API at `/admin/dashboard/summary`, `/admin/customers`, `/admin/offers`, etc. Those requests were getting the SPA’s **index.html** (which starts with `<!doctype`) instead of JSON from the backend, so the app threw the error above.

**Fix:** In the **HTTPS (443)** server block, proxy the **admin API** paths to the backend. Add the blocks below **before** the line that says `location ^~ /admin/ { try_files ... }`.

---

## On the server

1. Open the config:
   ```bash
   nano /etc/nginx/sites-available/appenex.conf
   ```

2. In the **443** server block, find this line:
   ```nginx
   location ^~ /admin/ { try_files $uri $uri/ /index.html; }
   ```

3. **Above** that line, insert the following five `location` blocks (same 4-space indent as the other `location` lines):

```nginx
    location ^~ /admin/dashboard/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location ^~ /admin/customers {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location ^~ /admin/offers {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location ^~ /admin/campaigns {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location ^~ /admin/branches {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```

4. Leave the existing line in place:
   ```nginx
   location ^~ /admin/ { try_files $uri $uri/ /index.html; }
   ```

5. Save (Ctrl+O, Enter), exit (Ctrl+X), then run:
   ```bash
   nginx -t && systemctl reload nginx
   ```

After this, `/admin/dashboard/*`, `/admin/customers`, `/admin/offers`, `/admin/campaigns`, and `/admin/branches` go to the backend (JSON), and other `/admin/*` URLs (e.g. `/admin/reservations`) still serve the SPA.
