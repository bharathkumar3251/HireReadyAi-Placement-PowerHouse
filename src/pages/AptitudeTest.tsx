import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Brain, Clock, CheckCircle, XCircle, Trophy, Loader2, RotateCcw, ChevronRight } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: string;
  category: string;
}

const aptitudeCategories = [
  { value: "logical", label: "Logical Reasoning" },
  { value: "quantitative", label: "Quantitative Aptitude" },
  { value: "analytical", label: "Analytical Thinking" },
  { value: "pattern", label: "Pattern Recognition" },
  { value: "realworld", label: "Real-World Problem Solving" },
  { value: "mixed", label: "Mixed (All Categories)" },
];

export default function AptitudeTest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [phase, setPhase] = useState<"setup" | "test" | "results">("setup");
  const [category, setCategory] = useState("mixed");
  const [difficulty, setDifficulty] = useState("medium");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  useEffect(() => {
    if (phase === "test" && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
    if (phase === "test" && timeLeft === 0 && questions.length > 0) {
      finishTest();
    }
  }, [phase, timeLeft]);

  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("aptitude_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setHistory((data as any[]) || []);
  };

  const startTest = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-aptitude`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ category, difficulty, count: 10 }),
      });
      const data = await response.json();
      if (data.questions?.length) {
        setQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill(null));
        setCurrentIdx(0);
        const time = difficulty === "easy" ? 600 : difficulty === "medium" ? 480 : 360;
        setTimeLeft(time);
        setTotalTime(time);
        setPhase("test");
      } else {
        toast({ title: "Failed to generate questions", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const selectAnswer = (optionIdx: number) => {
    setAnswers(prev => {
      const copy = [...prev];
      copy[currentIdx] = optionIdx;
      return copy;
    });
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(i => i + 1);
    else finishTest();
  };

  const finishTest = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("results");

    const correct = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctAnswer ? 1 : 0), 0);
    const score = Math.round((correct / questions.length) * 100);
    const timeTaken = totalTime - timeLeft;

    if (user) {
      const { data } = await supabase.from("aptitude_sessions").insert({
        user_id: user.id,
        category,
        total_questions: questions.length,
        correct_answers: correct,
        score,
        time_taken_seconds: timeTaken,
        answers: answers.map((a, i) => ({ questionIdx: i, selected: a, correct: questions[i].correctAnswer })),
        status: "completed",
        completed_at: new Date().toISOString(),
      }).select("id").single();
      if (data) setSessionId(data.id);
      fetchHistory();
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const correct = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctAnswer ? 1 : 0), 0);
  const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;

  if (phase === "setup") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="glass-card p-8 text-center space-y-6">
            <Brain className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-2xl font-display font-bold text-foreground">Aptitude Assessment</h2>
            <p className="text-muted-foreground">AI-generated challenging questions with adaptive difficulty and time-based scoring.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {aptitudeCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Difficulty</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy (10 min)</SelectItem>
                    <SelectItem value="medium">Medium (8 min)</SelectItem>
                    <SelectItem value="hard">Hard (6 min)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={startTest} disabled={loading} className="gradient-bg text-primary-foreground px-8">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : "Start Test"}
            </Button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-display font-semibold text-foreground mb-4">Recent Tests</h3>
              <div className="space-y-2">
                {history.map(h => (
                  <div key={h.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{h.category}</p>
                      <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-primary">{h.score}%</span>
                      <span className="text-xs text-muted-foreground">{h.correct_answers}/{h.total_questions}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  if (phase === "test") {
    const q = questions[currentIdx];
    const progress = ((currentIdx + 1) / questions.length) * 100;
    const timeProgress = (timeLeft / totalTime) * 100;

    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Timer & progress */}
          <div className="glass-card p-4 flex items-center gap-4">
            <div className={`flex items-center gap-2 ${timeLeft < 60 ? "text-destructive" : "text-foreground"}`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
            <Progress value={timeProgress} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground">{currentIdx + 1}/{questions.length}</span>
          </div>

          {/* Question */}
          <div className="glass-card p-8 space-y-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl font-display font-bold text-primary">Q{currentIdx + 1}</span>
              <p className="text-lg text-foreground leading-relaxed">{q.question}</p>
            </div>

            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    answers[currentIdx] === i
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-secondary text-foreground hover:border-primary/50"
                  }`}
                >
                  <span className="font-medium mr-3 text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <p className="text-xs text-muted-foreground capitalize">{q.category} • {q.difficulty}</p>
              <Button onClick={nextQuestion} className="gradient-bg text-primary-foreground">
                {currentIdx < questions.length - 1 ? <>Next <ChevronRight className="h-4 w-4 ml-1" /></> : "Finish"}
              </Button>
            </div>
          </div>

          {/* Question nav dots */}
          <div className="flex justify-center gap-2 flex-wrap">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                  i === currentIdx ? "bg-primary text-primary-foreground" :
                  answers[i] !== null ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Results
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="glass-card p-8 text-center space-y-4">
          <Trophy className={`h-16 w-16 mx-auto ${score >= 70 ? "text-success" : score >= 40 ? "text-warning" : "text-destructive"}`} />
          <h2 className="text-3xl font-display font-bold text-foreground">{score}%</h2>
          <p className="text-lg text-muted-foreground">{correct}/{questions.length} correct answers</p>
          <p className="text-sm text-muted-foreground">Time: {formatTime(totalTime - timeLeft)}</p>
          <Progress value={score} className="h-3 max-w-xs mx-auto" />
        </div>

        {/* Review */}
        <div className="space-y-3">
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.correctAnswer;
            return (
              <div key={i} className={`glass-card p-4 border-l-4 ${isCorrect ? "border-l-success" : "border-l-destructive"}`}>
                <div className="flex items-start gap-2 mb-2">
                  {isCorrect ? <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
                  <p className="text-sm text-foreground">{q.question}</p>
                </div>
                {!isCorrect && (
                  <div className="ml-7 space-y-1">
                    <p className="text-xs text-destructive">Your answer: {answers[i] !== null ? q.options[answers[i]!] : "Not answered"}</p>
                    <p className="text-xs text-success">Correct: {q.options[q.correctAnswer]}</p>
                  </div>
                )}
                {q.explanation && <p className="text-xs text-muted-foreground ml-7 mt-1">{q.explanation}</p>}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => { setPhase("setup"); setQuestions([]); setAnswers([]); }}>
            <RotateCcw className="h-4 w-4 mr-2" /> Take Another Test
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
