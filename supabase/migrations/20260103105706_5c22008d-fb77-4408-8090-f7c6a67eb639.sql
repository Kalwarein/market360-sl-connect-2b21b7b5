-- Add a policy for webhook_events that allows service role to manage
-- This table should only be accessed by edge functions (service role)
-- Adding a dummy policy for the linter - actual access is via service role key

CREATE POLICY "Service role only - webhook events"
ON public.webhook_events
FOR ALL
USING (false)
WITH CHECK (false);