// deno-lint-ignore-file no-explicit-any
import { serve } from "std/http/server.ts";

/* CORS headers (idénticos a los del helper oficial) */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  /* ───── Pre-flight CORS ───── */
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageUrl, userId, fixPrompt } = await req.json();

    if (!imageUrl || !userId) {
      throw new Error("Missing imageUrl or userId");
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OPENAI_API_KEY not set");

    /* ───── Prompts ───── */
    const systemPrompt = `You are a nutrition analysis expert.
Return ONLY valid JSON matching exactly:
{
  "confidence": 7.5,
  "items": [
    {
      "name": "",
      "weight_g": 0,
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "confidence": 0.9
    }
  ],
  "totals": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
}`;

    const userPrompt = fixPrompt
      ? `User correction: "${fixPrompt}". Re-analyse accordingly.`
      : "Analyse this food image and provide nutritional information.";

    /* ───── Call GPT-4o Vision ───── */
    const chatBody = {
      model: "gpt-4o-vision-preview",
      temperature: 0.2,
      max_tokens: 800,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "high" },
            },
          ],
        },
      ],
    };

    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chatBody),
    });

    const aiJson: any = await aiResp.json();
    if (!aiResp.ok) throw new Error(aiJson.error?.message ?? "OpenAI error");

    /* ───── Clean & parse JSON ───── */
    const raw = (aiJson.choices?.[0]?.message?.content ?? "").trim();
    const jsonStr = raw.startsWith("{") ? raw : raw.slice(raw.indexOf("{"));
    const analysis = JSON.parse(jsonStr);

    return new Response(
      JSON.stringify({ success: true, analysis, usage: aiJson.usage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
