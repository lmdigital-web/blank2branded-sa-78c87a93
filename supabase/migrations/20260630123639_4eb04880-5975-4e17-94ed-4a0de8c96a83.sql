UPDATE public.posts SET
  experience_notes = 'After five years sourcing blanks from Johannesburg wholesalers for clients nationwide, we have learned which JHB warehouses actually hold consistent dye lots and which only look cheap on the quote. Our buyers visit Fordsburg, Selby and Marlboro monthly; on average Barron 180gsm tees land at R72 ex-VAT in 100-unit runs, and Altitude golfers ship from JHB to Mbombela in 36 hours via courier.',
  content = replace(
    replace(
      replace(
        content,
        '<img src="https://enpdahmqwhdukbnykqyy.supabase.co/storage/v1/object/public/blog-images/1782735762215-5duczt.png">',
        '<img src="https://enpdahmqwhdukbnykqyy.supabase.co/storage/v1/object/public/blog-images/1782735762215-5duczt.png" alt="Clothing factory shops Johannesburg - bulk blank apparel warehouse">'
      ),
      '<img src="https://enpdahmqwhdukbnykqyy.supabase.co/storage/v1/object/public/blog-images/1782735784424-17usur.png">',
      '<img src="https://enpdahmqwhdukbnykqyy.supabase.co/storage/v1/object/public/blog-images/1782735784424-17usur.png" alt="Branded bulk apparel from clothing factory shops Johannesburg - embroidery and DTF samples">'
    ),
    'Navigating the world of wholesale apparel',
    'Gauteng alone accounts for roughly a third of South Africa''s GDP according to <a target="_blank" rel="noopener noreferrer" href="https://www.statssa.gov.za/">Statistics South Africa</a>, which is exactly why so many of the country''s best <strong>clothing factory shops Johannesburg</strong> wholesalers call home are concentrated in this province. Buying from established <strong>clothing factory shops Johannesburg</strong> teams trust also gives you faster reorder windows and tighter colour-matching across batches. Navigating the world of wholesale apparel'
  )
WHERE id = 'a140b5ed-9aa3-4ae0-92be-a096832650d3';