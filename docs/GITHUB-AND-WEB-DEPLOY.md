# GitHub linking (CI/CD) and web app deployment

## 1. What “linking with GitHub” means

Right now your code runs on the server at **45.76.31.105**. When you change the code (e.g. fix a bug or add a feature), you have to **manually** copy the new code to the server and restart the app.

**Linking with GitHub** means: every time you **push** your code to the `main` branch on GitHub, a robot (GitHub Actions) will:

1. Build the web app (with the API URL pointing to your server).
2. Copy the built web app to the server.
3. SSH into the server, pull the latest code, rebuild the backend, and restart everything.

So after you push to `main`, the live site updates by itself. You don’t have to log in to the server or run commands yourself.

---

## 2. What you need to do once to enable it

### Step 1: Put your project on GitHub

- Create a repo on [github.com](https://github.com) (e.g. `travel-wallet-loyalty-system`).
- Push your local project to that repo (if you haven’t already).

### Step 2: Add three “secrets” to the repo

GitHub needs to log in to your server without you typing a password. You give it a **key** and the server address once; after that it can deploy automatically.

1. Open your repo on GitHub.
2. Go to **Settings** → **Secrets and variables** → **Actions**.
3. Click **New repository secret** and add these three:

| Secret name       | Value |
|-------------------|--------|
| `SSH_PRIVATE_KEY` | Open the file `C:\Users\Administrator\.ssh\deploy_vultr` on your PC (the one we used to deploy). Copy **the entire contents** (including the lines that say `-----BEGIN...` and `-----END...`) and paste as the secret value. |
| `SERVER_IP`        | `45.76.31.105` |
| `SERVER_USER`      | `root` |

4. (Optional) If your project lives in a different folder on the server, add:

| Secret name    | Value |
|----------------|--------|
| `DEPLOY_PATH`  | e.g. `/opt/travel-wallet-loyalty-system` |

### Step 3: Make sure the server can pull from GitHub

The workflow runs **on GitHub’s machines**, but the **backend** deploy step does `git pull` **on your server**. So the server must be able to pull from GitHub.

- If the repo is **public**: no extra setup; `git pull origin main` will work.
- If the repo is **private**: on the server, either:
  - Use HTTPS with a **Personal Access Token** when you first clone (or change the remote URL to include the token), or
  - Add the **public** key (`deploy_vultr.pub`) as a **Deploy key** in the repo (Settings → Deploy keys), and use an SSH remote URL for the repo on the server.

After that, every **push to `main`** will run the “Deploy to VPS” workflow and update both the web app and the backend on **45.76.31.105**.

You can also run it by hand: **Actions** → **Deploy to VPS** → **Run workflow**.

---

## 3. How the web app is deployed

- The **API** (backend) runs in Docker on the server at **http://45.76.31.105:3000**.
- The **web app** (the React admin/customer UI) is built and then served by **Nginx** on the same server on **port 80**.

So:

- **http://45.76.31.105** → web app (login, admin, etc.).
- **http://45.76.31.105:3000** → API (used by the web app and the mobile app).

When the GitHub workflow runs, it:

1. Builds the web app with `VITE_API_URL=http://45.76.31.105:3000`.
2. Copies the built files into the server folder `web-dist`.
3. Runs `docker compose up -d`, which starts (or restarts) Nginx serving `web-dist` and the backend.

So after the first time you’ve set up the server (and optionally GitHub as above), **deploying the web app** is the same as **pushing to `main`**: the workflow builds and deploys both backend and web app.

---

## 4. First-time: start the web container on the server

The server already has the **backend** and **db** running. To also serve the web app from the same server we added an **nginx** service. You need to:

1. **Build the web app once** with the API URL and put it in `web-dist` on the server, then start nginx.

Either run this **locally** (from your project folder) and then copy to the server:

```bash
cd web
npm ci
echo "VITE_API_URL=http://45.76.31.105:3000" > .env.production
npm run build
```

Then copy the contents of `web/dist` to the server at `/opt/travel-wallet-loyalty-system/web-dist/` (e.g. with FileZilla, or `scp -r web/dist/* root@45.76.31.105:/opt/travel-wallet-loyalty-system/web-dist/`).

Or: **push to `main`** after adding the GitHub secrets; the workflow will build the web app and deploy it to `web-dist` and then `docker compose up -d` will start nginx.

2. **Start (or restart) the stack** on the server so the web container runs:

```bash
cd /opt/travel-wallet-loyalty-system
docker compose up -d
```

After that, open **http://45.76.31.105** in the browser to use the web app.

---

## 5. Summary

| Topic | What it is |
|-------|------------|
| **GitHub linking** | You add repo secrets (SSH key, server IP, user). Each push to `main` runs the “Deploy to VPS” workflow and updates the server. |
| **Web app deployment** | The workflow builds the web app with `VITE_API_URL=http://45.76.31.105:3000`, copies it to `web-dist` on the server, and Nginx serves it at **http://45.76.31.105** (port 80). |

Once GitHub is linked, **pushing to `main`** deploys both the backend and the web app.
