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
    .image-container {
      width: 100%;
      height: 400px;
      background: #f5f5f5;
      position: relative;
      overflow: hidden;
    }
    .image-container img {
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
    }
    .store-name {
      color: #0FA86C;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .title {
      font-size: 28px;
      font-weight: 700;
      color: #0B2B22;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    .description {
      font-size: 16px;
      color: #6B7280;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .price-container {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .price {
      font-size: 32px;
      font-weight: 700;
      color: #0FA86C;
    }
    .moq {
      font-size: 14px;
      color: #6B7280;
      padding: 6px 12px;
      background: #F7F9FB;
      border-radius: 8px;
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
    .loader {
      text-align: center;
      color: #6B7280;
      font-size: 14px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="image-container">
      <img src="${productImage}" alt="${productTitle}">
      <div class="badge">Market360</div>
    </div>
      <div class="content">
      <div class="store-name">${storeName}</div>
      <h1 class="title">${productTitle}</h1>
      <p class="description">${ogDescription}</p>
      <div class="price-container">
        <div class="price">${productPrice}</div>
        ${product.moq && product.moq > 1 ? `<div class="moq">MOQ: ${product.moq}</div>` : ''}
      </div>
      <a href="${productUrl}" class="button" id="viewBtn">
        View Product on Market360
      </a>
      <div class="loader" id="loader">Redirecting to app...</div>
    </div>
    <div class="footer">
      🛍️ Shop safely with Market360 - Sierra Leone's trusted marketplace
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
