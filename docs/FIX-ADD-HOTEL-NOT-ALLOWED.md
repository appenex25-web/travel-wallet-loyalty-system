# Fix “not allowed” when adding a hotel (one-time setup)

This is a **one-time** setup so the website can talk to the API when you add hotels.

---

## What was done for you (no action needed)

- The code was updated so the server allows requests from your live site (www.appenex.org).
- The deploy pipeline was updated: **if you have `API_URL` set in GitHub (Settings → Secrets), the next deploy will set `API_BASE_URL` on the server for you and restart the backend.** So in that case you don’t need to do anything—just wait for the next deploy to finish and try adding a hotel again.

---

## If you don’t use GitHub deploy (or API_URL isn’t set): what you need to do (only once)

You only need to **add one line** to a file on the server and **restart the app**.

### Step 1: Log in to your server

1. Open **PowerShell** (Windows key, type “PowerShell”, press Enter).
2. Type: `ssh root@45.76.31.105` and press Enter.
3. If it asks “Are you sure…?”, type **yes** and press Enter.
4. When it asks for the password, **paste** your Vultr server password (you won’t see it as you paste). Press Enter.
5. When you see something like `root@vultr:~#`, you are in.

---

### Step 2: Go to the app folder

Type this and press Enter:

```bash
cd /opt/travel-wallet-loyalty-system
```

---

### Step 3: Open the .env file to edit it

Type this and press Enter:

```bash
nano .env
```

You’ll see a list of lines (passwords, URLs, etc.). Don’t change anything else.

---

### Step 4: Add the website address

1. Use the **arrow keys** to move to a blank line (or to the end of the file).
2. Type this **exactly** on its own line:

   ```
   API_BASE_URL=https://www.appenex.org
   ```

3. If you already see a line that says `API_BASE_URL=...`, change it so it says exactly:

   ```
   API_BASE_URL=https://www.appenex.org
   ```

---

### Step 5: Save and exit

1. Press **Ctrl+O** (that’s the letter O) to save.
2. Press **Enter** to confirm.
3. Press **Ctrl+X** to exit.

---

### Step 6: Restart the backend so it uses the new setting

Type this and press Enter:

```bash
docker compose up -d backend
```

Wait a few seconds. When the line with `root@...` comes back, it’s done.

---

### Step 7: Log out (optional)

Type `exit` and press Enter to close the connection.

---

## After this

Try **adding a hotel** again on your site (with or without pictures). The “not allowed” error should be gone. If it isn’t, say what you see and we can fix it.
