import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

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
    console.log('Full URL:', req.url)
    console.log('Pathname:', url.pathname)
    
    // Extract product ID from various possible URL formats
    const pathParts = url.pathname.split('/').filter(part => part.length > 0)
    const productId = pathParts[pathParts.length - 1]
    
    console.log('Product ID:', productId)

    if (!productId || productId.length < 10) {
      console.error('Invalid product ID:', productId)
      return new Response('Product ID required', { status: 400, headers: corsHeaders })
    }

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
      productImage = `https://${req.headers.get('host')}/default-product-og.png`
      console.log('⚠️ No product image found, using Market360 default image')
    }
    
    // Build rich metadata description with product name and key attributes
    const metaParts = []
    if (product.brand) metaParts.push(`Brand: ${product.brand}`)
    if (product.category) metaParts.push(`Category: ${product.category}`)
    if (product.moq && product.moq > 1) metaParts.push(`MOQ: ${product.moq}`)
    if (product.origin) metaParts.push(`Origin: ${product.origin}`)
    
    const productDescription = metaParts.length > 0 
      ? `${product.title} - ${metaParts.join(' • ')}`
      : `${product.title} - Available on Market360`
    
    const storeName = product.stores?.store_name || 'Market360'
    const storeLocation = product.stores?.city && product.stores?.region 
      ? `${product.stores.city}, ${product.stores.region}`
      : 'Sierra Leone'
    const productUrl = `https://${req.headers.get('host')}/product/${productId}`
    const shareUrl = `https://${req.headers.get('host')}/share/product/${productId}`

    // Generate rich HTML with OG meta tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${productTitle} | ${storeName}</title>
  <meta name="title" content="${productTitle} | ${storeName}">
  <meta name="description" content="${productDescription}">
  <meta name="author" content="${storeName}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="product">
  <meta property="og:url" content="${shareUrl}">
  <meta property="og:title" content="${productTitle} - ${productPrice}">
  <meta property="og:description" content="${productDescription}">
  <meta property="og:image" content="${productImage}">
  <meta property="og:image:secure_url" content="${productImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:alt" content="${productTitle}">
  <meta property="og:site_name" content="Market360 - Sierra Leone's Premier Marketplace">
  <meta property="og:locale" content="en_SL">
  <meta property="product:price:amount" content="${product.price}">
  <meta property="product:price:currency" content="SLL">
  <meta property="product:brand" content="${product.brand || storeName}">
  <meta property="product:availability" content="in stock">
  <meta property="product:condition" content="new">
  <meta property="product:retailer_item_id" content="${productId}">
  ${product.category ? `<meta property="product:category" content="${product.category}">` : ''}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@Market360">
  <meta name="twitter:creator" content="@Market360">
  <meta name="twitter:url" content="${shareUrl}">
  <meta name="twitter:title" content="${productTitle} - ${productPrice}">
  <meta name="twitter:description" content="${productDescription}">
  <meta name="twitter:image" content="${productImage}">
  <meta name="twitter:image:alt" content="${productTitle}">
  <meta name="twitter:label1" content="Price">
  <meta name="twitter:data1" content="${productPrice}">
  <meta name="twitter:label2" content="Location">
  <meta name="twitter:data2" content="${storeLocation}">
  
  <!-- WhatsApp & Telegram Optimization -->
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:alt" content="${productTitle} - ${productPrice}">
  
  <!-- iMessage & LinkedIn -->
  <meta property="al:web:url" content="${productUrl}">
  <meta name="thumbnail" content="${productImage}">
  
  <!-- Schema.org Product Markup -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "${productTitle}",
    "image": "${productImage}",
    "description": "${productDescription}",
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
  
  <!-- Redirect to main app after 0 seconds (instant) -->
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
      <p class="description">${productDescription}</p>
      <div class="price-container">
        <div class="price">${productPrice}</div>
        ${product.moq && product.moq > 1 ? `<div class="moq">MOQ: ${product.moq}</div>` : ''}
      </div>
      <a href="${productUrl}" class="button">
        View Product on Market360
      </a>
      <div class="loader">Redirecting to app...</div>
    </div>
    <div class="footer">
      🛍️ Shop safely with Market360 - Sierra Leone's trusted marketplace
    </div>
  </div>
</body>
</html>`

    console.log('Generating HTML response with title:', productTitle)
    console.log('Image for OG tags:', productImage)
    
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
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
