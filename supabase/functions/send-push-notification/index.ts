import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

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

// Helper to convert base64url to Uint8Array
function base64UrlToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper to convert Uint8Array to base64url
function uint8ArrayToBase64Url(uint8Array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Generate VAPID JWT token
async function generateVapidJWT(
  audience: string,
  publicKey: string,
  privateKey: string
): Promise<string> {
  // Decode VAPID public key (uncompressed EC point: 0x04 || X || Y)
  const publicBytes = base64UrlToUint8Array(publicKey);
  if (publicBytes.length !== 65 || publicBytes[0] !== 4) {
    throw new Error("Invalid VAPID public key format");
  }

  const xBytes = publicBytes.slice(1, 33);
  const yBytes = publicBytes.slice(33, 65);

  const x = uint8ArrayToBase64Url(xBytes);
  const y = uint8ArrayToBase64Url(yBytes);

  const privateJwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x,
    y,
    d: privateKey,
    ext: true,
  };

  // Import the private key as JWK
  const key = await crypto.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // Create JWT header and payload
  const jwtHeader = { typ: "JWT", alg: "ES256" };
  const jwtPayload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: "mailto:notifications@lazyjobs.ink",
  };

  // Encode header and payload
  const encoder = new TextEncoder();
  const headerEncoded = uint8ArrayToBase64Url(
    encoder.encode(JSON.stringify(jwtHeader))
  );
  const payloadEncoded = uint8ArrayToBase64Url(
    encoder.encode(JSON.stringify(jwtPayload))
  );
  const unsignedToken = `${headerEncoded}.${payloadEncoded}`;

  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encoder.encode(unsignedToken)
  );

  const signatureEncoded = uint8ArrayToBase64Url(new Uint8Array(signature));
  return `${unsignedToken}.${signatureEncoded}`;
}

// Encrypt notification payload
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; publicKey: Uint8Array }> {
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payload);
  
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Generate a local key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
  
  // Export the local public key
  const localPublicKeyRaw = await crypto.subtle.exportKey("raw", localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyRaw);
  
  // Import the subscription's public key
  const subscriptionPublicKey = base64UrlToUint8Array(p256dh);
  const importedSubscriptionKey = await crypto.subtle.importKey(
    "raw",
    subscriptionPublicKey as unknown as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  
  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: importedSubscriptionKey },
    localKeyPair.privateKey,
    256
  );
  
  // Import auth secret
  const authSecret = base64UrlToUint8Array(auth);
  
  // Derive encryption key using HKDF
  const info = encoder.encode("Content-Encoding: aes128gcm\0");
  const hkdfKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(sharedSecret),
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );
  
  const keyInfo = new Uint8Array([
    ...authSecret,
    ...new Uint8Array(sharedSecret),
    ...info
  ]);
  
  const contentEncryptionKey = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt,
      info: keyInfo
    },
    hkdfKey,
    128
  );
  
  // Import the derived key for AES-GCM
  const aesKey = await crypto.subtle.importKey(
    "raw",
    contentEncryptionKey,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  
  // Generate a random nonce
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the payload
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    aesKey,
    payloadBytes
  );
  
  return {
    ciphertext: new Uint8Array(ciphertext),
    salt: salt,
    publicKey: localPublicKey
  };
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

    let successCount = 0;
    let failCount = 0;

    // Send to all user's devices
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          // Extract audience from endpoint
          const endpointUrl = new URL(sub.endpoint);
          const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;
          
          // Generate VAPID JWT
          const vapidToken = await generateVapidJWT(
            audience,
            vapidPublicKey,
            vapidPrivateKey
          );
          
          // Encrypt the notification payload
          const payloadString = JSON.stringify(notificationPayload);
          const encrypted = await encryptPayload(payloadString, sub.p256dh, sub.auth);
          
          // Build the request body with proper formatting
          const body = new Uint8Array([
            ...encrypted.salt,
            ...new Uint8Array([0, 0, 0x10, 0x00]), // Record size
            ...new Uint8Array([encrypted.publicKey.length]),
            ...encrypted.publicKey,
            ...encrypted.ciphertext
          ]);

          // Send push notification
          const response = await fetch(sub.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/octet-stream",
              "Content-Encoding": "aes128gcm",
              "Authorization": `vapid t=${vapidToken}, k=${vapidPublicKey}`,
              "TTL": "86400",
              "Urgency": "high",
            },
            body: body,
          });

          if (!response.ok) {
            const responseText = await response.text();
            console.error(`Push failed: ${response.status} ${response.statusText}`, responseText);
            throw new Error(`Push failed with status ${response.status}: ${responseText}`);
          }

          console.log(`Push notification sent successfully to ${sub.endpoint.substring(0, 50)}...`);
          successCount++;

          // Update last_used_at
          await supabase
            .from("push_subscriptions")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", sub.id);

          return { success: true, subscriptionId: sub.id };
        } catch (error: any) {
          console.error(`Failed to send to ${sub.endpoint.substring(0, 50)}...:`, error);
          failCount++;

          // Remove invalid subscriptions
          if (error.message?.includes("410") || error.message?.includes("404")) {
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

    // Log to notification history
    if (successCount > 0) {
      console.log("Attempting to insert notification history...");
      const { data: historyData, error: historyError } = await supabase
        .from("notification_history")
        .insert({
          user_id,
          job_id,
          match_score,
          title: notificationPayload.title,
          body: notificationPayload.body,
          icon: notificationPayload.icon,
          badge: notificationPayload.badge,
          data: notificationPayload.data,
          sent_at: new Date().toISOString(),
        })
        .select();

      if (historyError) {
        console.error("Failed to insert notification history:", historyError);
      } else {
        console.log("Notification history inserted successfully:", historyData);
      }
    }

    console.log(`Push notification results: ${successCount} succeeded, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        message: "Push notifications processed",
        success_count: successCount,
        fail_count: failCount,
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
