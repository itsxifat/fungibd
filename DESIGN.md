---
name: FungiBd
description: A calm, premium Bangladeshi online shop for farm-grown mushrooms, led by the next harvest.
colors:
  brand: "#02604a"
  brand-deep: "#014837"
  brand-night: "#001b12"
  brand-soft: "#dee8e4"
  brand-tint: "#e8ece6"
  cta: "#b4570b"
  cta-deep: "#974807"
  tan: "#d3bfa4"
  tan-deep: "#76634b"
  cream: "#f4eddb"
  cream-deep: "#ede4d0"
  paper: "#f6f5f1"
  card: "#ffffff"
  ink: "#16251f"
  ink-soft: "#3a4741"
  muted: "#616c67"
  line: "#e2e4e3"
  line-strong: "#d0d3d2"
typography:
  display:
    fontFamily: "Tiro Bangla, Noto Sans Bengali, ui-serif, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0em"
  headline:
    fontFamily: "Tiro Bangla, Noto Sans Bengali, ui-serif, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "0em"
  title:
    fontFamily: "Tiro Bangla, Noto Sans Bengali, ui-serif, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "0em"
  title-card:
    fontFamily: "Tiro Bangla, Noto Sans Bengali, ui-serif, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.375
    letterSpacing: "0em"
  price:
    fontFamily: "Tiro Bangla, Noto Sans Bengali, ui-serif, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.2
    fontFeature: "tnum"
  body:
    fontFamily: "Noto Sans Bengali, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
  body-lead:
    fontFamily: "Noto Sans Bengali, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Noto Sans Bengali, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  chip: "6px"
  sm: "8px"
  control: "10px"
  card: "12px"
  sheet: "16px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  section: "56px"
  section-lg: "64px"
components:
  button-buy-now:
    backgroundColor: "{colors.cta}"
    textColor: "{colors.card}"
    rounded: "{rounded.control}"
    padding: "11px 20px"
    typography: "{typography.label}"
  button-buy-now-hover:
    backgroundColor: "{colors.cta-deep}"
  button-add-to-cart:
    backgroundColor: "{colors.card}"
    textColor: "{colors.brand}"
    rounded: "{rounded.control}"
    padding: "11px 20px"
  button-add-to-cart-hover:
    backgroundColor: "{colors.brand-tint}"
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.card}"
    rounded: "{rounded.control}"
    padding: "11px 20px"
  button-primary-hover:
    backgroundColor: "{colors.brand-deep}"
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 20px"
  input-search:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 14px"
  pack-option:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.sm}"
    height: "32px"
  pack-option-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
  card-product:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.card}"
    padding: "14px"
  category-bar:
    backgroundColor: "{colors.brand-deep}"
    textColor: "{colors.card}"
    height: "44px"
  tab-bar:
    backgroundColor: "{colors.card}"
    textColor: "{colors.muted}"
    height: "56px"
  footer:
    backgroundColor: "{colors.brand-night}"
    textColor: "{colors.card}"
---

# Design System: FungiBd

## Overview

**Creative North Star: "The Calm Farm Shop"**

FungiBd looks like the Bangladeshi online shops its customers already use (header search, a green category bar, a banner slider, category tiles, product cards with "add to cart" and "buy now", a bottom tab bar on phones) and makes that format calm and premium. Calm comes from one warm-grey page ground, white cards edged with hairlines instead of shadows, a single deep green for the structural bands, and one orange (turmeric) colour used only on buy buttons. Premium comes from restraint and typesetting: Tiro Bangla headings, real prices set large, generous card padding and nothing ornamental. The first screen sells products and the next harvest date, not a mood: the owner's headline beside a clickable picture slider.

The density is that of a shop, not a landing page. Rows of cards, tight 12-16px gutters and visible prices everywhere. Every fresh mushroom is pre-order only, so the harvest date line and the turmeric "এখনই বুক করুন" button are the recurring signature. Everything else stays quiet so they can be seen.

The owner turned down conceptual or themed visual worlds. The system is the shop format done well. The brand colours are owner-editable (Admin → Settings → Brand), so every surface tone is built from four base tokens with `color-mix()`. That keeps the system intact when the owner changes the green.

