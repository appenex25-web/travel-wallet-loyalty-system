# Step-by-step: Get the app running on your server (no tech background needed)

---

## What is this, in simple words?

- **Your app** (Travel Wallet) normally runs on your own computer. To let customers or staff use it from the internet, it has to run on a **server**—a computer that’s always on and connected to the internet.
- **Vultr** is a company that rents you that computer (a “VPS”—a virtual server). You already created one and chose Ubuntu 22.04.
- **What we’re doing:** We will “log in” to that computer over the internet, install a tool called Docker (which runs your app and its database), put your project on it, and start the app. After that, people can use your app at your server’s address (an IP address like `http://123.45.67.89:3000`).
- You don’t need to understand how it works—just follow the steps in order and copy-paste the commands.

---

## Where to get the server IP and password from Vultr

1. **Log in to Vultr**  
   Go to [https://www.vultr.com](https://www.vultr.com) and sign in with your account.

2. **Open your server**  
   - Click **“Products”** or **“Servers”** in the menu (or the main dashboard).  
   - You’ll see a list of your servers. Click the **name** of the server you created (the one with Ubuntu 22.04).

3. **Find the server IP address**  
   - On the server’s page you’ll see details like **Location**, **Plan**, **OS**, etc.  
   - Look for **“IP Address”** or **“IPv4”**—it’s a set of numbers like `123.45.67.89`.  
   - There is usually a **copy** (clipboard) icon next to it. Click that to copy the IP, or select the numbers and copy them.  
   - **You need this IP** for connecting to the server and for your `.env` file later.

4. **Find the password**  
   - On the **same** server page, look for a section like **“Server Details”** or **“Access Details”**.  
   - You’ll see **“Password”** (or “Root password”). There’s often a **copy** icon or a **“Show” / “Reveal”** link so you can see and copy it.  
   - **Copy this password** and keep it somewhere safe (e.g. a Notepad file). You’ll paste it when the terminal asks for a password—you won’t see it as you type, that’s normal.

5. **If you don’t see a password**  
   - Some Vultr setups send the password **by email** when the server is created. Check the email you used for Vultr.  
   - Or on the server page look for **“View Console”** or **“Emergency Console”**—sometimes the password is shown there once.  
   - If you still can’t find it, in Vultr you can **reset the root password**: on the server page, look for **“Settings”** or a **“…”** menu, then **“Reset root password”**. Vultr will set a new one and often show it on the page or email it to you.

**Summary:** From Vultr you need two things: the **IP address** (e.g. `123.45.67.89`) and the **root password**. You’ll use the IP to connect and in your app’s `.env`; you’ll use the password only when the terminal asks for it.

---

## Step 1: Open a terminal and connect to your server

Use the **IP address** and **password** you got from Vultr in the section above.

**On Windows:** Open **PowerShell** or **Command Prompt** (search for “PowerShell” or “cmd” in the Start menu).

**On Mac:** Open **Terminal** (search “Terminal” in Spotlight).

Type this, but **replace `YOUR_SERVER_IP`** with the real IP you copied from Vultr (e.g. if your IP is `123.45.67.89`, you type: `ssh root@123.45.67.89`):

```
ssh root@YOUR_SERVER_IP
```

Press Enter.

- If it asks “Are you sure you want to continue connecting?” type **yes** and press Enter.  
- When it asks for a **password**, paste the password you copied from Vultr (right‑click to paste or Ctrl+V). The screen won’t show the password as you type—that’s normal. Press Enter.

When it works, you’ll see a line like `root@something:~#`. That means you’re now “inside” your server. The next commands you type will run on that server, not on your own computer.

---

## Step 2: Install Docker (the tool that runs the app and database)

Copy and paste these blocks **one at a time** into the terminal, then press Enter. Wait for each to finish before doing the next.

**Block 1 – update the system:**
```bash
apt-get update && apt-get install -y ca-certificates curl
```

**Block 2 – add Docker’s key:**
```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a644 /etc/apt/keyrings/docker.asc
```

**Block 3 – add Docker’s package list:**
```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
```

**Block 4 – install Docker:**
```bash
apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

When that finishes, Docker is installed. To confirm, run:

```bash
docker --version
```

You should see a version number. If you do, go to Step 3.

---

## Step 3: Put your project on the server (clone the repo)

Choose a folder on the server. We’ll use `/opt`. Run:

```bash
cd /opt
```

If your code is on **GitHub**, run (replace with your real repo URL if different):

```bash
git clone https://github.com/YOUR_USERNAME/travel-wallet-loyalty-system.git
cd travel-wallet-loyalty-system
```

- Replace `YOUR_USERNAME` with your GitHub username (or your organization name).
- If the repo is **private**, the server will need a deploy key or token to clone. For a **public** repo, the command above is enough.

If you don’t use GitHub and only have the code on your computer, you can upload it with an FTP/SFTP tool (e.g. FileZilla) into a folder like `/opt/travel-wallet-loyalty-system`, then on the server run:

```bash
cd /opt/travel-wallet-loyalty-system
```

---

## Step 4: Create the `.env` file (passwords and URLs)

The app needs a file named `.env` with your settings. On the server, run:

```bash
cp .env.production.example .env
nano .env
```

This opens an editor. You need to change these lines (use the arrow keys to move, type to edit):

1. **POSTGRES_PASSWORD**  
   Replace `change-me-secure-password` with a strong password you make up (e.g. a long random sentence or random characters). This protects your database.

2. **JWT_SECRET**  
   Replace `your-super-secret-key-change-in-production` with another long random string. You can generate one by running in another terminal (on your PC):  
   `openssl rand -base64 32`  
   Then paste that into JWT_SECRET.

3. **API_BASE_URL**  
   Replace `YOUR_VPS_IP` with the **same server IP** you use to connect (the one from Vultr), e.g.:  
   `API_BASE_URL=http://123.45.67.89:3000`

4. **CORS_ORIGINS**  
   Replace `YOUR_VPS_IP` with the **same server IP** again, e.g.:  
   `CORS_ORIGINS=http://123.45.67.89:3000`

Save and exit: press **Ctrl+O**, Enter, then **Ctrl+X**.

---

## Step 5: First-time database setup (create tables)

The app needs database tables. You do this **once**. Run these in order:

**5a – Build the app and start only the database:**
```bash
docker compose build backend
docker compose up -d db
```

Wait about 10–15 seconds.

**5b – Run the app once in “setup” mode so it creates the tables:**
```bash
docker compose run --rm -e NODE_ENV=development backend node dist/main.js
```

You should see a line like “API listening on …”. As soon as you see it, press **Ctrl+C** to stop. That’s enough for the tables to be created.

**5c – Start everything for real:**
```bash
docker compose up -d
```

The app and database are now running. Your API is at: **http://YOUR_SERVER_IP:3000**  
(Replace YOUR_SERVER_IP with the real IP.)

---

## Step 6: Check that it’s working

In a browser on your computer, open:

```
http://YOUR_SERVER_IP:3000
```

You might see a short message or “Cannot GET /”—that’s normal. The important thing is the page loads and doesn’t say “connection refused” or “unreachable.”

---

## Optional: Automatic deploy with GitHub (CI/CD)

If your code is on GitHub and you want every push to `main` to update the server automatically:

1. **Create an SSH key for the server** (on your PC, in PowerShell or Terminal):
   ```bash
   ssh-keygen -t ed25519 -C "deploy" -f deploy_key -N '""'
   ```
   This creates two files: `deploy_key` (private) and `deploy_key.pub` (public).

2. **Put the public key on the server**  
   On the server (in the SSH session from Step 1), run:
   ```bash
   mkdir -p ~/.ssh
   nano ~/.ssh/authorized_keys
   ```
   Open the file `deploy_key.pub` on your PC (with Notepad or any editor), copy **all** its contents, paste into `authorized_keys` on the server, save (Ctrl+O, Enter, Ctrl+X).

3. **Add GitHub secrets**  
   In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**. Create three secrets:
   - **SSH_PRIVATE_KEY**  
     On your PC, open the file `deploy_key` (the private key, no `.pub`). Copy the **entire** content, including the “BEGIN” and “END” lines, and paste into the secret value.
   - **SERVER_IP**  
     Your Vultr server IP (e.g. `123.45.67.89`).
   - **SERVER_USER**  
     The user you use to SSH. If you used `root@...`, put `root`. If you use `ubuntu@...`, put `ubuntu`.

4. **Make sure the server can pull from GitHub**  
   If the repo is private, the server needs access. Either:
   - Clone over HTTPS with a **Personal Access Token** (GitHub → Settings → Developer settings → Personal access tokens), or  
   - Add the contents of `deploy_key.pub` as a **Deploy key** in the repo (Settings → Deploy keys), and clone with SSH.

After that, every time you push to the `main` branch, GitHub Actions will SSH into your server, pull the latest code, rebuild the app, and restart it. You don’t have to run the commands from Step 5 again—only the first time.

---

## Quick reference

| What you want to do | Command (run on the server in the project folder) |
|---------------------|---------------------------------------------------|
| Start the app       | `docker compose up -d`                            |
| Stop the app        | `docker compose down`                             |
| See app logs        | `docker compose logs -f backend`                  |
| Restart after changing `.env` | `docker compose up -d --force-recreate backend` |

If you get stuck, note the **exact** message you see (or a screenshot) and the step number, and someone can help you from there.
