import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
    {"testIndex": 0, "passed": true, "actualOutput": "output", "executionTime": 50}
  ],
  "totalPassed": number,
  "totalTests": number,
  "score": number (0-100),
  "feedback": "brief feedback on code quality",
  "executionTimeMs": number
}`;

    let evaluation = { results: [] as any[], totalPassed: 0, totalTests: allTests.length, score: 0, feedback: "Evaluation completed", executionTimeMs: 0 };

    try {
      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

      if (!response.ok) {
        console.error("AI gateway error:", response.status);
        throw new Error(`AI gateway returned ${response.status}`);
      }

      const aiData = await response.json();
      let content = aiData.choices?.[0]?.message?.content || "";
      
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) content = codeBlockMatch[1];
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          evaluation = JSON.parse(jsonMatch[0]);
        } catch {}
      }
    } catch (aiError) {
      console.error("AI evaluation failed:", aiError);
      // Basic fallback evaluation
      evaluation = {
        results: allTests.map((_, i) => ({ testIndex: i, passed: false, actualOutput: "Could not evaluate", executionTime: 0 })),
        totalPassed: 0,
        totalTests: allTests.length,
        score: 0,
        feedback: "AI evaluation temporarily unavailable. Please try again.",
        executionTimeMs: 0,
      };
    }

    // Save submission
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
    console.error("Function error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
