import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Code, Play, Send, CheckCircle, XCircle, Clock, Trophy, ChevronLeft, Lightbulb, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  starter_code: any;
  test_cases: any[];
  hidden_test_cases: any[];
  constraints: string | null;
  hints: string[] | null;
}

const categories = [
  { value: "dsa", label: "Data Structures & Algorithms" },
  { value: "web", label: "Web Development" },
  { value: "logic", label: "Logic & Problem Solving" },
  { value: "ai", label: "AI/Programming" },
];

const difficulties = [
  { value: "easy", label: "Easy", color: "text-success" },
  { value: "medium", label: "Medium", color: "text-warning" },
  { value: "hard", label: "Hard", color: "text-destructive" },
];

const languages = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
];

export default function CodingChallenge() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [categoryFilter, setCategoryFilter] = useState("dsa");
  const [difficultyFilter, setDifficultyFilter] = useState("easy");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showHints, setShowHints] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [stats, setStats] = useState({ solved: 0, attempted: 0, totalScore: 0 });

  useEffect(() => {
    fetchProblems();
    if (user) fetchUserStats();
  }, [categoryFilter, difficultyFilter, user]);

  const fetchProblems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("coding_problems")
      .select("*")
      .eq("category", categoryFilter)
      .eq("difficulty", difficultyFilter)
      .order("created_at", { ascending: false })
      .limit(20);
    setProblems((data as any[]) || []);
    setLoading(false);
  };

  const fetchUserStats = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("coding_submissions")
      .select("problem_id, score, status")
      .eq("user_id", user.id);
    const subs = data || [];
    const uniqueProblems = new Set(subs.map(s => s.problem_id));
    const solved = new Set(subs.filter(s => s.status === "accepted").map(s => s.problem_id));
    setStats({
      attempted: uniqueProblems.size,
      solved: solved.size,
      totalScore: subs.reduce((a, b) => a + (b.score || 0), 0),
    });
    setSubmissions(subs);
  };

  const generateProblems = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-coding-problems`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ category: categoryFilter, difficulty: difficultyFilter, count: 3 }),
      });
      const data = await response.json();
      if (data.problems?.length) {
        for (const p of data.problems) {
          await supabase.from("coding_problems").insert({
            title: p.title,
            description: p.description,
            category: p.category || categoryFilter,
            difficulty: p.difficulty || difficultyFilter,
            starter_code: p.starterCode || {},
            test_cases: p.testCases || [],
            hidden_test_cases: p.hiddenTestCases || [],
            constraints: p.constraints,
            hints: p.hints || [],
          });
        }
        toast({ title: `${data.problems.length} problems generated!` });
        fetchProblems();
      }
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const selectProblem = (p: Problem) => {
    setSelectedProblem(p);
    setResults(null);
    setShowHints(false);
    const starterCode = p.starter_code as any;
    setCode(starterCode?.[language] || "// Write your solution here\n");
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (selectedProblem) {
      const starterCode = selectedProblem.starter_code as any;
      setCode(starterCode?.[lang] || "// Write your solution here\n");
    }
  };

  const runCode = async () => {
    if (!selectedProblem || !user) return;
    setEvaluating(true);
    setResults(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          code,
          language,
          testCases: selectedProblem.test_cases,
          hiddenTestCases: [],
          problemId: selectedProblem.id,
          userId: user.id,
        }),
      });
      const data = await response.json();
      setResults(data);
      fetchUserStats();
    } catch (err: any) {
      toast({ title: "Run failed", description: err.message, variant: "destructive" });
    }
    setEvaluating(false);
  };

  const submitCode = async () => {
    if (!selectedProblem || !user) return;
    setEvaluating(true);
    setResults(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          code,
          language,
          testCases: selectedProblem.test_cases,
          hiddenTestCases: selectedProblem.hidden_test_cases,
          problemId: selectedProblem.id,
          userId: user.id,
        }),
      });
      const data = await response.json();
      setResults(data);
      fetchUserStats();
      if (data.score >= 100) {
        toast({ title: "🎉 All test cases passed!" });
      } else {
        toast({ title: `Score: ${data.score}/100`, description: data.feedback });
      }
    } catch (err: any) {
      toast({ title: "Submit failed", description: err.message, variant: "destructive" });
    }
    setEvaluating(false);
  };

  const diffColor = (d: string) => d === "easy" ? "text-success" : d === "medium" ? "text-warning" : "text-destructive";
  const diffBg = (d: string) => d === "easy" ? "bg-success/10" : d === "medium" ? "bg-warning/10" : "bg-destructive/10";

  // Problem list view
  if (!selectedProblem) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-display font-bold text-foreground">{stats.solved}</p>
              <p className="text-xs text-muted-foreground">Problems Solved</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-display font-bold text-foreground">{stats.attempted}</p>
              <p className="text-xs text-muted-foreground">Attempted</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-display font-bold text-foreground">{stats.totalScore}</p>
              <p className="text-xs text-muted-foreground">Total Score</p>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-card p-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs text-muted-foreground mb-1 block">Difficulty</label>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {difficulties.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={generateProblems} disabled={generating} variant="outline" className="border-primary/30 text-primary">
                {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Code className="h-4 w-4 mr-2" />Generate Problems</>}
              </Button>
            </div>
          </div>

          {/* Problem list */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : problems.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No problems yet for this category. Generate some!</p>
              <Button onClick={generateProblems} disabled={generating} className="gradient-bg text-primary-foreground">
                {generating ? "Generating..." : "Generate Problems"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {problems.map((p, i) => {
                const isSolved = submissions.some(s => s.problem_id === p.id && s.status === "accepted");
                return (
                  <div key={p.id} onClick={() => selectProblem(p)} className="glass-card p-4 cursor-pointer hover:bg-muted/30 transition-colors flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">{i + 1}</div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{p.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{p.description.split('\n')[0]}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${diffBg(p.difficulty)} ${diffColor(p.difficulty)}`}>{p.difficulty}</span>
                    {isSolved && <CheckCircle className="h-4 w-4 text-success" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Code editor view
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedProblem(null)} className="text-muted-foreground">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Problems
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Problem description */}
          <div className="glass-card p-6 space-y-4 overflow-auto max-h-[80vh]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-foreground">{selectedProblem.title}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${diffBg(selectedProblem.difficulty)} ${diffColor(selectedProblem.difficulty)}`}>
                {selectedProblem.difficulty}
              </span>
            </div>
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-sans">{selectedProblem.description}</pre>
            </div>
            {selectedProblem.constraints && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Constraints</h4>
                <p className="text-sm text-muted-foreground">{selectedProblem.constraints}</p>
              </div>
            )}
            {selectedProblem.hints && selectedProblem.hints.length > 0 && (
              <div>
                <Button variant="ghost" size="sm" onClick={() => setShowHints(!showHints)} className="text-warning">
                  <Lightbulb className="h-4 w-4 mr-1" /> {showHints ? "Hide Hints" : "Show Hints"}
                </Button>
                {showHints && (
                  <ul className="mt-2 space-y-1">
                    {selectedProblem.hints.map((h, i) => (
                      <li key={i} className="text-sm text-muted-foreground">💡 {h}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {/* Test cases */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Test Cases</h4>
              <div className="space-y-2">
                {(selectedProblem.test_cases as any[]).map((tc: any, i: number) => (
                  <div key={i} className="bg-muted rounded-lg p-3 text-sm">
                    <p className="text-muted-foreground"><strong>Input:</strong> {tc.input}</p>
                    <p className="text-muted-foreground"><strong>Expected:</strong> {tc.expectedOutput}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Code editor */}
          <div className="space-y-4">
            <div className="glass-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-[150px] bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {languages.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex-1" />
                <Button size="sm" variant="outline" onClick={runCode} disabled={evaluating}>
                  {evaluating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />} Run
                </Button>
                <Button size="sm" onClick={submitCode} disabled={evaluating} className="gradient-bg text-primary-foreground">
                  {evaluating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />} Submit
                </Button>
              </div>
              <Textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                className="font-mono text-sm bg-background border-border text-foreground min-h-[400px] resize-y"
                spellCheck={false}
              />
            </div>

            {/* Results */}
            {results && (
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">Results</h4>
                  <div className="flex items-center gap-2">
                    <Trophy className={`h-4 w-4 ${results.score >= 100 ? "text-success" : "text-warning"}`} />
                    <span className="text-lg font-bold text-foreground">{results.score}/100</span>
                  </div>
                </div>
                <Progress value={results.score} className="h-2" />
                <p className="text-sm text-muted-foreground">{results.totalPassed}/{results.totalTests} test cases passed</p>
                {results.feedback && <p className="text-sm text-foreground/80">{results.feedback}</p>}
                {results.executionTimeMs > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {results.executionTimeMs}ms
                  </p>
                )}
                {results.results?.map((r: any, i: number) => (
                  <div key={i} className={`flex items-center gap-2 text-sm p-2 rounded ${r.passed ? "bg-success/10" : "bg-destructive/10"}`}>
                    {r.passed ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                    <span className="text-foreground">Test {i + 1}</span>
                    {r.actualOutput && <span className="text-muted-foreground ml-auto">Output: {r.actualOutput}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
