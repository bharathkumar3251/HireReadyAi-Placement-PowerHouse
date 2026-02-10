import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, domain, messages, sessionId, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "ask") {
      systemPrompt = `You are an expert technical interviewer conducting a ${domain || "general"} interview. Ask one clear, concise interview question. If previous conversation exists, ask a follow-up or new question based on the candidate's performance. Be professional and encouraging.`;
      const history = (messages || []).map((m: any) => `${m.role === "interviewer" ? "Interviewer" : "Candidate"}: ${m.content}`).join("\n");
      userPrompt = history ? `Previous conversation:\n${history}\n\nAsk the next interview question.` : `Start the ${domain} interview with your first question.`;
    } else if (action === "evaluate") {
      systemPrompt = `You are an expert interviewer evaluator. Analyze the interview conversation and provide a detailed evaluation. Return a JSON response with these fields: score (0-100), feedback (detailed text), strengths (array of strings), weaknesses (array of strings), suggestions (array of strings).`;
      const history = (messages || []).map((m: any) => `${m.role === "interviewer" ? "Interviewer" : "Candidate"}: ${m.content}`).join("\n");
      userPrompt = `Evaluate this interview:\n${history}\n\nReturn ONLY valid JSON with score, feedback, strengths, weaknesses, suggestions.`;
    } else if (action === "practice") {
      systemPrompt = `You are an expert question generator for placement preparation. Generate exactly 5 multiple-choice questions for the "${category}" category. Return ONLY valid JSON array with objects containing: question (string), options (array of 4 strings), correct (index 0-3), explanation (string).`;
      userPrompt = `Generate 5 ${category} practice questions. Return ONLY a JSON object with a "questions" array.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits required. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    if (action === "ask") {
      return new Response(JSON.stringify({ question: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For evaluate and practice, try to parse JSON from content
    try {
      // Extract JSON from markdown code blocks if present
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1];
      const parsed = JSON.parse(jsonStr.trim());
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      // Return raw content as feedback
      return new Response(JSON.stringify({ feedback: content, score: 70, strengths: [], weaknesses: [], suggestions: [], questions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
