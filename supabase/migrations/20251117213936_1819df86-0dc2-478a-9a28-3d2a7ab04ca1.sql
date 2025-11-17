-- Add escrow and delivery fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'holding';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS escrow_amount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispute_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispute_opened_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster order queries
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_escrow_status ON orders(escrow_status);

-- Add RLS policy for admins to view all orders
CREATE POLICY "Admins can view all orders" ON orders
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to update all orders
CREATE POLICY "Admins can update all orders" ON orders
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));