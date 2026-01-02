import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type OneSignalRequestBody = {
  user_id?: string;
  title?: string;
  body?: string;
  link_url?: string;
  image_url?: string;
  data?: Record<string, unknown>;
  // accepted but not required; kept for backwards compatibility with callers
  is_broadcast?: boolean;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, title, body, link_url, image_url, data }: OneSignalRequestBody =
      await req.json();

    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID") ?? "";
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error("[OneSignal] Missing credentials", {
        hasAppId: Boolean(ONESIGNAL_APP_ID),
        hasApiKey: Boolean(ONESIGNAL_REST_API_KEY),
      });
      return new Response(
        JSON.stringify({ success: false, error: "OneSignal credentials not configured" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const apiKey = ONESIGNAL_REST_API_KEY;
    const isV2Key = apiKey.startsWith("os_v2_");

    // Build notification payload
    const payload: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title || "Notification" },
      contents: { en: body || "" },
      data: { url: link_url, ...(data ?? {}) },
      // Ensure push route
      target_channel: "push",
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
    };

    // Add image if provided
    if (image_url) {
      payload.big_picture = image_url;
      payload.ios_attachments = { image: image_url };
      payload.chrome_web_image = image_url;
    }

    // Target: specific user OR broadcast
    if (user_id) {
      // Target specific user by external_user_id (Supabase auth.user.id)
      payload.include_aliases = { external_id: [user_id] };
      console.log("[OneSignal] Targeting user:", user_id);
    } else {
      // OneSignal v2 docs use "All Subscribers" for broadcasts
      payload.included_segments = ["All Subscribers"];
      console.log("[OneSignal] Broadcasting to all subscribers");
    }

    const endpoint = isV2Key
      ? "https://api.onesignal.com/notifications?c=push"
      : "https://onesignal.com/api/v1/notifications";

    const authorization = isV2Key ? `Key ${apiKey}` : `Basic ${apiKey}`;

    console.log("[OneSignal] POST", endpoint);
    console.log("[OneSignal] Sending payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    console.log("[OneSignal] API response:", {
      status: response.status,
      ok: response.ok,
      result,
    });

    // OneSignal may return 200 with an "errors" array; treat that as a failure.
    const resultErrors = (result as any)?.errors;
    const hasResultErrors = Array.isArray(resultErrors) && resultErrors.length > 0;

    if (!response.ok || hasResultErrors) {
      console.error("[OneSignal] Delivery failed:", JSON.stringify(result));

      // Return 200 so the client receives structured error data (without triggering a runtime error UI)
      return new Response(
        JSON.stringify({
          success: false,
          status: response.status,
          error: hasResultErrors ? resultErrors : (result as any)?.error || result,
          result,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log("[OneSignal] Success:", JSON.stringify(result));

    return new Response(
      JSON.stringify({
        success: true,
        notification_id: (result as any)?.id,
        recipients: (result as any)?.recipients ?? 0,
        external_id: (result as any)?.external_id,
        result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[OneSignal] Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
