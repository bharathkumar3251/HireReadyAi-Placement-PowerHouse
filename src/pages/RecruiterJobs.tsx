import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Briefcase, Trash2 } from "lucide-react";

export default function RecruiterJobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", company: "", description: "", location: "", salary_range: "", requirements: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("job_listings").select("*").eq("recruiter_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setJobs(data || []));
  }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    const { error } = await supabase.from("job_listings").insert({
      recruiter_id: user.id,
      title: form.title,
      company: form.company,
      description: form.description,
      location: form.location,
      salary_range: form.salary_range,
      requirements: form.requirements.split(",").map(s => s.trim()).filter(Boolean),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Job listing created!" });
      setShowForm(false);
      setForm({ title: "", company: "", description: "", location: "", salary_range: "", requirements: "" });
      const { data } = await supabase.from("job_listings").select("*").eq("recruiter_id", user.id).order("created_at", { ascending: false });
      setJobs(data || []);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("job_listings").delete().eq("id", id);
    setJobs(prev => prev.filter(j => j.id !== id));
    toast({ title: "Job deleted" });
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-foreground">Job Listings</h2>
          <Button onClick={() => setShowForm(!showForm)} className="gradient-bg text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />Post Job
          </Button>
        </div>

        {showForm && (
          <div className="glass-card p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="text-foreground">Job Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1 bg-secondary border-border text-foreground" /></div>
              <div><Label className="text-foreground">Company</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="mt-1 bg-secondary border-border text-foreground" /></div>
              <div><Label className="text-foreground">Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="mt-1 bg-secondary border-border text-foreground" /></div>
              <div><Label className="text-foreground">Salary Range</Label><Input value={form.salary_range} onChange={e => setForm(f => ({ ...f, salary_range: e.target.value }))} className="mt-1 bg-secondary border-border text-foreground" /></div>
            </div>
            <div><Label className="text-foreground">Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 bg-secondary border-border text-foreground" /></div>
            <div><Label className="text-foreground">Requirements (comma-separated)</Label><Input value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} className="mt-1 bg-secondary border-border text-foreground" /></div>
            <Button onClick={handleCreate} className="gradient-bg text-primary-foreground">Create Listing</Button>
          </div>
        )}

        <div className="space-y-4">
          {jobs.map(j => (
            <div key={j.id} className="glass-card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Briefcase className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="font-semibold text-foreground">{j.title}</p>
                    <p className="text-sm text-muted-foreground">{j.company} • {j.location || "Remote"}</p>
                    {j.description && <p className="text-sm text-muted-foreground mt-2">{j.description}</p>}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(j.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          {jobs.length === 0 && <p className="text-muted-foreground text-center py-10">No job listings yet.</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
