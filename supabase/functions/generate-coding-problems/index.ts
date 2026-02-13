import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const fallbackProblems: Record<string, Record<string, any[]>> = {
  dsa: {
    easy: [
      {
        title: "Sum of Pair Closest to Target",
        description: "Given an array of integers and a target value, find two numbers whose sum is closest to the target.\n\nExample 1:\nInput: nums = [1, 4, 7, 10], target = 12\nOutput: [1, 2] (indices of 4 and 7, sum = 11)\n\nExample 2:\nInput: nums = [2, 5, 8, 3], target = 10\nOutput: [1, 2] (indices of 5 and 8, sum = 13 or 2 and 8 = 10)",
        category: "dsa",
        difficulty: "easy",
        constraints: "2 <= nums.length <= 10^4, -10^6 <= nums[i] <= 10^6",
        hints: ["Sort the array first", "Use two pointers from both ends"],
        starterCode: {
          javascript: "function closestPairSum(nums, target) {\n  // Your code here\n  return [];\n}",
          python: "def closest_pair_sum(nums, target):\n    # Your code here\n    return []",
          cpp: "#include<bits/stdc++.h>\nusing namespace std;\nvector<int> closestPairSum(vector<int>& nums, int target) {\n    // Your code here\n    return {};\n}",
          java: "class Solution {\n    public int[] closestPairSum(int[] nums, int target) {\n        // Your code here\n        return new int[]{};\n    }\n}"
        },
        testCases: [
          { input: "[1, 4, 7, 10], 12", expectedOutput: "11" },
          { input: "[2, 5, 8, 3], 10", expectedOutput: "10" }
        ],
        hiddenTestCases: [
          { input: "[-1, 5, 3, 8], 7", expectedOutput: "8" },
          { input: "[1, 2], 5", expectedOutput: "3" }
        ]
      },
      {
        title: "Count Vowel Clusters",
        description: "Given a string, count the number of maximal consecutive vowel clusters.\n\nExample 1:\nInput: s = \"beautiful\"\nOutput: 3 (clusters: \"eau\", \"i\", \"u\")\n\nExample 2:\nInput: s = \"hello\"\nOutput: 2 (clusters: \"e\", \"o\")",
        category: "dsa",
        difficulty: "easy",
        constraints: "1 <= s.length <= 10^5, s contains only lowercase English letters",
        hints: ["Iterate through the string", "Track whether you are inside a vowel cluster"],
        starterCode: {
          javascript: "function countVowelClusters(s) {\n  // Your code here\n  return 0;\n}",
          python: "def count_vowel_clusters(s):\n    # Your code here\n    return 0",
          cpp: "#include<bits/stdc++.h>\nusing namespace std;\nint countVowelClusters(string s) {\n    // Your code here\n    return 0;\n}",
          java: "class Solution {\n    public int countVowelClusters(String s) {\n        // Your code here\n        return 0;\n    }\n}"
        },
        testCases: [
          { input: "\"beautiful\"", expectedOutput: "3" },
          { input: "\"hello\"", expectedOutput: "2" }
        ],
        hiddenTestCases: [
          { input: "\"aeiou\"", expectedOutput: "1" },
          { input: "\"bcdfg\"", expectedOutput: "0" }
        ]
      },
      {
        title: "Flatten Nested Depth",
        description: "Given a nested array of integers, return the sum of all integers weighted by their depth level. Elements at depth 1 are multiplied by 1, depth 2 by 2, etc.\n\nExample 1:\nInput: [1, [2, [3]]]\nOutput: 1*1 + 2*2 + 3*3 = 14\n\nExample 2:\nInput: [[1, 1], 2, [1, 1]]\nOutput: 1*2 + 1*2 + 2*1 + 1*2 + 1*2 = 10",
        category: "dsa",
        difficulty: "easy",
        constraints: "The nesting depth will not exceed 50",
        hints: ["Use recursion", "Pass the current depth as a parameter"],
        starterCode: {
          javascript: "function depthSum(nested) {\n  // Your code here\n  return 0;\n}",
          python: "def depth_sum(nested):\n    # Your code here\n    return 0",
          cpp: "#include<bits/stdc++.h>\nusing namespace std;\n// Use appropriate data structure\nint depthSum(vector<int>& nested) {\n    // Your code here\n    return 0;\n}",
          java: "class Solution {\n    public int depthSum(Object[] nested) {\n        // Your code here\n        return 0;\n    }\n}"
        },
        testCases: [
          { input: "[1, [2, [3]]]", expectedOutput: "14" },
          { input: "[[1, 1], 2, [1, 1]]", expectedOutput: "10" }
        ],
        hiddenTestCases: [
          { input: "[5]", expectedOutput: "5" },
          { input: "[[[[1]]]]", expectedOutput: "4" }
        ]
      }
    ],
    medium: [
      {
        title: "Longest Non-Repeating Window",
        description: "Given an array of integers, find the length of the longest contiguous subarray where no element repeats more than twice.\n\nExample:\nInput: [1, 2, 1, 3, 2, 1]\nOutput: 4 (subarray [2, 1, 3, 2])",
        category: "dsa", difficulty: "medium",
        constraints: "1 <= arr.length <= 10^5",
        hints: ["Use sliding window", "Track element frequencies with a hash map"],
        starterCode: { javascript: "function longestWindow(arr) {\n  return 0;\n}", python: "def longest_window(arr):\n    return 0", cpp: "int longestWindow(vector<int>& arr) {\n    return 0;\n}", java: "class Solution {\n    public int longestWindow(int[] arr) {\n        return 0;\n    }\n}" },
        testCases: [{ input: "[1, 2, 1, 3, 2, 1]", expectedOutput: "4" }],
        hiddenTestCases: [{ input: "[1, 1, 1]", expectedOutput: "2" }]
      }
    ],
    hard: [
      {
        title: "Minimum Cost Path with Teleports",
        description: "Given an N×N grid where each cell has a cost, find the minimum cost path from top-left to bottom-right. You can move right, down, or teleport to any cell with the same value for zero extra cost.\n\nExample:\nInput: grid = [[1,2,3],[4,2,6],[7,8,2]]\nOutput: 5 (path: 1→2→teleport to 2→2 = 1+2+0+2=5)",
        category: "dsa", difficulty: "hard",
        constraints: "1 <= N <= 500",
        hints: ["Model as a graph problem", "Use Dijkstra's algorithm with teleport edges"],
        starterCode: { javascript: "function minCostPath(grid) {\n  return 0;\n}", python: "def min_cost_path(grid):\n    return 0", cpp: "int minCostPath(vector<vector<int>>& grid) {\n    return 0;\n}", java: "class Solution {\n    public int minCostPath(int[][] grid) {\n        return 0;\n    }\n}" },
        testCases: [{ input: "[[1,2,3],[4,2,6],[7,8,2]]", expectedOutput: "5" }],
        hiddenTestCases: [{ input: "[[1,1],[1,1]]", expectedOutput: "2" }]
      }
    ]
  },
  web: {
    easy: [
      {
        title: "Parse Query Parameters",
        description: "Write a function that parses a URL query string into a key-value object.\n\nExample:\nInput: \"name=John&age=30&city=NYC\"\nOutput: {name: \"John\", age: \"30\", city: \"NYC\"}",
        category: "web", difficulty: "easy",
        constraints: "Input will be a valid query string",
        hints: ["Split by '&' first", "Then split each part by '='"],
        starterCode: { javascript: "function parseQuery(query) {\n  return {};\n}", python: "def parse_query(query):\n    return {}", cpp: "map<string,string> parseQuery(string query) {\n    return {};\n}", java: "class Solution {\n    public Map<String,String> parseQuery(String query) {\n        return new HashMap<>();\n    }\n}" },
        testCases: [{ input: "\"name=John&age=30\"", expectedOutput: "{\"name\":\"John\",\"age\":\"30\"}" }],
        hiddenTestCases: [{ input: "\"a=1\"", expectedOutput: "{\"a\":\"1\"}" }]
      }
    ]
  },
  logic: {
    easy: [
      {
        title: "Digital Root Calculator",
        description: "Find the digital root of a number. Repeatedly sum all digits until a single digit remains.\n\nExample:\nInput: 9875\nOutput: 2 (9+8+7+5=29, 2+9=11, 1+1=2)",
        category: "logic", difficulty: "easy",
        constraints: "0 <= n <= 10^18",
        hints: ["Can be solved with modular arithmetic", "Think about n % 9"],
        starterCode: { javascript: "function digitalRoot(n) {\n  return 0;\n}", python: "def digital_root(n):\n    return 0", cpp: "int digitalRoot(long long n) {\n    return 0;\n}", java: "class Solution {\n    public int digitalRoot(long n) {\n        return 0;\n    }\n}" },
        testCases: [{ input: "9875", expectedOutput: "2" }, { input: "0", expectedOutput: "0" }],
        hiddenTestCases: [{ input: "123456789", expectedOutput: "9" }]
      }
    ]
  },
  ai: {
    easy: [
      {
        title: "Moving Average Stream",
        description: "Implement a class that computes the moving average of the last K numbers in a stream.\n\nExample:\nInput: k=3, stream: [1, 10, 3, 5]\nOutputs after each: [1.0, 5.5, 4.67, 6.0]",
        category: "ai", difficulty: "easy",
        constraints: "1 <= k <= 10^4",
        hints: ["Use a queue/deque", "Maintain a running sum"],
        starterCode: { javascript: "class MovingAverage {\n  constructor(k) {}\n  next(val) { return 0; }\n}", python: "class MovingAverage:\n    def __init__(self, k):\n        pass\n    def next(self, val):\n        return 0.0", cpp: "class MovingAverage {\npublic:\n    MovingAverage(int k) {}\n    double next(int val) { return 0.0; }\n};", java: "class MovingAverage {\n    public MovingAverage(int k) {}\n    public double next(int val) { return 0.0; }\n}" },
        testCases: [{ input: "k=3, vals=[1,10,3,5]", expectedOutput: "[1.0, 5.5, 4.67, 6.0]" }],
        hiddenTestCases: [{ input: "k=1, vals=[5,10]", expectedOutput: "[5.0, 10.0]" }]
      }
    ]
  }
};

function getFallbackProblems(category: string, difficulty: string): any[] {
  return fallbackProblems[category]?.[difficulty] || fallbackProblems["dsa"]?.["easy"] || [];
}

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
    
    let problems: any[] = [];
    
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

      if (!response.ok) {
        console.error("AI gateway error:", response.status, await response.text());
        throw new Error(`AI gateway returned ${response.status}`);
      }

      const aiData = await response.json();
      let content = aiData.choices?.[0]?.message?.content || "[]";
      
      // Try extracting from code blocks first
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) content = codeBlockMatch[1];
      
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try { problems = JSON.parse(jsonMatch[0]); } catch (e) {
          console.error("JSON parse error:", e);
        }
      }
    } catch (aiError) {
      console.error("AI call failed, using fallback problems:", aiError);
    }

    // Fallback to built-in problems if AI fails
    if (!problems || problems.length === 0) {
      console.log("Using fallback problems for", category, difficulty);
      problems = getFallbackProblems(category, difficulty);
    }

    return new Response(JSON.stringify({ problems }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message, problems: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
