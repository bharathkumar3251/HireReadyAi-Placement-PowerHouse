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
    const { category, difficulty, count = 3 } = await req.json();

    const categoryDescriptions: Record<string, string> = {
      dsa: "Data Structures & Algorithms (arrays, linked lists, trees, graphs, sorting, searching, dynamic programming)",
      web: "Web Development (DOM manipulation, API design, data processing, string operations)",
      logic: "Logic & Problem Solving (mathematical puzzles, pattern matching, string processing)",
      ai: "AI/Programming (data analysis, matrix operations, statistical computations, text processing)",
    };

    const prompt = `Generate ${count} original ${difficulty} coding problems for category: ${categoryDescriptions[category] || category}.

Requirements:
- Problems must be ORIGINAL, not copied from LeetCode/HackerRank
- Include clear problem statement with examples
- Include starter code for JavaScript, Python, C++, and Java
- Include 2-3 visible test cases and 2-3 hidden test cases
- Include constraints

Respond with valid JSON array:
[
  {
    "title": "Problem Title",
    "description": "Full problem description with examples.\\n\\nExample 1:\\nInput: nums = [1,2,3]\\nOutput: 6\\nExplanation: Sum is 1+2+3 = 6",
    "category": "${category}",
    "difficulty": "${difficulty}",
    "constraints": "1 <= n <= 10^5",
    "hints": ["Think about edge cases", "Consider using a hash map"],
    "starterCode": {
      "javascript": "function solve(input) {\\n  // Your code here\\n}",
      "python": "def solve(input):\\n    # Your code here\\n    pass",
      "cpp": "#include<bits/stdc++.h>\\nusing namespace std;\\n\\nint solve(vector<int>& input) {\\n    // Your code here\\n    return 0;\\n}",
      "java": "class Solution {\\n    public int solve(int[] input) {\\n        // Your code here\\n        return 0;\\n    }\\n}"
    },
    "testCases": [
      {"input": "[1,2,3]", "expectedOutput": "6"}
    ],
    "hiddenTestCases": [
      {"input": "[]", "expectedOutput": "0"}
    ]
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
        temperature: 0.7,
      }),
    });

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "[]";
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    let problems = [];
    if (jsonMatch) {
      try { problems = JSON.parse(jsonMatch[0]); } catch {}
    }

    return new Response(JSON.stringify({ problems }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
