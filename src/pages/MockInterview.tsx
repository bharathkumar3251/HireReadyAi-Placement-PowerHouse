import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, MicOff, Send, Bot, User, Loader2, Play,
  AlertTriangle, ShieldX, ShieldCheck, Eye
} from "lucide-react";

interface Message {
  role: "interviewer" | "candidate";
  content: string;
}

const domains = ["General", "Frontend", "Backend", "Data Science", "Machine Learning", "System Design", "HR"];

type InterviewStatus = "idle" | "active" | "warning" | "terminated" | "completed";

export default function MockInterview() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [domain, setDomain] = useState("General");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [interviewStatus, setInterviewStatus] = useState<InterviewStatus>("idle");
  const [violationCount, setViolationCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showTerminatedModal, setShowTerminatedModal] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const violationCountRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const isActiveRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { violationCountRef.current = violationCount; }, [violationCount]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Security: visibility & blur detection ───────────────────────────────
  const handleViolation = useCallback(() => {
    if (!isActiveRef.current) return;

    const count = violationCountRef.current + 1;
    violationCountRef.current = count;
    setViolationCount(count);

    if (count === 1) {
      setInterviewStatus("warning");
      setShowWarningModal(true);
    } else {
      // Second violation → terminate
      setInterviewStatus("terminated");
      setShowWarningModal(false);
      setShowTerminatedModal(true);
      isActiveRef.current = false;

      // Mark session as terminated in DB
      if (sessionIdRef.current) {
        supabase
          .from("interview_sessions")
          .update({
            status: "terminated",
            feedback: "Session terminated: candidate switched tabs multiple times.",
            completed_at: new Date().toISOString(),
          })
          .eq("id", sessionIdRef.current)
          .then(({ error }) => {
            if (error) console.error("Failed to update session:", error);
          });
      }

      // Stop speech synthesis & recognition
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      recognitionRef.current?.stop();
    }
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") handleViolation();
    };
    const onBlur = () => handleViolation();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
    };
  }, [handleViolation]);
  // ─────────────────────────────────────────────────────────────────────────

  const startInterview = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: session, error } = await supabase
        .from("interview_sessions")
        .insert({ user_id: user.id, domain: domain.toLowerCase(), status: "in_progress" })
        .select()
        .single();
      if (error) throw error;

      setSessionId(session.id);
      sessionIdRef.current = session.id;
      setInterviewStatus("active");
      isActiveRef.current = true;
      setViolationCount(0);
      violationCountRef.current = 0;
      setShowWarningModal(false);
      setShowTerminatedModal(false);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-interview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ action: "ask", domain, messages: [], sessionId: session.id }),
        }
      );

      if (!response.ok) throw new Error("AI request failed");
      const data = await response.json();

      const aiMsg: Message = { role: "interviewer", content: data.question };
      setMessages([aiMsg]);

      await supabase
        .from("interview_messages")
        .insert({ session_id: session.id, role: "interviewer", content: data.question });

      speakText(data.question);
    } catch (err: any) {
      toast({ title: "Error starting interview", description: err.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const sendAnswer = async () => {
    if (!input.trim() || !sessionId || interviewStatus === "terminated") return;
    const userMsg: Message = { role: "candidate", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      await supabase
        .from("interview_messages")
        .insert({ session_id: sessionId, role: "candidate", content: input });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-interview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: newMessages.length >= 10 ? "evaluate" : "ask",
            domain,
            messages: newMessages,
            sessionId,
          }),
        }
      );

      if (!response.ok) throw new Error("AI request failed");
      const data = await response.json();

      if (data.score !== undefined) {
        setScore(data.score);
        setInterviewStatus("completed");
        isActiveRef.current = false;
        const evalMsg: Message = {
          role: "interviewer",
          content: data.feedback || `Interview completed! Your score: ${data.score}/100`,
        };
        setMessages((prev) => [...prev, evalMsg]);

        await supabase
          .from("interview_sessions")
          .update({
            status: "completed",
            overall_score: data.score,
            feedback: data.feedback,
            completed_at: new Date().toISOString(),
          })
          .eq("id", sessionId);

        await supabase.from("feedback_reports").insert({
          session_id: sessionId,
          user_id: user!.id,
          overall_rating: data.score,
          detailed_feedback: data.feedback,
          strengths: data.strengths || [],
          weaknesses: data.weaknesses || [],
          suggestions: data.suggestions || [],
        });
      } else {
        const aiMsg: Message = { role: "interviewer", content: data.question };
        setMessages((prev) => [...prev, aiMsg]);
        await supabase
          .from("interview_messages")
          .insert({ session_id: sessionId, role: "interviewer", content: data.question });
        speakText(data.question);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const toggleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({ title: "Speech recognition not supported in this browser", variant: "destructive" });
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      setInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const restartInterview = () => {
    setInterviewStatus("idle");
    setMessages([]);
    setScore(null);
    setSessionId(null);
    sessionIdRef.current = null;
    setViolationCount(0);
    violationCountRef.current = 0;
    isActiveRef.current = false;
    setShowWarningModal(false);
    setShowTerminatedModal(false);
    setInput("");
  };

  const isStarted = interviewStatus !== "idle";

  return (
    <DashboardLayout>
      {/* ── Warning modal (1st violation) ── */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-warning/60 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Tab Switch Detected!</h3>
              <p className="text-muted-foreground leading-relaxed">
                You switched tabs. Please remain on the interview page.{" "}
                <span className="text-warning font-semibold">
                  One more violation will terminate the interview.
                </span>
              </p>
              <div className="flex items-center gap-2 bg-warning/10 border border-warning/30 rounded-lg px-4 py-2 text-sm text-warning font-medium">
                <Eye className="h-4 w-4" />
                Violation 1 of 2
              </div>
              <Button
                onClick={() => setShowWarningModal(false)}
                className="w-full bg-warning text-warning-foreground hover:bg-warning/90 font-semibold"
              >
                I Understand — Continue Interview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Terminated modal (2nd violation) ── */}
      {showTerminatedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-destructive/60 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <ShieldX className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-xl font-bold text-destructive">Interview Terminated</h3>
              <p className="text-muted-foreground leading-relaxed">
                Interview terminated due to multiple tab switching.
              </p>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-left space-y-1 w-full">
                <p className="font-semibold text-destructive">Consequences:</p>
                <p className="text-muted-foreground">• This session has been marked as terminated.</p>
                <p className="text-muted-foreground">• Certificate generation is blocked for this attempt.</p>
                <p className="text-muted-foreground">• You must restart to regain eligibility.</p>
              </div>
              <Button
                onClick={restartInterview}
                variant="outline"
                className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                Restart Interview
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* ── Idle: domain selection ── */}
        {!isStarted ? (
          <div className="glass-card p-8 text-center">
            <Bot className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">AI Mock Interview</h2>
            <p className="text-muted-foreground mb-2">
              Choose a domain and start a multi-question interview session with voice support.
            </p>
            <div className="flex items-center justify-center gap-2 bg-info/10 border border-info/30 rounded-lg px-4 py-2 text-sm text-info mb-6 mx-auto w-fit">
              <ShieldCheck className="h-4 w-4" />
              Secure interview environment — tab switching is monitored
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {domains.map((d) => (
                <button
                  key={d}
                  onClick={() => setDomain(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    domain === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <Button
              onClick={startInterview}
              disabled={isLoading}
              className="gradient-bg text-primary-foreground px-8"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Start Interview
            </Button>
          </div>
        ) : (
          <>
            {/* ── Security status bar ── */}
            {interviewStatus !== "terminated" && interviewStatus !== "completed" && (
              <div
                className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium border ${
                  violationCount === 0
                    ? "bg-success/10 border-success/30 text-success"
                    : "bg-warning/10 border-warning/30 text-warning"
                }`}
              >
                <span className="flex items-center gap-2">
                  {violationCount === 0 ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  {violationCount === 0
                    ? "Secure session — stay on this page"
                    : `Warning: ${violationCount}/2 violations — one more will terminate`}
                </span>
                <span className="text-xs opacity-70">Tab switching monitored</span>
              </div>
            )}

            {/* ── Chat area ── */}
            {interviewStatus !== "terminated" && (
              <div className="glass-card p-4 min-h-[400px] max-h-[500px] overflow-y-auto space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === "candidate" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.role === "interviewer" ? "bg-primary/10" : "bg-info/10"
                      }`}
                    >
                      {msg.role === "interviewer" ? (
                        <Bot className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4 text-info" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] p-3 rounded-xl text-sm ${
                        msg.role === "interviewer"
                          ? "bg-secondary text-foreground"
                          : "bg-primary/10 text-foreground"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-secondary p-3 rounded-xl">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* ── Score card ── */}
            {score !== null && interviewStatus === "completed" && (
              <div className="glass-card p-6 text-center glow-border">
                <ShieldCheck className="h-10 w-10 text-success mx-auto mb-2" />
                <h3 className="text-xl font-display font-bold text-foreground mb-1">
                  Interview Complete!
                </h3>
                <p className="text-4xl font-bold text-primary">{score}/100</p>
                <Button
                  onClick={restartInterview}
                  variant="outline"
                  className="mt-4"
                >
                  Start New Interview
                </Button>
              </div>
            )}

            {/* ── Input bar ── */}
            {score === null && interviewStatus !== "terminated" && (
              <div className="glass-card p-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleVoiceInput}
                  className={isListening ? "text-destructive animate-pulse" : "text-muted-foreground"}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendAnswer()}
                  placeholder="Type or speak your answer..."
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
                />
                <Button
                  onClick={sendAnswer}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="gradient-bg text-primary-foreground"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
