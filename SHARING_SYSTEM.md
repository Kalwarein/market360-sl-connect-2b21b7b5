# Market360 Product Sharing System

## Overview
Market360 implements a sophisticated product sharing system that generates rich link previews (Open Graph cards) across all major social media platforms including WhatsApp, Facebook, X (Twitter), Telegram, iMessage, LinkedIn, Pinterest, and more.

## How It Works

### Architecture

1. **Edge Function (`share-product`)**: 
   - Server-side HTML generation with embedded Open Graph meta tags
   - Located at: `supabase/functions/share-product/index.ts`
   - Endpoint: `/share/product/{productId}`
   - Public access (no JWT required)

2. **Share URL Format**:
   ```
   https://yourdomain.com/share/product/{productId}
   ```

3. **Flow**:
   ```
   User clicks Share → Copy share URL → 
   Social platform fetches URL → Edge function returns HTML with OG tags → 
   Platform renders rich preview → User clicks link → Redirects to app
   ```

### Implementation Details

#### Edge Function Features
- Fetches product data from Supabase in real-time
- Generates HTML with comprehensive Open Graph tags
- Includes Twitter Card metadata
- Adds Schema.org Product structured data (for Google rich results)
- Auto-redirects users to the actual product page in the app
- Beautiful fallback page for direct visitors
- Caches responses for 1 hour for performance

#### Supported Metadata
- **Open Graph**: Title, description, image, price, brand, availability
- **Twitter Cards**: Summary with large image, custom labels
- **Schema.org**: Full Product markup with offers
- **WhatsApp**: Optimized image meta tags
- **Pinterest**: Rich Pin support

### Generated Meta Tags

```html
<!-- Primary -->
<meta property="og:type" content="product">
<meta property="og:title" content="Product Title">
<meta property="og:description" content="Product Description">
<meta property="og:image" content="Product Image URL">
<meta property="og:url" content="Share URL">

<!-- Product-Specific -->
<meta property="product:price:amount" content="12500">
<meta property="product:price:currency" content="SLE">
<meta property="product:brand" content="Brand Name">
<meta property="product:availability" content="in stock">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:label1" content="Price">
<meta name="twitter:data1" content="Le 12,500">

<!-- Schema.org -->
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Product Title",
  "offers": {...}
}
</script>
```

## User Experience

### For Sellers
- Click the "Share" button on any product
- Share URL is automatically copied to clipboard
- Toast notification confirms copy with instructions
- Share link works on all platforms

### For Recipients
- Receive a beautiful rich preview card showing:
  - Product image
  - Product title
  - Price
  - Store name
  - Description
- Click opens product in Market360 app
- Instant redirect (0 seconds)
- Fallback page shows while redirecting

## Configuration

### Prerequisites
- Supabase Edge Functions enabled
- Public products table access (for share endpoint)
- Product images hosted and accessible

### Setup
1. Edge function deployed: ✅ `share-product`
2. Config updated: ✅ `verify_jwt = false`
3. Frontend integration: ✅ Share button in ProductDetails
4. Redirects configured: ✅ `public/_redirects`

### Environment Variables
The edge function uses:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Public anon key

## Testing

### Test Checklist
- [ ] Share button copies correct URL format
- [ ] Edge function returns HTML (not JSON)
- [ ] OG meta tags present in HTML source
- [ ] Image URLs are absolute and accessible
- [ ] WhatsApp shows rich preview
- [ ] Facebook shows rich preview
- [ ] Twitter/X shows card
- [ ] Telegram shows preview
- [ ] iMessage shows preview
- [ ] Link redirects to product page
- [ ] Works for unpublished products (returns 404)

### Testing Tools
- **WhatsApp**: Send link in chat, check preview
- **Facebook**: Use [Sharing Debugger](https://developers.facebook.com/tools/debug/)
- **Twitter**: Use [Card Validator](https://cards-dev.twitter.com/validator)
- **LinkedIn**: Use [Post Inspector](https://www.linkedin.com/post-inspector/)
- **Pinterest**: Use [Rich Pins Validator](https://developers.pinterest.com/tools/url-debugger/)
- **General**: View page source, check for meta tags

## Future Enhancements

### Potential Features
- [ ] Custom share images with product + logo overlay
- [ ] Dynamic share text templates
- [ ] Share tracking/analytics
- [ ] QR code generation for offline sharing
- [ ] Share via email functionality
- [ ] Custom share preview for different platforms
- [ ] A/B test different OG images
- [ ] Share statistics dashboard

### Image Generation
Consider adding AI-generated share images:
- Product photo + Market360 branding
- Price badge overlay
- Store logo watermark
- Gradient backgrounds matching product category

## Troubleshooting

### Preview Not Showing
1. Check if edge function is deployed
2. Verify product is published
3. Ensure image URLs are absolute
4. Clear platform cache (FB Debugger, etc.)
5. Check CORS headers

### Redirect Not Working
1. Verify meta refresh tag
2. Check redirect timing (0 seconds)
3. Test in different browsers
4. Verify product URL format

### Performance Issues
1. Check edge function response time
2. Verify image sizes (optimize large images)
3. Review caching headers
4. Monitor Supabase function logs

## Security Considerations

- Edge function has public access (required for social crawlers)
- Only published products are accessible via share URL
- No sensitive data exposed in meta tags
- Product images must be public
- Rate limiting handled by Supabase

## Maintenance

### Regular Checks
- Monitor edge function logs for errors
- Update OG image dimensions if platform requirements change
- Test share previews monthly across platforms
- Review and update Schema.org markup for SEO
- Check for broken product image URLs

### Updates Needed When
- Social platforms change OG requirements
- New sharing platform gains popularity
- Product schema changes
- Image hosting changes
- Domain changes

---

**Last Updated**: November 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
