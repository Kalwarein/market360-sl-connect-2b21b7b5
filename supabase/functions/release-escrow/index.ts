import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with service role for bypassing RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { order_id, buyer_id } = await req.json();

    if (!order_id || !buyer_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: order_id, buyer_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[release-escrow] DEPRECATED: Manual release attempted for order: ${order_id}`);

    // SECURITY: Manual escrow release is now DISABLED
    // All escrow releases MUST go through QR-based delivery verification
    // This endpoint is kept for backward compatibility but returns an error

    return new Response(
      JSON.stringify({ 
        error: 'Manual delivery confirmation is disabled. Please use QR code verification for secure delivery confirmation.',
        code: 'QR_REQUIRED'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[release-escrow] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});