import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Download, Award, Loader2, CheckCircle, AlertCircle, XCircle,
  BarChart2, Code2, Brain, Mic, Trophy,
} from "lucide-react";

interface CertData {
  name: string;
  email: string;
  photoBase64?: string;
  codingScore: number;
  aptitudeScore: number;
  interviewScore: number;
  overallScore: number;
  status: "Eligible" | "Needs Improvement" | "Not Eligible";
  generatedDate: string;
  certId: string;
}

function computeStatus(avg: number): "Eligible" | "Needs Improvement" | "Not Eligible" {
  if (avg >= 70) return "Eligible";
  if (avg >= 45) return "Needs Improvement";
  return "Not Eligible";
}

function genCertId(uid: string) {
  return `HRAI-CERT-${uid.substring(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

export default function PlacementCertificate() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certData, setCertData] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileRes, codingRes, aptitudeRes, interviewRes] = await Promise.all([
        supabase.from("profiles").select("full_name,email,avatar_url").eq("user_id", user.id).single(),
        supabase.from("coding_submissions").select("score").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("aptitude_sessions").select("score").eq("user_id", user.id).eq("status", "completed").order("created_at", { ascending: false }).limit(10),
        supabase.from("interview_sessions").select("overall_score").eq("user_id", user.id).eq("status", "completed").order("created_at", { ascending: false }).limit(10),
      ]);

      const profile = profileRes.data;
      const codingScores = (codingRes.data || []).map(s => s.score || 0);
      const aptitudeScores = (aptitudeRes.data || []).map(s => s.score || 0);
      const interviewScores = (interviewRes.data || []).map(s => s.overall_score || 0);

      const bestCoding = codingScores.length ? Math.max(...codingScores) : 0;
      const bestAptitude = aptitudeScores.length ? Math.max(...aptitudeScores) : 0;
      const bestInterview = interviewScores.length ? Math.max(...interviewScores) : 0;
      const overall = Math.round((bestCoding + bestAptitude + bestInterview) / 3);

      // Load avatar if exists
      let photoBase64: string | undefined;
      if (profile?.avatar_url) {
        try {
          const { data: blob } = await supabase.storage.from("resumes").download(profile.avatar_url);
          if (blob) {
            const reader = new FileReader();
            photoBase64 = await new Promise(res => {
              reader.onload = e => res(e.target?.result as string);
              reader.readAsDataURL(blob);
            });
          }
        } catch { /* no photo */ }
      }

      setCertData({
        name: profile?.full_name || "Student",
        email: profile?.email || user.email || "",
        photoBase64,
        codingScore: bestCoding,
        aptitudeScore: bestAptitude,
        interviewScore: bestInterview,
        overallScore: overall,
        status: computeStatus(overall),
        generatedDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
        certId: genCertId(user.id),
      });
    } catch (err: any) {
      toast({ title: "Error loading data", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const downloadCertificate = () => {
    if (!certData) return;
    setDownloading(true);
    const d = certData;

    const statusColor = d.status === "Eligible" ? "#22c55e" : d.status === "Needs Improvement" ? "#f59e0b" : "#ef4444";
    const statusBg = d.status === "Eligible" ? "#052e16" : d.status === "Needs Improvement" ? "#431407" : "#2d0d0d";

    // Bar chart SVG paths
    const bars = [
      { label: "Coding", score: d.codingScore, color: "#22d3ee" },
      { label: "Aptitude", score: d.aptitudeScore, color: "#a78bfa" },
      { label: "Interview", score: d.interviewScore, color: "#34d399" },
      { label: "Problem\nSolving", score: Math.round((d.codingScore * 0.6 + d.aptitudeScore * 0.4)), color: "#fb923c" },
      { label: "Logical\nReasoning", score: Math.round((d.aptitudeScore * 0.7 + d.interviewScore * 0.3)), color: "#f472b6" },
    ];

    const barSvg = bars.map((b, i) => {
      const x = 60 + i * 80;
      const barH = Math.max(4, Math.round((b.score / 100) * 120));
      const y = 140 - barH;
      return `
        <rect x="${x}" y="${y}" width="50" height="${barH}" rx="4" fill="${b.color}" opacity="0.9"/>
        <text x="${x + 25}" y="${y - 6}" text-anchor="middle" font-size="11" fill="${b.color}" font-weight="bold">${b.score}</text>
        <text x="${x + 25}" y="158" text-anchor="middle" font-size="9" fill="#94a3b8">${b.label.split("\n")[0]}</text>
        ${b.label.includes("\n") ? `<text x="${x + 25}" y="169" text-anchor="middle" font-size="9" fill="#94a3b8">${b.label.split("\n")[1]}</text>` : ""}
      `;
    }).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Placement Certificate - ${d.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:297mm;height:210mm;overflow:hidden;}
  body{font-family:'Inter',sans-serif;background:#0a0f1a;}
  .cert{width:297mm;height:210mm;background:linear-gradient(135deg,#0a0f1a 0%,#0d1829 40%,#0a1520 100%);
    position:relative;display:flex;flex-direction:column;overflow:hidden;padding:0;}

  /* Watermark */
  .watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    font-family:'Space Grotesk',sans-serif;font-size:80px;font-weight:800;
    color:rgba(34,211,238,0.04);letter-spacing:4px;white-space:nowrap;pointer-events:none;z-index:0;}

  /* Corner accents */
  .corner{position:absolute;width:60px;height:60px;border-color:#22d3ee;border-style:solid;opacity:0.4;}
  .corner-tl{top:16px;left:16px;border-width:2px 0 0 2px;}
  .corner-tr{top:16px;right:16px;border-width:2px 2px 0 0;}
  .corner-bl{bottom:16px;left:16px;border-width:0 0 2px 2px;}
  .corner-br{bottom:16px;right:16px;border-width:0 2px 2px 0;}

  /* Grid lines subtle */
  .grid-line{position:absolute;background:rgba(34,211,238,0.04);}
  .gl-h{left:0;right:0;height:1px;}
  .gl-v{top:0;bottom:0;width:1px;}

  /* Header */
  .header{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;
    padding:18px 32px 14px;border-bottom:1px solid rgba(34,211,238,0.15);}
  .brand{display:flex;align-items:center;gap:10px;}
  .brand-icon{width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#22d3ee,#0ea5e9);
    display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#0a0f1a;font-family:'Space Grotesk',sans-serif;}
  .brand-name{font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#fff;}
  .brand-sub{font-size:9px;color:#64748b;letter-spacing:2px;text-transform:uppercase;}
  .cert-title-wrap{text-align:center;}
  .cert-title{font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;
    color:transparent;background:linear-gradient(90deg,#22d3ee,#a78bfa);-webkit-background-clip:text;background-clip:text;
    letter-spacing:3px;text-transform:uppercase;}
  .cert-subtitle{font-size:9px;color:#475569;letter-spacing:2px;text-transform:uppercase;margin-top:2px;}
  .cert-id{font-size:8px;color:#334155;font-family:monospace;text-align:right;line-height:1.6;}

  /* Body */
  .body{position:relative;z-index:1;flex:1;display:grid;grid-template-columns:200px 1fr 240px;gap:0;}

  /* Left: Candidate card */
  .left-panel{padding:16px 16px 16px 28px;border-right:1px solid rgba(255,255,255,0.05);display:flex;flex-direction:column;align-items:center;}
  .photo-ring{width:72px;height:72px;border-radius:50%;padding:3px;background:linear-gradient(135deg,#22d3ee,#a78bfa);flex-shrink:0;margin-bottom:10px;}
  .photo-inner{width:100%;height:100%;border-radius:50%;overflow:hidden;background:#1e2d3d;display:flex;align-items:center;justify-content:center;font-size:26px;}
  .photo-inner img{width:100%;height:100%;object-fit:cover;}
  .cand-name{font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:700;color:#f1f5f9;text-align:center;line-height:1.3;margin-bottom:4px;}
  .cand-email{font-size:8px;color:#64748b;text-align:center;word-break:break-all;margin-bottom:12px;}
  .status-box{width:100%;padding:8px 10px;border-radius:8px;text-align:center;border:1px solid;margin-bottom:14px;}
  .status-label{font-size:8px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px;color:#94a3b8;}
  .status-value{font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:700;}
  .overall-ring{display:flex;flex-direction:column;align-items:center;}
  .overall-num{font-family:'Space Grotesk',sans-serif;font-size:28px;font-weight:800;color:#22d3ee;line-height:1;}
  .overall-label{font-size:8px;color:#475569;text-transform:uppercase;letter-spacing:1px;margin-top:2px;}
  .score-rows{width:100%;margin-top:12px;display:flex;flex-direction:column;gap:6px;}
  .score-row{display:flex;flex-direction:column;gap:2px;}
  .score-row-header{display:flex;justify-content:space-between;font-size:9px;color:#94a3b8;}
  .score-row-header span:last-child{color:#f1f5f9;font-weight:600;}
  .bar-track{height:4px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden;}
  .bar-fill{height:100%;border-radius:2px;}

  /* Middle: Body content */
  .mid-panel{padding:16px 20px;display:flex;flex-direction:column;gap:10px;}
  .section-label{font-size:8px;color:#22d3ee;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;font-weight:600;}
  .cert-body-text{font-size:10px;color:#94a3b8;line-height:1.8;padding:10px 12px;background:rgba(34,211,238,0.04);
    border-left:2px solid #22d3ee;border-radius:0 6px 6px 0;}

  /* Chart */
  .chart-wrap{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px 8px 6px;}
  .chart-title{font-size:8px;color:#475569;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;text-align:center;}

  /* Right: Scores detail */
  .right-panel{padding:16px 20px 16px 16px;border-left:1px solid rgba(255,255,255,0.05);}
  .score-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px;margin-bottom:8px;}
  .score-card-title{font-size:8px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
  .score-card-value{font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;line-height:1;}
  .score-card-sub{font-size:8px;color:#475569;margin-top:2px;}
  .bar-full{height:5px;border-radius:3px;background:rgba(255,255,255,0.06);margin-top:6px;overflow:hidden;}
  .bar-inner{height:100%;border-radius:3px;}

  /* Footer */
  .footer{position:relative;z-index:1;padding:10px 32px;border-top:1px solid rgba(34,211,238,0.1);
    display:flex;justify-content:space-between;align-items:center;}
  .footer-text{font-size:8px;color:#334155;letter-spacing:1px;}
  .footer-seal{display:flex;align-items:center;gap:6px;}
  .seal-dot{width:6px;height:6px;border-radius:50%;background:#22d3ee;}
  .seal-text{font-size:8px;color:#22d3ee;letter-spacing:1px;font-weight:600;}

  @media print{
    html,body{width:297mm;height:210mm;}
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    @page{size:A4 landscape;margin:0;}
  }
</style>
</head>
<body>
<div class="cert">
  <!-- Watermark -->
  <div class="watermark">HIREREADYAI</div>
  <!-- Corner accents -->
  <div class="corner corner-tl"></div>
  <div class="corner corner-tr"></div>
  <div class="corner corner-bl"></div>
  <div class="corner corner-br"></div>

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="brand-icon">H</div>
      <div>
        <div class="brand-name">HireReady<span style="color:#22d3ee">AI</span></div>
        <div class="brand-sub">Placement Intelligence Platform</div>
      </div>
    </div>
    <div class="cert-title-wrap">
      <div class="cert-title">Placement Performance Certificate</div>
      <div class="cert-subtitle">Official Assessment Record</div>
    </div>
    <div class="cert-id">
      <div>Certificate ID</div>
      <div style="color:#22d3ee;font-weight:600;">${d.certId}</div>
      <div>Issued: ${d.generatedDate}</div>
    </div>
  </div>

  <!-- Body -->
  <div class="body">
    <!-- Left: Candidate -->
    <div class="left-panel">
      <div class="photo-ring">
        <div class="photo-inner">
          ${d.photoBase64 ? `<img src="${d.photoBase64}" alt="Photo"/>` : "👤"}
        </div>
      </div>
      <div class="cand-name">${d.name}</div>
      <div class="cand-email">${d.email}</div>
      <div class="status-box" style="border-color:${statusColor}20;background:${statusBg};">
        <div class="status-label">Final Status</div>
        <div class="status-value" style="color:${statusColor};">${d.status}</div>
      </div>
      <div class="overall-ring">
        <div class="overall-num">${d.overallScore}</div>
        <div class="overall-label">Overall Score</div>
      </div>
      <div class="score-rows">
        <div class="score-row">
          <div class="score-row-header"><span>Coding Test</span><span>${d.codingScore}/100</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${d.codingScore}%;background:#22d3ee;"></div></div>
        </div>
        <div class="score-row">
          <div class="score-row-header"><span>Aptitude Test</span><span>${d.aptitudeScore}/100</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${d.aptitudeScore}%;background:#a78bfa;"></div></div>
        </div>
        <div class="score-row">
          <div class="score-row-header"><span>AI Interview</span><span>${d.interviewScore}/100</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${d.interviewScore}%;background:#34d399;"></div></div>
        </div>
      </div>
    </div>

    <!-- Mid: Text + Chart -->
    <div class="mid-panel">
      <div>
        <div class="section-label">Verification Statement</div>
        <div class="cert-body-text">
          This certificate verifies that the above candidate has completed the HireReadyAI Placement Preparation
          and Evaluation Process, including coding assessment, aptitude evaluation, and AI mock interview. The
          scores recorded herein represent the candidate's best performance across all assessment modules
          conducted on the HireReadyAI platform.
        </div>
      </div>
      <div>
        <div class="section-label">Skills Performance Analytics</div>
        <div class="chart-wrap">
          <div class="chart-title">Score Breakdown (out of 100)</div>
          <svg width="100%" viewBox="0 0 480 175" xmlns="http://www.w3.org/2000/svg">
            <!-- grid lines -->
            <line x1="50" y1="20" x2="50" y2="140" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            <line x1="50" y1="140" x2="460" y2="140" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            ${[0,25,50,75,100].map(v => `
              <line x1="50" y1="${140 - v*1.2}" x2="460" y2="${140 - v*1.2}" stroke="rgba(255,255,255,0.04)" stroke-width="1" stroke-dasharray="3,3"/>
              <text x="44" y="${144 - v*1.2}" text-anchor="end" font-size="8" fill="rgba(148,163,184,0.6)">${v}</text>
            `).join("")}
            ${barSvg}
          </svg>
        </div>
      </div>
    </div>

    <!-- Right: Score cards -->
    <div class="right-panel">
      <div class="section-label" style="margin-bottom:10px;">Assessment Detail</div>
      <div class="score-card">
        <div class="score-card-title">💻 Coding Challenge</div>
        <div class="score-card-value" style="color:#22d3ee;">${d.codingScore}<span style="font-size:12px;color:#475569;">/100</span></div>
        <div class="score-card-sub">DSA &amp; Problem Solving</div>
        <div class="bar-full"><div class="bar-inner" style="width:${d.codingScore}%;background:linear-gradient(90deg,#22d3ee,#0ea5e9);"></div></div>
      </div>
      <div class="score-card">
        <div class="score-card-title">🧠 Aptitude Evaluation</div>
        <div class="score-card-value" style="color:#a78bfa;">${d.aptitudeScore}<span style="font-size:12px;color:#475569;">/100</span></div>
        <div class="score-card-sub">Logical &amp; Analytical Reasoning</div>
        <div class="bar-full"><div class="bar-inner" style="width:${d.aptitudeScore}%;background:linear-gradient(90deg,#a78bfa,#7c3aed);"></div></div>
      </div>
      <div class="score-card">
        <div class="score-card-title">🎤 AI Mock Interview</div>
        <div class="score-card-value" style="color:#34d399;">${d.interviewScore}<span style="font-size:12px;color:#475569;">/100</span></div>
        <div class="score-card-sub">Communication &amp; Technical Skills</div>
        <div class="bar-full"><div class="bar-inner" style="width:${d.interviewScore}%;background:linear-gradient(90deg,#34d399,#059669);"></div></div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-text">© ${new Date().getFullYear()} HireReadyAI · Placement Intelligence Platform · All rights reserved</div>
    <div class="footer-seal">
      <div class="seal-dot"></div>
      <div class="seal-text">VERIFIED ASSESSMENT RECORD</div>
      <div class="seal-dot"></div>
    </div>
    <div class="footer-text">Generated: ${d.generatedDate} · ID: ${d.certId}</div>
  </div>
</div>
<script>window.onload=()=>window.print();</script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      // Fallback: direct download
      const a = document.createElement("a");
      a.href = url;
      a.download = `HireReadyAI_Certificate_${d.name.replace(/\s+/g, "_")}.html`;
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setDownloading(false);
  };

  const statusIcon = certData?.status === "Eligible"
    ? <CheckCircle className="h-5 w-5 text-success" />
    : certData?.status === "Needs Improvement"
    ? <AlertCircle className="h-5 w-5 text-warning" />
    : <XCircle className="h-5 w-5 text-destructive" />;

  const statusColor = certData?.status === "Eligible"
    ? "text-success border-success/30 bg-success/5"
    : certData?.status === "Needs Improvement"
    ? "text-warning border-warning/30 bg-warning/5"
    : "text-destructive border-destructive/30 bg-destructive/5";

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">Placement Performance Certificate</h1>
              <p className="text-sm text-muted-foreground">Official assessment record from HireReadyAI platform</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center">
            <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin mb-3" />
            <p className="text-muted-foreground">Loading your performance data…</p>
          </div>
        ) : certData ? (
          <>
            {/* Certificate Preview Card */}
            <div ref={certRef} className="glass-card overflow-hidden border border-primary/20">
              {/* Cert Header */}
              <div className="bg-gradient-to-r from-card via-card to-primary/5 px-6 py-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center text-primary-foreground font-display font-bold text-lg">H</div>
                  <div>
                    <p className="font-display font-bold text-foreground">HireReady<span className="text-primary">AI</span></p>
                    <p className="text-xs text-muted-foreground tracking-widest uppercase">Placement Intelligence Platform</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs tracking-[3px] text-primary uppercase font-semibold">Placement Performance Certificate</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Official Assessment Record</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Certificate ID</p>
                  <p className="text-xs font-mono text-primary">{certData.certId}</p>
                  <p className="text-xs text-muted-foreground">{certData.generatedDate}</p>
                </div>
              </div>

              {/* Main Body */}
              <div className="grid grid-cols-[180px_1fr_200px] divide-x divide-border/30">
                {/* Left: Candidate */}
                <div className="p-5 flex flex-col items-center">
                  {/* Photo */}
                  <div className="w-18 h-18 rounded-full p-0.5 bg-gradient-to-br from-primary to-accent mb-3">
                    <div className="w-full h-full rounded-full overflow-hidden bg-muted flex items-center justify-center text-3xl" style={{ width: 68, height: 68 }}>
                      {certData.photoBase64
                        ? <img src={certData.photoBase64} alt="profile" className="w-full h-full object-cover" />
                        : "👤"}
                    </div>
                  </div>
                  <p className="font-display font-bold text-foreground text-sm text-center leading-tight mb-1">{certData.name}</p>
                  <p className="text-xs text-muted-foreground text-center break-all mb-3">{certData.email}</p>

                  {/* Status */}
                  <div className={`w-full px-3 py-2 rounded-lg border text-center mb-4 ${statusColor}`}>
                    <p className="text-xs uppercase tracking-widest opacity-70 mb-0.5">Final Status</p>
                    <div className="flex items-center justify-center gap-1.5">
                      {statusIcon}
                      <p className="font-display font-bold text-sm">{certData.status}</p>
                    </div>
                  </div>

                  {/* Overall */}
                  <div className="text-center mb-4">
                    <p className="text-4xl font-display font-bold text-primary leading-none">{certData.overallScore}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Overall Score</p>
                  </div>

                  {/* Mini bars */}
                  <div className="w-full space-y-2">
                    {[
                      { label: "Coding", score: certData.codingScore, color: "bg-info" },
                      { label: "Aptitude", score: certData.aptitudeScore, color: "bg-primary" },
                      { label: "Interview", score: certData.interviewScore, color: "bg-success" },
                    ].map(b => (
                      <div key={b.label}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-muted-foreground">{b.label}</span>
                          <span className="text-foreground font-medium">{b.score}</span>
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${b.color} rounded-full`} style={{ width: `${b.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mid: text + chart */}
                <div className="p-5 flex flex-col gap-4">
                  <div>
                    <p className="text-xs text-primary uppercase tracking-widest mb-2 font-semibold">Verification Statement</p>
                    <div className="text-sm text-muted-foreground leading-relaxed p-3 bg-primary/5 border-l-2 border-primary/40 rounded-r-lg">
                      This certificate verifies that the above candidate has completed the HireReadyAI Placement
                      Preparation and Evaluation Process, including coding assessment, aptitude evaluation, and
                      AI mock interview.
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-primary uppercase tracking-widest mb-2 font-semibold flex items-center gap-1.5">
                      <BarChart2 className="h-3 w-3" /> Skills Performance Analytics
                    </p>
                    <div className="bg-muted/30 border border-border/30 rounded-lg p-3">
                      {[
                        { label: "Coding Skills", score: certData.codingScore, color: "from-info to-cyan-400" },
                        { label: "Logical Reasoning", score: Math.round(certData.aptitudeScore * 0.7 + certData.interviewScore * 0.3), color: "from-primary to-emerald-400" },
                        { label: "Communication", score: certData.interviewScore, color: "from-success to-green-400" },
                        { label: "Problem Solving", score: Math.round(certData.codingScore * 0.6 + certData.aptitudeScore * 0.4), color: "from-warning to-orange-400" },
                        { label: "Analytical Thinking", score: Math.round(certData.aptitudeScore * 0.8 + certData.codingScore * 0.2), color: "from-accent to-violet-400" },
                      ].map(b => (
                        <div key={b.label} className="flex items-center gap-3 mb-2">
                          <span className="text-xs text-muted-foreground w-32 flex-shrink-0">{b.label}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${b.color} rounded-full transition-all`} style={{ width: `${b.score}%` }} />
                          </div>
                          <span className="text-xs font-medium text-foreground w-8 text-right">{b.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Score cards */}
                <div className="p-5 space-y-3">
                  <p className="text-xs text-primary uppercase tracking-widest font-semibold mb-3">Assessment Detail</p>
                  {[
                    { icon: Code2, label: "Coding Challenge", sub: "DSA & Problem Solving", score: certData.codingScore, colorClass: "text-info", gradClass: "from-info/20 to-info/5", border: "border-info/20" },
                    { icon: Brain, label: "Aptitude Test", sub: "Logical & Analytical", score: certData.aptitudeScore, colorClass: "text-primary", gradClass: "from-primary/20 to-primary/5", border: "border-primary/20" },
                    { icon: Mic, label: "AI Interview", sub: "Communication & Tech", score: certData.interviewScore, colorClass: "text-success", gradClass: "from-success/20 to-success/5", border: "border-success/20" },
                  ].map(c => (
                    <div key={c.label} className={`p-3 rounded-lg bg-gradient-to-br ${c.gradClass} border ${c.border}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <c.icon className={`h-3 w-3 ${c.colorClass}`} />
                        <span className="text-xs text-muted-foreground">{c.label}</span>
                      </div>
                      <p className={`text-2xl font-display font-bold ${c.colorClass}`}>
                        {c.score}<span className="text-xs text-muted-foreground">/100</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{c.sub}</p>
                      <div className="h-1 bg-muted/50 rounded-full mt-2 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${c.gradClass.replace("/20", "").replace("/5", "")}`}
                          style={{ width: `${c.score}%`, opacity: 0.8 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cert Footer */}
              <div className="px-6 py-3 border-t border-border/30 flex justify-between items-center bg-muted/20">
                <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} HireReadyAI · All rights reserved</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-xs text-primary font-semibold tracking-widest uppercase">Verified Assessment Record</p>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <p className="text-xs text-muted-foreground">{certData.generatedDate}</p>
              </div>
            </div>

            {/* Download button */}
            <div className="flex justify-center">
              <Button
                onClick={downloadCertificate}
                disabled={downloading}
                className="gradient-bg text-primary-foreground px-8 py-3 text-base font-semibold shadow-lg"
              >
                {downloading
                  ? <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  : <Download className="h-5 w-5 mr-2" />}
                Download Placement Certificate (PDF)
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Tip: When the print dialog opens, select "Save as PDF" to download. Choose landscape orientation for best results.
            </p>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
