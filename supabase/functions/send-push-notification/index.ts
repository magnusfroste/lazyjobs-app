import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Helper function to build VAPID authentication header
async function buildVapidHeader(
  endpoint: string,
  publicKey: string,
  privateKey: string
): Promise<{ authorization: string; cryptoKey: string }> {
  // For simplicity, we'll use a basic VAPID header
  // In production, you'd want to use proper JWT generation
  const vapidKeys = `p256ecdsa=${publicKey}`;
  
  return {
    authorization: `vapid t=eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9,k=${privateKey}`,
    cryptoKey: vapidKeys,
  };
}

interface PushNotificationRequest {
  user_id: string;
  job_id: string;
  match_score: number;
  job_title: string;
  company: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, job_id, match_score, job_title, company }: PushNotificationRequest = await req.json();

    console.log(`Sending push notification for user ${user_id}, job ${job_id}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${user_id}`);
      return new Response(
        JSON.stringify({ message: "No subscriptions found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${subscriptions.length} subscription(s) for user ${user_id}`);

    // Get VAPID keys
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    // Prepare notification payload
    const notificationPayload = {
      title: `New Job Match! ${match_score}%`,
      body: `${job_title} at ${company}`,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: {
        jobId: job_id,
        url: `/swipe?jobId=${job_id}`,
      },
      actions: [
        { action: "open", title: "View Job" },
        { action: "close", title: "Dismiss" },
      ],
    };

    // Send to all user's devices using Web Push Protocol
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          // Build VAPID authentication
          const vapidHeader = await buildVapidHeader(
            sub.endpoint,
            vapidPublicKey,
            vapidPrivateKey
          );

          // Send push notification using fetch
          const response = await fetch(sub.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Encoding": "aes128gcm",
              Authorization: vapidHeader.authorization,
              "Crypto-Key": vapidHeader.cryptoKey,
              TTL: "86400", // 24 hours
            },
            body: JSON.stringify(notificationPayload),
          });

          if (!response.ok) {
            throw new Error(`Push failed with status ${response.status}`);
          }

          console.log(`✅ Notification sent to endpoint: ${sub.endpoint.substring(0, 50)}...`);

          // Update last_used_at
          await supabase
            .from("push_subscriptions")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", sub.id);

          return { success: true, subscriptionId: sub.id };
        } catch (error: any) {
          console.error(`❌ Failed to send to subscription ${sub.id}:`, error.message);

          // If subscription is invalid (410 Gone or 404), remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`Removing invalid subscription ${sub.id}`);
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
          }

          return { success: false, subscriptionId: sub.id, error: error.message };
        }
      })
    );

    const successCount = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
    const failureCount = results.length - successCount;

    console.log(`Push notification results: ${successCount} sent, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        message: "Push notifications processed",
        sent: successCount,
        failed: failureCount,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-push-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
