-- Seed the first three service pages at /services/:slug/.
--
-- Chosen so they do NOT compete with the existing top-level routes
-- (/dtf, /blanks, /sublimation, /display, /catalogues, /sports-kits) for the
-- same keyword — each targets its own distinct search intent.
--
-- 'corporate-branded-apparel' deliberately omits process_json to exercise the
-- DEFAULT_PROCESS_STEPS fallback in both the React template and the
-- prerenderer. 'custom-uniforms-and-workwear' sets process_json explicitly to
-- exercise the override path. Both branches are covered by a real page.

insert into public.service_pages
  (slug, title, meta_description, keyword, h1, intro, body_html,
   benefits_json, process_json, faq_json, related_json, blog_json,
   status, sort_order, published_at, updated_at)
values
(
  'corporate-branded-apparel',
  'Corporate Branded Apparel South Africa | Bulk Staff Uniform Printing',
  'Bulk branded staff apparel in South Africa — printed and pressed polos, t-shirts, hoodies and soft shells for companies, teams and events. Quote in 4 hours, courier nationwide.',
  'corporate branded apparel South Africa, branded staff uniforms South Africa, bulk company t-shirts with logo, custom workwear printing South Africa',
  'Corporate Branded Apparel, Printed and Delivered in Mbombela',
  'Staff tees, polos and hoodies that your team actually wears. We source the blanks, print your logo, press it on properly and courier the lot to your door — one supplier instead of three.',
  '<p>Most companies in South Africa lose weeks coordinating corporate apparel across a supplier, a printer and a courier. Blank2Branded collapses that into one order: we hold the blanks in stock, run the print in-house in Mbombela and deliver nationwide.</p><p>Whether you need 25 staff tees or 2 500, the process is the same. You approve a digital proof before we print, we hand-check every piece, and you get tracking on the courier.</p>',
  '[
    {"title": "One supplier, not three", "description": "Blanks, printing, pressing and courier handled in a single order. No chasing a printer for an update."},
    {"title": "Logo lasts wash after wash", "description": "DTF transfers are fully bonded into the fabric rather than sitting on top, so they survive industrial washing."},
    {"title": "Proof before production", "description": "You see the artwork on the garment and approve it before anything is printed. No surprises on delivery."},
    {"title": "Blanks held in stock", "description": "Cotton, poly-cotton and premium blends are on the shelf, so lead times stay short even at volume."},
    {"title": "Hand-checked quality", "description": "Every piece is inspected before it is packed. Replacements go out without argument if anything is wrong."},
    {"title": "Courier nationwide", "description": "Delivered across South Africa with tracking, or collect free of charge at our Mbombela studio."}
  ]'::jsonb,
  null,
  '[
    {"q": "How long does a bulk corporate apparel order take?", "a": "Most orders ship within 3 to 5 business days of artwork approval. Larger runs of 500+ typically take 7 to 10 business days. We confirm a firm turnaround date with your quote before you pay anything."},
    {"q": "What is the minimum order for branded staff apparel?", "a": "There is no strict minimum, but pricing works out best from around 25 units per style. Below that the setup cost per garment is too high to be competitive — we will tell you honestly if a smaller run is not worth it."},
    {"q": "Can you print our logo on shirts we already own?", "a": "Yes. Send us the blank shirts and we will print them provided they are clean, undamaged and free of previous prints. We still send a proof first."},
    {"q": "Do you match our existing corporate colours?", "a": "Yes. Send your brand guidelines or a Pantone reference and we will colour-match before the proof goes out. DTF reproduces colours closely, though very dark garments can shift a shade lighter than screen."},
    {"q": "Can you deliver to multiple branches?", "a": "Yes. We can split an order across several delivery addresses and ship each branch separately, with tracking for each parcel."},
    {"q": "What if the delivery is late or the quality is not right?", "a": "Tell us within 7 days of delivery. If prints are lifting, mis-coloured or damaged we reprint and resend at our cost. That is a standing commitment, not a favour."}
  ]'::jsonb,
  '[
    {"slug": "custom-uniforms-and-workwear", "title": "Custom Uniforms & Workwear", "description": "Site staff, trades and security uniforms built for daily wear, not a one-day giveaway."},
    {"slug": "branded-promotional-gifts", "title": "Branded Promotional Gifts", "description": "Bags, drinkware and corporate gifts that get used long after the event ends."},
    {"slug": "/sports-kits/", "title": "Sports Kits & Teamwear", "description": "Full-colour sublimated kits, from single items to full squad sets."}
  ]'::jsonb,
  '[
    {"slug": "bulk-order-branding-save-money-on-corporate-apparel", "title": "Bulk Order Branding Save: Smart Apparel for Business"},
    {"slug": "workwear-branding-a-guide-for-sa-construction-trades", "title": "Expert Workwear Branding for SA Businesses"},
    {"slug": "brand-storytelling-apparel-south-africa", "title": "Brand Storytelling Apparel: Speak Through Clothing"},
    {"slug": "why-branding-is-important-for-your-business", "title": "Why Branding Is Important for Your Business Growth"}
  ]'::jsonb,
  'published', 1, now(), now()
),

