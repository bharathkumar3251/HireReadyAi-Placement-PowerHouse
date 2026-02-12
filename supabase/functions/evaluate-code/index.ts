import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, language, testCases, hiddenTestCases, problemId, userId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use AI to evaluate code against test cases
    const allTests = [...(testCases || []), ...(hiddenTestCases || [])];
    
    const prompt = `You are a code evaluator. Analyze the following ${language} code and evaluate it against the test cases.

CODE:
\`\`\`${language}
${code}
\`\`\`

TEST CASES:
${allTests.map((t: any, i: number) => `Test ${i + 1}: Input: ${t.input} | Expected Output: ${t.expectedOutput}`).join('\n')}

For each test case, determine if the code would produce the expected output. Consider edge cases and logic errors.

Respond ONLY with valid JSON in this exact format:
{
  "results": [
    {"testIndex": 0, "passed": true, "actualOutput": "output", "executionTime": 50},
    ...
  ],
  "totalPassed": number,
  "totalTests": number,
  "score": number (0-100),
  "feedback": "brief feedback on code quality",
  "executionTimeMs": number
}`;

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
        temperature: 0.1,
      }),
    });

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    
    // Parse JSON from AI response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    let evaluation = { results: [], totalPassed: 0, totalTests: allTests.length, score: 0, feedback: "Evaluation failed", executionTimeMs: 0 };
    
    if (jsonMatch) {
      try {
        evaluation = JSON.parse(jsonMatch[0]);
      } catch {}
    }

    // Save submission to database
    if (userId && problemId) {
      await supabase.from("coding_submissions").insert({
        user_id: userId,
        problem_id: problemId,
        language,
        code,
        status: evaluation.score >= 100 ? "accepted" : evaluation.score > 0 ? "partial" : "failed",
        score: evaluation.score,
        test_results: evaluation.results,
        execution_time_ms: evaluation.executionTimeMs || 0,
      });
    }

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
