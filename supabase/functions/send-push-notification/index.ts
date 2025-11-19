import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    // Configure VAPID details for web-push
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    
    webpush.setVapidDetails(
      "mailto:notifications@lazyjobs.ink",
      vapidPublicKey,
      vapidPrivateKey
    );

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

    // Send to all user's devices using web-push library
    let successCount = 0;
    let failCount = 0;

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          // Build subscription object for web-push
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          // Send push notification using web-push library
          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(notificationPayload),
            {
              TTL: 86400, // 24 hours
              urgency: "high",
            }
          );

          console.log(`Push notification sent successfully to ${sub.endpoint.substring(0, 50)}...`);
          successCount++;

          // Update last_used_at for successful notification
          await supabase
            .from("push_subscriptions")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", sub.id);

          return { success: true, subscriptionId: sub.id };
        } catch (error: any) {
          console.error(`Failed to send to ${sub.endpoint.substring(0, 50)}...:`, error);
          failCount++;

          // If subscription is invalid (410 Gone or 404), remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`Removing invalid subscription ${sub.id}`);
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
          }

          throw error;
        }
      })
    );

    // Log successful notification to history
    if (successCount > 0) {
      await supabase.from("notification_history").insert({
        user_id,
        job_id,
        match_score,
        title: notificationPayload.title,
        body: notificationPayload.body,
        icon: notificationPayload.icon,
        badge: notificationPayload.badge,
        data: notificationPayload.data,
        sent_at: new Date().toISOString(),
      });
    }

    console.log(`Push notification results: ${successCount} succeeded, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        message: "Push notifications processed",
        success_count: successCount,
        fail_count: failCount,
        results: results.map((r) => r.status === "fulfilled" ? "success" : "failed"),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-push-notification function:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