(
  'custom-uniforms-and-workwear',
  'Custom Uniforms & Workwear South Africa | Branded Site Staff Clothing',
  'Custom branded uniforms and workwear in South Africa for construction, security, hospitality and site staff. Durable DTF-printed clothing built for daily wear. Quote in 4 hours.',
  'custom uniforms South Africa, branded workwear South Africa, site staff clothing with logo, corporate uniform printing South Africa',
  'Custom Uniforms and Workwear That Survives the Job',
  'Uniforms get washed daily, faded in the sun and abused on site. We print them to survive that — bonded DTF transfers on heavyweight cotton and poly-cotton, cut and sized for real working conditions.',
  '<p>Workwear is not apparel. It has to hold its colour through industrial laundry, its logo has to still be readable after a month on site, and it has to fit properly across a team of different sizes and body types.</p><p>Blank2Branded supplies uniforms and workwear for construction crews, security teams, hospitality staff and field technicians across South Africa. We hold heavyweight blanks in stock, print with bonded DTF transfers that do not crack or peel, and size the run from your own measurements rather than guessing.</p>',
  '[
    {"title": "Survives industrial washing", "description": "Bonded DTF transfers flex with the fabric instead of cracking, and hold colour through 60-degree commercial washes."},
    {"title": "Sized from your measurements", "description": "Send a size breakdown or individual measurements and we cut the run to fit, not to a generic size chart."},
    {"title": "High-visibility compliant", "description": "Certified fluoro and reflective options available for site and roadside roles."},
    {"title": "Reorders match exactly", "description": "Your print file is stored on file, so a reorder six months later matches the original run precisely."},
    {"title": "Left chest and back options", "description": "Single-colour or full-colour, left chest, centre chest, back print or sleeve branding as standard."},
    {"title": "Split delivery available", "description": "Send to head office for size checking, then we dispatch the final sizes straight to each site."}
  ]'::jsonb,
  '[
    {"step": 1, "title": "Enquire", "description": "Send your role, team size, size breakdown and any hi-vis or reflective requirements. You get pricing within 4 business hours."},
    {"step": 2, "title": "Design proof", "description": "Upload your logo and pick your blanks. We return a digital proof showing placement, scale and colour on the actual garment."},
    {"step": 3, "title": "Production", "description": "We print and press the full run in Mbombela. Logos are positioned by hand for consistency across every piece."},
    {"step": 4, "title": "Delivery", "description": "Packed and couriered nationwide with tracking, or collect at Mbombela. Reorders match the original run exactly."}
  ]'::jsonb,
  '[
    {"q": "Will the logos survive our work laundry cycle?", "a": "Yes. We use bonded DTF transfers that are heat-fused into the fabric rather than sitting on the surface, so they flex with the garment instead of cracking. They are tested to hold through 60-degree commercial washing cycles."},
    {"q": "Can you supply hi-vis and reflective workwear?", "a": "Yes, we supply certified fluoro-yellow and orange garments plus reflective tape options. Send us the compliance standard your site requires and we will confirm the blanks meet it before quoting."},
    {"q": "How do I get sizing right across my team?", "a": "Send a size breakdown (for example 8 medium, 12 large) or individual chest measurements. We cut to those measurements, so people get a fit that works rather than a size that merely matches a chart."},
    {"q": "Can we order extra sizes later without a new proof?", "a": "Yes. We keep your print file and chosen blanks on record, so a later reorder is a quick confirmation rather than a new design process. Additional sizes after the initial run carry no new setup cost."},
    {"q": "Do you supply without printing too?", "a": "Yes. We can supply plain blanks for you to print locally, or supply and print as a single managed order."},
    {"q": "What is the turnaround on a full crew order?", "a": "Typically 5 to 7 business days from artwork approval for runs up to 150 units. Larger or hi-vis orders typically take 7 to 10 business days. The quote states a firm date before you commit."}
  ]'::jsonb,
  '[
    {"slug": "corporate-branded-apparel", "title": "Corporate Branded Apparel", "description": "Printed and pressed staff tees, polos and hoodies for companies and events."},
    {"slug": "branded-promotional-gifts", "title": "Branded Promotional Gifts", "description": "Bags, drinkware and gifts that get used long after the event."},
    {"slug": "/sports-kits/", "title": "Sports Kits & Teamwear", "description": "Sublimated kits from single items to full squad sets."}
  ]'::jsonb,
  '[
    {"slug": "workwear-branding-a-guide-for-sa-construction-trades", "title": "Expert Workwear Branding for SA Businesses"},
    {"slug": "custom-hoodies-south-africa-pricing-fabrics-where-to-print", "title": "Custom Hoodies South Africa: Price & Fabric"},
    {"slug": "how-to-care-for-dtf-printed-apparel", "title": "How to Care for DTF Printed Apparel"}
  ]'::jsonb,
  'published', 2, now(), now()
),

