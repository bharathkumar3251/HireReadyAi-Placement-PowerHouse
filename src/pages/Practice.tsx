import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Code, Brain, Users, Loader2, CheckCircle, XCircle } from "lucide-react";

const categories = [
  { id: "aptitude", label: "Aptitude", icon: Brain, color: "text-warning" },
  { id: "technical", label: "Technical", icon: Code, color: "text-primary" },
  { id: "coding", label: "Coding", icon: BookOpen, color: "text-success" },
  { id: "hr", label: "HR", icon: Users, color: "text-info" },
];

interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export default function Practice() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const startPractice = async (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    setScore({ correct: 0, total: 0 });
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-interview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ action: "practice", category }),
      });

      if (!response.ok) throw new Error("Failed to generate questions");
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const selectAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    const isCorrect = index === questions[currentIndex].correct;
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const nextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Save progress
      if (user && selectedCategory) {
        await supabase.from("practice_progress").insert({
          user_id: user.id,
          category: selectedCategory,
          questions_attempted: score.total,
          correct_answers: score.correct,
        });
      }
      toast({ title: `Practice complete! Score: ${score.correct}/${score.total}` });
      setSelectedCategory(null);
      setQuestions([]);
    }
  };

  if (!selectedCategory) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6">Practice Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map(({ id, label, icon: Icon, color }) => (
              <button key={id} onClick={() => startPractice(id)} className="glass-card p-6 hover-lift text-left group">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">Practice questions</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Generating questions...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => { setSelectedCategory(null); setQuestions([]); }} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
          <p className="text-sm text-muted-foreground">Question {currentIndex + 1} of {questions.length}</p>
          <p className="text-sm font-medium text-primary">{score.correct}/{score.total} correct</p>
        </div>

        <div className="glass-card p-6">
          <p className="text-lg font-medium text-foreground mb-6">{currentQ.question}</p>
          <div className="space-y-3">
            {currentQ.options.map((opt, i) => {
              let optionClass = "bg-secondary hover:bg-muted border-border";
              if (selectedAnswer !== null) {
                if (i === currentQ.correct) optionClass = "bg-success/10 border-success/30";
                else if (i === selectedAnswer) optionClass = "bg-destructive/10 border-destructive/30";
              }
              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  disabled={selectedAnswer !== null}
                  className={`w-full text-left p-4 rounded-lg border transition-all flex items-center gap-3 ${optionClass}`}
                >
                  <span className="text-sm font-medium text-foreground">{String.fromCharCode(65 + i)}.</span>
                  <span className="text-sm text-foreground">{opt}</span>
                  {selectedAnswer !== null && i === currentQ.correct && <CheckCircle className="h-4 w-4 text-success ml-auto" />}
                  {selectedAnswer === i && i !== currentQ.correct && <XCircle className="h-4 w-4 text-destructive ml-auto" />}
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className="mt-4 p-4 rounded-lg bg-muted">
              <p className="text-sm font-medium text-foreground mb-1">Explanation:</p>
              <p className="text-sm text-muted-foreground">{currentQ.explanation}</p>
            </div>
          )}

          {selectedAnswer !== null && (
            <Button onClick={nextQuestion} className="mt-4 gradient-bg text-primary-foreground">
              {currentIndex < questions.length - 1 ? "Next Question" : "Finish"}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
