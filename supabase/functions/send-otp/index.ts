import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')!;

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface OtpRequest {
  user_id: string;
  phone_number: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, phone_number }: OtpRequest = await req.json();

    if (!user_id || !phone_number) {
      throw new Error('User ID and phone number are required');
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Normalize phone number to match database format (+232 prefix, no leading zeros)
    let normalizedPhone = phone_number;
    if (normalizedPhone) {
      if (!normalizedPhone.startsWith('+232')) {
        const withoutZeros = normalizedPhone.replace(/^0+/, '');
        normalizedPhone = `+232${withoutZeros}`;
      }
    }

    // Ensure phone number is not already used by another account
    const { data: existingProfiles, error: existingError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', normalizedPhone)
      .neq('id', user_id);

    if (existingError) {
      console.error('Error checking existing phone numbers:', existingError);
      throw new Error('Failed to validate phone number uniqueness');
    }

    if (existingProfiles && existingProfiles.length > 0) {
      throw new Error('This phone number is already linked to another account');
    }

    // Store OTP in database for this user
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        phone_verification_code: otpCode,
        phone_verification_expires_at: expiresAt.toISOString(),
        phone: normalizedPhone, // Trigger will ensure final formatting
      })
      .eq('id', user_id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to store verification code');
    }

    // Send OTP via Twilio SMS
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append('To', phone_number);
    formData.append('From', TWILIO_PHONE_NUMBER);
    formData.append('Body', `Your Market360 verification code is: ${otpCode}\n\nThis code expires in 10 minutes.`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio error:', error);
      throw new Error(`Failed to send OTP: ${error}`);
    }

    const result = await response.json();
    console.log('OTP sent successfully:', result.sid);

    return new Response(
      JSON.stringify({ success: true, message: 'OTP sent successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in send-otp function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