(
  'branded-promotional-gifts',
  'Branded Promotional Gifts South Africa | Corporate Gifting & Branded Merch',
  'Branded promotional gifts and corporate gifting in South Africa — bags, drinkware, lanyards and giveaway items printed with your logo. Bulk pricing, courier nationwide.',
  'branded promotional gifts South Africa, corporate gifting South Africa, branded giveaway items, custom branded bags South Africa, promotional products with logo',
  'Branded Promotional Gifts That Get Used, Not Binned',
  'A branded gift only works if the recipient actually keeps it. We help you pick items people use daily, print them properly, and deliver in time for your event or campaign launch.',
  '<p>The difference between a promotional gift that gets used and one that goes straight in a drawer is material quality and print durability. A thin, badly printed giveaway reads as cheap and reflects on your brand, not the supplier.</p><p>Blank2Branded supplies branded bags, drinkware, lanyards and apparel across South Africa. We stock higher-weight items than you would normally be handed at a trade show, print them in-house with bonded DTF transfers, and courier the lot nationwide.</p>',
  '[
    {"title": "Items people keep", "description": "We stock heavier, better-finished products than trade-show giveaways, so your brand is not associated with a throwaway."},
    {"title": "Print that survives the bag", "description": "Bonded transfers flex with the material instead of cracking when a canvas bag is folded or a bottle is dropped."},
    {"title": "Full-colour possible", "description": "Logos, slogans and multi-colour artwork are all achievable, not limited to single-colour printing."},
    {"title": "Bulk pricing built in", "description": "Volume pricing from 25 units. The more you order, the better the unit cost."},
    {"title": "Event-ready turnaround", "description": "Order 10 business days before your event and we will have it couriered to you in time."},
    {"title": "Kits assembled for you", "description": "We can build a branded gift set per attendee, bagged and labelled, ready to hand out on the day."}
  ]'::jsonb,
  null,
  '[
    {"q": "What is the minimum order for branded gifts?", "a": "25 units per item is where volume pricing really kicks in. Below that, printing setup is spread over too few units. We will quote honestly and tell you if a different product suits your budget better."},
    {"q": "Can you assemble personalised gift sets?", "a": "Yes. We can build sets per attendee with individual name printing, bagged and labelled, ready to hand out. This is popular for conferences and client gifts — mention it in your enquiry and we will price the extra step."},
    {"q": "How do you match my brand colours on printed products?", "a": "Send brand guidelines or a Pantone reference and we colour-match before the proof. Be aware that printing onto coloured fabric shifts perceived colour slightly; we will flag any problematic combinations before production."},
    {"q": "How far ahead should I order for an event?", "a": "Ten business days is comfortable for most items, which gives time for the proof, any corrections and courier. For large runs or multi-product kits, allow two to three weeks. Tell us your event date and we will work backwards from it."},
    {"q": "Do you deliver branded gifts nationwide?", "a": "Yes, we courier across South Africa with tracking on every parcel. For very large orders in Gauteng, the Mpumalanga and KwaZulu-Natal, we can arrange a bulk freight quote."},
    {"q": "Can I see samples before committing to a large order?", "a": "Yes, ask for samples when you enquire. We will send a printed sample of your chosen item so you can judge the material and print quality before committing to volume."}
  ]'::jsonb,
  '[
    {"slug": "corporate-branded-apparel", "title": "Corporate Branded Apparel", "description": "Printed and pressed staff tees, polos and hoodies."},
    {"slug": "custom-uniforms-and-workwear", "title": "Custom Uniforms & Workwear", "description": "Garments built for daily wear on site and in the field."},
    {"slug": "/catalogues/", "title": "Branded Gifts Catalogue", "description": "Browse the full range of gifts, bags and drinkware."}
  ]'::jsonb,
  '[
    {"slug": "corporate-gifts-south-africa-2026-buyers-guide-for-smes", "title": "Corporate Gifts South Africa: 2026 SME Guide"},
    {"slug": "top-branded-bags-every-business-should-consider", "title": "Top Branded Bags Every Business Needs in SA"},
    {"slug": "where-to-find-bulk-custom-promotional-products-for-small-businesses-in-south-africa", "title": "Bulk Custom Promotional Products for Small Businesses"},
    {"slug": "promotional-gifts-that-actually-get-used-and-remembered", "title": "Promotional Gifts That Work: Boost Your Brand in SA"}
  ]'::jsonb,
  'published', 3, now(), now()
);
