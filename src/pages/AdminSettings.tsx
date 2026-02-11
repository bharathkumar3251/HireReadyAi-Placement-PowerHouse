import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Users, Briefcase, FileText } from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [profilesRes, sessionsRes, decisionsRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("interview_sessions").select("user_id, overall_score, status, domain"),
        supabase.from("candidate_decisions").select("student_user_id, decision, notes, updated_at"),
      ]);
      setProfiles(profilesRes.data || []);
      setSessions(sessionsRes.data || []);
      setDecisions(decisionsRes.data || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const exportStudentReport = () => {
    const userScores: Record<string, number[]> = {};
    sessions.forEach(s => {
      if (!userScores[s.user_id]) userScores[s.user_id] = [];
      if (s.overall_score) userScores[s.user_id].push(s.overall_score);
    });

    const decMap: Record<string, string> = {};
    decisions.forEach(d => { decMap[d.student_user_id] = d.decision; });

    const header = "Name,Email,College,Department,Skills,Avg Score,Interviews,Decision\n";
    const rows = profiles.map(p => {
      const scores = userScores[p.user_id] || [];
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      return `"${p.full_name}","${p.email}","${p.college || ""}","${p.department || ""}","${(p.skills || []).join("; ")}",${avg},${scores.length},"${decMap[p.user_id] || "pending"}"`;
    }).join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hireready_placement_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report exported!" });
  };

  const exportDecisionReport = () => {
    const profileMap: Record<string, any> = {};
    profiles.forEach(p => { profileMap[p.user_id] = p; });

    const header = "Student,Email,Decision,Notes,Date\n";
    const rows = decisions.map(d => {
      const p = profileMap[d.student_user_id] || {};
      return `"${p.full_name || "Unknown"}","${p.email || ""}","${d.decision}","${d.notes || ""}","${new Date(d.updated_at).toLocaleDateString()}"`;
    }).join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hireready_decisions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Decision report exported!" });
  };

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
        <h2 className="text-xl font-display font-bold text-foreground">Placement Reports & Settings</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-display font-semibold text-foreground">Student Placement Report</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Export a comprehensive CSV with all student profiles, scores, interview counts, and recruiter decisions.
            </p>
            <p className="text-xs text-muted-foreground">{profiles.length} students • {sessions.length} interviews</p>
            <Button onClick={exportStudentReport} className="gradient-bg text-primary-foreground">
              <Download className="h-4 w-4 mr-2" /> Export Student Report
            </Button>
          </div>

          <div className="glass-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-info" />
              <h3 className="text-lg font-display font-semibold text-foreground">Hiring Decisions Report</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Export all recruiter hiring decisions with notes and timestamps.
            </p>
            <p className="text-xs text-muted-foreground">{decisions.length} decisions recorded</p>
            <Button onClick={exportDecisionReport} variant="outline">
              <Download className="h-4 w-4 mr-2" /> Export Decisions
            </Button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">Platform Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-foreground">{profiles.length}</p>
              <p className="text-sm text-muted-foreground">Students</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-foreground">{sessions.length}</p>
              <p className="text-sm text-muted-foreground">Interviews</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-foreground">{decisions.filter(d => d.decision === "selected").length}</p>
              <p className="text-sm text-muted-foreground">Selected</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-foreground">{decisions.filter(d => d.decision === "shortlisted").length}</p>
              <p className="text-sm text-muted-foreground">Shortlisted</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
