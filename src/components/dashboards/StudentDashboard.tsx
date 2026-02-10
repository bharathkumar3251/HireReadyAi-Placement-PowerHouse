import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Mic, BookOpen, TrendingUp, Clock, Award } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ resumes: 0, interviews: 0, avgScore: 0 });
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [resumeRes, interviewRes] = await Promise.all([
        supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("interview_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);

      const sessions = interviewRes.data || [];
      const completed = sessions.filter(s => s.overall_score);
      const avg = completed.length ? Math.round(completed.reduce((a, b) => a + (b.overall_score || 0), 0) / completed.length) : 0;

      setStats({
        resumes: resumeRes.count || 0,
        interviews: sessions.length,
        avgScore: avg,
      });
      setRecentSessions(sessions);
    };
    fetchData();
  }, [user]);

  const quickActions = [
    { to: "/resume-builder", icon: FileText, label: "Build Resume", color: "text-info" },
    { to: "/mock-interview", icon: Mic, label: "Start Interview", color: "text-primary" },
    { to: "/practice", icon: BookOpen, label: "Practice Questions", color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{stats.resumes}</p>
              <p className="text-sm text-muted-foreground">Resumes</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10"><Mic className="h-5 w-5 text-info" /></div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{stats.interviews}</p>
              <p className="text-sm text-muted-foreground">Interviews</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10"><Award className="h-5 w-5 text-success" /></div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{stats.avgScore || "—"}</p>
              <p className="text-sm text-muted-foreground">Avg Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map(({ to, icon: Icon, label, color }) => (
          <Link key={to} to={to} className="glass-card p-5 hover-lift flex items-center gap-4 group">
            <div className={`p-3 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div>
              <p className="font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">Click to start</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Interviews */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-display font-semibold text-foreground mb-4">Recent Interviews</h3>
        {recentSessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No interviews yet. Start your first AI mock interview!</p>
        ) : (
          <div className="space-y-3">
            {recentSessions.map(s => (
              <div key={s.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{s.domain} Interview</p>
                    <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.overall_score && (
                    <span className="text-sm font-semibold text-primary">{s.overall_score}/100</span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    s.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  }`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
