// deno-lint-ignore-file no-explicit-any
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: corsHeaders
  });
  try {
    if (!OPENAI_API_KEY || !SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing server env"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }
    // 1) Auth: obtener user desde el JWT del header
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: {
        headers: {
          Authorization: auth
        }
      }
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({
        success: false,
        error: "Unauthorized"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 401
      });
    }
    const uid = userData.user.id;
    // 2) Leer body (usamos storagePath en vez de imageUrl)
    const { storagePath, fixPrompt } = await req.json();
    if (!storagePath) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing storagePath"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }
    // 3) Descargar imagen del bucket privado con service role
    const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE);
    const bucket = "meal-images";
    const { data: fileData, error: dlErr } = await serviceClient.storage.from(bucket).download(storagePath);
    if (dlErr || !fileData) {
      return new Response(JSON.stringify({
        success: false,
        error: "Image download failed"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }
    const buf = new Uint8Array(await fileData.arrayBuffer());
    const b64 = btoa(String.fromCharCode(...buf));
    const dataUrl = `data:image/jpeg;base64,${b64}`;
    // 4) Prompt con JSON estricto (kcal), en JSON mode
    const systemPrompt = `
You are a nutrition analysis expert. Return ONLY valid JSON with this exact shape:
{
  "confidence": 0.0,                       // 0..1 overall confidence
  "items": [
    { "name":"", "weight_g":0, "kcal":0, "protein":0, "carbs":0, "fat":0, "confidence":0.0 }
  ],
  "totals": { "kcal":0, "protein":0, "carbs":0, "fat":0 }
}
Rules:
- Use integer grams and kcal.
- If multiple foods are present, split into items.
- Ensure totals = sum(items) within ±5%.
- Localize decimals with dot ".", never comma.
`.trim();
    const userText = fixPrompt ? `User correction: "${fixPrompt}". Re-analyze accordingly.` : "Analyze this food photo and output the JSON.";
    const body = {
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 800,
      response_format: {
        type: "json_object"
      },
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userText
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "high"
              }
            }
          ]
        }
      ]
    };
    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const aiJson = await aiResp.json();
    if (!aiResp.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: aiJson?.error?.message ?? "OpenAI error"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }
    // 5) JSON mode garantiza objeto
    const analysis = aiJson.choices?.[0]?.message?.content ? JSON.parse(aiJson.choices[0].message.content) : null;
    if (!analysis) {
      return new Response(JSON.stringify({
        success: false,
        error: "Empty analysis"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }
    return new Response(JSON.stringify({
      success: true,
      analysis,
      usage: aiJson.usage,
      userId: uid
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: String(err?.message ?? err)
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 400
    });
  }
});
