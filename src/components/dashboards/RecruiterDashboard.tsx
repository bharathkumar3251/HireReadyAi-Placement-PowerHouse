import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Briefcase, FileText, CheckCircle, XCircle, Star, TrendingUp, Code, Brain } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, resumes: 0, jobs: 0, shortlisted: 0, selected: 0, rejected: 0, codingSubmissions: 0, aptitudeSessions: 0 });
  const [recentDecisions, setRecentDecisions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profilesRes, resumesRes, jobsRes, decisionsRes, recentRes, codingRes, aptitudeRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("resumes").select("id", { count: "exact", head: true }),
        supabase.from("job_listings").select("id", { count: "exact", head: true }).eq("recruiter_id", user.id),
        supabase.from("candidate_decisions").select("decision").eq("recruiter_id", user.id),
        supabase.from("candidate_decisions").select("*").eq("recruiter_id", user.id).order("updated_at", { ascending: false }).limit(5),
        supabase.from("coding_submissions").select("id", { count: "exact", head: true }),
        supabase.from("aptitude_sessions").select("id", { count: "exact", head: true }).eq("status", "completed"),
      ]);

      const decs = decisionsRes.data || [];
      setStats({
        students: profilesRes.count || 0,
        resumes: resumesRes.count || 0,
        jobs: jobsRes.count || 0,
        shortlisted: decs.filter(d => d.decision === "shortlisted").length,
        selected: decs.filter(d => d.decision === "selected").length,
        rejected: decs.filter(d => d.decision === "rejected").length,
        codingSubmissions: codingRes.count || 0,
        aptitudeSessions: aptitudeRes.count || 0,
      });
      setRecentDecisions(recentRes.data || []);
    };
    fetchData();
  }, [user]);

  const pieData = [
    { name: "Selected", value: stats.selected, color: "hsl(var(--success))" },
    { name: "Shortlisted", value: stats.shortlisted, color: "hsl(var(--warning))" },
    { name: "Rejected", value: stats.rejected, color: "hsl(var(--destructive))" },
  ].filter(d => d.value > 0);

  const statCards = [
    { icon: Users, label: "Total Students", value: stats.students, color: "primary" },
    { icon: FileText, label: "Resumes Available", value: stats.resumes, color: "info" },
    { icon: Briefcase, label: "My Job Listings", value: stats.jobs, color: "success" },
    { icon: Code, label: "Code Submissions", value: stats.codingSubmissions, color: "warning" },
    { icon: Brain, label: "Aptitude Tests", value: stats.aptitudeSessions, color: "primary" },
    { icon: Star, label: "Shortlisted", value: stats.shortlisted, color: "warning" },
    { icon: CheckCircle, label: "Selected", value: stats.selected, color: "success" },
    { icon: XCircle, label: "Rejected", value: stats.rejected, color: "destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-card p-4">
            <div className={`p-2 rounded-lg bg-${color}/10 w-fit mb-2`}>
              <Icon className={`h-4 w-4 text-${color}`} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hiring decisions chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">Hiring Decisions</h3>
          {pieData.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No decisions yet. Browse students to start evaluating.</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-display font-semibold text-foreground">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            <Link to="/recruiter/students" className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-primary/10 transition-colors">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Browse Candidates</p>
                <p className="text-xs text-muted-foreground">Search, filter, and evaluate students</p>
              </div>
            </Link>
            <Link to="/recruiter/jobs" className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-primary/10 transition-colors">
              <Briefcase className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Manage Job Listings</p>
                <p className="text-xs text-muted-foreground">Post and manage open positions</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
