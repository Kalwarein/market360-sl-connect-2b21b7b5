-- Create table for delivery QR codes
CREATE TABLE public.delivery_qr_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    encrypted_token text NOT NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'scanned', 'expired')),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    scanned_at timestamp with time zone,
    UNIQUE(order_id)
);

-- Create index for faster lookups
CREATE INDEX idx_delivery_qr_order ON public.delivery_qr_codes(order_id);
CREATE INDEX idx_delivery_qr_token ON public.delivery_qr_codes(encrypted_token);
CREATE INDEX idx_delivery_qr_expires ON public.delivery_qr_codes(expires_at) WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.delivery_qr_codes ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own QR codes
CREATE POLICY "Buyers can view own QR codes"
ON public.delivery_qr_codes
FOR SELECT
USING (auth.uid() = buyer_id);

-- Sellers can view QR codes for their orders (for validation)
CREATE POLICY "Sellers can view order QR codes"
ON public.delivery_qr_codes
FOR SELECT
USING (auth.uid() = seller_id);

-- System can insert QR codes (via edge function with service role)
CREATE POLICY "System can insert QR codes"
ON public.delivery_qr_codes
FOR INSERT
WITH CHECK (true);

-- System can update QR codes
CREATE POLICY "System can update QR codes"
ON public.delivery_qr_codes
FOR UPDATE
USING (true);

-- System can delete QR codes
CREATE POLICY "System can delete QR codes"
ON public.delivery_qr_codes
FOR DELETE
USING (true);

-- Admins can view all QR codes
CREATE POLICY "Admins can view all QR codes"
ON public.delivery_qr_codes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create table to log QR scan attempts for security auditing
CREATE TABLE public.qr_scan_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_id uuid,
    order_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    scan_result text NOT NULL CHECK (scan_result IN ('success', 'expired', 'invalid', 'already_scanned', 'wrong_seller', 'not_found')),
    error_message text,
    scanned_at timestamp with time zone NOT NULL DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Index for scan logs
CREATE INDEX idx_qr_scan_logs_order ON public.qr_scan_logs(order_id);
CREATE INDEX idx_qr_scan_logs_seller ON public.qr_scan_logs(seller_id);

-- Enable RLS on scan logs
ALTER TABLE public.qr_scan_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all scan logs
CREATE POLICY "Admins can view all scan logs"
ON public.qr_scan_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert scan logs
CREATE POLICY "System can insert scan logs"
ON public.qr_scan_logs
FOR INSERT
WITH CHECK (true);

-- Function to auto-expire QR codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_qr_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete expired QR codes
    DELETE FROM public.delivery_qr_codes
    WHERE status = 'active'
      AND expires_at < NOW();
      
    -- Also delete scanned codes older than 24 hours
    DELETE FROM public.delivery_qr_codes
    WHERE status = 'scanned'
      AND scanned_at < NOW() - INTERVAL '24 hours';
END;
$$;