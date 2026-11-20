# Running fungibd.com on the office server

The site is one Node.js app with a single-file SQLite database — no separate database server to install. Pick **one** of the two options below.

## Option A — Node.js directly (Windows or Linux)

1. Install **Node.js 22 LTS** from nodejs.org and **Git**.
2. Copy the project folder to the server (or `git clone`), then in that folder:
   ```bash
   npm ci
   cp .env.example .env            # Windows: copy .env.example .env
   ```
3. Edit `.env`: set `AUTH_SECRET` (long random string), `SITE_URL=https://fungibd.com`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and the SMTP settings (see Email below).
4. Create the database and start:
   ```bash
   npm run setup        # database + admin login + products + Dhaka areas (no demo data)
   npm run build
   npm run start        # site runs on http://localhost:3000
   ```
5. Keep it running after restarts with **PM2**:
   ```bash
   npm install -g pm2
   pm2 start npm --name fungibd -- start
   pm2 save
   pm2 startup          # Linux: follow the printed command. Windows: use "pm2-installer" or Task Scheduler at log-on.
   ```

## Option B — Docker

```bash
cp .env.example .env    # edit it
docker compose up -d --build
docker compose exec web npx tsx prisma/seed.ts   # first time only: admin login, products, areas
```
Database and uploaded photos are stored in the `./data` folder next to `docker-compose.yml`.

## Putting it on the internet (fungibd.com)

An office connection usually has no fixed public IP, so the easiest and safest way is a **Cloudflare Tunnel** (free, automatic HTTPS, no router port-forwarding, hides the office IP):

1. Add `fungibd.com` to a free Cloudflare account and change the domain's nameservers at your registrar to Cloudflare's.
2. On the server install `cloudflared`, then in the Cloudflare dashboard: *Zero Trust → Networks → Tunnels → Create tunnel*, run the shown install command on the server.
3. Add a public hostname: `fungibd.com` (and `www`) → service `http://localhost:3000`.

Alternative if you have a static IP: forward ports 80/443 to the server and run Caddy (`caddy reverse-proxy --from fungibd.com --to localhost:3000`) for automatic HTTPS.

Tips: put the server and router on a **UPS**; the site is down whenever the office power or internet is down.

## Email (order confirmations & updates)

Easiest: **Admin → Settings → Email** — pick a provider preset, enter the mailbox and password (stored encrypted), click *Save & test connection*, then *Send test*. There you also choose which emails go out and which addresses receive new-order / support / wholesale alerts.

Alternatively set these in `.env` and restart (admin settings take priority over `.env`).

| Provider | SMTP_HOST | SMTP_PORT | SMTP_SECURE | Notes |
|---|---|---|---|---|
| Zoho Mail (free plan supports your own domain) | smtp.zoho.com | 465 | true | Create `orders@fungibd.com` |
| Brevo (300 emails/day free) | smtp-relay.brevo.com | 587 | false | Verify fungibd.com as a sender domain |
| Gmail | smtp.gmail.com | 465 | true | Needs an App Password; ~500/day limit |

For good delivery (not spam), add the **SPF and DKIM** DNS records your provider gives you for fungibd.com, and set `MAIL_FROM` to an address on your domain.

## Backups (important)

Everything is in `prisma/fungibd.db` (Docker: `data/fungibd.db`) plus the `uploads` folder (photos).

- One click: **Admin → Settings → Backup → Download database backup**.
- Automatic: `npm run backup` writes a copy to `backups/` and keeps the last 30. Schedule it daily:
  - Linux: `crontab -e` → `0 23 * * * cd /path/to/fungibd.com && npm run backup`
  - Windows: Task Scheduler → daily task running `cmd /c "cd /d D:\fungibd.com && npm run backup"`
- Copy the `backups` and `uploads` folders to Google Drive / another disk regularly.

To restore: stop the site, replace `prisma/fungibd.db` with a backup file, start again.

## Updating the site later

```bash
npm run backup      # safety copy first
git pull            # or copy the new files
npm ci
npm run build
# only when the database schema changed (prisma/migrations has a new folder):
pm2 stop fungibd && npx prisma migrate deploy && pm2 start fungibd
pm2 restart fungibd
```
The live app keeps the SQLite file open, so migrations need the app stopped for a few seconds.

## Going live checklist

- [ ] `npm run db:fresh` if you tried the demo data (clears all sample orders/customers)
- [ ] Strong `AUTH_SECRET` and admin password; change the password after first login
- [ ] Settings → Store: real phone, WhatsApp, email, address, Facebook page
- [ ] Products: real prices, photos, pack sizes; turn pre-order on where needed
- [ ] Delivery: check areas, charges, riders; Settings → Delivery: free-delivery amount & time slots
- [ ] Production & Supplies: enter current supply stock and costs so cost-per-kg and profit are accurate
- [ ] Email test sent successfully
- [ ] Daily backup scheduled
