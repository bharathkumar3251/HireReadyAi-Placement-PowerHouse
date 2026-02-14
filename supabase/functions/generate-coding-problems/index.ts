import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function makeProblem(title: string, desc: string, cat: string, diff: string, constraints: string, hints: string[], starterCode: Record<string,string>, testCases: any[], hiddenTestCases: any[]) {
  return { title, description: desc, category: cat, difficulty: diff, constraints, hints, starterCode, testCases, hiddenTestCases };
}

const fallbackProblems: Record<string, Record<string, any[]>> = {
  dsa: {
    easy: [
      makeProblem(
        "Two Sum Target",
        "Problem Statement:\nGiven an array of integers 'nums' and an integer 'target', return indices of the two numbers such that they add up to target. Each input has exactly one solution.\n\nInput Format:\n- First line: array of integers\n- Second line: target integer\n\nOutput Format:\n- Array of two indices\n\nExample 1:\nInput: nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1]\nExplanation: nums[0] + nums[1] = 2 + 7 = 9\n\nExample 2:\nInput: nums = [3, 2, 4], target = 6\nOutput: [1, 2]",
        "dsa", "easy", "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.",
        ["Use a hash map to store seen values", "For each element, check if target - element exists in the map"],
        { javascript: "function twoSum(nums, target) {\n  // Your code here\n  return [];\n}", python: "def two_sum(nums, target):\n    # Your code here\n    return []", cpp: "#include<bits/stdc++.h>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Your code here\n    return {};\n}", java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[]{};\n    }\n}" },
        [{ input: "[2,7,11,15], 9", expectedOutput: "[0,1]" }, { input: "[3,2,4], 6", expectedOutput: "[1,2]" }],
        [{ input: "[3,3], 6", expectedOutput: "[0,1]" }, { input: "[1,5,3,7], 8", expectedOutput: "[1,2]" }]
      ),
      makeProblem(
        "Reverse Words in String",
        "Problem Statement:\nGiven a string 's', reverse the order of words. A word is a sequence of non-space characters separated by spaces.\n\nInput Format:\n- A string with words separated by spaces\n\nOutput Format:\n- String with words in reversed order\n\nExample 1:\nInput: s = \"hello world\"\nOutput: \"world hello\"\n\nExample 2:\nInput: s = \"the sky is blue\"\nOutput: \"blue is sky the\"",
        "dsa", "easy", "1 <= s.length <= 10^4\ns contains only letters and spaces",
        ["Split by spaces", "Reverse the resulting array and join"],
        { javascript: "function reverseWords(s) {\n  // Your code here\n  return '';\n}", python: "def reverse_words(s):\n    # Your code here\n    return ''", cpp: "#include<bits/stdc++.h>\nusing namespace std;\nstring reverseWords(string s) {\n    // Your code here\n    return \"\";\n}", java: "class Solution {\n    public String reverseWords(String s) {\n        // Your code here\n        return \"\";\n    }\n}" },
        [{ input: "\"hello world\"", expectedOutput: "\"world hello\"" }, { input: "\"the sky is blue\"", expectedOutput: "\"blue is sky the\"" }],
        [{ input: "\"a\"", expectedOutput: "\"a\"" }]
      ),
      makeProblem(
        "Count Frequency of Elements",
        "Problem Statement:\nGiven an array of integers, return a mapping of each element to its frequency.\n\nInput Format:\n- Array of integers\n\nOutput Format:\n- Object/Map with element as key, count as value\n\nExample 1:\nInput: [1, 2, 2, 3, 3, 3]\nOutput: {1: 1, 2: 2, 3: 3}\n\nExample 2:\nInput: [5, 5, 5]\nOutput: {5: 3}",
        "dsa", "easy", "1 <= arr.length <= 10^5",
        ["Use a hash map", "Iterate once through the array"],
        { javascript: "function countFrequency(arr) {\n  // Your code here\n  return {};\n}", python: "def count_frequency(arr):\n    # Your code here\n    return {}", cpp: "#include<bits/stdc++.h>\nusing namespace std;\nmap<int,int> countFrequency(vector<int>& arr) {\n    // Your code here\n    return {};\n}", java: "class Solution {\n    public Map<Integer,Integer> countFrequency(int[] arr) {\n        // Your code here\n        return new HashMap<>();\n    }\n}" },
        [{ input: "[1,2,2,3,3,3]", expectedOutput: "{1:1,2:2,3:3}" }],
        [{ input: "[7]", expectedOutput: "{7:1}" }]
      ),
    ],
    medium: [
      makeProblem(
        "Longest Substring Without Repeating Characters",
        "Problem Statement:\nGiven a string 's', find the length of the longest substring without repeating characters.\n\nInput Format:\n- A string s\n\nOutput Format:\n- An integer representing the length\n\nExample 1:\nInput: s = \"abcabcbb\"\nOutput: 3\nExplanation: The longest substring is \"abc\", length 3.\n\nExample 2:\nInput: s = \"bbbbb\"\nOutput: 1\n\nExample 3:\nInput: s = \"pwwkew\"\nOutput: 3",
        "dsa", "medium", "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols",
        ["Use sliding window technique", "Use a Set to track characters in the current window"],
        { javascript: "function lengthOfLongest(s) {\n  // Your code here\n  return 0;\n}", python: "def length_of_longest(s):\n    # Your code here\n    return 0", cpp: "#include<bits/stdc++.h>\nusing namespace std;\nint lengthOfLongest(string s) {\n    // Your code here\n    return 0;\n}", java: "class Solution {\n    public int lengthOfLongest(String s) {\n        // Your code here\n        return 0;\n    }\n}" },
        [{ input: "\"abcabcbb\"", expectedOutput: "3" }, { input: "\"bbbbb\"", expectedOutput: "1" }, { input: "\"pwwkew\"", expectedOutput: "3" }],
        [{ input: "\"\"", expectedOutput: "0" }, { input: "\"au\"", expectedOutput: "2" }]
      ),
      makeProblem(
        "Maximum Subarray Sum",
        "Problem Statement:\nGiven an integer array 'nums', find the contiguous subarray with the largest sum and return its sum.\n\nInput Format:\n- Array of integers\n\nOutput Format:\n- Integer (maximum sum)\n\nExample 1:\nInput: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6\nExplanation: Subarray [4,-1,2,1] has largest sum = 6.\n\nExample 2:\nInput: nums = [1]\nOutput: 1",
        "dsa", "medium", "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
        ["Kadane's algorithm", "Track current sum and max sum"],
        { javascript: "function maxSubarraySum(nums) {\n  // Your code here\n  return 0;\n}", python: "def max_subarray_sum(nums):\n    # Your code here\n    return 0", cpp: "#include<bits/stdc++.h>\nusing namespace std;\nint maxSubarraySum(vector<int>& nums) {\n    return 0;\n}", java: "class Solution {\n    public int maxSubarraySum(int[] nums) {\n        return 0;\n    }\n}" },
        [{ input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6" }, { input: "[1]", expectedOutput: "1" }],
        [{ input: "[-1]", expectedOutput: "-1" }, { input: "[5,4,-1,7,8]", expectedOutput: "23" }]
      ),
      makeProblem(
        "Group Anagrams",
        "Problem Statement:\nGiven an array of strings, group the anagrams together. You can return the answer in any order.\n\nInput Format:\n- Array of strings\n\nOutput Format:\n- Array of groups (each group is an array of anagram strings)\n\nExample 1:\nInput: [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]\nOutput: [[\"eat\",\"tea\",\"ate\"],[\"tan\",\"nat\"],[\"bat\"]]\n\nExample 2:\nInput: [\"\"]\nOutput: [[\"\"]]",
        "dsa", "medium", "1 <= strs.length <= 10^4\n0 <= strs[i].length <= 100",
        ["Sort each string and use as hash key", "Group strings with the same sorted key"],
        { javascript: "function groupAnagrams(strs) {\n  // Your code here\n  return [];\n}", python: "def group_anagrams(strs):\n    # Your code here\n    return []", cpp: "#include<bits/stdc++.h>\nusing namespace std;\nvector<vector<string>> groupAnagrams(vector<string>& strs) {\n    return {};\n}", java: "class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        return new ArrayList<>();\n    }\n}" },
        [{ input: "[\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]", expectedOutput: "[[\"eat\",\"tea\",\"ate\"],[\"tan\",\"nat\"],[\"bat\"]]" }],
        [{ input: "[\"\"]", expectedOutput: "[[\"\"]]" }, { input: "[\"a\"]", expectedOutput: "[[\"a\"]]" }]
      ),
    ],
    hard: [
      makeProblem(
        "Median of Two Sorted Arrays",
        "Problem Statement:\nGiven two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log(m+n)).\n\nInput Format:\n- Two sorted arrays of integers\n\nOutput Format:\n- A float representing the median\n\nExample 1:\nInput: nums1 = [1,3], nums2 = [2]\nOutput: 2.0\n\nExample 2:\nInput: nums1 = [1,2], nums2 = [3,4]\nOutput: 2.5",
        "dsa", "hard", "nums1.length == m, nums2.length == n\n0 <= m,n <= 1000\n-10^6 <= nums1[i], nums2[i] <= 10^6",
        ["Use binary search on the smaller array", "Partition both arrays such that left halves contain the smaller half of combined elements"],
        { javascript: "function findMedian(nums1, nums2) {\n  // Your code here\n  return 0.0;\n}", python: "def find_median(nums1, nums2):\n    # Your code here\n    return 0.0", cpp: "#include<bits/stdc++.h>\nusing namespace std;\ndouble findMedian(vector<int>& nums1, vector<int>& nums2) {\n    return 0.0;\n}", java: "class Solution {\n    public double findMedian(int[] nums1, int[] nums2) {\n        return 0.0;\n    }\n}" },
        [{ input: "[1,3], [2]", expectedOutput: "2.0" }, { input: "[1,2], [3,4]", expectedOutput: "2.5" }],
        [{ input: "[], [1]", expectedOutput: "1.0" }, { input: "[2], []", expectedOutput: "2.0" }]
      ),
      makeProblem(
        "Minimum Window Substring",
        "Problem Statement:\nGiven two strings s and t, return the minimum window substring of s such that every character in t (including duplicates) is included. If no such window exists, return empty string.\n\nInput Format:\n- Two strings s and t\n\nOutput Format:\n- Minimum window substring\n\nExample 1:\nInput: s = \"ADOBECODEBANC\", t = \"ABC\"\nOutput: \"BANC\"\n\nExample 2:\nInput: s = \"a\", t = \"aa\"\nOutput: \"\"",
        "dsa", "hard", "1 <= s.length, t.length <= 10^5",
        ["Use sliding window with two pointers", "Track character counts needed vs. found"],
        { javascript: "function minWindow(s, t) {\n  // Your code here\n  return '';\n}", python: "def min_window(s, t):\n    # Your code here\n    return ''", cpp: "#include<bits/stdc++.h>\nusing namespace std;\nstring minWindow(string s, string t) {\n    return \"\";\n}", java: "class Solution {\n    public String minWindow(String s, String t) {\n        return \"\";\n    }\n}" },
        [{ input: "\"ADOBECODEBANC\", \"ABC\"", expectedOutput: "\"BANC\"" }],
        [{ input: "\"a\", \"aa\"", expectedOutput: "\"\"" }, { input: "\"a\", \"a\"", expectedOutput: "\"a\"" }]
      ),
    ]
  },
  web: {
    easy: [
      makeProblem(
        "Parse Query Parameters",
        "Problem Statement:\nWrite a function that takes a URL query string and returns an object with key-value pairs.\n\nInput Format:\n- A query string (without the leading '?')\n\nOutput Format:\n- An object/dictionary of key-value pairs\n\nExample 1:\nInput: \"name=John&age=30&city=NYC\"\nOutput: {name: \"John\", age: \"30\", city: \"NYC\"}\n\nExample 2:\nInput: \"q=hello+world&lang=en\"\nOutput: {q: \"hello+world\", lang: \"en\"}",
        "web", "easy", "Input is a valid query string, keys/values contain alphanumeric and + characters",
        ["Split by '&'", "Then split each pair by '='"],
        { javascript: "function parseQuery(query) {\n  // Your code here\n  return {};\n}", python: "def parse_query(query):\n    # Your code here\n    return {}", cpp: "#include<bits/stdc++.h>\nusing namespace std;\nmap<string,string> parseQuery(string query) {\n    return {};\n}", java: "class Solution {\n    public Map<String,String> parseQuery(String query) {\n        return new HashMap<>();\n    }\n}" },
        [{ input: "\"name=John&age=30\"", expectedOutput: "{\"name\":\"John\",\"age\":\"30\"}" }],
        [{ input: "\"a=1\"", expectedOutput: "{\"a\":\"1\"}" }]
      ),
    ],
    medium: [
      makeProblem(
        "Debounce Function Implementation",
        "Problem Statement:\nImplement a debounce function that delays invoking a callback until after 'wait' milliseconds have elapsed since the last time the debounced function was called.\n\nInput Format:\n- A callback function and wait time in ms\n\nOutput Format:\n- A debounced function\n\nExample:\nconst debounced = debounce(fn, 300);\ndebounced(); debounced(); debounced();\n// fn is called only once, 300ms after the last call",
        "web", "medium", "wait >= 0",
        ["Use setTimeout and clearTimeout", "Store the timer reference in a closure"],
        { javascript: "function debounce(fn, wait) {\n  // Your code here\n}", python: "import threading\ndef debounce(fn, wait):\n    # Your code here\n    pass", cpp: "// Debounce concept is language-specific\n// Implement a timer-based wrapper", java: "// Use ScheduledExecutorService\nclass Debouncer {\n    // Your code here\n}" },
        [{ input: "3 rapid calls, wait=300ms", expectedOutput: "fn called once after 300ms" }],
        [{ input: "1 call, wait=100ms", expectedOutput: "fn called once after 100ms" }]
      ),
    ],
    hard: [
      makeProblem(
        "Build a Virtual DOM Differ",
        "Problem Statement:\nGiven two virtual DOM tree representations (nested objects with type, props, children), compute the minimal list of operations (CREATE, REMOVE, REPLACE, UPDATE_PROPS) needed to transform tree A into tree B.\n\nInput Format:\n- Two JSON objects representing virtual DOM trees\n\nOutput Format:\n- Array of patch operations\n\nExample:\nInput: A = {type:'div', children:[{type:'p'}]}, B = {type:'div', children:[{type:'span'}]}\nOutput: [{op:'REPLACE', path:[0], node:{type:'span'}}]",
        "web", "hard", "Tree depth <= 20, max 1000 nodes",
        ["Use recursive DFS", "Compare node types first, then props, then recurse into children"],
        { javascript: "function diff(oldTree, newTree) {\n  // Your code here\n  return [];\n}", python: "def diff(old_tree, new_tree):\n    # Your code here\n    return []", cpp: "// Implement tree diffing with structs", java: "class Solution {\n    public List<Map<String,Object>> diff(Map oldTree, Map newTree) {\n        return new ArrayList<>();\n    }\n}" },
        [{ input: "{type:'div',children:[{type:'p'}]}, {type:'div',children:[{type:'span'}]}", expectedOutput: "[{op:'REPLACE',path:[0]}]" }],
        [{ input: "{type:'div'}, {type:'div'}", expectedOutput: "[]" }]
      ),
    ]
  },
  logic: {
    easy: [
      makeProblem(
        "Digital Root Calculator",
        "Problem Statement:\nFind the digital root of a non-negative integer. Repeatedly sum digits until a single digit remains.\n\nInput Format:\n- A non-negative integer n\n\nOutput Format:\n- Single digit (0-9)\n\nExample 1:\nInput: 9875\nOutput: 2\nExplanation: 9+8+7+5=29 → 2+9=11 → 1+1=2\n\nExample 2:\nInput: 0\nOutput: 0",
        "logic", "easy", "0 <= n <= 10^18",
        ["Can be solved with modular arithmetic", "Think about n % 9"],
        { javascript: "function digitalRoot(n) {\n  // Your code here\n  return 0;\n}", python: "def digital_root(n):\n    # Your code here\n    return 0", cpp: "#include<bits/stdc++.h>\nusing namespace std;\nint digitalRoot(long long n) {\n    return 0;\n}", java: "class Solution {\n    public int digitalRoot(long n) {\n        return 0;\n    }\n}" },
        [{ input: "9875", expectedOutput: "2" }, { input: "0", expectedOutput: "0" }],
        [{ input: "123456789", expectedOutput: "9" }, { input: "9", expectedOutput: "9" }]
      ),
    ],
    medium: [
      makeProblem(
        "Valid Sudoku Checker",
        "Problem Statement:\nDetermine if a 9x9 Sudoku board is valid. Only filled cells need to be validated. Each row, column, and 3x3 sub-box must contain digits 1-9 without repetition.\n\nInput Format:\n- 9x9 2D array (use '.' for empty cells)\n\nOutput Format:\n- Boolean (true/false)\n\nExample:\nInput: A valid partial board\nOutput: true",
        "logic", "medium", "board is 9x9, cells are digits '1'-'9' or '.'",
        ["Use sets to track seen numbers per row, column, and box", "Box index = (row/3)*3 + col/3"],
        { javascript: "function isValidSudoku(board) {\n  // Your code here\n  return false;\n}", python: "def is_valid_sudoku(board):\n    # Your code here\n    return False", cpp: "#include<bits/stdc++.h>\nusing namespace std;\nbool isValidSudoku(vector<vector<char>>& board) {\n    return false;\n}", java: "class Solution {\n    public boolean isValidSudoku(char[][] board) {\n        return false;\n    }\n}" },
        [{ input: "valid board", expectedOutput: "true" }],
        [{ input: "board with duplicate in row", expectedOutput: "false" }]
      ),
    ],
    hard: [
      makeProblem(
        "N-Queens Solver",
        "Problem Statement:\nPlace N queens on an N×N chessboard so that no two queens attack each other. Return all distinct solutions.\n\nInput Format:\n- Integer n\n\nOutput Format:\n- Array of solutions, each solution is an array of strings representing the board ('Q' for queen, '.' for empty)\n\nExample:\nInput: n = 4\nOutput: [[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"],[\"..Q.\",\"Q...\",\"...Q\",\".Q..\"]]",
        "logic", "hard", "1 <= n <= 9",
        ["Use backtracking", "Track columns and diagonals under attack"],
        { javascript: "function solveNQueens(n) {\n  // Your code here\n  return [];\n}", python: "def solve_n_queens(n):\n    # Your code here\n    return []", cpp: "#include<bits/stdc++.h>\nusing namespace std;\nvector<vector<string>> solveNQueens(int n) {\n    return {};\n}", java: "class Solution {\n    public List<List<String>> solveNQueens(int n) {\n        return new ArrayList<>();\n    }\n}" },
        [{ input: "4", expectedOutput: "2 solutions" }],
        [{ input: "1", expectedOutput: "[[\"Q\"]]" }]
      ),
    ]
  },
  ai: {
    easy: [
      makeProblem(
        "Moving Average from Data Stream",
        "Problem Statement:\nImplement a class that computes the moving average of the last K elements from a stream of numbers.\n\nInput Format:\n- Initialize with window size K\n- Call next(val) with each new value\n\nOutput Format:\n- Return current moving average after each call\n\nExample:\nMovingAverage(3)\nnext(1) → 1.0\nnext(10) → 5.5\nnext(3) → 4.67\nnext(5) → 6.0",
        "ai", "easy", "1 <= k <= 10^4, values are integers",
        ["Use a queue/deque", "Maintain a running sum"],
        { javascript: "class MovingAverage {\n  constructor(k) {\n    // Your code here\n  }\n  next(val) {\n    // Your code here\n    return 0;\n  }\n}", python: "class MovingAverage:\n    def __init__(self, k):\n        pass\n    def next(self, val):\n        return 0.0", cpp: "#include<bits/stdc++.h>\nusing namespace std;\nclass MovingAverage {\npublic:\n    MovingAverage(int k) {}\n    double next(int val) { return 0.0; }\n};", java: "class MovingAverage {\n    public MovingAverage(int k) {}\n    public double next(int val) { return 0.0; }\n}" },
        [{ input: "k=3, vals=[1,10,3,5]", expectedOutput: "[1.0,5.5,4.67,6.0]" }],
        [{ input: "k=1, vals=[5,10]", expectedOutput: "[5.0,10.0]" }]
      ),
    ],
    medium: [
      makeProblem(
        "K-Nearest Neighbors Classifier",
        "Problem Statement:\nImplement a simple KNN classifier. Given labeled training points in 2D space and a query point, return the most common label among the K nearest training points (by Euclidean distance).\n\nInput Format:\n- Training data: array of [x, y, label]\n- Query point: [x, y]\n- K: integer\n\nOutput Format:\n- Predicted label (string)\n\nExample:\nInput: data=[[0,0,'A'],[1,1,'A'],[5,5,'B'],[6,6,'B']], query=[2,2], k=2\nOutput: 'A'",
        "ai", "medium", "1 <= K <= training data size <= 10^4",
        ["Compute Euclidean distance to all points", "Sort by distance, take top K, majority vote"],
        { javascript: "function knn(data, query, k) {\n  // Your code here\n  return '';\n}", python: "def knn(data, query, k):\n    # Your code here\n    return ''", cpp: "#include<bits/stdc++.h>\nusing namespace std;\nstring knn(vector<tuple<double,double,string>>& data, pair<double,double> query, int k) {\n    return \"\";\n}", java: "class Solution {\n    public String knn(double[][] data, String[] labels, double[] query, int k) {\n        return \"\";\n    }\n}" },
        [{ input: "data=[[0,0,'A'],[1,1,'A'],[5,5,'B'],[6,6,'B']], query=[2,2], k=2", expectedOutput: "'A'" }],
        [{ input: "data=[[0,0,'X']], query=[100,100], k=1", expectedOutput: "'X'" }]
      ),
    ],
    hard: [
      makeProblem(
        "Matrix Chain Multiplication Optimizer",
        "Problem Statement:\nGiven dimensions of N matrices in a chain, find the minimum number of scalar multiplications needed to multiply the chain. Matrix i has dimensions dims[i-1] x dims[i].\n\nInput Format:\n- Array of dimensions\n\nOutput Format:\n- Minimum number of multiplications\n\nExample:\nInput: dims = [10, 30, 5, 60]\nOutput: 4500\nExplanation: (A1×A2)×A3 = 10×30×5 + 10×5×60 = 1500+3000 = 4500",
        "ai", "hard", "2 <= dims.length <= 100, 1 <= dims[i] <= 500",
        ["Classic DP problem", "dp[i][j] = min cost to multiply matrices i through j"],
        { javascript: "function matrixChainOrder(dims) {\n  // Your code here\n  return 0;\n}", python: "def matrix_chain_order(dims):\n    # Your code here\n    return 0", cpp: "#include<bits/stdc++.h>\nusing namespace std;\nint matrixChainOrder(vector<int>& dims) {\n    return 0;\n}", java: "class Solution {\n    public int matrixChainOrder(int[] dims) {\n        return 0;\n    }\n}" },
        [{ input: "[10,30,5,60]", expectedOutput: "4500" }],
        [{ input: "[40,20,30,10,30]", expectedOutput: "26000" }]
      ),
    ]
  }
};

function getFallbackProblems(category: string, difficulty: string): any[] {
  return fallbackProblems[category]?.[difficulty] || fallbackProblems["dsa"]?.[difficulty] || fallbackProblems["dsa"]?.["easy"] || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category = "dsa", difficulty = "easy", count = 3 } = await req.json();

    const categoryDescriptions: Record<string, string> = {
      dsa: "Data Structures & Algorithms — arrays, linked lists, trees, graphs, sorting, searching, dynamic programming, greedy algorithms",
      web: "Web Development — DOM manipulation, API design, async patterns, data processing, caching strategies",
      logic: "Logic & Problem Solving — mathematical puzzles, pattern recognition, combinatorics, game theory",
      ai: "AI/Programming — data analysis, machine learning concepts, matrix operations, statistical computations",
    };

    const styleGuide: Record<string, string> = {
      easy: "LeetCode Easy / GeeksforGeeks School level. Clear problem statement, straightforward logic, 1-2 concepts.",
      medium: "LeetCode Medium / HackerRank level. Requires combining 2-3 concepts, optimal time complexity matters.",
      hard: "LeetCode Hard / CodeChef Div1 / competitive programming level. Advanced algorithms, complex edge cases, optimal solutions required.",
    };

    const prompt = `You are a competitive programming problem setter. Generate exactly ${count} ORIGINAL ${difficulty} coding problems for: ${categoryDescriptions[category] || category}.

Style: ${styleGuide[difficulty] || styleGuide["easy"]}

Each problem MUST include ALL of these sections:
1. Problem Statement (clear, unambiguous)
2. Input Format
3. Output Format  
4. Constraints (with mathematical notation)
5. Example test cases with explanations

RESPOND ONLY with a valid JSON array. No markdown, no explanation outside JSON.

[
  {
    "title": "Descriptive Problem Title",
    "description": "Problem Statement:\\nClear description of the task.\\n\\nInput Format:\\n- Describe input format\\n\\nOutput Format:\\n- Describe output format\\n\\nConstraints:\\n- List constraints\\n\\nExample 1:\\nInput: sample input\\nOutput: expected output\\nExplanation: Why this is the answer\\n\\nExample 2:\\nInput: another input\\nOutput: expected output",
    "category": "${category}",
    "difficulty": "${difficulty}",
    "constraints": "Mathematical constraints string",
    "hints": ["Hint 1 about approach", "Hint 2 about optimization"],
    "starterCode": {
      "javascript": "function solve(input) {\\n  // Write your solution here\\n  return null;\\n}",
      "python": "def solve(input):\\n    # Write your solution here\\n    pass",
      "cpp": "#include<bits/stdc++.h>\\nusing namespace std;\\n\\nint solve(vector<int>& input) {\\n    // Write your solution here\\n    return 0;\\n}",
      "java": "class Solution {\\n    public int solve(int[] input) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}"
    },
    "testCases": [
      {"input": "sample input representation", "expectedOutput": "expected output"},
      {"input": "another test", "expectedOutput": "another output"}
    ],
    "hiddenTestCases": [
      {"input": "edge case input", "expectedOutput": "edge case output"},
      {"input": "stress test input", "expectedOutput": "stress test output"}
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
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI gateway error:", response.status, errText);
        throw new Error(`AI gateway returned ${response.status}`);
      }

      const aiData = await response.json();
      let content = aiData.choices?.[0]?.message?.content || "";

      // Extract JSON from code blocks if present
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) content = codeBlockMatch[1];

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title) {
            problems = parsed;
          }
        } catch (e) {
          console.error("JSON parse error:", e);
        }
      }
    } catch (aiError) {
      console.error("AI generation failed, using fallbacks:", aiError);
    }

    // Fallback to built-in problems if AI fails or returns empty
    if (!Array.isArray(problems) || problems.length === 0) {
      console.log(`Using fallback problems for ${category}/${difficulty}`);
      problems = getFallbackProblems(category, difficulty);
    }

    // Validate and sanitize each problem
    problems = problems.map(p => ({
      title: p.title || "Untitled Problem",
      description: p.description || "No description available.",
      category: p.category || category,
      difficulty: p.difficulty || difficulty,
      constraints: p.constraints || "No constraints specified.",
      hints: Array.isArray(p.hints) ? p.hints : [],
      starterCode: p.starterCode || {
        javascript: "function solve() {\n  // Your code here\n}",
        python: "def solve():\n    # Your code here\n    pass",
        cpp: "int solve() {\n    // Your code here\n    return 0;\n}",
        java: "class Solution {\n    public int solve() {\n        return 0;\n    }\n}"
      },
      testCases: Array.isArray(p.testCases) && p.testCases.length > 0 ? p.testCases : [{ input: "sample", expectedOutput: "sample" }],
      hiddenTestCases: Array.isArray(p.hiddenTestCases) ? p.hiddenTestCases : [],
    }));

    return new Response(JSON.stringify({ problems }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    // Even on catastrophic failure, return fallback problems
    const fallback = getFallbackProblems("dsa", "easy");
    return new Response(JSON.stringify({ problems: fallback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
