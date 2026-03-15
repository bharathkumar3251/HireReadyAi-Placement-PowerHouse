import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Send, Bot, User, Loader2, StopCircle, Play } from "lucide-react";

interface Message {
  role: "interviewer" | "candidate";
  content: string;
}

const domains = ["General", "Frontend", "Backend", "Data Science", "Machine Learning", "System Design", "HR"];

export default function MockInterview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [domain, setDomain] = useState("General");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startInterview = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Create session
      const { data: session, error } = await supabase
        .from("interview_sessions")
        .insert({ user_id: user.id, domain: domain.toLowerCase(), status: "in_progress" })
        .select()
        .single();
      if (error) throw error;
      setSessionId(session.id);
      setIsStarted(true);

      // Get first question from AI
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-interview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: "ask",
          domain,
          messages: [],
          sessionId: session.id,
        }),
      });

      if (!response.ok) throw new Error("AI request failed");
      const data = await response.json();

      const aiMsg: Message = { role: "interviewer", content: data.question };
      setMessages([aiMsg]);

      // Save to DB
      await supabase.from("interview_messages").insert({
        session_id: session.id,
        role: "interviewer",
        content: data.question,
      });

      // Speak the question
      speakText(data.question);
    } catch (err: any) {
      toast({ title: "Error starting interview", description: err.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const sendAnswer = async () => {
    if (!input.trim() || !sessionId) return;
    const userMsg: Message = { role: "candidate", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Save candidate answer
      await supabase.from("interview_messages").insert({
        session_id: sessionId,
        role: "candidate",
        content: input,
      });

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-interview`, {
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
      });

      if (!response.ok) throw new Error("AI request failed");
      const data = await response.json();

      if (data.score !== undefined) {
        // Interview complete
        setScore(data.score);
        const evalMsg: Message = { role: "interviewer", content: data.feedback || `Interview completed! Your score: ${data.score}/100` };
        setMessages(prev => [...prev, evalMsg]);
        await supabase.from("interview_sessions").update({
          status: "completed",
          overall_score: data.score,
          feedback: data.feedback,
          completed_at: new Date().toISOString(),
        }).eq("id", sessionId);

        // Save feedback report
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
        setMessages(prev => [...prev, aiMsg]);
        await supabase.from("interview_messages").insert({
          session_id: sessionId,
          role: "interviewer",
          content: data.question,
        });
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
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {!isStarted ? (
          <div className="glass-card p-8 text-center">
            <Bot className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">AI Mock Interview</h2>
            <p className="text-muted-foreground mb-6">Choose a domain and start a multi-question interview session with voice support.</p>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {domains.map(d => (
                <button
                  key={d}
                  onClick={() => setDomain(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${domain === d ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
                >
                  {d}
                </button>
              ))}
            </div>

            <Button onClick={startInterview} disabled={isLoading} className="gradient-bg text-primary-foreground px-8">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Start Interview
            </Button>
          </div>
        ) : (
          <>
            {/* Chat Area */}
            <div className="glass-card p-4 min-h-[400px] max-h-[500px] overflow-y-auto space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "candidate" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "interviewer" ? "bg-primary/10" : "bg-info/10"}`}>
                    {msg.role === "interviewer" ? <Bot className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-info" />}
                  </div>
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === "interviewer" ? "bg-secondary text-foreground" : "bg-primary/10 text-foreground"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Bot className="h-4 w-4 text-primary" /></div>
                  <div className="bg-secondary p-3 rounded-xl"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Score */}
            {score !== null && (
              <div className="glass-card p-6 text-center glow-border">
                <h3 className="text-xl font-display font-bold text-foreground mb-1">Interview Complete!</h3>
                <p className="text-4xl font-bold text-primary">{score}/100</p>
              </div>
            )}

            {/* Input */}
            {score === null && (
              <div className="glass-card p-4 flex gap-2">
                <Button variant="ghost" size="icon" onClick={toggleVoiceInput} className={isListening ? "text-destructive animate-pulse" : "text-muted-foreground"}>
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendAnswer()}
                  placeholder="Type or speak your answer..."
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
                />
                <Button onClick={sendAnswer} disabled={!input.trim() || isLoading} size="icon" className="gradient-bg text-primary-foreground">
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
