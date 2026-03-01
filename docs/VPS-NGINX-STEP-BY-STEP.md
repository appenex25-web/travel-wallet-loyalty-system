# Step-by-step: Fix SPA reload (Option A) on the VPS

Do this on the server to fix the “Cannot GET /pos” when you reload.

---

## Step 1: Log in to the VPS

On your PC, open PowerShell (or Terminal) and run:

```
ssh root@45.76.31.105
```

Enter your password when asked.

---

## Step 2: Open the Nginx config

Run:

```
nano /etc/nginx/sites-available/appenex.conf
```

You should see the file in the nano editor.

---

## Step 3: Find the right place

You need to add three lines **inside the first `server { }` block** — the one that has:

- `listen 443 ssl;`
- `root /opt/travel-wallet-loyalty-system/web-dist;`

**Where to add the lines:**  
Right after the block that looks like:

```
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }
```

And **before** the line that looks like:

```
    location ~ ^/(auth|users|customers|pos|admin|...
```

Use the **arrow keys** to move the cursor to the **empty line** between those two (after the closing `}` of `/.well-known/` and before `location ~`).

---

## Step 4: Add the three lines

Type these three lines (same indentation as the other `location` lines, e.g. 4 spaces):

```
    location = /pos { try_files /index.html =404; }
    location = /admin { try_files /index.html =404; }
    location = /login { try_files /index.html =404; }
```

So that section looks like:

```
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    location = /pos { try_files /index.html =404; }
    location = /admin { try_files /index.html =404; }
    location = /login { try_files /index.html =404; }

    location ~ ^/(auth|users|customers|pos|admin|...
```

---

## Step 5: Save and exit nano

1. Press **Ctrl+O** (to save).
2. Press **Enter** (confirm the filename).
3. Press **Ctrl+X** (to exit).

---

## Step 6: Test and reload Nginx

Run:

```
nginx -t && systemctl reload nginx
```

- If you see `syntax is ok` and `test is successful`, the reload has run and the fix is active.
- If you see an error, Nginx did not reload. Re-open the file with `nano /etc/nginx/sites-available/appenex.conf` and check that the three new lines are **inside** the first `server { }` block (the one with `listen 443 ssl`), not after the last `}` of the file.

---

## Step 7: Check in the browser

Open:

- https://www.appenex.org/pos  
- Press **F5** or **Ctrl+R** to reload.

You should see the POS page, not a “Cannot GET /pos” JSON error.

---

## If the three lines were already in the wrong place

If you had added them **after** the last `server { }` block (outside any server block):

1. Open the file again: `nano /etc/nginx/sites-available/appenex.conf`
2. **Delete** those three `location = /pos`, `location = /admin`, `location = /login` lines from the bottom.
3. **Add** them in the right place (inside the first server block, as in Step 4).
4. Save (Ctrl+O, Enter) and exit (Ctrl+X).
5. Run again: `nginx -t && systemctl reload nginx`.

---

## Fix "Cannot GET /admin/reservations" on refresh

If reloading **https://www.appenex.org/admin/reservations** gives a 404 JSON error:

1. Open the config: `nano /etc/nginx/sites-available/appenex.conf`
2. **Remove `admin`** from the API proxy line so it does **not** send `/admin/*` to the backend.  
   Change:
   ```text
   location ~ ^/(auth|users|customers|pos|admin|uploads|...
   ```
   to:
   ```text
   location ~ ^/(auth|users|customers|pos|uploads|...
   ```
   (delete the `|admin` part; keep the rest.)
3. **Add** this line after the `location = /login ...` line (same 4-space indent):
   ```text
   location ^~ /admin/ { try_files $uri $uri/ /index.html; }
   ```
4. Save (Ctrl+O, Enter), exit (Ctrl+X), then run: `nginx -t && systemctl reload nginx`.
