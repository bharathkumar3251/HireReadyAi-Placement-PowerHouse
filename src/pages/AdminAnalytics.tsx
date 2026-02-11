import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, Award, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminAnalytics() {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [decisionData, setDecisionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [sessionsRes, profilesRes, decisionsRes] = await Promise.all([
        supabase.from("interview_sessions").select("created_at, overall_score, user_id"),
        supabase.from("profiles").select("user_id, department"),
        supabase.from("candidate_decisions").select("decision"),
      ]);

      const sessions = sessionsRes.data || [];
      const profiles = profilesRes.data || [];
      const decisions = decisionsRes.data || [];

      // Monthly interview trend
      const monthMap: Record<string, { count: number; totalScore: number; scored: number }> = {};
      sessions.forEach(s => {
        const month = new Date(s.created_at).toLocaleDateString("en", { year: "numeric", month: "short" });
        if (!monthMap[month]) monthMap[month] = { count: 0, totalScore: 0, scored: 0 };
        monthMap[month].count++;
        if (s.overall_score) {
          monthMap[month].totalScore += s.overall_score;
          monthMap[month].scored++;
        }
      });
      setMonthlyData(
        Object.entries(monthMap).map(([month, d]) => ({
          month,
          interviews: d.count,
          avgScore: d.scored ? Math.round(d.totalScore / d.scored) : 0,
        }))
      );

      // Department-wise scores
      const userDept: Record<string, string> = {};
      profiles.forEach(p => { userDept[p.user_id] = p.department || "Unknown"; });

      const deptMap: Record<string, { scores: number[]; count: number }> = {};
      sessions.forEach(s => {
        const dept = userDept[s.user_id] || "Unknown";
        if (!deptMap[dept]) deptMap[dept] = { scores: [], count: 0 };
        deptMap[dept].count++;
        if (s.overall_score) deptMap[dept].scores.push(s.overall_score);
      });
      setDeptData(
        Object.entries(deptMap)
          .map(([dept, d]) => ({
            department: dept.length > 15 ? dept.slice(0, 15) + "…" : dept,
            students: d.count,
            avgScore: d.scores.length ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0,
          }))
          .sort((a, b) => b.students - a.students)
      );

      // Decision breakdown
      const decCount: Record<string, number> = {};
      decisions.forEach(d => { decCount[d.decision] = (decCount[d.decision] || 0) + 1; });
      setDecisionData(Object.entries(decCount).map(([name, value]) => ({ name, value })));

      setLoading(false);
    };
    fetchAll();
  }, []);

  const exportCSV = () => {
    const header = "Department,Students,Avg Score\n";
    const rows = deptData.map(d => `${d.department},${d.students},${d.avgScore}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "placement_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const decisionColors = ["hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];
  const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-foreground">Placement Analytics</h2>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" /> Export Report
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interview trend */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Interview Trends
            </h3>
            {monthlyData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="interviews" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Interviews" />
                    <Line type="monotone" dataKey="avgScore" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 4 }} name="Avg Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No interview data yet.</p>
            )}
          </div>

          {/* Decision breakdown */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-warning" /> Recruiter Decisions
            </h3>
            {decisionData.length > 0 ? (
              <>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={decisionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                        {decisionData.map((_, i) => (
                          <Cell key={i} fill={decisionColors[i % decisionColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4">
                  {decisionData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
                      <div className="w-2 h-2 rounded-full" style={{ background: decisionColors[i % decisionColors.length] }} />
                      {d.name} ({d.value})
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No decisions made yet.</p>
            )}
          </div>
        </div>

        {/* Department chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-info" /> Department-wise Performance
          </h3>
          {deptData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <XAxis dataKey="department" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="avgScore" name="Avg Score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="students" name="Students" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No department data yet.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
