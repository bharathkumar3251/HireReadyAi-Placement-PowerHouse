import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Users, Mic, FileText, Briefcase, BarChart3, Award, TrendingUp, Code, Brain } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface DeptStat {
  department: string;
  count: number;
  avgScore: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, interviews: 0, resumes: 0, jobs: 0, decisions: 0, codingProblems: 0, aptitudeTests: 0 });
  const [deptStats, setDeptStats] = useState<DeptStat[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [profilesRes, interviewsRes, resumesRes, jobsRes, decisionsRes, rolesRes, sessionsRes, codingRes, aptitudeRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("interview_sessions").select("id", { count: "exact", head: true }),
        supabase.from("resumes").select("id", { count: "exact", head: true }),
        supabase.from("job_listings").select("id", { count: "exact", head: true }),
        supabase.from("candidate_decisions").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("role"),
        supabase.from("interview_sessions").select("user_id, overall_score").not("overall_score", "is", null),
        supabase.from("coding_problems").select("id", { count: "exact", head: true }),
        supabase.from("aptitude_sessions").select("id", { count: "exact", head: true }).eq("status", "completed"),
      ]);

      const profiles = profilesRes.data || [];
      setStats({
        users: profiles.length,
        interviews: interviewsRes.count || 0,
        resumes: resumesRes.count || 0,
        jobs: jobsRes.count || 0,
        decisions: decisionsRes.count || 0,
        codingProblems: codingRes.count || 0,
        aptitudeTests: aptitudeRes.count || 0,
      });

      // Role distribution
      const roleCounts: Record<string, number> = {};
      (rolesRes.data || []).forEach((r: any) => {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
      });
      setRoleDistribution(Object.entries(roleCounts).map(([name, value]) => ({ name, value })));

      // Department stats
      const sessions = sessionsRes.data || [];
      const userScores: Record<string, number[]> = {};
      sessions.forEach((s: any) => {
        if (!userScores[s.user_id]) userScores[s.user_id] = [];
        userScores[s.user_id].push(s.overall_score);
      });

      const deptMap: Record<string, { count: number; totalScore: number; scored: number }> = {};
      profiles.forEach(p => {
        const dept = p.department || "Unknown";
        if (!deptMap[dept]) deptMap[dept] = { count: 0, totalScore: 0, scored: 0 };
        deptMap[dept].count++;
        const scores = userScores[p.user_id];
        if (scores?.length) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          deptMap[dept].totalScore += avg;
          deptMap[dept].scored++;
        }
      });
      setDeptStats(
        Object.entries(deptMap)
          .map(([department, d]) => ({
            department: department.length > 12 ? department.slice(0, 12) + "…" : department,
            count: d.count,
            avgScore: d.scored ? Math.round(d.totalScore / d.scored) : 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)
      );

      // Top performers
      const performerData = profiles
        .map(p => {
          const scores = userScores[p.user_id];
          const avg = scores?.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
          return { ...p, avgScore: avg, interviewCount: scores?.length || 0 };
        })
        .filter(p => p.avgScore > 0)
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 10);
      setTopPerformers(performerData);
    };
    fetchAll();
  }, []);

  const roleColors = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--success))"];

  const statCards = [
    { icon: Users, label: "Total Users", value: stats.users, color: "primary" },
    { icon: Mic, label: "Interviews", value: stats.interviews, color: "info" },
    { icon: FileText, label: "Resumes", value: stats.resumes, color: "success" },
    { icon: Code, label: "Coding Problems", value: stats.codingProblems, color: "warning" },
    { icon: Brain, label: "Aptitude Tests", value: stats.aptitudeTests, color: "primary" },
    { icon: Briefcase, label: "Job Listings", value: stats.jobs, color: "warning" },
    { icon: Award, label: "Decisions", value: stats.decisions, color: "primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
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
        {/* Department performance chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">Department-wise Performance</h3>
          {deptStats.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptStats}>
                  <XAxis dataKey="department" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="avgScore" name="Avg Score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="count" name="Students" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No department data yet.</p>
          )}
        </div>

        {/* Role distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">User Role Distribution</h3>
          {roleDistribution.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {roleDistribution.map((_, i) => (
                      <Cell key={i} fill={roleColors[i % roleColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {roleDistribution.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
                    <div className="w-2 h-2 rounded-full" style={{ background: roleColors[i % roleColors.length] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No user data yet.</p>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-warning" /> Top Performers Leaderboard
        </h3>
        {topPerformers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Rank</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Student</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Department</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Avg Score</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Interviews</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((p, i) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="p-3">
                      <span className={`text-sm font-bold ${i < 3 ? "text-warning" : "text-muted-foreground"}`}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="p-3">
                      <p className="text-sm font-medium text-foreground">{p.full_name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground">{p.college || "N/A"}</p>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{p.department || "N/A"}</td>
                    <td className="p-3">
                      <span className="text-sm font-semibold text-primary">{p.avgScore}/100</span>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{p.interviewCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No completed interviews yet.</p>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/admin/users" className="glass-card p-5 hover-lift flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Manage Users</p>
            <p className="text-xs text-muted-foreground">View all users & roles</p>
          </div>
        </Link>
        <Link to="/admin/analytics" className="glass-card p-5 hover-lift flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-info" />
          <div>
            <p className="text-sm font-medium text-foreground">Analytics</p>
            <p className="text-xs text-muted-foreground">Detailed placement analytics</p>
          </div>
        </Link>
        <Link to="/admin/settings" className="glass-card p-5 hover-lift flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-success" />
          <div>
            <p className="text-sm font-medium text-foreground">Placement Reports</p>
            <p className="text-xs text-muted-foreground">Export & review reports</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
