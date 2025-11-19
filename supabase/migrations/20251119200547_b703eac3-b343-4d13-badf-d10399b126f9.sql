-- Add comprehensive product specification fields to products table

-- Target audience and condition
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS target_audience text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS condition text DEFAULT 'brand_new';

-- Variants with color, size, material, style, stock, price per variant
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]'::jsonb;

-- Technical specifications
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS technical_specs jsonb DEFAULT '{}'::jsonb;

-- Shipping and delivery details
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS shipping_details jsonb DEFAULT '{
  "delivery_available": true,
  "estimated_delivery_time": "",
  "shipping_from": "",
  "shipping_method": "",
  "packaging_type": "",
  "return_policy": false
}'::jsonb;

-- Safety and compliance tags
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS safety_tags text[] DEFAULT '{}';

-- Category enhancement tags
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS enhancement_tags text[] DEFAULT '{}';

-- Media (video and 360 images)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS product_video_url text,
ADD COLUMN IF NOT EXISTS spin_images text[] DEFAULT '{}';

-- SEO and discovery
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS seo_keywords text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS product_highlights text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS search_phrases text[] DEFAULT '{}';

-- Seller story
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS seller_story text;

-- Enhanced warranty and support
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS warranty_type text,
ADD COLUMN IF NOT EXISTS support_contact text,
ADD COLUMN IF NOT EXISTS replacement_available boolean DEFAULT false;

-- Eco and sustainability
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS eco_badges text[] DEFAULT '{}';

-- Included in box
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS included_in_box text[] DEFAULT '{}';

-- Custom labels
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS custom_labels text[] DEFAULT '{}';

-- Product requirements
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS product_requirements text;