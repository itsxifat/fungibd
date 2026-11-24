# FungiBd — website & farm management

Online shop for **fungibd.com** (Bangla + English) plus an admin panel to run the whole business: orders, pre-orders, delivery, production, stock, supplies, costs, profit & loss, customers, leads, support and email marketing.

- Website: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin` (set up the first owner with a private code)

## Quick start (on a computer with Node.js 20+)

```bash
npm install
cp .env.example .env        # then edit .env
npm run setup               # creates the database, products and Dhaka delivery areas
npm run admin:prepare-setup --silent  # prints the private setup code for a new installation
npm run dev                 # open http://localhost:3000
```

Open `/admin/login/setup` with the private code to choose your owner email and password. Configure SMTP for verification and forgotten-password emails.

Want sample data to explore the dashboards first? `npm run db:demo` adds ~75 days of example orders, customers, farm records and expenses. **Before going live with a demo database, run `npm run db:fresh`** to wipe the demo data, then prepare owner setup for the new database.

Deploying on the office server: see **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## What's inside

### Website (customers)
- Home page with a **motion video** of mushroom benefits (plays like a video, 12 animated scenes, fullscreen) and a printable **A4 leaflet** (`/leaflet`, “Save as PDF” from the print dialog).
- Shop, product pages with pack sizes, cart, and a 2-minute checkout.
- **Map pin** (OpenStreetMap, free — no API key): search an address, use “my location”, or tap the map. Pins outside the Dhaka delivery radius are rejected.
- Delivery area + charge, delivery day and time slot, coupon codes, **cash on delivery**.
- **Pre-orders**: per product, controlled from the admin panel. Mixed carts are split automatically into a “now” delivery and a “harvest day” delivery.
- Order confirmation & status **emails** (Bangla + English): placed, confirmed, out for delivery, delivered (with review link), cancelled, pre-order harvest ready.
- Guest checkout, optional customer account (order history, saved addresses), order tracking by order no. + phone, support tickets, wholesale inquiry form, harvest-alert signup.

### Admin panel
| Area | What you can do |
|---|---|
| Dashboard | Today's work, sales, revenue, gross & net profit vs previous period, charts, top products, areas, stock alerts |
| Orders | Filter, search, confirm → packing → out for delivery → delivered; cancel/return; rider; costs; packing slip with map QR; manual orders (phone/Facebook/WhatsApp) |
| Pre-orders | Turn pre-order on per product: “only when sold out” or “pre-order only”, harvest date, booking cut-off, maximum quantity. See bookings by harvest date, email “harvest ready”, move to packing |
| Delivery | Day board by area, assign riders, rider payouts & cash collected, delivery areas & charges |
| Products | Bangla/English content, photos (auto-compressed), pack sizes & prices, packaging per pack, cost mode |
| Production | Grow batches with supplies used and direct costs → **cost per kg** automatically; record harvests (adds to stock) |
| Inventory | Live stock, spoilage & corrections, full stock history |
| Supplies | Spawn/substrate/packaging stock, purchases (weighted average cost), usage & waste, suppliers, reorder alerts |
| Customers | Retention segments (New, Active, Loyal, At risk, Lost), lifetime value, order gap, notes, tags, call/WhatsApp log & follow-ups |
| Leads | Pipeline board (New → Contacted → Qualified → Negotiation → Won/Lost), follow-ups, convert to customer |
| Support | Ticket inbox, email replies, internal notes, priority |
| Marketing | Email campaigns to any segment (test send, unsubscribe link), coupons |
| Finance | Profit & loss, cash flow, stock value, 6-month trend, margin by product, expenses, CSV exports |
| Settings | Store info, logo & colours, delivery rules, home page text & photo, email, segment rules, team & roles, backup |

Team roles: **Owner** (everything), **Manager** (no settings/users), **Staff** (orders, delivery, farm, customers & support — no money figures).

## How profit is calculated

- **Revenue** is counted when an order is delivered: product sales − discounts + delivery charges.
- **Mushroom cost** per order = pack amount × the product's cost per kg. Cost per kg comes from your latest production batches: *(supplies used + other direct costs) ÷ kg harvested* (or set manually for kits, powder etc.).
- **Packaging** is deducted from supplies when an order is packed (set the packaging item on each pack size).
- **Delivery cost** = the rider/courier rate (or the area's estimated cost).
- **Losses**: spoilage you record, wasted supplies, and costs of cancelled/returned orders.
- **Gross profit** = revenue − all of the above. **Net profit** = gross profit − expenses (rent, salaries, utilities, marketing…).
- Supply purchases are not expenses on the P&L — they become cost when used. This keeps the numbers from being counted twice. Cash flow shows the actual money in and out.

## Brand
Logo files are in `public/brand` (traced from the FungiBd logo): wordmark (green/cream), mushroom mark, app icon, email logo and social share image. Colours: green `#02604A`, cream `#F4EDDB`, tan `#D3BFA4`. You can upload new logos and change colours in **Admin → Settings → Brand**.

## Tech
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma + SQLite · Nodemailer (SMTP) · Leaflet/OpenStreetMap · Recharts · Motion.
