import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, Printer, CheckCircle, XCircle, Award, Loader2, Shield } from "lucide-react";

interface StudentData {
  profile: any;
  interviewScore: number;
  interviewCount: number;
  codingScore: number;
  codingSolved: number;
  aptitudeScore: number;
  aptitudeTests: number;
  resumeCount: number;
  skills: string[];
  decision: string | null;
  eligible: boolean;
}

export default function ResumeGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);

    const [profileRes, interviewsRes, codingRes, aptitudeRes, resumeRes, decisionRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("interview_sessions").select("overall_score, status").eq("user_id", user.id),
      supabase.from("coding_submissions").select("score, status").eq("user_id", user.id),
      supabase.from("aptitude_sessions").select("score, status").eq("user_id", user.id).eq("status", "completed"),
      supabase.from("resumes").select("id").eq("user_id", user.id),
      supabase.from("candidate_decisions").select("decision").eq("student_user_id", user.id).limit(1),
    ]);

    const profile = profileRes.data;
    const interviews = interviewsRes.data || [];
    const coding = codingRes.data || [];
    const aptitude = (aptitudeRes.data as any[]) || [];

    const completedInterviews = interviews.filter(i => i.overall_score);
    const interviewScore = completedInterviews.length
      ? Math.round(completedInterviews.reduce((a, b) => a + (b.overall_score || 0), 0) / completedInterviews.length)
      : 0;
    
    const codingSolved = new Set(coding.filter(c => c.status === "accepted").map((c: any) => c.score)).size;
    const codingScore = coding.length ? Math.round(coding.reduce((a, b) => a + (b.score || 0), 0) / coding.length) : 0;
    
    const aptitudeScore = aptitude.length ? Math.round(aptitude.reduce((a: number, b: any) => a + (b.score || 0), 0) / aptitude.length) : 0;

    const decision = (decisionRes.data as any[])?.[0]?.decision || null;

    const eligible = interviewScore >= 50 && codingScore >= 40 && aptitudeScore >= 40;

    setData({
      profile,
      interviewScore,
      interviewCount: completedInterviews.length,
      codingScore,
      codingSolved,
      aptitudeScore,
      aptitudeTests: aptitude.length,
      resumeCount: resumeRes.data?.length || 0,
      skills: profile?.skills || [],
      decision,
      eligible,
    });
    setLoading(false);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
      <head><title>HireReadyAI Resume - ${data?.profile?.full_name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 3px solid #0891b2; padding-bottom: 20px; margin-bottom: 24px; }
        .header h1 { font-size: 28px; color: #0891b2; margin-bottom: 4px; }
        .header p { font-size: 13px; color: #666; }
        .badge { display: inline-block; background: #0891b2; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; margin-top: 8px; }
        .section { margin-bottom: 20px; }
        .section h2 { font-size: 16px; color: #0891b2; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .metric { background: #f8fafc; padding: 10px; border-radius: 6px; text-align: center; }
        .metric .score { font-size: 24px; font-weight: 700; color: #0891b2; }
        .metric .label { font-size: 11px; color: #666; }
        .skills { display: flex; flex-wrap: wrap; gap: 6px; }
        .skill { background: #e0f2fe; color: #0369a1; padding: 3px 10px; border-radius: 12px; font-size: 12px; }
        .status { padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 13px; display: inline-block; }
        .eligible { background: #d1fae5; color: #065f46; }
        .not-eligible { background: #fee2e2; color: #991b1b; }
        .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #999; }
        @media print { body { padding: 20px; } }
      </style>
      </head>
      <body>
        ${printRef.current.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return <DashboardLayout><p className="text-muted-foreground">No data available.</p></DashboardLayout>;

  const readinessScore = Math.round((data.interviewScore * 0.35 + data.codingScore * 0.35 + data.aptitudeScore * 0.3));

  const EligibilityItem = ({ label, passed }: { label: string; passed: boolean }) => (
    <div className="flex items-center gap-2">
      {passed ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
      <span className={`text-sm ${passed ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Eligibility check */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Eligibility Check
            </h2>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${data.eligible ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              {data.eligible ? "✓ Eligible" : "✗ Not Yet Eligible"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <EligibilityItem label={`Interview: ${data.interviewScore}% (≥50%)`} passed={data.interviewScore >= 50} />
            <EligibilityItem label={`Coding: ${data.codingScore}% (≥40%)`} passed={data.codingScore >= 40} />
            <EligibilityItem label={`Aptitude: ${data.aptitudeScore}% (≥40%)`} passed={data.aptitudeScore >= 40} />
            <EligibilityItem label={`Resume: ${data.resumeCount > 0 ? "Uploaded" : "Missing"}`} passed={data.resumeCount > 0} />
          </div>
          {!data.eligible && (
            <p className="text-sm text-muted-foreground">Complete all requirements to unlock your placement resume.</p>
          )}
        </div>

        {/* Scores overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-card p-4 text-center">
            <p className="text-3xl font-display font-bold text-primary">{readinessScore}%</p>
            <p className="text-xs text-muted-foreground">Overall Readiness</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-3xl font-display font-bold text-foreground">{data.interviewScore}%</p>
            <p className="text-xs text-muted-foreground">Interview Score</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-3xl font-display font-bold text-foreground">{data.codingScore}%</p>
            <p className="text-xs text-muted-foreground">Coding Score</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-3xl font-display font-bold text-foreground">{data.aptitudeScore}%</p>
            <p className="text-xs text-muted-foreground">Aptitude Score</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handlePrint} disabled={!data.eligible} className="gradient-bg text-primary-foreground">
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
          <Button onClick={handlePrint} disabled={!data.eligible} variant="outline">
            <Printer className="h-4 w-4 mr-2" /> Print Resume
          </Button>
        </div>

        {/* PDF Preview */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Resume Preview
          </h3>
          <div ref={printRef} className="bg-white text-black p-8 rounded-lg">
            <div className="header" style={{ textAlign: "center", borderBottom: "3px solid #0891b2", paddingBottom: "20px", marginBottom: "24px" }}>
              <h1 style={{ fontSize: "28px", color: "#0891b2", marginBottom: "4px" }}>{data.profile?.full_name || "Student Name"}</h1>
              <p style={{ fontSize: "13px", color: "#666" }}>
                {data.profile?.email} {data.profile?.phone && `| ${data.profile.phone}`}
              </p>
              <p style={{ fontSize: "13px", color: "#666" }}>
                {data.profile?.college && data.profile.college} {data.profile?.department && `| ${data.profile.department}`}
                {data.profile?.graduation_year && ` | Class of ${data.profile.graduation_year}`}
              </p>
              {data.eligible && (
                <span style={{ display: "inline-block", background: "#0891b2", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", marginTop: "8px" }}>
                  ✓ HireReadyAI Verified
                </span>
              )}
            </div>

            {data.profile?.bio && (
              <div style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "16px", color: "#0891b2", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>Professional Summary</h2>
                <p style={{ fontSize: "13px" }}>{data.profile.bio}</p>
              </div>
            )}

            {data.skills.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "16px", color: "#0891b2", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>Skills</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {data.skills.map(s => (
                    <span key={s} style={{ background: "#e0f2fe", color: "#0369a1", padding: "3px 10px", borderRadius: "12px", fontSize: "12px" }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "16px", color: "#0891b2", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>Performance Metrics</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: "#0891b2" }}>{readinessScore}%</div>
                  <div style={{ fontSize: "11px", color: "#666" }}>Overall Readiness</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: "#0891b2" }}>{data.interviewScore}%</div>
                  <div style={{ fontSize: "11px", color: "#666" }}>Interview ({data.interviewCount} sessions)</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: "#0891b2" }}>{data.codingScore}%</div>
                  <div style={{ fontSize: "11px", color: "#666" }}>Coding ({data.codingSolved} solved)</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: "#0891b2" }}>{data.aptitudeScore}%</div>
                  <div style={{ fontSize: "11px", color: "#666" }}>Aptitude ({data.aptitudeTests} tests)</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "16px", color: "#0891b2", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>Placement Status</h2>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span style={{
                  padding: "6px 16px", borderRadius: "20px", fontWeight: 600, fontSize: "13px",
                  background: data.eligible ? "#d1fae5" : "#fee2e2",
                  color: data.eligible ? "#065f46" : "#991b1b"
                }}>
                  {data.eligible ? "✓ Placement Eligible" : "✗ Not Yet Eligible"}
                </span>
                {data.decision && (
                  <span style={{
                    padding: "6px 16px", borderRadius: "20px", fontWeight: 600, fontSize: "13px",
                    background: data.decision === "selected" ? "#d1fae5" : data.decision === "shortlisted" ? "#fef3c7" : "#fee2e2",
                    color: data.decision === "selected" ? "#065f46" : data.decision === "shortlisted" ? "#92400e" : "#991b1b"
                  }}>
                    {data.decision === "selected" ? "✓ Selected" : data.decision === "shortlisted" ? "★ Shortlisted" : "Evaluation Pending"}
                  </span>
                )}
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "30px", paddingTop: "15px", borderTop: "1px solid #e2e8f0", fontSize: "11px", color: "#999" }}>
              Generated by HireReadyAI Platform • {new Date().toLocaleDateString()} • Verified Assessment Report
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