**Key Characteristics:**
- Warm-grey page (paper) under white cards with 1px hairline borders and 12px corners.
- Deep green bands for structure: announcement line, category bar, hero banner, harvest-alert panel. A darker green for the footer.
- Turmeric only where money moves: buy-now and book-now buttons, the savings pill, the cart count.
- Tiro Bangla for headings and prices, Noto Sans Bengali for everything read (the owner's choice, 2026-11-25). Bangla first and no letter-spacing.
- Flat at rest. One soft shadow appears on card hover and on overlays.
- One ease-out curve. 150ms for colour and press, 300ms for drawers and the cart pop, 500ms for the banner crossfade.

## Colors

A quiet two-colour shop: forest green for structure and trust, turmeric for the act of buying, on warm grey and white.

Four base tokens come from Admin → Settings → Brand and are injected on `<html>` as inline custom properties: `--brand`, `--tan`, `--cream`, `--ink`. Every derived tone below is a `color-mix(in oklab, …)` of those, defined in `src/app/globals.css`. The hex values in the frontmatter are the resolved defaults. **Edit the base token or the mix ratio, never a derived hex.**

### Primary
- **Farm Green** (brand): links, the add-to-cart button's outline and text, the search button, icons in the trust row and pre-order steps, the active tab in the phone tab bar, focus rings, selection highlight, caret. Owner-editable base.
- **Forest Deep** (brand-deep = brand 82% + black): the structural band colour. Announcement bar, desktop category bar, hero banner ground, harvest-alert panel, hover state of the primary button.
- **Night Field** (brand-night = brand 45% + black): footer ground only, plus the spacer behind the phone tab bar under the footer.
- **Green Mist** (brand-soft = brand 14% + white): text selection.
- **Green Wash** (brand-tint = brand 6% + paper): hover fill of the add-to-cart and ghost buttons, the current-page row in the phone menu, status notes in delivery coverage.

### Secondary
- **Turmeric** (cta, fixed #b4570b, not owner-editable): buy-now ("এখনই কিনুন") and book-now ("এখনই বুক করুন") buttons, the hero's primary CTA, the cart count badge, and the "সাশ্রয়" savings pill at 10% fill with Turmeric Deep text. White on Turmeric passes AA (4.87:1).
- **Turmeric Deep** (cta-deep): hover state of buy-now and the savings pill text.

### Tertiary
- **Jute Tan** (tan, owner-editable base): the 3px active underline in the category bar and the mushroom-mark placeholder for products with no image.
- **Jute Deep** (tan-deep = tan 42% + #3a2812): reserved earthy text tone for tan grounds.
- **Rice Cream** (cream, owner-editable base): the image well behind uploaded photos, the no-image placeholder at 70%, the shop page's "looking for fresh mushrooms?" link at 50%, and the cream button used on dark green.
- **Cream Deep** (cream-deep = cream 80% + tan): deeper cream surface.

### Neutral
- **Warm Paper** (paper, fixed): the page ground on every storefront page, the search field at rest, the cart drawer ground, and hover fill on header icon links.
- **Card White** (card): every card, panel, header, phone search row and tab bar.
- **Field Ink** (ink, owner-editable base): body text and headings, and the fill of a selected pack, region or filter chip.
- **Ink Soft** (ink-soft = ink 82% + white): secondary copy and descriptions (9.7:1 on white).
- **Muted Stone** (muted = ink 64% + white): English sub-names, meta lines, placeholder text, inactive tab labels, harvest-line icons. Raised to 64% for AA (5.5:1 on white, 5.0:1 on paper). Do not lighten.
- **Hairline** (line = ink 11% over transparent): every card border and section divider.
- **Hairline Strong** (line-strong = ink 18% over transparent): input and outline-button borders, the hover border of a card, unselected chips.

### Named Rules
**The Turmeric Reservation Rule.** Turmeric appears only where the customer spends: buy-now and book-now buttons, the cart count and savings. It is never used for decoration, headings, icons, links or section backgrounds. On any screen it should be the colour that marks the next step.

**The Mix-Don't-Hex Rule.** Every derived colour is a `color-mix(in oklab, …)` of an owner-editable base. A hard-coded hex for a brand tone breaks the moment the owner changes the green in Admin.

**The Green-Bands Rule.** Forest Deep fills full-width structural bands and the hero. It is not a card colour. Night Field is the footer and nothing else.

## Typography

**Display Font:** Tiro Bangla (falls back to Noto Sans Bengali, ui-serif, Georgia)
**Body Font:** Noto Sans Bengali (falls back to ui-sans-serif, system-ui)

Both load through `next/font/google` in `src/app/layout.tsx` (`--font-tiro`, `--font-noto`) and are exposed as Tailwind `font-display`, `font-sans` and `font-bangla`. Both draw Bangla and Latin.

**Character:** Tiro Bangla gives headings and prices a classic, calm voice. It has one weight (400), so `.font-display` sets 400 with `font-synthesis-weight: none`: never fake a bold, and get emphasis from size instead. Noto Sans Bengali is a clean, neutral reading face for Bangla descriptions and UI. The owner chose this pair over Anek Bangla, Hind Siliguri, Noto Sans and Baloo Da 2.

### Hierarchy
- **Display** (400, 2rem → 2.6rem → 3rem at sm/lg, line-height 1.2, max 16ch): the hero banner headline only, in white on Forest Deep.
- **Headline** (400, 1.875rem → 2.25rem; product page 2.25rem → 3rem, leading tight): page H1s on pre-order, shop and product pages.
- **Title** (400, 1.5rem → 1.75rem, leading tight): section heads (`SectionHead`) above a hairline rule, wide pre-order card titles (1.5rem), slide caption titles (1.25rem).
- **Card title** (600, 17px → 18px, leading snug): grid product card names and category tiles. Turns Farm Green on card hover.
- **Price** (Tiro Bangla 400, tabular figures, 1.5rem on cards and 2.25rem on the product page): every taka amount, set in Bangla digits (`takaBn`). The struck compare-price is body-size Muted Stone.
- **Body** (Noto Sans Bengali 400, 15px, line-height 1.625): descriptions, FAQ answers, trust-row details. Lead paragraphs are 16-17px. Measure is capped around 38-60ch (`max-w-[38ch]`, `max-w-xl`).
- **Label** (Noto Sans Bengali 500-600, 11-13px): pack options, chips, tab-bar labels (11px), English sub-names (12px), harvest date lines (13px on cards).

### Named Rules
**The No-Tracking Rule.** Letter-spacing stays at 0 everywhere (`.font-display` enforces it). Bangla conjuncts break under negative tracking, and wide uppercase tracking is the eyebrow look this system bans.

**The Bangla-Digits Rule.** Customer-facing numbers (prices, counts, dates, slide numbers) use Bangla numerals through `bnDigits` / `takaBn` / `fmtDateBn`, with `tabular-nums` where numbers align.

## Layout

- **Container:** `.container-x`, max 80rem (1280px), with 16px side gutters, 24px from 640px and 32px from 1024px.
- **Breakpoints:** sm 640px (2 → 3 column grids, larger heads) and lg 1024px (desktop header with inline search, the category bar and the side-by-side banner row appear; the phone tab bar and search row disappear). The card's button row switches on a container query at 15rem.
- **Home rhythm:** banner row at 16/24px from the header. Category tiles 40px below it, then sections at 56px (pre-order, shop) and 64px (benefits, delivery, reviews, FAQ, alerts). Footer at 80px.
- **Section head:** title and optional subline on the left, a "সব দেখুন →" link on the right, a hairline underneath, and content 24px below.
- **Grids:** shop cards are 2 / 3 / 4 columns with 12px gaps (16px from sm). Pre-order wide cards are 1 / 2 columns with 16px gaps. Category tiles scroll horizontally with snap on phones (15.5rem tiles) and become an auto-fit grid (min 13rem) from sm.
- **Banner row:** a 1.05fr / 1fr grid at lg: the owner's headline block (440px min height) on the left, the picture slider on the right stretched to the same height. Stacked on phones and tablets, headline first, then the slider at 4:3 (16:10 from sm).
- **Phone shell:** a sticky 56px header (logo and cart), a search row under it, and a fixed 56px bottom tab bar with safe-area padding. A matching Night Field spacer below the footer keeps the last content clear of the tab bar.
- **Card padding:** grid card 14px → 16px. Wide card 20px → 24px. Panels 20px. The leaflet promo panel is 20px → 32px.

## Elevation & Depth

Flat by default. Depth comes from tone (white cards on warm paper, green bands against both), and hairlines separate surfaces. There is one shadow vocabulary, and it appears only on interaction or for surfaces that float above the page.

### Shadow Vocabulary
- **Lift** (`box-shadow: 0 8px 24px rgba(22,37,31,0.06)`): product card hover, together with the border moving to Hairline Strong. Also the static leaflet thumbnail.
- **Overlay** (`box-shadow: 0 8px 24px rgba(0,0,0,0.12)`): cart drawer, phone menu sheet, the caption card on hero photo slides.
- **Focus ring** (`outline: 2px solid brand; outline-offset: 2px`, and inputs use `0 0 0 4px` brand 14%): keyboard focus everywhere.

### Named Rules
**The Hairline-Not-Shadow Rule.** At rest, a card is white with a 1px Hairline border and no shadow. Shadow is a response to hover or a sign that something floats above the page.

## Shapes

Gently rounded, never pill-shaped buttons. Cards and panels are 12px (`rounded-xl`). Buttons and inputs are 10px. Small buttons, pack options, filter chips and image wells inside cards are 8px (`rounded-lg`). Badges are 6px. The phone menu sheet uses a 16px leading edge. Full circles are only for the cart-count badge, the slider arrows and progress bars. Borders are 1px hairlines on surfaces and 1.5px on inputs and outline buttons. Product images are clipped by their card (square on grid cards, 4:3 → 44% column on wide cards).

**The One-Card-Radius Rule.** Every card or panel on the storefront is 12px. A card never sits inside another card. Inner groups are separated by hairline dividers (`divide-line`) or a tinted well, not a second bordered box.

## Components

### Buttons
Plain, firm and readable: solid fills, semibold Bangla labels, no gradients.
- **Shape:** 10px radius (8px for small). Default 11px × 20px padding at 14.8px. Small is 7px × 14px at 13px with a 40px minimum height on cards. Large is 13px × 22px at 16px.
- **Buy now / Book now (turmeric):** white on Turmeric, hover Turmeric Deep. The label is "এখনই কিনুন" for stock and "এখনই বুক করুন" for pre-order. It adds the pack and goes straight to `/checkout`.
- **Add to cart:** white with a 1px Farm Green border, Farm Green text and a shopping-bag icon ("কার্টে রাখুন"). Hover Green Wash. When sold out it shows "শেষ হয়ে গেছে" with a Hairline Strong border and Muted text.
- **Primary (green):** white on Farm Green, hover Forest Deep. Used for the search submit, PDF download and form submits.
- **Outline:** a 1.5px Hairline Strong border with Ink text. Hover moves both to Farm Green.
- **Ghost:** Ink Soft text, hover Green Wash with Farm Green text.
- **On dark green:** a white/35 outline that turns white with a 10% white fill on hover (hero secondary). Cream fill for the harvest-alert submit.
- **States:** 150ms colour transitions on the shared ease. `:active` scales to 0.98. Disabled is 50% opacity with no pointer events.
- **Card button row:** add-to-cart and buy-now sit side by side, each taking half. Below a 15rem container width (the 2-up phone grid) they stack.

### Chips and pack options
- **Pack picker** (radiogroup "প্যাকের সাইজ"): 8px radius, 32px tall on cards and 40px on the product page. Unselected is a white fill with a Hairline Strong border and Ink Soft text. Hover darkens the border to Ink. Selected is an Ink fill with white text. A sold-out pack is struck through with a dashed border.
- **Filter and region chips** (shop, delivery coverage): the same Ink-selected pattern at 13-14px.
- **Image badges:** "শেষ" (sold out) in white on Ink 80%, and the owner badge in Ink Soft on white, 6px radius, top-left of the image.
- **Savings pill:** "৳X সাশ্রয়" in Turmeric Deep on Turmeric 10%, 6px radius.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** Card White on Warm Paper.
- **Shadow Strategy:** none at rest. Lift on hover (see Elevation).
- **Border:** 1px Hairline, which becomes Hairline Strong on hover.
- **Product card, grid:** a square image well, then the Bangla name (card title), the English name in 12px Muted, a rating row only when real reviews exist, a two-line Bangla description (hidden on phones), then the price block and button row pinned to the bottom.
- **Product card, wide:** the image takes a 44% column at sm+ with the details beside it, a 1.5rem title, a three-line description, and buy-now always on. It is used for every pre-order product.
- **Trust row:** one white strip of four icon + two-line items (2 columns on phones, 4 on desktop). The icons are Farm Green line icons with no tile behind them.

### Inputs / Fields
- **Style:** white, a 1.5px Hairline Strong border, 10px radius, 11px × 14px padding, 15px text, Muted placeholder.
- **Focus:** the border turns Farm Green with a 4px ring of brand at 14%, over 150ms.
- **Error:** the border turns #d92d20 (`aria-invalid`).
- **Header search:** 44px tall on a Warm Paper fill that turns white on focus. A leading search icon and an inset green "খুঁজুন" button. Placeholder "মাশরুম, পাউডার বা কিট খুঁজুন".

### Navigation
- **Announcement line:** 36px of Forest Deep with 13px white Bangla centred text, shown only when the owner sets one.
- **Header:** sticky and white. 56px on phones (logo and cart icon), 72px on desktop (logo, search up to 36rem wide, track and account icon links with 12px labels, and a bordered cart button showing "কার্ট" and the subtotal in Tiro Bangla).
- **Category bar (desktop):** 44px of Forest Deep with 15px links at white 75%, white on hover. The active link is white with a 3px Jute Tan underline. The phone number sits right-aligned.
- **Phone tab bar:** fixed, white with a top hairline, five tabs (হোম, প্রি-অর্ডার, শপ, কার্ট, আরও) of a 20px icon over an 11px label. Inactive tabs are Muted and the active one is Farm Green. "আরও" opens a right-side modal sheet (Bangla label with an English hint in Muted, 48px rows, Green Wash on the current page).
- **Footer:** Night Field. Logo, tagline, social text-buttons with white/15 borders, two link columns and a contact column. Links are white 70%, white on hover.

### Harvest date line (signature)
A calendar-clock icon in Muted followed by "হারভেস্ট · বুধবার, ২৫ নভেম্বর" in Noto Sans Bengali, used the same way on the hero, cards, the product page, the cart and emails (`HarvestDate`). If no date is known it reads "পরের হারভেস্টে ডেলিভারি". The harvest date is the store's clock, so it always appears beside a pre-order product.

### Home banner (signature)
Two blocks side by side, both edited in Admin → Settings → Home page. **Left, the headline block:** Forest Deep with 12px corners; the display title, an optional English line at white 65%, the subline, a turmeric primary CTA and an outline secondary, then the harvest date line (or the owner's own small line). It grows with the owner's text. **Right, the picture slider:** a white-bordered 12px stage of the owner's pictures (`object-cover`), each optionally clickable with a white caption card. With no pictures uploaded it shows the products (pre-order first, else the shop) with name, price and harvest date, and with nothing at all the farm illustration. With more than one slide it gains swipe, side arrows (sm+) and progress bars in a dark pill at the top right that run for 5.5s and pause on hover or focus. Under reduced motion it does not autoplay. There is no booking box beside the banner; the owner found it confusing.

### Cart count
A turmeric circle on the bag icon, 18px in the header and 16px in the tab bar, with Bangla digits capped at "৯৯+". It pops in from 0.55 scale over 300ms each time an item is added.

### Motion
One curve: `--ease: cubic-bezier(0.22, 1, 0.36, 1)`. Colour, border and press changes take 150ms. The cart pop and the cart drawer slide take 300ms. The phone menu sheet slides in over 200ms. The banner crossfade takes 500ms. Under `prefers-reduced-motion` all durations collapse to 0.01ms and the slider stops autoplaying. The brand film (`MotionStory`) is the only looping motion on the site.

## Do's and Don'ts

### Do:
- **Do** set the page on Warm Paper and every card or panel on Card White with a 1px Hairline border and 12px corners.
- **Do** keep Turmeric for buy-now, book-now, the cart count and savings, so the next step is always the single warm colour on the screen.
- **Do** derive new tones with `color-mix(in oklab, …)` from `--brand`, `--tan`, `--cream` and `--ink`, so Admin → Settings → Brand keeps working.
- **Do** write every button, label, tab and heading in Bangla. English appears only as a secondary companion line in Muted (product English names, the hero's English title, phone-menu hints).
- **Do** show the harvest date line next to every pre-order product and price.
- **Do** design every image slot for a real photo first. Product art lives in `ProductImage`, which shows an uploaded photo (`object-cover` on Rice Cream), a built-in illustration (`art:<kind>` from `public/art`, centred at 78% on its own tint), or the tan mushroom-mark placeholder. Keep slots at fixed aspect ratios (square grid, 4:3 wide, 4:3-ish panel well) so swapping in photos changes nothing else.
- **Do** use FungiBd's own farm photos when they arrive. The flat SVG illustrations are stand-ins.
- **Do** keep surfaces working with no hero slides, no bookable products and no reviews. Each has a designed empty state.
- **Do** use the one ease curve and the 150 / 300 / 500ms durations, and keep everything still under reduced motion.

### Don't:
- **Don't** put eyebrow or kicker labels (small uppercase or tracked text) above headings anywhere on the storefront.
- **Don't** put icons on tinted tiles or in circles as card scaffolding. Icons are bare 20px Farm Green or Muted line icons beside the text.
- **Don't** nest a bordered card inside another card. Use hairline dividers or a tinted well.
- **Don't** use Turmeric for links, icons, headings, section backgrounds or decoration.
- **Don't** add shadows to cards at rest, or use any shadow other than Lift and Overlay.
- **Don't** apply letter-spacing to Bangla text, and don't set headings in a system font. Headings and prices are Tiro Bangla, at its one weight.
- **Don't** hard-code a brand hex in a component. Use the token.
- **Don't** lighten Muted Stone below ink 64%. It is the AA floor for secondary text on white and paper.
- **Don't** use stock photography, invented reviews, ratings, customer counts or certification badges. Rating rows render only from approved reviews.
- **Don't** build themed or conceptual page worlds or editorial mood-first heroes. The first screen shows products, prices and the next harvest.
