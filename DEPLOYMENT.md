# Running fungibd.com on the office server

The site is one Node.js app with a single-file SQLite database — no separate database server to install. Pick **one** of the two options below.

## Option A — Node.js directly (Windows or Linux)

1. Install **Node.js 22 LTS** from nodejs.org and **Git**.
2. Copy the project folder to the server (or `git clone`), then in that folder:
   ```bash
   npm ci
   cp .env.example .env            # Windows: copy .env.example .env
   ```
3. Edit `.env` and set `AUTH_SECRET` (at least 32 random characters), `SITE_URL=https://fungibd.com`, and your SMTP settings (see Email below).
4. Create the database and start:
   ```bash
   npm run setup        # database, products and Dhaka areas (no demo data)
   npm run admin:prepare-setup --silent  # prints a private code for owner setup
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
docker compose exec web npm run db:seed                    # first time only: products, areas
docker compose exec web npm run admin:prepare-setup --silent  # prints a private code
```
Database and uploaded photos are stored in the `./data` folder next to `docker-compose.yml`.

## Admin access

Visit `/admin/login/setup` with the private code from the server. Enter your name, a mailbox you control, and a new password. The first successful submission creates the owner and closes setup permanently for that database. Verify your email using the link in your inbox. The initial session can also configure SMTP from the admin panel.

On an existing database, `npm run admin:prepare-setup --silent` removes all existing admin accounts and opens owner setup. Take a database backup beforehand. Rerunning the command before the owner is created replaces the setup code. After setup is complete, use **Forgot password?** on `/admin/login` to reset a password by email.

## Google sign-in

Customers and admins share one Web application OAuth client. Register `https://fungibd.com/admin/login/google/callback` as its authorized redirect URI. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` and restart. The customer buttons appear on `/account/login` and `/account/register`. Use an External audience and publish the app in Google Auth Platform for public customer access.

New customers can use Google to create an account. Existing customers sign in with their password first, then connect Google from their profile using the same email address. Admins use the Google account matching their existing admin email. An admin using an email managed outside Google can connect Google from the dashboard after verifying their email.

In Google Auth Platform → Branding → App domain, use these public URLs.

| Field | URL |
| --- | --- |
| Application home page | `https://fungibd.com/` |
| Application privacy policy link | `https://fungibd.com/privacy` |
| Application terms of service link | `https://fungibd.com/terms` |

## Putting it on the internet (fungibd.com)

An office connection usually has no fixed public IP, so the easiest and safest way is a **Cloudflare Tunnel** (free, automatic HTTPS, no router port-forwarding, hides the office IP):

1. Add `fungibd.com` to a free Cloudflare account and change the domain's nameservers at your registrar to Cloudflare's.
2. On the server install `cloudflared`, then in the Cloudflare dashboard: *Zero Trust → Networks → Tunnels → Create tunnel*, run the shown install command on the server.
3. Add a public hostname: `fungibd.com` (and `www`) → service `http://localhost:3000`.

Alternative if you have a static IP: forward ports 80/443 to the server and run Caddy (`caddy reverse-proxy --from fungibd.com --to localhost:3000`) for automatic HTTPS.

Tips: put the server and router on a **UPS**; the site is down whenever the office power or internet is down.

## Email (orders, updates and admin access)

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
- [ ] Strong `AUTH_SECRET`, owner setup complete, and owner email verified
- [ ] Settings → Store: real phone, WhatsApp, email, address, Facebook page
- [ ] Products: real prices, photos, pack sizes; turn pre-order on where needed
- [ ] Delivery: check areas, charges, riders; Settings → Delivery: free-delivery amount & time slots
- [ ] Production & Supplies: enter current supply stock and costs so cost-per-kg and profit are accurate
- [ ] Email test sent successfully
- [ ] Daily backup scheduled
