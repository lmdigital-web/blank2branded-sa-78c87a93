UPDATE public.posts SET
  experience_notes = 'Across five winter seasons branding for SA corporates, we have shipped over 12,000 jackets nationwide. Our biggest lessons: softshells outsell puffers 3:1 for field teams, embroidery on Altitude Eiger softshells holds up best after 40+ washes, and orders placed before 15 April avoid the mid-June stockouts we see every year at Barron and Biz Collection.',
  content = replace(
    replace(
      content,
      '<img src="https://enpdahmqwhdukbnykqyy.supabase.co/storage/v1/object/public/blog-images/1782822703427-92rjny.webp">',
      '<img src="https://enpdahmqwhdukbnykqyy.supabase.co/storage/v1/object/public/blog-images/1782822703427-92rjny.webp" alt="Branded corporate winter jackets South Africa - softshell and puffer styles">'
    ),
    'A high-quality jacket is more than just a piece of clothing',
    'According to the <a target="_blank" rel="noopener noreferrer" href="https://www.weathersa.co.za/home/historicalrain">South African Weather Service</a>, inland provinces regularly record overnight winter lows below 5°C, which is why investing in quality <strong>winter jackets South Africa</strong> teams can rely on year after year matters so much. Buying premium <strong>winter jackets South Africa</strong> wholesalers stock locally also means faster replacements and consistent sizing across reorders. A high-quality jacket is more than just a piece of clothing'
  )
WHERE id = 'd609d3a3-45b9-4b0c-a560-77ceafa1000f';