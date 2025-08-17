// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL");
const ANON_KEY          = Deno.env.get("SUPABASE_ANON_KEY");
const SERVICE_ROLE      = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const OPENAI_API_KEY    = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...corsHeaders } });
  }

  try {
    if (!OPENAI_API_KEY || !SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing server env" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    // Auth: obtener user desde el JWT
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
      auth:   { persistSession: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }

    const { storagePath, fixPrompt } = await req.json();
    if (!storagePath) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing storagePath" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    // Descargar imagen del bucket (privado recomendado) con service role
    const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const { data: fileData, error: dlErr } = await serviceClient
      .storage
      .from("meal-images")
      .download(storagePath);

    if (dlErr || !fileData) {
      return new Response(
        JSON.stringify({ success: false, error: "Image download failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const ab    = await fileData.arrayBuffer();
    const bytes = new Uint8Array(ab);

    // Blindaje: archivo vacío
    if (!bytes || bytes.byteLength === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Image is empty (0 bytes) or unreadable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const b64         = encodeBase64(bytes);
    const contentType = (fileData as Blob).type || "image/jpeg";
    const dataUrl     = `data:${contentType};base64,${b64}`;

    const systemPrompt = `
You are a nutrition analysis expert. You get a food photo and must output precise, machine-readable nutrition.
Return ONLY valid JSON with this exact shape:
{
  "confidence": 0.0,
  "health_score": 0,
  "items": [
    { "name": "", "weight_g": 0, "kcal": 0, "protein": 0, "carbs": 0, "fat": 0, "confidence": 0.0 }
  ],
  "totals": { "kcal": 0, "protein": 0, "carbs": 0, "fat": 0 }
}
Rules:
- Use integer grams and integer kcal.
- If multiple foods are present, split into items with best-guess weights.
- Ensure totals ≈ sum(items) within ±5%.
- Use dot decimal separator "." (never comma).
- If user provides a correction, obey it and re-estimate weights/macros accordingly.
`.trim();

    const userText = fixPrompt
      ? `User correction: "${fixPrompt}". Re-analyze accordingly and return ONLY the JSON object.`
      : "Analyze this food photo and return ONLY the JSON object described above.";

    const body = {
      model: "gpt-4o",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
    };

    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const aiJson = await aiResp.json();
    if (!aiResp.ok) {
      return new Response(
        JSON.stringify({ success: false, error: aiJson?.error?.message ?? "OpenAI error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const content = aiJson?.choices?.[0]?.message?.content ?? "";
    let analysis: any = null;
    try {
      analysis = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}$/);
      if (m) analysis = JSON.parse(m[0]);
    }
    if (!analysis) {
      return new Response(
        JSON.stringify({ success: false, error: "Empty analysis" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    return new Response(
      JSON.stringify({ success: true, analysis, usage: aiJson.usage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: String(err?.message ?? err) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
