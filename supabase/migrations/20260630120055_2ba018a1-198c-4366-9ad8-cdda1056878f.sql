UPDATE public.posts
SET content = REPLACE(
  content,
  '<h2>Ready to Get Started?</h2>',
  '<h2>Fabric-Specific DTF Care</h2>
<p>Not all blanks behave the same way under repeated washing, so a smart <em>DTF care guide</em> needs to consider the fabric underneath the print. Most of the apparel we supply in South Africa falls into one of three buckets, and each has small tweaks worth knowing.</p>
<h3>100% cotton t-shirts and hoodies</h3>
<p>Cotton is the most forgiving base for DTF. It tolerates cold washes well, dries quickly on the line, and holds print colour beautifully. The main risk is shrinkage on the first hot wash, which can warp the print edges — another reason cold water is non-negotiable for the first three cycles.</p>
<h3>Polyester sports and performance wear</h3>
<p>Polyester is more heat-sensitive than cotton. Avoid any wash above 30°C, never tumble dry, and never iron the printed area directly — the fabric itself can scorch before the print does. For club kit and team jerseys, a quick rinse after each match removes sweat and sunscreen, both of which slowly degrade the adhesive layer.</p>
<h3>Cotton-poly blends and fleece</h3>
<p>Blends and brushed fleece (think pullover hoodies) sit between the two. Stick to cold cycles, air-dry inside-out, and avoid washing with rough items like jeans or zippers that can scratch the print surface in the drum.</p>

<h2>How Long Should a DTF Print Last?</h2>
<p>With proper <strong>custom apparel care</strong>, a quality DTF print should comfortably survive 40–60 wash cycles before showing meaningful wear — and many of our customers report two or three full seasons of weekly use on team kit. The difference between a print that fades in a month and one that lasts years almost always comes down to the first few washes, the drying method, and whether anyone touched it with an iron.</p>
<h3>Signs your care routine is working</h3>
<p>Colours stay rich, edges stay sharp, and the print feels smooth rather than rough or cracked when you run a finger across it. If you''re seeing any of those problems early, revisit the temperature, detergent and drying steps above before assuming it''s a print-quality issue.</p>

<h2>Ready to Get Started?</h2>'
)
WHERE id = 'cf2c12b4-8991-454d-bb4d-cea427d09d53';