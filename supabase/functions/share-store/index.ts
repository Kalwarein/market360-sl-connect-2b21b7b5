import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    console.log('Share Store Request - Full URL:', req.url)
    
    // Extract store ID from query parameter
    let storeId = url.searchParams.get('id')
    
    if (!storeId) {
      // Fallback: try to extract from path
      const pathParts = url.pathname.split('/').filter(part => part.length > 0)
      storeId = pathParts[pathParts.length - 1]
    }
    
    console.log('Store ID:', storeId)

    if (!storeId || storeId.length < 10) {
      console.error('Invalid store ID:', storeId)
      return new Response('Store ID required', { status: 400, headers: corsHeaders })
    }

    // Detect if request is from a social media crawler (for link previews only)
    const userAgent = req.headers.get('user-agent') || ''
    const secFetchUser = req.headers.get('sec-fetch-user') || ''
    const isNavigationRequest = secFetchUser === '?1'
    const isCrawlerUserAgent = /bot|crawler|spider|crawling|whatsapp|facebook|twitter|telegram|pinterest|linkedin|slack/i.test(userAgent)
    const isCrawler = isCrawlerUserAgent && !isNavigationRequest
    console.log('User Agent:', userAgent)
    console.log('Sec-Fetch-User:', secFetchUser)
    console.log('Is Navigation Request:', isNavigationRequest)
    console.log('Is Crawler:', isCrawler)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Fetch store details with product count
    const { data: store, error: storeError } = await supabaseClient
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single()

    if (storeError || !store) {
      console.error('Store fetch error:', storeError)
      console.error('Store not found for ID:', storeId)
      return new Response('Store not found', { status: 404, headers: corsHeaders })
    }

    // Get product count for this store
    const { count: productCount } = await supabaseClient
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('published', true)
    
    console.log('Store found:', store.store_name)

    const storeName = store.store_name
    const storeDescription = store.description || `Discover quality products from ${storeName} on Market360`
    const storeLocation = store.city && store.region 
      ? `${store.city}, ${store.region}`
      : 'Sierra Leone'
    
    // Use store logo or banner as share image
    let storeImage = store.logo_url || store.banner_url
    
    if (storeImage) {
      // If it's already a full URL, use it as-is
      if (storeImage.startsWith('http://') || storeImage.startsWith('https://')) {
        // Already absolute URL
      } 
      // If it starts with /storage, prepend the Supabase URL
      else if (storeImage.startsWith('/storage')) {
        storeImage = `${Deno.env.get('SUPABASE_URL')}${storeImage}`
      } 
      // If it's just a filename, construct the full storage path
      else {
        storeImage = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/product-images/${storeImage}`
      }
      
      console.log('✅ Using store image:', storeImage)
    } else {
      // Fallback to Market360 default image
      storeImage = `https://rhtqsqpdvawlfqxlagxw.supabase.co/storage/v1/object/public/product-images/default-product-og.png`
      console.log('⚠️ No store image found, using Market360 default image')
    }
    
    // Dynamically detect the domain from request headers
    const referer = req.headers.get('referer')
    const origin = req.headers.get('origin')
    
    let appUrl = 'https://market-360sl.vercel.app' // Fallback
    
    // Try to extract domain from referer or origin
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        appUrl = `${refererUrl.protocol}//${refererUrl.host}`
        console.log('Using referer domain:', appUrl)
      } catch (e) {
        console.error('Failed to parse referer:', e)
      }
    } else if (origin) {
      try {
        const originUrl = new URL(origin)
        appUrl = `${originUrl.protocol}//${originUrl.host}`
        console.log('Using origin domain:', appUrl)
      } catch (e) {
        console.error('Failed to parse origin:', e)
      }
    }
    
    const storeUrl = `${appUrl}/store/${storeId}`
    const shareUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/share-store?id=${storeId}`

    // If not a crawler, immediately redirect to store page
    if (!isCrawler) {
      console.log('Real user detected - redirecting to store page')
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': storeUrl,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }

    // Generate rich HTML with OG meta tags for crawlers
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${storeName} | Market360 Store</title>
  <meta name="title" content="${storeName} | Market360 Store">
  <meta name="description" content="${storeDescription}">
  <meta name="author" content="${storeName}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="business.business">
  <meta property="og:url" content="${shareUrl}">
  <meta property="og:title" content="${storeName}">
  <meta property="og:description" content="${storeDescription}">
  <meta property="og:image" content="${storeImage}">
  <meta property="og:image:secure_url" content="${storeImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:alt" content="${storeName}">
  <meta property="og:site_name" content="Market360 - Sierra Leone Marketplace">
  <meta property="og:locale" content="en_SL">
  <meta property="business:contact_data:street_address" content="${store.city || 'Sierra Leone'}">
  <meta property="business:contact_data:locality" content="${store.city || ''}">
  <meta property="business:contact_data:region" content="${store.region || ''}">
  <meta property="business:contact_data:country_name" content="Sierra Leone">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@Market360">
  <meta name="twitter:creator" content="@Market360">
  <meta name="twitter:url" content="${shareUrl}">
  <meta name="twitter:title" content="${storeName}">
  <meta name="twitter:description" content="${storeDescription}">
  <meta name="twitter:image" content="${storeImage}">
  <meta name="twitter:image:alt" content="${storeName}">
  <meta name="twitter:label1" content="Products">
  <meta name="twitter:data1" content="${productCount || 0} items">
  <meta name="twitter:label2" content="Location">
  <meta name="twitter:data2" content="${storeLocation}">
  
  <!-- WhatsApp Optimization -->
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:alt" content="${storeName}">
  <meta property="og:determiner" content="">
  
  <!-- Telegram Optimization -->
  <meta name="telegram:card" content="summary_large_image">
  <meta name="telegram:title" content="${storeName}">
  <meta name="telegram:description" content="${storeDescription}">
  <meta name="telegram:image" content="${storeImage}">
  
  <!-- iMessage & Messages -->
  <meta property="al:web:url" content="${storeUrl}">
  <meta property="al:ios:url" content="${storeUrl}">
  <meta property="al:android:url" content="${storeUrl}">
  <meta name="thumbnail" content="${storeImage}">
  <meta name="apple-mobile-web-app-title" content="Market360">
  <meta name="apple-mobile-web-app-capable" content="yes">
  
  <!-- Pinterest -->
  <meta name="pinterest-rich-pin" content="true">
  <meta name="pinterest:description" content="${storeDescription}">
  <meta name="pinterest:media" content="${storeImage}">
  
  <!-- LinkedIn -->
  <meta property="og:updated_time" content="${new Date().toISOString()}">
  
  <!-- General Social -->
  <meta name="robots" content="index, follow">
  <meta name="googlebot" content="index, follow">
  <link rel="canonical" href="${storeUrl}">
  
  <!-- Schema.org Store Markup -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Store",
    "name": "${storeName}",
    "image": "${storeImage}",
    "description": "${storeDescription}",
    ${store.city || store.region ? `"address": {
      "@type": "PostalAddress",
      ${store.city ? `"addressLocality": "${store.city}",` : ''}
      ${store.region ? `"addressRegion": "${store.region}",` : ''}
      "addressCountry": "SL"
    },` : ''}
    "url": "${storeUrl}",
    "priceRange": "$$"
  }
  </script>
  
  <!-- Instant redirect fallback -->
  <meta http-equiv="refresh" content="0;url=${storeUrl}">
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #0FA86C 0%, #0B8A6D 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      width: 100%;
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: fadeIn 0.5s ease-out;
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .banner {
      width: 100%;
      height: 200px;
      background: #f5f5f5;
      position: relative;
      overflow: hidden;
    }
    .banner img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .badge {
      position: absolute;
      top: 16px;
      right: 16px;
      background: #0FA86C;
      color: white;
      padding: 8px 16px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(15, 168, 108, 0.4);
    }
    .content {
      padding: 32px;
      text-align: center;
    }
    .logo {
      width: 100px;
      height: 100px;
      margin: -50px auto 20px;
      border-radius: 16px;
      overflow: hidden;
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      background: white;
    }
    .logo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .store-name {
      font-size: 32px;
      font-weight: 700;
      color: #0B2B22;
      margin-bottom: 12px;
    }
    .location {
      color: #6B7280;
      font-size: 16px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .description {
      font-size: 16px;
      color: #6B7280;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .stats {
      display: flex;
      justify-content: center;
      gap: 32px;
      margin-bottom: 24px;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #0FA86C;
    }
    .stat-label {
      font-size: 14px;
      color: #6B7280;
    }
    .button {
      display: inline-block;
      width: 100%;
      background: linear-gradient(135deg, #0FA86C 0%, #0B8A6D 100%);
      color: white;
      text-align: center;
      padding: 16px 32px;
      border-radius: 16px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(15, 168, 108, 0.3);
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(15, 168, 108, 0.4);
    }
    .footer {
      text-align: center;
      padding: 16px;
      background: #F7F9FB;
      color: #6B7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="banner">
      <img src="${storeImage}" alt="${storeName}">
      <div class="badge">Market360</div>
    </div>
    <div class="content">
      <div class="logo">
        <img src="${store.logo_url || storeImage}" alt="${storeName}">
      </div>
      <h1 class="store-name">${storeName}</h1>
      <div class="location">
        📍 ${storeLocation}
      </div>
      <p class="description">${storeDescription}</p>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${productCount || 0}</div>
          <div class="stat-label">Products</div>
        </div>
        <div class="stat">
          <div class="stat-value">4.8</div>
          <div class="stat-label">Rating</div>
        </div>
      </div>
      <a href="${storeUrl}" class="button" id="viewBtn">
        Visit Store on Market360
      </a>
    </div>
    <div class="footer">
      🛍️ Shop safely with Market360 - Sierra Leone's trusted marketplace
    </div>
  </div>
  
  <!-- JavaScript redirect as backup -->
  <script>
    // Instant redirect for any real user that sees this page
    window.location.replace('${storeUrl}');
  </script>
</body>
</html>`

    console.log('Generating HTML response for store:', storeName)
    console.log('Image for OG tags:', storeImage)
    
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        // Short cache for crawlers only
        'Cache-Control': 'public, max-age=300, must-revalidate',
        'X-Robots-Tag': 'index, follow',
      },
    })
  } catch (error) {
    console.error('Error generating share page:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(`Error: ${errorMessage}`, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    })
  }
})
