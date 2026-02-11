import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Search, User, Download, CheckCircle, XCircle, Star,
  ChevronDown, ChevronUp, Filter
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  college: string | null;
  department: string | null;
  skills: string[] | null;
  graduation_year: number | null;
  bio: string | null;
}

interface InterviewStats {
  count: number;
  avgScore: number;
}

interface Decision {
  decision: string;
  notes: string | null;
}

export default function RecruiterStudents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [interviewStats, setInterviewStats] = useState<Record<string, InterviewStats>>({});
  const [resumeCounts, setResumeCounts] = useState<Record<string, number>>({});
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [scoreFilter, setScoreFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      const [profilesRes, sessionsRes, resumesRes, decisionsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("interview_sessions").select("user_id, overall_score, status"),
        supabase.from("resumes").select("user_id"),
        supabase.from("candidate_decisions").select("*").eq("recruiter_id", user.id),
      ]);

      setProfiles(profilesRes.data || []);

      // Aggregate interview stats per user
      const statsMap: Record<string, InterviewStats> = {};
      (sessionsRes.data || []).forEach((s: any) => {
        if (!statsMap[s.user_id]) statsMap[s.user_id] = { count: 0, avgScore: 0 };
        statsMap[s.user_id].count++;
        if (s.overall_score) {
          const prev = statsMap[s.user_id];
          prev.avgScore = Math.round(
            ((prev.avgScore * (prev.count - 1)) + s.overall_score) / prev.count
          );
        }
      });
      setInterviewStats(statsMap);

      // Resume counts
      const rcMap: Record<string, number> = {};
      (resumesRes.data || []).forEach((r: any) => {
        rcMap[r.user_id] = (rcMap[r.user_id] || 0) + 1;
      });
      setResumeCounts(rcMap);

      // Decisions
      const decMap: Record<string, Decision> = {};
      (decisionsRes.data || []).forEach((d: any) => {
        decMap[d.student_user_id] = { decision: d.decision, notes: d.notes };
      });
      setDecisions(decMap);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const getReadinessScore = (uid: string) => {
    const stats = interviewStats[uid];
    const hasResume = (resumeCounts[uid] || 0) > 0;
    if (!stats) return hasResume ? 20 : 0;
    const interviewScore = Math.min(stats.avgScore, 100);
    const resumeBonus = hasResume ? 20 : 0;
    const practiceBonus = Math.min(stats.count * 10, 30);
    return Math.min(interviewScore * 0.5 + resumeBonus + practiceBonus, 100);
  };

  const allSkills = [...new Set(profiles.flatMap(p => p.skills || []))].sort();
  const allDepts = [...new Set(profiles.map(p => p.department).filter(Boolean))].sort();

  const filtered = profiles.filter(p => {
    const matchSearch = !search || 
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.college?.toLowerCase().includes(search.toLowerCase());
    const matchSkill = !skillFilter || (p.skills || []).some(s => s.toLowerCase() === skillFilter.toLowerCase());
    const matchDept = !deptFilter || p.department === deptFilter;
    const score = getReadinessScore(p.user_id);
    const matchScore = !scoreFilter || 
      (scoreFilter === "high" && score >= 70) ||
      (scoreFilter === "medium" && score >= 40 && score < 70) ||
      (scoreFilter === "low" && score < 40);
    return matchSearch && matchSkill && matchDept && matchScore;
  });

  const handleDecision = async (studentUserId: string, decision: string) => {
    if (!user) return;
    const { error } = await supabase.from("candidate_decisions").upsert({
      recruiter_id: user.id,
      student_user_id: studentUserId,
      decision,
      notes: noteText || decisions[studentUserId]?.notes || null,
    }, { onConflict: "recruiter_id,student_user_id" });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setDecisions(prev => ({ ...prev, [studentUserId]: { decision, notes: noteText || prev[studentUserId]?.notes || null } }));
      toast({ title: `Student ${decision}` });
      setNoteText("");
    }
  };

  const handleDownloadResume = async (studentUserId: string, studentName: string) => {
    const { data } = await supabase.from("resumes").select("file_url, file_name").eq("user_id", studentUserId).limit(1).single();
    if (data?.file_url) {
      const { data: fileData } = await supabase.storage.from("resumes").download(data.file_url);
      if (fileData) {
        const url = URL.createObjectURL(fileData);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.file_name || `${studentName}_resume.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } else {
      toast({ title: "No resume uploaded", variant: "destructive" });
    }
  };

  const decisionColor = (d?: string) => {
    if (d === "selected") return "bg-success/10 text-success";
    if (d === "shortlisted") return "bg-warning/10 text-warning";
    if (d === "rejected") return "bg-destructive/10 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  const ReadinessBar = ({ score }: { score: number }) => (
    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${score >= 70 ? "bg-success" : score >= 40 ? "bg-warning" : "bg-destructive"}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Filters */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Filter Candidates</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, email, college..." className="pl-10 bg-secondary border-border text-foreground" />
            </div>
            <Select value={skillFilter} onValueChange={v => setSkillFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-secondary border-border text-foreground">
                <SelectValue placeholder="Filter by skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {allSkills.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={deptFilter} onValueChange={v => setDeptFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-secondary border-border text-foreground">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {allDepts.map(d => <SelectItem key={d!} value={d!}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={scoreFilter} onValueChange={v => setScoreFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-secondary border-border text-foreground">
                <SelectValue placeholder="Readiness score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="high">High (70+)</SelectItem>
                <SelectItem value="medium">Medium (40-69)</SelectItem>
                <SelectItem value="low">Low (&lt;40)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">{filtered.length} candidate{filtered.length !== 1 ? "s" : ""} found</p>

        {/* Student cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(p => {
              const score = Math.round(getReadinessScore(p.user_id));
              const stats = interviewStats[p.user_id];
              const dec = decisions[p.user_id];
              const expanded = expandedId === p.user_id;

              return (
                <div key={p.id} className="glass-card overflow-hidden">
                  {/* Summary row */}
                  <div
                    className="p-5 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(expanded ? null : p.user_id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{p.full_name || "Unnamed"}</p>
                        {dec && (
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${decisionColor(dec.decision)}`}>
                            {dec.decision}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{p.college || "N/A"} • {p.department || "N/A"}</p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-1 w-32">
                      <span className="text-sm font-semibold text-foreground">{score}%</span>
                      <ReadinessBar score={score} />
                    </div>
                    <div className="hidden md:block text-sm text-muted-foreground w-20 text-right">
                      {stats?.count || 0} interview{(stats?.count || 0) !== 1 ? "s" : ""}
                    </div>
                    {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </div>

                  {/* Expanded details */}
                  {expanded && (
                    <div className="border-t border-border p-5 space-y-4 bg-card/50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Info */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-foreground">Contact</h4>
                          <p className="text-sm text-muted-foreground">{p.email}</p>
                          <p className="text-sm text-muted-foreground">Graduation: {p.graduation_year || "N/A"}</p>
                          {p.bio && <p className="text-sm text-muted-foreground">{p.bio}</p>}
                        </div>

                        {/* Skills */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-foreground">Skills</h4>
                          {(p.skills || []).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {p.skills!.map(s => (
                                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No skills listed</p>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-foreground">Performance</h4>
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-2xl font-bold text-foreground">{score}%</p>
                              <p className="text-xs text-muted-foreground">Readiness</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-foreground">{stats?.avgScore || "—"}</p>
                              <p className="text-xs text-muted-foreground">Avg Interview</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-foreground">{resumeCounts[p.user_id] || 0}</p>
                              <p className="text-xs text-muted-foreground">Resumes</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-1">Recruiter Notes</h4>
                        <Textarea
                          value={expandedId === p.user_id ? (noteText || dec?.notes || "") : ""}
                          onChange={e => setNoteText(e.target.value)}
                          placeholder="Add evaluation notes..."
                          rows={2}
                          className="bg-secondary border-border text-foreground"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="border-success text-success hover:bg-success/10" onClick={() => handleDecision(p.user_id, "selected")}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Select
                        </Button>
                        <Button size="sm" variant="outline" className="border-warning text-warning hover:bg-warning/10" onClick={() => handleDecision(p.user_id, "shortlisted")}>
                          <Star className="h-4 w-4 mr-1" /> Shortlist
                        </Button>
                        <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleDecision(p.user_id, "rejected")}>
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownloadResume(p.user_id, p.full_name)}>
                          <Download className="h-4 w-4 mr-1" /> Resume
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-muted-foreground text-center py-10">No candidates found.</p>}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
