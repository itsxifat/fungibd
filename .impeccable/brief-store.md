# Storefront (all customer pages)

Scope: the whole customer storefront under `src/app/(store)`, home first. Mode: Persuade on home, pre-order, shop and product pages; Operate on cart, checkout and track.

Audience and job: Dhaka households (Bangla first) booking fresh mushrooms from the next harvest, and buying dried mushrooms, powder and grow kits; low-commitment buying, cash on delivery.

Constraints: logo and mark unchanged; owner-editable brand colours, home text, hero slides and delivery areas must keep working, including with no slides and no bookable products; photos arrive later (design for them, ship illustrations now).

## Direction contract

THESIS: The familiar Bangladeshi online shop, made calm and premium: header search, category bar, banner slider, category tiles, product cards with "add to cart" and "buy now". It leads with the next harvest. It refuses concept worlds and the editorial landing page whose first screen sells a mood instead of products.

OWN-WORLD: Soft warm-grey page (#F6F5F1) with white product cards, 12px radius, hairline borders, product art on tinted tiles. Deep forest green (#0B4D3B) owns the category bar, harvest panel and footer; brand green (#02604A) carries links and add-to-cart. Turmeric (#B4570B) appears only on buy-now buttons and savings. Anek Bangla for headings and prices, Hind Siliguri for body. No eyebrow labels, no icon-tile cards.

STORY: A visitor sees what is being harvested next and when, sees real prices, books or buys in one tap, trusts cash on delivery and the delivery areas, finds dried, powder and kits by category, and comes back for the next harvest.

FIRST VIEWPORT: Desktop: announcement line, then logo + wide search + track / account / cart (count and total), then the green category bar. Below that, a banner row: slider at two-thirds width (slide 1 is the owner's headline banner on green with the farm illustration and primary button; further slides are owner photos), and a "পরের হারভেস্ট" panel at one-third (date, product, price, buy-now). Category tiles start inside the fold. Mobile: logo row with cart, search under it, slider full width, harvest panel, bottom tab bar.

FORM: category standard (canon), chosen by the owner over the roll: "keep simple easy to use but premium with good taste", reference "like ghorerbazar.com". seed:3c5e4aaa50ad0d45. Signature interaction: "এখনই কিনুন / বুক করুন" adds the pack and lands on checkout in one tap; add-to-cart pops the header cart count. Motion grammar: 150ms colour and press, 500ms banner crossfade, 300ms drawer slide, one ease-out curve.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open decisions

- Real farm photos replace the illustrations when the owner uploads them (hero slides and product images).
- The dedicated wholesale area is still undecided (PRODUCT.md).
