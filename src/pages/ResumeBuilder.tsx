import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Save, Sparkles, Download, Trash2 } from "lucide-react";
import { useEffect } from "react";

interface ResumeData {
  name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
  projects: string;
}

export default function ResumeBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"build" | "upload">("build");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumes, setResumes] = useState<any[]>([]);
  const [formData, setFormData] = useState<ResumeData>({
    name: "", email: "", phone: "", summary: "", skills: "", experience: "", education: "", projects: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("resumes").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setResumes(data || []));
  }, [user]);

  const updateField = (key: keyof ResumeData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveResume = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("resumes").insert({
        user_id: user.id,
        title: formData.name ? `${formData.name}'s Resume` : "My Resume",
        resume_data: formData as any,
      });
      if (error) throw error;
      toast({ title: "Resume saved!" });
      // Refresh list
      const { data } = await supabase.from("resumes").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setResumes(data || []);
    } catch (err: any) {
      toast({ title: "Error saving resume", description: err.message, variant: "destructive" });
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

      const { data: { publicUrl } } = supabase.storage.from("resumes").getPublicUrl(filePath);

      await supabase.from("resumes").insert({
        user_id: user.id,
        title: file.name,
        file_url: filePath,
        file_name: file.name,
      });

      toast({ title: "Resume uploaded!" });
      const { data } = await supabase.from("resumes").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setResumes(data || []);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleAiSuggest = async () => {
    if (!user) return;
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
      toast({ title: "AI suggestions applied!" });
    } catch (err: any) {
      toast({ title: "AI suggestion failed", description: err.message, variant: "destructive" });
    }
    setAiLoading(false);
  };

  const handleDeleteResume = async (id: string) => {
    await supabase.from("resumes").delete().eq("id", id);
    setResumes(prev => prev.filter(r => r.id !== id));
    toast({ title: "Resume deleted" });
  };

  const handleDownloadResume = (resumeData: any) => {
    const d = resumeData as ResumeData;
    const text = `${d.name}\n${d.email} | ${d.phone}\n\nSummary\n${d.summary}\n\nSkills\n${d.skills}\n\nExperience\n${d.experience}\n\nEducation\n${d.education}\n\nProjects\n${d.projects}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.txt";
    a.click();
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
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-foreground">Resume Builder</h2>
              <Button onClick={handleAiSuggest} disabled={aiLoading} variant="outline" className="border-primary/30 text-primary">
                <Sparkles className="h-4 w-4 mr-2" />{aiLoading ? "Generating..." : "AI Suggestions"}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="text-foreground">Full Name</Label><Input value={formData.name} onChange={e => updateField("name", e.target.value)} className="mt-1 bg-secondary border-border text-foreground" /></div>
              <div><Label className="text-foreground">Email</Label><Input value={formData.email} onChange={e => updateField("email", e.target.value)} className="mt-1 bg-secondary border-border text-foreground" /></div>
              <div><Label className="text-foreground">Phone</Label><Input value={formData.phone} onChange={e => updateField("phone", e.target.value)} className="mt-1 bg-secondary border-border text-foreground" /></div>
              <div><Label className="text-foreground">Skills (comma-separated)</Label><Input value={formData.skills} onChange={e => updateField("skills", e.target.value)} className="mt-1 bg-secondary border-border text-foreground" /></div>
            </div>
            <div><Label className="text-foreground">Professional Summary</Label><Textarea value={formData.summary} onChange={e => updateField("summary", e.target.value)} rows={3} className="mt-1 bg-secondary border-border text-foreground" /></div>
            <div><Label className="text-foreground">Experience</Label><Textarea value={formData.experience} onChange={e => updateField("experience", e.target.value)} rows={4} className="mt-1 bg-secondary border-border text-foreground" /></div>
            <div><Label className="text-foreground">Education</Label><Textarea value={formData.education} onChange={e => updateField("education", e.target.value)} rows={3} className="mt-1 bg-secondary border-border text-foreground" /></div>
            <div><Label className="text-foreground">Projects</Label><Textarea value={formData.projects} onChange={e => updateField("projects", e.target.value)} rows={3} className="mt-1 bg-secondary border-border text-foreground" /></div>
            <Button onClick={handleSaveResume} disabled={saving} className="gradient-bg text-primary-foreground">
              <Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save Resume"}
            </Button>
          </div>
        )}

        {activeTab === "upload" && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-display font-bold text-foreground mb-4">Upload Resume</h2>
            <div className="border-2 border-dashed border-border rounded-xl p-10 text-center">
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Upload your resume (PDF or DOCX)</p>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" onChange={handleUploadFile} className="hidden" />
              <Button onClick={() => fileRef.current?.click()} disabled={uploading} variant="outline" className="border-primary/30 text-primary">
                {uploading ? "Uploading..." : "Choose File"}
              </Button>
            </div>
          </div>
        )}

        {/* Saved Resumes */}
        {resumes.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">Your Resumes</h3>
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
                      <Button size="sm" variant="ghost" onClick={() => handleDownloadResume(r.resume_data)}>
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
