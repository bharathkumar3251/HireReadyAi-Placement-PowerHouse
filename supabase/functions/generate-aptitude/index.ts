import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, difficulty, count = 10, previousQuestionIds = [] } = await req.json();

    const prompt = `Generate ${count} original ${difficulty} difficulty aptitude questions for the category "${category}".

Categories include: logical reasoning, quantitative aptitude, analytical thinking, pattern recognition, real-world problem solving.

Requirements:
- Each question must be unique and challenging
- Do NOT copy from any existing test bank
- Include 4 options each
- Include the correct answer index (0-3)
- Include a brief explanation
- Make questions progressively harder

${previousQuestionIds.length > 0 ? `Avoid repeating themes from previous questions.` : ''}

Respond ONLY with valid JSON array:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation",
    "difficulty": "${difficulty}",
    "category": "${category}"
  }
]`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const response = await fetch("https://agentic.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
      }),
    });

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "[]";
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    let questions = [];
    if (jsonMatch) {
      try { questions = JSON.parse(jsonMatch[0]); } catch {}
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
