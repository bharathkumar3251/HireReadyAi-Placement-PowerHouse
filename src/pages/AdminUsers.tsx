import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, User, Shield, TrendingUp, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface StudentRow {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  college: string | null;
  department: string | null;
  codingScore: number;
  aptitudeScore: number;
  interviewScore: number;
  overallScore: number;
  status: "Eligible" | "Needs Improvement" | "Not Eligible";
  role: string;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"students" | "allUsers">("students");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    eligible: 0,
    needsImprovement: 0,
    notEligible: 0,
    avgScore: 0,
  });

  const getEligibilityStatus = (overall: number): StudentRow["status"] => {
    if (overall >= 70) return "Eligible";
    if (overall >= 40) return "Needs Improvement";
    return "Not Eligible";
  };

  const fetchData = async () => {
    setLoading(true);

    const [profilesRes, rolesRes, interviewRes, codingRes, aptitudeRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("interview_sessions").select("user_id, overall_score").not("overall_score", "is", null),
      supabase.from("coding_submissions").select("user_id, score"),
      supabase.from("aptitude_sessions").select("user_id, score").eq("status", "completed"),
    ]);

    const profiles = profilesRes.data || [];
    const roleMap: Record<string, string> = {};
    (rolesRes.data || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });

    // Aggregate scores per user
    const interviewScores: Record<string, number[]> = {};
    (interviewRes.data || []).forEach((s: any) => {
      if (!interviewScores[s.user_id]) interviewScores[s.user_id] = [];
      interviewScores[s.user_id].push(s.overall_score);
    });

    const codingScores: Record<string, number[]> = {};
    (codingRes.data || []).forEach((c: any) => {
      if (!codingScores[c.user_id]) codingScores[c.user_id] = [];
      if (c.score) codingScores[c.user_id].push(c.score);
    });

    const aptitudeScores: Record<string, number[]> = {};
    (aptitudeRes.data || []).forEach((a: any) => {
      if (!aptitudeScores[a.user_id]) aptitudeScores[a.user_id] = [];
      if (a.score) aptitudeScores[a.user_id].push(a.score);
    });

    const avg = (arr: number[]) =>
      arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    const rows: StudentRow[] = profiles.map(p => {
      const codingScore = avg(codingScores[p.user_id] || []);
      const aptitudeScore = avg(aptitudeScores[p.user_id] || []);
      const interviewScore = avg(interviewScores[p.user_id] || []);
      const overallScore = Math.round(
        (codingScore * 0.35) + (aptitudeScore * 0.25) + (interviewScore * 0.4)
      );
      return {
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name || "Unnamed",
        email: p.email,
        college: p.college,
        department: p.department,
        codingScore,
        aptitudeScore,
        interviewScore,
        overallScore,
        status: getEligibilityStatus(overallScore),
        role: roleMap[p.user_id] || "student",
      };
    });

    setStudents(rows);

    // Compute stats for students only
    const studentRows = rows.filter(r => r.role === "student");
    const eligible = studentRows.filter(r => r.status === "Eligible").length;
    const needsImprovement = studentRows.filter(r => r.status === "Needs Improvement").length;
    const notEligible = studentRows.filter(r => r.status === "Not Eligible").length;
    const avgScore = studentRows.length
      ? Math.round(studentRows.reduce((a, b) => a + b.overallScore, 0) / studentRows.length)
      : 0;
    setStats({ total: studentRows.length, eligible, needsImprovement, notEligible, avgScore });
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole as any })
      .eq("user_id", userId);
    if (error) {
      toast({ title: "Error updating role", description: error.message, variant: "destructive" });
    } else {
      setStudents(prev => prev.map(s => s.user_id === userId ? { ...s, role: newRole } : s));
      toast({ title: `Role updated to ${newRole}` });
    }
  };

  const filtered = students.filter(p => {
    const matchSearch = !search ||
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || p.role === roleFilter;
    const matchStatus = !statusFilter || p.status === statusFilter;
    const matchTab = activeTab === "allUsers" ? true : p.role === "student";
    return matchSearch && matchRole && matchStatus && matchTab;
  });

  const statusBadge = (status: StudentRow["status"]) => {
    if (status === "Eligible") return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
        <CheckCircle className="h-3 w-3" /> Eligible
      </span>
    );
    if (status === "Needs Improvement") return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
        <AlertTriangle className="h-3 w-3" /> Needs Improvement
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
        <XCircle className="h-3 w-3" /> Not Eligible
      </span>
    );
  };

  const ScoreBar = ({ value, max = 100 }: { value: number; max?: number }) => (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${value >= 70 ? "bg-success" : value >= 40 ? "bg-warning" : "bg-muted-foreground"}`}
          style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        />
      </div>
      <span className="text-xs text-foreground font-medium w-8 text-right">{value || "—"}</span>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Total Students", value: stats.total, color: "text-primary", bg: "bg-primary/10" },
            { label: "Eligible", value: stats.eligible, color: "text-success", bg: "bg-success/10" },
            { label: "Needs Improvement", value: stats.needsImprovement, color: "text-warning", bg: "bg-warning/10" },
            { label: "Not Eligible", value: stats.notEligible, color: "text-destructive", bg: "bg-destructive/10" },
            { label: "Avg Score", value: `${stats.avgScore}%`, color: "text-info", bg: "bg-info/10" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="glass-card p-4">
              <div className={`text-2xl font-display font-bold ${color}`}>{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-border pb-0">
          {(["students", "allUsers"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px ${
                activeTab === tab
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "students" ? "Student Performance" : "All Users"}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-10 bg-secondary border-border text-foreground"
            />
          </div>
          {activeTab === "allUsers" && (
            <Select value={roleFilter} onValueChange={v => setRoleFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-40 bg-secondary border-border text-foreground">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          )}
          {activeTab === "students" && (
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-48 bg-secondary border-border text-foreground">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Eligible">Eligible</SelectItem>
                <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                <SelectItem value="Not Eligible">Not Eligible</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {filtered.length} {activeTab === "students" ? "student" : "user"}{filtered.length !== 1 ? "s" : ""}
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              {activeTab === "students" ? (
                /* Student Performance Table */
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">College / Dept</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Coding</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Aptitude</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interview</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Overall</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{p.full_name}</p>
                              <p className="text-xs text-muted-foreground">{p.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-foreground">{p.college || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{p.department || "N/A"}</p>
                        </td>
                        <td className="p-4"><ScoreBar value={p.codingScore} /></td>
                        <td className="p-4"><ScoreBar value={p.aptitudeScore} /></td>
                        <td className="p-4"><ScoreBar value={p.interviewScore} /></td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className={`h-3.5 w-3.5 ${p.overallScore >= 70 ? "text-success" : p.overallScore >= 40 ? "text-warning" : "text-destructive"}`} />
                            <span className={`text-sm font-bold ${p.overallScore >= 70 ? "text-success" : p.overallScore >= 40 ? "text-warning" : "text-destructive"}`}>
                              {p.overallScore || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">{statusBadge(p.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                /* All Users Table */
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Department</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Change Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              {p.role === "admin" ? <Shield className="h-4 w-4 text-destructive" /> : <User className="h-4 w-4 text-primary" />}
                            </div>
                            <p className="text-sm font-medium text-foreground">{p.full_name}</p>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{p.email}</td>
                        <td className="p-4 text-sm text-muted-foreground">{p.department || "N/A"}</td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${
                            p.role === "admin"
                              ? "bg-destructive/10 text-destructive"
                              : p.role === "recruiter"
                              ? "bg-info/10 text-info"
                              : "bg-primary/10 text-primary"
                          }`}>
                            {p.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <Select value={p.role} onValueChange={v => handleRoleChange(p.user_id, v)}>
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="recruiter">Recruiter</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {filtered.length === 0 && (
                <p className="text-muted-foreground text-center py-10">No records found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
