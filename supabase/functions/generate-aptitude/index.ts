import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const fallbackQuestions: Record<string, any[]> = {
  logical: [
    { question: "If all Bloops are Razzles and all Razzles are Lazzles, are all Bloops definitely Lazzles?", options: ["Yes", "No", "Cannot be determined", "Only some"], correctAnswer: 0, explanation: "This is a classic syllogism. If A⊂B and B⊂C, then A⊂C.", difficulty: "medium", category: "logical" },
    { question: "A clock shows 3:15. What is the angle between the hour and minute hands?", options: ["0°", "7.5°", "15°", "22.5°"], correctAnswer: 1, explanation: "At 3:15, minute hand is at 90°. Hour hand moves 0.5° per minute past the 3 (90°), so hour hand is at 97.5°. Angle = 7.5°.", difficulty: "medium", category: "logical" },
    { question: "What comes next in the sequence: 2, 6, 12, 20, 30, ?", options: ["40", "42", "44", "36"], correctAnswer: 1, explanation: "Differences are 4, 6, 8, 10, 12. So next is 30 + 12 = 42.", difficulty: "medium", category: "logical" },
    { question: "If APPLE is coded as 50 and MANGO is coded as 57, what is GRAPE coded as?", options: ["52", "55", "49", "51"], correctAnswer: 0, explanation: "Sum of letter positions: G(7)+R(18)+A(1)+P(16)+E(5)=47. Adding length 5 = 52.", difficulty: "medium", category: "logical" },
    { question: "In a race, you overtake the person in 2nd place. What position are you now in?", options: ["1st", "2nd", "3rd", "Cannot determine"], correctAnswer: 1, explanation: "You take their position, which is 2nd place.", difficulty: "easy", category: "logical" },
    { question: "A farmer has 17 sheep. All but 9 die. How many are left?", options: ["8", "9", "17", "0"], correctAnswer: 1, explanation: "'All but 9' means 9 survive.", difficulty: "easy", category: "logical" },
    { question: "If you rearrange 'CIFAIPC', you get the name of a(n):", options: ["City", "Animal", "Ocean", "Country"], correctAnswer: 2, explanation: "CIFAIPC rearranges to PACIFIC, which is an ocean.", difficulty: "medium", category: "logical" },
    { question: "Which number should replace the question mark? 3, 9, 27, 81, ?", options: ["162", "243", "216", "324"], correctAnswer: 1, explanation: "Each number is multiplied by 3. 81 × 3 = 243.", difficulty: "easy", category: "logical" },
    { question: "If 5 machines take 5 minutes to make 5 widgets, how long would 100 machines take to make 100 widgets?", options: ["100 minutes", "5 minutes", "20 minutes", "1 minute"], correctAnswer: 1, explanation: "Each machine makes 1 widget in 5 minutes. So 100 machines make 100 widgets in 5 minutes.", difficulty: "medium", category: "logical" },
    { question: "A bat and ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?", options: ["$0.10", "$0.05", "$0.15", "$0.01"], correctAnswer: 1, explanation: "Ball = x, Bat = x + 1.00. x + x + 1.00 = 1.10, so 2x = 0.10, x = $0.05.", difficulty: "medium", category: "logical" }
  ],
  quantitative: [
    { question: "A train 150m long passes a pole in 15 seconds. What is its speed in km/h?", options: ["36 km/h", "10 km/h", "54 km/h", "45 km/h"], correctAnswer: 0, explanation: "Speed = 150/15 = 10 m/s = 10 × 3.6 = 36 km/h.", difficulty: "medium", category: "quantitative" },
    { question: "If the compound interest on a sum for 2 years at 10% p.a. is $210, what is the simple interest?", options: ["$200", "$190", "$210", "$195"], correctAnswer: 0, explanation: "CI = P[(1+r)^n - 1]. SI for same = P×r×n. The difference CI-SI = P×r² = 10. So P=1000, SI=200.", difficulty: "hard", category: "quantitative" },
    { question: "A can do a piece of work in 10 days and B in 15 days. In how many days can they do it together?", options: ["5 days", "6 days", "12.5 days", "7 days"], correctAnswer: 1, explanation: "Combined rate = 1/10 + 1/15 = 5/30 = 1/6. So 6 days.", difficulty: "easy", category: "quantitative" },
    { question: "What is 15% of 20% of 500?", options: ["15", "10", "20", "25"], correctAnswer: 0, explanation: "20% of 500 = 100. 15% of 100 = 15.", difficulty: "easy", category: "quantitative" },
    { question: "The ratio of ages of A and B is 4:3. After 6 years, the ratio will be 5:4. What is A's present age?", options: ["24", "18", "30", "20"], correctAnswer: 0, explanation: "4x+6 / 3x+6 = 5/4. 16x+24 = 15x+30. x=6. A = 4×6 = 24.", difficulty: "medium", category: "quantitative" },
    { question: "A mixture of 40 liters has milk and water in the ratio 3:1. How much water must be added to make the ratio 2:1 (milk:water)?", options: ["5 liters", "10 liters", "15 liters", "20 liters"], correctAnswer: 0, explanation: "Milk = 30L, Water = 10L. For 30/(10+x) = 2/1, 10+x = 15, x = 5.", difficulty: "medium", category: "quantitative" },
    { question: "What is the next prime number after 31?", options: ["33", "35", "37", "39"], correctAnswer: 2, explanation: "37 is the next prime after 31. 33=3×11, 35=5×7, 39=3×13.", difficulty: "easy", category: "quantitative" },
    { question: "A car covers 360 km in 4 hours. If speed is increased by 30 km/h, how long will it take?", options: ["2.5 hours", "3 hours", "2 hours 40 min", "3 hours 20 min"], correctAnswer: 1, explanation: "Original speed = 90 km/h. New speed = 120 km/h. Time = 360/120 = 3 hours.", difficulty: "easy", category: "quantitative" },
    { question: "If x² - 5x + 6 = 0, what are the values of x?", options: ["2 and 3", "1 and 6", "-2 and -3", "3 and -2"], correctAnswer: 0, explanation: "(x-2)(x-3) = 0, so x = 2 or x = 3.", difficulty: "easy", category: "quantitative" },
    { question: "The average of 5 consecutive odd numbers is 41. What is the largest?", options: ["43", "45", "47", "41"], correctAnswer: 1, explanation: "If average is 41, middle number is 41. Sequence: 37, 39, 41, 43, 45. Largest = 45.", difficulty: "medium", category: "quantitative" }
  ],
  analytical: [
    { question: "In a group of 6 people, everyone shakes hands with every other person exactly once. How many handshakes occur?", options: ["12", "15", "18", "30"], correctAnswer: 1, explanation: "C(6,2) = 6!/(2!×4!) = 15.", difficulty: "medium", category: "analytical" },
    { question: "If Monday falls on the 1st of a month, what day will the 23rd be?", options: ["Monday", "Tuesday", "Wednesday", "Thursday"], correctAnswer: 1, explanation: "23-1 = 22 days. 22/7 = 3 weeks + 1 day. So Tuesday.", difficulty: "easy", category: "analytical" },
    { question: "Looking at a portrait, a man says 'This person's father is my father's son.' Who is in the portrait?", options: ["The man himself", "His son", "His father", "His brother"], correctAnswer: 1, explanation: "'My father's son' is himself. So 'this person's father is me' — it's his son.", difficulty: "medium", category: "analytical" },
    { question: "If SEND + MORE = MONEY, what digit does M represent?", options: ["0", "1", "2", "9"], correctAnswer: 1, explanation: "In this classic cryptarithmetic puzzle, M = 1 since the sum of two 4-digit numbers produces a 5-digit number.", difficulty: "hard", category: "analytical" },
    { question: "A cube is painted red on all faces and then cut into 27 smaller cubes. How many small cubes have exactly 2 faces painted?", options: ["8", "12", "6", "4"], correctAnswer: 1, explanation: "Edge cubes (not corners) have 2 painted faces. A 3×3×3 cube has 12 edges, each with 1 edge cube = 12.", difficulty: "medium", category: "analytical" },
    { question: "In a family of 6, there are 2 married couples. A is father of D. B is mother of E. C is the uncle of D. F is wife of C. How is E related to D?", options: ["Sister", "Brother", "Cousin", "Cannot determine"], correctAnswer: 2, explanation: "A-B are parents of E. C-F are the other couple. C is uncle of D, so D is child of A-B's sibling. E and D are cousins.", difficulty: "hard", category: "analytical" },
    { question: "How many squares are there on a standard 8×8 chessboard?", options: ["64", "204", "200", "256"], correctAnswer: 1, explanation: "Sum of squares: 1² + 2² + ... + 8² = 204.", difficulty: "hard", category: "analytical" },
    { question: "A man facing north turns 90° left, then 180°, then 90° right. Which direction is he facing?", options: ["North", "South", "East", "West"], correctAnswer: 1, explanation: "North → 90° left = West → 180° = East → 90° right = South.", difficulty: "easy", category: "analytical" },
    { question: "If all cats are animals and some animals are wild, which statement must be true?", options: ["All cats are wild", "Some cats are wild", "No cats are wild", "None of the above must be true"], correctAnswer: 3, explanation: "We can't conclude anything definitive about cats being wild from the given premises.", difficulty: "medium", category: "analytical" },
    { question: "Three friends A, B, C have different heights. A is taller than B. C is shorter than A. Who could be the shortest?", options: ["Only B", "Only C", "B or C", "Only A"], correctAnswer: 2, explanation: "A > B, A > C. But we don't know the relation between B and C, so either could be shortest.", difficulty: "easy", category: "analytical" }
  ],
  pattern: [
    { question: "What comes next: 1, 1, 2, 3, 5, 8, 13, ?", options: ["18", "20", "21", "26"], correctAnswer: 2, explanation: "Fibonacci sequence. 8 + 13 = 21.", difficulty: "easy", category: "pattern" },
    { question: "Find the odd one out: 2, 5, 10, 17, 28, 37", options: ["28", "37", "5", "17"], correctAnswer: 0, explanation: "Pattern: n² + 1 → 1,4,9,16,25,36 + 1 = 2,5,10,17,26,37. 28 should be 26.", difficulty: "medium", category: "pattern" },
    { question: "If ◯◯△△◯◯△△◯◯△△..., what is the 25th symbol?", options: ["◯", "△", "Cannot determine", "Either"], correctAnswer: 0, explanation: "Pattern repeats every 4: ◯◯△△. 25 mod 4 = 1, so it's ◯.", difficulty: "easy", category: "pattern" },
    { question: "Complete: J, F, M, A, M, J, J, A, S, O, N, ?", options: ["D", "J", "M", "N"], correctAnswer: 0, explanation: "First letters of months: January through December. D for December.", difficulty: "easy", category: "pattern" },
    { question: "What is the missing number? 4, 9, 16, 25, ?, 49", options: ["30", "36", "32", "42"], correctAnswer: 1, explanation: "Squares: 2², 3², 4², 5², 6², 7². Missing is 6² = 36.", difficulty: "easy", category: "pattern" },
    { question: "Find the pattern: 3, 6, 11, 18, 27, ?", options: ["38", "36", "40", "35"], correctAnswer: 0, explanation: "Differences: 3, 5, 7, 9, 11. Next = 27 + 11 = 38.", difficulty: "medium", category: "pattern" },
    { question: "ACE, BDF, CEG, ?", options: ["DFH", "DEF", "DGI", "CFH"], correctAnswer: 0, explanation: "Each letter in the group increases by 1. Next: D, F, H.", difficulty: "medium", category: "pattern" },
    { question: "What replaces ?: 1, 4, 27, 256, ?", options: ["3125", "625", "1024", "512"], correctAnswer: 0, explanation: "Pattern: 1^1, 2^2, 3^3, 4^4, 5^5 = 3125.", difficulty: "hard", category: "pattern" },
    { question: "If RED = 27, GREEN = 49, what is BLUE?", options: ["40", "38", "36", "34"], correctAnswer: 0, explanation: "Sum of letter positions: B(2)+L(12)+U(21)+E(5) = 40.", difficulty: "medium", category: "pattern" },
    { question: "Complete the series: 2, 3, 5, 7, 11, 13, ?", options: ["15", "17", "19", "14"], correctAnswer: 1, explanation: "These are prime numbers. Next prime after 13 is 17.", difficulty: "easy", category: "pattern" }
  ],
  "real-world": [
    { question: "A store offers 25% off, then an additional 10% off the sale price. What is the total discount?", options: ["35%", "32.5%", "30%", "27.5%"], correctAnswer: 1, explanation: "After 25% off: 0.75. After additional 10%: 0.75 × 0.90 = 0.675. Total discount = 32.5%.", difficulty: "medium", category: "real-world" },
    { question: "You invest $1000 at 5% annual compound interest. How much after 3 years (approx)?", options: ["$1150", "$1157.63", "$1150.50", "$1160"], correctAnswer: 1, explanation: "1000 × (1.05)^3 = 1000 × 1.157625 ≈ $1157.63.", difficulty: "medium", category: "real-world" },
    { question: "A pizza is cut into 8 equal slices. If 3 people eat 2 slices each, what fraction remains?", options: ["1/4", "3/8", "1/8", "1/2"], correctAnswer: 0, explanation: "6 slices eaten out of 8. Remaining = 2/8 = 1/4.", difficulty: "easy", category: "real-world" },
    { question: "If electricity costs $0.12/kWh and a 100W bulb runs 10 hours/day for 30 days, what's the cost?", options: ["$3.60", "$36.00", "$0.36", "$12.00"], correctAnswer: 0, explanation: "Energy = 0.1 kW × 10 h × 30 days = 30 kWh. Cost = 30 × 0.12 = $3.60.", difficulty: "medium", category: "real-world" },
    { question: "A car's fuel efficiency is 30 mpg. Gas costs $4/gallon. What's the fuel cost for a 450-mile trip?", options: ["$45", "$60", "$50", "$75"], correctAnswer: 1, explanation: "Gallons needed = 450/30 = 15. Cost = 15 × $4 = $60.", difficulty: "easy", category: "real-world" },
    { question: "A project requires 5 people working 8 hours/day for 6 days. If only 3 people are available, how many days do they need?", options: ["8 days", "10 days", "12 days", "15 days"], correctAnswer: 1, explanation: "Total work = 5 × 8 × 6 = 240 person-hours. With 3 people at 8h/day: 240/(3×8) = 10 days.", difficulty: "medium", category: "real-world" },
    { question: "If a shirt originally costs $80 and is on sale for $60, what is the discount percentage?", options: ["20%", "25%", "30%", "15%"], correctAnswer: 1, explanation: "Discount = (80-60)/80 × 100 = 25%.", difficulty: "easy", category: "real-world" },
    { question: "A water tank fills at 5 liters/min and drains at 2 liters/min. If the tank holds 150 liters, how long to fill?", options: ["30 min", "50 min", "75 min", "25 min"], correctAnswer: 1, explanation: "Net rate = 5 - 2 = 3 liters/min. Time = 150/3 = 50 minutes.", difficulty: "medium", category: "real-world" },
    { question: "You have a 20% probability of rain each day. What's the probability of no rain for 3 consecutive days?", options: ["51.2%", "60%", "80%", "40%"], correctAnswer: 0, explanation: "P(no rain) = 0.8 each day. P(3 days) = 0.8³ = 0.512 = 51.2%.", difficulty: "hard", category: "real-world" },
    { question: "A rectangular room is 5m × 4m. If tiles cost $12/m², what is the total tiling cost?", options: ["$200", "$240", "$180", "$300"], correctAnswer: 1, explanation: "Area = 5 × 4 = 20 m². Cost = 20 × $12 = $240.", difficulty: "easy", category: "real-world" }
  ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, difficulty, count = 10, previousQuestionIds = [] } = await req.json();

    let questions: any[] = [];

    try {
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
        console.error("AI gateway error:", response.status);
        throw new Error(`AI gateway returned ${response.status}`);
      }

      const aiData = await response.json();
      let content = aiData.choices?.[0]?.message?.content || "[]";
      
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) content = codeBlockMatch[1];
      
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try { questions = JSON.parse(jsonMatch[0]); } catch (e) {
          console.error("JSON parse error:", e);
        }
      }
    } catch (aiError) {
      console.error("AI call failed, using fallback:", aiError);
    }

    // Fallback
    if (!questions || questions.length === 0) {
      console.log("Using fallback questions for", category);
      const pool = fallbackQuestions[category] || fallbackQuestions["logical"] || [];
      // Shuffle and pick
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      questions = shuffled.slice(0, Math.min(count, shuffled.length));
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message, questions: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
