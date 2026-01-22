import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a random alphanumeric code in format XXXX-XXXX
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"; // Excluded I, O to avoid confusion
  let code = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += "-";
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Simple hash function for recovery codes (using Web Crypto API)
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.toUpperCase().replace(/-/g, ""));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Hash PIN with salt
async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return salt + ":" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Generate a random salt
function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Verify hashed PIN
async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const computedHash = await hashPin(pin, salt);
  return computedHash === storedHash;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, ...params } = await req.json();
    console.log(`Password recovery action: ${action}`);

    switch (action) {
      case "generate_recovery_codes": {
        // Generate recovery codes for a user (requires auth)
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: "Invalid token" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check regeneration limit
        const { data: profile } = await supabase
          .from("profiles")
          .select("recovery_regeneration_count, recovery_regeneration_month, recovery_setup_completed")
          .eq("id", user.id)
          .single();

        const currentMonth = new Date().getMonth() + 1;
        let regenCount = profile?.recovery_regeneration_count || 0;
        const regenMonth = profile?.recovery_regeneration_month;

        // Reset count if new month
        if (regenMonth !== currentMonth) {
          regenCount = 0;
        }

        // Check if already completed setup and exceeds limit
        if (profile?.recovery_setup_completed && regenCount >= 2) {
          return new Response(
            JSON.stringify({ 
              error: "Regeneration limit reached", 
              message: "You can only regenerate recovery codes 2 times per month" 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate two new codes
        const code1 = generateCode();
        const code2 = generateCode();
        const hash1 = await hashCode(code1);
        const hash2 = await hashCode(code2);

        // Update profile with new codes
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            recovery_code1_hash: hash1,
            recovery_code2_hash: hash2,
            recovery_code_generated_at: new Date().toISOString(),
            recovery_regeneration_count: profile?.recovery_setup_completed ? regenCount + 1 : 0,
            recovery_regeneration_month: currentMonth,
            recovery_setup_completed: true,
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating recovery codes:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to generate codes" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Recovery codes generated for user ${user.id}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            codes: [code1, code2],
            remainingRegenerations: profile?.recovery_setup_completed ? (2 - regenCount - 1) : 2
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "set_pin": {
        // Set PIN for a user (requires auth)
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: "Invalid token" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { pin } = params;
        if (!pin || !/^\d{4,6}$/.test(pin)) {
          return new Response(
            JSON.stringify({ error: "PIN must be 4-6 digits" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const salt = generateSalt();
        const pinHash = await hashPin(pin, salt);

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            pin_hash: pinHash,
            pin_enabled: true,
            pin_attempts: 0,
            pin_locked_until: null,
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error setting PIN:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to set PIN" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`PIN set for user ${user.id}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_recovery_status": {
        // Get recovery status for an email (public endpoint)
        const { email } = params;
        if (!email) {
          return new Response(
            JSON.stringify({ error: "Email required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("pin_enabled, recovery_setup_completed")
          .eq("email", email.toLowerCase())
          .single();

        if (!profile) {
          // Don't reveal if email exists
          return new Response(
            JSON.stringify({ 
              pinEnabled: false, 
              recoveryEnabled: true // Always show recovery as option
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ 
            pinEnabled: profile.pin_enabled || false,
            recoveryEnabled: profile.recovery_setup_completed || false
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "validate_recovery_code": {
        // Validate recovery code for password reset
        const { email, code } = params;
        if (!email || !code) {
          return new Response(
            JSON.stringify({ error: "Email and code required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, recovery_code1_hash, recovery_code2_hash")
          .eq("email", email.toLowerCase())
          .single();

        // Log the attempt
        await supabase.from("recovery_attempts").insert({
          email: email.toLowerCase(),
          attempt_type: "recovery_code",
          success: false,
          ip_address: req.headers.get("x-forwarded-for") || "unknown",
          user_agent: req.headers.get("user-agent") || "unknown",
        });

        if (!profile) {
          return new Response(
            JSON.stringify({ error: "Invalid code" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const codeHash = await hashCode(code);
        const isValid = codeHash === profile.recovery_code1_hash || codeHash === profile.recovery_code2_hash;

        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Invalid code" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update attempt as success
        await supabase
          .from("recovery_attempts")
          .update({ success: true })
          .eq("email", email.toLowerCase())
          .order("created_at", { ascending: false })
          .limit(1);

        // Generate a temporary reset token
        const resetToken = crypto.randomUUID();
        
        // Store token in profile temporarily (valid for 10 minutes)
        await supabase
          .from("profiles")
          .update({
            // Use existing fields or we'll pass via response
          })
          .eq("id", profile.id);

        console.log(`Recovery code validated for email ${email}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            userId: profile.id,
            resetToken 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "validate_pin": {
        // Validate PIN for password reset
        const { email, pin } = params;
        if (!email || !pin) {
          return new Response(
            JSON.stringify({ error: "Email and PIN required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, pin_hash, pin_enabled, pin_attempts, pin_locked_until")
          .eq("email", email.toLowerCase())
          .single();

        // Log the attempt
        await supabase.from("recovery_attempts").insert({
          email: email.toLowerCase(),
          attempt_type: "pin",
          success: false,
          ip_address: req.headers.get("x-forwarded-for") || "unknown",
          user_agent: req.headers.get("user-agent") || "unknown",
        });

        if (!profile || !profile.pin_enabled || !profile.pin_hash) {
          return new Response(
            JSON.stringify({ error: "Invalid PIN" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if locked
        if (profile.pin_locked_until) {
          const lockTime = new Date(profile.pin_locked_until);
          if (lockTime > new Date()) {
            const minutesLeft = Math.ceil((lockTime.getTime() - Date.now()) / 60000);
            return new Response(
              JSON.stringify({ 
                error: "Account locked", 
                message: `Too many attempts. Try again in ${minutesLeft} minutes.` 
              }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        const isValid = await verifyPin(pin, profile.pin_hash);

        if (!isValid) {
          const newAttempts = (profile.pin_attempts || 0) + 1;
          const updates: Record<string, unknown> = { pin_attempts: newAttempts };
          
          if (newAttempts >= 3) {
            // Lock for 30 minutes
            updates.pin_locked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString();
            updates.pin_attempts = 0;
          }

          await supabase
            .from("profiles")
            .update(updates)
            .eq("id", profile.id);

          if (newAttempts >= 3) {
            return new Response(
              JSON.stringify({ 
                error: "Account locked", 
                message: "Too many failed attempts. Account locked for 30 minutes." 
              }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          return new Response(
            JSON.stringify({ 
              error: "Invalid PIN", 
              attemptsRemaining: 3 - newAttempts 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Reset attempts on success
        await supabase
          .from("profiles")
          .update({ pin_attempts: 0, pin_locked_until: null })
          .eq("id", profile.id);

        // Update attempt as success
        await supabase
          .from("recovery_attempts")
          .update({ success: true })
          .eq("email", email.toLowerCase())
          .order("created_at", { ascending: false })
          .limit(1);

        console.log(`PIN validated for email ${email}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            userId: profile.id,
            resetToken: crypto.randomUUID()
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "reset_password": {
        // Reset password using recovery code or PIN validation
        const { email, newPassword, resetToken, userId } = params;
        
        if (!email || !newPassword || !userId) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (newPassword.length < 6) {
          return new Response(
            JSON.stringify({ error: "Password must be at least 6 characters" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update user password using admin API
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: newPassword }
        );

        if (updateError) {
          console.error("Error resetting password:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to reset password" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Password reset successful for user ${userId}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_user_recovery_info": {
        // Get user's own recovery info (requires auth)
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: "Invalid token" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("pin_enabled, recovery_setup_completed, recovery_code_generated_at, recovery_regeneration_count, recovery_regeneration_month")
          .eq("id", user.id)
          .single();

        const currentMonth = new Date().getMonth() + 1;
        let remainingRegenerations = 2;
        
        if (profile?.recovery_regeneration_month === currentMonth) {
          remainingRegenerations = Math.max(0, 2 - (profile.recovery_regeneration_count || 0));
        }

        return new Response(
          JSON.stringify({
            pinEnabled: profile?.pin_enabled || false,
            recoverySetupCompleted: profile?.recovery_setup_completed || false,
            recoveryCodeGeneratedAt: profile?.recovery_code_generated_at,
            remainingRegenerations,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "remove_pin": {
        // Remove PIN (requires auth)
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: "Invalid token" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            pin_hash: null,
            pin_enabled: false,
            pin_attempts: 0,
            pin_locked_until: null,
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error removing PIN:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to remove PIN" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`PIN removed for user ${user.id}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Password recovery error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
