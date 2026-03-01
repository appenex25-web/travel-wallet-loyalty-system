# Run booking migration on VPS

After deploy, if the production DB was created before the payment columns were added, run the booking migration once.

**If GitHub Actions deploy fails with exit code 255:** Open the failed run, expand the failed step (e.g. "Deploy backend on server"), and check the log. Common causes: SSH key or `SERVER_IP`/`SERVER_USER` wrong; server out of disk or memory during `docker compose build`; missing `.env` on server. The migration now runs in the same step and won’t fail the job if it errors (`|| true`).

**From your VPS (SSH as root):**

1. Go to the deploy directory (default is `/opt/travel-wallet-loyalty-system`; use your `DEPLOY_PATH` if you set one):
   ```bash
   cd /opt/travel-wallet-loyalty-system
   ```

2. Run the migration **inside the backend container** (so it uses the same DB as the app):
   ```bash
   docker compose exec backend node scripts/run-booking-migration.js
   ```

You should see four `OK:` lines and then `Migration done.`

**If you don’t use Docker** and run the backend directly on the host, use the backend path and ensure `DATABASE_URL` is set (e.g. in `backend/.env`):

```bash
cd /opt/travel-wallet-loyalty-system/backend
node scripts/run-booking-migration.js
```
