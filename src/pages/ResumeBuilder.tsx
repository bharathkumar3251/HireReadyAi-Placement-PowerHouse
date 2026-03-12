import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, FileText, Save, Sparkles, Download, Trash2,
  Camera, User, BookOpen, Code2, Brain, Star, Loader2,
} from "lucide-react";

interface ResumeData {
  name: string;
  email: string;
  phone: string;
  registerNumber: string;
  college: string;
  department: string;
  summary: string;
  skills: string;
  programmingLanguages: string;
  experience: string;
  education: string;
  projects: string;
  domain: string;
  photoBase64?: string;
  codingScore?: number;
  aptitudeScore?: number;
  interviewScore?: number;
  finalStatus?: string;
  interviewDate?: string;
  candidateId?: string;
}

const DOMAINS = [
  "Artificial Intelligence", "Data Science", "Machine Learning",
  "Web Development", "Mobile App Development", "Cyber Security",
  "Cloud Computing", "DevOps", "Software Engineering", "Game Development",
  "Blockchain", "UI/UX Design", "Embedded Systems", "Internet of Things",
  "Networking", "Robotics", "Product Management", "Digital Marketing",
  "Finance & Analytics", "Business Intelligence",
];

function generateCandidateId(name: string) {
  const prefix = name ? name.substring(0, 3).toUpperCase() : "CND";
  const ts = Date.now().toString(36).toUpperCase();
  return `HR-${prefix}-${ts}`;
}

function computeStatus(coding: number, aptitude: number, interview: number) {
  const avg = (coding + aptitude + interview) / 3;
  if (avg >= 70) return "Eligible";
  if (avg >= 45) return "Needs Improvement";
  return "Not Eligible";
}

