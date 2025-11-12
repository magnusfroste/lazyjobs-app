import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestChatRequest {
  message: string;
  useToolCalling: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { message, useToolCalling }: TestChatRequest = await req.json();

    const LLM_API_URL = Deno.env.get("MATCH_LLM_URL");
    const LLM_API_KEY = Deno.env.get("MATCH_LLM_API_KEY");

    if (!LLM_API_URL || !LLM_API_KEY) {
      throw new Error("LLM configuration missing");
    }

    console.log(`Testing LLM endpoint: ${LLM_API_URL}`);
    console.log(`Tool calling: ${useToolCalling}`);
    console.log(`Message: ${message}`);

    const requestBody: any = {
      model: "qwen",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Be concise and clear.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    };

    // Add tool calling if enabled
    if (useToolCalling) {
      requestBody.tools = [
        {
          type: "function",
          function: {
            name: "calculate",
            description: "Perform a simple arithmetic calculation",
            parameters: {
              type: "object",
              properties: {
                a: {
                  type: "number",
                  description: "First number",
                },
                b: {
                  type: "number",
                  description: "Second number",
                },
                operation: {
                  type: "string",
                  enum: ["add", "subtract", "multiply", "divide"],
                  description: "The operation to perform",
                },
              },
              required: ["a", "b", "operation"],
            },
          },
        },
      ];
      requestBody.tool_choice = "auto";
    }

    console.log("Request payload:", JSON.stringify(requestBody, null, 2));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    const response = await fetch(LLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`LLM API error (${response.status}):`, errorText);
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Response received:", JSON.stringify(data, null, 2));
    console.log(`Response time: ${responseTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        responseTime,
        data,
        request: requestBody,
        endpoint: LLM_API_URL,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("Error in test-llm-chat:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        responseTime,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
