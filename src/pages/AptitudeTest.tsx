import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Brain, Clock, CheckCircle, XCircle, Trophy, Loader2, RotateCcw, ChevronRight, Zap } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: string;
  category: string;
}

// Domain list — covers all global tech & career domains
const DOMAINS = [
  { value: "Artificial Intelligence", label: "🤖 Artificial Intelligence" },
  { value: "Data Science", label: "📊 Data Science" },
  { value: "Machine Learning", label: "🧠 Machine Learning" },
  { value: "Web Development", label: "🌐 Web Development" },
  { value: "Mobile App Development", label: "📱 Mobile App Development" },
  { value: "Cyber Security", label: "🔐 Cyber Security" },
  { value: "Cloud Computing", label: "☁️ Cloud Computing" },
  { value: "DevOps", label: "⚙️ DevOps" },
  { value: "Software Engineering", label: "💻 Software Engineering" },
  { value: "Game Development", label: "🎮 Game Development" },
  { value: "Blockchain", label: "🔗 Blockchain" },
  { value: "UI/UX Design", label: "🎨 UI/UX Design" },
  { value: "Embedded Systems", label: "🔌 Embedded Systems" },
  { value: "Internet of Things", label: "📡 Internet of Things" },
  { value: "Networking", label: "🌍 Networking" },
  { value: "Robotics", label: "🤖 Robotics" },
  { value: "Product Management", label: "📋 Product Management" },
  { value: "Digital Marketing", label: "📢 Digital Marketing" },
  { value: "Finance & Analytics", label: "💹 Finance & Analytics" },
  { value: "Business Intelligence", label: "📈 Business Intelligence" },
];

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
  const [domain, setDomain] = useState("Software Engineering");
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ category, difficulty, count: 10, domain }),
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
        category: `${domain} — ${category}`,
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
          <div className="glass-card p-8 space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-bg mb-4">
                <Brain className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">Domain-Adaptive Aptitude Test</h2>
              <p className="text-muted-foreground mt-2 text-sm">Questions dynamically adapt to your selected domain and difficulty level.</p>
            </div>

            {/* Domain selector */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <label className="text-xs font-semibold text-primary mb-2 block uppercase tracking-wider">
                <Zap className="h-3 w-3 inline mr-1" />Select Your Domain
              </label>
              <Select value={domain} onValueChange={setDomain}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {DOMAINS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Questions will include domain-specific logical, analytical, and scenario-based problems for <strong className="text-foreground">{domain}</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Question Category</label>
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

            {/* Info chips */}
            <div className="flex flex-wrap gap-2 justify-center">
              {["10 Questions", "Timed", "AI-Generated", "Domain-Specific", "Instant Results"].map(tag => (
                <span key={tag} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">{tag}</span>
              ))}
            </div>

            <Button onClick={startTest} disabled={loading} className="w-full gradient-bg text-primary-foreground py-3 text-base font-semibold">
              {loading ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generating Questions…</> : "🚀 Start Test"}
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
                      <span className={`text-sm font-bold ${h.score >= 70 ? "text-success" : h.score >= 40 ? "text-warning" : "text-destructive"}`}>{h.score}%</span>
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
    const timeProgress = (timeLeft / totalTime) * 100;

    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Timer & progress */}
          <div className="glass-card p-4 flex items-center gap-4">
            <div className={`flex items-center gap-2 font-mono font-bold ${timeLeft < 60 ? "text-destructive" : "text-foreground"}`}>
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
            <Progress value={timeProgress} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground">{currentIdx + 1}/{questions.length}</span>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hidden sm:block">{domain}</span>
          </div>

          {/* Question */}
          <div className="glass-card p-8 space-y-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl font-display font-bold text-primary min-w-[2rem]">Q{currentIdx + 1}</span>
              <p className="text-lg text-foreground leading-relaxed">{q.question}</p>
            </div>

            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                    answers[currentIdx] === i
                      ? "border-primary bg-primary/10 text-foreground shadow-sm"
                      : "border-border bg-secondary text-foreground hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full mr-3 text-xs font-bold bg-muted text-muted-foreground">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground capitalize">{q.category} • {q.difficulty}</p>
              <Button onClick={nextQuestion} className="gradient-bg text-primary-foreground">
                {currentIdx < questions.length - 1 ? <>Next <ChevronRight className="h-4 w-4 ml-1" /></> : "Finish Test"}
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
                  i === currentIdx ? "bg-primary text-primary-foreground scale-110" :
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
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{domain} Assessment</p>
            <h2 className="text-4xl font-display font-bold text-foreground">{score}%</h2>
          </div>
          <p className="text-lg text-muted-foreground">{correct}/{questions.length} correct answers</p>
          <p className="text-sm text-muted-foreground">Time taken: {formatTime(totalTime - timeLeft)}</p>
          <Progress value={score} className="h-3 max-w-xs mx-auto" />
          <div className="flex justify-center gap-3 pt-2">
            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${score >= 70 ? "bg-success/20 text-success" : score >= 40 ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive"}`}>
              {score >= 70 ? "🎉 Excellent!" : score >= 40 ? "👍 Good effort" : "📚 Keep practicing"}
            </span>
          </div>
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
                {q.explanation && <p className="text-xs text-muted-foreground ml-7 mt-1 italic">{q.explanation}</p>}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => { setPhase("setup"); setQuestions([]); setAnswers([]); setSessionId(null); }}>
            <RotateCcw className="h-4 w-4 mr-2" /> Take Another Test
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