export default function ResumeBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"build" | "upload">("build");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumes, setResumes] = useState<any[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [loadingScores, setLoadingScores] = useState(false);
  const [formData, setFormData] = useState<ResumeData>({
    name: "", email: "", phone: "", registerNumber: "", college: "",
    department: "", summary: "", skills: "", programmingLanguages: "",
    experience: "", education: "", projects: "", domain: "Web Development",
    codingScore: 0, aptitudeScore: 0, interviewScore: 0,
  });

  useEffect(() => {
    if (!user) return;
    fetchResumes();
    prefillProfile();
    fetchRealScores();
  }, [user]);

  const fetchResumes = async () => {
    const { data } = await supabase
      .from("resumes").select("*").eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setResumes(data || []);
  };

  const prefillProfile = async () => {
    const { data } = await supabase
      .from("profiles").select("*").eq("user_id", user!.id).single();
    if (data) {
      setFormData(prev => ({
        ...prev,
        name: data.full_name || prev.name,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
        college: data.college || prev.college,
        department: data.department || prev.department,
        skills: (data.skills || []).join(", ") || prev.skills,
      }));
    }
  };

  const fetchRealScores = async () => {
    if (!user) return;
    setLoadingScores(true);
    try {
      const [codingRes, aptitudeRes, interviewRes] = await Promise.all([
        supabase.from("coding_submissions").select("score").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("aptitude_sessions").select("score").eq("user_id", user.id).eq("status", "completed").order("created_at", { ascending: false }).limit(5),
        supabase.from("interview_sessions").select("overall_score").eq("user_id", user.id).eq("status", "completed").order("created_at", { ascending: false }).limit(5),
      ]);
      const codingScores = (codingRes.data || []).map(s => s.score || 0);
      const aptitudeScores = (aptitudeRes.data || []).map(s => s.score || 0);
      const interviewScores = (interviewRes.data || []).map(s => s.overall_score || 0);
      const bestCoding = codingScores.length ? Math.max(...codingScores) : 0;
      const bestAptitude = aptitudeScores.length ? Math.max(...aptitudeScores) : 0;
      const bestInterview = interviewScores.length ? Math.max(...interviewScores) : 0;
      const status = computeStatus(bestCoding, bestAptitude, bestInterview);
      setFormData(prev => ({
        ...prev,
        codingScore: bestCoding,
        aptitudeScore: bestAptitude,
        interviewScore: bestInterview,
        finalStatus: status,
        interviewDate: interviewRes.data?.[0] ? new Date().toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN"),
        candidateId: prev.candidateId || generateCandidateId(prev.name),
      }));
    } finally {
      setLoadingScores(false);
    }
  };

  const updateField = (key: keyof ResumeData, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [key]: value };
      // recompute status if scores change
      if (key === "codingScore" || key === "aptitudeScore" || key === "interviewScore") {
        updated.finalStatus = computeStatus(
          Number(key === "codingScore" ? value : prev.codingScore),
          Number(key === "aptitudeScore" ? value : prev.aptitudeScore),
          Number(key === "interviewScore" ? value : prev.interviewScore),
        );
      }
      if (key === "name" && !prev.candidateId) {
        updated.candidateId = generateCandidateId(String(value));
      }
      return updated;
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Photo too large", description: "Max 2MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setPhotoPreview(base64);
      setFormData(prev => ({ ...prev, photoBase64: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleAiSuggest = async () => {
    if (!formData.domain) return;
    setAiLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ action: "suggest", resumeData: formData }),
      });
      if (!response.ok) throw new Error("AI request failed");
      const data = await response.json();
      if (data.summary) updateField("summary", data.summary);
      if (data.skills) updateField("skills", data.skills);
      if (data.programmingLanguages) updateField("programmingLanguages", data.programmingLanguages);
      toast({ title: "✨ AI suggestions applied for " + formData.domain + "!" });
    } catch (err: any) {
      toast({ title: "AI suggestion failed", description: err.message, variant: "destructive" });
    }
    setAiLoading(false);
  };

  const handleSaveResume = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (!formData.candidateId) {
        formData.candidateId = generateCandidateId(formData.name);
      }
      const { error } = await supabase.from("resumes").insert({
        user_id: user.id,
        title: formData.name ? `${formData.name}'s Resume` : "My Resume",
        resume_data: formData as any,
      });
      if (error) throw error;
      toast({ title: "Resume saved!" });
      fetchResumes();
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("resumes").upload(filePath, file);
      if (uploadErr) throw uploadErr;
      await supabase.from("resumes").insert({
        user_id: user.id, title: file.name, file_url: filePath, file_name: file.name,
      });
      toast({ title: "Resume uploaded!" });
      fetchResumes();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleDeleteResume = async (id: string) => {
    await supabase.from("resumes").delete().eq("id", id);
    setResumes(prev => prev.filter(r => r.id !== id));
    toast({ title: "Resume deleted" });
  };

  const handleDownloadResume = (resumeData: any) => {
    const d = resumeData as ResumeData;
    // Build rich HTML for printing as PDF
    const statusColor = d.finalStatus === "Eligible" ? "#22c55e" : d.finalStatus === "Needs Improvement" ? "#f59e0b" : "#ef4444";
    const avgScore = Math.round(((d.codingScore || 0) + (d.aptitudeScore || 0) + (d.interviewScore || 0)) / 3);

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${d.name} - Resume</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b;font-size:13px;line-height:1.5;}
  .page{max-width:800px;margin:0 auto;background:#fff;box-shadow:0 0 40px rgba(0,0,0,0.1);}
  
  /* Header */
  .header{background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0d2137 100%);padding:36px 40px;display:flex;align-items:center;gap:28px;}
  .photo-wrap{width:100px;height:100px;border-radius:50%;border:3px solid #22d3ee;overflow:hidden;flex-shrink:0;background:#1e293b;display:flex;align-items:center;justify-content:center;}
  .photo-wrap img{width:100%;height:100%;object-fit:cover;}
  .photo-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:36px;color:#94a3b8;}
  .header-info{flex:1;}
  .name{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;color:#fff;margin-bottom:4px;}
  .subtitle{color:#22d3ee;font-size:13px;font-weight:500;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;}
  .contact-row{display:flex;flex-wrap:wrap;gap:16px;}
  .contact-item{color:#94a3b8;font-size:12px;}
  .contact-item span{color:#e2e8f0;}
  
  /* Status badge */
  .status-badge{margin-left:auto;text-align:center;flex-shrink:0;}
  .status-chip{padding:8px 20px;border-radius:20px;font-weight:700;font-size:13px;display:inline-block;border:2px solid;}
  .score-ring{margin-top:8px;font-size:22px;font-weight:700;font-family:'Space Grotesk',sans-serif;color:#fff;}
  .score-label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;}
  
  /* Body */
  .body{display:grid;grid-template-columns:1fr 300px;gap:0;}
  .main-col{padding:28px 32px;border-right:1px solid #e2e8f0;}
  .side-col{padding:28px 24px;background:#f8fafc;}
  
  /* Sections */
  .section{margin-bottom:24px;}
  .section-title{font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#0ea5e9;border-bottom:2px solid #e0f2fe;padding-bottom:6px;margin-bottom:12px;}
  .summary-text{color:#475569;line-height:1.7;}
  
  /* Skills */
  .skills-wrap{display:flex;flex-wrap:wrap;gap:6px;}
  .skill-chip{background:#eff6ff;color:#1d4ed8;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:500;border:1px solid #bfdbfe;}
  .prog-chip{background:#f0fdf4;color:#15803d;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:500;border:1px solid #bbf7d0;}
  
  /* Scores */
  .score-table{width:100%;border-collapse:collapse;}
  .score-table td{padding:8px 6px;border-bottom:1px solid #e2e8f0;font-size:12px;}
  .score-table td:last-child{text-align:right;font-weight:600;}
  .score-bar{height:6px;border-radius:3px;background:#e2e8f0;margin-top:4px;overflow:hidden;}
  .score-fill{height:100%;border-radius:3px;}
  
  /* Projects */
  .project-item{margin-bottom:14px;padding:12px;background:#f8fafc;border-radius:8px;border-left:3px solid #0ea5e9;}
  .project-title{font-weight:600;color:#1e293b;margin-bottom:4px;}
  .project-desc{color:#475569;font-size:12px;}
  
  /* Experience & Education */
  .exp-item{margin-bottom:14px;}
  .exp-title{font-weight:600;color:#1e293b;}
  .exp-desc{color:#475569;font-size:12px;margin-top:4px;white-space:pre-line;}
  
  /* Candidate info */
  .info-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #e2e8f0;font-size:12px;}
  .info-label{color:#64748b;font-weight:500;}
  .info-value{color:#1e293b;font-weight:600;text-align:right;}
  
  /* Footer */
  .footer{background:#0f172a;padding:14px 40px;display:flex;justify-content:space-between;align-items:center;}
  .footer-brand{color:#22d3ee;font-size:11px;font-weight:600;letter-spacing:1px;}
  .footer-id{color:#64748b;font-size:10px;font-family:monospace;}
  
  @media print{body{background:#fff;}.page{box-shadow:none;max-width:100%;}}
</style>
</head>
<body>
<div class="page">
  <!-- HEADER -->
  <div class="header">
    <div class="photo-wrap">
      ${d.photoBase64
        ? `<img src="${d.photoBase64}" alt="photo"/>`
        : `<div class="photo-placeholder">👤</div>`}
    </div>
    <div class="header-info">
      <div class="name">${d.name || "Candidate Name"}</div>
      <div class="subtitle">${d.domain || "Technology"} Professional</div>
      <div class="contact-row">
        ${d.email ? `<div class="contact-item">📧 <span>${d.email}</span></div>` : ""}
        ${d.phone ? `<div class="contact-item">📱 <span>${d.phone}</span></div>` : ""}
        ${d.college ? `<div class="contact-item">🏫 <span>${d.college}</span></div>` : ""}
        ${d.department ? `<div class="contact-item">📚 <span>${d.department}</span></div>` : ""}
      </div>
    </div>
    <div class="status-badge">
      <div class="status-chip" style="color:${statusColor};border-color:${statusColor};background:${statusColor}18;">
        ${d.finalStatus || "Pending"}
      </div>
      <div class="score-ring">${avgScore}%</div>
      <div class="score-label">Avg Score</div>
    </div>
  </div>
  
  <!-- BODY -->
  <div class="body">
    <!-- MAIN COLUMN -->
    <div class="main-col">
      ${d.summary ? `
      <div class="section">
        <div class="section-title">Professional Summary</div>
        <p class="summary-text">${d.summary}</p>
      </div>` : ""}
      
      ${d.skills ? `
      <div class="section">
        <div class="section-title">Technical Skills</div>
        <div class="skills-wrap">
          ${d.skills.split(",").map(s => `<span class="skill-chip">${s.trim()}</span>`).join("")}
        </div>
      </div>` : ""}
      
      ${d.programmingLanguages ? `
      <div class="section">
        <div class="section-title">Programming Languages</div>
        <div class="skills-wrap">
          ${d.programmingLanguages.split(",").map(s => `<span class="prog-chip">${s.trim()}</span>`).join("")}
        </div>
      </div>` : ""}
      
      ${d.projects ? `
      <div class="section">
        <div class="section-title">Projects</div>
        ${d.projects.split("\n\n").filter(Boolean).map(proj => {
          const lines = proj.split("\n");
          const title = lines[0] || "Project";
          const desc = lines.slice(1).join(" ");
          return `<div class="project-item"><div class="project-title">${title}</div>${desc ? `<div class="project-desc">${desc}</div>` : ""}</div>`;
        }).join("")}
      </div>` : ""}
      
      ${d.experience ? `
      <div class="section">
        <div class="section-title">Experience</div>
        <div class="exp-item"><div class="exp-desc">${d.experience}</div></div>
      </div>` : ""}
      
      ${d.education ? `
      <div class="section">
        <div class="section-title">Education</div>
        <div class="exp-item"><div class="exp-desc">${d.education}</div></div>
      </div>` : ""}
    </div>
    
    <!-- SIDE COLUMN -->
    <div class="side-col">
      <!-- Platform Scores -->
      <div class="section">
        <div class="section-title">Platform Scores</div>
        <table class="score-table">
          <tr>
            <td>💻 Coding Test</td>
            <td>
              ${d.codingScore ?? 0}/100
              <div class="score-bar"><div class="score-fill" style="width:${d.codingScore ?? 0}%;background:#0ea5e9;"></div></div>
            </td>
          </tr>
          <tr>
            <td>🧠 Aptitude</td>
            <td>
              ${d.aptitudeScore ?? 0}/100
              <div class="score-bar"><div class="score-fill" style="width:${d.aptitudeScore ?? 0}%;background:#8b5cf6;"></div></div>
            </td>
          </tr>
          <tr>
            <td>🎤 Interview</td>
            <td>
              ${d.interviewScore ?? 0}/100
              <div class="score-bar"><div class="score-fill" style="width:${d.interviewScore ?? 0}%;background:#22c55e;"></div></div>
            </td>
          </tr>
        </table>
      </div>
      
      <!-- Candidate Info -->
      <div class="section">
        <div class="section-title">Candidate Details</div>
        ${d.registerNumber ? `<div class="info-row"><span class="info-label">Reg. No.</span><span class="info-value">${d.registerNumber}</span></div>` : ""}
        <div class="info-row"><span class="info-label">Domain</span><span class="info-value">${d.domain || "-"}</span></div>
        <div class="info-row"><span class="info-label">Interview Date</span><span class="info-value">${d.interviewDate || new Date().toLocaleDateString("en-IN")}</span></div>
        <div class="info-row"><span class="info-label">Overall Status</span><span class="info-value" style="color:${statusColor};">${d.finalStatus || "Pending"}</span></div>
        <div class="info-row"><span class="info-label">Candidate ID</span><span class="info-value" style="font-family:monospace;font-size:11px;">${d.candidateId || "-"}</span></div>
      </div>
      
      <!-- Verification -->
      <div style="margin-top:16px;padding:14px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:10px;border:1px solid #334155;">
        <div style="color:#22d3ee;font-size:11px;font-weight:700;letter-spacing:1px;margin-bottom:8px;">✅ VERIFIED BY HIREREADY AI</div>
        <div style="color:#94a3b8;font-size:10px;line-height:1.6;">This candidate has completed the HireReady AI placement assessment. Scores are auto-generated and verified by the platform.</div>
      </div>
    </div>
  </div>
  
  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-brand">⚡ HIREREADY AI — Placement Intelligence Platform</div>
    <div class="footer-id">ID: ${d.candidateId || "PENDING"} | Generated: ${new Date().toLocaleDateString("en-IN")}</div>
  </div>
</div>
<script>window.onload=()=>window.print();</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Tab Switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("build")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "build" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
          >
            <FileText className="h-4 w-4 inline mr-2" />Build Resume
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "upload" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
          >
            <Upload className="h-4 w-4 inline mr-2" />Upload Resume
          </button>
        </div>

        {activeTab === "build" && (
          <div className="glass-card p-6 space-y-5">
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl font-display font-bold text-foreground">Resume Builder</h2>
              <div className="flex gap-2">
                {loadingScores && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Loading scores…</span>}
                <Button onClick={handleAiSuggest} disabled={aiLoading} variant="outline" size="sm" className="border-primary/30 text-primary">
                  <Sparkles className="h-4 w-4 mr-1" />{aiLoading ? "Generating…" : "AI Suggestions"}
                </Button>
              </div>
            </div>

            {/* Photo + Domain row */}
            <div className="flex items-start gap-6 flex-wrap">
              {/* Photo upload */}
              <div className="flex flex-col items-center gap-2">
                <div
                  onClick={() => photoRef.current?.click()}
                  className="w-24 h-24 rounded-full border-2 border-dashed border-primary/40 bg-secondary flex items-center justify-center cursor-pointer hover:border-primary transition-all overflow-hidden"
                >
                  {photoPreview
                    ? <img src={photoPreview} alt="photo" className="w-full h-full object-cover" />
                    : <Camera className="h-8 w-8 text-muted-foreground" />}
                </div>
                <span className="text-xs text-muted-foreground">Profile Photo</span>
                <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>

              {/* Domain selector */}
              <div className="flex-1 min-w-[200px]">
                <Label className="text-foreground text-xs mb-1 block">Domain / Specialization</Label>
                <Select value={formData.domain} onValueChange={v => updateField("domain", v)}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">AI suggestions will be tailored to this domain</p>
              </div>
            </div>

            {/* Personal info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label className="text-foreground text-xs">Full Name</Label><Input value={formData.name} onChange={e => updateField("name", e.target.value)} className="mt-1 bg-secondary border-border text-foreground" placeholder="Your full name" /></div>
                <div><Label className="text-foreground text-xs">Register Number</Label><Input value={formData.registerNumber} onChange={e => updateField("registerNumber", e.target.value)} className="mt-1 bg-secondary border-border text-foreground" placeholder="e.g. 22CS001" /></div>
                <div><Label className="text-foreground text-xs">Email</Label><Input value={formData.email} onChange={e => updateField("email", e.target.value)} className="mt-1 bg-secondary border-border text-foreground" /></div>
                <div><Label className="text-foreground text-xs">Phone</Label><Input value={formData.phone} onChange={e => updateField("phone", e.target.value)} className="mt-1 bg-secondary border-border text-foreground" /></div>
                <div><Label className="text-foreground text-xs">College</Label><Input value={formData.college} onChange={e => updateField("college", e.target.value)} className="mt-1 bg-secondary border-border text-foreground" /></div>
                <div><Label className="text-foreground text-xs">Department</Label><Input value={formData.department} onChange={e => updateField("department", e.target.value)} className="mt-1 bg-secondary border-border text-foreground" /></div>
              </div>
            </div>

            {/* AI-populated fields */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Professional Content</h3>
              </div>
              <div className="space-y-3">
                <div><Label className="text-foreground text-xs">Professional Summary</Label><Textarea value={formData.summary} onChange={e => updateField("summary", e.target.value)} rows={3} className="mt-1 bg-secondary border-border text-foreground" placeholder="Click AI Suggestions to auto-generate based on your domain…" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label className="text-foreground text-xs">Technical Skills (comma-separated)</Label><Input value={formData.skills} onChange={e => updateField("skills", e.target.value)} className="mt-1 bg-secondary border-border text-foreground" placeholder="React, Node.js, SQL…" /></div>
                  <div><Label className="text-foreground text-xs">Programming Languages (comma-separated)</Label><Input value={formData.programmingLanguages} onChange={e => updateField("programmingLanguages", e.target.value)} className="mt-1 bg-secondary border-border text-foreground" placeholder="Python, C++, JavaScript…" /></div>
                </div>
              </div>
            </div>

            {/* Projects / Education / Experience */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Code2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Academic & Projects</h3>
              </div>
              <div className="space-y-3">
                <div><Label className="text-foreground text-xs">Projects (separate each by blank line; first line = title)</Label><Textarea value={formData.projects} onChange={e => updateField("projects", e.target.value)} rows={4} className="mt-1 bg-secondary border-border text-foreground" placeholder={"Smart Attendance System\nFace recognition attendance using Python & OpenCV\n\nPortfolio Website\nReact.js, TailwindCSS, deployed on Vercel"} /></div>
                <div><Label className="text-foreground text-xs">Education</Label><Textarea value={formData.education} onChange={e => updateField("education", e.target.value)} rows={2} className="mt-1 bg-secondary border-border text-foreground" /></div>
                <div><Label className="text-foreground text-xs">Experience / Internships</Label><Textarea value={formData.experience} onChange={e => updateField("experience", e.target.value)} rows={2} className="mt-1 bg-secondary border-border text-foreground" /></div>
              </div>
            </div>

            {/* Platform Scores (read from backend) */}
            <div className="glass-card bg-muted/30 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Platform Assessment Scores</h3>
                <span className="text-xs text-muted-foreground">(auto-fetched from your activity)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { key: "codingScore" as const, label: "Coding Test", icon: "💻", color: "text-info" },
                  { key: "aptitudeScore" as const, label: "Aptitude", icon: "🧠", color: "text-accent" },
                  { key: "interviewScore" as const, label: "Interview", icon: "🎤", color: "text-success" },
                ].map(({ key, label, icon, color }) => (
                  <div key={key} className="text-center">
                    <span className="text-2xl">{icon}</span>
                    <p className={`text-xl font-bold ${color}`}>{formData[key] ?? 0}<span className="text-sm text-muted-foreground">/100</span></p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-center">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  formData.finalStatus === "Eligible" ? "bg-success/20 text-success" :
                  formData.finalStatus === "Needs Improvement" ? "bg-warning/20 text-warning" :
                  "bg-destructive/20 text-destructive"
                }`}>
                  <Star className="h-3 w-3 inline mr-1" />
                  Final Status: {formData.finalStatus || "Pending"}
                </span>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleSaveResume} disabled={saving} className="gradient-bg text-primary-foreground">
                <Save className="h-4 w-4 mr-2" />{saving ? "Saving…" : "Save Resume"}
              </Button>
              {formData.name && (
                <Button onClick={() => handleDownloadResume(formData)} variant="outline" className="border-primary/30 text-primary">
                  <Download className="h-4 w-4 mr-2" />Preview & Download PDF
                </Button>
              )}
            </div>
          </div>
        )}

        {activeTab === "upload" && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-display font-bold text-foreground mb-4">Upload Resume</h2>
            <div className="border-2 border-dashed border-border rounded-xl p-10 text-center">
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Upload your existing resume (PDF or DOCX)</p>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" onChange={handleUploadFile} className="hidden" />
              <Button onClick={() => fileRef.current?.click()} disabled={uploading} variant="outline" className="border-primary/30 text-primary">
                {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</> : "Choose File"}
              </Button>
            </div>
          </div>
        )}

        {/* Saved Resumes */}
        {resumes.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">Your Saved Resumes</h3>
            <div className="space-y-3">
              {resumes.map(r => (
                <div key={r.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {r.resume_data && (
                      <Button size="sm" variant="ghost" onClick={() => handleDownloadResume(r.resume_data)} className="text-primary hover:text-primary">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteResume(r.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
