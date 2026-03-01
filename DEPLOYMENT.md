# Docker deployment (Ubuntu 22.04 / Vultr VPS)

Deploy the Travel Wallet backend and PostgreSQL with Docker Compose. The web app can be built and served from the same server (see "Serving the web app" below) or hosted elsewhere (e.g. Vercel).

## 1. Server requirements

- Ubuntu 22.04 LTS (or similar)
- Docker and Docker Compose installed
- Your repo cloned (or code copied) to the server

## 2. Install Docker and Docker Compose (Ubuntu 22.04)

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a644 /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
# Log out and back in (or new SSH session) so docker runs without sudo
```

## 3. Clone repo and set environment

```bash
cd /opt   # or your preferred path
sudo git clone https://github.com/YOUR_ORG/travel-wallet-loyalty-system.git
cd travel-wallet-loyalty-system
```

Copy the production env example and edit with your values:

```bash
cp .env.production.example .env
nano .env   # or vim
```

Set at least:

- `POSTGRES_PASSWORD` – strong password for the database
- `JWT_SECRET` – long random string (e.g. `openssl rand -base64 32`)
- `API_BASE_URL` – public URL of your API (e.g. `http://YOUR_VPS_IP:3000` or `https://api.yourdomain.com`)
- `CORS_ORIGINS` – comma-separated origins that may call the API (e.g. your web app URL, same as API_BASE_URL if served from same host)

## 4. First-time database schema

The app runs with `synchronize: false` in production, so tables must exist before the first run. Two options:

**Option A – One-time sync (simplest)**  
Build the backend, start the database, then run the backend once in development mode so TypeORM creates the tables:

```bash
docker compose build backend
docker compose up -d db
# Wait ~10 seconds for Postgres to be ready, then:
docker compose run --rm -e NODE_ENV=development backend node dist/main.js
# Wait until you see "API listening on ...". Press Ctrl+C to stop.
docker compose up -d
```

**Option B – TypeORM migrations**  
If you add migrations later, run them before starting:

```bash
docker compose run --rm backend npm run migration:run
docker compose up -d
```

## 5. Start the stack

```bash
docker compose up -d
```

Check logs:

```bash
docker compose logs -f backend
```

API is available at `http://YOUR_VPS_IP:3000` (or your domain if you’ve pointed DNS and set up SSL).

## 6. Serving the web app (optional, same server)

Build the web app on your machine or on the server, then serve it with Nginx or from the backend.

**Build locally and copy:**

```bash
# On your dev machine
cd web
npm ci
npm run build
# Copy the contents of web/dist to the server, e.g. /var/www/travel-wallet on the VPS
```

On the server, install Nginx and point a vhost at that directory, and proxy `/api` (or your API path) to `http://localhost:3000`. Alternatively add an Nginx service to `docker-compose.yml` that serves the static files and proxies to the backend.

## 7. SSL and your own domain

1. Point your domain’s A record to the VPS IP (e.g. `api.yourdomain.com` → VPS IP).
2. On the server, install Nginx (or Caddy) and use Let’s Encrypt:
   - **Caddy:** Automatically obtains and renews certificates.
   - **Nginx + Certbot:** `sudo apt install certbot python3-certbot-nginx` then `sudo certbot --nginx -d api.yourdomain.com`.
3. Set `API_BASE_URL` and `CORS_ORIGINS` in `.env` to your HTTPS URL(s), then restart: `docker compose up -d --force-recreate backend`.

## 8. Mobile app

Set `EXPO_PUBLIC_API_URL` (or your app’s env) to your production API URL (e.g. `https://api.yourdomain.com`). Build the app with EAS or `expo build`. No changes to the Docker stack.

## 9. Data and backups

- **PostgreSQL data:** Stored in the `pgdata` Docker volume. Locate with `docker volume inspect travel-wallet-loyalty-system_pgdata` (name may vary by project directory).
- **Uploads (campaign/hotel images):** Stored in the `uploads_data` volume (mounted at `/app/uploads` in the backend container).
- **Backup:** Periodically dump the DB and copy the uploads volume (or run `pg_dump` and backup the volume mount path).

Example DB dump:

```bash
docker compose exec db pg_dump -U travelwallet travel_wallet > backup_$(date +%Y%m%d).sql
```

## 10. Useful commands

| Command | Description |
|--------|-------------|
| `docker compose up -d` | Start all services |
| `docker compose down` | Stop and remove containers (volumes keep data) |
| `docker compose logs -f backend` | Follow backend logs |
| `docker compose restart backend` | Restart API after .env change |
| `docker compose build --no-cache backend` | Rebuild backend image |

---

## 11. CI/CD (GitHub Actions)

Once the server is set up (clone repo, `.env`, Docker, and first-time schema as above), you can deploy automatically on every push to `main`.

### Trigger

- **Push to `main`:** The workflow runs after you push (or merge a PR) to the `main` branch.
- **Manual run:** In the repo go to **Actions → Deploy to VPS → Run workflow** to deploy without pushing.

### What the workflow does

It SSHs into your VPS and runs:

1. `cd` to the deploy path (default `/opt/travel-wallet-loyalty-system`, or set secret `DEPLOY_PATH`)
2. `git pull origin main`
3. `docker compose build backend`
4. `docker compose up -d`

Existing Docker volumes keep your database and uploads; only the app code and backend image are updated.

### GitHub secrets (one-time setup)

In the repo: **Settings → Secrets and variables → Actions** → **New repository secret**. Add:

| Secret | Description |
|--------|-------------|
| `SSH_PRIVATE_KEY` | Full contents of the private key used to SSH into the VPS. The matching public key must be in `~/.ssh/authorized_keys` on the server. |
| `SERVER_IP` | Your Vultr VPS public IP address. |
| `SERVER_USER` | SSH user on the server (e.g. `root` or `ubuntu`). |
| `DEPLOY_PATH` | (Optional) Path to the repo on the server. Default is `/opt/travel-wallet-loyalty-system`. |

**Creating an SSH key for deploy (if needed):** On your machine run `ssh-keygen -t ed25519 -C "github-deploy" -f deploy_key` (no passphrase so the workflow can use it). Add `deploy_key.pub` to the server’s `~/.ssh/authorized_keys`. Put the contents of `deploy_key` into the `SSH_PRIVATE_KEY` secret.

### One-time server requirements

The workflow assumes you have already:

- Installed Docker and Docker Compose on the VPS.
- Cloned the repo at the deploy path and created `.env` from `.env.production.example`.
- Run the first-time database schema step (Section 4) once so tables exist.
- Added your deploy public key to `~/.ssh/authorized_keys` and ensured the server user can run `docker compose` without sudo (e.g. in the `docker` group).

After that, pushing to `main` (or running the workflow manually) deploys without further steps. The first deploy to a fresh server still requires the manual first-time schema step in Section 4.
