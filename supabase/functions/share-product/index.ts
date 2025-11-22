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
    console.log('Share Product Request - Full URL:', req.url)
    
    // Extract product ID from query parameter (new approach) or path (fallback)
    let productId = url.searchParams.get('id')
    
    if (!productId) {
      // Fallback: try to extract from path
      const pathParts = url.pathname.split('/').filter(part => part.length > 0)
      productId = pathParts[pathParts.length - 1]
    }
    
    console.log('Product ID:', productId)

    if (!productId || productId.length < 10) {
      console.error('Invalid product ID:', productId)
      return new Response('Product ID required', { status: 400, headers: corsHeaders })
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

    // Fetch product details
    const { data: product, error } = await supabaseClient
      .from('products')
      .select(`
        *,
        stores:store_id (
          store_name,
          logo_url,
          city,
          region
        )
      `)
      .eq('id', productId)
      .eq('published', true)
      .single()

    if (error || !product) {
      console.error('Product fetch error:', error)
      console.error('Product not found for ID:', productId)
      return new Response('Product not found', { status: 404, headers: corsHeaders })
    }
    
    console.log('Product found:', product.title)

    const productTitle = product.title
    const productPrice = `Le ${Number(product.price).toLocaleString()}`
    const storeName = product.stores?.store_name || 'Market360'
    const storeLocation = product.stores?.city && product.stores?.region 
      ? `${product.stores.city}, ${product.stores.region}`
      : 'Sierra Leone'
    
    // Use real product image from database - handle all storage formats
    let productImage = product.images?.[0]
    
    if (productImage) {
      // If it's already a full URL (starts with http/https), use it as-is
      if (productImage.startsWith('http://') || productImage.startsWith('https://')) {
        // Already absolute URL - no changes needed
      } 
      // If it starts with /storage, prepend the Supabase URL
      else if (productImage.startsWith('/storage')) {
        productImage = `${Deno.env.get('SUPABASE_URL')}${productImage}`
      } 
      // If it's just a filename, construct the full storage path
      else {
        productImage = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/product-images/${productImage}`
      }
      
      console.log('✅ Using product image:', productImage)
    } else {
      // Fallback to Market360 default product image if no product image exists
      productImage = `https://rhtqsqpdvawlfqxlagxw.supabase.co/storage/v1/object/public/product-images/default-product-og.png`
      console.log('⚠️ No product image found, using Market360 default image')
    }
    
    // Generate "Market 360" Style Premium Metadata
    const generateMarket360Title = (product: any, storeName: string): string => {
      const maxLength = 60
      let title = product.title
      
      // Extract main benefit based on category and tags
      let benefit = ''
      const category = product.category?.toLowerCase() || ''
      const tags = product.tags || []
      const enhancementTags = product.enhancement_tags || []
      
      // Category-specific benefits
      if (category.includes('gaming') || category.includes('e-sports')) {
        benefit = 'Pro Precision'
      } else if (category.includes('electronics') || category.includes('phone')) {
        benefit = 'Premium Quality'
      } else if (category.includes('fashion') || category.includes('clothing')) {
        benefit = 'Designer Style'
      } else if (category.includes('beauty') || category.includes('cosmetics')) {
        benefit = 'Radiant Results'
      } else if (category.includes('home') || category.includes('appliance')) {
        benefit = 'Smart Living'
      } else if (category.includes('sports') || category.includes('fitness')) {
        benefit = 'Peak Performance'
      } else if (enhancementTags.includes('Trending') || enhancementTags.includes('Hot Drop')) {
        benefit = 'Trending Now'
      } else if (enhancementTags.includes('Luxury') || enhancementTags.includes('Premium')) {
        benefit = 'Luxury Grade'
      } else if (tags.includes('Fast Shipping') || tags.includes('Same Day')) {
        benefit = 'Fast Delivery'
      } else {
        benefit = 'Best Value'
      }
      
      // Format: [Product Name] | [Main Benefit] - M360
      const formatted = `${title} | ${benefit} - M360`
      
      // Truncate if needed while keeping structure
      if (formatted.length > maxLength) {
        const truncateLength = maxLength - benefit.length - 10 // Leave space for benefit and suffix
        const truncatedTitle = title.substring(0, truncateLength).trim()
        return `${truncatedTitle}... | ${benefit} - M360`
      }
      
      return formatted
    }
    
    const generateMarket360Description = (product: any): string => {
      const maxLength = 155
      
      // Power words for premium copy
      const powerWords = ['Pro-grade', 'Premium', 'Elite', 'Professional', 'Advanced', 'Precision-engineered']
      const category = product.category?.toLowerCase() || ''
      const condition = product.condition || ''
      const tags = product.enhancement_tags || product.tags || []
      
      // Select power word based on product attributes
      let powerWord = 'Premium'
      if (condition === 'brand_new') powerWord = 'Pro-grade'
      else if (tags.includes('Luxury')) powerWord = 'Elite'
      else if (tags.includes('Professional')) powerWord = 'Professional'
      else if (category.includes('gaming') || category.includes('tech')) powerWord = 'Precision-engineered'
      
      // Build benefit statement
      let benefitStatement = ''
      if (category.includes('gaming') || category.includes('e-sports')) {
        benefitStatement = 'engineered for peak performance and competitive edge'
      } else if (category.includes('electronics') || category.includes('phone')) {
        benefitStatement = 'delivering exceptional quality and reliability'
      } else if (category.includes('fashion')) {
        benefitStatement = 'crafted for style and sophistication'
      } else if (category.includes('beauty')) {
        benefitStatement = 'formulated for visible results'
      } else if (category.includes('home')) {
        benefitStatement = 'designed for modern living'
      } else {
        benefitStatement = 'built for excellence'
      }
      
      // Add condition qualifier if applicable
      let conditionText = ''
      if (condition === 'brand_new') conditionText = 'Brand new. '
      else if (condition === 'like_new') conditionText = 'Like-new condition. '
      
      // Build final description with power words
      const description = `${powerWord} ${product.title.substring(0, 30)}${product.title.length > 30 ? '...' : ''} ${benefitStatement}. ${conditionText}Shop with confidence.`
      
      // Ensure under character limit
      if (description.length > maxLength) {
        return description.substring(0, maxLength - 3) + '...'
      }
      
      return description
    }
    
    const ogTitle = generateMarket360Title(product, storeName)
    const ogDescription = generateMarket360Description(product)
    
    // Prefer explicit domain passed from the frontend, then fall back to headers, then default
    const domainParam = url.searchParams.get('domain')
    const referer = req.headers.get('referer')
    const origin = req.headers.get('origin')

    
    let appUrl = 'https://market-360sl.vercel.app' // Fallback to production domain
    
    if (domainParam) {
      try {
        const domainUrl = new URL(domainParam)
        appUrl = `${domainUrl.protocol}//${domainUrl.host}`
        console.log('Using domain query param:', appUrl)
      } catch (e) {
        console.error('Failed to parse domain query param:', e)
      }
    } else if (referer) {
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
    
    const productUrl = `${appUrl}/product/${productId}`
    const shareUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/share-product?id=${productId}`

    // If not a crawler, immediately redirect to product page
    if (!isCrawler) {
      console.log('Real user detected - redirecting to product page')
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': productUrl,
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
  <title>${ogTitle}</title>
  <meta name="title" content="${ogTitle}">
  <meta name="description" content="${ogDescription}">
  <meta name="author" content="${storeName}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="product">
  <meta property="og:url" content="${shareUrl}">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDescription}">
  <meta property="og:image" content="${productImage}">
  <meta property="og:image:secure_url" content="${productImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:alt" content="${productTitle} - ${productPrice}">
  <meta property="og:site_name" content="Market360 - Sierra Leone Marketplace">
  <meta property="og:locale" content="en_SL">
  <meta property="product:price:amount" content="${product.price}">
  <meta property="product:price:currency" content="SLL">
  <meta property="product:brand" content="${product.brand || storeName}">
  <meta property="product:availability" content="in stock">
  <meta property="product:condition" content="${product.condition || 'new'}">
  <meta property="product:retailer_item_id" content="${product.product_code || productId}">
  <meta property="product:retailer" content="${storeName}">
  ${product.category ? `<meta property="product:category" content="${product.category}">` : ''}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@Market360">
  <meta name="twitter:creator" content="@Market360">
  <meta name="twitter:url" content="${shareUrl}">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:description" content="${ogDescription}">
  <meta name="twitter:image" content="${productImage}">
  <meta name="twitter:image:alt" content="${productTitle}">
  <meta name="twitter:label1" content="Price">
  <meta name="twitter:data1" content="${productPrice}">
  <meta name="twitter:label2" content="Location">
  <meta name="twitter:data2" content="${storeLocation}">
  
  <!-- WhatsApp Optimization (uses OG tags) -->
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:alt" content="${productTitle} - ${productPrice}">
  <meta property="og:determiner" content="a">
  
  <!-- Telegram Optimization -->
  <meta name="telegram:card" content="summary_large_image">
  <meta name="telegram:title" content="${ogTitle}">
  <meta name="telegram:description" content="${ogDescription}">
  <meta name="telegram:image" content="${productImage}">
  
  <!-- iMessage & Messages -->
  <meta property="al:web:url" content="${productUrl}">
  <meta property="al:ios:url" content="${productUrl}">
  <meta property="al:android:url" content="${productUrl}">
  <meta name="thumbnail" content="${productImage}">
  <meta name="apple-mobile-web-app-title" content="Market360">
  <meta name="apple-mobile-web-app-capable" content="yes">
  
  <!-- Pinterest -->
  <meta name="pinterest-rich-pin" content="true">
  <meta property="og:price:amount" content="${product.price}">
  <meta property="og:price:currency" content="SLL">
  <meta name="pinterest:description" content="${ogDescription}">
  <meta name="pinterest:media" content="${productImage}">
  
  <!-- LinkedIn -->
  <meta property="og:updated_time" content="${new Date().toISOString()}">
  
  <!-- General Social -->
  <meta name="robots" content="index, follow">
  <meta name="googlebot" content="index, follow">
  <link rel="canonical" href="${productUrl}">
  
  <!-- Schema.org Product Markup -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "${productTitle}",
    "image": "${productImage}",
    "description": "${ogDescription}",
    "sku": "${product.product_code || productId}",
    ${product.brand ? `"brand": {
      "@type": "Brand",
      "name": "${product.brand}"
    },` : ''}
    ${product.category ? `"category": "${product.category}",` : ''}
    "offers": {
      "@type": "Offer",
      "url": "${productUrl}",
      "priceCurrency": "SLL",
      "price": "${product.price}",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "${storeName}",
        ${product.stores?.city || product.stores?.region ? `"address": {
          "@type": "PostalAddress",
          ${product.stores?.city ? `"addressLocality": "${product.stores.city}",` : ''}
          ${product.stores?.region ? `"addressRegion": "${product.stores.region}",` : ''}
          "addressCountry": "SL"
        }` : ''}
      }
    }
  }
  </script>
  
  <!-- Instant redirect fallback -->
  <meta http-equiv="refresh" content="0;url=${productUrl}">
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #0B2B22 0%, #0FA86C 50%, #0B8A6D 100%);
      background-size: 400% 400%;
      animation: gradientShift 15s ease infinite;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .container {
      max-width: 700px;
      width: 100%;
      background: linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%);
      border-radius: 32px;
      overflow: hidden;
      box-shadow: 0 30px 90px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
      animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(40px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    .premium-badge {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #0FA86C 0%, #0B8A6D 50%, #0FA86C 100%);
      background-size: 200% 100%;
      animation: shimmer 3s ease infinite;
      z-index: 10;
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .image-container {
      width: 100%;
      height: 450px;
      background: linear-gradient(135deg, #f5f5f5 0%, #e5e7eb 100%);
      position: relative;
      overflow: hidden;
    }
    .image-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.15) 100%);
      z-index: 1;
      pointer-events: none;
    }
    .image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s ease;
    }
    .image-container:hover img {
      transform: scale(1.05);
    }
    .verified-badge {
      position: absolute;
      top: 24px;
      left: 24px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      color: #0FA86C;
      padding: 10px 18px;
      border-radius: 50px;
      font-weight: 700;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 8px 24px rgba(15, 168, 108, 0.3);
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 6px;
      animation: pulse 2s ease infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .verified-badge::before {
      content: '✓';
      display: inline-block;
      width: 18px;
      height: 18px;
      background: #0FA86C;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 18px;
      font-size: 12px;
      font-weight: 900;
    }
    .price-badge {
      position: absolute;
      top: 24px;
      right: 24px;
      background: linear-gradient(135deg, #0FA86C 0%, #0B8A6D 100%);
      color: white;
      padding: 14px 24px;
      border-radius: 50px;
      font-weight: 800;
      font-size: 24px;
      box-shadow: 0 12px 32px rgba(15, 168, 108, 0.5);
      z-index: 2;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 40px;
      position: relative;
    }
    .store-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }
    .store-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #0FA86C 0%, #0B8A6D 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 900;
      font-size: 20px;
      box-shadow: 0 4px 12px rgba(15, 168, 108, 0.3);
    }
    .store-name {
      color: #0FA86C;
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .title {
      font-size: 32px;
      font-weight: 900;
      color: #0B2B22;
      margin-bottom: 16px;
      line-height: 1.2;
      letter-spacing: -0.5px;
    }
    .description {
      font-size: 17px;
      color: #4B5563;
      line-height: 1.7;
      margin-bottom: 28px;
      font-weight: 500;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 28px;
    }
    .feature-chip {
      background: linear-gradient(135deg, #F7F9FB 0%, #EEF2F6 100%);
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      color: #0B2B22;
      text-align: center;
      border: 1px solid rgba(15, 168, 108, 0.1);
    }
    .cta-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .button {
      display: block;
      width: 100%;
      background: linear-gradient(135deg, #0FA86C 0%, #0B8A6D 100%);
      color: white;
      text-align: center;
      padding: 20px 32px;
      border-radius: 16px;
      text-decoration: none;
      font-weight: 700;
      font-size: 17px;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 8px 24px rgba(15, 168, 108, 0.4);
      position: relative;
      overflow: hidden;
    }
    .button::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      transition: left 0.5s;
    }
    .button:hover::before {
      left: 100%;
    }
    .button:hover {
      transform: translateY(-3px);
      box-shadow: 0 16px 40px rgba(15, 168, 108, 0.5);
    }
    .trust-badges {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      padding: 16px;
      background: rgba(15, 168, 108, 0.05);
      border-radius: 12px;
    }
    .trust-badge-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #0B2B22;
    }
    .trust-badge-item::before {
      content: '✓';
      display: inline-block;
      width: 16px;
      height: 16px;
      background: #0FA86C;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 16px;
      font-size: 10px;
    }
    .footer {
      text-align: center;
      padding: 28px;
      background: linear-gradient(to bottom, #F7F9FB 0%, #EEF2F6 100%);
      color: #6B7280;
      font-size: 14px;
      font-weight: 600;
      border-top: 2px solid rgba(15, 168, 108, 0.1);
    }
    .footer-brand {
      color: #0FA86C;
      font-weight: 800;
      font-size: 16px;
      margin-bottom: 8px;
    }
    .loader {
      text-align: center;
      color: #0FA86C;
      font-size: 14px;
      margin-top: 16px;
      font-weight: 600;
      animation: fadeInOut 1.5s ease infinite;
    }
    @keyframes fadeInOut {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="premium-badge"></div>
    <div class="image-container">
      <img src="${productImage}" alt="${productTitle}">
      <div class="verified-badge">Market360</div>
      <div class="price-badge">${productPrice}</div>
    </div>
    <div class="content">
      <div class="store-header">
        <div class="store-icon">${storeName.charAt(0).toUpperCase()}</div>
        <div class="store-name">${storeName}</div>
      </div>
      <h1 class="title">${productTitle}</h1>
      <p class="description">${ogDescription}</p>
      
      <div class="features-grid">
        ${product.moq && product.moq > 1 ? `<div class="feature-chip">MOQ: ${product.moq}</div>` : ''}
        ${product.condition ? `<div class="feature-chip">${product.condition === 'brand_new' ? 'Brand New' : product.condition === 'like_new' ? 'Like New' : 'Quality Verified'}</div>` : ''}
        ${product.category ? `<div class="feature-chip">${product.category}</div>` : ''}
        <div class="feature-chip">Secure Payment</div>
      </div>
      
      <div class="cta-section">
        <a href="${productUrl}" class="button" id="viewBtn">
          🛍️ Shop Now on Market360
        </a>
        <div class="trust-badges">
          <div class="trust-badge-item">Buyer Protection</div>
          <div class="trust-badge-item">Fast Delivery</div>
          <div class="trust-badge-item">Quality Verified</div>
        </div>
      </div>
      <div class="loader" id="loader">Redirecting you now...</div>
    </div>
    <div class="footer">
      <div class="footer-brand">Market360</div>
      Sierra Leone's Premium Marketplace • Shop with Confidence
    </div>
  </div>
  
  <!-- JavaScript redirect as backup -->
  <script>
    // Instant redirect for any real user that sees this page
    window.location.replace('${productUrl}');
  </script>
</body>
</html>`

    console.log('Generating HTML response with title:', productTitle)
    console.log('Image for OG tags:', productImage)
    
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
