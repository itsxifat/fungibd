# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: two audiences in Dhaka city who read Bangla first.

- **Home cooks.** Families buying fresh mushrooms for everyday meals: bhaji, curry, soup, omelette, biryani. They pick a delivery day and time slot and pay cash at the door.
- **Health-motivated buyers.** People buying mushrooms for what they do for the body: protein in meat-light meals, low-GI eating, vitamin D, fibre. They want to understand the benefit before they buy.

Secondary:

- **Restaurants, hotels and shops** buying in bulk. They get an area of their own, separate from the household storefront. Today that is the `/wholesale` inquiry form, which feeds the admin leads pipeline; the shape of the dedicated area is not yet decided.
- **Home growers** buying spawn packets and grow kits.
- **The FungiBd team** working in the admin panel: Owner (everything), Manager (no settings or users), Staff (orders, delivery, farm, customers and support, with no money figures). Their job is running each harvest and delivery day: confirming and packing orders, assigning riders, recording production, stock and supplies.

## Product Purpose

FungiBd grows mushrooms on its own farm in Bangladesh and sells them directly to people in Dhaka. The website is the shop. The admin panel runs the business behind it: orders, pre-orders, delivery, production, stock, supplies, costs, profit and loss, customers, leads, support and email marketing.

Success means households book from the next harvest and come back to reorder, restaurants become recurring wholesale accounts, and the team runs every harvest and delivery day from one place while knowing the true cost per kg and the profit on each order.

## Positioning

Two facts a reseller cannot truthfully copy:

1. **We grow it ourselves.** Every mushroom comes from FungiBd's own farm and is harvested and delivered by FungiBd, not bought in from other growers.
2. **Book a harvest, pay later.** Customers reserve from a dated upcoming harvest with no advance payment and pay cash on delivery. What the farm picks goes to the people who booked it.

Not claimed, and not to be implied: rare or exclusive varieties, organic or chemical-free growing.

## Operating Context

- Delivery inside Dhaka city only. Customers pin their home on an OpenStreetMap map or type an address; pins outside the delivery radius are rejected. Each delivery area has its own charge, and the customer chooses the day and time slot.
- Cash on delivery is the only payment method.
- A cart that mixes in-stock items and pre-orders splits automatically into a "now" delivery and a "harvest day" delivery.
- Orders also arrive by phone, Facebook and WhatsApp; staff enter these as manual orders.
- Guest checkout is the default. An optional account keeps order history and saved addresses. Anyone can track an order with its number and their phone number.
- Customers receive status emails in Bangla and English: placed, confirmed, out for delivery, delivered (with a review link), cancelled, and pre-order harvest ready.
- Printed material: an A4 benefits leaflet (`/leaflet`) and packing slips with a map QR code.

## Capabilities and Constraints

- **Language.** Bangla is the primary language (`<html lang="bn">`, `bn_BD`). English appears alongside it, and customer-facing content exists in both.
- **Catalogue.** Product groups are fresh mushrooms, dried and powder, and grow-at-home (spawn and kits). The seeded catalogue also lists pink oyster, shiitake and lion's mane. **Undecided:** which varieties are actively grown. Show availability only from live product data, never from the seed list.
- **Pre-order** is set per product: "only when sold out" or "pre-order only", with a harvest date, a booking cut-off and a maximum quantity.
- **Health wording** stays conservative ("helps", "supports"), comes from published nutrition data (USDA FoodData Central), and is never presented as medical advice.
- **Owner-editable content.** Store details, logo, brand colours, home-page text, hero slides and delivery rules are changed in Admin → Settings. Every surface must still work when the owner edits them, including when there are no hero slides or no bookable products.

## Brand Commitments

- Name: FungiBd, at fungibd.com.
- Logo: the FungiBd wordmark and mushroom mark in `public/brand/` (green and cream wordmarks, mark, badge, app icons, email logo, social share image). The README records the brand colours that go with them; the owner can change both in Admin → Settings → Brand.
- Voice, as observed in the existing copy and not yet confirmed: plain, warm, practical Bangla with short reassurances such as "হাতে পেয়ে টাকা দিন" (pay when it's in your hands).
- **Storefront style (owner's standing preference, 2026-11-24):** simple, easy to use, premium, with good taste. Familiar Bangladeshi online-shop conventions, with ghorerbazar.com as the reference for ease and polish: search in the header, category menu, banner slider, category tiles, product cards with "add to cart" and "buy now", category sections. No conceptual or themed visual worlds; the owner turned those down.

## Evidence on Hand

- **Farm and harvest photographs:** the owner has real ones. None are in the repo yet; product images today are SVG illustrations in `public/art/`.
- **Nutrition figures:** USDA FoodData Central values for raw oyster mushroom, in `src/lib/content.ts`.
- **Customer reviews:** only those customers submit through the post-delivery review link and an admin approves. No other reviews or testimonials exist.
- **Not available, never fabricate:** certifications or lab tests, a public farm address, press coverage, customer counts, sales figures, ratings, quotes or names.

## Product Principles

1. **The harvest sets the clock.** What is growing, when it is picked and when it reaches the door explain every order. Lead with the next harvest date.
2. **Show our farm or nothing.** Proof is FungiBd's own growing: real photographs and real numbers. Never stock imagery or invented social proof.
3. **Nothing to risk.** No advance payment, cash at the door, a delivery day the customer picks. Keep every step low-commitment and say so plainly.
4. **Bangla first, careful with health.** Speak to Dhaka households in their own language. Health benefits are sourced and stated carefully, never promised.
5. **Kitchens and households get separate paths.** A family ordering 500 g and a restaurant ordering every week should not share one funnel.
